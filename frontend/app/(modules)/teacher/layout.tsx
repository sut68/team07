import RoleGuard from "../roleCheck/roleGuard";
import TeacherTopbar from "../../components/layouts/TeacherTopbar"; 

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherTopbar userRole="Teacher">
      <RoleGuard allowedRoles={["Teacher"]}>
          {children}
      </RoleGuard>
    </TeacherTopbar>
  );
}