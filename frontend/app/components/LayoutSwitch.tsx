"use client";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GetMe } from "../services/login";

// dynamic load layouts
const AdminSidebar = dynamic(() => import("./layouts/AdminSidebar"), { ssr: false });
const TeacherTopbar = dynamic(() => import("./layouts/TeacherTopbar"), { ssr: false });
const StudentTopbar = dynamic(() => import("./layouts/StudentTopbar"), { ssr: false });

export default function LayoutSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoginPage = pathname.startsWith("/login");

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        return;
      }

      try {
        // NEW: GetMe() ตอนนี้ return res.data โดยตรงแล้ว
        const userData = await GetMe();

        // ** FIXED: ใช้ userData.role โดยตรง (บรรทัด 31 เดิม) **
        setUserRole(userData.role);
      } catch (error) {
        setUserRole(null);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (isLoading || !userRole) return <div style={{ padding: 20, textAlign: "center" }}>Checking authentication...</div>;

  if (userRole === "Admin") return <AdminSidebar>{children}</AdminSidebar>;
  if (userRole === "Teacher") return <TeacherTopbar userRole={userRole}>{children}</TeacherTopbar>;
  // default -> Student
  return (
    <StudentTopbar userRole={userRole}>
      {children}
    </StudentTopbar>
  );
}