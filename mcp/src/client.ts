const BASE_URL = process.env.EMPTYINBOX_BASE_URL ?? "https://emptyinbox.me/api";

export interface MessageSummary {
  id: string;
  inbox: string;
  subject: string;
  text_body: string;
  html_body: string;
  sender: string;
  timestamp: number;
}

export interface MessageFull {
  recipients: string[];
  headers: Record<string, string>;
  text_body: string;
  html_body: string;
  sender: string;
}

export interface Inbox {
  inbox: string;
  created_at: string;
}

export class EmptyInboxClient {
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async createInbox(): Promise<string> {
    const res = await fetch(`${BASE_URL}/inbox`, {
      method: "POST",
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`createInbox failed: ${res.status} ${await res.text()}`);
    return res.text();
  }

  async listInboxes(): Promise<Inbox[]> {
    const res = await fetch(`${BASE_URL}/inboxes`, { headers: this.headers });
    if (!res.ok) throw new Error(`listInboxes failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async listMessages(): Promise<MessageSummary[]> {
    const res = await fetch(`${BASE_URL}/messages`, { headers: this.headers });
    if (!res.ok) throw new Error(`listMessages failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getMessage(msgid: string): Promise<MessageFull> {
    const res = await fetch(`${BASE_URL}/message/${msgid}`, { headers: this.headers });
    if (!res.ok) throw new Error(`getMessage failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getQuota(): Promise<{ inbox_quota: number; username: string }> {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: this.headers });
    if (!res.ok) throw new Error(`getQuota failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}
