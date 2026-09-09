#!/usr/bin/env python3
"""
Delete messages older than 7 days.
Run via cron: 0 3 * * * /path/to/venv/bin/python /path/to/api/cleanup.py

Deletes in batches so the SQLite write lock is released between chunks and
inbound mail from postfix is not blocked for the length of the whole purge.
VACUUM afterwards, because SQLite keeps freed pages on its freelist and the
database file never shrinks on its own.
"""
import argparse
import sys
import time
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text

from config import app, db
from db_models import Message

BATCH_SIZE = 1000

# Matches the SQLAlchemy-generated name for Message.timestamp's index, so a
# later create_all() sees it as already present.
TIMESTAMP_INDEX_DDL = (
    "CREATE INDEX IF NOT EXISTS ix_messages_timestamp ON messages (timestamp)"
)


def ensure_timestamp_index():
    """create_all() does not add indexes to tables that already exist, so the
    index has to be created explicitly on databases predating it."""
    db.session.execute(text(TIMESTAMP_INDEX_DDL))
    db.session.commit()


def vacuum():
    """VACUUM cannot run inside a transaction."""
    with db.engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("VACUUM"))


def delete_old_messages(days=7, do_vacuum=True):
    cutoff = int(time.time()) - days * 24 * 3600
    with app.app_context():
        try:
            ensure_timestamp_index()

            deleted = 0
            while True:
                ids = [
                    row[0]
                    for row in db.session.query(Message.id)
                    .filter(Message.timestamp < cutoff)
                    .limit(BATCH_SIZE)
                    .all()
                ]
                if not ids:
                    break
                db.session.query(Message).filter(Message.id.in_(ids)).delete(
                    synchronize_session=False
                )
                db.session.commit()
                deleted += len(ids)

            print(f"Deleted {deleted} messages older than {days} days")
        except Exception as e:
            db.session.rollback()
            print(f"Cleanup failed: {e}", file=sys.stderr)
            sys.exit(1)

        if deleted and do_vacuum:
            try:
                vacuum()
                print("Vacuumed database")
            except Exception as e:
                # The purge already committed; a failed VACUUM only costs disk.
                print(f"Vacuum failed: {e}", file=sys.stderr)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--days', type=int, default=7,
                        help='delete messages older than this many days (default: 7)')
    parser.add_argument('--no-vacuum', action='store_true',
                        help='skip VACUUM after deleting')
    args = parser.parse_args()
    delete_old_messages(days=args.days, do_vacuum=not args.no_vacuum)
