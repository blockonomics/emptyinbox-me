from functools import wraps
from flask import request, abort
from config import db
from db_models import User

def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        app.logger.debug(f"Cookies: {request.cookies}")
        token = request.cookies.get("session_token") or request.cookies.get("api_key")
        if not token:
            abort(401)
        row = db.session.query(User.api_key).filter(User.api_key == token).first()
        if not row:
            abort(401)
        return f(token, *args, **kwargs)
    return decorator