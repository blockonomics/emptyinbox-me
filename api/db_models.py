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
    timestamp = db.Column(db.BigInteger, index=True)
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

    # Where the account came from. Until these existed the only record of a
    # signup was a line on stdout, so nothing could be asked of the database
    # afterwards: which client registered, whether a network was farming
    # accounts, how many accounts a release brought in.
    signup_method = db.Column(db.String(16))     # 'agent' or 'passkey'
    signup_ip = db.Column(db.String(64))
    signup_client = db.Column(db.String(64))     # X-Client header, e.g. the MCP server

    # Paywall contact. An account that has hit 402 wanted an inbox it could not
    # have, which is the one moment a free user has declared intent to buy.
    # Counting it here keeps the funnel answerable from the accounts table
    # rather than from log scraping.
    quota_blocks = db.Column(db.Integer, default=0, nullable=False)
    last_quota_block_at = db.Column(db.DateTime)


class RegistrationAttempt(db.Model):
    """Every call to POST /auth/register, refused ones included.

    Two jobs in one table. It is the store the free-quota grading counts
    against, which the previous in-memory dict could not be: that dict lived
    per worker process and emptied on every deploy, so the daily cap it
    advertised was really one cap per worker since the last restart. And it is
    the only record that a registration was ever turned away - the failures are
    exactly the ones that never become a row in users, and so the ones no other
    table can show."""
    __tablename__ = 'registration_attempts'

    id = db.Column(db.Integer, primary_key=True)
    subnet = db.Column(db.String(64), nullable=False, index=True)
    ip = db.Column(db.String(64))
    client = db.Column(db.String(64))
    username = db.Column(db.String(255))
    outcome = db.Column(db.String(16), nullable=False)  # granted | reduced | zero | refused | rejected
    granted_quota = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

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


class BtcPaymentIntent(db.Model):
    """A BTC quota purchase. Keyed by the per-order address, which is the only
    join key the Blockonomics callback carries."""
    __tablename__ = 'btc_payment_intents'

    address = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    bundle = db.Column(db.String(32), nullable=False)
    quota = db.Column(db.Integer, nullable=False)
    usd_amount = db.Column(db.Integer, nullable=False)          # whole USD
    expected_satoshis = db.Column(db.BigInteger, nullable=False)
    received_satoshis = db.Column(db.BigInteger, nullable=False, default=0)
    status = db.Column(db.String(1), nullable=False, default=PaymentStatus.PENDING.value)
    credited = db.Column(db.Boolean, nullable=False, default=False)   # quota granted (may be zero-conf)
    settled = db.Column(db.Boolean, nullable=False, default=False)    # reached status >= 2
    revoked = db.Column(db.Boolean, nullable=False, default=False)    # provisional credit clawed back
    txid = db.Column(db.String(66))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    credited_at = db.Column(db.DateTime)


class PaymentCallback(db.Model):
    """Idempotency ledger. Blockonomics sends roughly one callback per status
    per address, plus retries; the composite key collapses replays."""
    __tablename__ = 'payment_callbacks'

    txid = db.Column(db.String(66), primary_key=True)
    addr = db.Column(db.String(64), primary_key=True)
    status = db.Column(db.String(1), primary_key=True)
    value = db.Column(db.BigInteger)
    crypto = db.Column(db.String(8))
    seen_at = db.Column(db.DateTime, default=datetime.utcnow)


def main():
    from config import app, db
    with app.app_context():
        db.create_all()

if __name__=="__main__":
  main()