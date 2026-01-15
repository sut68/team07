"use client";

import React, { useState } from 'react';
import { ChangePassword } from '../services/login';
import { ChangePasswordInterface } from '../interfaces/Login';
import '../style/resetpassword.css';
import '../style/changepassword.css';

interface ChangedPasswordProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangedPassword: React.FC<ChangedPasswordProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!email || !currentPassword) {
            setMessage({ text: "กรุณากรอกข้อมูลให้ครบถ้วน", type: 'error' });
            return;
        }
        setStep(2);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);

        if (!hasNumber) {
            setMessage({ text: "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว", type: 'error' });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", type: 'error' });
            return;
        }
        if (!hasUpperCase) {
            setMessage({ text: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว", type: 'error' });
            return;
        }
        if (!hasSymbol) {
            setMessage({ text: "รหัสผ่านต้องมีสัญลักษณ์พิเศษ (!@#$...) อย่างน้อย 1 ตัว", type: 'error' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: "รหัสผ่านใหม่ไม่ตรงกัน", type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            const data: ChangePasswordInterface = {
                email: email,
                current_password: currentPassword,
                new_password: newPassword,
            };

            const res = await ChangePassword(data);

            if (res.data) {
                setMessage({
                    text: "เปลี่ยนรหัสผ่านสำเร็จ! กรุณาตรวจสอบอีเมล",
                    type: 'success'
                });

                // ปิด Modal หรือ Logout ตาม Business Logic
                setTimeout(() => {
                    handleClose();
                }, 2500);
            }
        } catch (err: any) {
            console.error("Change Password Error:", err);
            const errorText = err.response?.data?.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";

            setMessage({ text: errorText, type: 'error' });

            // ถ้า Error เกี่ยวกับ Step 1 (Password เดิมผิด / Email ผิด) ให้กลับไป Step 1
            if (errorText.includes("current password") || errorText.includes("Email does not match") || errorText.includes("User not found")) {
                setTimeout(() => {
                    setStep(1);
                }, 1500);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state
        setStep(1);
        setEmail('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage(null);
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="cp-overlay">
            <div className={`rp-card cp-card`}>
                <button className="cp-close-btn" onClick={handleClose}>
                    ✕
                </button>

                <div className="rp-icon" aria-hidden="true" style={{ marginBottom: '10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rp-icon-svg">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {step === 1 ? (
                    <>
                        <h1 className="rp-title" style={{ fontFamily: 'zzzTH' }}>ยืนยันตัวตน</h1>
                        <p className="rp-desc">กรุณากรอกอีเมลและรหัสผ่านปัจจุบันเพื่อยืนยัน</p>

                        <div className="rp-message-area">
                            {message && (
                                <div className={`rp-message ${message.type === 'success' ? 'rp-success' : 'rp-error'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleStep1Submit} className="rp-form">
                            <label className="rp-label">อีเมล</label>
                            <input
                                type="email"
                                className="rp-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />

                            <label className="rp-label">รหัสผ่านปัจจุบัน</label>
                            <input
                                type="password"
                                className="rp-input"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />

                            <button type="submit" className="rp-button" style={{ fontFamily: 'zzzTH' }}>
                                ถัดไป
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="rp-title" style={{ fontFamily: 'zzzTH' }}>ตั้งรหัสผ่านใหม่</h1>
                        <p className="rp-desc">ระบุรหัสผ่านใหม่ที่คุณต้องการใช้งาน</p>

                        <div className="rp-message-area">
                            {message && (
                                <div className={`rp-message ${message.type === 'success' ? 'rp-success' : 'rp-error'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleStep2Submit} className="rp-form">
                            <label className="rp-label">รหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="rp-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <p className="rp-helper">ต้องมีตัวเลข, ตัวพิมพ์ใหญ่, และสัญลักษณ์พิเศษ (8+ ตัวอักษร)</p>

                            <label className="rp-label">ยืนยันรหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="rp-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    className="rp-button"
                                    onClick={() => { setMessage(null); setStep(1); }}
                                    style={{
                                        backgroundColor: '#fff',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        flex: 1,
                                        boxShadow: 'none',
                                        fontFamily: 'zzzTH'
                                    }}
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    type="submit"
                                    className={`rp-button ${isLoading ? 'rp-disabled' : ''}`}
                                    disabled={isLoading}
                                    style={{ flex: 1, fontFamily: 'zzzTH' }}
                                >
                                    {isLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChangedPassword;
