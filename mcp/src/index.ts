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

server.registerTool("create_inbox", {
  description: "Create a new disposable email inbox. Returns the email address. Use this before triggering any signup or email verification flow.",
}, async () => {
  const email = await client.createInbox();
  return { content: [{ type: "text" as const, text: email.trim() }] };
});

server.registerTool("list_inboxes", {
  description: "List all disposable email inboxes on this account.",
}, async () => {
  const inboxes = await client.listInboxes();
  return { content: [{ type: "text" as const, text: JSON.stringify(inboxes, null, 2) }] };
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
  return { content: [{ type: "text" as const, text: JSON.stringify(compact, null, 2) }] };
});

server.registerTool("get_message", {
  description: "Get the full content of a specific email message by its ID.",
  inputSchema: {
    message_id: z.string().describe("Message ID from list_messages"),
  },
}, async ({ message_id }) => {
  const msg = await client.getMessage(message_id);
  return { content: [{ type: "text" as const, text: JSON.stringify(msg, null, 2) }] };
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
      return { content: [{ type: "text" as const, text: JSON.stringify(inboxMessages[0], null, 2) }] };
    }
  }

  return { content: [{ type: "text" as const, text: JSON.stringify({ result: "timeout", inbox, timeout_seconds }) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
