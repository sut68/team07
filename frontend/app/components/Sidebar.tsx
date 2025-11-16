import Link from 'next/link';

const roleNavItems: { [key: string]: { name: string; href: string }[] } = { 
  Admin: [
    { name: 'Dashboard Admin', href: '/admin/dashboard' },
    { name: 'จัดการผู้ใช้', href: '/admin/users' },
  ],
  Teacher: [
    { name: 'Dashboard Teacher', href: '/teacher/dashboard' },
    { name: 'กำหนดการสอน', href: '/teacher/schedule' },
  ],
  Student: [
    { name: 'Dashboard Student', href: '/student/dashboard' },
    { name: 'ข้อมูลโครงการ', href: '/student/project' },
  ],
};

const logoutItem = { name: 'Logout', href: '/login' };

export default function Sidebar({ userRole }: { userRole: string | null }) { 
  const mainNavItems = roleNavItems[userRole || ''] || []; 

  return (
    <aside className="sidebar">
      
      <div className="sidebar-header">
        CapStone Hub
      </div>
      <nav className="sidebar-nav">
        <ul>
          {mainNavItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-logout" style={{ marginTop: 'auto' }}>
        <nav className="sidebar-nav">
          <ul>
            <li key={logoutItem.name}>
              <Link href={logoutItem.href}>
                {logoutItem.name}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
    </aside>
  );
}