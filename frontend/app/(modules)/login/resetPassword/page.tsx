"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPassword } from '../../../services/login';
import { ResetPasswordInterface } from '../../../interfaces/Login';
import '../../../style/resetpassword.css';

const originalFont = 'zzzTH';

const ResetPasswordComponent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setMessage({
                text: "Invalid link. Missing reset token. Please request a new password reset.",
                type: 'error'
            });
        }
    }, [searchParams]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setMessage(null);

        if (!token) {
            setMessage({ text: "Error: Missing reset token.", type: 'error' });
            return;
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasNumber) {
            setMessage({ text: "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว", type: 'error' });
            return;
        }
        if (password.length < 8) {
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

        if (password !== confirmPassword) {
            setMessage({ text: "รหัสผ่านใหม่ไม่ตรงกัน", type: 'error' });
            return;
        }
        setIsLoading(true);

        try {
            const data: ResetPasswordInterface = {
                token: token!,
                new_password: password,
            };

            const res = await ResetPassword(data);

            setMessage({
                text: res.data.message || "ตั้งรหัสผ่านใหม่สำเร็จ! ระบบกำลังนำกลับไปหน้า Login...",
                type: 'success'
            });

            setTimeout(() => {
                router.push('/login');
            }, 5000);

        } catch (err: any) {
            console.error("Reset Password Error:", err);
            const errorText = err.response?.data?.error || "ตั้งรหัสผ่านไม่สำเร็จ: ลิงก์อาจหมดอายุแล้ว";
            
            // กรณีที่ Backend แจ้งว่า Token ถูกใช้แล้ว แต่จริงๆ คือเปลี่ยนสำเร็จไปแล้ว (เผื่อ Backend check พลาด)
            if (errorText === "this reset link has already been used") {
                 setMessage({
                    text: "ตั้งรหัสผ่านใหม่สำเร็จ! (ลิงก์ถูกใช้งานแล้ว)",
                    type: 'success'
                });
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
                return;
            }

            setMessage({ text: errorText, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && !message) {
        return (
            <div className="rp-fullscreen">
                <p className="rp-loading" style={{ fontFamily: originalFont }}>กำลังโหลด...</p>
            </div>
        );
    }

    const isInitialError = message && message.type === 'error' && !token;

    return (
        <div className="rp-fullscreen">
            <div className="rp-card" role="main" aria-labelledby="rp-title">
                <div className="rp-icon" aria-hidden="true">
                    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12.3212 10.6852L4 19L6 21M7 16L9 18M20 7.5C20 9.98528 17.9853 12 15.5 12C13.0147 12 11 9.98528 11 7.5C11 5.01472 13.0147 3 15.5 3C17.9853 3 20 5.01472 20 7.5Z"
                            stroke="#000000"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                    </svg>
                </div>

                <h1 id="rp-title" className="rp-title" style={{ fontFamily: originalFont }}>รีเซ็ตรหัสผ่านใหม่</h1>
                <p className="rp-desc">รหัสผ่านใหม่ของคุณต้องแตกต่างจากรหัสผ่านที่เคยใช้มาก่อน</p>

                {/* เว้นพื้นที่สำหรับข้อความผลลัพธ์ไม่ให้ layout ขยับ */}
                <div className="rp-message-area" aria-live="polite">
                    {message && (
                        <div className={`rp-message ${message.type === 'success' ? 'rp-success' : 'rp-error'}`} style={{ fontFamily: originalFont }}>
                            {message.text}
                        </div>
                    )}
                </div>

                {!isInitialError && (
                    <form onSubmit={handleReset} className="rp-form" aria-describedby="rp-desc">
                        <label className="rp-label" htmlFor="password">ตั้งรหัสผ่าน</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rp-input"
                            required
                            disabled={isLoading || message?.type === 'success'}
                            aria-required="true"
                        />
                        <p className="rp-helper">ต้องมีความยาวอย่างน้อย 8 ตัวอักษร</p>

                        <label className="rp-label" htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rp-input"
                            required
                            disabled={isLoading || message?.type === 'success'}
                        />

                        <button
                            type="submit"
                            className={`rp-button ${isLoading || message?.type === 'success' ? 'rp-disabled' : ''}`}
                            disabled={isLoading || message?.type === 'success'}
                            style={{ fontFamily: originalFont }}
                        >
                            {isLoading ? 'กำลังดำเนินการ...' : 'รีเซ็ตรหัสผ่าน'}
                        </button>
                    </form>
                )}

                <button className="rp-back" onClick={() => router.push('/login')} aria-label="Back to log in">
                    <svg className="rp-back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 19l-7-7 7-7" /></svg>
                    <span>กลับไปที่หน้าเข้าสู่ระบบ</span>
                </button>
            </div>
        </div>
    );
};

const ResetPasswordPage: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-600" style={{ fontFamily: originalFont }}>กำลังเตรียมหน้า...</p>
            </div>
        }>
            <ResetPasswordComponent />
        </Suspense>
    );
};

export default ResetPasswordPage;