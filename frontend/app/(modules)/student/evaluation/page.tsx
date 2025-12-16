"use client";
import React from 'react';
import Link from 'next/link';
import { UsergroupAddOutlined, BarChartOutlined, TrophyOutlined } from '@ant-design/icons';
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

                    {/* 2. ดูผลคะแนน (เปิดใช้งานแล้ว!) */}
                    <Link href="/student/evaluation/result" className="menu-card">
                        <div className="menu-icon" style={{background: '#fff7ed', color: '#ea580c'}}>
                            <TrophyOutlined />
                        </div>
                        <h2 className="menu-title">ผลคะแนนของฉัน</h2>
                        <p className="menu-desc">
                            ดูสรุปคะแนนรวมที่ได้รับจากการประเมิน
                        </p>
                    </Link>

                </div>
            </div>
        </div>
    );
}