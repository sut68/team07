"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { GetStudentEvaluationResult } from '../../../../services/evaluation';
import '../../../../style/evaluation.css';

export default function StudentResultPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await GetStudentEvaluationResult();
                if(res && res.data){
                    setResult(res.data);
                }
                
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
    }

    return (
        <div className="student-page">
            <div className="student-container animate-fade-in">
                
                <button 
                    onClick={() => router.back()} 
                    className="btn-back" 
                    style={{marginBottom: 24, paddingLeft: 0}}
                >
                    <ArrowLeftOutlined /> ย้อนกลับ
                </button>

                <div className="result-container">
                    
                    {result ? (
                        <div className="score-summary-card">
                            <div className="result-icon-wrapper">
                                <TrophyOutlined />
                            </div>
                            
                            <div className="total-score-label">คะแนนรวมสุทธิ (Grand Total)</div>
                            <div className="total-score-value">
                                {result.total_score ? Number(result.total_score).toFixed(2) : "0.00"}
                            </div>
                            <p className="total-score-desc">
                                คะแนนนี้รวบรวมจากผลการประเมินของอาจารย์และเพื่อนร่วมทีม
                            </p>

                            <div className="result-divider" />

                            <div className="score-details">
                                <div className="mini-score-box">
                                    <div className="mini-score-value">
                                        {result.average_score ? Number(result.average_score).toFixed(2) : "-"}
                                    </div>
                                    <div className="mini-score-label">คะแนนเฉลี่ย (Average)</div>
                                </div>
                                <div className="mini-score-box">
                                    <div className="mini-score-value" style={{color: '#9a0120'}}>
                                        {result.grade || "N/A"}
                                    </div>
                                    <div className="mini-score-label">เกรด (Grade)</div>
                                </div>
                            </div>

                            {(result.group_details?.length > 0 || result.individual_details?.length > 0) && (
                                <>
                                    <div className="result-divider" style={{margin: '24px 0'}} />
                                    <div style={{textAlign: 'left', width: '100%'}}>
                                        <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#333'}}>รายละเอียดคะแนน (Score Breakdown)</h3>
                                        
                                        {result.group_details?.length > 0 && (
                                            <div style={{marginBottom: 16}}>
                                                <h4 style={{fontSize: '0.95rem', color: '#64748b', marginBottom: 8}}>คะแนนกลุ่ม (Group Scores)</h4>
                                                {result.group_details.map((item: any, idx: number) => (
                                                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0'}}>
                                                        <span>{item.evaluation_name}</span>
                                                        <span style={{fontWeight: 600}}>{item.score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {result.individual_details?.length > 0 && (
                                            <div>
                                                <h4 style={{fontSize: '0.95rem', color: '#64748b', marginBottom: 8}}>คะแนนรายบุคคล (Individual Scores)</h4>
                                                {result.individual_details.map((item: any, idx: number) => (
                                                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0'}}>
                                                        <span>{item.evaluation_name}</span>
                                                        <span style={{fontWeight: 600}}>{item.score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {(result.comments?.length > 0) && (
                                <>
                                    <div className="result-divider" style={{margin: '24px 0'}} />
                                    <div style={{textAlign: 'left', width: '100%'}}>
                                        <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#333'}}>ความคิดเห็นจากอาจารย์ (Comments)</h3>
                                        
                                        <div className="comments-list">
                                            {result.comments.map((c: any, idx: number) => (
                                                <div key={idx} className="comment-card" style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    padding: 16,
                                                    marginBottom: 12
                                                }}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                                                        <span style={{fontWeight: 600, color: '#9a0120'}}>{c.evaluation_name}</span>
                                                        <span style={{fontSize: '0.9rem', color: '#64748b'}}>{c.teacher_name}</span>
                                                    </div>
                                                    <div style={{fontSize: '0.9rem', color: '#475569', marginBottom: 4}}>
                                                        <b>หัวข้อ:</b> {c.criteria}
                                                    </div>
                                                    <div style={{fontSize: '0.95rem', color: '#333'}}>
                                                        "{c.comment}"
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state-card">
                            <TrophyOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5, color: '#999' }} />
                            <h3 style={{fontSize:'1.25rem', fontWeight:700, color:'#333', marginBottom:8}}>ยังไม่ประกาศผลคะแนน</h3>
                            <p style={{color:'#666'}}>
                                อาจารย์ยังไม่ได้ทำการสรุปผลคะแนน หรือคุณยังไม่ได้รับการประเมินครบถ้วน
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}