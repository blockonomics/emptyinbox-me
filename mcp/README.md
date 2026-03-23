# emptyinbox-mcp

MCP server for [EmptyInbox](https://emptyinbox.me) — create disposable email inboxes and read messages from AI agents.

## Setup

1. Get your API key at https://emptyinbox.me/settings.html
2. Add to your MCP config:

**Claude Desktop / Claude Code** (`~/.claude/claude_desktop_config.json`):
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

## Tools

| Tool | Description |
|------|-------------|
| `create_inbox` | Create a new disposable email address |
| `list_inboxes` | List all inboxes on your account |
| `list_messages` | List received messages (optionally filter by inbox) |
| `get_message` | Get full content of a message by ID |
| `wait_for_message` | **Block until an email arrives** — perfect for signup/OTP flows |

## Example agent workflow

```
1. create_inbox → "clever.sunny.butterfly@emptyinbox.me"
2. [agent signs up to some service using that address]
3. wait_for_message(inbox="clever.sunny.butterfly@emptyinbox.me", timeout_seconds=60)
4. → returns the verification email with code/link
```

## Payment

Free accounts include 5 inboxes. Buy more quota with BTC or USDT at https://emptyinbox.me/inboxes.html
