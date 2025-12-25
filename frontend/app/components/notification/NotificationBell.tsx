"use client";
import React, { useState, useEffect } from 'react';
import { Badge, Popover, Avatar, Typography, Modal, Button } from 'antd'; // ✅ เพิ่ม Modal, Button
import { BellOutlined, ExclamationCircleOutlined, FormOutlined } from '@ant-design/icons'; // ✅ เพิ่ม FormOutlined
import { GetMyNotifications, MarkNotificationAsRead } from '../../services/notification'; 
import { NotificationItem } from '../../interfaces/Notification';

// ✅ Import Component หน้ารายงานปัญหาเข้ามา (เช็ค Path ให้ถูกกับโฟลเดอร์ของคุณ)
// เนื่องจากไฟล์นี้อยู่ components/notification ดังนั้นต้องถอยกลับไปหา components/issue
import ReportIssueContent from '../issue/issueReport'; 

const { Text } = Typography;

export default function NotificationBell() {
    // ❌ ไม่รับ Props redirectPath แล้ว เพราะเราจะเปิด Modal แทนการเปลี่ยนหน้า

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // ✅ State ควบคุมการเปิด/ปิด Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Fetch Data on Mount ---
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await GetMyNotifications();
            if (res.status === 200) {
                const data = res.data;
                setNotifications(data);
                const unread = data.filter((n: NotificationItem) => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // --- Handler ---
    const handleNotificationClick = async (item: NotificationItem) => {
        try {
            const notificationID = item.ID || item.id;
            if (notificationID) {
                await MarkNotificationAsRead(notificationID);
            }

            // Update UI immediately
            const updatedList = notifications.map((n) =>
                (n.id === item.id || n.ID === item.ID) ? { ...n, is_read: true } : n
            );
            setNotifications(updatedList);
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // ✅ เปิด Modal แทนการ Redirect
            setIsModalOpen(true); 

        } catch (error) {
            console.error("Error handling notification click:", error);
        }
    };

    // --- Content UI ---
    const notificationContent = (
        <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
            <div style={{ 
                padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <span>การแจ้งเตือน</span>
                {/* ปุ่มลัดสำหรับกดแจ้งปัญหาใหม่ทันที */}
                <Button 
                    type="link" 
                    size="small" 
                    icon={<FormOutlined />} 
                    onClick={() => setIsModalOpen(true)}
                    title="แจ้งปัญหาใหม่"
                />
            </div>

            {notifications.length > 0 ? (
                notifications.map((item) => (
                    <div
                        key={item.id || item.ID}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '12px',
                            backgroundColor: item.is_read ? '#fff' : '#e6f7ff',
                            transition: 'background 0.3s',
                            borderBottom: '1px solid #f0f0f0'
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            <Avatar icon={<ExclamationCircleOutlined />} style={{ backgroundColor: '#8A011D' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '2px' }}>
                                <Text strong={!item.is_read} style={{ fontSize: '14px' }}>
                                    {item.title}
                                </Text>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', lineHeight: '1.4' }}>
                                {item.message}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999' }}>
                                {item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : item.timestamp}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    ไม่มีการแจ้งเตือน
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* ส่วนปุ่มกระดิ่ง */}
            <Popover
                content={notificationContent}
                trigger="click"
                placement="bottomRight"
                arrow={false}
            >
                <Badge count={unreadCount} offset={[-2, 2]} size="small">
                    <BellOutlined style={{ fontSize: '20px', cursor: 'pointer', color: '#fff' }} />
                </Badge>
            </Popover>

            {/* ✅ ส่วน Modal ที่ซ่อนอยู่ จะแสดงเมื่อ isModalOpen = true */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExclamationCircleOutlined style={{ color: '#8A011D' }} /> 
                        แจ้งปัญหาการใช้งาน / ติดตามสถานะ
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null} // ไม่เอาปุ่ม OK/Cancel ของ Modal เพราะเรามีปุ่มใน Form แล้ว
                width={700}
                centered
                destroyOnClose // ล้างข้อมูลเมื่อปิด Modal
            >
                {/* เรียกใช้ Component เนื้อหาที่เราทำไว้ */}
                <ReportIssueContent />
            </Modal>
        </>
    );
}