"use client";

import { GetMe } from "../../../services/login";
import { useState } from 'react';
import { isAxiosError } from 'axios';

export default function DashboardPage() {
    const role = "Student";
    const [statusMessage, setStatusMessage] = useState("คลิกปุ่มเพื่อทดสอบ Token");

    const handleTestToken = async () => {
        try {
            const res = await GetMe();
            setStatusMessage(`สำเร็จ! Token ใช้งานได้ (${res.data.username})`);
            console.log("Success: /me response:", res.data);
            
        } catch (error) {
            if (isAxiosError(error)) {
                const status = error.response?.status || 'Unknown';
                console.error("Error calling /me:", error.response, error.message);
            } else {
                setStatusMessage("เกิดข้อผิดพลาดที่ไม่รู้จัก. โปรดตรวจสอบ Console.");
                console.error("Unknown Error:", error);
            }
        }
    };
    return (
        <div>
            <h1 className="page-title">Dashboard {role}</h1>
            <p>ยินดีต้อนรับสู่หน้า Dashboard! ที่โล่งๆ สำหรับ {role}</p>
            
            <hr style={{ margin: '20px 0' }} />

            <h3>ทดสอบ Token Rotation</h3>
            <p>สถานะ: <strong>{statusMessage}</strong></p>
            <button 
                onClick={handleTestToken}
                style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
            >
                เรียก /me
            </button>
        </div>
    );
}