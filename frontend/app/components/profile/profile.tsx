"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetUserProfile } from '../../services/user';
import { UserProfileInterface } from '../../interfaces/Users';
import "../../style/profile.css";
import EditProfilePage from '../editprofile/editprofile';

interface ProfilePageProps {
  initialUser?: UserProfileInterface; // รับข้อมูล User ถ้ามี
  isReadOnly?: boolean; // เปิดโหมดอ่านอย่างเดียว
}

export default function ProfilePage({ initialUser, isReadOnly = false }: ProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileInterface | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับตรวจสอบโหมดแก้ไข
  const [isEditing, setIsEditing] = useState(false);

  // แยกฟังก์ชัน fetch ออกมาเพื่อให้เรียกซ้ำได้ง่าย
  const fetchProfile = async () => {
    if (initialUser) return;

    try {
      const res = await GetUserProfile();
      if (res.status === 200 && res.data) {
        setUser(res.data.data || res.data);
      } else {
        setError("Failed to load profile data");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Unauthorized or Network Error");
      // setTimeout(() => router.push('/login'), 2000); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ถ้า initialUser เปลี่ยน ให้ update state ตาม
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
    } else {
      fetchProfile();
    }
  }, [initialUser]);

  const getInitials = (firstname?: string) => {
    return firstname ? firstname.charAt(0).toUpperCase() : "?";
  };

  // ส่วนสลับหน้า: ถ้าอยู่ในโหมดแก้ไข ให้แสดง EditProfilePage
  if (isEditing && user) {
    return (
      <EditProfilePage
        user={user} // ส่งข้อมูล user เดิมไปให้
        onCancel={() => setIsEditing(false)} // เมื่อกดยกเลิก ให้กลับมาหน้าเดิม
        onSuccess={() => {
          setIsEditing(false); // ปิดโหมดแก้ไข
          fetchProfile();      // โหลดข้อมูลใหม่ (เผื่อมีการอัปเดต)
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="error-container">
        <p style={{ color: 'red' }}>{error || "User not found"}</p>
        <button onClick={() => router.push('/login')}>Go to Login</button>
      </div>
    );
  }

  // ส่วนแสดงผลหน้า Profile ปกติ
  return (
    <div className="profile-container" style={isReadOnly ? { padding: 0, minHeight: 'auto' } : {}}>
      <div className="profile-card" style={isReadOnly ? { boxShadow: 'none', width: '100%', maxWidth: '100%' } : {}}>

        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(user.firstname)}
          </div>
          <div className="profile-title">
            <h2>{user.firstname} {user.lastname}</h2>
            <span className="profile-role-badge">
              {user.role?.role || "Member"}
            </span>
          </div>
        </div>

        {/* Content Section: ข้อมูล */}
        <div className="profile-content">

          <div className="section-title">ข้อมูลส่วนตัว (Personal Information)</div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ชื่อผู้ใช้งาน (Username)</span>
              <div className="info-value">{user.username}</div>
            </div>

            <div className="info-item">
              <span className="info-label">อีเมล (Email)</span>
              <div className="info-value">{user.email || "-"}</div>
            </div>

            <div className="info-item">
              <span className="info-label">เบอร์โทรศัพท์ (Phone)</span>
              <div className="info-value">{user.phone || "-"}</div>
            </div>

            <div className="info-item">
              <span className="info-label">เพศ (Gender)</span>
              <div className="info-value">{user.gender?.name || "-"}</div>
            </div>
          </div>

          <br />
          <div className="section-title" style={{ marginTop: '20px' }}>ข้อมูลการศึกษา (Academic Info)</div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">สาขาวิชา (Branch)</span>
              <div className="info-value">{user.branch?.branch_name || "-"}</div>
            </div>

            {user.role?.role === 'Student' && (
              <div className="info-item">
                <span className="info-label">สถานะรายวิชา (Course Status)</span>
                <div
                  className="info-value"
                  style={{
                    color: user.pass ? 'green' : '#9a0120', // สีเขียวถ้าผ่าน, สีแดงถ้าไม่ผ่าน
                  }}
                >
                  {user.pass ? "Pass" : "Fail"}
                </div>
              </div>
            )}

            <div className="info-item">
              <span className="info-label">สถานะบัญชี (Status)</span>
              <div className="info-value" style={{ color: user.status?.status === 'Active' ? 'green' : 'gray' }}>
                {user.status?.status || "-"}
              </div>
            </div>
          </div>

          {/* ✅ ซ่อนปุ่มแก้ไข ถ้าเป็นโหมด ReadOnly */}
          {!isReadOnly && (
            <button
                onClick={() => setIsEditing(true)}
                style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #9a0120',
                color: '#9a0120',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
                }}
            >
                แก้ไขข้อมูลติดต่อ
            </button>
          )}

        </div>
      </div>
    </div>
  );
}