"use client";

import { useState } from 'react';
import { isAxiosError } from 'axios';
import CheckRole from '../../roleCheck/protectRollback';

export default function DashboardPage() {
    const role = "Teacher";
    const [statusMessage, setStatusMessage] = useState("คลิกปุ่มเพื่อทดสอบ Token");
    CheckRole();
    
    return (
        <div>
            <h1 className="page-title">Dashboard {role}</h1>
            <p>ยินดีต้อนรับสู่หน้า Dashboard! ที่โล่งๆ สำหรับ {role}</p>
            
            <hr style={{ margin: '20px 0' }} />

            <h3>ทดสอบ Token Rotation</h3>
            <p>สถานะ: <strong>{statusMessage}</strong></p>
           
        </div>
    );
}