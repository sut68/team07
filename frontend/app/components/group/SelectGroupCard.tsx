'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { SelectAdvisor } from '../../interfaces/Advisor'; 
import GroupCard from '../group/GroupCard'; 
import '../../style/dashboard.css';

interface DashboardPendingWidgetProps {
    requests: SelectAdvisor[];
    year: number;
}

const DashboardPendingWidget: React.FC<DashboardPendingWidgetProps> = ({ requests, year }) => {
    const router = useRouter();

    return (
        <div style={{ marginBottom: '30px' }}>
            {/* --- Header --- */}
            <div className="section-header-with-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{fontSize: '1.25rem', fontWeight: '800', color: '#333'}}>
                    คำขอที่รอการพิจารณา
                    {requests.length > 0 && (
                        <span style={{fontSize: '1.25rem', fontWeight: '800', color: '#666', paddingLeft: '10px'}}>({requests.length})</span>
                    )}
                </div>

                <button 
                    className="btn-view-all-theme"
                    onClick={() => router.push('/teacher/group')} 
                >
                    ดูทั้งหมด <span>&rsaquo;</span>
                </button>
            </div>

            {/* --- Body (ใช้ GroupCard) --- */}
            <div className="cards-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {requests.length === 0 ? (
                    <div className="empty-state-card" style={{ padding: '30px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px', color: '#888', gridColumn: '1 / -1' }}>
                        ไม่มีคำขอใหม่ในขณะนี้ (ปีการศึกษา {year})
                    </div>
                ) : (
                    requests.slice(0, 2).map(request => (
                        <div key={request.ID} style={{ position: 'relative' }}>
                            {request.group_project && (
                                <GroupCard 
                                    group={request.group_project} 
                                    currentUserId={0} 
                                    globalUserHasGroup={false}
                                    hideAction={true} // ซ่อนปุ่ม Join
                                />
                            )}
                        </div>
                    ))
                )}
            </div>
            
            {requests.length > 2 && (
                <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem', color: '#888' }}>
                    และอีก <span style={{ fontWeight: 'bold', color: '#8A011D' }}>{requests.length - 2}</span> กลุ่ม...
                </div>
            )}
        </div>
    );
};

export default DashboardPendingWidget;