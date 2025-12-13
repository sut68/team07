"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin, Tag, Tooltip } from 'antd';
import { 
  EditOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { GetEvaluationProjects } from '../../../services/evaluation';
import CriteriaManager from '../../../components/evaluation/criteriaManager';

// ใช้ไฟล์ CSS เดียวกับหน้าอื่น
import '../../../style/evaluation.css';

export default function TeacherEvaluationDashboard() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 'advisor' = กลุ่มที่ปรึกษา, 'committee' = สอบกรรมการ
    const [activeTab, setActiveTab] = useState<'advisor' | 'committee'>('advisor');
    const [showCriteriaManager, setShowCriteriaManager] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Logic: Advisor = type undefined (หรือตาม API กำหนด), Committee = type 3
            const typeId = activeTab === 'committee' ? 3 : undefined; 
            
            const res = await GetEvaluationProjects(typeId);
            
            // กรองข้อมูลซ้ำ (เผื่อ API ส่งมาเบิ้ล)
            const uniqueProjects = Array.from(new Map(res.data.map((item: any) => [item.id, item])).values());
            
            setProjects(uniqueProjects);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    return (
        <div className="eval-page">
            <div className="eval-container animate-fade-in" style={{paddingTop: 32}}>
            
                {/* 1. Header & Global Actions */}
                <header className="dash-header">
                    <div className="dash-title">
                        <h1>การประเมินผล (Evaluation)</h1>
                        <p>จัดการคะแนนโครงงาน • {activeTab === 'advisor' ? 'กลุ่มที่ปรึกษา' : 'สอบกรรมการ'}</p>
                    </div>

                    <button 
                        className="btn-config" 
                        onClick={() => setShowCriteriaManager(true)}
                    >
                        <SettingOutlined /> ตั้งค่าเกณฑ์คะแนน
                    </button>
                </header>

                {/* 2. Tabs Switcher */}
                <div className="tabs-wrapper">
                    <button 
                        className={`tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advisor')}
                    >
                        <TeamOutlined /> กลุ่มที่ปรึกษา (Advisor)
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'committee' ? 'active' : ''}`}
                        onClick={() => setActiveTab('committee')}
                    >
                        <CheckCircleOutlined /> สอบกรรมการ (Final Defense)
                    </button>
                </div>

                {/* 3. Content Grid */}
                {loading ? (
                    <div className="flex justify-center h-64 items-center"><Spin size="large" /></div>
                ) : projects.length > 0 ? (
                    <div className="project-grid">
                        {projects.map((proj) => (
                            <div key={proj.id} className="project-card">
                                {/* แถบสีสถานะ */}
                                <div className={`status-bar ${proj.is_graded ? "graded" : "pending"}`} />
                                
                                <div className="card-body">
                                    <div className="card-top-row">
                                        <span className="group-tag">Group {proj.group_number}</span>
                                        {proj.is_graded ? (
                                            <Tag color="success" icon={<CheckCircleOutlined />}>ตรวจแล้ว</Tag>
                                        ) : (
                                            <Tag color="warning" icon={<ClockCircleOutlined />}>รอตรวจ</Tag>
                                        )}
                                    </div>

                                    <h3 className="project-name">
                                        {proj.project_name || "โครงงานคอมพิวเตอร์"}
                                    </h3>

                                    <div className="member-count">
                                        <TeamOutlined /> {proj.students ? proj.students.length : 0} สมาชิก
                                    </div>
                                </div>

                                <div className="card-actions">
                                    {/* ปุ่มประเมิน */}
                                    <Link href={`/teacher/evaluation/form/${proj.id}`} style={{flex: 1, display: 'flex'}}>
                                        <button className={`btn-card ${proj.is_graded ? 'edit' : 'eval'}`}>
                                            <EditOutlined /> {proj.is_graded ? 'แก้ไขคะแนน' : 'ประเมินผล'}
                                        </button>
                                    </Link>

                                    {/* ปุ่มดูสรุป (แสดงเฉพาะตอนตรวจแล้ว) */}
                                    {proj.is_graded && (
                                        <Link href={`/teacher/evaluation/summary/${proj.id}`}>
                                            <Tooltip title="ดูสรุปผลคะแนน">
                                                <button className="btn-icon-only">
                                                    <BarChartOutlined />
                                                </button>
                                            </Tooltip>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <TeamOutlined style={{fontSize: 48, marginBottom: 16, opacity: 0.5}} />
                        <h3>ไม่พบกลุ่มโครงงานในหมวดนี้</h3>
                        <p>ลองเปลี่ยนแท็บ หรือตรวจสอบรายชื่อกลุ่มอีกครั้ง</p>
                    </div>
                )}

                {/* Modal ตั้งค่าเกณฑ์ (เรียกใช้ครั้งเดียวที่นี่) */}
                <CriteriaManager 
                    visible={showCriteriaManager} 
                    onClose={() => setShowCriteriaManager(false)} 
                />
            </div>
        </div>
    );
}