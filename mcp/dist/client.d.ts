export declare const BASE_URL: string;
export declare const CLIENT_ID = "emptyinbox-mcp/1.1.0";
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
export declare class QuotaExhaustedError extends Error {
    readonly detail: Record<string, unknown>;
    constructor(detail: Record<string, unknown>);
}
export declare function registerAgent(username: string): Promise<{
    api_key: string;
    username: string;
    inbox_quota: number;
}>;
export declare class EmptyInboxClient {
    private headers;
    constructor(apiKey: string);
    createInbox(): Promise<string>;
    listInboxes(): Promise<Inbox[]>;
    listMessages(): Promise<MessageSummary[]>;
    getMessage(msgid: string): Promise<MessageFull>;
    getBundles(): Promise<{
        currency: string;
        default: string;
        bundles: Bundle[];
    }>;
    createQuote(bundle?: string): Promise<Quote>;
    getPaymentStatus(address: string): Promise<PaymentState>;
    getQuota(): Promise<{
        inbox_quota: number;
        username: string;
    }>;
}
