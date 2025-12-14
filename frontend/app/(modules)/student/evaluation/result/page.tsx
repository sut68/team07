"use client";
import React, { useEffect, useState } from 'react';
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