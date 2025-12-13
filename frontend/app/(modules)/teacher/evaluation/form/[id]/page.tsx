"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  AppstoreOutlined, 
  UsergroupAddOutlined 
} from '@ant-design/icons';
import { GetEvaluationForm, GetEvaluationResult, SaveEvaluation } from '../../../../../services/evaluation';
import '../../../../../style/evaluation.css';

export default function EvaluationFormPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = Number(params.id);

    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Stores
    const [groupScores, setGroupScores] = useState<Record<number, any>>({});
    const [indScores, setIndScores] = useState<Record<string, any>>({});
    const [comments, setComments] = useState<Record<number, string>>({});

    useEffect(() => {
        const init = async () => {
            try {
                const formRes = await GetEvaluationForm(appointmentId);
                setFormData(formRes.data);

                try {
                    const resultRes = await GetEvaluationResult(appointmentId);
                    if (resultRes.data) {
                        const oldGroup: any = {};
                        const oldComm: any = {};
                        resultRes.data.group_scores?.forEach((s: any) => {
                            oldGroup[s.criteria_id] = { score: s.score, levelId: s.criteria_level_id };
                            if (s.comment) oldComm[s.criteria_id] = s.comment;
                        });
                        
                        const oldInd: any = {};
                        resultRes.data.individual_scores?.forEach((s: any) => {
                            const key = `${s.student_id}_${s.criteria_id}`;
                            oldInd[key] = { score: s.score, levelId: s.criteria_level_id };
                        });

                        setGroupScores(oldGroup);
                        setIndScores(oldInd);
                        setComments(oldComm);
                    }
                } catch (e) { /* No Data */ }

            } catch (error) {
                message.error("โหลดข้อมูลไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [appointmentId]);

    const handleGroupChange = (criteriaId: number, score: number, levelId: number) => {
        setGroupScores(prev => ({ ...prev, [criteriaId]: { score, levelId } }));
    };

    const handleIndChange = (studentId: number, criteriaId: number, score: number, levelId: number) => {
        const key = `${studentId}_${criteriaId}`;
        setIndScores(prev => ({ ...prev, [key]: { score, levelId } }));
    };

    // Apply All Logic
    const handleApplyAll = (criteriaId: number, score: number, levelId: number) => {
        const newScores = { ...indScores };
        formData.students.forEach((std: any) => {
            const key = `${std.student_id}_${criteriaId}`;
            newScores[key] = { score, levelId };
        });
        setIndScores(newScores);
        message.success("ปรับคะแนนทุกคนเรียบร้อย");
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                appointment_id: appointmentId,
                group_scores: Object.entries(groupScores).map(([cid, val]: any) => ({
                    criteria_id: Number(cid),
                    score: val.score,
                    criteria_level_id: val.levelId,
                    comment: comments[Number(cid)] || ""
                })),
                individual_scores: Object.entries(indScores).map(([key, val]: any) => {
                    const [sid, cid] = key.split('_');
                    return {
                        student_id: Number(sid),
                        criteria_id: Number(cid),
                        score: val.score,
                        criteria_level_id: val.levelId
                    };
                })
            };

            await SaveEvaluation(payload);
            message.success("บันทึกสำเร็จ!");
            router.back();
        } catch (error) {
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', marginTop: 100}}><Spin size="large" /></div>;

    return (
        <div className="eval-page">
            
            {/* 1. STICKY HEADER */}
            <header className="action-bar">
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <button className="btn-back" onClick={() => router.back()}>
                        <ArrowLeftOutlined />
                    </button>
                    <div className="project-title">
                        <h1>{formData?.project_name}</h1>
                        <div className="project-meta">
                            <span className="tag-badge">{formData?.eval_type}</span>
                            <span>• สมาชิก {formData?.students?.length || 0} คน</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    className="btn-primary" 
                    onClick={handleSubmit} 
                    disabled={submitting}
                >
                    {submitting ? <Spin size="small"/> : <SaveOutlined />}
                    บันทึกผลการประเมิน
                </button>
            </header>

            <div className="eval-container">

                {/* 2. GROUP ASSESSMENT */}
                {formData?.group_criteria?.length > 0 && (
                    <section>
                        <div className="section-header">
                            <AppstoreOutlined style={{fontSize: 24, color: '#9a0120'}}/>
                            <h2>คะแนนรายกลุ่ม (Group Assessment)</h2>
                        </div>
                        
                        <div className="group-grid">
                            {formData.group_criteria.map((cri: any) => {
                                const current = groupScores[cri.id];
                                return (
                                    <div key={cri.id} className="criteria-card">
                                        <div className="card-top">
                                            <span>{cri.name}</span>
                                            <span className="score-pill">เต็ม {cri.max_score}</span>
                                        </div>

                                        <div className="rubric-list">
                                            {cri.levels.map((lvl: any) => (
                                                <div 
                                                    key={lvl.id} 
                                                    className={`rubric-item ${current?.levelId === lvl.id ? 'active' : ''}`}
                                                    onClick={() => handleGroupChange(cri.id, lvl.score, lvl.id)}
                                                >
                                                    <span>{lvl.description}</span>
                                                    <span>{lvl.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <textarea 
                                            className="comment-box"
                                            rows={2}
                                            placeholder="ความคิดเห็นเพิ่มเติม..."
                                            value={comments[cri.id] || ""}
                                            onChange={(e) => setComments(prev => ({...prev, [cri.id]: e.target.value}))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 3. INDIVIDUAL ASSESSMENT (MATRIX) */}
                {formData?.individual_criteria?.length > 0 && (
                    <section>
                         <div className="section-header">
                            <UsergroupAddOutlined style={{fontSize: 24, color: '#9a0120'}}/>
                            <h2>คะแนนรายบุคคล (Individual Assessment)</h2>
                        </div>

                        <div className="matrix-container">
                            <div className="matrix-scroll-wrapper">
                                <table className="eval-table">
                                    <thead>
                                        <tr>
                                            <th className="col-student">รายชื่อนักศึกษา</th>
                                            {formData.individual_criteria.map((cri: any) => (
                                                <th key={cri.id} className="th-criteria">
                                                    {cri.name}
                                                    <span>(เต็ม {cri.max_score})</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Master Row */}
                                        <tr className="row-master">
                                            <td className="col-student">
                                                <span>⚡ ให้คะแนนทุกคน (Apply All)</span>
                                            </td>
                                            {formData.individual_criteria.map((cri: any) => (
                                                <td key={cri.id}>
                                                    <div className="score-group">
                                                        {cri.levels.map((lvl: any) => (
                                                            <button
                                                                key={lvl.id}
                                                                className="score-btn"
                                                                title={`ให้ ${lvl.score} ทุกคน`}
                                                                onClick={() => handleApplyAll(cri.id, lvl.score, lvl.id)}
                                                            >
                                                                {lvl.score}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Students Rows */}
                                        {formData.students.map((std: any) => (
                                            <tr key={std.student_id}>
                                                <td className="col-student">
                                                    <div className="student-profile">
                                                        <div className="avatar">{std.name.charAt(0)}</div>
                                                        <div>
                                                            <span className="std-name">{std.name}</span>
                                                            <span className="std-code">{std.code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {formData.individual_criteria.map((cri: any) => {
                                                    const key = `${std.student_id}_${cri.id}`;
                                                    const current = indScores[key];
                                                    
                                                    return (
                                                        <td key={cri.id}>
                                                            <div className="score-group">
                                                                {cri.levels.map((lvl: any) => (
                                                                    <button
                                                                        key={lvl.id}
                                                                        className={`score-btn ${current?.levelId === lvl.id ? 'active' : ''}`}
                                                                        onClick={() => handleIndChange(std.student_id, cri.id, lvl.score, lvl.id)}
                                                                        title={lvl.description}
                                                                    >
                                                                        {lvl.score}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}