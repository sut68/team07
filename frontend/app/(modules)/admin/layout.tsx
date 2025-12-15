"use client";
import RoleGuard from "../roleCheck/roleGuard";
import AdminSidebar from "../../components/layouts/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSidebar>
      <RoleGuard allowedRoles={["Admin"]}>
        {children}
      </RoleGuard>
    </AdminSidebar>
  );
}