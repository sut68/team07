"use client";

import { EditOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { News } from '../../interfaces/News';
import { BASE_URL } from '../../services/api'; 
import '../../style/news.css';

interface NewsCardProps {
    data: News;
    role: "Teacher" | "Student";
    currentUserId?: number;
    onEdit?: (news: News) => void;
    onDelete?: (id: number) => void;
}

export default function NewsCard({ data, role, currentUserId, onEdit, onDelete }: NewsCardProps) {
    
    const isOwner = role === "Teacher";
    
    const isGeneral = data.Category === "General";
    const categoryClass = isGeneral ? "badge-general" : "badge-advisor";
    const cardTypeClass = isGeneral ? "type-general" : "type-advisor"; // Class ใหม่สำหรับเส้นข้าง
    const categoryLabel = isGeneral ? "ข่าวทั่วไป" : "ข่าวที่ปรึกษา";

    const cleanApiUrl = BASE_URL.replace(/\/$/, "");
    const fileUrl = data.File ? `${cleanApiUrl}/${data.File.replace(/\\/g, '/')}`: null;
    const fileName = data.File ? data.File.replace(/\\/g, '/').split('/').pop() : "ดาวน์โหลดไฟล์แนบ";

    return (
        <div className={`news-card ${cardTypeClass}`}>
            
            <div className="news-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`news-badge ${categoryClass}`}>{categoryLabel}</span>
                    <span className="news-date">
                        {new Date(data.CreatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                </div>

                {isOwner && (
                    <div className="news-actions">
                        <button onClick={() => onEdit && onEdit(data)} className="action-btn edit" title="แก้ไข">
                            <EditOutlined />
                        </button>
                        <button onClick={() => onDelete && onDelete(data.ID)} className="action-btn delete" title="ลบ">
                            <DeleteOutlined />
                        </button>
                    </div>
                )}
            </div>

            <h3 className="news-title">{data.Title}</h3>
            
            <p className="news-desc">
                {data.Description}
            </p>

            <div className="news-footer">
                {fileUrl ? (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                        <PaperClipOutlined /> {fileName}
                    </a>
                ) : (
                    <span style={{ fontSize: '0.8rem', color: '#ccc', fontStyle: 'italic' }}>
                        ไม่มีไฟล์แนบ
                    </span>
                )}
            </div>
        </div>
    );
}