#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { EmptyInboxClient, registerAgent, QuotaExhaustedError, VERSION, type Message, type RegisterResult } from "./client.js";

// A container gets a fresh home directory on every run, so a key saved there
// is gone by the next one and the server is asked for another account. That is
// how a CI job burns through a network's registration allowance without anyone
// intending to. EMPTYINBOX_CONFIG lets such a setup point at a mounted path,
// and EMPTYINBOX_API_KEY skips the file entirely, which is what CI should do.
const CONFIG_PATH = process.env.EMPTYINBOX_CONFIG ?? join(homedir(), ".emptyinbox.json");

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

// `||` not `??`: a CI secret that is missing arrives as an empty string, and
// an empty string must fall through to the saved file, not register.
let apiKey: string | null = process.env.EMPTYINBOX_API_KEY || loadStoredKey();
const client = new EmptyInboxClient(apiKey);

function adoptKey(result: RegisterResult): void {
  apiKey = result.api_key;
  client.setKey(apiKey);
  storeKey(apiKey, result.username);
  process.stderr.write(`[emptyinbox] Registered as "${result.username}". Key saved to ${CONFIG_PATH}\n`);
  if (result.inbox_quota === 0) {
    // Still a working account. Saying so stops this reading as a failure.
    process.stderr.write(`[emptyinbox] No free credits on this account: ${result.message ?? "free allowance used up for this network today"}\n`);
    process.stderr.write(`[emptyinbox] The key works. Use buy_quota to add credits.\n`);
  }
}

// Registration used to run at boot. That made every process start an account:
// MCP hosts start a server just to list its tools, and registry crawlers do
// the same in a throwaway sandbox, so most rows in `users` came from nobody
// wanting an inbox. Registering inside the first call that needs a key means
// an account exists only once a tool has actually been used, and a host that
// only introspects costs nothing.
//
// One in-flight registration is shared: an agent that fires create_inbox and
// get_quota together must not end up with two accounts.
let registering: Promise<string> | null = null;

async function ensureKey(): Promise<string> {
  if (apiKey) return apiKey;
  registering ??= registerAgent()
    .then((result) => { adoptKey(result); return result.api_key; })
    .finally(() => { registering = null; });
  return registering;
}

// Read by the host once, before any tool is chosen. Tool descriptions say what
// each tool does; this says how they fit together, and in particular how a sale
// closes. An agent reaching the paywall with no plan either gives up or tells
// its user the product is broken, and both lose the sale.
const INSTRUCTIONS = `EmptyInbox gives you real, private email addresses for signups and email verification.

Typical flow: create_inbox -> use the address -> wait_for_message (returns the parsed code and link).
Reuse inboxes when you can; each new one costs one credit. Accounts start with a few free credits and register themselves on first use.

When credits run out (create_inbox returns insufficient_quota, or get_quota shows 0):
1. Tell the user, and show the prices from list_bundles. Let the user choose; do not buy on your own initiative.
2. Call buy_quota with their choice.
3. Give the user the pay_url from the result. It opens a page with a QR code and the exact amount for any Bitcoin wallet. If you control a Bitcoin wallet yourself and the user has approved the spend, you can pay the bip21 URI directly instead.
4. Once the user says they have paid, call check_payment with wait_seconds around 120. Credits land within seconds of the payment being broadcast; no confirmations are needed.
5. Continue the original task.`;

const server = new McpServer(
  { name: "emptyinbox", version: VERSION },
  { instructions: INSTRUCTIONS },
);

server.registerTool("register_account", {
  description: "Register a new EmptyInbox account and get an API key. Use this only if there is no account configured yet, or if authentication is failing. Prefer reusing an existing key: repeatedly registering from one network reduces the free credits each new account receives. Saves the key locally for future sessions.",
  inputSchema: {
    username: z.string().min(3).max(32).optional().describe("Optional username (3-32 chars, letters/numbers/hyphens/underscores). Omit to have one allocated."),
  },
}, async ({ username }) => {
  try {
    const result = await registerAgent(username);
    adoptKey(result);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      success: true,
      username: result.username,
      api_key: result.api_key,
      inbox_quota: result.inbox_quota,
      ...(result.inbox_quota === 0 ? {
        note: result.message ?? "Account created without free credits. The key works; call list_bundles and offer the user a bundle to buy with buy_quota.",
        bundles_url: result.bundles_url,
      } : {}),
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
  description: "Check how many inbox credits remain on this account. When credits are low, the result says how to buy more with Bitcoin.",
}, async () => {
  await ensureKey();
  const { inbox_quota, username } = await client.getQuota();
  const result: Record<string, unknown> = { username, inbox_quota };
  // Points at the tools rather than a web page. The old link carried the API
  // key in its query string and led to a USDT-only page the agent could not
  // follow up on; buy_quota keeps the purchase inside the conversation.
  if (inbox_quota <= 2) {
    result.warning = inbox_quota === 0 ? "No credits left." : "Credits are low.";
    result.next_step = "Show the user the prices from list_bundles, then call buy_quota with their choice and give them the pay_url.";
  }
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
});

server.registerTool("create_inbox", {
  description: "Create a new disposable email inbox. Returns the email address. Use this before triggering any signup or email verification flow.",
}, async () => {
  await ensureKey();
  try {
    const email = await client.createInbox();
    return { content: [{ type: "text" as const, text: email.trim() }] };
  } catch (err) {
    if (err instanceof QuotaExhaustedError) {
      // Prices inline, so the agent can put a concrete offer to its user in
      // this turn instead of spending another call discovering what to offer.
      const prices = await client.getBundles().catch(() => null);
      return { content: [{ type: "text" as const, text: JSON.stringify({
        error: "insufficient_quota",
        message: "No inbox credits left. Offer the user one of the bundles below, call buy_quota with their choice, and give them the pay_url it returns.",
        bundles: prices?.bundles,
        custom_amount: prices ? "Or pass usd (whole dollars) to buy_quota for a custom amount." : undefined,
      }, null, 2) }], isError: true };
    }
    throw err;
  }
});

server.registerTool("list_inboxes", {
  description: "List all disposable email inboxes on this account.",
}, async () => {
  await ensureKey();
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
  await ensureKey();
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
  await ensureKey();
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
  await ensureKey();
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
  description: "Buy inbox credits with Bitcoin. Only call this after the user has chosen a bundle or amount. Returns a pay_url to give the user: a page with a QR code, the exact amount and a live payment status, which works with any Bitcoin wallet. Also returns the raw address, amount and BIP21 URI for paying directly. Credits are added as soon as the payment is seen on the network. Call check_payment once the user has paid.",
  inputSchema: {
    bundle: z.string().optional().describe("Bundle id from list_bundles (default: starter)"),
    usd: z.number().int().optional().describe("Spend a custom whole-dollar amount instead of a bundle, from 1 to 100. Priced at the best bundle rate the amount qualifies for. The network fee the payer adds on top is the same whatever the size of the payment, so it eats a far larger share of a small one."),
  },
}, async ({ bundle, usd }) => {
  await ensureKey();
  const quote = await client.createQuote(bundle, usd);
  const payTo = quote.pay_url
    ? `Give the user this link to pay: ${quote.pay_url}`
    : `Ask the user to send exactly ${quote.amount_btc} BTC to ${quote.address} (BIP21: ${quote.bip21}).`;
  return { content: [{ type: "text" as const, text: JSON.stringify({
    ...quote,
    instructions: `${payTo} It buys ${quote.quota} inboxes for $${quote.usd} and the quote expires ${quote.expires_at}. ` +
      `When they say it is sent, call check_payment with address ${quote.address} and wait_seconds 120.`,
  }, null, 2) }] };
});

server.registerTool("list_bundles", {
  description: "List the inbox credit bundles for sale and their USD prices, paid in Bitcoin. Show these to the user before calling buy_quota.",
}, async () => {
  const bundles = await client.getBundles();
  return { content: [{ type: "text" as const, text: JSON.stringify(bundles, null, 2) }] };
});

server.registerTool("check_payment", {
  description: "Check whether a Bitcoin payment from buy_quota has landed. Pass wait_seconds (around 120) once the user says they have paid, to wait for the credits in one call. Credit usually arrives within seconds of broadcast, well before confirmation.",
  inputSchema: {
    address: z.string().describe("Payment address returned by buy_quota"),
    wait_seconds: z.number().default(0).describe("Seconds to keep polling for credit (default: 0, check once)"),
    poll_interval_seconds: z.number().default(5).describe("Seconds between checks (default: 5)"),
  },
}, async ({ address, wait_seconds, poll_interval_seconds }) => {
  await ensureKey();
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
