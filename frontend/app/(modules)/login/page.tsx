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
      console.log("Login Successful - Full Response:", res);
      console.log("Login Successful - Data:", res.data);

      // NOTE: We rely on AuthContext and HttpOnly Cookies for session management.
      // No need to manually store sensitive info in localStorage.

      await fetchUser(); // Updates AuthContext state from server


      const { role } = res.data;
      if (role) {
        redirectToDashboard(role);
      } else {
        setError("Account has no role assigned. Please contact admin.");
      }

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
            top: '-170px',
            right: '-170px',
            width: '450px',
            height: '450px',
            opacity: 0.70,
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M13.9838 2.54161C14.0711 2.71093 14.0928 2.92777 14.1361 3.36144C14.2182 4.1823 14.2593 4.59274 14.4311 4.81793C14.649 5.10358 15.0034 5.25038 15.3595 5.20248C15.6402 5.16472 15.9594 4.90352 16.5979 4.38113C16.9352 4.10515 17.1038 3.96716 17.2853 3.90918C17.5158 3.83555 17.7652 3.84798 17.9872 3.94419C18.162 4.01994 18.3161 4.17402 18.6243 4.4822L19.5178 5.37567C19.8259 5.68385 19.98 5.83794 20.0558 6.01275C20.152 6.23478 20.1644 6.48415 20.0908 6.71464C20.0328 6.89612 19.8948 7.06478 19.6188 7.4021C19.0964 8.0406 18.8352 8.35984 18.7975 8.64056C18.7496 8.99662 18.8964 9.35102 19.182 9.56893C19.4072 9.74072 19.8176 9.78176 20.6385 9.86385C21.0722 9.90722 21.2891 9.92891 21.4584 10.0162C21.6734 10.1272 21.841 10.3123 21.9299 10.5373C22 10.7145 22 10.9324 22 11.3682V12.6319C22 13.0676 22 13.2855 21.93 13.4626C21.841 13.6877 21.6734 13.8729 21.4583 13.9838C21.289 14.0711 21.0722 14.0928 20.6386 14.1361L20.6386 14.1361C19.818 14.2182 19.4077 14.2592 19.1825 14.4309C18.8967 14.6489 18.7499 15.0034 18.7979 15.3596C18.8357 15.6402 19.0968 15.9593 19.619 16.5976C19.8949 16.9348 20.0328 17.1034 20.0908 17.2848C20.1645 17.5154 20.152 17.7648 20.0558 17.9869C19.98 18.1617 19.826 18.3157 19.5179 18.6238L18.6243 19.5174C18.3162 19.8255 18.1621 19.9796 17.9873 20.0554C17.7652 20.1516 17.5159 20.164 17.2854 20.0904C17.1039 20.0324 16.9352 19.8944 16.5979 19.6184L16.5979 19.6184C15.9594 19.096 15.6402 18.8348 15.3595 18.7971C15.0034 18.7492 14.649 18.896 14.4311 19.1816C14.2593 19.4068 14.2183 19.8173 14.1362 20.6383C14.0928 21.0722 14.0711 21.2891 13.9837 21.4585C13.8728 21.6735 13.6877 21.8409 13.4628 21.9299C13.2856 22 13.0676 22 12.6316 22H11.3682C10.9324 22 10.7145 22 10.5373 21.9299C10.3123 21.841 10.1272 21.6734 10.0162 21.4584C9.92891 21.2891 9.90722 21.0722 9.86385 20.6385C9.78176 19.8176 9.74072 19.4072 9.56892 19.182C9.35101 18.8964 8.99663 18.7496 8.64057 18.7975C8.35985 18.8352 8.04059 19.0964 7.40208 19.6189L7.40206 19.6189C7.06473 19.8949 6.89607 20.0329 6.71458 20.0908C6.4841 20.1645 6.23474 20.152 6.01272 20.0558C5.8379 19.9801 5.6838 19.826 5.37561 19.5178L4.48217 18.6243C4.17398 18.3162 4.01988 18.1621 3.94414 17.9873C3.84794 17.7652 3.8355 17.5159 3.90913 17.2854C3.96711 17.1039 4.10511 16.9352 4.3811 16.5979C4.90351 15.9594 5.16471 15.6402 5.20247 15.3594C5.25037 15.0034 5.10357 14.649 4.81792 14.4311C4.59273 14.2593 4.1823 14.2182 3.36143 14.1361C2.92776 14.0928 2.71093 14.0711 2.54161 13.9838C2.32656 13.8728 2.15902 13.6877 2.07005 13.4627C2 13.2855 2 13.0676 2 12.6318V11.3683C2 10.9324 2 10.7144 2.07008 10.5372C2.15905 10.3123 2.32654 10.1272 2.54152 10.0163C2.71088 9.92891 2.92777 9.90722 3.36155 9.86384H3.36155H3.36156C4.18264 9.78173 4.59319 9.74068 4.81842 9.56881C5.10395 9.35092 5.2507 8.99664 5.20287 8.64066C5.16514 8.35987 4.90385 8.04052 4.38128 7.40182C4.10516 7.06435 3.96711 6.89561 3.90914 6.71405C3.83557 6.48364 3.848 6.23438 3.94413 6.01243C4.01988 5.83754 4.17403 5.68339 4.48233 5.37509L5.37565 4.48177L5.37566 4.48177C5.68385 4.17357 5.83795 4.01947 6.01277 3.94373C6.23478 3.84753 6.48414 3.8351 6.71463 3.90872C6.89612 3.9667 7.06481 4.10472 7.4022 4.38076C8.04061 4.9031 8.35982 5.16427 8.64044 5.20207C8.99661 5.25003 9.35113 5.10319 9.56907 4.81742C9.74077 4.59227 9.78181 4.18195 9.86387 3.36131C9.90722 2.92776 9.9289 2.71098 10.0162 2.5417C10.1271 2.32658 10.3123 2.15898 10.5374 2.07001C10.7145 2 10.9324 2 11.3681 2H12.6318C13.0676 2 13.2855 2 13.4627 2.07005C13.6877 2.15902 13.8728 2.32656 13.9838 2.54161ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="white" />
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
                Welcome back , Please enter your information .
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
                      className="login-input-field"
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