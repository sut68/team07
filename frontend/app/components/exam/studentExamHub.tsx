"use client";

import Link from 'next/link';
import { Tabs } from 'antd';
import { UsergroupAddOutlined, TrophyOutlined } from '@ant-design/icons';
import StudentAppointmentDetail from '../appointment/studentAppointmentDetail';
import '../../style/evaluation.css';
import '../../style/appointment.css';

const TAB_KEYS = {
    appointments: 'appointments',
    evaluations: 'evaluations',
};

export default function StudentExamHub() {
    const evaluationMenu = (
        <div className="hub-grid" style={{ marginTop: 12 }}>
            <Link href="/student/evaluation/peer" className="menu-card">
                <div className="menu-icon">
                    <UsergroupAddOutlined />
                </div>
                <h2 className="menu-title">ประเมินเพื่อนร่วมทีม</h2>
                <p className="menu-desc">ส่งคะแนน Peer Assessment สำหรับสมาชิกภายในกลุ่ม</p>
            </Link>

            <Link href="/student/evaluation/result" className="menu-card">
                <div className="menu-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                    <TrophyOutlined />
                </div>
                <h2 className="menu-title">ผลคะแนนของฉัน</h2>
                <p className="menu-desc">ดูผลการประเมินและสรุปคะแนนรวมของคุณ</p>
            </Link>
        </div>
    );

    const tabItems = [
        {
            key: TAB_KEYS.appointments,
            label: 'การนัดหมาย',
            children: (
                <StudentAppointmentDetail
                    variant="embedded"
                    showHeader={false}
                />
            ),
        },
        {
            key: TAB_KEYS.evaluations,
            label: 'การประเมิน',
            children: evaluationMenu,
        },
    ];

    return (
        <div className="appointment-page">
            <div className="animate-fade-in">
                <div className="page-title-box">
                    <h1>เกี่ยวกับสอบ</h1>
                    <p>รวมข้อมูลการนัดหมายสอบและการประเมินของคุณไว้ในที่เดียว</p>
                </div>

                <div className="exam-tabs-wrapper">
                    <Tabs defaultActiveKey={TAB_KEYS.appointments} items={tabItems} />
                </div>
            </div>
        </div>
    );
}
