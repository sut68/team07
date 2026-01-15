"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPassword } from '../../../services/login';
import { ResetPasswordInterface } from '../../../interfaces/Login';
import '../../../style/login.css';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

const ResetPasswordComponent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setMessage({
                text: "ลิงก์ไม่ถูกต้อง หรือพารามิเตอร์ไม่ครบถ้วน",
                type: 'error'
            });
        }
    }, [searchParams]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setMessage(null);

        if (!token) {
            setMessage({ text: "ไม่พบ Token สำหรับรีเซ็ต", type: 'error' });
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
                text: res.data.message || "ตั้งรหัสผ่านใหม่สำเร็จ! กำลังกลับไปหน้า Login...",
                type: 'success'
            });

            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            console.error("Reset Password Error:", err);
            const errorText = err.response?.data?.error || "ตั้งรหัสผ่านไม่สำเร็จ: ลิงก์อาจหมดอายุแล้ว";

            if (errorText === "this reset link has already been used") {
                setMessage({
                    text: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว (ลิงก์นี้ถูกใช้ไปแล้ว)",
                    type: 'success'
                });
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
                return;
            }

            setMessage({ text: errorText, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && !message) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: "'Noto Sans Thai', sans-serif" }}>
                <p style={{ color: '#666' }}>กำลังตรวจสอบลิงก์...</p>
            </div>
        );
    }

    const isInitialError = message && message.type === 'error' && !token;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #730d15ff 0%, #c71919ff 100%)',
            padding: '20px',
            fontFamily: "'Noto Sans Thai', sans-serif"
        }}>
            {/* Background Decoration similar to Login */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                right: '-10%',
                width: '400px',
                height: '400px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-10%',
                width: '300px',
                height: '300px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div className="modern-card" style={{ zIndex: 1, textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', color: '#c71919', display: 'flex', justifyContent: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#333',
                    marginBottom: '10px'
                }}>
                    ตั้งค่ารหัสผ่านใหม่
                </h1>

                <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                    สร้างรหัสผ่านใหม่ที่คาดเดายากเพื่อความปลอดภัย<br />ของบัญชี Capstone Hub ของคุณ
                </p>

                {message && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: message.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        color: message.type === 'success' ? '#27ae60' : '#c0392b',
                        fontSize: '0.95rem',
                        marginBottom: '25px',
                        fontWeight: 600,
                        border: `1px solid ${message.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`
                    }}>
                        {message.text}
                    </div>
                )}

                {!isInitialError && (
                    <form onSubmit={handleReset} style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444' }}>รหัสผ่านใหม่</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="modern-input-light"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading || message?.type === 'success'}
                                    style={{ paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#888',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444' }}>ยืนยันรหัสผ่านใหม่</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="modern-input-light"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading || message?.type === 'success'}
                                    style={{ paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#888',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="modern-red-btn"
                            disabled={isLoading || message?.type === 'success'}
                        >
                            {isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '25px' }}>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'color 0.2s'
                        }}
                        className="hover:text-red-700"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        กลับไปหน้าเข้าสู่ระบบ
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResetPasswordPage: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>กำลังเตรียมหน้า...</p>
            </div>
        }>
            <ResetPasswordComponent />
        </Suspense>
    );
};

export default ResetPasswordPage;