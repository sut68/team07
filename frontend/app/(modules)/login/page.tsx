"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn } from '../../services/login';
import { SignInInterface } from '../../interfaces/Login';
import "../../style/login.css"
import loginbg from "../../../public/image/login-bg2.jpg"


// ********* ลองเพิ่มการเชื่อมการ login ดู ส่วนdesign ยังเเย่อยู่รอคนมาทำต่อ **************
export default function LoginPage() {
  const router = useRouter();
  
  //สำหรับเก็บ Input
  const [inputInfo, setInputInfo] = useState<SignInInterface>({ 
    username: '', 
    password: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const overlayColor = 'rgba(0, 0, 0, 0.1)';

  return (
    <div className="login-container" style={{
      backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${loginbg.src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundAttachment: "fixed",
    }}>

      <form onSubmit={handleLogin} className="login-form">
        <h1 style={{ fontSize: '2em', marginBottom: '30px', marginTop: '30px', textAlign: 'center', fontFamily: 'zzzTH' }}>Log in to CapstoneHub</h1>
        
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
  );
}