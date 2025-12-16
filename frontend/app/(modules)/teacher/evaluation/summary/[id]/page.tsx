"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Button } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { GetEvaluationSummary } from '../../../../../services/evaluation';
import '../../../../../style/evaluation.css'; // ใช้ CSS ไฟล์เดียว

export default function EvaluationSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GetEvaluationSummary(Number(params.id)).then(res => {
            setData(res.data);
            setLoading(false);
        });
    }, [params.id]);

    if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;

    return (
        <div className="eval-page">
            <div className="summary-container animate-fade-in">
                
                {/* Header Navigation */}
                <div style={{marginBottom: 24}}>
                    <button className="btn-back" onClick={() => router.back()} style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', padding: '8px 16px', borderRadius: 8}}>
                        <ArrowLeftOutlined /> กลับไปหน้าประเมิน
                    </button>
                </div>

                <div className="section-header">
                    <TrophyOutlined style={{fontSize: 28, color: '#9a0120'}}/>
                    <h1 style={{margin:0, fontSize: '1.5rem'}}>สรุปผลคะแนนรวม</h1>
                </div>

                {/* Score Overview Card */}
                <div className="score-overview-card">
                    <div className="big-score-icon">
                        <TrophyOutlined />
                    </div>
                    <div className="big-score-value">{data.group_total_score}</div>
                    <div className="big-score-label">คะแนนกลุ่มเฉลี่ย (Group Average)</div>
                    <div style={{marginTop: 8, color: '#94a3b8', fontSize: '0.9rem'}}>
                        จากกรรมการ {data.group_details?.[0]?.teacher_count || 0} ท่าน
                    </div>
                </div>

                {/* Student List */}
                <div className="section-header" style={{marginTop: 48}}>
                    <UserOutlined style={{fontSize: 24, color: '#9a0120'}}/>
                    <h2>รายละเอียดคะแนนรายบุคคล</h2>
                </div>

                <div className="student-score-grid">
                    {data.individual_details.map((std: any) => (
                        <div key={std.student_id} className="student-score-card">
                            <div className="student-header">
                                <div className="student-profile">
                                    <div className="avatar" style={{background: '#1e293b', color: 'white'}}>
                                        {std.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="std-name" style={{fontSize: '1rem'}}>{std.student_name}</span>
                                        <span className="std-code">{std.student_code}</span>
                                    </div>
                                </div>
                                <div className="student-total" style={{display: 'flex', gap: '16px'}}>
                                    <div style={{textAlign: 'right'}}>
                                        <span className="label" style={{display: 'block', fontSize: '0.75rem', color: '#64748b'}}>Total</span>
                                        <span className="value" style={{fontSize: '1.1rem', fontWeight: 700}}>{std.grand_total}</span>
                                    </div>
                                    <div style={{textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px'}}>
                                        <span className="label" style={{display: 'block', fontSize: '0.75rem', color: '#64748b'}}>Grade</span>
                                        <span className="value" style={{fontSize: '1.1rem', fontWeight: 700, color: '#9a0120'}}>{std.grade}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="score-breakdown">
                                {data.group_details?.length > 0 && (
                                    <div style={{marginBottom: 12}}>
                                        <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4, fontWeight: 600}}>คะแนนกลุ่ม (Group Scores)</div>
                                        {data.group_details.map((g: any, idx: number) => (
                                            <div key={`g-${idx}`} className="breakdown-item">
                                                <span className="breakdown-label">{g.evaluation_name}</span>
                                                <span className="breakdown-value">{g.average_score}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {std.scores?.length > 0 && (
                                    <div>
                                        <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4, fontWeight: 600}}>คะแนนรายบุคคล (Individual Scores)</div>
                                        {std.scores.map((s: any, idx: number) => (
                                            <div key={`s-${idx}`} className="breakdown-item">
                                                <span className="breakdown-label">{s.evaluation_name}</span>
                                                <span className="breakdown-value">{s.average_score}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}