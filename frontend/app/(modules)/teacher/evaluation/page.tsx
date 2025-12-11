"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin, Tabs, Empty, Button, Tag } from 'antd';
import { EditOutlined, CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { GetEvaluationProjects } from '../../../services/evaluation';
import '../../../style/evaluation.css';
import CriteriaManager from '../../../components/evaluation/criteriaManager';
export default function TeacherEvaluationDashboard() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('1');
    const [showCriteriaManager, setShowCriteriaManager] = useState(false);
    const fetchData = async () => {
        setLoading(true);
        try {
            const typeId = activeTab === '2' ? 3 : undefined;
            const res = await GetEvaluationProjects(typeId);
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const items = [
        { key: '1', label: 'กลุ่มที่ปรึกษา (Advisor)' },
        { key: '2', label: 'สอบกรรมการ (Final Defense)' },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 border-l-8 border-[#9a0120] pl-4">
                    การประเมินผล (Evaluation)
                </h1>
                <p className="text-gray-500 pl-6 mt-1">ประเมินคะแนนโครงงานและดูผลสรุป</p>
            </div>

            <div className="bg-white p-2 rounded-lg shadow-sm mb-6 border border-gray-100">
                <Tabs defaultActiveKey="1" items={items} onChange={setActiveTab} size="large" centered />
            </div>

            {loading ? (
                <div className="flex justify-center h-64 items-center"><Spin size="large" /></div>
            ) : projects.length > 0 ? (
                <div className="grid gap-4">
                    {projects.map((proj) => (
                        <div key={proj.id} className="projectCard">
                            <div className={`cardStripe ${proj.is_graded ? "stripeGraded" : "stripePending"}`} />
                            
                            <div className="pl-4 flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <Tag color="blue">Group {proj.group_number}</Tag>
                                    {proj.is_graded ? (
                                        <Tag color="success" icon={<CheckCircleOutlined />}>ตรวจแล้ว</Tag>
                                    ) : (
                                        <Tag color="warning" icon={<ClockCircleOutlined />}>รอประเมิน</Tag>
                                    )}
                                </div>
                                <div className="projectInfo">
                                    <h3>{proj.project_name || "โครงงานคอมพิวเตอร์"}</h3>
                                    <p>ID: {proj.id}</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowCriteriaManager(true)}>ตั้งค่าเกณฑ์คะแนน</Button>
                            <CriteriaManager visible={showCriteriaManager} onClose={() => setShowCriteriaManager(false)} />
                            <div className="flex gap-2">
                                {/* ปุ่มดูสรุป (ถ้าตรวจแล้ว) */}
                                {proj.is_graded && (
                                    <Link href={`/teacher/evaluation/summary/${proj.id}`}>
                                        <Button icon={<BarChartOutlined />}>สรุปผล</Button>
                                    </Link>
                                )}
                                
                                <Link href={`/teacher/evaluation/form/${proj.id}`}>
                                    <Button 
                                        type="primary" 
                                        icon={<EditOutlined />} 
                                        className={proj.is_graded ? "bg-gray-500" : "bg-[#9a0120]"}
                                    >
                                        {proj.is_graded ? 'แก้ไขคะแนน' : 'ประเมิน'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Empty description="ไม่พบกลุ่มโครงงานในหมวดนี้" />
            )}
        </div>
    );
}