"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Toast_success, Toast_fail } from '../../../../components/Webmessage';
import { SavePeerEvaluation ,GetStudentEvaluationForm } from '../../../../services/evaluation';
import { GetMe } from '../../../../services/login';
import type { ISaveEvaluationPeerRequest } from '../../../../interfaces/Evaluation';
import '../../../../style/evaluation.css';

export default function PeerEvaluationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [appointmentId, setAppointmentId] = useState<number | null>(null);
    // Key: studentId_criteriaId, Value: { score, levelId }
    const [scores, setScores] = useState<Record<string, { score: number, levelId?: number }>>({});
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

                    if (res.data.individual_criteria) {
                        setCriteria(res.data.individual_criteria);
                    }

                    if (res.data.appointment_id) {
                        setAppointmentId(res.data.appointment_id);
                    }

                    if (res.data.existing_scores) {
                        // Assuming existing_scores keys are "studentId_criteriaId"
                        const loadedScores: Record<string, { score: number, levelId?: number }> = {};
                        Object.entries(res.data.existing_scores).forEach(([key, value]) => {
                             loadedScores[key] = { score: Number(value) };
                        });
                        setScores(loadedScores);
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


    const handleScoreChange = (studentId: number, criteriaId: number, score: number, levelId?: number) => {
        const key = `${studentId}_${criteriaId}`;
        setScores(prev => ({ ...prev, [key]: { score, levelId } }));
    };

    const handleSubmit = async () => {
        // Validate: All students must be evaluated on all criteria
        const totalRequired = members.length * criteria.length;
        const currentFilled = Object.keys(scores).length;

        if (currentFilled < totalRequired) {
            message.warning(`กรุณาประเมินให้ครบทุกข้อ (${currentFilled}/${totalRequired})`);
            return;
        }

        setSubmitting(true);
        try {
            const payload: ISaveEvaluationPeerRequest = {
                appointment_id: appointmentId || 0, 
                scores: Object.entries(scores).map(([key, val]) => {
                    const [sid, cid] = key.split('_');
                    return {
                        target_student_id: Number(sid),
                        criteria_id: Number(cid),
                        criteria_level_id: val.levelId || null, 
                        score: val.score
                    };
                })
            };

            await SavePeerEvaluation(payload);
            Toast_success("บันทึกเรียบร้อย!");
            router.push('/student/exam');
        } catch (error: any) {
            Toast_fail(error?.response?.data?.error || "บันทึกไม่สำเร็จ");
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
                        <p>โปรดให้คะแนนเพื่อนร่วมทีมตามความเป็นจริง</p>
                    </div>
                </div>

                {/* Friends List */}
                {members.length > 0 ? members.map((friend) => (
                    <div key={friend.id} className="friend-card" style={{marginBottom: 32}}>
                        <div className="friend-info" style={{marginBottom: 16}}>
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

                        {/* Criteria Loop */}
                        {criteria.map((c) => {
                            const key = `${friend.id}_${c.id}`;
                            const currentVal = scores[key]?.score;

                            return (
                                <div key={c.id} style={{marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0'}}>
                                    <p style={{fontWeight: 600, marginBottom: 12}}>{c.name} ({c.max_score} คะแนน)</p>
                                    <div className="rubric-choices">
                                        {c.levels && c.levels.length > 0 ? (
                                            c.levels.map((lvl: any) => (
                                                <div 
                                                    key={lvl.id} 
                                                    className={`rubric-radio ${currentVal === lvl.score ? 'selected' : ''}`}
                                                    onClick={() => handleScoreChange(friend.id, c.id, lvl.score, lvl.id)}
                                                >
                                                    <div className="radio-circle"></div>
                                                    <span style={{fontWeight: currentVal === lvl.score ? 700 : 400}}>
                                                        {lvl.description} ({lvl.score})
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p>No criteria levels found.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )) : (
                    <Empty description="ไม่พบการนัดหมายประเมิน" />
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