"use client";

import { useState } from 'react';
import '../../../style/dashboard.css';
import NewsList from '../../../components/news/NewsList';
import NewsModal from '../../../components/news/NewsModal';
import { News } from '../../../interfaces/News';
import { useAuth } from '../../roleCheck/authContext';

export default function TeacherDashboardPage() {
    const { user } = useAuth();
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [refreshNewsTrigger, setRefreshNewsTrigger] = useState(0);

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
                    <h1>นัดหมายของหนึ่ง (Top) ทำเเบบขึ้นว่ามีนัดอะไรเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
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