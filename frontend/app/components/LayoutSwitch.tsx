// "use client";
// import dynamic from "next/dynamic";
// import { usePathname } from "next/navigation";
// import { useAuth } from "../(modules)/roleCheck/authContext";

// // dynamic load layouts
// const AdminSidebar = dynamic(() => import("./layouts/AdminSidebar"), { ssr: false });
// const TeacherTopbar = dynamic(() => import("./layouts/TeacherTopbar"), { ssr: false });
// const StudentTopbar = dynamic(() => import("./layouts/StudentTopbar"), { ssr: false });

// export default function LayoutSwitcher({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const { userRole, isLoading } = useAuth(); // ดึงค่าจาก Context
//   const isLoginPage = pathname.startsWith("/login");

//   if (isLoginPage) return <>{children}</>;
  
//   if (isLoading) return <div style={{ padding: 20, textAlign: "center" }}>Loading System...</div>;

//   // Logic เลือก Layout ตาม Role
//   if (userRole === "Admin") return <AdminSidebar>{children}</AdminSidebar>;
//   if (userRole === "Teacher") return <TeacherTopbar userRole={userRole}>{children}</TeacherTopbar>;
  
//   // Default Layout (Student)
//   return (
//     <StudentTopbar userRole={userRole || "Student"}>
//       {children}
//     </StudentTopbar>
//   );
// }