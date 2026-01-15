"use client";
import React, { useState, useEffect } from 'react';
import { GetUserProfile } from '../../services/user';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Avatar, Modal } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";
import ReportIssueContent from '../issue/issueReport';
import NotificationBell from '../notification/NotificationBell';
import '../../style/StudentLayout.css';

export default function StudentTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const router = useRouter();
    const { logoutClient } = useAuth();

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // --- State Declarations (ประกาศตัวแปร State ไว้บนสุด) ---
    const [userInitial, setUserInitial] = useState("?");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname() || '';

    const isActive = (href: string): boolean => {
        return pathname === href || (href !== '/' && pathname.startsWith(href));
    };

    // --- Effects ---
    useEffect(() => {
        // ฟังก์ชันดึงข้อมูลผู้ใช้
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

    // --- Styles ---
    const navLinkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700 };

    const getNavStyle = (href: string): React.CSSProperties => {
        const active = isActive(href);
        return {
            ...navLinkStyle,
            color: navLinkStyle.color,
            paddingBottom: active ? 6 : 0,
            borderBottom: active ? '3px solid #ffffffff' : '3px solid transparent',
            transition: 'border-color 150ms ease, padding-bottom 150ms ease',
        };
    };

    const handleLogout = async () => {
        try {
            await Logout();
            router.replace('/login');
            logoutClient();
        } catch (error) {
            router.replace('/login');
        }
    };

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/student/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
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
        } else if (key === 'report') {
            // สั่งเปิด Modal เมื่อกดปุ่มรายงานปัญหา
            setIsReportModalOpen(true);
        }
    };

    return (
        <div className="layoutContainer">
            {/* Hamburger Toggle Button - Visible on screens <= 1400px */}
            <button
                className={`hamburgerButton ${!isSidebarCollapsed ? 'hamburgerButtonHidden' : ''}`}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                aria-label="Toggle sidebar"
            >
                <MenuOutlined />
            </button>

            {/* Sidebar - Visible on screens <= 1400px */}
            <aside className={`${`sidebar`} ${isSidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
                {/* Close Button */}
                <button
                    className="sidebarCloseButton"
                    onClick={() => setIsSidebarCollapsed(true)}
                    aria-label="Close sidebar"
                >
                    ✕
                </button>

                <nav className="sidebarNav">
                    <Link
                        href="/student/dashboard"
                        className={`sidebarLink ${isActive('/student/dashboard') ? 'sidebarLinkActive' : ''}`}
                    >
                        หน้าหลัก
                    </Link>
                    <Link
                        href="/student/group"
                        className={`sidebarLink ${isActive('/student/group') ? 'sidebarLinkActive' : ''}`}
                    >
                        กลุ่มของฉัน
                    </Link>
                    <Link
                        href="/student/selectAdvisor"
                        className={`sidebarLink ${isActive('/student/selectAdvisor') ? 'sidebarLinkActive' : ''}`}
                    >
                        เลือกที่ปรึกษา
                    </Link>
                    <Link
                        href="/student/topic"
                        className={`sidebarLink ${isActive('/student/topic') ? 'sidebarLinkActive' : ''}`}
                    >
                        หัวข้อโครงงาน
                    </Link>
                    <Link
                        href="/student/progress"
                        className={`sidebarLink ${isActive('/student/progress') ? 'sidebarLinkActive' : ''}`}
                    >
                        ความคืบหน้า
                    </Link>
                    <Link
                        href="/student/chat"
                        className={`sidebarLink ${isActive('/student/chat') ? 'sidebarLinkActive' : ''}`}
                    >
                        แชท
                    </Link>
                    <Link
                        href="/student/exam"
                        className={`sidebarLink ${isActive('/student/exam') ? 'sidebarLinkActive' : ''}`}
                    >
                        เกี่ยวกับสอบ
                    </Link>
                    <Link
                        href="/student/storage"
                        className={`sidebarLink ${isActive('/student/storage') ? 'sidebarLinkActive' : ''}`}
                    >
                        คลังโครงงาน
                    </Link>
                </nav>
            </aside>

            {/* Header - Layout changes based on screen size */}
            <header className={`${`header`} ${isSidebarCollapsed ? `styles.headerCollapsed` : ''}`} role="banner">
                {/* Desktop Navigation - Left (visible > 1400px) */}
                <nav className={`navLeft`}>
                    <Link href="/student/dashboard" style={getNavStyle('/student/dashboard')}>หน้าหลัก</Link>
                    <Link href="/student/group" style={getNavStyle('/student/group')}>กลุ่มของฉัน</Link>
                    <Link href="/student/selectAdvisor" style={getNavStyle('/student/selectAdvisor')}>เลือกที่ปรึกษา</Link>
                    <Link href="/student/topic" style={getNavStyle('/student/topic')}>โครงงานของฉัน</Link>
        
                </nav>

                {/* Logo - Centered */}
                <Link href="/student/dashboard" aria-label="หน้าหลัก" className={`logoContainer`}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                {/* Desktop Navigation - Right (visible > 1400px) */}
                <nav className={`navRight`}>
                    <Link href="/student/progress" style={getNavStyle('/student/progress')}>ความคืบหน้า</Link>
                    <Link href="/student/chat" style={getNavStyle('/student/chat')}>แชท</Link>
                    <Link href="/student/exam" style={getNavStyle('/student/exam')}>เกี่ยวกับสอบ</Link>
                    <Link href="/student/storage" style={getNavStyle('/student/storage')}>คลังโครงงาน</Link>
                </nav>

                {/* User Actions - Always visible */}
                <div className={`userActions`}>
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
                        <a onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', cursor: 'pointer' }}>
                            <Avatar size="large" style={{ backgroundColor: '#fff', color: '#8A011D', fontWeight: 700 }}>{userInitial}</Avatar>
                            <DownOutlined style={{ color: '#fff' }} />
                        </a>
                    </Dropdown>
                </div>
            </header>

            <Modal
                title="รายงานปัญหา"
                open={isReportModalOpen}
                onCancel={() => setIsReportModalOpen(false)}
                footer={null}
            >
                <ReportIssueContent />
            </Modal>

            {/* Main Content */}
            <main className={`${`mainContent`} ${isSidebarCollapsed ? `mainContentCollapsed` : ''}`}>
                {children}
            </main>
        </div>
    );
}