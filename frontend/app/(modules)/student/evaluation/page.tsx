"use client";
import React from 'react';
import Link from 'next/link';
import { UsergroupAddOutlined, BarChartOutlined } from '@ant-design/icons';
import '../../../style/evaluation.css';
export default function StudentEvaluationHub() {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-[#9a0120] pl-4">
                การประเมินผล (Evaluation)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. การ์ดไปหน้าประเมินเพื่อน */}
                <Link href="/student/evaluation/peer" className="no-underline">
                    <div className="menuCard">
                        <div className="iconWrapper">
                            <UsergroupAddOutlined />
                        </div>
                        <h2 className="cardTitle">ประเมินเพื่อนร่วมทีม</h2>
                        <p className="cardDesc">
                            Peer Assessment: ให้คะแนนความร่วมมือสมาชิกในกลุ่ม
                        </p>
                    </div>
                </Link>

                {/* 2. การ์ดดูผลคะแนน (ถ้ามี) */}
                <div className="menuCard opacity-60 cursor-not-allowed">
                    <div className="iconWrapper" style={{ background: '#f5f5f5', color: '#999' }}>
                        <BarChartOutlined />
                    </div>
                    <h2 className="cardTitle">ผลคะแนนของฉัน</h2>
                    <p className="cardDesc">
                        ประกาศผลคะแนนสอบ (ยังไม่เปิดให้ใช้งาน)
                    </p>
                </div>

            </div>
        </div>
    );
}