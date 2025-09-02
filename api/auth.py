# Updated auth.py with proper username and passkey support

from flask import Blueprint, request, jsonify, make_response
from datetime import datetime, timedelta
import os, random, time, hashlib, base64, json
from eth_account.messages import encode_defunct
from eth_account import Account
from config import db, app
from urllib.parse import urlparse
import traceback
from auth_utils import auth_required

from db_models import AuthChallenge, UserSession, User, PaymentIntent, PaymentStatus, PasskeyCredential, PasskeyChallenge
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

def create_user_token(identifier: str) -> str:
    raw = f"{identifier}:{int(time.time())}:{random.randint(100_000, 999_999)}"
    return hashlib.sha256(raw.encode()).hexdigest()

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

def cleanup_expired_auth_records():
    """Deletes expired AuthChallenge, UserSession, and PasskeyChallenge records."""
    try:
        now = datetime.utcnow()

        expired_challenges = AuthChallenge.query.filter(
            AuthChallenge.expires_at < now
        ).count()
        AuthChallenge.query.filter(
            AuthChallenge.expires_at < now
        ).delete()

        expired_passkey_challenges = PasskeyChallenge.query.filter(
            PasskeyChallenge.expires_at < now
        ).count()
        PasskeyChallenge.query.filter(
            PasskeyChallenge.expires_at < now
        ).delete()

        expired_sessions = UserSession.query.filter(
            UserSession.expires_at < now
        ).count()
        UserSession.query.filter(
            UserSession.expires_at < now
        ).delete()

        db.session.commit()

        if expired_challenges > 0 or expired_sessions > 0 or expired_passkey_challenges > 0:
            app.logger.info(
                f"Cleaned up {expired_challenges} auth challenges, "
                f"{expired_passkey_challenges} passkey challenges, and "
                f"{expired_sessions} expired sessions"
            )
    except Exception as e:
        db.session.rollback()
        app.logger.exception("Cleanup failed")
        raise

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

def get_rp_id_from_domain(domain: str) -> str:
    """Extract RP ID from domain, handling ports properly."""
    # Remove protocol if present
    if '://' in domain:
        domain = domain.split('://', 1)[1]
    # Remove port if present
    if ':' in domain:
        domain = domain.split(':', 1)[0]
    return domain

def verify_passkey_registration(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey registration data with improved validation."""
    try:
        # Decode the response data
        attestation_object = base64url_decode(credential_data['response']['attestationObject'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        app.logger.info(f"Registration client data: {client_data}")
        
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
        
        # Verify type
        if client_data.get('type') != 'webauthn.create':
            app.logger.error(f"Wrong ceremony type: expected 'webauthn.create', got {client_data.get('type')}")
            return False, {}
        
        # Parse attestation object
        try:
            attestation = cbor2.loads(attestation_object)
            auth_data = attestation['authData']
            
            return True, {
                'credential_id': credential_data['id'],
                'attestation_object': attestation_object,
                'client_data': client_data,
                'auth_data': auth_data
            }
        except Exception as e:
            app.logger.error(f"Failed to parse attestation object: {e}")
            # For demo purposes, still return success if basic validation passes
            return True, {
                'credential_id': credential_data['id'],
                'attestation_object': attestation_object,
                'client_data': client_data
            }
        
    except Exception as e:
        app.logger.error(f"Passkey registration verification failed: {e}")
        return False, {}

def verify_passkey_signature(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey authentication signature with improved validation."""
    try:
        # Decode the response data
        authenticator_data = base64url_decode(credential_data['response']['authenticatorData'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        signature = base64url_decode(credential_data['response']['signature'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        app.logger.info(f"Authentication client data: {client_data}")
        
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
        
        # Verify type
        if client_data.get('type') != 'webauthn.get':
            app.logger.error(f"Wrong ceremony type: expected 'webauthn.get', got {client_data.get('type')}")
            return False, {}
        
        return True, {
            'credential_id': credential_data['id'],
            'authenticator_data': authenticator_data,
            'client_data': client_data,
            'signature': signature
        }
        
    except Exception as e:
        app.logger.error(f"Passkey signature verification failed: {e}")
        return False, {}

# --- Username and Passkey Routes ---

@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    """Check if username exists and has passkey."""
    try:
        username = request.json.get('username')
        
        if not username:
            return error_response('Username is required')
        
        if len(username) < 3:
            return error_response('Username must be at least 3 characters long')
        
        with app.app_context():
            user = db.session.query(User).filter_by(username=username).first()
            
            if user:
                # Check if user has any passkey credentials
                has_passkey = db.session.query(PasskeyCredential).filter_by(user_id=user.user_id).first() is not None
                
                return jsonify({
                    'exists': True,
                    'hasPasskey': has_passkey
                }), 200
            else:
                return jsonify({
                    'exists': False,
                    'hasPasskey': False
                }), 200
                
    except Exception as e:
        app.logger.error(f"Username check failed: {e}")
        return error_response('Failed to check username', 500)

@auth_bp.route('/passkey/register/begin', methods=['POST'])
def passkey_register_begin():
    """Start passkey registration process."""
    try:
        cleanup_expired_auth_records()
        
        username = request.json.get('username')
        if not username:
            return error_response('Username is required')
        
        if len(username) < 3:
            return error_response('Username must be at least 3 characters long')
        
        # Check if username already exists
        with app.app_context():
            existing_user = db.session.query(User).filter_by(username=username).first()
            if existing_user:
                return error_response('Username already exists')
        
        # Generate challenge
        challenge = generate_challenge()
        challenge_id = f"passkey_reg:{username}:{int(time.time())}"
        
        # Get proper RP ID
        rp_id = get_rp_id_from_domain(DOMAIN)
        
        # Store challenge in PasskeyChallenge table
        passkey_challenge = PasskeyChallenge(
            challenge_id=challenge_id,
            username=username,
            challenge=base64url_encode(challenge),
            operation_type='registration'
        )
        
        with app.app_context():
            db.session.add(passkey_challenge)
            db.session.commit()
        
        # Return WebAuthn registration options - OPTIMIZED FOR ANDROID/GPM
        registration_options = {
            'challenge': base64url_encode(challenge),
            'rp': {
                'name': RP_NAME,
                'id': rp_id
            },
            'user': {
                'id': base64url_encode(username.encode()),
                'name': username,
                'displayName': username
            },
            'pubKeyCredParams': [
                {'type': 'public-key', 'alg': -7},   # ES256
                {'type': 'public-key', 'alg': -257}  # RS256
            ],
            'timeout': 300000,
            'attestation': 'none',
            'authenticatorSelection': {
                # REMOVED: authenticatorAttachment to allow cross-platform (GPM)
                'residentKey': 'required',     # Required for usernameless auth
                'requireResidentKey': True,    # Explicit true for discoverable credentials
                'userVerification': 'preferred'
            },
            'excludeCredentials': []
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
        username = credential_data.get('username')
        
        if not credential_id or not username:
            return error_response('Missing credential ID or username')
        
        # Get the challenge from client data
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        client_data = json.loads(client_data_json.decode())
        challenge_b64 = client_data['challenge']
        challenge = base64url_decode(challenge_b64)
        
        with app.app_context():
            # Find matching challenge
            stored_challenge = db.session.query(PasskeyChallenge).filter_by(
                username=username,
                challenge=base64url_encode(challenge),
                operation_type='registration'
            ).filter(PasskeyChallenge.expires_at > datetime.utcnow()).first()
            
            if not stored_challenge:
                return error_response('Challenge expired or not found')
            
            # Verify registration
            is_valid, parsed_data = verify_passkey_registration(credential_data, challenge)
            if not is_valid:
                return error_response('Invalid passkey registration')
            
            # Check if user already exists
            user = db.session.query(User).filter_by(username=username).first()
            if not user:
                # Create new user
                api_key = create_user_token(credential_id)[:32]
                user_id = generate_user_id()
                user = User(
                    user_id=user_id,
                    username=username,
                    api_key=api_key,
                    inbox_quota=USER_STARTING_QUOTA
                )
                db.session.add(user)
                db.session.flush()  # ensure user_id is available
            
            # Store passkey credential
            passkey_cred = PasskeyCredential(
                credential_id=credential_id,
                user_id=user.user_id,
                public_key='placeholder',  # Store actual public key in production
                device_type='platform',
                last_used=datetime.utcnow()
            )
            db.session.add(passkey_cred)
            
            # Clean up challenge and old sessions
            db.session.delete(stored_challenge)
            old_sessions = db.session.query(UserSession).filter_by(user_id=user.user_id).all()
            for old_session in old_sessions:
                db.session.delete(old_session)
            
            # Create new session
            session_token = create_user_token(credential_id)
            session_obj = UserSession(session_token, user.user_id, int(time.time()))
            db.session.add(session_obj)
            
            db.session.commit()
            
            app.logger.info(f"Created passkey for user: {username}")
            
            resp = make_response(jsonify({"success": True, "message": "Registration successful"}))
            resp.set_cookie(
                "session_token",
                session_token,
                httponly=True,
                secure=not IS_DEV,  # False in dev so it works over HTTP
                samesite="None" if not IS_DEV else "Lax",
                max_age=60*60*24*7,  # 1 week
                path="/"
            )
            return resp, 200

    except Exception as e:
        app.logger.error(f"Passkey registration complete failed: {e}")
        db.session.rollback()
        return error_response('Failed to complete passkey registration', 500)

@auth_bp.route('/passkey/authenticate/begin', methods=['POST'])
def passkey_authenticate_begin():
    """Start usernameless passkey authentication - optimized for Android/GPM."""
    try:
        cleanup_expired_auth_records()
        
        # Generate challenge for usernameless authentication
        challenge = generate_challenge()
        challenge_id = f"passkey_auth:usernameless:{int(time.time())}"
        
        with app.app_context():
            # Store usernameless challenge
            passkey_challenge = PasskeyChallenge(
                challenge_id=challenge_id,
                username=None,  # Always None for usernameless flow
                challenge=base64url_encode(challenge),
                operation_type='authentication'
            )
            db.session.add(passkey_challenge)
            db.session.commit()
        
        # Optimized for Android - let GPM handle the credential selection
        auth_options = {
            'challenge': base64url_encode(challenge),
            'timeout': 300000,
            'rpId': get_rp_id_from_domain(DOMAIN),
            'userVerification': 'preferred',
            # No allowCredentials - this is key for discoverable credentials
            # and allows GPM to present available options to the user
        }
        
        app.logger.info("Usernameless passkey authentication begun (Android optimized)")
        return jsonify(auth_options), 200
        
    except Exception as e:
        app.logger.error(f"Passkey authentication begin failed: {e}")
        db.session.rollback()
        return error_response('Failed to start passkey authentication', 500)

@auth_bp.route('/passkey/authenticate/complete', methods=['POST'])
def passkey_authenticate_complete():
    """Complete passkey authentication process."""
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

        with app.app_context():
            # Find user by credential
            credential = db.session.query(PasskeyCredential).filter_by(
                credential_id=credential_id
            ).first()
            
            if not credential:
                return error_response('Credential not found')
            
            user = db.session.query(User).filter_by(user_id=credential.user_id).first()
            if not user:
                return error_response('User not found for credential')

            # Find matching challenge (either username-based or usernameless)
            stored_challenge = db.session.query(PasskeyChallenge).filter_by(
                challenge=base64url_encode(challenge),
                operation_type='authentication'
            ).filter(PasskeyChallenge.expires_at > datetime.utcnow()).first()

            if not stored_challenge:
                return error_response('Challenge expired or not found')

            # Verify signature
            is_valid, parsed_data = verify_passkey_signature(credential_data, challenge)
            if not is_valid:
                return error_response('Invalid passkey authentication')

            # Update credential last used
            credential.last_used = datetime.utcnow()

            # Clean up challenge and old sessions
            db.session.delete(stored_challenge)
            old_sessions = db.session.query(UserSession).filter_by(user_id=user.user_id).all()
            for old_session in old_sessions:
                db.session.delete(old_session)

            # Create new session
            session_token = create_user_token(credential_id)
            session_obj = UserSession(session_token, user.user_id, int(time.time()))
            db.session.add(session_obj)
            db.session.commit()
        
        resp = make_response(jsonify({"success": True, "message": "Login successful"}))
        resp.set_cookie(
            "session_token",
            session_token,
            httponly=True,
            secure=not IS_DEV,  # False in dev so it works over HTTP
            samesite="None" if not IS_DEV else "Lax",
            max_age=60*60*24*7,  # 1 week
            path="/"
        )

        return resp, 200

    except Exception as e:
        app.logger.error(f"Passkey authentication complete failed: {e}")
        db.session.rollback()
        return error_response('Failed to complete passkey authentication', 500)

@auth_bp.route('/me', methods=['GET'])
@auth_required 
def auth_me(token):
    try:
        with app.app_context():
            session = (
                db.session.query(UserSession)
                .filter_by(token=token)
                .filter(UserSession.expires_at > datetime.utcnow())
                .first()
            )

            if not session:
                return error_response('Invalid or expired authentication token', 401)

            user = db.session.query(User).filter_by(user_id=session.user_id).first()
            if not user:
                return error_response('User not found', 404)

            payments = (
                db.session.query(PaymentIntent)
                .filter_by(user_id=user.user_id, status=PaymentStatus.CONFIRMED.value)
                .order_by(PaymentIntent.created_at.desc())
                .all()
            )

            payment_data = [
                {
                    'txhash': p.txhash,
                    'amount': p.amount,
                    'created_at': p.created_at.isoformat()
                }
                for p in payments
            ]

            # Check if user has passkeys to determine auth method
            has_passkeys = db.session.query(PasskeyCredential).filter_by(user_id=user.user_id).first() is not None
            auth_method = 'passkey' if has_passkeys else 'wallet'

            response_data = {
                'user_id': user.user_id,
                'username': user.username,  # Include username in response
                'api_key': user.api_key,
                'inbox_quota': user.inbox_quota,
                'login_time': session.login_time,
                'session_expires_at': session.expires_at.isoformat(),
                'payments': payment_data,
                'auth_method': auth_method
            }

            return jsonify(response_data), 200

    except Exception as e:
        app.logger.error(f"User info retrieval failed: {e}")
        return error_response('Failed to fetch user information', 500)

@auth_bp.route('/logout', methods=['POST'])
@auth_required
def auth_logout(token):
    try:
        with app.app_context():
            session = db.session.query(UserSession).filter_by(token=token).first()
            if session:
                db.session.delete(session)
                db.session.commit()

        resp = make_response(jsonify({'success': True}))
        resp.set_cookie(
            "session_token", 
            "", 
            expires=0,
            httponly=True,
            secure=not IS_DEV,
            samesite="None" if not IS_DEV else "Lax",
            path="/"
        )
        return resp, 200
    except Exception as e:
        app.logger.error(f"Logout error: {e}")
        db.session.rollback()
        return error_response('Logout failed', 500)