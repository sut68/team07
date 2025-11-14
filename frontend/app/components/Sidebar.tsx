import Link from 'next/link';

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard' },
];

const logoutItem = { name: 'Logout', href: '/login' };
export default function Sidebar() {
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