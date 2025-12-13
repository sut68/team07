"use client";
import React, { useState, useEffect } from 'react';
import { GetUserProfile } from '../../services/user'; // Path ของ service คุณ
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Dropdown, Avatar } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { Logout } from '../../services/login';
import { useAuth } from "../../(modules)/roleCheck/authContext";
export default function StudentTopbar({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const topbarHeight = 72;
    const router = useRouter();
    const { logoutClient } = useAuth();

    const [userInitial, setUserInitial] = useState("?");

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

    const navLinkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700 };
    const handleLogout = async () => {
        try {
            await Logout();
            logoutClient(); // 2. *** สำคัญ *** แจ้ง Client ให้ลบ State ทิ้งทันที
            router.replace('/login');
        } catch (error) {
            router.replace('/login');
        }
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
            label: <Link href="/student/report-issue" style={{ color: 'inherit' }}>รายงานปัญหา</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'ออกจากระบบ',
        },
    ];

    const onMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            handleLogout();
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
                <nav style={{ position: 'absolute', left: 150, display: 'flex', gap: 40 }}>
                    <Link href="/student/dashboard" style={navLinkStyle}>หน้าหลัก</Link>
                    <Link href="/student/group" style={navLinkStyle}>กลุ่มของฉัน</Link>
                    <Link href="/student/selectAdvisor" style={navLinkStyle}>เลือกที่ปรึกษา</Link>
                    <Link href="/student/topic" style={navLinkStyle}>หัวข้อโครงงาน</Link>
                </nav>

                <Link href="/student/dashboard" aria-label="หน้าหลัก" className="topbar-logo" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                <div style={{ position: 'absolute', right: 150, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/student/progress" style={navLinkStyle}>ความคืบหน้า</Link>
                    <Link href="/chat" style={navLinkStyle}>แชท</Link>
                    {/* <Link href="/student/chat" style={navLinkStyle}>แชท</Link> */}
                    <Link href="/student/appointment" style={navLinkStyle}>การนัดหมาย</Link>
                    <Link href="/student/evaluation" style={navLinkStyle}>การประเมิน</Link>
                    <Link href="/student/storage" style={navLinkStyle}>คลังโครงงาน</Link>
                </div>
                    {/* Dropdown user menu */}
                <div style={{ position: 'absolute', right: 30 }}>
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