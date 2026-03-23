#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EmptyInboxClient } from "./client.js";
const apiKey = process.env.EMPTYINBOX_API_KEY;
if (!apiKey) {
    console.error("Error: EMPTYINBOX_API_KEY environment variable is required.");
    console.error("Get your API key at https://emptyinbox.me/settings.html");
    process.exit(1);
}
const client = new EmptyInboxClient(apiKey);
const server = new McpServer({
    name: "emptyinbox",
    version: "1.0.0",
});
server.tool("create_inbox", "Create a new disposable email inbox. Returns the email address. Use this before triggering any signup or email verification flow.", {}, async () => {
    const email = await client.createInbox();
    return { content: [{ type: "text", text: email.trim() }] };
});
server.tool("list_inboxes", "List all disposable email inboxes on this account.", {}, async () => {
    const inboxes = await client.listInboxes();
    return { content: [{ type: "text", text: JSON.stringify(inboxes, null, 2) }] };
});
server.tool("list_messages", "List all received email messages, newest first. Optionally filter by inbox address.", {
    inbox: z
        .string()
        .optional()
        .describe("Filter messages to a specific inbox email address"),
}, async ({ inbox }) => {
    const messages = await client.listMessages();
    const filtered = inbox ? messages.filter((m) => m.inbox === inbox) : messages;
    return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
});
server.tool("get_message", "Get the full content of a specific email message by its ID.", {
    message_id: z.string().describe("The message ID from list_messages"),
}, async ({ message_id }) => {
    const msg = await client.getMessage(message_id);
    return { content: [{ type: "text", text: JSON.stringify(msg, null, 2) }] };
});
server.tool("wait_for_message", "Poll an inbox until a new message arrives. Use this after triggering an email verification, OTP, or signup confirmation — it will block and return the message as soon as it lands. Returns null if the timeout is reached.", {
    inbox: z.string().describe("The inbox email address to watch"),
    timeout_seconds: z
        .number()
        .default(120)
        .describe("How long to wait before giving up (default: 120s)"),
    poll_interval_seconds: z
        .number()
        .default(5)
        .describe("How often to check for new messages (default: 5s)"),
}, async ({ inbox, timeout_seconds, poll_interval_seconds }) => {
    const deadline = Date.now() + timeout_seconds * 1000;
    const initial = await client.listMessages();
    const initialCount = initial.filter((m) => m.inbox === inbox).length;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, poll_interval_seconds * 1000));
        const messages = await client.listMessages();
        const inboxMessages = messages.filter((m) => m.inbox === inbox);
        if (inboxMessages.length > initialCount) {
            return {
                content: [{ type: "text", text: JSON.stringify(inboxMessages[0], null, 2) }],
            };
        }
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ result: "timeout", inbox, timeout_seconds }),
            },
        ],
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
