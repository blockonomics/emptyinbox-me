from flask import Blueprint, request, jsonify
from datetime import datetime
import requests
import os
from config import db

from constants import USDT_DECIMALS, QUOTA_PER_USDT
from db_models import User, UserSession, PaymentIntent, PaymentStatus
from auth_utils import extract_apikey

payments_bp = Blueprint('payments', __name__)

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

        return user.user_id

    except Exception:
        return None

def error_response(message: str, code: int = 400):
    return jsonify({'error': message}), code

@payments_bp.route('/monitor', methods=['POST'])
def monitor_transaction():
    current_user_id = get_current_user()
    if not current_user_id:
        return error_response("Unauthorized", 401)

    data = request.get_json()
    if not data:
        return error_response("No JSON data provided", 400)

    txhash = data.get('txhash')
    inbox_quota = data.get("quotaAmount")
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
                "crypto": "USDT",
                "match_callback": match_callback,
                "testnet": 1,
            }
        )

        if response.status_code == 200:
            payment_intent = PaymentIntent(txhash=txhash, user_id=current_user_id, amount=inbox_quota)
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
    txid = request.args.get('txid')
    value = request.args.get('value')
    addr  = request.args.get('addr')
    status = request.args.get('status')

    if not txid or not value or not addr or not status:
        return error_response("Missing required fields", 400)

    if status != PaymentStatus.CONFIRMED.value:
        return jsonify({"message": "The payment is not confirmed"}), 200

    if addr.lower() != USDT_ADDRESS.lower():
        return error_response("Address mismatch", 400)

    intent = db.session.query(PaymentIntent).filter_by(txhash=txid).first()
    if not intent:
        return error_response("Payment intent not found", 404)

    if intent.status == PaymentStatus.CONFIRMED.value:
        return jsonify({"message": "Payment already confirmed"}), 200

    user = db.session.query(User).filter_by(user_id=intent.user_id).first()
    if not user:
        return error_response("User not found", 404)
    
    user.inbox_quota += intent.amount

    intent.status = PaymentStatus.CONFIRMED.value
    db.session.commit()

    return jsonify({"message": "Callback processed"}), 200