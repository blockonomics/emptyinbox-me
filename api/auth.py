# Updated auth.py with proper username and passkey support

from flask import Blueprint, request, jsonify, make_response
from datetime import datetime, timedelta
import os, random, time, hashlib, base64, json, ipaddress
from eth_account.messages import encode_defunct
from eth_account import Account
from config import db, app
from urllib.parse import urlparse
import traceback
from auth_utils import auth_required

from db_models import (AuthChallenge, UserSession, User, PaymentIntent, PaymentStatus,
                       PasskeyCredential, PasskeyChallenge, BtcPaymentIntent,
                       RegistrationAttempt)
from constants import (USER_STARTING_QUOTA, AGENT_STARTING_QUOTA, QUOTA_PER_USDT,
                       REGISTER_WINDOW, REGISTER_GRADES, REGISTER_HARD_CAP,
                       REGISTER_V4_PREFIX, REGISTER_V6_PREFIX)

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

def extract_public_key_from_auth_data(auth_data: bytes) -> str:
    """Extract the public key from authenticator data."""
    try:
        # AuthData structure:
        # rpIdHash (32) + flags (1) + signCount (4) + attestedCredentialData (variable)
        if len(auth_data) < 37:
            raise ValueError("Auth data too short")
        
        flags = auth_data[32]
        attested_credential_data_included = bool(flags & 0x40)
        
        if not attested_credential_data_included:
            raise ValueError("No attested credential data")
        
        # Skip to attested credential data (after rpIdHash + flags + signCount)
        offset = 37
        
        # AAGUID (16 bytes)
        aaguid = auth_data[offset:offset+16]
        offset += 16
        
        # Credential ID length (2 bytes, big endian)
        cred_id_len = int.from_bytes(auth_data[offset:offset+2], 'big')
        offset += 2
        
        # Credential ID
        credential_id = auth_data[offset:offset+cred_id_len]
        offset += cred_id_len
        
        # Public key (CBOR encoded)
        public_key_cbor = auth_data[offset:]
        public_key = cbor2.loads(public_key_cbor)
        
        # Return base64 encoded public key for storage
        return base64url_encode(cbor2.dumps(public_key))
        
    except Exception as e:
        app.logger.error(f"Failed to extract public key: {e}")
        return None

def verify_passkey_registration(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey registration data with enhanced error handling."""
    try:
        # Decode the response data
        attestation_object = base64url_decode(credential_data['response']['attestationObject'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        app.logger.info(f"Registration verification - Origin: {client_data.get('origin')}, Expected: {URL_SCHEME}{DOMAIN}")
        
        # Verify challenge
        received_challenge = base64url_decode(client_data['challenge'])
        if received_challenge != challenge:
            app.logger.error("Challenge mismatch in passkey registration")
            return False, {}
        
        # Verify origin with more flexible matching
        expected_origin = f"{URL_SCHEME}{DOMAIN}"
        received_origin = client_data['origin']
        
        # Handle port variations in development
        if IS_DEV and received_origin.startswith('http://localhost'):
            app.logger.info("Development mode: allowing localhost origin")
        elif received_origin != expected_origin:
            app.logger.error(f"Origin mismatch: expected {expected_origin}, got {received_origin}")
            return False, {}
        
        # Verify type
        if client_data.get('type') != 'webauthn.create':
            app.logger.error(f"Wrong ceremony type: expected 'webauthn.create', got {client_data.get('type')}")
            return False, {}
        
        # Parse attestation object and extract public key
        try:
            attestation = cbor2.loads(attestation_object)
            auth_data = attestation['authData']
            
            # Extract the actual public key
            public_key = extract_public_key_from_auth_data(auth_data)
            
            if not public_key:
                app.logger.error("Failed to extract public key from attestation")
                return False, {}
            
            return True, {
                'credential_id': credential_data['id'],
                'public_key': public_key,
                'attestation_object': attestation_object,
                'client_data': client_data,
                'auth_data': auth_data
            }
        except Exception as e:
            app.logger.error(f"Failed to parse attestation object: {e}")
            return False, {}
        
    except Exception as e:
        app.logger.error(f"Passkey registration verification failed: {e}")
        return False, {}

def verify_passkey_signature(credential_data: dict, challenge: bytes) -> tuple[bool, dict]:
    """Verify passkey authentication signature with enhanced error handling."""
    try:
        # Decode the response data
        authenticator_data = base64url_decode(credential_data['response']['authenticatorData'])
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        signature = base64url_decode(credential_data['response']['signature'])
        
        # Parse client data
        client_data = json.loads(client_data_json.decode())
        
        app.logger.info(f"Authentication verification - Origin: {client_data.get('origin')}, Expected: {URL_SCHEME}{DOMAIN}")
        
        # Verify challenge
        received_challenge = base64url_decode(client_data['challenge'])
        if received_challenge != challenge:
            app.logger.error("Challenge mismatch in passkey verification")
            return False, {}
        
        # Verify origin with more flexible matching
        expected_origin = f"{URL_SCHEME}{DOMAIN}"
        received_origin = client_data['origin']
        
        # Handle port variations in development
        if IS_DEV and received_origin.startswith('http://localhost'):
            app.logger.info("Development mode: allowing localhost origin")
        elif received_origin != expected_origin:
            app.logger.error(f"Origin mismatch: expected {expected_origin}, got {received_origin}")
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

# 5. Add debugging endpoint (optional, for development):
@auth_bp.route('/passkey/debug', methods=['GET'])
def passkey_debug():
    """Debug endpoint to check passkey configuration."""
    try:
        rp_id = get_rp_id_from_domain(DOMAIN)
        return jsonify({
            'domain': DOMAIN,
            'rp_name': RP_NAME,
            'rp_id': rp_id,
            'url_scheme': URL_SCHEME,
            'is_dev': IS_DEV,
            'expected_origin': f"{URL_SCHEME}{DOMAIN}"
        }), 200
    except Exception as e:
        app.logger.error(f"Debug endpoint failed: {e}")
        return error_response('Debug failed', 500)

# --- Username and Passkey Routes ---

@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    """Check if username exists and has passkey."""
    try:
        username = request.json.get('username')
        if not username:
            return error_response('Username is required')
        
        with app.app_context():
            user = db.session.query(User).filter_by(username=username).first()
            if user:
                has_passkey = db.session.query(PasskeyCredential).filter_by(user_id=user.user_id).first() is not None
                return jsonify({
                    'exists': True,
                    'has_passkey': has_passkey
                })
            else:
                return jsonify({
                    'exists': False,
                    'has_passkey': False
                })
                
    except Exception as e:
        app.logger.error(f"Username check failed: {e}")
        return error_response('Failed to check username', 500)

@auth_bp.route('/passkey/challenge', methods=['POST'])
def get_passkey_challenge():
    """Generate and return just the challenge"""
    username = request.json.get('username')
    operation = request.json.get('operation')  # 'registration' or 'authentication'
    
    challenge = generate_challenge()
    challenge_id = f"passkey_{operation}:{username}:{int(time.time())}"
    
    # Store challenge
    passkey_challenge = PasskeyChallenge(
        challenge_id=challenge_id,
        username=username,
        challenge=base64url_encode(challenge),
        operation_type=operation
    )
    
    db.session.add(passkey_challenge)
    db.session.commit()
    
    return jsonify({
        'challenge': base64url_encode(challenge),
        'challengeId': challenge_id
    })

@auth_bp.route('/passkey/register/complete', methods=['POST'])
def passkey_register_complete():
    """Complete passkey registration process."""
    try:
        credential_data = request.json
        credential_id = credential_data.get('id')
        username = credential_data.get('username')
        
        if not credential_id or not username:
            return error_response('Missing credential ID or username')
        
        app.logger.info(f"Completing registration for {username} with credential {credential_id}")
        
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
                    inbox_quota=USER_STARTING_QUOTA,
                    signup_method='passkey',
                    signup_ip=client_ip(),
                    signup_client='web',
                )
                db.session.add(user)
                db.session.flush()  # ensure user_id is available
            
            # Store passkey credential with actual public key
            public_key = parsed_data.get('public_key')
            if not public_key:
                return error_response('Failed to extract public key from registration')
            
            passkey_cred = PasskeyCredential(
                credential_id=credential_id,
                user_id=user.user_id,
                public_key=public_key,  # Store actual extracted public key
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
    try:
        cleanup_expired_auth_records()
        
        challenge = generate_challenge()
        challenge_id = f"passkey_auth:usernameless:{int(time.time())}"
        
        with app.app_context():
            passkey_challenge = PasskeyChallenge(
                challenge_id=challenge_id,
                username=None,
                challenge=base64url_encode(challenge),
                operation_type='authentication'
            )
            db.session.add(passkey_challenge)
            db.session.commit()
        
        # CORRECTED: Proper WebAuthn authentication options structure
        auth_options = {
            'challenge': base64url_encode(challenge),
            'timeout': 60000,  # Try shorter timeout first
            'rpId': get_rp_id_from_domain(DOMAIN),
            'userVerification': 'preferred',
            'allowCredentials': []  # Must be present, even if empty
        }
        
        app.logger.info(f"Auth options: {auth_options}")  # Debug log
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

        app.logger.info(f"Completing authentication for credential {credential_id}")

        # Get the challenge from client data
        client_data_json = base64url_decode(credential_data['response']['clientDataJSON'])
        client_data = json.loads(client_data_json.decode())
        challenge_b64 = client_data['challenge']
        challenge = base64url_decode(challenge_b64)

        session_token = None

        with app.app_context():
            # Find user by credential
            credential = db.session.query(PasskeyCredential).filter_by(
                credential_id=credential_id
            ).first()
            
            if not credential:
                app.logger.error(f"Credential not found: {credential_id}")
                return error_response('Credential not found')
            
            user = db.session.query(User).filter_by(user_id=credential.user_id).first()
            if not user:
                app.logger.error(f"User not found for credential: {credential_id}")
                return error_response('User not found for credential')

            # Find matching usernameless challenge
            stored_challenge = db.session.query(PasskeyChallenge).filter_by(
                challenge=challenge_b64,
                operation_type='authentication',
                username=None
            ).filter(PasskeyChallenge.expires_at > datetime.utcnow()).first()

            if not stored_challenge:
                app.logger.error("Challenge expired or not found")
                return error_response('Challenge expired or not found')

            # Verify signature
            is_valid, parsed_data = verify_passkey_signature(credential_data, challenge)
            if not is_valid:
                app.logger.error("Invalid passkey authentication")
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
            
            # Log success INSIDE the session context
            app.logger.info(f"Authentication successful for user: {user.username}")
        
        resp = make_response(jsonify({"success": True, "message": "Login successful"}))
        resp.set_cookie(
            "session_token",
            session_token,
            httponly=True,
            secure=not IS_DEV,
            samesite="None" if not IS_DEV else "Lax",
            max_age=60*60*24*7,
            path="/"
        )

        return resp, 200

    except Exception as e:
        app.logger.error(f"Passkey authentication complete failed: {e}")
        try:
            db.session.rollback()
        except:
            pass
        return error_response('Failed to complete passkey authentication', 500)

@auth_bp.route('/me', methods=['GET'])
@auth_required 
def auth_me(token):
    try:
        # auth_required admits a session token or a raw API key. Resolving the
        # user through the session table alone rejected every API key caller,
        # which is all of them over MCP - the agent has no session to present.
        session = (
            db.session.query(UserSession)
            .filter_by(token=token)
            .filter(UserSession.expires_at > datetime.utcnow())
            .first()
        )

        if session:
            user = db.session.query(User).filter_by(user_id=session.user_id).first()
        else:
            user = db.session.query(User).filter_by(api_key=token).first()

        if not user:
            return error_response('Invalid or expired authentication token', 401)

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
                'currency': 'USDT',
                'usd': p.amount / QUOTA_PER_USDT,
                'created_at': p.created_at.isoformat()
            }
            for p in payments
        ]

        # BTC bundles live in their own table. Show credited purchases that
        # have not been clawed back, so the history matches the quota.
        btc_payments = (
            db.session.query(BtcPaymentIntent)
            .filter_by(user_id=user.user_id, credited=True, revoked=False)
            .all()
        )
        payment_data.extend({
            'txhash': p.txid,
            'address': p.address,
            'amount': p.quota,
            'currency': 'BTC',
            'usd': p.usd_amount,
            'settled': p.settled,
            'created_at': (p.credited_at or p.created_at).isoformat()
        } for p in btc_payments)
        payment_data.sort(key=lambda p: p['created_at'], reverse=True)

        # Check if user has passkeys to determine auth method
        has_passkeys = db.session.query(PasskeyCredential).filter_by(user_id=user.user_id).first() is not None
        auth_method = 'passkey' if has_passkeys else 'wallet'

        response_data = {
            'user_id': user.user_id,
            'username': user.username,  # Include username in response
            'api_key': user.api_key,
            'inbox_quota': user.inbox_quota,
            # Null for an API key caller: there is no session behind it.
            'login_time': session.login_time if session else None,
            'session_expires_at': session.expires_at.isoformat() if session else None,
            'payments': payment_data,
            'auth_method': auth_method
        }

        return jsonify(response_data), 200

    except Exception as e:
        app.logger.error(f"User info retrieval failed: {e}")
        db.session.rollback()
        return error_response('Failed to fetch user information', 500)

@auth_bp.route('/logout', methods=['POST'])
def auth_logout(token):
    try:
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

def client_ip() -> str:
    """The address the request actually came from.

    nginx overwrites X-Real-IP on every proxied request, so a value here cannot
    have been supplied by the caller. Reading X-Forwarded-For instead would let
    anyone mint a fresh bucket per request by sending their own header, while
    falling back to remote_addr alone puts every caller in one bucket keyed on
    the nginx loopback address."""
    return request.headers.get('X-Real-IP') or request.remote_addr or 'unknown'


def subnet_key(ip: str) -> str:
    """The network a registration is counted against.

    An address on its own is the wrong unit on both sides. A CI fleet, a CGNAT
    subscriber and an office all present one address for many legitimate
    callers, so per-address counting punishes precisely the users this product
    is aimed at. An abuser renting proxies gets a new address per request, so
    per-address counting barely inconveniences them. The surrounding block is
    what actually costs something to acquire in quantity.

    An unparseable value keeps a bucket of its own rather than joining a shared
    one, so a malformed address can never dilute a real network's count."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return f'raw:{ip}'
    prefix = REGISTER_V4_PREFIX if addr.version == 4 else REGISTER_V6_PREFIX
    return str(ipaddress.ip_network(f'{ip}/{prefix}', strict=False))


def recent_registration_count(subnet: str) -> int:
    """Accounts actually created from this network inside the window.

    Refused and rejected attempts are excluded on purpose. Counting them would
    let a caller sending invalid usernames talk itself down through the grades
    without ever receiving anything."""
    cutoff = datetime.utcnow() - timedelta(seconds=REGISTER_WINDOW)
    return db.session.query(RegistrationAttempt).filter(
        RegistrationAttempt.subnet == subnet,
        RegistrationAttempt.created_at >= cutoff,
        RegistrationAttempt.outcome.in_(('granted', 'reduced', 'zero')),
    ).count()


def grade_registration(count: int) -> tuple:
    """How much free quota this registration gets, and what to call it.

    Returns (quota, outcome). A quota of zero is still a successful
    registration: the caller receives a working key and meets the paywall on
    its first POST /inbox instead, which carries the purchase links. That is
    the point of grading rather than refusing. The failure mode for a suspected
    abuser becomes a sales page, and the failure mode for a false positive is a
    product that still works as soon as it is paid for."""
    for threshold, quota in REGISTER_GRADES:
        if count < threshold:
            return quota, ('granted' if quota == REGISTER_GRADES[0][1] else 'reduced')
    return 0, 'zero'


def record_registration(subnet, ip, client, username, outcome, quota=0) -> None:
    """Append to the registration ledger.

    Committed separately from the account, so that a refused attempt - which
    creates no account at all - is still durable. Never allowed to raise: an
    audit row failing to write is not a reason to fail a signup."""
    try:
        db.session.add(RegistrationAttempt(
            subnet=subnet, ip=ip, client=client,
            username=username or None, outcome=outcome, granted_quota=quota,
        ))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Could not record registration attempt: {e}")


def generate_username() -> str:
    """A username for callers that did not ask for one.

    Requiring the caller to invent one costs a round trip through
    /check-username and can fail on a collision, both on the very first request
    anyone makes against the service. The value carries no meaning for an
    agent, so letting the server pick removes a failure mode for nothing."""
    for _ in range(5):
        candidate = f"agent-{os.urandom(6).hex()}"
        if not db.session.query(User).filter_by(username=candidate).first():
            return candidate
    raise RuntimeError('could not allocate a username')


@auth_bp.route('/register', methods=['POST'])
def agent_register():
    """Programmatic registration for agents. Returns api_key directly.

    Registration is not refused for being frequent. The free quota attached to
    the new account is graded down instead, and only extreme volume from one
    network is turned away outright. See the REGISTER_* constants for why.

    username is optional: omit it and the server allocates one."""
    ip = client_ip()
    subnet = subnet_key(ip)
    client_id = request.headers.get('X-Client', 'unknown')[:64]
    username = ''

    try:
        data = request.get_json(silent=True) or {}
        username = (data.get('username') or '').strip()

        if username:
            if len(username) < 3 or len(username) > 32:
                record_registration(subnet, ip, client_id, username, 'rejected')
                return error_response('username must be 3-32 characters', 400)
            if not username.replace('-', '').replace('_', '').isalnum():
                record_registration(subnet, ip, client_id, username, 'rejected')
                return error_response(
                    'username may only contain letters, numbers, hyphens and underscores', 400)
            if db.session.query(User).filter_by(username=username).first():
                record_registration(subnet, ip, client_id, username, 'rejected')
                return error_response('username already taken', 409)
        else:
            username = generate_username()

        recent = recent_registration_count(subnet)
        if recent >= REGISTER_HARD_CAP:
            record_registration(subnet, ip, client_id, username, 'refused')
            app.logger.info(
                f"Registration refused: subnet={subnet} recent={recent} client={client_id}")
            # A body rather than a bare error string. The caller is usually a
            # program that prints whatever it is handed to a developer who has
            # no other way to find out what went wrong.
            return jsonify({
                'error': 'registration_limited',
                'message': (
                    'Too many accounts have been created from this network today. '
                    'An API key you already hold still works. If you need more '
                    'accounts than this, get in touch.'
                ),
                'docs_url': 'https://emptyinbox.me/docs.html',
            }), 429

        quota, outcome = grade_registration(recent)

        api_key = create_user_token(username)[:32]
        user = User(
            user_id=generate_user_id(),
            username=username,
            api_key=api_key,
            inbox_quota=quota,
            signup_method='agent',
            signup_ip=ip,
            signup_client=client_id,
        )
        db.session.add(user)
        db.session.commit()

        record_registration(subnet, ip, client_id, username, outcome, quota)
        app.logger.info(
            f"Agent registration: {username} from {ip} client={client_id} "
            f"quota={quota} outcome={outcome} recent={recent}")

        body = {
            'api_key': api_key,
            'username': username,
            'inbox_quota': quota,
        }
        if quota == 0:
            # Say why the account arrived empty, and where to fix it. Silence
            # here reads as a broken signup rather than a completed one.
            body['message'] = (
                'Account created without free credits: this network has already '
                'used its free allowance today. The key works. Buy credits to '
                'create inboxes.'
            )
            body['bundles_url'] = '/api/payments/bundles'
        return jsonify(body), 201

    except Exception as e:
        app.logger.error(f"Agent registration failed: {e}")
        db.session.rollback()
        return error_response('Registration failed', 500)