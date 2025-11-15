"use client";

import { useRouter } from 'next/navigation';
import "../../style/login.css"
import loginbg from "../../../public/image/login-bg2.jpg"

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  const overlayColor = 'rgba(0, 0, 0, 0.3)';

  return (
    <div className="login-container" style={{
      backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${loginbg.src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundAttachment: "fixed",

    }}>

      <form onSubmit={handleLogin} className="login-form">
        <h1 style={{ fontSize: '2em', marginBottom: '30px', marginTop:'30px',textAlign: 'center', fontFamily: 'zzzTH' }}>Log in to CapstoneHub</h1>
        
        <div className='login-info-container'>
          <input
            type="text"
            placeholder="Username"
            name="username"
            // value={Info.firstname}
            // onChange={HandleInfo}
          className='login-info'
          />

          <input
            type="text"
            placeholder="Password"
            name="password"
            // value={Info.firstname}
            // onChange={HandleInfo}
          className='login-info'
          />
        </div>
        <div className='login-button-container'>
          <div style={{ marginBottom: '0px' }}>
          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>
        </div>
        </div>
      </form>

    </div>
  );
}