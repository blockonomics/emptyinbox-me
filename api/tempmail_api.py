from flask import request, jsonify
from config import app,db
from db_models import Message, Inbox, User
from email.parser import Parser
from datetime import datetime
from uuid import uuid4
from functools import wraps
from flask import abort
import time
import os
import json
import random
import re
import logging
from words import adjectives, nouns
from auth_utils import auth_required, get_api_key_from_token
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
from payments import payments_bp

DOMAIN = os.getenv('DOMAIN')

app.register_blueprint(auth_bp, url_prefix=url_prefix + '/auth')
app.register_blueprint(payments_bp, url_prefix=url_prefix + '/payments')

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
        # apart from "not allowed".
        return jsonify({
            'error': 'insufficient_quota',
            'message': 'Inbox quota exhausted. Buy more with Bitcoin.',
            'bundles_url': '/api/payments/bundles',
            'quote_url': '/api/payments/quote',
        }), 402
    email_address = f'{get_mailboxname()}@{DOMAIN}'
    # The credit was spent above and is committed with the inbox it paid for,
    # so a failed insert takes the decrement down with it.
    db.session.add(Inbox(api_key=api_key, inbox=email_address))
    db.session.commit()
    return email_address, 201

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

    result = [{
        'inbox': inbox.inbox,
        'created_at': inbox.created_at.isoformat(),
    } for inbox in inboxes]

    return result

def query_inbox(inbox):
    inbox = db.session.execute(db.select(Inbox).filter(Inbox.inbox==inbox)).first()
    return inbox

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
