"use client";
import React, { useState, useEffect } from 'react';
import { GetUserProfile } from '../../services/user';
import { GetMyNotifications, MarkNotificationAsRead } from '../../services/notification';
import { NotificationItem } from '../../interfaces/Notification';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Avatar, Modal, Badge, Popover, List, Typography } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";

const { Text } = Typography;

export default function StudentTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const topbarHeight = 72;
    const router = useRouter();
    const { logoutClient } = useAuth();

    // --- State Declarations (ประกาศตัวแปร State ไว้บนสุด) ---
    const [userInitial, setUserInitial] = useState("?");
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- Effects ---
    useEffect(() => {
        // 1. ฟังก์ชันดึงข้อมูลผู้ใช้
        const fetchUserData = async () => {
            try {
                const res = await GetUserProfile();
                if (res.status === 200 && res.data && res.data.data) {
                    const userData = res.data.data;
                    const nameToShow = userData.firstname || userData.username || "?";
                    setUserInitial(nameToShow.charAt(0).toUpperCase());
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        // 2. ฟังก์ชันดึงข้อมูลแจ้งเตือน
        const fetchNotifications = async () => {
            try {
                // เรียก API จริง
                const res = await GetMyNotifications();
                if (res.status === 200) {
                    // สมมติว่า Backend ส่งกลับมาเป็น Array
                    // ต้องแปลง field ให้ตรงกับ Interface หากจำเป็น
                    const data = res.data;
                    setNotifications(data);

                    // นับจำนวนที่ is_read = false
                    const unread = data.filter((n: NotificationItem) => !n.is_read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchUserData();
        fetchNotifications();

        // (Optional) Polling ทุก 1 นาที
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []); // Empty dependency array [] แปลว่าทำครั้งเดียวตอนโหลดหน้า

    // --- Styles ---
    const navLinkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700 };
    const pathname = usePathname() || '';
    const getNavStyle = (href: string): React.CSSProperties => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return {
            ...navLinkStyle,
            color: navLinkStyle.color,
            paddingBottom: isActive ? 6 : 0,
            borderBottom: isActive ? '3px solid #ffffffff' : '3px solid transparent',
            transition: 'border-color 150ms ease, padding-bottom 150ms ease',
        };
    };

    // --- Handlers ---
    const handleLogout = async () => {
        try {
            await Logout();
            router.replace('/login');
            logoutClient();
        } catch (error) {
            router.replace('/login');
        }
    };

    // ฟังก์ชันเมื่อคลิกอ่านแจ้งเตือน
    const handleNotificationClick = async (item: NotificationItem) => {
        try {
            // 1. เรียก API แจ้งว่าอ่านแล้ว
            // เช็คว่าใช้ ID ตัวเล็กหรือตัวใหญ่ (item.id หรือ item.ID)
            const notificationID = item.ID || item.id;
            if (notificationID) {
                await MarkNotificationAsRead(notificationID);
            }

            // 2. อัปเดต State หน้าจอทันที
            const updatedList = notifications.map((n: NotificationItem) =>
                (n.id === item.id || n.ID === item.ID) ? { ...n, is_read: true } : n
            );
            setNotifications(updatedList);
            setUnreadCount(prev => Math.max(0, prev - 1));

            // 3. เปลี่ยนหน้า
            router.push('/student/issueReport');
        } catch (error) {
            console.error("Error handling notification click:", error);
        }
    };

    // --- Popover Content ---
    // --- Popover Content ---
    const notificationContent = (
        <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                การแจ้งเตือน
            </div>

            {/* ✅ เปลี่ยนจาก <List> เป็นการ map ข้อมูลธรรมดา เพื่อแก้ปัญหา Deprecated */}
            {notifications.length > 0 ? (
                notifications.map((item: NotificationItem) => (
                    <div
                        key={item.id || item.ID} // ใช้ key ให้ถูกต้อง
                        onClick={() => handleNotificationClick(item)}
                        style={{
                            display: 'flex', // จัด Layout แนวนอนเหมือน List.Item
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '12px',
                            backgroundColor: item.is_read ? '#fff' : '#e6f7ff',
                            transition: 'background 0.3s',
                            borderBottom: '1px solid #f0f0f0' // เส้นขีดคั่นรายการ
                        }}
                    >
                        {/* ส่วนรูปภาพ (Avatar) */}
                        <div style={{ flexShrink: 0 }}>
                            <Avatar icon={<ExclamationCircleOutlined />} style={{ backgroundColor: '#8A011D' }} />
                        </div>

                        {/* ส่วนเนื้อหาข้อความ */}
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

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
        },
        {
            key: 'report',
            icon: <ExclamationCircleOutlined />,
            label: <Link href="/student/issueReport" style={{ color: 'inherit' }}>รายงานปัญหา</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'ออกจากระบบ',
        },
    ];

    const onMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            Modal.confirm({
                title: 'ยืนยันการออกจากระบบ',
                icon: <ExclamationCircleOutlined />,
                content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
                okText: 'ยืนยัน',
                cancelText: 'ยกเลิก',
                onOk: handleLogout,
            });
        }
    };

    return (
        <div
            style={{
                fontFamily: "'Noto Sans Thai', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <header
                style={{
                    height: topbarHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 24px',
                    background: 'linear-gradient(100deg, #8A011D 0%, #7F666B 100%)',
                    color: '#fff',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    zIndex: 100,
                }}
                role="banner"
            >
                <nav style={{ position: 'absolute', left: 100, display: 'flex', gap: 40 }}>
                    <Link href="/student/dashboard" style={getNavStyle('/student/dashboard')}>หน้าหลัก</Link>
                    <Link href="/student/group" style={getNavStyle('/student/group')}>กลุ่มของฉัน</Link>
                    <Link href="/student/selectAdvisor" style={getNavStyle('/student/selectAdvisor')}>เลือกที่ปรึกษา</Link>
                    <Link href="/student/topic" style={getNavStyle('/student/topic')}>หัวข้อโครงงาน</Link>
                    <Link href="/student/progress" style={getNavStyle('/student/progress')}>ความคืบหน้า</Link>
                </nav>

                <Link href="/student/dashboard" aria-label="หน้าหลัก" className="topbar-logo" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>
                <div style={{ position: 'absolute', right: 200, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/student/chat" style={getNavStyle('/chat')}>แชท</Link>
                    <Link href="/student/appointment" style={getNavStyle('/student/appointment')}>การนัดหมาย</Link>
                    <Link href="/student/evaluation" style={getNavStyle('/student/evaluation')}>การประเมิน</Link>
                    <Link href="/student/storage" style={getNavStyle('/student/storage')}>คลังโครงงาน</Link>
                </div>
                <div style={{ position: 'absolute', right: 30, display: 'flex', alignItems: 'center', gap: 16 }}>

                    {/* Popover แจ้งเตือน */}
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

                    <Dropdown
                        menu={{ items: menuItems, onClick: onMenuClick }}
                        placement="bottomRight"
                        trigger={['click']}
                        popupRender={(menuNode) => (
                            <div style={{ minWidth: 220, fontSize: 14, padding: 25 }}>
                                {menuNode}
                            </div>
                        )}
                    >
                        <a onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                            <Avatar size="large" style={{ backgroundColor: '#fff', color: '#8A011D', fontWeight: 700 }}>{userInitial}</Avatar>
                            <DownOutlined style={{ color: '#fff' }} />
                        </a>
                    </Dropdown>
                </div>
            </header>
            <main style={{ padding: 20, paddingTop: 30, flexGrow: 1 }}>
                {children}
            </main>
        </div>
    );
}