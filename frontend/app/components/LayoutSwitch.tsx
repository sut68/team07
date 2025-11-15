"use client"; 

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar = pathname.startsWith('/login'); 

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="app-container"> 
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}