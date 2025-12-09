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

<<<<<<< HEAD
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        return;
      }

      try {
        // NEW: GetMe() ตอนนี้ return res.data โดยตรงแล้ว
        const userData = await GetMe();


        const user = userData.id



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
=======
//   if (isLoginPage) return <>{children}</>;
  
//   if (isLoading) return <div style={{ padding: 20, textAlign: "center" }}>Loading System...</div>;
>>>>>>> main

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