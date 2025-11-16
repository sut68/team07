"use client";
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { GetMe } from '../services/login';

export default function LayoutSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname.startsWith('/login');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await GetMe();
        setUserRole(res.data.role);
      } catch (error) {
        console.error("Authentication failed. Redirecting to login.");
        setUserRole(null);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // ถ้ากำลังโหลด หรือถูก Redirect
  if (isLoading || !userRole) {
    // แสดงข้อความ Loading แบบง่ายๆ
    return <div style={{ padding: '20px', textAlign: 'center' }}>Checking authentication...</div>;
  }

  // 3. ถ้าทุกอย่างเรียบร้อย แสดง Layout ปกติ
  return (
    <div className="app-container">
      <Sidebar userRole={userRole} />
      <main className="main-content">
        {children}
      </main>
      <style jsx global>{`
  .app-container {
   display: flex;
   min-height: 100vh;
  }
  .main-content {
   flex-grow: 1;
   padding: 20px;
  }
 `}</style>
    </div>
  );
}