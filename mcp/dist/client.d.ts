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
export declare class EmptyInboxClient {
    private headers;
    constructor(apiKey: string);
    createInbox(): Promise<string>;
    listInboxes(): Promise<Inbox[]>;
    listMessages(): Promise<MessageSummary[]>;
    getMessage(msgid: string): Promise<MessageFull>;
    getQuota(): Promise<{
        inbox_quota: number;
        username: string;
    }>;
}
