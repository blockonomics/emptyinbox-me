#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { EmptyInboxClient, registerAgent, QuotaExhaustedError } from "./client.js";
const CONFIG_PATH = join(homedir(), ".emptyinbox.json");
function loadStoredKey() {
    try {
        const data = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
        return data.api_key ?? null;
    }
    catch {
        return null;
    }
}
function storeKey(api_key, username) {
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
    }
    catch (err) {
        process.stderr.write(`[emptyinbox] Registration failed: ${err}\n`);
        process.stderr.write(`[emptyinbox] Set EMPTYINBOX_API_KEY or visit https://emptyinbox.me/login.html\n`);
        process.exit(1);
    }
}
const client = new EmptyInboxClient(apiKey);
const server = new McpServer({
    name: "emptyinbox",
    version: "1.1.0",
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
        client.headers["Authorization"] = `Bearer ${result.api_key}`;
        return { content: [{ type: "text", text: JSON.stringify({
                        success: true,
                        username: result.username,
                        api_key: result.api_key,
                        inbox_quota: result.inbox_quota,
                        message: `Account created. API key saved to ${CONFIG_PATH}`,
                    }, null, 2) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({
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
    const result = { username, inbox_quota };
    if (inbox_quota <= 2) {
        result.warning = "Quota is low.";
        result.top_up_url = purchaseUrl;
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
server.registerTool("create_inbox", {
    description: "Create a new disposable email inbox. Returns the email address. Use this before triggering any signup or email verification flow.",
}, async () => {
    try {
        const email = await client.createInbox();
        return { content: [{ type: "text", text: email.trim() }] };
    }
    catch (err) {
        if (err instanceof QuotaExhaustedError) {
            return { content: [{ type: "text", text: JSON.stringify({
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
    return { content: [{ type: "text", text: JSON.stringify(inboxes, null, 2) }] };
});
server.registerTool("list_messages", {
    description: "List received email messages, newest first. Optionally filter by inbox. Use limit to avoid large responses.",
    inputSchema: {
        inbox: z.string().optional().describe("Filter to a specific inbox email address"),
        limit: z.number().default(10).describe("Max messages to return (default: 10)"),
    },
}, async ({ inbox, limit }) => {
    const messages = await client.listMessages();
    const filtered = inbox ? messages.filter((m) => m.inbox === inbox) : messages;
    const compact = filtered.slice(0, limit).map(({ id, inbox, subject, sender, timestamp, text_body }) => ({
        id,
        inbox,
        subject,
        sender,
        timestamp,
        text_body: text_body?.slice(0, 500) ?? "",
    }));
    return { content: [{ type: "text", text: JSON.stringify(compact, null, 2) }] };
});
server.registerTool("get_message", {
    description: "Get the full content of a specific email message by its ID.",
    inputSchema: {
        message_id: z.string().describe("Message ID from list_messages"),
    },
}, async ({ message_id }) => {
    const msg = await client.getMessage(message_id);
    return { content: [{ type: "text", text: JSON.stringify(msg, null, 2) }] };
});
server.registerTool("wait_for_message", {
    description: "Poll an inbox until a new message arrives. Use after triggering an email verification, OTP, or signup confirmation. Returns the message as soon as it lands, or a timeout result.",
    inputSchema: {
        inbox: z.string().describe("Inbox email address to watch"),
        timeout_seconds: z.number().default(120).describe("Seconds to wait before giving up (default: 120)"),
        poll_interval_seconds: z.number().default(5).describe("Seconds between checks (default: 5)"),
    },
}, async ({ inbox, timeout_seconds, poll_interval_seconds }) => {
    const deadline = Date.now() + timeout_seconds * 1000;
    const initial = await client.listMessages();
    const initialCount = initial.filter((m) => m.inbox === inbox).length;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, poll_interval_seconds * 1000));
        const messages = await client.listMessages();
        const inboxMessages = messages.filter((m) => m.inbox === inbox);
        if (inboxMessages.length > initialCount) {
            return { content: [{ type: "text", text: JSON.stringify(inboxMessages[0], null, 2) }] };
        }
    }
    return { content: [{ type: "text", text: JSON.stringify({ result: "timeout", inbox, timeout_seconds }) }] };
});
server.registerTool("buy_quota", {
    description: "Buy more inbox quota with Bitcoin. Returns a payment address, the exact amount, and a BIP21 URI. Pay from a Bitcoin wallet, or give the BIP21 URI to the user to pay. Quota is granted as soon as the payment is seen on the network - no need to wait for confirmations. Call check_payment afterwards.",
    inputSchema: {
        bundle: z.string().optional().describe("Bundle id from list_bundles (default: the cheapest)"),
    },
}, async ({ bundle }) => {
    const quote = await client.createQuote(bundle);
    return { content: [{ type: "text", text: JSON.stringify({
                    ...quote,
                    instructions: `Send exactly ${quote.amount_btc} BTC to ${quote.address}. ` +
                        `Grants ${quote.quota} inboxes. Quote expires ${quote.expires_at}.`,
                }, null, 2) }] };
});
server.registerTool("list_bundles", {
    description: "List the quota bundles available for purchase and their USD prices.",
}, async () => {
    const bundles = await client.getBundles();
    return { content: [{ type: "text", text: JSON.stringify(bundles, null, 2) }] };
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
    return { content: [{ type: "text", text: JSON.stringify({
                    ...state,
                    message: state.quota_credited
                        ? `${state.quota} inboxes credited. create_inbox will now succeed.`
                        : "Payment not yet detected. Send the exact amount, then check again.",
                }, null, 2) }] };
});
const transport = new StdioServerTransport();
await server.connect(transport);
