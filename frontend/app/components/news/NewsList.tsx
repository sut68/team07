"use client";

import { useCallback, useEffect, useState } from 'react';
import { News } from '../../interfaces/News';
import { getNews, deleteNews } from '../../services/news';
import NewsCard from './NewsCard';
import { Empty, Spin, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import '../../style/news.css';
import { Toast_success, Toast_fail } from '../Webmessage';

interface NewsListProps {
    currentUserId?: number;
    role: "Teacher" | "Student";
    onEditClick?: (news: News) => void; 
    refreshTrigger?: number;
}

export default function NewsList({ currentUserId, role, onEditClick, refreshTrigger }: NewsListProps) {
    const [newsList, setNewsList] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNewsData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNews();
            setNewsList(data);
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNewsData();
    }, [fetchNewsData, refreshTrigger]);

    useEffect(() => {
        const handleNewsUpdated = () => {
            fetchNewsData();
        };

        window.addEventListener('news:updated', handleNewsUpdated);
        return () => {
            window.removeEventListener('news:updated', handleNewsUpdated);
        };
    }, [fetchNewsData]);

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'ยืนยันการลบข่าวสาร',
            icon: <ExclamationCircleOutlined />,
            content: 'คุณต้องการลบข่าวสารนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
            okText: 'ยืนยัน',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await deleteNews(id);
                    setNewsList(prev => prev.filter(item => item.ID !== id));
                    Toast_success("ลบข่าวสารเรียบร้อย");
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || "เกิดข้อผิดพลาดในการลบข่าวสาร";
                    Toast_fail(errorMessage);
                }
            }
        });
    };

    const handleEdit = (news: News) => {
        if (onEditClick) {
            onEditClick(news);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#999', fontSize: '16px' }}>
                กำลังโหลดข่าวสาร...
            </div>
        </div>
        );
    }
    return (
        <div className="news-kanban-wrapper">
            <h2 className="section-title">ประกาศข่าวสาร</h2>
            
            {newsList.length === 0 ? (
                <div className="empty-state">
                    <Empty description="ยังไม่มีการแจ้งข่าวสารในขณะนี้" />
                </div>
            ) : (
                <div className="kanban-scroll-area">
                    {newsList.map((news) => (
                        <NewsCard 
                            key={news.ID} 
                            data={news} 
                            role={role}
                            currentUserId={currentUserId}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}