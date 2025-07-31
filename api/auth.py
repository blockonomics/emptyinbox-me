from flask import Blueprint, request, jsonify
import redis
import os
import json
import random
import time
import hashlib
import logging
from eth_account.messages import encode_defunct
from eth_account import Account

# Create blueprint for auth routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Redis connection
redis_client = redis.Redis(host='localhost')
DOMAIN = os.getenv('DOMAIN')

# Configure logging
logger = logging.getLogger(__name__)

def generate_nonce():
    """Generate a random nonce for authentication challenges"""
    return str(random.randint(100000000, 999999999))

def create_auth_message(address, nonce):
    """Create SIWE-style authentication message"""
    timestamp = int(time.time())
    message = f"""EmptyInbox.me wants you to sign in with your Ethereum account:
{address}

I accept the EmptyInbox.me Terms of Service: https://{DOMAIN}/tos

URI: https://{DOMAIN}
Version: 1
Chain ID: 1
Nonce: {nonce}
Issued At: {timestamp}"""
    
    return message, timestamp

def verify_signature(message, signature, expected_address):
    """Verify that the signature matches the expected address"""
    try:
        # Encode the message for verification
        message_hash = encode_defunct(text=message)
        
        # Recover the address from the signature
        recovered_address = Account.recover_message(message_hash, signature=signature)
        
        # Compare addresses (case insensitive)
        return recovered_address.lower() == expected_address.lower()
    except Exception as e:
        logger.error(f"Signature verification failed: {str(e)}")
        return False

def create_user_token(address):
    """Create a secure token for the authenticated user"""
    timestamp = str(int(time.time()))
    token_data = f"{address}:{timestamp}:{random.randint(100000, 999999)}"
    return hashlib.sha256(token_data.encode()).hexdigest()

@auth_bp.route('/challenge', methods=['POST'])
def auth_challenge():
    """Generate authentication challenge for wallet sign-in"""
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address:
            return {'error': 'Wallet address is required'}, 400
        
        # Validate Ethereum address format
        if not address.startswith('0x') or len(address) != 42:
            return {'error': 'Invalid Ethereum address format'}, 400
        
        # Generate nonce and message
        nonce = generate_nonce()
        message, timestamp = create_auth_message(address, nonce)
        
        # Store challenge temporarily (expires in 5 minutes)
        challenge_key = f"challenge:{address}:{nonce}"
        challenge_data = {
            'message': message,
            'timestamp': timestamp,
            'address': address,
            'nonce': nonce
        }
        
        redis_client.setex(challenge_key, 300, json.dumps(challenge_data))
        
        return {
            'message': message,
            'nonce': nonce
        }, 200
        
    except Exception as e:
        logger.error(f"Challenge generation failed: {str(e)}")
        return {'error': 'Failed to generate challenge'}, 500

@auth_bp.route('/verify', methods=['POST'])
def auth_verify():
    """Verify wallet signature and create user session"""
    try:
        data = request.get_json()
        address = data.get('address')
        signature = data.get('signature')
        message = data.get('message')
        
        if not all([address, signature, message]):
            return {'error': 'Address, signature, and message are required'}, 400
        
        # Extract nonce from message
        lines = message.split('\n')
        nonce_line = next((line for line in lines if line.startswith('Nonce:')), None)
        if not nonce_line:
            return {'error': 'Invalid message format'}, 400
        
        nonce = nonce_line.split(': ')[1]
        challenge_key = f"challenge:{address}:{nonce}"
        
        # Verify challenge exists and hasn't expired
        if not redis_client.exists(challenge_key):
            return {'error': 'Challenge expired or invalid'}, 400
        
        challenge_data = json.loads(redis_client.get(challenge_key))
        
        # Verify the message matches what we sent
        if challenge_data['message'] != message:
            return {'error': 'Message mismatch'}, 400
        
        # Verify signature
        if not verify_signature(message, signature, address):
            return {'error': 'Invalid signature'}, 401
        
        # Clean up used challenge
        redis_client.delete(challenge_key)
        
        # Create user session token
        user_token = create_user_token(address)
        
        # Store user session (expires in 30 days)
        user_data = {
            'address': address,
            'login_time': int(time.time())
        }
        redis_client.setex(f"user:{user_token}", 2592000, json.dumps(user_data))
        
        return {
            'success': True,
            'token': user_token,
            'address': address
        }, 200
        
    except Exception as e:
        logger.error(f"Signature verification failed: {str(e)}")
        return {'error': 'Authentication failed'}, 500

@auth_bp.route('/me', methods=['GET'])
def auth_me():
    """Get current user information"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {'error': 'Authentication required'}, 401
        
        user_token = auth_header.split(' ')[1]
        
        if not redis_client.exists(f"user:{user_token}"):
            return {'error': 'Invalid authentication token'}, 401
        
        user_data = json.loads(redis_client.get(f"user:{user_token}"))
        
        return {
            'address': user_data['address'],
            'login_time': user_data['login_time']
        }, 200
        
    except Exception as e:
        logger.error(f"Get user info failed: {str(e)}")
        return {'error': 'Failed to get user information'}, 500

@auth_bp.route('/logout', methods=['POST'])
def auth_logout():
    """Logout user and invalidate session"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {'error': 'No authentication token provided'}, 401
        
        user_token = auth_header.split(' ')[1]
        
        # Clean up user session
        if redis_client.exists(f"user:{user_token}"):
            redis_client.delete(f"user:{user_token}")
        
        return {'success': True}, 200
        
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        return {'error': 'Logout failed'}, 500