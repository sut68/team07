"use client";
import { useState } from 'react';
import { UpdateUserProfile } from '../../services/user'; 
import { UserProfileInterface, UpdateUserProfileInterface } from '../../interfaces/Users';
import Swal from 'sweetalert2'; 
import "../../style/edit-profile.css";

// กำหนด Interface สำหรับ Props ที่จะรับมา
interface EditProfileProps {
    user: UserProfileInterface; // รับข้อมูล User เดิมมาเลย
    onCancel: () => void;       // ฟังก์ชันสำหรับปุ่มยกเลิก
    onSuccess: () => void;      // ฟังก์ชันสำหรับเมื่อบันทึกสำเร็จ
}

// เปลี่ยน Function Component ให้รับ Props
export default function EditProfilePage({ user, onCancel, onSuccess }: EditProfileProps) {
    
    // State สำหรับฟอร์มแก้ไข (Email, Phone)
    // ใช้ user จาก props มากำหนดค่าเริ่มต้นเลย
    const [formData, setFormData] = useState<UpdateUserProfileInterface>({
        email: user.email || '',
        phone: user.phone || ''
    });

    const [isSaving, setIsSaving] = useState(false);

    // จัดการเมื่อพิมพ์ข้อมูล
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // บันทึกข้อมูล
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ส่วนตรวจสอบข้อมูลว่าง (Validation)
        if (!formData.email || !formData.phone) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกอีเมลและเบอร์โทรศัพท์ให้ครบถ้วน',
                customClass: {
                    container: 'swal-z-index-high' 
                }
            });
            return; // หยุดการทำงานถ้าข้อมูลไม่ครบ
        }

        const confirmResult = await Swal.fire({
            title: 'ยืนยันการแก้ไขข้อมูล?',
            text: "คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ใช่, บันทึกเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1f4d2b', 
            cancelButtonColor: '#9a0120',
            customClass: {
                container: 'swal-z-index-high' 
            }
        });

        if (confirmResult.isConfirmed) {
            setIsSaving(true);
            try {

                Swal.fire({ 
                    title: 'กำลังบันทึก...', 
                    didOpen: () => Swal.showLoading() 
                });

                const res = await UpdateUserProfile(formData);
                
                if (res.status === 200) {
                    Swal.close(); 
        
                    await Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    onSuccess(); 
                } else {
                    Swal.close();
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'เกิดข้อผิดพลาด', 
                        text: res.data.error || 'ไม่สามารถบันทึกข้อมูลได้' 
                    });
                }
            } catch (error: any) {
                console.error("Error updating profile:", error);
                Swal.close();
                Swal.fire({ 
                    icon: 'error', 
                    title: 'บันทึกไม่สำเร็จ',
                    text: 'กรุณาตรวจสอบรูปแบบข้อมูลและลองใหม่อีกครั้ง'
                });
            } finally {
                setIsSaving(false);
            }
        }
    };

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
                                    value={user.firstname || ''} 
                                    disabled 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">นามสกุล (Lastname)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user.lastname || ''} 
                                    disabled 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">รหัสนักศึกษา (ID)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user.username || ''} 
                                    disabled 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">สาขาวิชา (Branch)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user.branch?.branch_name || ''} 
                                    disabled 
                                />
                            </div>
                        </div>

                        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

                        <p style={{ fontSize: '1.2rem', color: '#9a0120', marginBottom: '15px', fontWeight: 'bold' }}>
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
                            />
                        </div>

                        {/* Buttons */}
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={onCancel} 
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