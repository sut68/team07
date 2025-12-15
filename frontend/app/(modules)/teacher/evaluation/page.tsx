"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin, Tag, Tooltip, Modal, message } from 'antd';
import { 
  EditOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { GetEvaluationProjects } from '../../../services/evaluation';
import CriteriaManager from '../../../components/evaluation/criteriaManager';
import '../../../style/evaluation.css';

const LABEL_MAP: Record<string, string> = {
  "Advisor Evaluation": "Advisor Evaluation (ที่ปรึกษา)",
  "Ethics Test": "Ethics Test (จริยธรรม)",
  "Committee Evaluation": "Committee Evaluation (กรรมการ)",
};

export default function TeacherEvaluationDashboard() {
    const router = useRouter();

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'advisor' | 'committee'>('advisor');
    const [showCriteriaManager, setShowCriteriaManager] = useState(false);

    // 🔽 modal state
    const [openSelect, setOpenSelect] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await GetEvaluationProjects(undefined, activeTab);
            const uniqueProjects = Array.from(
                new Map(res.data.map((item: any) => [item.id, item])).values()
            );
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

    // 🔽 เลือกประเภทการประเมิน
    const handleSelectEvaluation = (type: string) => {
        const appt = selectedProject?.appointments?.find(
            (a: any) => a.evaluation_name === type
        );

        if (!appt) {
            message.warning("ยังไม่มีนัดหมายสำหรับการประเมินประเภทนี้");
            return;
        }

        setOpenSelect(false);
        router.push(
            `/teacher/evaluation/form/${appt.id}?evalType=${encodeURIComponent(type)}`
        );
    };

    return (
        <div className="eval-page">
            <div className="eval-container animate-fade-in" style={{ paddingTop: 32 }}>
            
                {/* Header */}
                <header className="dash-header">
                    <div className="dash-title">
                        <h1>การประเมินผล (Evaluation)</h1>
                        <p>
                          จัดการคะแนนโครงงาน • 
                          {activeTab === 'advisor' ? ' กลุ่มที่ปรึกษา' : ' สอบกรรมการ'}
                        </p>
                    </div>

                    <button 
                        className="btn-config" 
                        onClick={() => setShowCriteriaManager(true)}
                    >
                        <SettingOutlined /> ตั้งค่าเกณฑ์คะแนน
                    </button>
                </header>

                {/* Tabs */}
                <div className="tabs-wrapper">
                    <button 
                        className={`tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advisor')}
                    >
                        <TeamOutlined /> สำหรับที่ปรึกษา
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'committee' ? 'active' : ''}`}
                        onClick={() => setActiveTab('committee')}
                    >
                        <CheckCircleOutlined /> สอบจบโครงงาน
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center h-64 items-center">
                        <Spin size="large" />
                    </div>
                ) : projects.length > 0 ? (
                    <div className="project-grid">
                        {projects.map((proj) => (
                            <div key={proj.id} className="project-card">
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
                                        <TeamOutlined /> {proj.students?.length || 0} สมาชิก
                                    </div>
                                </div>

                                <div className="card-actions">
                                    {/* 🔽 ประเมิน (เปิด modal) */}
                                    <button
                                        className={`btn-card ${proj.is_graded ? 'edit' : 'eval'}`}
                                        style={{ flex: 1 }}
                                        onClick={() => {
                                            setSelectedProject(proj);
                                            setOpenSelect(true);
                                        }}
                                    >
                                        <EditOutlined /> {proj.is_graded ? 'แก้ไขคะแนน' : 'ประเมินผล'}
                                    </button>

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
                        <TeamOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                        <h3>ไม่พบกลุ่มโครงงาน</h3>
                        <p>ลองเปลี่ยนแท็บ หรือตรวจสอบข้อมูลอีกครั้ง</p>
                    </div>
                )}

                <CriteriaManager 
                    visible={showCriteriaManager} 
                    onClose={() => setShowCriteriaManager(false)} 
                />

                {/* 🔽 Modal เลือกประเภทการประเมิน */}
                <Modal
                    open={openSelect}
                    footer={null}
                    onCancel={() => setOpenSelect(false)}
                    centered
                    width={520}
                >
                    <div className="eval-page" style={{ padding: 24 }}>
                        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
                            เลือกประเภทการประเมิน
                        </h2>

                        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                            {selectedProject?.available_evaluations?.map((type: string) => (
                                <button
                                    key={type}
                                    className="btn-primary"
                                    onClick={() => handleSelectEvaluation(type)}
                                >
                                    {LABEL_MAP[type] || type}
                                </button>
                            ))}
                        </div>

                        <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button className="btn-back" onClick={() => setOpenSelect(false)}>
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
