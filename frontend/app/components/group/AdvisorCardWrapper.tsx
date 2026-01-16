'use client'

import React, { useState } from 'react';
import GroupCard from './GroupCard'; 
import { SelectAdvisor } from '../../interfaces/Advisor'; 
import '../../style/TeacherSelectPage.css';


interface AdvisorCardWrapperProps {
    selectionData: SelectAdvisor; 
    type: 'pending' | 'accepted';
    onAccept?: (selectionId: number) => void;
    onReject?: (selectionId: number) => void;
    onViewProfile?: (student: any) => void;
}

const AdvisorCardWrapper: React.FC<AdvisorCardWrapperProps> = ({ 
    selectionData, 
    type,
    onAccept,
    onReject,
    onViewProfile
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const { group_project, description, no, ID } = selectionData;

    if (!group_project) return null;

    return (
        <div className="advisor-card-wrapper">
            {/*  Reuse GroupCard เดิม */}
            <GroupCard 
                group={group_project} 
                currentUserId={0} // ไฮไลท์ตัวเองในกลุ่ม
                globalUserHasGroup={false}
                hideAction={true} // ซ่อนปุ่ม Join ของนักศึกษาออกไป
                onViewProfile={onViewProfile}
            />

            {/* ส่วนขยายด้านล่าง (Teacher's UI Only) */}
            <div className="card-extension-footer">
                
                {/* แสดงลำดับที่นักศึกษาเลือก (เฉพาะ Pending) */}
                {type === 'pending' && (
                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                        นักศึกษาเลือกท่านเป็นลำดับที่ <span style={{ fontWeight: 'bold', color: '#8A011D' }}>{no}</span>
                    </div>
                )}

                {/* ปุ่ม Toggle รายละเอียด */}
                <button 
                    className="btn-toggle-details"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? 'ซ่อนรายละเอียดโครงงาน' : 'ดูรายละเอียดโครงงาน'}
                    <span>{showDetails ? '▲' : '▼'}</span>
                </button>

                {/* Panel แสดงรายละเอียด (เลื่อนลงมาเมื่อกดปุ่ม) */}
                {showDetails && (
                    <div className="details-panel">
                        <span className="details-label">รายละเอียดที่ระบุมา:</span>
                        <div className="details-content">
                            {description || "- ไม่มีการระบุรายละเอียด -"}
                        </div>
                    </div>
                )}

                {/* ปุ่ม Action (แสดงเฉพาะตอน Pending) */}
                {type === 'pending' && (
                    <div className="action-buttons-area">
                        <button 
                            className="btn-action btn-accept"
                            onClick={() => onAccept && onAccept(ID)}
                        >
                            ✓ อนุมัติ
                        </button>
                        <button 
                            className="btn-action btn-reject"
                            onClick={() => onReject && onReject(ID)}
                        >
                            ✕ ปฏิเสธ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvisorCardWrapper;