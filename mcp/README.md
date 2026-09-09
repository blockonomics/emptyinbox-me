# emptyinbox-mcp

MCP server for [EmptyInbox](https://emptyinbox.me) — create disposable email inboxes and read messages from AI agents.

## Setup

**Zero config — just add to your MCP config and it works:**

```json
{
  "mcpServers": {
    "emptyinbox": {
      "command": "npx",
      "args": ["-y", "emptyinbox-mcp"]
    }
  }
}
```

On first use, the agent calls `register_account` to create a free account automatically. The API key is saved to `~/.emptyinbox.json` for future sessions.

**Bring your own account** (optional — to reuse an existing key):
```json
{
  "mcpServers": {
    "emptyinbox": {
      "command": "npx",
      "args": ["-y", "emptyinbox-mcp"],
      "env": {
        "EMPTYINBOX_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Get an API key at https://emptyinbox.me/settings.html

## Tools

| Tool | Description |
|------|-------------|
| `create_inbox` | Create a new disposable email address |
| `list_inboxes` | List all inboxes on your account |
| `list_messages` | List received messages, each with its extracted code, action link and text preview |
| `get_message` | Get one message parsed (code, links, plain text), or `format="text"` for a flat rendering |
| `wait_for_message` | **Block until an email arrives** — perfect for signup/OTP flows; returns the extracted code with it |
| `list_bundles` | List quota bundles and prices |
| `buy_quota` | Get a Bitcoin address and amount to buy more inboxes |
| `check_payment` | Check whether a payment landed and quota was credited |

## Example agent workflow

```
1. create_inbox → "clever.sunny.butterfly@emptyinbox.me"
2. [agent signs up to some service using that address]
3. wait_for_message(inbox="clever.sunny.butterfly@emptyinbox.me", timeout_seconds=60)
4. → returns the verification email with code/link
```

## Payment

Every account starts with 5 inboxes. When they run out, `create_inbox` reports
that quota is exhausted and the agent can buy more without leaving the session:

1. `buy_quota` returns a Bitcoin address, the exact amount, and a BIP21 URI
2. pay it from any wallet — or hand the BIP21 URI to a human to pay
3. `check_payment` confirms the credit, usually within seconds of broadcast

Quota is granted as soon as the payment is seen on the network, so there is no
waiting for confirmations. Humans can also buy at https://emptyinbox.me/inboxes.html
