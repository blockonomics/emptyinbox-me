from flask import request
from config import app,db
from db_models import Message, Inbox, User
from email.parser import Parser
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

FLASK_ENV = os.getenv('FLASK_ENV', 'production')
IS_DEV = FLASK_ENV == 'development'
url_prefix = '/api' if IS_DEV else ''

# Allow CORS for development
if IS_DEV:
    from flask_cors import CORS
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:8000"]  # must match your frontend origin exactly
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

@app.route(f'{url_prefix}/messages', methods=['GET'])
@auth_required
def get_messages(token):
    '''Returns message list(id, inbox, subject, content, timestamp, sender)'''
    api_key = get_api_key_from_token(token)
    messages = db.session.query(
        Message.id, 
        Message.inbox, 
        Message.subject, 
        Message.content,
        Message.timestamp
    ).join(
        Inbox, Message.inbox == Inbox.inbox
    ).filter(
        Inbox.api_key==api_key
    ).order_by(
        Message.timestamp.desc()
    ).all()
    
    if not messages:
        messages = []
    else:
        result_messages = []
        for row in messages:
            try:
                # Parse the JSON content blob
                content_json = json.loads(row.content.decode('utf-8')) if row.content else {}
                
                # Extract relevant fields
                html_body = content_json.get('html_body', '')
                text_body = content_json.get('text_body', '')
                sender = content_json.get('sender', 'Unknown')
                
                # Get sender from headers if available
                headers = content_json.get('headers', {})
                from_header = headers.get('From', sender)
                
                result_messages.append(dict(
                    id=row.id,
                    inbox=row.inbox, 
                    subject=row.subject,
                    html_body=html_body,
                    text_body=text_body,
                    sender=from_header,
                    timestamp=row.timestamp
                ))
            except (json.JSONDecodeError, UnicodeDecodeError):
                # Fallback for malformed content
                result_messages.append(dict(
                    id=row.id,
                    inbox=row.inbox, 
                    subject=row.subject,
                    html_body='',
                    text_body='',
                    sender='Unknown',
                    timestamp=row.timestamp
                ))
        
        messages = result_messages
        
    return messages

@app.route('/message/<msgid>', methods=['GET'])
@auth_required
def get_message(token, msgid):
    '''Returns message content for the given message id'''
    row = db.session.query(Message.content).join(Inbox, Message.inbox == Inbox.inbox).filter(Inbox.api_key==token).filter(Message.id==msgid).first()
    if not row:
        return "msgid doesn't exist", 404
        
    return row.content, 200

def get_mailboxname():
    adjective_part = '.'.join(random.choices(adjectives, k=2))
    noun = random.choice(nouns)
    return f'{adjective_part}.{noun}'

def is_quota_available(api_key):
    row = db.session.query(User).filter(User.api_key==api_key,User.inbox_quota>0).first()
    if row:
        return True
    return False

@app.route(f'{url_prefix}/inbox', methods=['POST']) 
@auth_required
def create_mailbox(token):
    '''Creates new inbox'''
    api_key = get_api_key_from_token(token)
    if not is_quota_available(api_key):
        return "Insufficient Inbox quota", 403
    email_address = f'{get_mailboxname()}@{DOMAIN}'
    db.session.add(Inbox(api_key=api_key, inbox=email_address))
    #We used one inbox, decrease quota
    db.session.query(User).filter(User.api_key==api_key).update({"inbox_quota":User.inbox_quota-1}) 
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
    secret = request.headers.get('Authorization').split(' ')[-1]

    if secret != os.getenv('SECRET'):
       return '', 403
    for recipient in email_data['recipients']:
        if query_inbox(recipient):
            msg_id = str(uuid4())[:8]
            timestamp = int(time.time())
            subject = email_data.get("headers", {}).get("Subject")
            db.session.add(Message(id=msg_id, inbox=recipient, timestamp=timestamp, 
                                   subject = subject,
                                   content=json.dumps(email_data).encode()))
            db.session.commit()

    return '', 201
