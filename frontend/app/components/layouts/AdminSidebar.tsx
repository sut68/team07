"use client"
import { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Modal } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ProjectOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ExclamationCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Logout } from '../../services/login';
import 'antd/dist/reset.css';
import '../../style/AdminSidebar.css';
import { useAuth } from "../../(modules)/roleCheck/authContext";
interface SidebarProps {
  children?: ReactNode;
}

export default function AdminSidebar({ children }: SidebarProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { logoutClient } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedKey = useMemo(() => {
    // Map pathname to menu key; use the first two segments
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return '/admin/dashboard';
    return `/${parts.slice(0, 2).join('/')}`;
  }, [pathname]);

  const items = [
    { key: '/admin/dashboard', icon: <HomeOutlined />, label: <span>หน้าแรก</span> },
    { key: '/admin/users-manage', icon: <UserOutlined />, label: <span>จัดการผู้ใช้</span> },
    { key: '/admin/group', icon: <ProjectOutlined />, label: <span>จัดการกลุ่ม</span> },
    { key: '/admin/issue', icon: <BarChartOutlined />, label: <span>จัดการปัญหา</span> },
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
    if (key === '/logout') {
      Modal.confirm({
        title: 'ยืนยันการออกจากระบบ',
        icon: <ExclamationCircleOutlined />,
        content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
        okText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
        onOk: handleLogout,
      });
      return;
    }
    router.push(key);
    // Close mobile menu after navigation
    setMobileOpen(false);
  };

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <MenuOutlined style={{ fontSize: '24px' }} />
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

        <div className="sidebar-header">
          <Link href="/admin/dashboard" className="logo-link">
            <img src="/image/logo1.png" alt="Admin logo" className={`logo`} />
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

      <main className={`main-content`} style={{ marginLeft: collapsed ? '80px' : '256px' }}>{children}</main>
    </div>
  );
}