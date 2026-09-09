#!/usr/bin/env python3
"""
Claw back zero-confirmation quota that never confirmed.

Quota is credited at status 0 so agents get an inbox immediately. A sender can
still replace that transaction, so the credit stays provisional until the
callback reports status >= 2. Anything still unsettled after
PROVISIONAL_TTL_HOURS is revoked here.

Run via cron: 0 * * * * /path/to/venv/bin/python /path/to/api/reconcile.py
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from config import app, db
from db_models import BtcPaymentIntent, User
from constants import PROVISIONAL_TTL_HOURS


def revoke_stale_credits():
    cutoff = datetime.utcnow() - timedelta(hours=PROVISIONAL_TTL_HOURS)
    revoked = 0

    with app.app_context():
        stale = db.session.query(BtcPaymentIntent).filter(
            BtcPaymentIntent.credited.is_(True),
            BtcPaymentIntent.settled.is_(False),
            BtcPaymentIntent.revoked.is_(False),
            BtcPaymentIntent.credited_at < cutoff,
        ).all()

        for intent in stale:
            user = db.session.query(User).filter_by(user_id=intent.user_id).first()
            if user:
                # Quota may already be spent; never push a user negative.
                user.inbox_quota = max(0, user.inbox_quota - intent.quota)
            intent.revoked = True
            revoked += 1
            print(f'Revoked {intent.quota} inboxes from {intent.user_id} '
                  f'addr={intent.address} txid={intent.txid}')

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f'Reconcile failed: {e}', file=sys.stderr)
            sys.exit(1)

    print(f'Revoked {revoked} unconfirmed credits older than {PROVISIONAL_TTL_HOURS}h')


if __name__ == '__main__':
    revoke_stale_credits()
