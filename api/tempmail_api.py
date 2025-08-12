from flask import request
from config import app,db
from db_models import Message, Inbox, User
from email.parser import Parser
from uuid import uuid4
from auth import auth_bp
from payments import payments_bp
from functools import wraps
from flask import abort
import time
import os
import json
import random
import re
import logging
from words import adjectives, nouns
from auth_utils import extract_apikey

FLASK_ENV = os.getenv('FLASK_ENV', 'production')
IS_DEV = FLASK_ENV == 'development'
url_prefix = '/api' if IS_DEV else ''

# Allow CORS for development
if IS_DEV:
    from flask_cors import CORS
    CORS(app)

DOMAIN = os.getenv('DOMAIN')

app.register_blueprint(auth_bp, url_prefix=url_prefix + '/auth')
app.register_blueprint(payments_bp, url_prefix=url_prefix + '/payments')

if __name__ != '__main__':
    # if we are not running directly, we set the loggers
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)


# Authentication decorator
def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = extract_apikey(request.headers.get('Authorization'))
        if not token:  
            abort(401)
        row = db.session.query(User.api_key).filter(User.api_key==token).first()
        if not row:
            abort(401)
        return f(token, *args, **kwargs)
    return decorator

@app.route('/messages', methods=['GET'])
@auth_required
def get_messages(token):
    '''Returns message list(id, inbox)'''
    inboxes = db.session.query(Message.id, Message.inbox, Message.subject).join(Inbox, Message.inbox == Inbox.inbox).filter(Inbox.api_key==token).order_by(Message.timestamp.desc()).all()
    if not inboxes:
        inboxes = []
    else:
        inboxes = [dict(id=row.id,inbox=row.inbox, subject=row.subject) for row in inboxes]
        
    return inboxes

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

def is_quota_available(token):
    row = db.session(User).filter(User.api_key==token),(User.inbox_quota>0).first()
    if row:
        return True
    return False

@app.route('/inbox', methods=['POST'])
@auth_required
def create_mailbox(token):
    '''Creates new inbox'''
    if not is_quote_available(token):
        return "Insufficient Inbox quota", 403
    email_address = f'{get_mailboxname()}@{DOMAIN}'
    db.session.add(Inbox(api_key=token, inbox=email_address))
    db.session.commit()
    #We used one inbox, decrease quota
    User.update().values(inbox_quota=User.inbox_quota-1).where(User.api_key==token)
    return email_address, 201

@app.route('/inboxes', methods=['GET'])
@auth_required
def get_mailboxes(token):
    '''Get all inboxes'''
    inboxes = db.session.execute(db.select(Inbox.inbox)).all()
    if not inboxes:
        inboxes = []
    else:
        inboxes = [row.inbox for row in inboxes]
    return inboxes

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
