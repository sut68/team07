export interface NotificationItem {
    id: number;
    ID?: number; 
    title: string;
    message: string;
    is_read: boolean;
    created_at?: string;
    timestamp?: string;
    user_id?: number;
}