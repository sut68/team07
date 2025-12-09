"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetUserProfile, UpdateUserProfile } from '../../services/user'; // ปรับ path ให้ตรงกับโฟลเดอร์ของคุณ
import { UserProfileInterface, UpdateUserProfileInterface } from '../../interfaces/Users'; // ปรับ path ให้ตรงกับโฟลเดอร์ของคุณ
import "../../style/edit-profile.css"; // Import CSS

export default function EditProfilePage() {
    const router = useRouter();
    
    // State สำหรับข้อมูล User (ใช้แสดงผลในช่องที่ห้ามแก้)
    const [user, setUser] = useState<UserProfileInterface | null>(null);
    
    // State สำหรับฟอร์มแก้ไข (Email, Phone)
    const [formData, setFormData] = useState<UpdateUserProfileInterface>({
        email: '',
        phone: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. โหลดข้อมูลเดิมมาใส่ Form
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await GetUserProfile();
                if (res.status === 200 && res.data) {
                    const userData = res.data.data;
                    setUser(userData);
                    
                    // Set ค่าเริ่มต้นให้ Form
                    setFormData({
                        email: userData.email || '',
                        phone: userData.phone || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. จัดการเมื่อพิมพ์ข้อมูล
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. บันทึกข้อมูล
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await UpdateUserProfile(formData);
            if (res.status === 200) {
                alert("บันทึกข้อมูลสำเร็จ!");
                router.push('/profile'); // กลับไปหน้า Profile เพื่อดูผลลัพธ์
            } else {
                alert("เกิดข้อผิดพลาด: " + res.data.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("บันทึกข้อมูลไม่สำเร็จ โปรดลองใหม่");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="edit-profile-container">Loading...</div>;
    }

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                
                {/* Header */}
                <div className="edit-header">
                    <h2>แก้ไขข้อมูลส่วนตัว</h2>
                    <p>อัปเดตข้อมูลการติดต่อของคุณ</p>
                </div>

                {/* Form */}
                <div className="edit-form-content">
                    <form onSubmit={handleSubmit}>
                        
                        {/* ส่วน Read-only: ข้อมูลที่ระบบไม่อนุญาตให้แก้ */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">ชื่อจริง (Firstname)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user?.firstname || ''} 
                                    disabled // ห้ามแก้
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">นามสกุล (Lastname)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user?.lastname || ''} 
                                    disabled 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">รหัสนักศึกษา (ID)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user?.username || ''} 
                                    disabled 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">สาขาวิชา (Branch)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user?.branch?.branch_name || ''} 
                                    disabled 
                                />
                            </div>
                        </div>

                        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
                        <p style={{ fontSize: '0.9rem', color: '#9a0120', marginBottom: '15px', fontWeight: 'bold' }}>
                            ข้อมูลที่สามารถแก้ไขได้
                        </p>

                        {/* ส่วน Editable: แก้ไขได้ */}
                        <div className="form-group">
                            <label className="form-label">อีเมล (Email)</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-input" 
                                value={formData.email} 
                                onChange={handleInputChange}
                                placeholder="example@sut.ac.th"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">เบอร์โทรศัพท์ (Phone)</label>
                            <input 
                                type="tel" 
                                name="phone"
                                className="form-input" 
                                value={formData.phone} 
                                onChange={handleInputChange}
                                placeholder="09xxxxxxxx"
                                required
                            />
                        </div>

                        {/* Buttons */}
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={() => router.back()} // ย้อนกลับ
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="submit" 
                                className="btn-save"
                                disabled={isSaving}
                            >
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}