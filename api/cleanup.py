#!/usr/bin/env python3
"""
Delete messages older than 7 days.
Run via cron: 0 3 * * * /path/to/venv/bin/python /path/to/api/cleanup.py
"""
import sys
import time
import os

sys.path.insert(0, os.path.dirname(__file__))

from config import app, db
from db_models import Message

def delete_old_messages(days=7):
    cutoff = int(time.time()) - days * 24 * 3600
    with app.app_context():
        try:
            deleted = db.session.query(Message).filter(Message.timestamp < cutoff).delete()
            db.session.commit()
            print(f"Deleted {deleted} messages older than {days} days")
        except Exception as e:
            db.session.rollback()
            print(f"Cleanup failed: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == '__main__':
    delete_old_messages()
