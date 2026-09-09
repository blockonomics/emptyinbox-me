# EmptyInbox

Disposable email inbox API for AI agents and developers. Create temporary email addresses, receive messages, and read content — via REST API or MCP server.

**Live at [emptyinbox.me](https://emptyinbox.me)**

## MCP Server (Claude / Claude Code / any MCP agent)

```json
{
  "mcpServers": {
    "emptyinbox": {
      "command": "npx",
      "args": ["emptyinbox-mcp"],
      "env": {
        "EMPTYINBOX_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Get your API key at https://emptyinbox.me/settings.html

## REST API

Base URL: `https://emptyinbox.me/api`
Auth: `Authorization: Bearer <api_key>`
OpenAPI spec: `https://emptyinbox.me/openapi.yaml`

```bash
# Create an inbox
curl -X POST -H "Authorization: Bearer YOUR_KEY" https://emptyinbox.me/api/inbox

# List messages — filter to one inbox, only what arrived since the last poll
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://emptyinbox.me/api/messages?inbox=ADDRESS&since=1711234000&include_body=false"

# Read a message
curl -H "Authorization: Bearer YOUR_KEY" https://emptyinbox.me/api/message/MSG_ID

# ...or as flat text, ready to drop into a prompt
curl -H "Authorization: Bearer YOUR_KEY" "https://emptyinbox.me/api/message/MSG_ID?format=text"
```

Every message comes back parsed, so nothing has to pick through the HTML:

```json
{
  "subject": "Confirm your email address",
  "from_name": "Example App",
  "from_email": "noreply@example.com",
  "received_at": "2024-03-23T21:36:07Z",
  "type": "verification",
  "code": "482910",
  "action_url": "https://example.com/verify?token=abc123",
  "links": [{ "url": "https://example.com/verify?token=abc123", "text": "Verify your email" }],
  "preview": "Your verification code is 482910. It expires in 10 minutes.",
  "text": "Your verification code is 482910. It expires in 10 minutes."
}
```

`text` is the body flattened to plain text (from the HTML part when there is no text
part), `code` is the best one-time code found, `action_url` the single link worth
opening. `?format=raw` still returns the untouched MIME parts.

## Typical agent workflow

1. `POST /api/inbox` → get a disposable address
2. Use that address in an external signup or verification flow
3. `GET /api/messages?inbox=<address>&since=<last timestamp>` → poll until the verification email appears
4. Read `code` or `action_url` straight off the message — the API extracts both

## Local Development

### Backend (Flask, port 5000)

```powershell
cd api
pipenv install
pipenv run create_db   # first run only — creates SQLite DB
pipenv run dev         # starts python tempmail_api.py with CORS + /api prefix
```

**`api/.env` for local dev:**
```env
DOMAIN=localhost:8000
SECRET=any_random_string
FLASK_ENV=development
BLOCKONOMICS_API_KEY=<key>
USDT_RECEIVING_ADDRESS=<address>
MATCH_CALLBACK=ngrok
```

### Frontend (static, port 8000)

```powershell
cd static
python -m http.server 8000
```

Open http://localhost:8000. The JS auto-detects localhost and hits `http://localhost:5000` for the API (`static/utils/constants.js`).

---

## Self-hosting

### Requirements
- Ubuntu server
- Python 3 + pipenv
- Nginx
- Postfix

### Setup

**1. Clone and configure**
```bash
git clone https://github.com/blockonomics/emptyinbox-me
cd emptyinbox-me/api
cp .env.example .env   # fill in your values
```

**.env variables:**
```
DOMAIN=yourdomain.com
SECRET=your_postfix_webhook_secret
FLASK_ENV=production
BLOCKONOMICS_API_KEY=your_blockonomics_api_key
USDT_RECEIVING_ADDRESS=your_usdt_address
MATCH_CALLBACK=https://yourdomain.com/api/payments/callback
```

**2. Database**
```bash
pipenv install
pipenv run create_db
```

**3. Gunicorn**
```bash
pipenv run start
```

**4. Nginx**
```bash
sudo cp nginx/emptyinbox_nginx.conf /etc/nginx/sites-available/emptyinbox_nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

**5. Postfix**
```bash
sudo apt install postfix   # select "No configuration"
sudo cp /usr/share/postfix/main.cf.debian /etc/postfix/main.cf
sudo postfix/setup_postfix.sh YOUR_HOSTNAME YOUR_DOMAIN YOUR_SECRET
```

## Pricing

- Free: 5 inboxes per account
- Paid: 1 USDT per 10 additional inboxes (via Blockonomics — no credit card, no KYC)
