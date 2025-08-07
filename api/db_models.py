from config import db
from datetime import datetime, timedelta

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(16), primary_key=True)
    inbox = db.Column(db.String(250), index=True)
    timestamp = db.Column(db.BigInteger)
    content = db.Column(db.BLOB(8 << 20))

class Inbox(db.Model):
    __tablename__ = 'inboxes'

    api_key = db.Column(db.String(250), primary_key=True)
    inbox = db.Column(db.String(250), primary_key=True)

class User(db.Model):
    __tablename__ = 'users'

    eth_account = db.Column(db.String(42), primary_key=True)
    api_key = db.Column(db.String(250), unique=True, nullable=False)
    inbox_quota = db.Column(db.Integer, default=0)

class AuthChallenge(db.Model):
    __tablename__ = 'auth_challenges'

    id = db.Column(db.String, primary_key=True)  # format: "challenge:{address}:{nonce}"
    address = db.Column(db.String(42), nullable=False)
    nonce = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, address, nonce, message, timestamp):
        self.id = f"challenge:{address}:{nonce}"
        self.address = address
        self.nonce = nonce
        self.message = message
        self.timestamp = timestamp
        self.expires_at = datetime.utcnow() + timedelta(minutes=5)

class UserSession(db.Model):
    __tablename__ = 'user_sessions'

    token = db.Column(db.String, primary_key=True)
    address = db.Column(db.String(42), nullable=False)
    login_time = db.Column(db.Integer, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, token, address, login_time):
        self.token = token
        self.address = address
        self.login_time = login_time
        self.expires_at = datetime.utcnow() + timedelta(days=30)

class PaymentIntent(db.Model):
    __tablename__ = 'payment_intents'

    txhash = db.Column(db.String(66), primary_key=True)
    eth_account = db.Column(db.String(42), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Integer)


def main():
    from config import app, db
    with app.app_context():
        db.create_all()

if __name__=="__main__":
  main()
