"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Avatar, Modal } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined, NotificationOutlined, MenuOutlined } from '@ant-design/icons';
import { GetUserProfile } from '../../services/user';
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";
import NewsModal from '../news/NewsModal';
import ReportIssueContent from '../issue/issueReport';
import NotificationBell from '../notification/NotificationBell';
import styles from './TeacherLayout.module.css';

export default function TeacherTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname() || '';

    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [userInitial, setUserInitial] = useState("?");
    const { logoutClient } = useAuth();

    const isActive = (href: string): boolean => {
        return pathname === href || (href !== '/' && pathname.startsWith(href));
    };

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

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/teacher/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
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
                icon: <ExclamationCircleOutlined />,
                content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
                okText: 'ยืนยัน',
                cancelText: 'ยกเลิก',
                onOk: handleLogout,
            });
        } else if (key === 'create_news') {
            setIsNewsModalOpen(true);
        } else if (key === 'report') {
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
        <div className={styles.layoutContainer}>
            <NewsModal
                isOpen={isNewsModalOpen}
                onClose={() => setIsNewsModalOpen(false)}
            />
            <Modal
                title="รายงานปัญหา"
                open={isReportModalOpen}
                onCancel={() => setIsReportModalOpen(false)}
                footer={null}
            >
                <ReportIssueContent />
            </Modal>

            {/* Hamburger Toggle Button - Visible on screens <= 1400px */}
            <button
                className={`${styles.hamburgerButton} ${!isSidebarCollapsed ? styles.hamburgerButtonHidden : ''}`}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                aria-label="Toggle sidebar"
            >
                <MenuOutlined />
            </button>

            {/* Sidebar - Visible on screens <= 1400px */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                {/* Close Button */}
                <button
                    className={styles.sidebarCloseButton}
                    onClick={() => setIsSidebarCollapsed(true)}
                    aria-label="Close sidebar"
                >
                    ✕
                </button>

                <nav className={styles.sidebarNav}>
                    <Link
                        href="/teacher/dashboard"
                        className={`${styles.sidebarLink} ${isActive('/teacher/dashboard') ? styles.sidebarLinkActive : ''}`}
                    >
                        หน้าหลัก
                    </Link>
                    <Link
                        href="/teacher/group"
                        className={`${styles.sidebarLink} ${isActive('/teacher/group') ? styles.sidebarLinkActive : ''}`}
                    >
                        กลุ่มในที่ปรึกษา
                    </Link>
                    <Link
                        href="/teacher/topic"
                        className={`${styles.sidebarLink} ${isActive('/teacher/topic') ? styles.sidebarLinkActive : ''}`}
                    >
                        หัวข้อโครงงาน
                    </Link>
                    <Link
                        href="/teacher/progress"
                        className={`${styles.sidebarLink} ${isActive('/teacher/progress') ? styles.sidebarLinkActive : ''}`}
                    >
                        ความคืบหน้า
                    </Link>
                    <Link
                        href="/teacher/chat"
                        className={`${styles.sidebarLink} ${isActive('/teacher/chat') ? styles.sidebarLinkActive : ''}`}
                    >
                        แชท
                    </Link>
                    <Link
                        href="/teacher/appointment"
                        className={`${styles.sidebarLink} ${isActive('/teacher/appointment') ? styles.sidebarLinkActive : ''}`}
                    >
                        การนัดหมาย
                    </Link>
                    <Link
                        href="/teacher/evaluation"
                        className={`${styles.sidebarLink} ${isActive('/teacher/evaluation') ? styles.sidebarLinkActive : ''}`}
                    >
                        การประเมิน
                    </Link>
                    <Link
                        href="/teacher/storage"
                        className={`${styles.sidebarLink} ${isActive('/teacher/storage') ? styles.sidebarLinkActive : ''}`}
                    >
                        คลังโครงงาน
                    </Link>
                </nav>
            </aside>

            {/* Header - Layout changes based on screen size */}
            <header className={`${styles.header} ${isSidebarCollapsed ? styles.headerCollapsed : ''}`}>
                {/* Desktop Navigation - Left (visible > 1400px) */}
                <nav className={styles.navLeft}>
                    <Link href="/teacher/dashboard" style={getNavStyle('/teacher/dashboard')}>หน้าหลัก</Link>
                    <Link href="/teacher/group" style={getNavStyle('/teacher/group')}>กลุ่มในที่ปรึกษา</Link>
                    <Link href="/teacher/topic" style={getNavStyle('/teacher/topic')}>หัวข้อโครงงาน</Link>
                    <Link href="/teacher/progress" style={getNavStyle('/teacher/progress')}>ความคืบหน้า</Link>
                </nav>

                {/* Logo - Centered */}
                <Link href="/teacher/dashboard" className={styles.logoContainer}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                {/* Desktop Navigation - Right (visible > 1400px) */}
                <nav className={styles.navRight}>
                    <Link href="/teacher/chat" style={getNavStyle('/teacher/chat')}>แชท</Link>
                    <Link href="/teacher/appointment" style={getNavStyle('/teacher/appointment')}>การนัดหมาย</Link>
                    <Link href="/teacher/evaluation" style={getNavStyle('/teacher/evaluation')}>การประเมิน</Link>
                    <Link href="/teacher/storage" style={getNavStyle('/teacher/storage')}>คลังโครงงาน</Link>
                </nav>

                {/* User Actions - Always visible */}
                <div className={styles.userActions}>
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

            {/* Main Content */}
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
                {children}
            </main>
        </div>
    );
}