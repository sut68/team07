"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, ForgotPassword } from '../../services/login';
import { SignInInterface, ForgotPasswordInterface } from '../../interfaces/Login';
import "../../style/login.css"
import loginbg from "../../../public/image/Background.jpg"
import { useAuth } from "../roleCheck/authContext";
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

export default function LoginPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();

  // Login State
  const [inputInfo, setInputInfo] = useState<SignInInterface>({
    username: '',
    password: ''
  });


  const [iscorrect, setiscorrect] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<ForgotPasswordInterface>({ username: '', email: '' });
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isForgotLoading, setIsLoadingForgot] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputInfo({ ...inputInfo, [e.target.name]: e.target.value });
    setError(null);
  };

  const redirectToDashboard = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        router.replace('/admin/dashboard');
        break;
      case 'teacher':
        router.replace('/teacher/dashboard');
        break;
      case 'student':
        router.replace('/student/dashboard');
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputInfo.username || !inputInfo.password) {
      setError("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...inputInfo,
        ispeople: iscorrect,
      };

      const res = await SignIn(payload);
      console.log("Login Successful", res.data);

      if (res.data) {
        localStorage.setItem("user_id", String(res.data.id));
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("username", res.data.username);
      }

      await fetchUser();

      const { role } = res.data;
      redirectToDashboard(role);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Login failed. Please check your credentials.";
      setError(errorMessage);
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    if (!forgotInfo.username || !forgotInfo.email) {
      setForgotMessage("Please enter your username and email address.");
      return;
    }

    setIsLoadingForgot(true);
    try {
      await ForgotPassword(forgotInfo);
      setForgotMessage("ระบบได้ส่งลิงก์รีเซ็ตไปแล้ว หากบัญชีมีอยู่จริง โปรดตรวจสอบอีเมลของคุณ");
    } catch (err: any) {
      setForgotMessage("ระบบได้ส่งลิงก์รีเซ็ตไปแล้ว หากบัญชีมีอยู่จริง โปรดตรวจสอบอีเมลของคุณ");
      console.error("Forgot Password Error:", err);
    } finally {
      setIsLoadingForgot(false);
    }
  };

  const bgUrl = loginbg.src;
  const originalFont = 'zzzTH';

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Noto Sans Thai', sans-serif" }}>

        {/* Left: Original Image */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(240, 6, 6, 0) 0%, rgba(187, 25, 39, 0.33) 100%)' // Red tint overlay
          }} />
        </div>

        {/* Right: Red Branding + Form */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #730d15ff 0%, #c71919ff 100%)', // Red gradient
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Spinning Asterisk Decoration */}
          <div className="animate-spin-slow" style={{
            position: 'absolute',
            top: '-90px',
            right: '-90px',
            width: '300px',
            height: '300px',
            opacity: 0.50,
            zIndex: 0,
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 100 100" fill="white" xmlns="http://www.w3.org/2000/svg">
              <rect x="42" y="0" width="16" height="100" rx="8" />
              <rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(45 50 50)" />
              <rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(90 50 50)" />
              <rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(135 50 50)" />
            </svg>
          </div>
          {/* Decorative Background Elements */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'rgba(255, 255, 255, 0.15)', // Increased opacity
            borderRadius: '50%',
            filter: 'blur(30px)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.15)', // Increased opacity
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: 0
          }} />

          <div style={{ width: '100%', maxWidth: '440px', zIndex: 1 }}>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
                Hello <br />
                Capstone Hub!
              </div>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, fontWeight: 300 }}>
                Welcome back , Please enter your details .
              </p>
            </div>

            <div>
              <p
                role={error ? 'alert' : undefined}
                aria-live="polite"
                style={{
                  minHeight: '24px',
                  marginBottom: '10px',
                  color: '#ff6b6b',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {error || ''}
              </p>

              <form onSubmit={handleLogin}>

                {/* Hidden Security Check */}
                <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
                  <label htmlFor="ispeople">Security Check (Please leave this blank)</label>
                  <input
                    type="text"
                    id="ispeople"
                    name="ispeople"
                    tabIndex={-1}
                    autoComplete="off"
                    value={iscorrect}
                    onChange={(e) => setiscorrect(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, fontWeight: 500, opacity: 0.9 }}>Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    name="username"
                    value={inputInfo.username}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '5px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(200, 61, 61, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    className="login-input-field" // Using a class for focus styles if needed, but inline for now
                    required
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, fontWeight: 500, opacity: 0.9 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      name="password"
                      value={inputInfo.password}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: '60px',
                        borderRadius: '5px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(200, 61, 61, 0.1)',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setError(null);
                      setForgotMessage(null);
                      setForgotInfo({ username: '', email: '' });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="modern-login-btn"
                >
                  {isLoading ? 'Signing In...' : 'Login'}
                </button>

              </form>
            </div>

            <div style={{ marginTop: 40, opacity: 0.6, fontSize: '0.85rem' }}>
              © 2026 Capstone Hub. All rights reserved.
            </div>
          </div>
        </div>

      </div>

      {/* --- Forgot Password Modal --- */}
      {/* --- Forgot Password Modal --- */}
      {isForgotModalOpen && (
        <>
          <div className="modern-modal-overlay" onClick={() => setIsForgotModalOpen(false)} />
          <div className="modern-modal-content">
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage(null);
              }}
              className="modern-close-btn"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{
                margin: '0 0 10px 0',
                color: '#333',
                fontSize: '1.8rem',
                fontWeight: 700
              }}>ลืมรหัสผ่าน ?</h2>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '1rem',
                lineHeight: '1.5'
              }}>
                กรุณากรอกชื่อผู้ใช้และอีเมล<br />เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
              </p>
            </div>

            <form onSubmit={handleForgotPassword}>
              {forgotMessage && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: forgotMessage.includes("ส่งลิงก์รีเซ็ต") ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  color: forgotMessage.includes("ส่งลิงก์รีเซ็ต") ? '#27ae60' : '#c0392b',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontWeight: 600
                }}>
                  {forgotMessage}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="username" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: '8px', marginLeft: '4px' }}>ชื่อผู้ใช้</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  name="username"
                  id="username"
                  value={forgotInfo.username}
                  onChange={(e) => {
                    setForgotInfo({ ...forgotInfo, username: e.target.value });
                    setForgotMessage(null);
                  }}
                  className="modern-input-light"
                  required
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: '8px', marginLeft: '4px' }}>อีเมล</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  name="email"
                  id="email"
                  value={forgotInfo.email}
                  onChange={(e) => {
                    setForgotInfo({ ...forgotInfo, email: e.target.value });
                    setForgotMessage(null);
                  }}
                  className="modern-input-light"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="modern-red-btn"
              >
                {isForgotLoading ? 'กำลังดำเนินการ...' : 'ส่งลิงก์รีเซ็ต'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}