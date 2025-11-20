"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPassword } from '../../../services/login'; 
import { ResetPasswordInterface } from '../../../interfaces/Login'; 

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
        setMessage(null);
        
        if (!token) {
            setMessage({ text: "Error: Missing reset token.", type: 'error' });
            return;
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

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
            const errorText = err.response?.data?.error || "ตั้งรหัสผ่านไม่สำเร็จ: ลิงก์อาจหมดอายุแล้ว";
            setMessage({ text: errorText, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && !message) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-600" style={{ fontFamily: originalFont }}>กำลังโหลด...</p>
            </div>
        );
    }
    
    const isInitialError = message && message.type === 'error' && !token;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: originalFont }}>
                    ตั้งรหัสผ่านใหม่
                </h1>

                {message && (
                    <div className={`p-4 mb-4 rounded-lg text-center font-medium ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`} style={{ fontFamily: originalFont }}>
                        {message.text}
                    </div>
                )}
                
                {/* แสดง Form เฉพาะเมื่อมี Token และไม่มี Error ถาวร */}
                {!isInitialError && (
                    <form onSubmit={handleReset} className="space-y-6">
                        <p className="text-sm text-gray-600 truncate" style={{ fontFamily: originalFont }}>
                            Token: {token && token.substring(0, 8)}... (ใช้ได้ 5 นาที)
                        </p>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                required
                                disabled={isLoading || message?.type === 'success'}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
                                ยืนยันรหัสผ่านใหม่
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                required
                                disabled={isLoading || message?.type === 'success'}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`w-full text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md ${
                                isLoading || message?.type === 'success' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            disabled={isLoading || message?.type === 'success'}
                            style={{ fontFamily: originalFont }}
                        >
                            {isLoading ? 'กำลังดำเนินการ...' : 'ตั้งรหัสผ่านใหม่'}
                        </button>
                    </form>
                )}
                
                {isInitialError && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="text-blue-600 hover:text-blue-800 font-medium transition duration-150"
                            style={{ fontFamily: originalFont }}
                        >
                            กลับไปหน้า Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResetPasswordPage: React.FC = () => {
    return (
        // ห่อหุ้มด้วย Suspense เพื่อแก้ไขปัญหา Next.js Build Error (SSR)
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