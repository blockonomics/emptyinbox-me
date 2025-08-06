from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import logging

from cleanup_manager import DatabaseManager, db
from db_models import PaymentRequest, User, UserSession
from auth_utils import extract_apikey

# Setup
url_prefix = '/payments'
if os.getenv('FLASK_ENV') == 'development':
    url_prefix = '/api' + url_prefix

payments_bp = Blueprint('payments', __name__, url_prefix=url_prefix)
db_manager = DatabaseManager()
logger = logging.getLogger(__name__)

# Your USDT receiving address (set in environment)
USDT_ADDRESS = os.getenv('USDT_RECEIVING_ADDRESS', '0x742d35Cc6634C0532925a3b8D9DDdB4D1f0B1b69')

def get_current_user():
    """Get current user from API key (not session token)"""
    try:        
        api_key = extract_apikey(request.headers.get('Authorization'))

        if not api_key:
            logger.error("No API key found in request headers")
            return None
        
        # Query user by API key instead of session token
        user = db.session.query(User).filter_by(api_key=api_key).first()
        return user.eth_account if user else None
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return None

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

@payments_bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify blueprint is working"""
    return jsonify({'message': 'Payments blueprint is working!'}), 200


@payments_bp.route('/create', methods=['POST'])
def create_payment():
    """Create payment request"""
    try:
        user_address = get_current_user()
        if not user_address:
          return error_response(f'Authentication required: {user_address}', 401)

        data = request.get_json()
        if not data:
            return error_response('No JSON data provided')
            
        amount_usdt = float(data.get('amount_usdt', 0))
        
        if amount_usdt <= 0:
            return error_response('Invalid amount')
        
        # Create payment without db_manager context
        payment = PaymentRequest(user_address, amount_usdt)
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'payment_id': payment.id,
            'amount_usdt': payment.amount_usdt,
            'quota_to_add': payment.quota_purchased,
            'recipient_address': USDT_ADDRESS,
            'expires_at': payment.expires_at.isoformat(),
            'message': f'Send {amount_usdt} USDT to {USDT_ADDRESS}'
        }), 201
        
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        try:
            db.session.rollback()
        except:
            pass
        return error_response(f'Failed to create payment: {e}', 500)

@payments_bp.route('/verify', methods=['POST'])
def verify_payment():
    """Verify payment with transaction hash"""
    try:
        user_address = get_current_user()
        if not user_address:
            return error_response('Authentication required', 401)
        
        data = request.get_json()
        if not data:
            return error_response('No JSON data provided')
            
        payment_id = data.get('payment_id')
        tx_hash = data.get('tx_hash')
        
        if not payment_id or not tx_hash:
            return error_response('Payment ID and transaction hash required')
        
        # Query without db_manager context
        payment = db.session.query(PaymentRequest).filter_by(
            id=payment_id,
            user_address=user_address,
            status='pending'
        ).first()
        
        if not payment:
            return error_response('Payment not found')
        
        if payment.expires_at < datetime.utcnow():
            payment.status = 'expired'
            db.session.commit()
            return error_response('Payment expired')
        
        # Mark as completed
        payment.status = 'completed'
        payment.tx_hash = tx_hash
        payment.completed_at = datetime.utcnow()
        
        # Add quota to user
        user = db.session.query(User).filter_by(eth_account=user_address).first()
        if user:
            user.inbox_quota += payment.quota_purchased
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'quota_added': payment.quota_purchased,
            'new_quota': user.inbox_quota if user else 0
        }), 200
        
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        try:
            db.session.rollback()
        except:
            pass
        return error_response('Verification failed', 500)

@payments_bp.route('/status/<payment_id>', methods=['GET'])
def payment_status(payment_id):
    """Get payment status"""
    user_address = get_current_user()
    if not user_address:
        return error_response('Authentication required', 401)
    
    try:
        # Remove this line: with db_manager.app.app_context():
        payment = db.session.query(PaymentRequest).filter_by(
            id=payment_id,
            user_address=user_address
        ).first()
        
        if not payment:
            return error_response('Payment not found', 404)
        
        return jsonify({
            'payment_id': payment.id,
            'status': payment.status,
            'amount_usdt': payment.amount_usdt,
            'quota_purchased': payment.quota_purchased,
            'tx_hash': payment.tx_hash,
            'created_at': payment.created_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return error_response('Failed to get status', 500)