from config import db
from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy.types import JSON

class PaymentStatus(Enum):
    PENDING = "0"
    PARTIALLY_CONFIRMED = "1"
    CONFIRMED = "2"

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(16), primary_key=True)
    inbox = db.Column(db.String(250), index=True)
    subject  = db.Column(db.String(250))
    timestamp = db.Column(db.BigInteger)
    content = db.Column(db.BLOB(8 << 20))

class Inbox(db.Model):
    __tablename__ = 'inboxes'

    api_key = db.Column(db.String(250), primary_key=True)
    inbox = db.Column(db.String(250), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    connected_services = db.Column(JSON, default=list)
    
class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.String(255), primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)  # New field
    api_key = db.Column(db.String(250), unique=True, nullable=False)
    inbox_quota = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # New field

class PasskeyCredential(db.Model):
    __tablename__ = 'passkey_credentials'

    credential_id = db.Column(db.String(1000), primary_key=True)  # Base64url encoded credential ID
    user_id = db.Column(db.String(255), db.ForeignKey('users.user_id'), nullable=False)
    public_key = db.Column(db.Text, nullable=False)  # COSE public key
    counter = db.Column(db.BigInteger, default=0)  # Signature counter
    device_type = db.Column(db.String(50))  # e.g., "platform", "cross-platform"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref='passkey_credentials')

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

class PasskeyChallenge(db.Model):
    __tablename__ = 'passkey_challenges'
    
    challenge_id = db.Column(db.String(255), primary_key=True)  # Random challenge ID
    username = db.Column(db.String(255), nullable=True)         # Only for registration
    credential_id = db.Column(db.String(1000), nullable=True)   # Only for authentication
    challenge = db.Column(db.String(1000), nullable=False)      # Base64url encoded challenge
    operation_type = db.Column(db.String(20), nullable=False)   # "registration" or "authentication"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def __init__(self, challenge_id, challenge, operation_type, username=None, credential_id=None):
        self.challenge_id = challenge_id
        self.username = username
        self.credential_id = credential_id
        self.challenge = challenge
        self.operation_type = operation_type
        self.created_at = datetime.utcnow()
        self.expires_at = datetime.utcnow() + timedelta(minutes=5)

class UserSession(db.Model):
    __tablename__ = 'user_sessions'

    token = db.Column(db.String, primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.user_id'), nullable=False)
    login_time = db.Column(db.Integer, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Relationship
    user = db.relationship('User', backref='sessions')

    def __init__(self, token, user_id, login_time):
        self.token = token
        self.user_id = user_id
        self.login_time = login_time
        self.expires_at = datetime.utcnow() + timedelta(days=30)

class PaymentIntent(db.Model):
    __tablename__ = 'payment_intents'

    txhash = db.Column(db.String(66), primary_key=True)
    user_id = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Integer)
    status = db.Column(db.String(1), nullable=False, default="0")


def main():
    from config import app, db
    with app.app_context():
        db.create_all()

if __name__=="__main__":
  main()