from functools import wraps
from flask import request, abort
from config import db, app
from db_models import UserSession, User
from datetime import datetime

def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        with app.app_context():
            # Check both cookie and Authorization header
            token = request.cookies.get("session_token")
            if not token:
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:]
                elif auth_header:
                    token = auth_header
            
            if not token:
                app.logger.error("No token found")
                abort(401)

            session = None
            
            # First try to find it as a direct session token
            session = db.session.query(UserSession).filter_by(token=token).first()
            if session and session.expires_at > datetime.utcnow():
                app.logger.info("Authenticated via session token")
                return f(token, *args, **kwargs)
            
            # If not found as session token, try as API key directly
            user = db.session.query(User).filter_by(api_key=token).first()
            if user:
                app.logger.info("Authenticated via API key")
                return f(token, *args, **kwargs)
            
            app.logger.error("Invalid token/API key")
            abort(401)
            
    return decorator

def get_api_key_from_token(token):
    # If the token is itself an API key, return it directly
    direct = db.session.query(User.api_key).filter_by(api_key=token).scalar()
    if direct:
        return direct
    # Otherwise look it up via session
    return (
        db.session.query(User.api_key)
        .join(UserSession, User.user_id == UserSession.user_id)
        .filter(UserSession.token == token)
        .scalar()
    )