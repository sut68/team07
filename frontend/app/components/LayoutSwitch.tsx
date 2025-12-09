"use client";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CheckRole from "../(modules)/roleCheck/protectRollback";

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
  const [userRole] = useState<string | null>(null);
  const [isLoading] = useState(true);
  const isLoginPage = pathname.startsWith("/login");

  CheckRole();
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