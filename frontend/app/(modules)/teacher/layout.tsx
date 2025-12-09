"use client";
import RoleGuard from "../roleCheck/roleGuard";
import TeacherTopbar from "../../components/layouts/TeacherTopbar"; 

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Teacher"]}>
      <TeacherTopbar userRole="Student">
          {children}
      </TeacherTopbar>
    </RoleGuard>
  );
}