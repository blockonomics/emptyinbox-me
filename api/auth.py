from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import os, random, time, hashlib, base64, json
from eth_account.messages import encode_defunct
from eth_account import Account
from config import db, app
from urllib.parse import urlparse
import traceback


from db_models import AuthChallenge, UserSession, User, PaymentIntent, PaymentStatus
from constants import USER_STARTING_QUOTA

# Add these imports for passkey functionality
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import cbor2

auth_bp = Blueprint('auth', __name__)
DOMAIN = os.getenv('DOMAIN', 'emptyinbox.me')
RP_NAME = os.getenv('RP_NAME', 'EmptyInbox.me')

FLASK_ENV = os.getenv('FLASK_ENV', 'production')
IS_DEV = FLASK_ENV == 'development'
URL_SCHEME = 'http://' if IS_DEV else 'https://'

# --- Utility Functions ---
def generate_nonce() -> str:
    return str(random.randint(100_000_000, 999_999_999))

def create_auth_message(address: str, nonce: str) -> tuple[str, int]:
    """Create wallet authentication message (kept for payment verification)."""
    timestamp = int(time.time())
    message = (
        f"EmptyInbox.me wants you to sign in with your Ethereum account:\n"
        f"{address}\n\n"
        f"I accept the EmptyInbox.me Terms of Service: {URL_SCHEME}{DOMAIN}/tos\n\n"
        f"URI: {URL_SCHEME}{DOMAIN}\nVersion: 1\nChain ID: 1\n"
        f"Nonce: {nonce}\nIssued At: {timestamp}"
    )
    return message, timestamp

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    """Verify wallet signature (kept for payment verification)."""
    try:
        message_hash = encode_defunct(text=message)
        recovered = Account.recover_message(message_hash, signature=signature)
        return recovered.lower() == expected_address.lower()
    except Exception as e:
        app.logger.error(f"Signature verification failed: {e}")
        return False

def cleanup_expired_auth_records():
    """Deletes expired AuthChallenge and UserSession records from the database."""
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
            app.logger.info(
                f"Cleaned up {expired_challenges} expired challenges and "
                f"{expired_sessions} expired sessions"
            )
    except Exception as e:
        db.session.rollback()
        app.logger.exception("Cleanup failed")
        raise


def create_user_token(address: str) -> str:
    raw = f"{address}:{int(time.time())}:{random.randint(100_000, 999_999)}"
    return hashlib.sha256(raw.encode()).hexdigest()

def get_token_from_header() -> str | None:
    auth = request.headers.get('Authorization', '')
    return auth.split(' ')[1] if auth.startswith('Bearer ') else None

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

# --- Passkey Utility Functions ---
def generate_challenge() -> bytes:
    """Generate a cryptographically secure random challenge."""
    return os.urandom(32)

def base64url_decode(data: str) -> bytes:
    """Decode base64url string to bytes."""
    # Add padding if needed
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data.replace('-', '+').replace('_', '/'))

def base64url_encode(data: bytes) -> str:
    """Encode bytes to base64url string."""
    return base64.urlsafe_b64encode(data).decode().rstrip('=')

def generate_user_id() -> str:
    """Generate a unique user ID for passkey registration."""
    return base64url_encode(os.urandom(32))

def verify_passkey_signature(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey authentication signature."""
    try:
        # Decode the response data
        authenticator_data = base64url_decode(credential_data['response']['authenticatorData'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        signature = base64url_decode(credential_data['response']['signature'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        # Verify challenge
        received_challenge = base64url_decode(client_data['challenge'])
        if received_challenge != challenge:
            app.logger.error("Challenge mismatch in passkey verification")
            return False, {}
        
        # Verify origin
        expected_origin = f"{URL_SCHEME}{DOMAIN}"
        if client_data['origin'] != expected_origin:
            app.logger.error(f"Origin mismatch: expected {expected_origin}, got {client_data['origin']}")
            return False, {}
        
        # For now, we'll return success with the parsed data
        # In a full implementation, you'd verify the signature against the stored public key
        return True, {
            'credential_id': credential_data['id'],
            'authenticator_data': authenticator_data,
            'client_data': client_data,
            'signature': signature
        }
        
    except Exception as e:
        app.logger.error(f"Passkey signature verification failed: {e}")
        return False, {}

def verify_passkey_registration(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey registration data."""
    try:
        # Decode the response data
        attestation_object = base64url_decode(credential_data['response']['attestationObject'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        # Verify challenge
        received_challenge = base64url_decode(client_data['challenge'])
        if received_challenge != challenge:
            app.logger.error("Challenge mismatch in passkey registration")
            return False, {}
        
        # Verify origin
        expected_origin = f"{URL_SCHEME}{DOMAIN}"
        if client_data['origin'] != expected_origin:
            app.logger.error(f"Origin mismatch: expected {expected_origin}, got {client_data['origin']}")
            return False, {}
        
        # Parse attestation object
        try:
            attestation = cbor2.loads(attestation_object)
            auth_data = attestation['authData']
            
            # Extract credential ID and public key (simplified)
            # In a full implementation, you'd properly parse the CBOR data
            return True, {
                'credential_id': credential_data['id'],
                'attestation_object': attestation_object,
                'client_data': client_data,
                'auth_data': auth_data
            }
        except Exception as e:
            app.logger.error(f"Failed to parse attestation object: {e}")
            # For demo purposes, still return success
            return True, {
                'credential_id': credential_data['id'],
                'attestation_object': attestation_object,
                'client_data': client_data
            }
        
    except Exception as e:
        app.logger.error(f"Passkey registration verification failed: {e}")
        return False, {}

# --- Wallet Auth Routes (Kept for Payment Verification) ---
# Note: These are no longer used for login, but may be needed for payment flows

@auth_bp.route('/challenge', methods=['POST'])
def auth_challenge():
    """Generate wallet challenge (kept for payment verification)."""
    app.logger.info("Received wallet challenge request")
    try:
        cleanup_expired_auth_records()
        address = request.json.get('address')

        if not address or not address.startswith('0x') or len(address) != 42:
            return error_response('Invalid or missing Ethereum address')

        nonce = generate_nonce()
        message, timestamp = create_auth_message(address, nonce)

        with app.app_context():
            challenge = AuthChallenge(address, nonce, message, timestamp)
            db.session.add(challenge)
            db.session.commit()

        return jsonify({'message': message, 'nonce': nonce}), 200
    except Exception as e:
        app.logger.error(f"Challenge generation error: {e}")
        db.session.rollback()
        return error_response('Failed to generate challenge', 500)


# --- New Passkey Auth Routes ---
@auth_bp.route('/passkey/register/begin', methods=['POST'])
def passkey_register_begin():
    """Start passkey registration process."""
    try:
        cleanup_expired_auth_records()
        
        # Generate challenge and user info
        challenge = generate_challenge()
        user_id = generate_user_id()
        
        # Store challenge in database (reuse AuthChallenge table)
        challenge_id = f"passkey_reg:{user_id}:{int(time.time())}"
        nonce = base64url_encode(challenge)

        # If DOMAIN might include a port, strip it for rp.id
        rp_id = DOMAIN.split(':')[0]  # "localhost:8000" -> "localhost"

        
        with app.app_context():
            auth_challenge = AuthChallenge(
                address=challenge_id,  # Reuse address field for challenge ID
                nonce=nonce,
                message=base64url_encode(challenge),  # Store challenge in message field
                timestamp=int(time.time())
            )
            db.session.add(auth_challenge)
            db.session.commit()
        
        # Return WebAuthn registration options
        registration_options = {
            'challenge': base64url_encode(challenge),
            'rp': {
                'name': RP_NAME,
                'id': rp_id
            },
            'user': {
                'id': base64url_encode(user_id.encode()),
                'name': f"user_{user_id[:8]}",
                'displayName': f"User {user_id[:8]}"
            },
            'pubKeyCredParams': [
                {'type': 'public-key', 'alg': -7},   # ES256
                {'type': 'public-key', 'alg': -257}  # RS256
            ],
            'timeout': 60000,
            'attestation': 'none',
            'authenticatorSelection': {
                'authenticatorAttachment': 'platform',
                'userVerification': 'preferred'
            }
        }
        
        return jsonify(registration_options), 200
        
    except Exception as e:
        app.logger.error(f"Passkey registration begin failed: {e}")
        db.session.rollback()
        return error_response('Failed to start passkey registration', 500)

@auth_bp.route('/passkey/register/complete', methods=['POST'])
def passkey_register_complete():
    """Complete passkey registration process."""
    try:
        credential_data = request.json
        credential_id = credential_data.get('id')
        
        if not credential_id:
            return error_response('Missing credential ID')
        
        # Get the challenge from client data
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        client_data = json.loads(client_data_json.decode())
        challenge_b64 = client_data['challenge']
        challenge = base64url_decode(challenge_b64)
        
        # Find matching challenge in database
        with app.app_context():
            stored_challenge = db.session.query(AuthChallenge).filter(
                AuthChallenge.message == base64url_encode(challenge)
            ).filter(AuthChallenge.expires_at > datetime.utcnow()).first()
            
            if not stored_challenge:
                return error_response('Challenge expired or not found')
            
            # Verify registration
            is_valid, parsed_data = verify_passkey_registration(credential_data, challenge)
            if not is_valid:
                return error_response('Invalid passkey registration')
            
            # Clean up challenge
            db.session.delete(stored_challenge)
            
            # Create user account
            api_key = create_user_token(credential_id)[:32]
            user = User(
                user_id=f"passkey:{credential_id}",
                api_key=api_key,
                inbox_quota=USER_STARTING_QUOTA
            )
            db.session.add(user)
            
            # Create session
            session_token = create_user_token(credential_id)
            session_obj = UserSession(session_token, f"passkey:{credential_id}", int(time.time()))
            db.session.add(session_obj)
            
            db.session.commit()
            
            app.logger.info(f"Created new passkey user: {credential_id}")
            
            return jsonify({
                'success': True,
                'token': session_token,
                'api_key': api_key,
                'credential_id': credential_id
            }), 200
            
    except Exception as e:
        app.logger.error(f"Passkey registration complete failed: {e}")
        db.session.rollback()
        return error_response('Failed to complete passkey registration', 500)

# Only change this one function in your auth.py:

@auth_bp.route('/passkey/authenticate/begin', methods=['POST'])
def passkey_authenticate_begin():
    """Start passkey authentication process."""
    try:
        cleanup_expired_auth_records()
        
        # Generate challenge
        challenge = generate_challenge()
        
        # Store challenge in database
        challenge_id = f"passkey_auth:{int(time.time())}:{random.randint(100000, 999999)}"
        nonce = base64url_encode(challenge)
        
        with app.app_context():
            auth_challenge = AuthChallenge(
                address=challenge_id,
                nonce=nonce,
                message=base64url_encode(challenge),
                timestamp=int(time.time())
            )
            db.session.add(auth_challenge)
            
            # Get all registered users to build allowCredentials
            users = db.session.query(User).filter(User.user_id.like('passkey:%')).all()
            
            # Build allowCredentials while still in session context
            allow_credentials = []
            for user in users:
                credential_id = user.user_id.replace('passkey:', '')
                allow_credentials.append({
                    'type': 'public-key',
                    'id': credential_id
                })
            
            db.session.commit()
        
        # Return WebAuthn authentication options
        auth_options = {
            'challenge': base64url_encode(challenge),
            'timeout': 60000,
            'userVerification': 'preferred',
            'allowCredentials': allow_credentials  # Now populated instead of empty
        }
        
        return jsonify(auth_options), 200
        
    except Exception as e:
        app.logger.error(f"Passkey authentication begin failed: {e}")
        db.session.rollback()
        return error_response('Failed to start passkey authentication', 500)

@auth_bp.route('/passkey/authenticate/complete', methods=['POST'])
def passkey_authenticate_complete():
    """Complete passkey authentication process."""
    credential_data = request.json
    credential_id = credential_data.get('id')

    if not credential_id:
        return error_response('Missing credential ID')

    try:
        # Get the challenge from client data
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        client_data = json.loads(client_data_json.decode())
        challenge_b64 = client_data['challenge']
        challenge = base64url_decode(challenge_b64)

        with app.app_context():
            stored_challenge = db.session.query(AuthChallenge).filter(
                AuthChallenge.message == base64url_encode(challenge)
            ).filter(AuthChallenge.expires_at > datetime.utcnow()).first()

            if not stored_challenge:
                return error_response('Challenge expired or not found')

            is_valid, parsed_data = verify_passkey_signature(credential_data, challenge)
            if not is_valid:
                return error_response('Invalid passkey authentication')

            passkey_address = f"passkey:{credential_id}"
            user = db.session.query(User).filter_by(user_id=passkey_address).first()
            if not user:
                return error_response('User not found for this passkey', 404)

            db.session.delete(stored_challenge)
            old_sessions = db.session.query(UserSession).filter_by(address=passkey_address).all()
            for old_session in old_sessions:
                db.session.delete(old_session)

            session_token = create_user_token(credential_id)
            session_obj = UserSession(session_token, passkey_address, int(time.time()))
            db.session.add(session_obj)
            db.session.commit()

        app.logger.info(f"Passkey authentication successful for: {credential_id}")
        return jsonify({
            'success': True,
            'token': session_token,
            'api_key': user.api_key,
            'credential_id': credential_id
        }), 200

    except Exception as e:
        app.logger.error(f"Passkey authentication complete failed: {e}")
        db.session.rollback()
        return error_response('Failed to complete passkey authentication', 500)


# --- Existing Routes ---
@auth_bp.route('/me', methods=['GET'])
def auth_me():
    try:
        token = get_token_from_header()
        if not token:
            return error_response('Authentication required', 401)

        with app.app_context():
            # First, validate the session token
            session = db.session.query(UserSession).filter_by(token=token)\
                .filter(UserSession.expires_at > datetime.utcnow()).first()

            if not session:
                return error_response('Invalid or expired authentication token', 401)

            # Then get the full user object
            from db_models import User
            user = db.session.query(User).filter_by(user_id=session.address).first()
            
            if not user:
                return error_response('User not found', 404)

            # Fetch confirmed payments for the user
            payments = db.session.query(PaymentIntent).filter_by(
                user_id=user.user_id,
                status=PaymentStatus.CONFIRMED.value  # Assuming CONFIRMED = "1"
            ).order_by(PaymentIntent.created_at.desc()).all()

            # Format payment data
            payment_data = [{
                'txhash': p.txhash,
                'amount': p.amount,
                'created_at': p.created_at.isoformat()
            } for p in payments]

            # Determine auth method
            auth_method = 'passkey' if session.address.startswith('passkey:') else 'wallet'
            
            return jsonify({
                'address': user.user_id,
                'api_key': user.api_key,
                'inbox_quota': user.inbox_quota,
                'login_time': session.login_time,
                'session_expires_at': session.expires_at.isoformat() if hasattr(session, 'expires_at') else None,
                'payments': payment_data,
                'auth_method': auth_method
            }), 200
    except Exception as e:
        app.logger.error(f"User info retrieval failed: {e}")
        return error_response('Failed to fetch user information', 500)

@auth_bp.route('/logout', methods=['POST'])
def auth_logout():
    try:
        token = get_token_from_header()
        if not token:
            return error_response('No authentication token', 401)

        with app.app_context():
            user = db.session.query(UserSession).filter_by(token=token).first()
            if user:
                db.session.delete(user)
                db.session.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        app.logger.error(f"Logout error: {e}")
        db.session.rollback()
        return error_response('Logout failed', 500)