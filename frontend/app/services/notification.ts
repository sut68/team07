import api from "./api";
import { NotificationItem } from "../interfaces/Notification";

// GET: ดึงรายการแจ้งเตือนของฉัน
export async function GetMyNotifications() {
    return await api.get<NotificationItem[]>("/notifications/my"); 
}

// PATCH: กดอ่านการแจ้งเตือน
export async function MarkNotificationAsRead(id: number) {
    return await api.patch(`/notifications/${id}/read`);
}