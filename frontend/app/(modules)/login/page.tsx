"use client"; 

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard'); 
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 style={{ fontSize: '2em', marginBottom: '30px', textAlign: 'center' }}>Login Test</h1>
        
        <div style={{ marginBottom: '0px' }}>
          <button
            type="submit" 
            className="login-button"
          >
            กดเพื่อเข้า Dashboard
          </button>
        </div>
      </form>
    </div>
  );
}