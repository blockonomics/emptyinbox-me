export const BASE_URL = process.env.EMPTYINBOX_BASE_URL ?? "https://emptyinbox.me/api";

// Sent on every request so the server can tell MCP traffic from hand-rolled
// REST clients. Without it, registrations are indistinguishable in the logs.
export const CLIENT_ID = "emptyinbox-mcp/1.1.0";

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

export interface Bundle {
  id: string;
  quota: number;
  usd: number;
}

export interface Quote {
  address: string;
  bundle: string;
  quota: number;
  usd: number;
  amount_satoshis: number;
  amount_btc: string;
  bip21: string;
  expires_at: string;
  status_url: string;
}

export interface PaymentState {
  address: string;
  status: number;
  expected_satoshis: number;
  received_satoshis: number;
  quota: number;
  quota_credited: boolean;
  settled: boolean;
  revoked: boolean;
  txid: string | null;
  expires_at: string;
}

/** Thrown when the account is out of inbox quota and must pay to continue. */
export class QuotaExhaustedError extends Error {
  constructor(public readonly detail: Record<string, unknown>) {
    super("Inbox quota exhausted. Use buy_quota to purchase more with Bitcoin.");
    this.name = "QuotaExhaustedError";
  }
}

export async function registerAgent(username: string): Promise<{ api_key: string; username: string; inbox_quota: number }> {
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
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Client": CLIENT_ID,
    };
  }

  async createInbox(): Promise<string> {
    const res = await fetch(`${BASE_URL}/inbox`, {
      method: "POST",
      headers: this.headers,
    });
    if (res.status === 402) throw new QuotaExhaustedError(await res.json());
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

  async getBundles(): Promise<{ currency: string; default: string; bundles: Bundle[] }> {
    const res = await fetch(`${BASE_URL}/payments/bundles`, { headers: this.headers });
    if (!res.ok) throw new Error(`getBundles failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async createQuote(bundle?: string): Promise<Quote> {
    const res = await fetch(`${BASE_URL}/payments/quote`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(bundle ? { bundle } : {}),
    });
    if (!res.ok) throw new Error(`createQuote failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getPaymentStatus(address: string): Promise<PaymentState> {
    const res = await fetch(`${BASE_URL}/payments/status/${address}`, { headers: this.headers });
    if (!res.ok) throw new Error(`getPaymentStatus failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getQuota(): Promise<{ inbox_quota: number; username: string }> {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: this.headers });
    if (!res.ok) throw new Error(`getQuota failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}
