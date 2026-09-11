#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { EmptyInboxClient, registerAgent, QuotaExhaustedError, type Message } from "./client.js";

const CONFIG_PATH = join(homedir(), ".emptyinbox.json");

function loadStoredKey(): string | null {
  try {
    const data = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return data.api_key ?? null;
  } catch {
    return null;
  }
}

function storeKey(api_key: string, username: string): void {
  writeFileSync(CONFIG_PATH, JSON.stringify({ api_key, username }, null, 2));
}

let apiKey = process.env.EMPTYINBOX_API_KEY ?? loadStoredKey();

if (!apiKey) {
  // Auto-register with a generated username
  const username = `agent-${Math.random().toString(36).slice(2, 10)}`;
  try {
    process.stderr.write(`[emptyinbox] No API key found. Registering as "${username}"...\n`);
    const result = await registerAgent(username);
    apiKey = result.api_key;
    storeKey(apiKey, username);
    process.stderr.write(`[emptyinbox] Registered! API key saved to ${CONFIG_PATH}\n`);
    process.stderr.write(`[emptyinbox] Starting quota: ${result.inbox_quota} inbox\n`);
  } catch (err) {
    process.stderr.write(`[emptyinbox] Registration failed: ${err}\n`);
    process.stderr.write(`[emptyinbox] Set EMPTYINBOX_API_KEY or visit https://emptyinbox.me/login.html\n`);
    process.exit(1);
  }
}

const client = new EmptyInboxClient(apiKey);

const server = new McpServer({
  name: "emptyinbox",
  version: "1.2.0",
});

server.registerTool("register_account", {
  description: "Register a new EmptyInbox account and get an API key. Use this if there is no account configured yet, or if authentication is failing. Saves the key locally for future sessions.",
  inputSchema: {
    username: z.string().min(3).max(32).describe("Desired username (3-32 chars, letters/numbers/hyphens/underscores)"),
  },
}, async ({ username }) => {
  try {
    const result = await registerAgent(username);
    storeKey(result.api_key, username);
    // Update the running client with the new key
    (client as any).headers["Authorization"] = `Bearer ${result.api_key}`;
    return { content: [{ type: "text" as const, text: JSON.stringify({
      success: true,
      username: result.username,
      api_key: result.api_key,
      inbox_quota: result.inbox_quota,
      message: `Account created. API key saved to ${CONFIG_PATH}`,
    }, null, 2) }] };
  } catch (err: any) {
    return { content: [{ type: "text" as const, text: JSON.stringify({
      success: false,
      error: err.message,
    }, null, 2) }] };
  }
});

server.registerTool("get_quota", {
  description: "Check remaining inbox quota. If quota is low, returns a payment URL the user can visit to top up with USDT.",
}, async () => {
  const { inbox_quota, username } = await client.getQuota();
  const purchaseUrl = `https://emptyinbox.me/purchase.html?api_key=${apiKey}`;
  const result: Record<string, unknown> = { username, inbox_quota };
  if (inbox_quota <= 2) {
    result.warning = "Quota is low.";
    result.top_up_url = purchaseUrl;
  }
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
});

server.registerTool("create_inbox", {
  description: "Create a new disposable email inbox. Returns the email address. Use this before triggering any signup or email verification flow.",
}, async () => {
  try {
    const email = await client.createInbox();
    return { content: [{ type: "text" as const, text: email.trim() }] };
  } catch (err) {
    if (err instanceof QuotaExhaustedError) {
      return { content: [{ type: "text" as const, text: JSON.stringify({
        error: "insufficient_quota",
        message: "Out of inbox quota. Call buy_quota to purchase more with Bitcoin.",
        ...err.detail,
      }, null, 2) }] };
    }
    throw err;
  }
});

server.registerTool("list_inboxes", {
  description: "List all disposable email inboxes on this account.",
}, async () => {
  const inboxes = await client.listInboxes();
  return { content: [{ type: "text" as const, text: JSON.stringify(inboxes, null, 2) }] };
});

/** Listing shape: enough to decide what to do, without a wall of raw HTML. */
function summarize(msg: Message) {
  return {
    id: msg.id,
    inbox: msg.inbox,
    subject: msg.subject,
    from: msg.sender,
    received_at: msg.received_at,
    timestamp: msg.timestamp,
    type: msg.type,
    code: msg.code,
    action_url: msg.action_url,
    preview: msg.preview,
  };
}

server.registerTool("list_messages", {
  description: "List received email messages, newest first, already parsed: each entry carries the extracted one-time code, the link to open, and a text preview — no HTML parsing needed. Filter by inbox and use limit to keep responses small.",
  inputSchema: {
    inbox: z.string().optional().describe("Filter to a specific inbox email address"),
    limit: z.number().default(10).describe("Max messages to return (default: 10)"),
    since: z.number().optional().describe("Unix seconds — only messages received after this"),
  },
}, async ({ inbox, limit, since }) => {
  const messages = await client.listMessages({ inbox, limit, since, includeBody: false });
  return { content: [{ type: "text" as const, text: JSON.stringify(messages.map(summarize), null, 2) }] };
});

server.registerTool("get_message", {
  description: "Get one email message by ID. Returns the parsed message: extracted code, action_url, every link with its anchor text, and the body as plain text. Set format='text' for a flat rendering to read directly, or include_html=true only if the raw HTML is genuinely needed.",
  inputSchema: {
    message_id: z.string().describe("Message ID from list_messages"),
    format: z.enum(["json", "text"]).default("json").describe("json (structured) or text (flat, prompt-ready)"),
    include_html: z.boolean().default(false).describe("Include the raw html_body in json output (default: false — it is large and rarely needed)"),
  },
}, async ({ message_id, format, include_html }) => {
  if (format === "text") {
    return { content: [{ type: "text" as const, text: await client.getMessageText(message_id) }] };
  }
  const msg = await client.getMessage(message_id);
  if (!include_html) delete msg.html_body;
  return { content: [{ type: "text" as const, text: JSON.stringify(msg, null, 2) }] };
});

server.registerTool("wait_for_message", {
  description: "Poll an inbox until a new message arrives. Use after triggering an email verification, OTP, or signup confirmation. Returns the parsed message — including the extracted code and the link to open — as soon as it lands, or a timeout result.",
  inputSchema: {
    inbox: z.string().describe("Inbox email address to watch"),
    timeout_seconds: z.number().default(120).describe("Seconds to wait before giving up (default: 120)"),
    poll_interval_seconds: z.number().default(5).describe("Seconds between checks (default: 5)"),
    subject_contains: z.string().optional().describe("Only match messages whose subject contains this text (case-insensitive)"),
    require_code: z.boolean().default(false).describe("Keep waiting until a message carries an extracted code or action link"),
  },
}, async ({ inbox, timeout_seconds, poll_interval_seconds, subject_contains, require_code }) => {
  const intervalMs = Math.max(1, poll_interval_seconds) * 1000;
  const deadline = Date.now() + timeout_seconds * 1000;

  // Watermark the newest message already present, then ask the server for
  // arrivals after it. Counting messages missed the case where an old one
  // aged out of the 7-day window as a new one arrived.
  const existing = await client.listMessages({ inbox, limit: 1, includeBody: false });
  let since = existing[0]?.timestamp ?? 0;

  const wanted = (msg: Message) => {
    if (subject_contains && !(msg.subject ?? "").toLowerCase().includes(subject_contains.toLowerCase())) {
      return false;
    }
    return !require_code || Boolean(msg.code || msg.action_url);
  };

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const arrived = await client.listMessages({ inbox, since, limit: 10 });
    if (arrived.length) {
      since = Math.max(since, ...arrived.map((m) => m.timestamp));
      const match = arrived.find(wanted);
      if (match) {
        delete match.html_body;
        return { content: [{ type: "text" as const, text: JSON.stringify(match, null, 2) }] };
      }
    }
  }

  return { content: [{ type: "text" as const, text: JSON.stringify({
    result: "timeout",
    inbox,
    timeout_seconds,
    ...(subject_contains ? { subject_contains } : {}),
  }, null, 2) }] };
});

server.registerTool("buy_quota", {
  description: "Buy more inbox quota with Bitcoin. Returns a payment address, the exact amount, and a BIP21 URI. Pay from a Bitcoin wallet, or give the BIP21 URI to the user to pay. Quota is granted as soon as the payment is seen on the network - no need to wait for confirmations. Call check_payment afterwards.",
  inputSchema: {
    bundle: z.string().optional().describe("Bundle id from list_bundles (default: starter)"),
    usd: z.number().int().optional().describe("Spend a custom whole-dollar amount instead of a bundle, from 1 to 100. Priced at the best bundle rate the amount qualifies for. The network fee the payer adds on top is the same whatever the size of the payment, so it eats a far larger share of a small one."),
  },
}, async ({ bundle, usd }) => {
  const quote = await client.createQuote(bundle, usd);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    ...quote,
    instructions: `Send exactly ${quote.amount_btc} BTC to ${quote.address}. ` +
      `Grants ${quote.quota} inboxes. Quote expires ${quote.expires_at}.`,
  }, null, 2) }] };
});

server.registerTool("list_bundles", {
  description: "List the quota bundles available for purchase and their USD prices.",
}, async () => {
  const bundles = await client.getBundles();
  return { content: [{ type: "text" as const, text: JSON.stringify(bundles, null, 2) }] };
});

server.registerTool("check_payment", {
  description: "Check whether a Bitcoin payment from buy_quota has landed. Optionally waits until the quota is credited. Credit usually arrives within seconds of broadcast, well before confirmation.",
  inputSchema: {
    address: z.string().describe("Payment address returned by buy_quota"),
    wait_seconds: z.number().default(0).describe("Seconds to keep polling for credit (default: 0, check once)"),
    poll_interval_seconds: z.number().default(5).describe("Seconds between checks (default: 5)"),
  },
}, async ({ address, wait_seconds, poll_interval_seconds }) => {
  // A zero interval would hammer the API in a tight loop.
  const intervalMs = Math.max(1, poll_interval_seconds) * 1000;
  const deadline = Date.now() + Math.max(0, wait_seconds) * 1000;

  let state = await client.getPaymentStatus(address);
  while (!state.quota_credited && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    state = await client.getPaymentStatus(address);
  }

  return { content: [{ type: "text" as const, text: JSON.stringify({
    ...state,
    message: state.quota_credited
      ? `${state.quota} inboxes credited. create_inbox will now succeed.`
      : "Payment not yet detected. Send the exact amount, then check again.",
  }, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
