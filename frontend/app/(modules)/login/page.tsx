"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, ForgotPassword } from '../../services/login';
import { SignInInterface, ForgotPasswordInterface } from '../../interfaces/Login';
//import "../../style/login.css"
import loginbg from "../../../public/image/Background.jpg"
import { useAuth } from "../roleCheck/authContext";


// ********* ลองเพิ่มการเชื่อมการ login ดู ส่วนdesign ยังเเย่อยู่รอคนมาทำต่อ **************
export default function LoginPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();
  const [inputInfo, setInputInfo] = useState<SignInInterface>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState<ForgotPasswordInterface>({ email: '' });
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isForgotLoading, setIsLoadingForgot] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputInfo({ ...inputInfo, [e.target.name]: e.target.value });
    setError(null);
  };

  const redirectToDashboard = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        router.push('/admin/dashboard');
        break;
      case 'teacher':
        router.push('/teacher/dashboard');
        break;
      case 'student':
        router.push('/student/dashboard');
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
      const res = await SignIn(inputInfo);
      console.log("Login Successful", res.data);
      
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
    if (!forgotEmail.email) {
      setForgotMessage("Please enter your email address.");
      return;
    }

    setIsLoadingForgot(true);
    try {
      await ForgotPassword(forgotEmail);
      setForgotMessage("ระบบได้ส่งลิงก์รีเซ็ตไปแล้ว หากบัญชีมีอยู่จริง โปรดตรวจสอบอีเมลของคุณ");
    } catch (err: any) {
      setForgotMessage("ระบบได้ส่งลิงก์รีเซ็ตไปแล้ว หากบัญชีมีอยู่จริง โปรดตรวจสอบอีเมลของคุณ");
      console.error("Forgot Password Error:", err);
    } finally {
      setIsLoadingForgot(false);
    }
  };


  const overlayColor = 'rgba(0, 0, 0, 0.1)';
  const bgUrl = loginbg.src;
  const originalFont = 'zzzTH';



  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {/* Left: background image */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        </div>

        {/* Right: maroon panel */}
        <div style={{ width: 800, background: 'rgba(154, 1, 32,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 450, height: 500, background: 'rgba(255,255,255,0.98)', borderRadius: 12, padding: 36, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <h1 style={{ margin: 0, marginTop: 40, fontSize: '1.9rem', color: '#3a3a3a', letterSpacing: '1px', fontFamily: "'Inter', sans-serif" }}>Capstone Hub</h1>
            </div>

            <p
              role={error ? 'alert' : undefined}
              aria-live="polite"
              style={{
                minHeight: 36,           
                marginBottom: 12,
                color: error ? 'red' : 'transparent',
                textAlign: 'center',
                lineHeight: '18px',
                fontWeight: error ? 'normal' : 'normal'
              }}
            >
              {error || ' '}
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: 6 }}>Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={inputInfo.username}
                  onChange={handleInputChange}
                  className='login-info'
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    name="password"
                    value={inputInfo.password}
                    onChange={handleInputChange}
                    className='login-info'
                    style={{ width: '100%', paddingRight: '68px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8a0f1a',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      padding: '6px 8px'
                    }}
                  >
                    {showPassword ? 'ซ่อน' : 'แสดง'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ flex: 1 }} />
                <div
                  style={{ marginTop: 10, color: '#8a0f1a', textDecoration: 'underline', fontSize: '0.85em', cursor: 'pointer' }}
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setError(null);
                    setForgotMessage(null);
                    setForgotEmail({ email: '' });
                  }}
                >
                  ลืมรหัสผ่าน?
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  style={{ width: '100%', marginTop: '40px', padding: '12px 16px', backgroundColor: '#8b0f1a', color: 'white', border: 'none', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(139,15,26,0.3)' }}
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- ส่วนที่เพิ่ม 4: Forgot Password Modal (Pop-up สีขาว) --- */}
      {isForgotModalOpen && (
        <>
          <div className="modal-overlay" />
          <div className="modal-content" style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001
          }}>
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage(null);
              }}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            <h2 style={{ marginBottom: '5px', textAlign: 'center', fontFamily: originalFont }}>ลืมรหัสผ่าน ?</h2>
            <form onSubmit={handleForgotPassword}>
              <p style={{ marginBottom: '30px', fontSize: '0.9em', color: '#666', textAlign: 'center', fontFamily: originalFont }}>
                กรุณากรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
              </p>

              {/* แสดงข้อความแจ้งเตือน */}
              {forgotMessage && <p style={{ color: forgotMessage.includes("ส่งลิงก์รีเซ็ต") ? '#2ecc71' : '#e74c3c', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold', }}>{forgotMessage}</p>}
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '10px' , fontFamily: originalFont}}>อีเมล</label>
              <input
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                name="email"
                value={forgotEmail.email}
                onChange={(e) => {
                  setForgotEmail({ email: e.target.value });
                  setForgotMessage(null);
                }}
                className='login-info'
                style={{ width: '100%', marginBottom: '20px' }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flexGrow: 1 }}
                >
                  {isForgotLoading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}