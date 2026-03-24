#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { EmptyInboxClient, registerAgent } from "./client.js";
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
    version: "1.0.0",
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
    const email = await client.createInbox();
    return { content: [{ type: "text", text: email.trim() }] };
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
const transport = new StdioServerTransport();
await server.connect(transport);
