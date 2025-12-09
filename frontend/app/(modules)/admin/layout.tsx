"use client";
import RoleGuard from "../roleCheck/roleGuard";
import AdminSidebar from "../../components/layouts/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminSidebar>
          {children}
      </AdminSidebar>
    </RoleGuard>
  );
}