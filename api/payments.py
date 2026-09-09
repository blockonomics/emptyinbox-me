from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import hmac
import math
import requests
import os
from sqlalchemy import func
from config import db, app

from constants import (
    USDT_DECIMALS, QUOTA_PER_USDT, BTC_DECIMALS, QUOTA_BUNDLES, DEFAULT_BUNDLE,
    QUOTE_TTL_MINUTES, UNDERPAYMENT_TOLERANCE, MAX_PROVISIONAL_INTENTS,
)
from db_models import (
    User, UserSession, PaymentIntent, PaymentStatus, BtcPaymentIntent, PaymentCallback,
)

payments_bp = Blueprint('payments', __name__)

USDT_ADDRESS = os.getenv('USDT_RECEIVING_ADDRESS', '0x742d35Cc6634C0532925a3b8D9DDdB4D1f0B1b69')
BLOCKONOMICS_API = 'https://www.blockonomics.co/api'


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


def blockonomics_headers():
    return {'Authorization': f"Bearer {os.getenv('BLOCKONOMICS_API_KEY')}"}


def check(r, what):
    """raise_for_status() drops the response body, which is where Blockonomics
    puts the reason. Keep it - it is the difference between "400 Bad Request"
    and "No matching store found for the given callback URL"."""
    if not r.ok:
        raise RuntimeError(f'{what} -> {r.status_code} {r.text[:500]}')
    return r


def btc_price_usd():
    """Price of 1 BTC in USD. Divide by this, never multiply."""
    r = requests.get(f'{BLOCKONOMICS_API}/price',
                     params={'currency': 'USD', 'crypto': 'BTC'}, timeout=15)
    check(r, 'price')
    return float(r.json()['price'])


def new_btc_address():
    """Derive a fresh receive address. Every call advances the xPub index, so
    callers must reuse an existing open intent rather than quoting twice."""
    match_callback = os.getenv('MATCH_CALLBACK')
    r = requests.post(f'{BLOCKONOMICS_API}/new_address',
                      params={'match_callback': match_callback, 'crypto': 'BTC'},
                      headers=blockonomics_headers(), timeout=15)
    check(r, f'new_address(match_callback={match_callback!r})')
    return r.json()['address']


@payments_bp.route('/config', methods=['GET'])
def get_payment_config():
    return jsonify({
        'receive_address': USDT_ADDRESS,
        'quota_per_usdt': QUOTA_PER_USDT,
    })


@payments_bp.route('/bundles', methods=['GET'])
def get_bundles():
    """Public price list. Agents read this before quoting."""
    return jsonify({
        'currency': 'USD',
        'default': DEFAULT_BUNDLE,
        'bundles': [
            {'id': name, 'quota': b['quota'], 'usd': b['usd']}
            for name, b in QUOTA_BUNDLES.items()
        ],
    })


@payments_bp.route('/quote', methods=['POST'])
def create_quote():
    """Quote a BTC price for a quota bundle and return a payment address.

    Idempotent per user: an unexpired, uncredited quote is returned again
    rather than deriving a second address."""
    current_user_id = get_current_user()
    if not current_user_id:
        return error_response('Unauthorized', 401)

    data = request.get_json(silent=True) or {}
    bundle_id = data.get('bundle', DEFAULT_BUNDLE)
    bundle = QUOTA_BUNDLES.get(bundle_id)
    if not bundle:
        return error_response(f"Unknown bundle. Choose one of: {', '.join(QUOTA_BUNDLES)}", 400)

    now = datetime.utcnow()

    # Zero-conf credit is provisional. Refuse to stack more of it on one user
    # than we are willing to lose to a replacement attack.
    outstanding = db.session.query(BtcPaymentIntent).filter_by(
        user_id=current_user_id, credited=True, settled=False, revoked=False).count()
    if outstanding >= MAX_PROVISIONAL_INTENTS:
        return error_response(
            'A previous payment is still awaiting confirmation. Retry once it settles.', 409)

    # Reuse an open quote for the same bundle instead of burning an address.
    existing = db.session.query(BtcPaymentIntent).filter(
        BtcPaymentIntent.user_id == current_user_id,
        BtcPaymentIntent.bundle == bundle_id,
        BtcPaymentIntent.credited.is_(False),
        BtcPaymentIntent.expires_at > now,
    ).first()
    if existing:
        return jsonify(quote_payload(existing)), 200

    try:
        price = btc_price_usd()
        address = new_btc_address()
    except Exception as e:
        app.logger.error(f'Quote failed: {e}')
        return error_response('Could not reach the payment provider', 502)

    expected = int(round(bundle['usd'] / price * BTC_DECIMALS))
    intent = BtcPaymentIntent(
        address=address,
        user_id=current_user_id,
        bundle=bundle_id,
        quota=bundle['quota'],
        usd_amount=bundle['usd'],
        expected_satoshis=expected,
        expires_at=now + timedelta(minutes=QUOTE_TTL_MINUTES),
    )
    db.session.add(intent)
    db.session.commit()

    app.logger.info(f'BTC quote {address} user={current_user_id} bundle={bundle_id} sats={expected}')
    return jsonify(quote_payload(intent)), 201


def quote_payload(intent: BtcPaymentIntent):
    btc = intent.expected_satoshis / BTC_DECIMALS
    return {
        'address': intent.address,
        'bundle': intent.bundle,
        'quota': intent.quota,
        'usd': intent.usd_amount,
        'amount_satoshis': intent.expected_satoshis,
        'amount_btc': f'{btc:.8f}',
        'bip21': f'bitcoin:{intent.address}?amount={btc:.8f}',
        'expires_at': intent.expires_at.isoformat() + 'Z',
        'status_url': f'/api/payments/status/{intent.address}',
    }


@payments_bp.route('/status/<address>', methods=['GET'])
def payment_status(address):
    """Poll a quote. Quota is granted at status 0 for non-replaceable
    transactions, so `quota_credited` can be true before `settled`."""
    current_user_id = get_current_user()
    if not current_user_id:
        return error_response('Unauthorized', 401)

    intent = db.session.query(BtcPaymentIntent).filter_by(address=address).first()
    if not intent or intent.user_id != current_user_id:
        return error_response('Quote not found', 404)

    return jsonify({
        'address': intent.address,
        'status': int(intent.status),
        'expected_satoshis': intent.expected_satoshis,
        'received_satoshis': intent.received_satoshis,
        'quota': intent.quota,
        'quota_credited': intent.credited and not intent.revoked,
        'settled': intent.settled,
        'revoked': intent.revoked,
        'txid': intent.txid,
        'expires_at': intent.expires_at.isoformat() + 'Z',
    }), 200


@payments_bp.route('/monitor', methods=['POST'])
def monitor_transaction():
    """Register a USDT transaction hash for tracking. Quota is derived from the
    on-chain value at callback time, never from the client."""
    current_user_id = get_current_user()
    if not current_user_id:
        return error_response("Unauthorized", 401)

    data = request.get_json()
    if not data:
        return error_response("No JSON data provided", 400)

    txhash = data.get('txhash')
    if not txhash:
        return error_response("Missing txhash", 400)

    try:
        response = requests.post(
            f"{BLOCKONOMICS_API}/monitor_tx",
            headers={
                "Authorization": f"Bearer {os.getenv('BLOCKONOMICS_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "txhash": txhash,
                "crypto": "USDT",
                "match_callback": os.getenv('MATCH_CALLBACK'),
                "testnet": 0,
            }
        )

        if response.status_code == 200:
            existing = db.session.query(PaymentIntent).filter_by(txhash=txhash).first()
            if not existing:
                db.session.add(PaymentIntent(txhash=txhash, user_id=current_user_id))
                db.session.commit()
            return jsonify({"message": "Monitoring started"})
        else:
            return error_response(f"Blockonomics error: {response.text}", response.status_code)

    except Exception:
        db.session.rollback()
        return error_response("Internal server error", 500)


def record_callback(txid, addr, status, value, crypto):
    """Insert the idempotency row. Returns False if this exact callback was
    already processed - Blockonomics retries, and sends one per status."""
    seen = db.session.query(PaymentCallback).filter_by(
        txid=txid, addr=addr, status=status).first()
    if seen:
        return False
    db.session.add(PaymentCallback(
        txid=txid, addr=addr, status=status, value=value, crypto=crypto))
    return True


def credit(user_id, quota):
    user = db.session.query(User).filter_by(user_id=user_id).first()
    if not user:
        app.logger.error(f'Cannot credit unknown user {user_id}')
        return False
    user.inbox_quota += quota
    return True


def received_at_address(addr):
    """Total received, derived from the callback ledger instead of accumulated
    in place. Each status repeats the same value for one transaction, so take a
    single value per txid; separate transactions to the address add up."""
    rows = (db.session.query(PaymentCallback.txid, func.max(PaymentCallback.value))
            .filter(PaymentCallback.addr == addr)
            .group_by(PaymentCallback.txid)
            .all())
    return sum(value or 0 for _, value in rows)


def claim_credit(intent):
    """Flip credited in a single conditional statement, so two callbacks racing
    on one address cannot both grant the quota. True for the caller that won."""
    updated = (db.session.query(BtcPaymentIntent)
               .filter(BtcPaymentIntent.address == intent.address,
                       BtcPaymentIntent.credited.is_(False))
               .update({'credited': True, 'credited_at': datetime.utcnow()},
                       synchronize_session='fetch'))
    return updated == 1


def handle_btc_callback(txid, addr, status, value, rbf_present):
    intent = (db.session.query(BtcPaymentIntent)
              .filter_by(address=addr).with_for_update().first())
    if not intent:
        # Money arrived at an address we derived but hold no intent for.
        app.logger.error(f'Unmatched BTC payment addr={addr} txid={txid} value={value}')
        return

    intent.received_satoshis = received_at_address(addr)
    intent.txid = txid
    intent.status = str(min(status, 2))

    if status >= 2:
        intent.settled = True

    tolerance = math.floor(intent.expected_satoshis * UNDERPAYMENT_TOLERANCE)
    if intent.received_satoshis < intent.expected_satoshis - tolerance:
        app.logger.error(
            f'Underpayment addr={addr} got={intent.received_satoshis} '
            f'want={intent.expected_satoshis}')
        return

    # A replaceable transaction can still be redirected away from us.
    if status == 0 and rbf_present:
        app.logger.info(f'RBF-flagged zero-conf payment addr={addr}, withholding credit')
        return

    if not intent.credited:
        if intent.expires_at < datetime.utcnow():
            # Honoured anyway - the sender parted with the coins. Logged because
            # the BTC price behind the quote is stale by now.
            app.logger.warning(
                f'Payment after quote expiry addr={addr} expired={intent.expires_at} '
                f'usd={intent.usd_amount}')
        if not claim_credit(intent):
            return                      # a concurrent callback got there first
        if not credit(intent.user_id, intent.quota):
            # Unknown user: fail the whole callback so the retry can settle it
            # rather than marking an intent credited that granted nothing.
            raise RuntimeError(f'Credit failed for intent {addr}')
        app.logger.info(
            f'Credited {intent.quota} inboxes to {intent.user_id} '
            f'addr={addr} status={status}')
    elif intent.revoked and status >= 2:
        # Clawed back as unconfirmed, then it confirmed after all.
        if credit(intent.user_id, intent.quota):
            intent.revoked = False
            app.logger.info(f'Re-credited revoked intent addr={addr} after confirmation')


def handle_usdt_callback(txid, addr, status, value):
    if addr.lower() != USDT_ADDRESS.lower():
        app.logger.error(f'USDT callback address mismatch: {addr}')
        return

    intent = db.session.query(PaymentIntent).filter_by(txhash=txid).first()
    if not intent:
        app.logger.error(f'USDT payment with no registered intent txid={txid}')
        return

    # USDT has no per-order address, so zero-conf cannot be attributed safely.
    if status < 2 or intent.status == PaymentStatus.CONFIRMED.value:
        return

    quota = int(value / USDT_DECIMALS * QUOTA_PER_USDT)
    if quota <= 0:
        app.logger.error(f'USDT payment below one inbox txid={txid} value={value}')
        return

    if credit(intent.user_id, quota):
        intent.amount = quota
        intent.status = PaymentStatus.CONFIRMED.value
        app.logger.info(f'Credited {quota} inboxes to {intent.user_id} txid={txid}')


@payments_bp.route('/callback', methods=['GET'])
def blockonomics_callback():
    """Blockonomics payment callback: GET, query params, shared secret in the
    URL. There is no signature header."""
    expected_secret = os.getenv('BLOCKONOMICS_CALLBACK_SECRET', '')
    provided = request.args.get('secret', '')
    if not expected_secret or not hmac.compare_digest(provided, expected_secret):
        return error_response('Forbidden', 403)

    txid = request.args.get('txid')
    value = request.args.get('value')
    addr = request.args.get('addr')
    status = request.args.get('status')

    if not txid or value is None or not addr or status is None:
        return error_response('Missing required fields', 400)

    try:
        status_i = int(status)
        value_i = int(value)
    except ValueError:
        return error_response('Malformed status or value', 400)

    crypto = request.args.get('crypto') or 'BTC'   # absence means BTC
    rbf_present = 'rbf' in request.args

    try:
        if not record_callback(txid, addr, str(min(status_i, 2)), value_i, crypto):
            return jsonify({'message': 'Already processed'}), 200

        if crypto == 'USDT':
            handle_usdt_callback(txid, addr, status_i, value_i)
        else:
            handle_btc_callback(txid, addr, status_i, value_i, rbf_present)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Callback processing failed txid={txid} addr={addr}: {e}')
        return error_response('Internal server error', 500)

    return jsonify({'message': 'Callback processed'}), 200
