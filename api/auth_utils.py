from functools import wraps
from flask import request, abort
from config import db, app
from db_models import UserSession
from datetime import datetime

def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        app.logger.debug(f"Cookies: {request.cookies}")
        token = request.cookies.get("session_token")
        if not token:
            abort(401)

        # Look up the session in UserSession, not User
        session = db.session.query(UserSession).filter_by(token=token).first()
        if not session:
            abort(401)

        # Check expiry
        if session.expires_at < datetime.utcnow():
            abort(401)

        # Pass the token
        return f(token, *args, **kwargs)
    return decorator