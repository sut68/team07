"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetUserProfile } from '../../services/user'; // Path ของ service คุณ
import { UserProfileInterface } from '../../interfaces/Users'; // Path ของ Interface คุณ
import "../../style/profile.css"; // Import CSS ที่แยกไว้

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await GetUserProfile();
        if (res.status === 200 && res.data) {
          // Backend ส่งกลับมาเป็น { data: userObject } หรือ userObject โดยตรง ให้เช็คโครงสร้าง
          // สมมติว่าส่งมาแบบ c.JSON(http.StatusOK, gin.H{"data": user})
          setUser(res.data.data || res.data);
        } else {
          setError("Failed to load profile data");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Unauthorized or Network Error");
        // ถ้า Error 401 อาจจะ Redirect ไป Login
        setTimeout(() => router.push('/login'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // ฟังก์ชันสร้างตัวย่อจากชื่อ (เช่น Somchai -> S)
  const getInitials = (firstname?: string) => {
    return firstname ? firstname.charAt(0).toUpperCase() : "?";
  };

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

  return (
    <div className="profile-container">
      <div className="profile-card">

        {/* Header Section: Theme สีแดง */}
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
              <span className="info-label">รหัสนักศึกษา / Username</span>
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

            <div className="info-item">
              <span className="info-label">สถานะบัญชี (Status)</span>
              <div className="info-value" style={{ color: user.status?.status === 'Active' ? 'green' : 'gray' }}>
                {user.status?.status || "-"}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/edit-profile')}
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

        </div>
      </div>
    </div>
  );
}