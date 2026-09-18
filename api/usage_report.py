#!/usr/bin/env python3
"""
What is the inbox being used for? Read-only report over the messages table.

    python api/usage_report.py                 # last 7 days, top 25 per table
    python api/usage_report.py --days 30 --top 50
    python api/usage_report.py --domain github.com   # subjects + inboxes for one sender domain
    python api/usage_report.py --inbox foo@emptyinbox.me
    python api/usage_report.py --samples 5     # print a few parsed messages per type

Messages are stored as an opaque JSON blob (sender, recipients, headers,
bodies), so nothing in the schema says who is mailing us or why. This walks
the blobs through message_parse the same way the API does and aggregates by
sender domain, message type (verification / password_reset / login_link /
general), subject, inbox, user and day. Point it at the live SQLite file on
the VPS; it never writes.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from email.utils import parseaddr

sys.path.insert(0, os.path.dirname(__file__))

from config import app, db
from db_models import Message, Inbox, User
from message_parse import normalize


def decode_content(blob):
    # Same as tempmail_api.decode_content, inlined so this script does not
    # import the app blueprints (and their env requirements) just to read JSON.
    if not blob:
        return {}
    try:
        return json.loads(blob.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
        return None


# Collapse per-recipient noise in subjects ("Your code is 482910" -> "Your code is #")
_DIGITS = re.compile(r"\d{3,}")
_HEX = re.compile(r"\b[0-9a-f]{16,}\b", re.I)


def subject_shape(subject):
    s = _HEX.sub("#", subject or "")
    s = _DIGITS.sub("#", s)
    return s.strip()[:80] or "(no subject)"


def bar(n, total, width=20):
    filled = int(round(width * n / total)) if total else 0
    return "#" * filled + "." * (width - filled)


def table(title, counter, total, top):
    print(f"\n== {title} ({len(counter)} distinct, {total} msgs) ==")
    for key, n in counter.most_common(top):
        print(f"{n:6d}  {100*n/total:5.1f}%  {bar(n, total)}  {key}")


def load(days, inbox_filter, domain_filter):
    since = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())
    q = db.select(Message.id, Message.inbox, Message.subject, Message.timestamp, Message.content) \
          .filter(Message.timestamp >= since).order_by(Message.timestamp.desc())
    if inbox_filter:
        q = q.filter(Message.inbox == inbox_filter)

    inbox_owner = {row.inbox: row.api_key for row in db.session.execute(db.select(Inbox.inbox, Inbox.api_key))}
    user_by_key = {row.api_key: row for row in db.session.execute(
        db.select(User.api_key, User.username, User.signup_method, User.signup_client, User.inbox_quota))}

    rows = []
    unreadable = 0
    for row in db.session.execute(q):
        content = decode_content(row.content)
        if content is None:
            unreadable += 1
            continue
        msg = normalize(row.id, row.inbox, row.subject, row.timestamp, content, include_body=True)
        domain = (msg["from_email"].split("@")[-1] or "?").lower()
        if domain_filter and domain != domain_filter.lower():
            continue
        key = inbox_owner.get(row.inbox)
        user = user_by_key.get(key)
        rows.append({
            "msg": msg,
            "domain": domain,
            "inbox": row.inbox,
            "day": datetime.fromtimestamp(row.timestamp, tz=timezone.utc).strftime("%Y-%m-%d"),
            "user": user.username if user else "(orphan inbox)",
            "client": (user.signup_client or user.signup_method or "?") if user else "?",
        })
    return rows, unreadable


def report(rows, top, samples):
    total = len(rows)
    if not total:
        print("no messages in window")
        return

    table("Sender domain", Counter(r["domain"] for r in rows), total, top)
    table("Message type", Counter(r["msg"]["type"] for r in rows), total, top)
    table("Has OTP code", Counter("yes" if r["msg"]["code"] else "no" for r in rows), total, top)
    table("Has action link", Counter("yes" if r["msg"]["action_url"] else "no" for r in rows), total, top)
    table("Subject shape", Counter(subject_shape(r["msg"]["subject"]) for r in rows), total, top)
    table("Inbox", Counter(r["inbox"] for r in rows), total, top)
    table("User", Counter(r["user"] for r in rows), total, top)
    table("Signup client", Counter(r["client"] for r in rows), total, top)

    by_day = Counter(r["day"] for r in rows)
    print(f"\n== Per day ==")
    for day in sorted(by_day):
        print(f"{by_day[day]:6d}  {bar(by_day[day], max(by_day.values()))}  {day}")

    # Which services each domain is a proxy for: domain -> subject shapes
    print(f"\n== Top domains, what they send ==")
    per_domain = defaultdict(Counter)
    for r in rows:
        per_domain[r["domain"]][subject_shape(r["msg"]["subject"])] += 1
    for domain, n in Counter(r["domain"] for r in rows).most_common(min(top, 10)):
        print(f"\n  {domain}  ({n})")
        for shape, m in per_domain[domain].most_common(5):
            print(f"    {m:5d}  {shape}")

    if samples:
        print(f"\n== Samples ==")
        seen = Counter()
        for r in rows:
            t = r["msg"]["type"]
            if seen[t] >= samples:
                continue
            seen[t] += 1
            m = r["msg"]
            print(f"\n--- [{t}] {m['received_at']}  {m['from_email']} -> {r['inbox']}  (user {r['user']})")
            print(f"    subj: {m['subject']}")
            if m["code"]:
                print(f"    code: {m['code']}")
            if m["action_url"]:
                print(f"    url:  {m['action_url'][:120]}")
            print(f"    text: {m['preview']}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--top", type=int, default=25)
    p.add_argument("--inbox", help="only this inbox address")
    p.add_argument("--domain", help="only mail from this sender domain")
    p.add_argument("--samples", type=int, default=0, help="print N parsed samples per message type")
    args = p.parse_args()

    with app.app_context():
        rows, unreadable = load(args.days, args.inbox, args.domain)
        print(f"window: last {args.days}d   messages: {len(rows)}   unreadable blobs: {unreadable}")
        report(rows, args.top, args.samples)


if __name__ == "__main__":
    main()
