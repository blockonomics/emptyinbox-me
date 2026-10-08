from flask import request, jsonify
from config import app,db
from db_models import Message, Inbox, User
from email.parser import Parser
from datetime import datetime, timedelta
from uuid import uuid4
from functools import wraps
from flask import abort
import time
import os
import json
import random
import re
import sqlite3
import logging
from words import adjectives, nouns
from auth_utils import auth_required, get_api_key_from_token
from constants import purchase_block, FREE_INBOX_DAYS, KEEP_INBOX_CREDITS, SITE_URL, QUOTA_PER_USDT
import message_parse

FLASK_ENV = os.getenv('FLASK_ENV', 'production')
IS_DEV = FLASK_ENV == 'development'
url_prefix = '/api' if IS_DEV else ''

# Allow CORS for development
if IS_DEV:
    from flask_cors import CORS
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:8000", "http://localhost:8080", "http://localhost:5173", "null"]
    )


if __name__ != '__main__':
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

# Import blueprints
from auth import auth_bp
from payments import payments_bp, quota_for_usd
from feedback import feedback_bp

DOMAIN = os.getenv('DOMAIN')

app.register_blueprint(auth_bp, url_prefix=url_prefix + '/auth')
app.register_blueprint(payments_bp, url_prefix=url_prefix + '/payments')
app.register_blueprint(feedback_bp, url_prefix=url_prefix + '/feedback')

MAX_MESSAGE_LIMIT = 200
DEFAULT_MESSAGE_LIMIT = 50


def decode_content(blob):
    '''The stored blob as a dict, or None when it can't be read.'''
    if not blob:
        return {}
    try:
        return json.loads(blob.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
        return None


def bool_arg(name, default=True):
    raw = request.args.get(name)
    if raw is None:
        return default
    return raw.strip().lower() not in ('0', 'false', 'no', 'off')


def int_arg(name, default=None, minimum=None, maximum=None):
    raw = request.args.get(name)
    if raw is None or raw == '':
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    if minimum is not None:
        value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value


@app.route(f'{url_prefix}/health', methods=['GET'])
def health():
    '''Whether the service can write, not just whether it answers.

    Reads keep working when the database is not writable, so the site looks up
    while every signup, inbox and inbound email fails. That went unnoticed for
    days once, with gunicorn running as a user that could not write the file.
    A fresh connection is opened each time because SQLite silently falls back
    to read-only when it cannot open for writing, and a pooled connection would
    hide that; mode=rw turns the fallback into an error instead. BEGIN IMMEDIATE
    takes the write lock, catching a writer that is stuck holding it, and the
    directory check covers the journal file SQLite creates beside the database.'''
    db_path = db.engine.url.database
    try:
        if not os.access(os.path.dirname(db_path), os.W_OK):
            raise PermissionError('database directory is not writable')
        conn = sqlite3.connect(f'file:{db_path}?mode=rw', uri=True, timeout=2,
                               isolation_level=None)
        try:
            conn.execute('BEGIN IMMEDIATE')
            conn.execute('ROLLBACK')
        finally:
            conn.close()
    except Exception as e:
        app.logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'error', 'db': 'not_writable'}), 503
    return jsonify({'status': 'ok', 'db': 'writable'}), 200


@app.route(f'{url_prefix}/messages', methods=['GET'])
@auth_required
def get_messages(token):
    '''List messages newest first, already parsed into code/links/text.

    Filters (inbox, since, limit) run in SQL rather than in the caller, so an
    agent polling for one verification email doesn't have to pull down every
    message it has ever received to find it.
    '''
    api_key = get_api_key_from_token(token)
    include_body = bool_arg('include_body', True)
    limit = int_arg('limit', DEFAULT_MESSAGE_LIMIT, minimum=1, maximum=MAX_MESSAGE_LIMIT)
    since = int_arg('since')
    inbox_filter = request.args.get('inbox')

    query = db.session.query(
        Message.id,
        Message.inbox,
        Message.subject,
        Message.content,
        Message.timestamp
    ).join(
        Inbox, Message.inbox == Inbox.inbox
    ).filter(
        Inbox.api_key == api_key
    )

    if inbox_filter:
        query = query.filter(Message.inbox == inbox_filter)
    if since is not None:
        query = query.filter(Message.timestamp > since)

    rows = query.order_by(Message.timestamp.desc()).limit(limit).all()

    result_messages = []
    for row in rows:
        content_json = decode_content(row.content)
        if content_json is None:
            # Malformed blob: still list the message so the id stays reachable.
            result_messages.append(message_parse.normalize(
                row.id, row.inbox, row.subject, row.timestamp, {}, include_body
            ))
            continue
        result_messages.append(message_parse.normalize(
            row.id, row.inbox, row.subject, row.timestamp, content_json, include_body
        ))

    return result_messages

@app.route(f'{url_prefix}/message/<msgid>', methods=['GET'])
@auth_required
def get_message(token, msgid):
    '''One message. `format=json` (default), `text` for a flat prompt-ready
    rendering, or `raw` for the untouched stored MIME parts.'''
    api_key = get_api_key_from_token(token)
    row = db.session.query(
        Message.id,
        Message.inbox,
        Message.subject,
        Message.content,
        Message.timestamp
    ).join(
        Inbox, Message.inbox == Inbox.inbox
    ).filter(
        Inbox.api_key == api_key
    ).filter(
        Message.id == msgid
    ).first()

    if not row:
        return jsonify({'error': 'not_found', 'message': "msgid doesn't exist"}), 404

    fmt = (request.args.get('format') or 'json').lower()
    if fmt == 'raw':
        return row.content or b'{}', 200, {'Content-Type': 'application/json'}

    content_json = decode_content(row.content)
    if content_json is None:
        return jsonify({'error': 'unreadable_content', 'id': row.id}), 500

    message = message_parse.normalize(
        row.id, row.inbox, row.subject, row.timestamp, content_json,
        include_headers=True
    )

    if fmt == 'text':
        return message_parse.to_plain_text(message), 200, {
            'Content-Type': 'text/plain; charset=utf-8'
        }

    return jsonify(message), 200

def get_mailboxname():
    adjective_part = '.'.join(random.choices(adjectives, k=2))
    noun = random.choice(nouns)
    return f'{adjective_part}.{noun}'

def unused_address():
    '''An address no account has ever held.

    The name space is about two million, so by a few thousand inboxes a random
    draw starts landing on taken names. Without this check two keys could hold
    one address and both read its mail, since messages are matched on the
    address alone. Expired rows count as taken: an address that once received
    someone's password resets must never be handed to anyone else.'''
    for _ in range(20):
        candidate = f'{get_mailboxname()}@{DOMAIN}'
        if not db.session.query(Inbox.inbox).filter(Inbox.inbox == candidate).first():
            return candidate
    return None

def keep_info(address):
    return {
        'keep_cost_credits': KEEP_INBOX_CREDITS,
        'keep_url': f'{SITE_URL}/api/inbox/{address}/keep',
    }

def consume_quota(api_key):
    """Spend one inbox credit, returning False if there were none left.

    The check and the decrement have to be a single statement. Split in two,
    concurrent requests both read a positive balance and both decrement it,
    driving the quota negative and handing out inboxes nobody paid for."""
    spent = db.session.query(User).filter(
        User.api_key == api_key,
        User.inbox_quota > 0,
    ).update({"inbox_quota": User.inbox_quota - 1}, synchronize_session=False)
    return spent > 0

def record_quota_block(api_key):
    """Note that this account asked for an inbox it could not afford.

    Counted rather than stamped alone, because how many times an account came
    back and hit the wall says more about intent than the fact it happened
    once. Failure here is swallowed: losing a funnel datapoint must never turn
    into a failed API call for the user."""
    try:
        db.session.query(User).filter(User.api_key == api_key).update(
            {
                "quota_blocks": User.quota_blocks + 1,
                "last_quota_block_at": datetime.utcnow(),
            },
            synchronize_session=False,
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Could not record quota block: {e}")


@app.route(f'{url_prefix}/inbox', methods=['POST']) 
@auth_required
def create_mailbox(token):
    '''Creates new inbox'''
    api_key = get_api_key_from_token(token)
    if not consume_quota(api_key):
        # Hitting the paywall is the only moment a free account states that it
        # wants something it has to pay for, so it is worth recording. Without
        # this the accounts table cannot distinguish an account that ran out
        # and stopped from one that never tried.
        record_quota_block(api_key)
        # 402 so an agent can tell "out of quota, here is how to buy more"
        # apart from "not allowed". The body is written for the developer who
        # reads it in the agent's log, not for the agent: absolute links,
        # prices inline, and the reuse note first, because every account that
        # has hit this so far did so with free credits left on a sibling key.
        body = {
            'error': 'insufficient_quota',
            'message': (
                'Inbox quota exhausted on this API key. Reuse another key you '
                'hold with credits left, or buy more with Bitcoin.'
            ),
        }
        body.update(purchase_block())
        return jsonify(body), 402
    email_address = unused_address()
    if not email_address:
        db.session.rollback()
        return jsonify({'error': 'address_unavailable',
                        'message': 'Could not allocate a free address. Retry.'}), 503
    # The credit was spent above and is committed with the inbox it paid for,
    # so a failed insert takes the decrement down with it.
    inbox = Inbox(api_key=api_key, inbox=email_address,
                  expires_at=datetime.utcnow() + timedelta(days=FREE_INBOX_DAYS))
    db.session.add(inbox)
    db.session.commit()

    # Plain text stays the default body: every client written so far reads the
    # address straight off it. The expiry rides in headers for those, and in
    # full under format=json for clients that want to tell their user.
    if (request.args.get('format') or '').lower() == 'json':
        body = inbox.to_dict()
        body.update(keep_info(email_address))
        body['note'] = (
            f'Expires in {FREE_INBOX_DAYS} days and then stops receiving mail. '
            f'If this address is used for an account the user will keep, keep it '
            f'permanently for {KEEP_INBOX_CREDITS} credits so password resets keep working.'
        )
        return jsonify(body), 201
    return email_address, 201, {
        'X-Inbox-Expires-At': inbox.to_dict()['expires_at'],
        'X-Keep-Cost-Credits': str(KEEP_INBOX_CREDITS),
    }

@app.route(f'{url_prefix}/inbox/<path:address>/keep', methods=['POST'])
@auth_required
def keep_mailbox(token, address):
    '''Make an inbox permanent for KEEP_INBOX_CREDITS credits.

    Works on an expired inbox too: the address was never reissued, so its
    owner can still bring it back. Keeping an inbox that is already permanent
    is a no-op and costs nothing, so a retried call never charges twice.'''
    api_key = get_api_key_from_token(token)
    inbox = db.session.execute(
        db.select(Inbox).filter(Inbox.api_key == api_key, Inbox.inbox == address)
    ).scalar_one_or_none()
    if not inbox:
        return jsonify({'error': 'not_found', 'message': 'No such inbox on this account.'}), 404
    if inbox.expires_at is None:
        return jsonify({**inbox.to_dict(), 'charged_credits': 0,
                        'message': 'Already permanent.'}), 200

    # Charge and keep in one transaction, with the balance check inside the
    # UPDATE, for the same reason consume_quota does it: two concurrent calls
    # must not both pass a read of the balance.
    spent = db.session.query(User).filter(
        User.api_key == api_key,
        User.inbox_quota >= KEEP_INBOX_CREDITS,
    ).update({'inbox_quota': User.inbox_quota - KEEP_INBOX_CREDITS}, synchronize_session=False)
    if not spent:
        db.session.rollback()
        record_quota_block(api_key)
        have = db.session.query(User.inbox_quota).filter(User.api_key == api_key).scalar() or 0
        body = {
            'error': 'insufficient_quota',
            'message': (
                f'Keeping an inbox costs {KEEP_INBOX_CREDITS} credits; this key has {have}. '
                'Buy credits with Bitcoin, then call this again.'
            ),
            'credits_needed': KEEP_INBOX_CREDITS,
            'credits_available': have,
        }
        body.update(purchase_block())
        # The bundle list leads with $1 = 10, which does not cover a keep. Name
        # the smallest purchase that does, so the agent does not buy short.
        short_by = KEEP_INBOX_CREDITS - have
        usd = -(-short_by // QUOTA_PER_USDT)
        body['suggested_purchase'] = {
            'usd': usd,
            'credits': quota_for_usd(usd),
            'how': f'POST {SITE_URL}/api/payments/quote with {{"usd": {usd}}}',
        }
        return jsonify(body), 402

    # Conditional on still being temporary: a concurrent keep that already won
    # must not be paid for twice.
    kept = db.session.query(Inbox).filter(
        Inbox.api_key == api_key, Inbox.inbox == address, Inbox.expires_at.isnot(None),
    ).update({'expires_at': None, 'kept_at': datetime.utcnow()}, synchronize_session=False)
    if not kept:
        db.session.rollback()
        db.session.refresh(inbox)
        return jsonify({**inbox.to_dict(), 'charged_credits': 0,
                        'message': 'Already permanent.'}), 200
    db.session.commit()
    db.session.refresh(inbox)
    remaining = db.session.query(User.inbox_quota).filter(User.api_key == api_key).scalar()
    return jsonify({**inbox.to_dict(), 'charged_credits': KEEP_INBOX_CREDITS,
                    'inbox_quota': remaining,
                    'message': 'Inbox is now permanent.'}), 200

@app.route(f'{url_prefix}/inboxes', methods=['GET']) 
@auth_required
def get_mailboxes(token):
    '''Get inboxes belonging to the authenticated user, ordered by newest first'''
    api_key = get_api_key_from_token(token)
    inboxes = db.session.execute(
        db.select(Inbox)
          .filter(Inbox.api_key == api_key)
          .order_by(Inbox.created_at.desc())
    ).scalars().all()

    return [inbox.to_dict() for inbox in inboxes]

def query_inbox(inbox):
    '''Whether this address should accept mail: it exists and has not expired.'''
    return db.session.execute(
        db.select(Inbox.inbox).filter(
            Inbox.inbox == inbox,
            db.or_(Inbox.expires_at.is_(None), Inbox.expires_at > datetime.utcnow()),
        )
    ).first()

@app.route('/email', methods=['POST'])
def create_email():
    email_data = request.json
    secret = (request.headers.get('Authorization') or '').split(' ')[-1]

    if secret != os.getenv('SECRET'):
       return '', 403
    for recipient in email_data['recipients']:
        if query_inbox(recipient):
            msg_id = str(uuid4()).replace('-', '')[:16]
            timestamp = int(time.time())
            subject = email_data.get("headers", {}).get("Subject")
            db.session.add(Message(id=msg_id, inbox=recipient, timestamp=timestamp, 
                                   subject = subject,
                                   content=json.dumps(email_data).encode()))
            db.session.commit()

    return '', 201

if __name__ == '__main__':
    app.run(port=5000, use_reloader=True)
