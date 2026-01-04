'use client'

import React, { useState } from 'react';
import GroupCard from './GroupCard'; // Import คอมโพเนนต์เดิมของคุณ
// Import Interfaces ที่จำเป็น (สมมติ path)
import { SelectAdvisor } from '../../interfaces/Advisor'; 
import '../../style/TeacherSelectPage.css';

interface AdvisorCardWrapperProps {
    selectionData: SelectAdvisor; // รับข้อมูลการเลือกทั้งก้อน (มี GroupProject และ Description)
    type: 'pending' | 'accepted'; // บอกสถานะเพื่อตัดสินใจว่าจะโชว์ปุ่ม Action ไหม
    onAccept?: (selectionId: number) => void;
    onReject?: (selectionId: number) => void;
}

const AdvisorCardWrapper: React.FC<AdvisorCardWrapperProps> = ({ 
    selectionData, 
    type,
    onAccept,
    onReject
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const { group_project, description, no, ID } = selectionData;

    if (!group_project) return null;

    return (
        <div className="advisor-card-wrapper">
            {/* 1. Reuse GroupCard เดิม */}
            {/* เราส่ง currentUserId เป็น null หรือ 0 ไป เพราะในมุมมองอาจารย์ ไม่จำเป็นต้องไฮไลท์ตัวเองในกลุ่ม */}
            <GroupCard 
                group={group_project} 
                currentUserId={0} 
                globalUserHasGroup={false}
                hideAction={true} // ซ่อนปุ่ม Join ของนักศึกษาออกไป
            />

            {/* 2. ส่วนขยายด้านล่าง (Teacher's UI Only) */}
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