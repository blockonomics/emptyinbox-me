from flask import Blueprint, request, jsonify
from datetime import datetime
import requests
import os

from cleanup_manager import DatabaseManager, db
from db_models import User, UserSession, PaymentIntent
from auth_utils import extract_apikey

FLASK_ENV = os.getenv('FLASK_ENV', 'production')

# Setup
url_prefix = '/payments'
if FLASK_ENV == 'development':
    url_prefix = '/api' + url_prefix

payments_bp = Blueprint('payments', __name__, url_prefix=url_prefix)
db_manager = DatabaseManager()

USDT_ADDRESS = os.getenv('USDT_RECEIVING_ADDRESS', '0x742d35Cc6634C0532925a3b8D9DDdB4D1f0B1b69')

def get_current_user():
    """Get current user from API key (not session token)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        if auth_header.startswith('Bearer '):
            api_key = auth_header[7:]
        else:
            api_key = auth_header

        if not api_key:
            return None

        user = db.session.query(User).filter_by(api_key=api_key).first()
        if not user:
            return None

        return user.eth_account

    except Exception:
        return None

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

@payments_bp.route('/monitor', methods=['POST'])
def monitor_transaction():
    current_user_eth = '0x5c0ed91604e92d7f488d62058293ce603bcc68ef'
    if not current_user_eth:
        return error_response("Unauthorized", 401)

    data = request.get_json()
    if not data:
        return error_response("No JSON data provided", 400)

    txhash = data.get('txhash')
    if not txhash:
        return error_response("Missing txhash", 400)

    match_callback = os.getenv('MATCH_CALLBACK')

    try:
        response = requests.post(
            "https://www.blockonomics.co/api/monitor_tx",
            headers={
                "Authorization": f"Bearer {os.getenv('BLOCKONOMICS_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "txhash": txhash,
                "match_callback": match_callback
            }
        )

        if response.status_code == 200:
            payment_intent = PaymentIntent(txhash=txhash, eth_account=current_user_eth)
            db.session.add(payment_intent)
            db.session.commit()
            return jsonify({"message": "Monitoring started"})
        else:
            return error_response(f"Blockonomics error: {response.text}", response.status_code)

    except Exception:
        db.session.rollback()
        return error_response("Internal server error", 500)

@payments_bp.route('/callback', methods=['GET'])
def blockonomics_callback():
    txhash = request.args.get('txhash')
    value = request.args.get('value')
    addr  = request.args.get('addr')

    if not txhash or not value or not addr:
        return error_response("Missing required fields", 400)

    if addr.lower() != USDT_ADDRESS.lower():
        return error_response("Address mismatch", 400)

    intent = db.session.query(PaymentIntent).filter_by(txhash=txhash).first()
    if not intent:
        return error_response("Payment intent not found", 404)

    user = db.session.query(User).filter_by(eth_account=intent.eth_account).first()
    if not user:
        return error_response("User not found", 404)

    quota_increment = (int(value) // 1_000_000) * 10
    user.inbox_quota += quota_increment
    db.session.commit()

    return jsonify({"message": "Callback processed"}), 200
