"use client";
import RoleGuard from "../roleCheck/roleGuard";
import StudentTopbar from "../../components/layouts/StudentTopbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentTopbar userRole="Student">
      <RoleGuard allowedRoles={["Student"]}>
        {children}
      </RoleGuard>
    </StudentTopbar>
  );
}