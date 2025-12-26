"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Avatar, Modal } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined, NotificationOutlined, BellOutlined } from '@ant-design/icons';
import { GetUserProfile } from '../../services/user';
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";
import NewsModal from '../news/NewsModal';
import NotificationBell from '../notification/NotificationBell';
import ReportIssueContent from '../issue/issueReport';

export default function TeacherTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const topbarHeight = 72;
    const router = useRouter();
    const pathname = usePathname() || '';

    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [userInitial, setUserInitial] = useState("?");
    const { logoutClient } = useAuth();

    const navLinkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700 };

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

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
        },
        {
            key: 'create_news',
            icon: <NotificationOutlined />,
            label: 'แจ้งข่าวสาร',
        },
        {
            key: 'report',
            icon: <ExclamationCircleOutlined />,
            label: 'รายงานปัญหา',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'ออกจากระบบ',
        },
    ];

    const handleLogout = async () => {
        try {
            await Logout();
            router.replace('/login');
            logoutClient();
        } catch (error) {
            router.replace('/login');
        }
    };

    const onMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            Modal.confirm({
                title: 'ยืนยันการออกจากระบบ',
                icon: <ExclamationCircleOutlined/>,
                content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
                okText: 'ยืนยัน',
                cancelText: 'ยกเลิก',
                onOk: handleLogout,
            });
        } else if (key === 'create_news') {
            setIsNewsModalOpen(true);
        } else if (key === 'report') {
            // สั่งเปิด Modal เมื่อกดปุ่มรายงานปัญหา
            setIsReportModalOpen(true);
        }
    };

    useEffect(() => {
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
        fetchUserData();
    }, []);

    return (
        <div style={{ fontFamily: "'Noto Sans Thai', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <NewsModal
                isOpen={isNewsModalOpen}
                onClose={() => setIsNewsModalOpen(false)}
            />

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExclamationCircleOutlined style={{ color: '#8A011D' }} /> 
                        แจ้งปัญหาการใช้งาน / ติดตามสถานะ
                    </div>
                }
                open={isReportModalOpen}
                onCancel={() => setIsReportModalOpen(false)}
                footer={null}
                width={700}
                centered
                destroyOnHidden
            >
                {/* เรียกใช้ Component ตัวเดียวกับที่ใช้ใน NotificationBell */}
                <ReportIssueContent/>
            </Modal>

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
            >
                <nav style={{ position: 'absolute', left: 120, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/teacher/dashboard" style={getNavStyle('/teacher/dashboard')}>หน้าหลัก</Link>
                    <Link href="/teacher/group" style={getNavStyle('/teacher/group')}>กลุ่มในที่ปรึกษา</Link>
                    <Link href="/teacher/topic" style={getNavStyle('/teacher/topic')}>หัวข้อโครงงาน</Link>
                    <Link href="/teacher/progress" style={getNavStyle('/teacher/progress')}>ความคืบหน้า</Link>
                </nav>

                <Link href="/teacher/dashboard" className="topbar-logo" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                <div style={{ position: 'absolute', right: 200, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/teacher/chat" style={getNavStyle('/teacher/chat')}>แชท</Link>
                    <Link href="/teacher/appointment" style={getNavStyle('/teacher/appointment')}>การนัดหมาย</Link>
                    <Link href="/teacher/evaluation" style={getNavStyle('/teacher/evaluation')}>การประเมิน</Link>
                    <Link href="/teacher/storage" style={getNavStyle('/teacher/storage')}>คลังโครงงาน</Link>
                </div>

                <div style={{ position: 'absolute', right: 30, display: 'flex', alignItems: 'center', gap: 16 }}>

                    <NotificationBell />

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