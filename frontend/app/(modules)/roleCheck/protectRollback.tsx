"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GetMe } from "../../services/login";

export default function CheckRole() {
      const pathname = usePathname();
      const router = useRouter();
      const [,setUserRole] = useState<string | null>(null);
      const [, setIsLoading] = useState(true);
      const isLoginPage = pathname.startsWith("/login");
    useEffect(() => {
        const fetchUserRole = async () => {
        if (isLoginPage) {
            setIsLoading(false);
            return;
        }

        try {
            // NEW: GetMe() ตอนนี้ return res.data โดยตรงแล้ว
            const userData = await GetMe();

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
}
