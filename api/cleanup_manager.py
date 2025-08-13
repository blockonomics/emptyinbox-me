from config import app, db
from db_models import AuthChallenge, UserSession
from datetime import datetime

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
                    self.app.logger.info(
                        f"Cleaned up {expired_challenges} expired challenges and "
                        f"{expired_sessions} expired sessions"
                    )
            except Exception:
                db.session.rollback()
                self.app.logger.exception("Cleanup failed")
                raise

    def close(self):
        db.session.remove()