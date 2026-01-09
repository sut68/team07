"use client";
import { useEffect, useState } from 'react';
import { Spin, Modal, message, Select } from 'antd';
import { 
  CheckCircleOutlined,  
  SettingOutlined,
  TeamOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { GetEvaluationProjects, GetEvaluationProjectYears } from '../../../services/evaluation';
import CriteriaManager from '../../../components/evaluation/criteriaManager';
import AdvisorProjectCard from '../../../components/evaluation/AdvisorProjectCard';
import CommitteeProjectCard from '../../../components/evaluation/CommitteeProjectCard';
import '../../../style/evaluation.css';

const LABEL_MAP: Record<string, string> = {
  "Advisor Evaluation": "Advisor Evaluation (ที่ปรึกษา)",
  "Ethics Test": "Ethics Test (จริยธรรม)",
  "Committee Evaluation": "Committee Evaluation (กรรมการ)",
};

export default function TeacherEvaluationDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'advisor' | 'committee'>(
        (tabParam === 'committee') ? 'committee' : 'advisor'
    );
    
    // Year Filter State
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

    const [showCriteriaManager, setShowCriteriaManager] = useState(false);

    const [openSelect, setOpenSelect] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);

    // Fetch Years
    const fetchYears = async () => {
        try {
            const res = await GetEvaluationProjectYears(activeTab);
            setAvailableYears(res.data.years || []);
            // Default select latest year if available and not set
            if (res.data.years?.length > 0 && !selectedYear) {
               // setSelectedYear(res.data.years[0]); // Optional: Auto select latest
            }
        } catch (error) {
            console.error("Failed to fetch years", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await GetEvaluationProjects(undefined, activeTab, selectedYear);
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
        if (tabParam === 'committee' || tabParam === 'advisor') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    useEffect(() => {
        fetchYears();
        // Reset selected year when tab changes? Maybe not necessary if years are shared or user wants to keep year.
        // For now let's keep selectedYear unless it's invalid for the new tab (handled by fetchYears logic if we strictly validated).
        // Check if selectedYear is still in availableYears after fetch? 
        // Actually fetchYears is async, so better rely on fetchData dependency
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [activeTab, selectedYear]);

    const handleSelectEvaluation = (type: string, project?: any) => {
        const targetProject = project || selectedProject;
        const appt = targetProject?.appointments?.find(
            (a: any) => a.evaluation_name === type
        );

        if (!appt) {
            message.warning("ยังไม่มีนัดหมายสำหรับการประเมินประเภทนี้");
            return;
        }

        setOpenSelect(false);
        router.push(
            `/teacher/evaluation/form/${appt.id}?evalType=${encodeURIComponent(type)}&mode=advisor`
        );
    };

    const handleProjectClick = (proj: any) => {
        setSelectedProject(proj);
        setOpenSelect(true);
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

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                         <Select
                            placeholder="เลือกปีการศึกษา"
                            style={{ width: 140, height: 40, color: '#000' }}
                            allowClear
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(val)}
                            options={availableYears.map(y => ({ label: `ปี ${y}`, value: y }))}
                            suffixIcon={<CalendarOutlined style={{ color: '#000' }} />}
                        />

                        <button 
                            className="btn-config" 
                            onClick={() => setShowCriteriaManager(true)}
                        >
                            <SettingOutlined /> ตั้งค่าเกณฑ์คะแนน
                        </button>
                    </div>
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
                            activeTab === 'advisor' ? (
                                <AdvisorProjectCard 
                                    key={proj.id} 
                                    project={proj} 
                                    onEvaluate={handleProjectClick} 
                                />
                            ) : (
                                <CommitteeProjectCard 
                                    key={proj.id} 
                                    project={proj} 
                                />
                            )
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
                    closable={false}
                    centered
                    width={520}
                >
                    <div style={{ padding: 24 }}>
                        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
                            เลือกประเภทการประเมิน
                        </h2>

                        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                            {selectedProject?.available_evaluations
                                ?.filter((type: string) => type !== "Peer Assessment" && type !== "Committee Evaluation")
                                ?.map((type: string) => (
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
