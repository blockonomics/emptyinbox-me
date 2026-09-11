export const BASE_URL = process.env.EMPTYINBOX_BASE_URL ?? "https://emptyinbox.me/api";
// Sent on every request so the server can tell MCP traffic from hand-rolled
// REST clients. Without it, registrations are indistinguishable in the logs.
export const CLIENT_ID = "emptyinbox-mcp/1.2.0";
/** Thrown when the account is out of inbox quota and must pay to continue. */
export class QuotaExhaustedError extends Error {
    detail;
    constructor(detail) {
        super("Inbox quota exhausted. Use buy_quota to purchase more with Bitcoin.");
        this.detail = detail;
        this.name = "QuotaExhaustedError";
    }
}
export async function registerAgent(username) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client": CLIENT_ID },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Registration failed: ${res.status} ${text}`);
    }
    return res.json();
}
export class EmptyInboxClient {
    headers;
    constructor(apiKey) {
        this.headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Client": CLIENT_ID,
        };
    }
    async createInbox() {
        const res = await fetch(`${BASE_URL}/inbox`, {
            method: "POST",
            headers: this.headers,
        });
        if (res.status === 402)
            throw new QuotaExhaustedError(await res.json());
        if (!res.ok)
            throw new Error(`createInbox failed: ${res.status} ${await res.text()}`);
        return res.text();
    }
    async listInboxes() {
        const res = await fetch(`${BASE_URL}/inboxes`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`listInboxes failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    async listMessages(options = {}) {
        // Filtering server-side keeps a poll from dragging down every message on
        // the account just to notice one new arrival.
        const params = new URLSearchParams();
        if (options.inbox)
            params.set("inbox", options.inbox);
        if (options.limit !== undefined)
            params.set("limit", String(options.limit));
        if (options.since !== undefined)
            params.set("since", String(options.since));
        if (options.includeBody === false)
            params.set("include_body", "false");
        const query = params.toString();
        const res = await fetch(`${BASE_URL}/messages${query ? `?${query}` : ""}`, {
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`listMessages failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    async getMessage(msgid) {
        const res = await fetch(`${BASE_URL}/message/${msgid}`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getMessage failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    /** The whole message flattened to text, ready to paste into a prompt. */
    async getMessageText(msgid) {
        const res = await fetch(`${BASE_URL}/message/${msgid}?format=text`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getMessageText failed: ${res.status} ${await res.text()}`);
        return res.text();
    }
    async getBundles() {
        const res = await fetch(`${BASE_URL}/payments/bundles`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getBundles failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    async createQuote(bundle, usd) {
        // usd wins when both are given: a caller that names an amount means it.
        const body = usd !== undefined ? { usd } : bundle ? { bundle } : {};
        const res = await fetch(`${BASE_URL}/payments/quote`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(body),
        });
        if (!res.ok)
            throw new Error(`createQuote failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    async getPaymentStatus(address) {
        const res = await fetch(`${BASE_URL}/payments/status/${address}`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getPaymentStatus failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
    async getQuota() {
        const res = await fetch(`${BASE_URL}/auth/me`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getQuota failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
}
