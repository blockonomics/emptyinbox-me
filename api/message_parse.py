"""Turn a stored raw email blob into something a machine can act on.

The API used to hand callers the raw MIME parts and let them work it out. Every
agent then re-implemented the same three things: strip the HTML, find the
one-time code, find the link to click. This module does it once, server-side,
so `text`, `code` and `links` come out of the API ready to use.
"""

import html as html_lib
import re
from datetime import datetime, timezone
from email.utils import parseaddr

PREVIEW_LENGTH = 200
MAX_LINKS = 25
MAX_CODES = 5

# Tags whose content is markup plumbing, not text the reader ever sees.
_INVISIBLE_TAGS = re.compile(
    r"<(script|style|head|title|noscript)[^>]*>.*?</\1>", re.I | re.S
)
_BLOCK_BREAKS = re.compile(
    r"</?(p|div|br|tr|li|h[1-6]|table|blockquote|section|article)[^>]*>", re.I
)
_ANY_TAG = re.compile(r"<[^>]+>")
_HREF = re.compile(r"""<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>(.*?)</a>""", re.I | re.S)
_BARE_URL = re.compile(r"""https?://[^\s<>"'\]\)]+""", re.I)
_MANY_NEWLINES = re.compile(r"\n{3,}")
_ORPHAN_PUNCTUATION = re.compile(r" +([.,;:!?%)])")
_SPACES = re.compile(r"[ \t\f\v]+")

# Words that look like codes but never are.
_CODE_BLACKLIST = {
    "EXPIRED", "EXPIRES", "MINUTES", "HOURS", "DAYS", "SECONDS", "HTTP",
    "HTTPS", "WWW", "GMAIL", "YAHOO", "OUTLOOK", "EMAIL", "MAIL", "NULL",
    "TRUE", "FALSE", "UNSUBSCRIBE", "COPYRIGHT",
}

# Ordered by how much context each pattern carries: a number sitting next to
# the words "verification code" is a far safer bet than a bare six digits.
_CODE_PATTERNS = [
    re.compile(r"(?:verification|activation|confirmation|security|login|access|one[- ]time)\s+code\b\W{0,10}([A-Z0-9]{4,10})\b", re.I),
    re.compile(r"\b(?:your|the)\s+code\s+is\b\W{0,10}([A-Z0-9]{4,10})\b", re.I),
    re.compile(r"\bcode\b\s*[:\-]\s*([A-Z0-9]{4,10})\b", re.I),
    re.compile(r"\b(?:OTP|PIN)\b\W{0,10}([A-Z0-9]{4,10})\b", re.I),
    re.compile(r"\b(\d{6})\b"),
    re.compile(r"\b(\d{4,8})\b"),
    re.compile(r"\b([A-Z0-9]{6,10})\b"),
]

_RESET_HINT = re.compile(r"reset|forgot", re.I)
_VERIFY_HINT = re.compile(r"verif|confirm|activat|validate", re.I)
_LOGIN_HINT = re.compile(r"magic\s*link|sign[- ]?in|log[- ]?in", re.I)
_UNSUBSCRIBE_HINT = re.compile(r"unsubscribe|optout|opt-out|preferences", re.I)


def html_to_text(raw_html):
    """Flatten an HTML body into the text a human would have read."""
    if not raw_html:
        return ""
    text = _INVISIBLE_TAGS.sub(" ", raw_html)
    text = _BLOCK_BREAKS.sub("\n", text)
    text = _ANY_TAG.sub(" ", text)
    text = html_lib.unescape(text)
    # Zero-width joiner and non-breaking space are used as spacer hacks in
    # marketing mail and survive unescaping as invisible junk.
    text = text.replace("‌", "").replace("\xa0", " ")
    lines = [_SPACES.sub(" ", line).strip() for line in text.split("\n")]
    text = "\n".join(line for line in lines if line)
    # Inline tags (<strong>, <span>) became spaces, which leaves gaps in front
    # of the punctuation that followed them: "code is 482910 ."
    text = _ORPHAN_PUNCTUATION.sub(r"\1", text)
    return _MANY_NEWLINES.sub("\n\n", text).strip()


def extract_links(raw_html, text_body):
    """Every link in the mail, anchor text attached, duplicates collapsed.

    Anchor text is what tells an agent which link is the one to click, so a
    bare URL list would throw away the useful half.
    """
    links = []
    seen = set()

    def add(url, label=""):
        url = html_lib.unescape(url or "").strip()
        if not url.lower().startswith(("http://", "https://")):
            return
        url = url.rstrip(".,;)")
        if url in seen or len(links) >= MAX_LINKS:
            return
        seen.add(url)
        entry = {"url": url, "text": label}
        if _UNSUBSCRIBE_HINT.search(url) or _UNSUBSCRIBE_HINT.search(label):
            entry["unsubscribe"] = True
        links.append(entry)

    for match in _HREF.finditer(raw_html or ""):
        label = _SPACES.sub(" ", _ANY_TAG.sub(" ", html_lib.unescape(match.group(2)))).strip()
        add(match.group(1), label[:120])

    for match in _BARE_URL.finditer(text_body or ""):
        add(match.group(0))

    return links


def _valid_code(code):
    upper = (code or "").upper()
    return (
        4 <= len(upper) <= 10
        and upper not in _CODE_BLACKLIST
        and re.fullmatch(r"[A-Z0-9]+", upper) is not None
        and any(ch.isdigit() for ch in upper)
    )


def extract_codes(text, subject=""):
    """Candidate one-time codes, most confidently identified first."""
    haystack = "{}\n{}".format(subject or "", text or "")
    if not haystack.strip():
        return []
    # A URL is full of digit runs that look exactly like OTPs.
    haystack = _BARE_URL.sub(" ", haystack)

    codes = []
    for pattern in _CODE_PATTERNS:
        for match in pattern.finditer(haystack):
            code = (match.group(1) if match.groups() else match.group(0)).strip()
            if _valid_code(code) and code not in codes:
                codes.append(code)
                if len(codes) >= MAX_CODES:
                    return codes
    return codes


def classify(subject, text, links):
    """What the mail is asking the recipient to do."""
    blob = "{}\n{}".format(subject or "", (text or "")[:2000])
    if _RESET_HINT.search(blob) and re.search(r"password", blob, re.I):
        return "password_reset"
    if _VERIFY_HINT.search(blob):
        return "verification"
    if _LOGIN_HINT.search(blob) and links:
        return "login_link"
    return "general"


def pick_action_url(msg_type, links):
    """The single link worth clicking, if the mail has one."""
    if msg_type == "password_reset":
        wanted = re.compile(r"reset|password|recover", re.I)
    elif msg_type == "verification":
        wanted = re.compile(r"verif|confirm|activat|validate", re.I)
    elif msg_type == "login_link":
        wanted = re.compile(r"login|signin|sign-in|magic|auth|token", re.I)
    else:
        return None
    for link in links:
        if link.get("unsubscribe"):
            continue
        if wanted.search(link["url"]) or wanted.search(link.get("text", "")):
            return link["url"]
    return None


def iso_timestamp(timestamp):
    try:
        stamp = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None
    return stamp.isoformat().replace("+00:00", "Z")


def normalize(msg_id, inbox, subject, timestamp, content, include_body=True):
    """Build the API shape for one message from its stored blob.

    `content` is the dict decoded from the stored JSON. Missing pieces become
    empty values rather than absent keys, so callers can index without
    guarding every field.
    """
    content = content or {}
    html_body = content.get("html_body") or ""
    text_body = content.get("text_body") or ""
    headers = content.get("headers") or {}

    from_header = headers.get("From") or content.get("sender") or ""
    from_name, from_email = parseaddr(from_header)
    if not from_email:
        from_email = content.get("sender") or ""
    if not from_name:
        from_name = from_email.split("@")[0] if from_email else "Unknown"

    text = text_body.strip() or html_to_text(html_body)
    links = extract_links(html_body, "{}\n{}".format(text_body, text))
    codes = extract_codes(text, subject)
    msg_type = classify(subject, text, links)

    preview = _MANY_NEWLINES.sub(" ", text).replace("\n", " ").strip()
    preview = _SPACES.sub(" ", preview)
    if len(preview) > PREVIEW_LENGTH:
        preview = preview[:PREVIEW_LENGTH].rstrip() + "…"

    result = {
        "id": msg_id,
        "inbox": inbox,
        "to": content.get("recipients") or ([inbox] if inbox else []),
        "subject": subject or "",
        "sender": from_header or from_email,  # kept for existing clients
        "from_name": from_name,
        "from_email": from_email,
        "timestamp": timestamp,
        "received_at": iso_timestamp(timestamp),
        "type": msg_type,
        "code": codes[0] if codes else None,
        "codes": codes,
        "action_url": pick_action_url(msg_type, links),
        "links": links,
        "preview": preview,
        "has_html": bool(html_body),
    }

    if include_body:
        result["text"] = text
        result["text_body"] = text_body
        result["html_body"] = html_body
        # Kept so clients written against the old raw response — which handed
        # back the headers dict — keep working, and because Date, Reply-To and
        # Message-ID are occasionally what someone is actually debugging.
        result["headers"] = headers

    return result


def to_plain_text(message):
    """A whole message as flat text, for dropping straight into a prompt."""
    lines = [
        "From: {}".format(message.get("sender") or ""),
        "To: {}".format(message.get("inbox") or ""),
        "Date: {}".format(message.get("received_at") or ""),
        "Subject: {}".format(message.get("subject") or ""),
    ]
    if message.get("code"):
        lines.append("Code: {}".format(message["code"]))
    if message.get("action_url"):
        lines.append("Action URL: {}".format(message["action_url"]))
    lines.append("")
    lines.append(message.get("text") or "")
    return "\n".join(lines)
