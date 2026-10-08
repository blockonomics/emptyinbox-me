#!/usr/bin/env python3
"""Feedback tickets from agents and the developers behind them.

Most callers are programs, and a program that gives up leaves nothing behind:
two agents have requested a payment quote and never paid, and nothing in the
database can say why. This gives them somewhere to say it, at the moment they
are stuck, in their own words.

    python api/feedback.py              # tickets from the last 7 days
    python api/feedback.py --days 30

Everything a ticket carries is untrusted text written by an arbitrary caller.
It is stored and displayed, never acted on.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from uuid import uuid4
import json
import os
import threading
import requests

from config import db, app
from db_models import Feedback, User, UserSession
from constants import (
    FEEDBACK_CATEGORIES, FEEDBACK_MAX_MESSAGE, FEEDBACK_MIN_MESSAGE,
    FEEDBACK_MAX_CONTEXT, FEEDBACK_PER_IP_HOUR, FEEDBACK_DAILY_CAP,
)

feedback_bp = Blueprint('feedback', __name__)

# Optional Slack incoming webhook. A ticket nobody reads is worth nothing, and
# the database is only looked at when someone remembers to.
WEBHOOK_URL = os.getenv('FEEDBACK_WEBHOOK_URL')


def error_response(error: str, code: int = 400, **extra):
    body = {'error': error}
    body.update(extra)
    return jsonify(body), code


def caller_api_key():
    """The key behind the request, if it carries a valid one.

    Optional on purpose. The callers with the most to report include the ones
    whose registration was refused or whose key stopped working, and requiring
    auth would turn exactly those away. An invalid credential is ignored rather
    than rejected for the same reason."""
    token = request.headers.get('X-API-Key', '').strip()
    if not token:
        auth_header = request.headers.get('Authorization', '').strip()
        token = auth_header[7:].strip() if auth_header.startswith('Bearer ') else auth_header
    if not token:
        token = request.cookies.get('session_token', '')
    if not token:
        return None
    user = db.session.query(User).filter_by(api_key=token).first()
    if user:
        return user.api_key
    session = db.session.query(UserSession).filter_by(token=token).first()
    if session and session.expires_at > datetime.utcnow():
        return db.session.query(User.api_key).filter_by(user_id=session.user_id).scalar()
    return None


def short(value, limit):
    if value is None:
        return None
    return str(value).strip()[:limit] or None


def slack_escape(text: str) -> str:
    # Slack treats <...> as links and mentions; an untrusted ticket must not be
    # able to ping the channel.
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def notify(ticket: Feedback) -> None:
    if not WEBHOOK_URL:
        return
    who = 'anonymous' if not ticket.api_key else f'key …{ticket.api_key[-6:]}'
    lines = [
        f'*New feedback* `{ticket.id}` · {ticket.category} · {who} · {ticket.client or "unknown client"}',
    ]
    if ticket.tool:
        lines.append(f'tool: `{slack_escape(ticket.tool)}`')
    if ticket.error:
        lines.append(f'error: `{slack_escape(ticket.error[:300])}`')
    lines.append('>' + slack_escape(ticket.message[:1500]).replace('\n', '\n>'))
    payload = {'text': '\n'.join(lines)}

    def send():
        try:
            requests.post(WEBHOOK_URL, json=payload, timeout=5)
        except Exception as e:
            app.logger.error(f"Feedback webhook failed: {e}")

    # Off the request thread: a slow Slack must not make reporting a problem
    # look like another problem.
    threading.Thread(target=send, daemon=True).start()


@feedback_bp.route('', methods=['POST'])
def submit_feedback():
    from auth import client_ip  # deferred: auth pulls in the passkey stack

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response('invalid_body', 400,
                              message='Send a JSON object with at least "message".')

    message = data.get('message')
    message = message.strip() if isinstance(message, str) else ''
    if len(message) < FEEDBACK_MIN_MESSAGE:
        return error_response('message_required', 400,
                              message=f'"message" must be at least {FEEDBACK_MIN_MESSAGE} characters: '
                                      'what you were trying to do and what got in the way.')
    message = message[:FEEDBACK_MAX_MESSAGE]

    category = (data.get('category') or 'other')
    if category not in FEEDBACK_CATEGORIES:
        category = 'other'

    context = data.get('context')
    if context is not None:
        if not isinstance(context, dict):
            context = {'value': context}
        if len(json.dumps(context, default=str)) > FEEDBACK_MAX_CONTEXT:
            context = {'truncated': True}

    ip = client_ip()
    now = datetime.utcnow()
    recent = db.session.query(Feedback).filter(
        Feedback.ip == ip, Feedback.created_at > now - timedelta(hours=1),
    ).count()
    if recent >= FEEDBACK_PER_IP_HOUR:
        return error_response('rate_limited', 429,
                              message='Too many reports from this address in the last hour. Try again later.')
    today = db.session.query(Feedback).filter(
        Feedback.created_at > now - timedelta(days=1),
    ).count()
    if today >= FEEDBACK_DAILY_CAP:
        return error_response('rate_limited', 429, message='Feedback is temporarily closed. Try again tomorrow.')

    ticket = Feedback(
        id='fb_' + uuid4().hex[:12],
        api_key=caller_api_key(),
        category=category,
        message=message,
        tool=short(data.get('tool'), 64),
        error=short(data.get('error'), 1000),
        context=context,
        contact=short(data.get('contact'), 255),
        ip=ip,
        client=short(request.headers.get('X-Client'), 64),
    )
    db.session.add(ticket)
    db.session.commit()
    app.logger.info(f"Feedback {ticket.id} [{category}] from {ticket.client or 'unknown'}")
    notify(ticket)

    reply = ('Thanks. A human reads every report and will reply to the contact you gave.'
             if ticket.contact else
             'Thanks. A human reads every report. Include "contact" if you want a reply.')
    return jsonify({'id': ticket.id, 'status': 'received', 'message': reply}), 201


def main():
    import argparse
    parser = argparse.ArgumentParser(description='List recent feedback tickets.')
    parser.add_argument('--days', type=int, default=7)
    args = parser.parse_args()
    with app.app_context():
        cutoff = datetime.utcnow() - timedelta(days=args.days)
        tickets = db.session.query(Feedback).filter(
            Feedback.created_at > cutoff,
        ).order_by(Feedback.created_at.desc()).all()
        print(f'{len(tickets)} ticket(s) in the last {args.days} day(s)\n')
        for t in tickets:
            who = f'key …{t.api_key[-6:]}' if t.api_key else 'anonymous'
            print(f'{t.created_at:%Y-%m-%d %H:%M} {t.id} [{t.category}] {who} {t.client or "-"} {t.ip}')
            if t.tool or t.error:
                print(f'  tool={t.tool or "-"} error={t.error or "-"}')
            if t.contact:
                print(f'  contact: {t.contact}')
            if t.context:
                print(f'  context: {json.dumps(t.context, default=str)}')
            for line in t.message.splitlines():
                print(f'  | {line}')
            print()


if __name__ == '__main__':
    main()
