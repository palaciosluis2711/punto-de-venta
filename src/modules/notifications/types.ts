export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationStatus = 'unread' | 'read';

export interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string; // ISO String
    sourceStoreId: string | 'system';
    targetStoreId: string | 'all';
    priority: NotificationPriority;
    status: NotificationStatus;
    readAt?: string; // ISO String
    type?: string; // 'transfer', 'inventory', 'system', 'message', 'request'
    relatedEntityId?: string; // ID of the transfer or sale related to this
    payload?: any; // For structured data like request items
}
