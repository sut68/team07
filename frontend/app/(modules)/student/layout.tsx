"use client";
import RoleGuard from "../roleCheck/roleGuard";
import StudentTopbar from "../../components/layouts/StudentTopbar"; 

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Student"]}>
      <StudentTopbar userRole="Student">
          {children}
      </StudentTopbar>
    </RoleGuard>
  );
}