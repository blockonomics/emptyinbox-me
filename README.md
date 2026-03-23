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

# List messages
curl -H "Authorization: Bearer YOUR_KEY" https://emptyinbox.me/api/messages

# Read a message
curl -H "Authorization: Bearer YOUR_KEY" https://emptyinbox.me/api/message/MSG_ID
```

## Typical agent workflow

1. `POST /api/inbox` → get a disposable address
2. Use that address in an external signup or verification flow
3. `GET /api/messages` → poll until the verification email appears
4. Read the code or link from `text_body`

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
