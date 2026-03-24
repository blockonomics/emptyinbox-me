const BASE_URL = process.env.EMPTYINBOX_BASE_URL ?? "https://emptyinbox.me/api";
export class EmptyInboxClient {
    headers;
    constructor(apiKey) {
        this.headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        };
    }
    async createInbox() {
        const res = await fetch(`${BASE_URL}/inbox`, {
            method: "POST",
            headers: this.headers,
        });
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
    async listMessages() {
        const res = await fetch(`${BASE_URL}/messages`, { headers: this.headers });
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
    async getQuota() {
        const res = await fetch(`${BASE_URL}/auth/me`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`getQuota failed: ${res.status} ${await res.text()}`);
        return res.json();
    }
}
