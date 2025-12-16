"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Avatar } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { GetUserProfile } from '../../services/user'; // Path ของ service คุณ
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";

export default function TeacherTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const topbarHeight = 72;
    const router = useRouter();

    const [userInitial, setUserInitial] = useState("?");
    const { logoutClient } = useAuth();
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

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
        },
        {
            key: 'report',
            icon: <ExclamationCircleOutlined />,
            label: <Link href="/teacher/issueReport" style={{ color: 'inherit' }}>รายงานปัญหา</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'ออกจากระบบ',
        },
    ];
    const handleLogout = async () => {
        try {
            await Logout(); // 1. แจ้ง Server ให้ลบ Cookie
            router.replace('/login'); // เปลี่ยนหน้าก่อน
            logoutClient(); // 2. *** สำคัญ *** แจ้ง Client ให้ลบ State ทิ้งทันที
        } catch (error) {
            router.replace('/login');
        }
    };

    const onMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            handleLogout();
        }
    };
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await GetUserProfile();
                // โครงสร้างข้อมูล: res.data.data.firstname (ตามที่คุยกันรอบก่อน)
                if (res.status === 200 && res.data && res.data.data) {
                    const userData = res.data.data;
                    // ใช้ firstname เป็นหลัก ถ้าไม่มีให้ใช้ username
                    const nameToShow = userData.firstname || userData.username || "?";
                    // ตัดเอาตัวแรก และแปลงเป็นตัวพิมพ์ใหญ่
                    setUserInitial(nameToShow.charAt(0).toUpperCase());
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserData();
    }, []);
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
                <nav style={{ position: 'absolute', left: 120, display: 'flex', gap: 40 }}>
                    <Link href="/teacher/dashboard" style={getNavStyle('/teacher/dashboard')}>หน้าหลัก</Link>
                    <Link href="/teacher/advisor" style={getNavStyle('/teacher/advisor')}>ที่ปรึกษาของฉัน</Link>
                    <Link href="/teacher/group" style={getNavStyle('/teacher/group')}>กลุ่มในที่ปรึกษา</Link>
                    <Link href="/teacher/topic" style={getNavStyle('/teacher/topic')}>หัวข้อโครงงาน</Link>
                    <Link href="/chat" style={getNavStyle('/chat')}>แชท</Link>
                </nav>

                <Link href="/teacher/dashboard" aria-label="หน้าหลัก" className="topbar-logo" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                <div style={{ position: 'absolute', right: 200, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/teacher/progress" style={getNavStyle('/teacher/progress')}>ความคืบหน้า</Link>
                    <Link href="/teacher/appointment" style={getNavStyle('/teacher/appointment')}>การนัดหมาย</Link>
                    <Link href="/teacher/evaluation" style={getNavStyle('/teacher/evaluation')}>การประเมิน</Link>
                    <Link href="/teacher/storage" style={getNavStyle('/teacher/storage')}>คลังโครงงาน</Link>
                </div>

                <div style={{ position: 'absolute', right: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <BellOutlined style={{ fontSize: '20px', cursor: 'pointer', color: '#fff' }} />
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
