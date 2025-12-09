"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Dropdown, Avatar } from 'antd';
import { DownOutlined, UserOutlined, ExclamationCircleOutlined, LogoutOutlined } from '@ant-design/icons';

export default function StudentLayout({ userRole, children }: { userRole: string; children?: React.ReactNode }) {
    const topbarHeight = 72;
    const router = useRouter();

    const navLinkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700 };

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/student/profile" style={{ color: 'inherit' }}>โปรไฟล์ของฉัน</Link>,
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
            router.push('/login');
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
                <nav style={{ position: 'absolute', left: 200, display: 'flex', gap: 40 }}>
                    <Link href="/teacher/dashboard" style={navLinkStyle}>หน้าหลัก</Link>
                    <Link href="/teacher/groups" style={navLinkStyle}>กลุ่มในที่ปรึกษา</Link>
                    <Link href="/teacher/projects" style={navLinkStyle}>หัวข้อโครงงาน</Link>
                </nav>

                <Link href="/teacher/dashboard" aria-label="หน้าหลัก" className="topbar-logo" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src="/image/logo1.png" alt="SUT" width={90} height={38} priority />
                </Link>

                <div style={{ position: 'absolute', right: 200, display: 'flex', gap: 40, alignItems: 'center' }}>
                    <Link href="/teacher/chat" style={navLinkStyle}>แชท</Link>
                    <Link href="/teacher/appointments" style={navLinkStyle}>การนัดหมาย</Link>
                    <Link href="/teacher/projects" style={navLinkStyle}>คลังโครงงาน</Link>
                </div>
                    {/* Dropdown user menu */}
                <div style={{ position: 'absolute', right: 30 }}>
                    <Dropdown
                        menu={{ items: menuItems, onClick: onMenuClick }}
                        placement="bottomRight"
                        trigger={['click']}
                        dropdownRender={(menuNode) => (
                            <div style={{ minWidth: 220, fontSize: 14, padding: 25 }}>
                                {menuNode}
                            </div>
                        )}
                    >
                        <a onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                            <Avatar size="large" style={{ backgroundColor: '#fff', color: '#8A011D', fontWeight: 700 }}>S</Avatar>
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