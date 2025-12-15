import React from 'react';
import Link from 'next/link';
import { UsergroupAddOutlined, BarChartOutlined } from '@ant-design/icons';
import '../../../style/evaluation.css';

export default function StudentEvaluationHub() {
    return (
        <div className="student-page">
            <div className="student-container animate-fade-in">
                
                <div className="page-title-box">
                    <h1>การประเมินผล (Evaluation)</h1>
                    <p>ระบบจัดการการประเมินผลโครงงาน</p>
                </div>

                <div className="hub-grid">
                    
                    {/* 1. ประเมินเพื่อน */}
                    <Link href="/student/evaluation/peer" className="menu-card">
                        <div className="menu-icon">
                            <UsergroupAddOutlined />
                        </div>
                        <h2 className="menu-title">ประเมินเพื่อนร่วมทีม</h2>
                        <p className="menu-desc">
                            Peer Assessment: ให้คะแนนความร่วมมือสมาชิกในกลุ่ม
                        </p>
                    </Link>

                    {/* 2. ดูผลคะแนน (Disabled) */}
                    <div className="menu-card disabled">
                        <div className="menu-icon">
                            <BarChartOutlined />
                        </div>
                        <h2 className="menu-title">ผลคะแนนของฉัน</h2>
                        <p className="menu-desc">
                            ประกาศผลคะแนนสอบ (ยังไม่เปิดให้ใช้งาน)
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}