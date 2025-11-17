"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, ForgotPassword } from '../../services/login';
import { SignInInterface, ForgotPasswordInterface } from '../../interfaces/Login';
import "../../style/login.css"
import loginbg from "../../../public/image/login-bg2.jpg"


// ********* ลองเพิ่มการเชื่อมการ login ดู ส่วนdesign ยังเเย่อยู่รอคนมาทำต่อ **************
export default function LoginPage() {
  const router = useRouter();

  const [inputInfo, setInputInfo] = useState<SignInInterface>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      // เรียกใช้ API Login
      const res = await SignIn(inputInfo);
      console.log("Login API Call Successful", res.data);
      //Response จาก Backend: { id, username, role, message }
      const { role } = res.data;

      //เก็บ Access Token และ CSRF Token 
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
      <div className="login-container" style={{
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${bgUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}>

        <form onSubmit={handleLogin} className="login-form">
          <h1 style={{ fontSize: '2em', marginBottom: '30px', marginTop: '30px', textAlign: 'center', fontFamily: originalFont }}>Log in to CapstoneHub</h1>

          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

          <div className='login-info-container'>
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={inputInfo.username}
              onChange={handleInputChange}
              className='login-info'
              required
            />

            <input
              type="password"
              placeholder="Password"
              name="password"
              value={inputInfo.password}
              onChange={handleInputChange}
              className='login-info'
              required
            />

            <div className='login-button-container'>

              <div
                style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.85em', cursor: 'pointer', marginTop: '10px', textAlign: 'right' as 'right', display: 'block' }}
                onClick={() => {
                  setIsForgotModalOpen(true);
                  setError(null);
                  setForgotMessage(null);
                  setForgotEmail({ email: '' });
                }}
              >
                ลืมรหัสผ่าน?
              </div>

              <div style={{ marginBottom: '0px' }}>
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* --- ส่วนที่เพิ่ม 4: Forgot Password Modal (Pop-up สีขาว) --- */}
      {isForgotModalOpen && (
        <>
          <div className="modal-overlay"></div>
          <div className="modal-content" style={{
            maxWidth: '400px',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001
          }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center', fontFamily: originalFont }}>ลืมรหัสผ่าน</h2>
            <form onSubmit={handleForgotPassword}>
              <p style={{ marginBottom: '15px', fontSize: '0.9em', color: '#666' }}>
                กรุณากรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
              </p>

              {/* แสดงข้อความแจ้งเตือน */}
              {forgotMessage && <p style={{ color: forgotMessage.includes("ส่งลิงก์รีเซ็ต") ? '#2ecc71' : '#e74c3c', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>{forgotMessage}</p>}

              <input
                type="email"
                placeholder="Email Address"
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
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotMessage(null);
                  }}
                  style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flexGrow: 1 }}
                >
                  ยกเลิก
                </button>
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