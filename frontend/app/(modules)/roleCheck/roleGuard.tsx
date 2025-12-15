"use client";
import { useAuth } from "./authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Modal, Result, Button } from "antd";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { userRole, isLoading } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [isDenied, setIsDenied] = useState(false);

  // ใช้ ref เพื่อเก็บ ID ของ Timer จะได้สั่งหยุดได้แม่นยำ
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        setIsDenied(true);

        // 1. เริ่มนับถอยหลังตัวเลข
        intervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 2. ตั้งเวลาดีดไปหน้า Login เมื่อครบ 3 วิ
        timerRef.current = setTimeout(() => {
          router.push("/login");
        }, 8000);
      }
    }

    // Cleanup function: เคลียร์ Timer เมื่อ Component ถูกทำลาย
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userRole, isLoading, allowedRoles, router]);

  // ฟังก์ชันสำหรับปุ่ม "ยกเลิก"
  const handleCancel = () => {
    // หยุด Timer ทั้งหมดทันที
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // พาผู้ใช้ย้อนกลับไปหน้าก่อนหน้านี้
    router.back();
  };

  if (isLoading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Checking Permission...</div>;
  }

  if (isDenied) {
    return (
      <Modal
        open={true}
        footer={null}
        closable={false}
        centered
        zIndex={9999}
      >
        <Result
          status="403"
          title="Access Denied"
          subTitle={
            <div>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Role ของคุณ: <b>{userRole || "Guest"}</b>)
              </p>
              <p style={{ color: '#888' }}>
                จะเปลี่ยนหน้าอัตโนมัติใน <span style={{ color: 'red', fontWeight: 'bold' }}>{countdown}</span> วินาที
              </p>
            </div>
          }
          extra={[
            // ปุ่มไป Login (Primary)
            <Button
              key="login"
              type="primary"
              danger
              onClick={() => router.push('/login')}
            >
              ไปหน้า Login
            </Button>,

            // ปุ่มยกเลิก/ย้อนกลับ (Secondary)
            <Button
              key="cancel"
              onClick={handleCancel}
            >
              ยกเลิก (ย้อนกลับ)
            </Button>
          ]}
        />
      </Modal>
    );
  }

  return <>{children}</>;
}