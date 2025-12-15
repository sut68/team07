"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GetMe } from "../../services/login";

// 1. เพิ่ม type ให้คนอื่นรู้ว่ามีฟังก์ชัน fetchUser และ logoutClient ให้ใช้
interface AuthContextType {
  userRole: string | null;
  isLoading: boolean;
  user: any;
  fetchUser: () => Promise<void>;
  logoutClient: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userRole: null,
  isLoading: true,
  user: null,
  fetchUser: async () => { },
  logoutClient: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 2. สร้างฟังก์ชัน fetchUser แยกออกมา เพื่อให้เรียกใช้จากหน้า Login ได้
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await GetMe();
      if (userData) {
        setUser(userData);
        setUserRole(userData.role);
      }
    } catch (error) {
      console.log("Not logged in or Guest");
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. ฟังก์ชันสำหรับเคลียร์ค่าตอนกด Logout (เพื่อให้ค่าหายไปทันทีไม่ต้องรอ Server)
  const logoutClient = useCallback(() => {
    setIsLoading(true); // ป้องกันไม่ให้หน้า RoleCheck เด้งขึ้นมา
    setUser(null);
    setUserRole(null);
    router.refresh();
  }, [router]);

  // 4. useEffect เรียก fetchUser อัตโนมัติเมื่อเปลี่ยนหน้า (ยกเว้นหน้า Login)
  useEffect(() => {
    if (pathname?.startsWith("/login")) {
      setIsLoading(false);
      return;
    }
    fetchUser();
  }, [pathname, fetchUser]);

  return (
    <AuthContext.Provider value={{ userRole, isLoading, user, fetchUser, logoutClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);