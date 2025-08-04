from flask import Blueprint, request, jsonify
from datetime import datetime
import os, random, time, hashlib, logging
from eth_account.messages import encode_defunct
from eth_account import Account

from cleanup_manager import DatabaseManager
from db_models import AuthChallenge, UserSession
from cleanup_manager import db  # import db from your setup

# --- Setup ---
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
db_manager = DatabaseManager()
DOMAIN = os.getenv('DOMAIN', 'emptyinbox.me')
logger = logging.getLogger(__name__)

# --- Utility Functions ---
def generate_nonce() -> str:
    return str(random.randint(100_000_000, 999_999_999))

def create_auth_message(address: str, nonce: str) -> tuple[str, int]:
    timestamp = int(time.time())
    message = (
        f"EmptyInbox.me wants you to sign in with your Ethereum account:\n"
        f"{address}\n\n"
        f"I accept the EmptyInbox.me Terms of Service: https://{DOMAIN}/tos\n\n"
        f"URI: https://{DOMAIN}\nVersion: 1\nChain ID: 1\n"
        f"Nonce: {nonce}\nIssued At: {timestamp}"
    )
    return message, timestamp

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    try:
        message_hash = encode_defunct(text=message)
        recovered = Account.recover_message(message_hash, signature=signature)
        return recovered.lower() == expected_address.lower()
    except Exception as e:
        logger.error(f"Signature verification failed: {e}")
        return False

def create_user_token(address: str) -> str:
    raw = f"{address}:{int(time.time())}:{random.randint(100_000, 999_999)}"
    return hashlib.sha256(raw.encode()).hexdigest()

def get_token_from_header() -> str | None:
    auth = request.headers.get('Authorization', '')
    return auth.split(' ')[1] if auth.startswith('Bearer ') else None

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

# --- Routes ---
@auth_bp.route('/challenge', methods=['POST'])
def auth_challenge():
    try:
        db_manager.cleanup_expired_records()
        address = request.json.get('address')

        if not address or not address.startswith('0x') or len(address) != 42:
            return error_response('Invalid or missing Ethereum address')

        nonce = generate_nonce()
        message, timestamp = create_auth_message(address, nonce)

        with db_manager.app.app_context():
            challenge = AuthChallenge(address, nonce, message, timestamp)
            db.session.add(challenge)
            db.session.commit()

        return jsonify({'message': message, 'nonce': nonce}), 200
    except Exception as e:
        logger.error(f"Challenge generation error: {e}")
        db.session.rollback()
        return error_response('Failed to generate challenge', 500)

@auth_bp.route('/verify', methods=['POST'])
def auth_verify():
    try:
        data = request.json
        address, signature, message = data.get('address'), data.get('signature'), data.get('message')

        if not all([address, signature, message]):
            return error_response('Address, signature, and message required')

        try:
            nonce = next(line for line in message.split('\n') if line.startswith('Nonce:')).split(': ')[1]
        except StopIteration:
            return error_response('Malformed authentication message')

        with db_manager.app.app_context():
            challenge_id = f"challenge:{address}:{nonce}"
            challenge = db.session.query(AuthChallenge).filter_by(id=challenge_id)\
                .filter(AuthChallenge.expires_at > datetime.utcnow()).first()

            if not challenge or challenge.message != message:
                return error_response('Challenge expired or mismatched')

            if not verify_signature(message, signature, address):
                return error_response('Invalid signature', 401)

            db.session.delete(challenge)

            token = create_user_token(address)
            session_obj = UserSession(token, address, int(time.time()))
            db.session.add(session_obj)
            db.session.commit()

        return jsonify({'success': True, 'token': token, 'address': address}), 200
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        db.session.rollback()
        return error_response('Authentication failed', 500)

@auth_bp.route('/me', methods=['GET'])
def auth_me():
    try:
        token = get_token_from_header()
        if not token:
            return error_response('Authentication required', 401)

        with db_manager.app.app_context():
            user = db.session.query(UserSession).filter_by(token=token)\
                .filter(UserSession.expires_at > datetime.utcnow()).first()

            if not user:
                return error_response('Invalid authentication token', 401)

            return jsonify({'address': user.address, 'login_time': user.login_time}), 200
    except Exception as e:
        logger.error(f"User info retrieval failed: {e}")
        return error_response('Failed to fetch user information', 500)

@auth_bp.route('/logout', methods=['POST'])
def auth_logout():
    try:
        token = get_token_from_header()
        if not token:
            return error_response('No authentication token', 401)

        with db_manager.app.app_context():
            user = db.session.query(UserSession).filter_by(token=token).first()
            if user:
                db.session.delete(user)
                db.session.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Logout error: {e}")
        db.session.rollback()
        return error_response('Logout failed', 500)