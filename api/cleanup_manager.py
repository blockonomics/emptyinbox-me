# database_manager.py
from config import app, db
from db_model import AuthChallenge, UserSession
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.app = app

    def cleanup_expired_records(self):
        with self.app.app_context():
            try:
                now = datetime.utcnow()

                expired_challenges = AuthChallenge.query.filter(
                    AuthChallenge.expires_at < now
                ).count()
                AuthChallenge.query.filter(
                    AuthChallenge.expires_at < now
                ).delete()

                expired_sessions = UserSession.query.filter(
                    UserSession.expires_at < now
                ).count()
                UserSession.query.filter(
                    UserSession.expires_at < now
                ).delete()

                db.session.commit()

                if expired_challenges > 0 or expired_sessions > 0:
                    logger.info(
                        f"Cleaned up {expired_challenges} expired challenges and "
                        f"{expired_sessions} expired sessions"
                    )
            except Exception:
                db.session.rollback()
                logger.exception("Cleanup failed")
                raise

    def close(self):
        db.session.remove()