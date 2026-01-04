"use client";

import { useState, useEffect } from 'react';
import '../../../style/dashboard.css';
import NewsList from '../../../components/news/NewsList';
import NewsModal from '../../../components/news/NewsModal';
import { News } from '../../../interfaces/News';
import { useAuth } from '../../roleCheck/authContext';
import { GetListAppointments } from '../../../services/appointment';
import { IAppointment } from '../../../interfaces/Appointment';
import AppointmentSlider from '../../../components/dashboard/appointmentSlider';
import { Tabs } from 'antd';

export default function TeacherDashboardPage() {
    const { user } = useAuth();
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [refreshNewsTrigger, setRefreshNewsTrigger] = useState(0);
    
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [loadingAppt, setLoadingAppt] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await GetListAppointments();
                if (res.data) {
                    setAppointments(res.data);
                }
            } catch (error) {
                console.error("Error fetching appointments:", error);
            } finally {
                setLoadingAppt(false);
            }
        };
        fetchAppointments();
    }, []);

    const handleEditNews = (news: News) => {
        setEditingNews(news);
        setIsNewsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsNewsModalOpen(false);
        setEditingNews(null);
    };

    const handleNewsSuccess = () => {
        setRefreshNewsTrigger(prev => prev + 1);
    };

    // Filter appointments
    const advisorAppointments = appointments.filter(a => 
        a.teacher_id === user?.id && a.evaluation_name !== 'Committee Evaluation'
    );
    
    const committeeAppointments = appointments.filter(a => 
        a.type_name === 'Final Defense' && 
        a.evaluation_name === 'Committee Evaluation'
    );

    const appointmentItems = [
        {
            key: 'advisor',
            label: 'ที่ปรึกษา (Advisor)',
            children: <AppointmentSlider appointments={advisorAppointments} category="advisor" />,
        },
        {
            key: 'committee',
            label: 'นัดหมายสอบจบ (Final Defense Appointments)',
            children: <AppointmentSlider appointments={committeeAppointments} category="committee" />,
        },
    ];

    return (
        <div className="container-teacher-dashboard">
            <NewsModal 
                isOpen={isNewsModalOpen} 
                onClose={handleCloseModal} 
                onSuccess={handleNewsSuccess}
                initialData={editingNews}
            />
            {/* --- ส่วนซ้าย: ข่าวสาร (50%) --- */}
            <div className="news-section-teacher">
                <NewsList 
                    currentUserId={user?.id} 
                    role="Teacher" 
                    onEditClick={handleEditNews}
                    refreshTrigger={refreshNewsTrigger}
                />
            </div>

            {/* --- ส่วนขวา: รวม 3 ส่วนเดิม (50%) --- */}
            <div className="right-panel-teacher">
                
                {/* นัดหมาย */}
                <div className="section-teacher top-teacher">
                    <h2 style={{ marginBottom: '0px', fontSize: '1.25rem', fontWeight: 'bold', flexShrink: 0 }}>
                        การนัดหมาย (Appointments)
                    </h2>
                    <div style={{ flex: 1, minHeight: 0 }}> 
                        <Tabs 
                            defaultActiveKey="advisor" 
                            items={appointmentItems} 
                            className="full-height-tabs"
                        />
                    </div>
                </div>

                {/* แจ้งเตือนกลุ่ม */}
                <div className="section-teacher middle-teacher">
                    <h1>กลุ่มของเอ แจ้งว่ามีใครเลือกคุณ (Middle) ทำเเบบขึ้นว่ามีเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
                </div>

                {/* ความคืบหน้า */}
                <div className="section-teacher bottom-teacher">
                    <h1>ของพู แสดงความคืบหน้า (Bottom) ทำเเบบขึ้นว่ามีอะไรเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
                </div>

            </div>

        </div>
    );
}