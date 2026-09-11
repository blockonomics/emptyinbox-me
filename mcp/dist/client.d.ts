export declare const BASE_URL: string;
export declare const CLIENT_ID = "emptyinbox-mcp/1.2.0";
export interface MessageLink {
    url: string;
    text: string;
    unsubscribe?: boolean;
}
/** The parsed shape the API returns for every message. */
export interface Message {
    id: string;
    inbox: string;
    to: string[];
    subject: string;
    sender: string;
    from_name: string;
    from_email: string;
    timestamp: number;
    received_at: string | null;
    /** What the mail wants: verification | password_reset | login_link | general */
    type: string;
    /** Best one-time code found in the body, if any. */
    code: string | null;
    codes: string[];
    /** The one link worth opening for this message type, if any. */
    action_url: string | null;
    links: MessageLink[];
    preview: string;
    has_html: boolean;
    /** Body fields are omitted when a listing is fetched with include_body=false. */
    text?: string;
    text_body?: string;
    html_body?: string;
    headers?: Record<string, string>;
}
export interface ListMessagesOptions {
    inbox?: string;
    limit?: number;
    /** Unix seconds; only messages received after this are returned. */
    since?: number;
    includeBody?: boolean;
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
export interface RegisterResult {
    api_key: string;
    username: string;
    inbox_quota: number;
    /** Present when the account was created with no free credits. */
    message?: string;
    bundles_url?: string;
}
/**
 * Create an account and return its key.
 *
 * `username` is optional. Leaving it to the server removes the only way this
 * call can fail for a reason the caller could not have predicted: a name
 * collision on a value nothing downstream ever reads.
 *
 * An account with `inbox_quota: 0` is a success, not a failure. The key works;
 * the first inbox costs money. Callers must not treat it as a broken signup.
 */
export declare function registerAgent(username?: string): Promise<RegisterResult>;
export declare class EmptyInboxClient {
    private headers;
    constructor(apiKey: string);
    createInbox(): Promise<string>;
    listInboxes(): Promise<Inbox[]>;
    listMessages(options?: ListMessagesOptions): Promise<Message[]>;
    getMessage(msgid: string): Promise<Message>;
    /** The whole message flattened to text, ready to paste into a prompt. */
    getMessageText(msgid: string): Promise<string>;
    getBundles(): Promise<{
        currency: string;
        default: string;
        bundles: Bundle[];
    }>;
    createQuote(bundle?: string, usd?: number): Promise<Quote>;
    getPaymentStatus(address: string): Promise<PaymentState>;
    getQuota(): Promise<{
        inbox_quota: number;
        username: string;
    }>;
}
