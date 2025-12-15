"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SavePeerEvaluation ,GetStudentEvaluationForm } from '../../../../services/evaluation';
import { GetMe } from '../../../../services/login';
import type { ISaveEvaluationPeerRequest } from '../../../../interfaces/Evaluation';
import '../../../../style/evaluation.css';

const rubric = [
    { value: 5, label: "5 - สม่ำเสมอ (Always)" },
    { value: 4, label: "4 - บ่อยครั้ง (Often)" },
    { value: 3, label: "3 - บางครั้ง (Sometimes)" },
    { value: 1, label: "1 - น้อยมาก (Rarely)" },
    { value: 0, label: "0 - มึงมันไร้ค่า (Priceless)" }
];

export default function PeerEvaluationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [appointmentId] = useState<number | null>(null);
    const [scores, setScores] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                const [res, me] = await Promise.all([
                    GetStudentEvaluationForm(),
                    GetMe()
                ]);

                if (res.status === 200 && res.data) {
                    const myId = me.id;

                    if (res.data.students) {
                        const filtered = res.data.students.filter(
                            (s: any) => s.student_id !== myId
                        );
                        setMembers(filtered);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);


    const handleScoreChange = (targetId: number, score: number) => {
        setScores(prev => ({ ...prev, [targetId]: score }));
    };

    const handleSubmit = async () => {
        if (Object.keys(scores).length < members.length) {
            message.warning("กรุณาประเมินเพื่อนให้ครบทุกคน");
            return;
        }

        setSubmitting(true);
        try {
        const payload: ISaveEvaluationPeerRequest = {
            appointment_id: appointmentId || 0, 
            scores: Object.entries(scores).map(([targetId, score]) => ({
                target_student_id: Number(targetId),
                criteria_id: 2,
                criteria_level_id: null, 
                score: score
            }))
        };

        await SavePeerEvaluation(payload);
            message.success("บันทึกเรียบร้อย!");
            router.push('/student/evaluation');
        } catch (error) {
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', marginTop: 100}}><Spin size="large"/></div>;

    return (
        <div className="student-page">
            <div className="peer-form-container" style={{padding: '32px 24px'}}>
                
                {/* Header */}
                <div className="peer-header">
                    <button onClick={() => router.back()} className="btn-back" style={{marginBottom: 16, paddingLeft:0}}>
                        <ArrowLeftOutlined /> ย้อนกลับ
                    </button>
                    <div className="page-title-box" style={{marginBottom: 0}}>
                        <h1>ประเมินเพื่อน (Peer Assessment)</h1>
                        <p>หัวข้อ: ความร่วมมือ (Collaboration)</p>
                    </div>
                </div>

                {/* Friends List */}
                {members.length > 0 ? members.map((friend) => (
                    <div key={friend.id} className="friend-card">
                        <div className="friend-info">
                            <div className="friend-avatar">
                                {friend.firstname.charAt(0)}
                            </div>
                            <div>
                                <div style={{fontSize:'1.1rem', fontWeight:700, color:'#333'}}>
                                    {friend.firstname} {friend.lastname}
                                </div>
                                <div style={{color:'#94a3b8', fontSize:'0.9rem'}}>{friend.code}</div>
                            </div>
                        </div>

                        {/* Custom Radio Choice */}
                        <div className="rubric-choices">
                            {rubric.map(r => (
                                <div 
                                    key={r.value} 
                                    className={`rubric-radio ${scores[friend.id] === r.value ? 'selected' : ''}`}
                                    onClick={() => handleScoreChange(friend.id, r.value)}
                                >
                                    <div className="radio-circle"></div>
                                    <span style={{fontWeight: scores[friend.id] === r.value ? 700 : 400}}>
                                        {r.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <Empty description="ไม่พบสมาชิกในกลุ่ม" />
                )}

            </div>

            {/* Sticky Footer */}
            <div className="action-footer">
                <button className="btn-back" onClick={() => router.back()}>ยกเลิก</button>
                <button 
                    className="btn-submit" 
                    onClick={handleSubmit}
                    disabled={submitting || members.length === 0}
                >
                    {submitting ? 'กำลังบันทึก...' : 'ยืนยันการประเมิน'}
                </button>
            </div>
        </div>
    );
}