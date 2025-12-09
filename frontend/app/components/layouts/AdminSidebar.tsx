"use client"
import React, { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  ProjectOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Logout } from '../../services/login';
import 'antd/dist/reset.css';
import './AdminSidebar.css';
import { useAuth } from "../../(modules)/roleCheck/authContext";
interface SidebarProps {
  children?: ReactNode;
}

export default function AdminSidebar({ children }: SidebarProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { logoutClient } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const selectedKey = useMemo(() => {
    // Map pathname to menu key; use the first two segments
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return '/admin/dashboard';
    return `/${parts.slice(0, 2).join('/')}`;
  }, [pathname]);

  const items = [
    { key: '/admin/dashboard', icon: <HomeOutlined />, label: <span>หน้าแรก</span> },
    { key: '/admin/users', icon: <UserOutlined />, label: <span>จัดการผู้ใช้</span> },
    { key: '/admin/projects', icon: <ProjectOutlined />, label: <span>จัดการกลุ่ม</span> },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: <span>รายงาน</span> },
    { key: '/logout', icon: <LogoutOutlined />, label: <span>ออกจากระบบ</span> },
  ];
  const handleLogout = async () => {
      try {
            await Logout(); // 1. แจ้ง Server ให้ลบ Cookie
            logoutClient(); // 2. *** สำคัญ *** แจ้ง Client ให้ลบ State ทิ้งทันที
            router.replace('/login');
        } catch (error) {
            router.replace('/login');
        }
  };
  const onMenuClick = ({ key }: { key: string }) => {
    // แก้ตรงนี้
    if (key.endsWith('/logout') || key === 'logout') { // เช็คเผื่อ key เปลี่ยน
       handleLogout();
       return;
    }
    router.push(key);
  };

  return (
    <div className="app-container">
      {/* Fixed full-height sidebar (collapsible) */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link href="/admin/dashboard" className="logo-link">
            <img src="/image/logo.png" alt="Admin logo" className={`logo`} />
          </Link>
        </div>

        <div className="menu-wrapper">
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[selectedKey]}
            items={items}
            onClick={onMenuClick}
            style={{ borderRight: 'none' }}
          />
        </div>

      </aside>

      {/* Collapse handle on dividing line */}
      <div
        role="button"
        tabIndex={0}
        className={`collapse-handle ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCollapsed(!collapsed); }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      {/* Main content shifted right to avoid the fixed sidebar yoyo*/}
      <main className={`main-content`} style={{ marginLeft: collapsed ? '80px' : '256px' }}>{children}</main>
    </div>
  );
}