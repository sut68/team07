"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter ,useSearchParams} from 'next/navigation';
import { message, Spin, Tooltip } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  AppstoreOutlined, 
  UsergroupAddOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Toast_success, Toast_fail } from '../../../../../components/Webmessage';
import { GetEvaluationForm, GetEvaluationResult, SaveEvaluation } from '../../../../../services/evaluation';
import type { IEvaluationFormResponse } from '../../../../../interfaces/Evaluation';
import '../../../../../style/evaluation.css';

export default function EvaluationFormPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const evalTypeFromUrl = searchParams.get('evalType');
    const modeFromUrl = searchParams.get('mode');
    const appointmentId = Number(params.id);

    const [formData, setFormData] = useState<IEvaluationFormResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Stores
    const [groupScores, setGroupScores] = useState<Record<number, any>>({});
    const [indScores, setIndScores] = useState<Record<string, any>>({});
    const [comments, setComments] = useState<Record<number, string>>({});

    const [evalType, setEvalType] = useState<string | null>(null);
    const [showSelector, setShowSelector] = useState(false);
    const [evaluationOptions, setEvaluationOptions] = useState<string[]>([]);
    const resultsLoadedRef = useRef(false);

    const labelMap: Record<string, string> = {
        "Advisor Evaluation": "Advisor Evaluation (ประเมินโดยที่ปรึกษา)",
        "Ethics Test": "Ethics Test (สอบจริยธรรม)",
        "Committee Evaluation": "Committee Evaluation (ประเมินโดยกรรมการ)",
    };

    const loadForm = async (evaluationName?: string) => {
        setLoading(true);
        try {
            const formRes = await GetEvaluationForm(appointmentId, evaluationName, modeFromUrl || undefined);
            setFormData(formRes.data);
            
            const options = formRes.data.available_evaluations ?? [];
            setEvaluationOptions(options);

            const activeEval = formRes.data.current_evaluation || evalTypeFromUrl || evaluationName || options[0] || null;
            setEvalType(activeEval || null);

            const shouldPrompt = !evaluationName && options.length > 1;
            setShowSelector(shouldPrompt);

            if (!resultsLoadedRef.current) {
                try {
                    const resultRes = await GetEvaluationResult(appointmentId);
                    if (resultRes.data) {
                        const oldGroup: Record<number, { score: number; levelId: number | undefined }> = {};
                        const oldComm: Record<number, string> = {};

                        resultRes.data.group_scores?.forEach((s: any) => {
                            oldGroup[s.criteria_id] = { score: s.score, levelId: s.criteria_level_id };
                            if (s.comment) oldComm[s.criteria_id] = s.comment;
                        });

                        const oldInd: Record<string, { score: number; levelId: number | undefined }> = {};
                        resultRes.data.individual_scores?.forEach((s: any) => {
                            const key = `${s.student_id}_${s.criteria_id}`;
                            oldInd[key] = { score: s.score, levelId: s.criteria_level_id };
                        });
                        const shouldPrompt = !activeEval && options.length > 1;

                        setShowSelector(shouldPrompt);
                        setGroupScores(oldGroup);
                        setIndScores(oldInd);
                        setComments(oldComm);
                    }
                    resultsLoadedRef.current = true;
                } catch (e) {
                    // ignore missing result
                }
            }
        } catch (error) {
            message.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    const handleSelectType = async (type: string) => {
        setShowSelector(false);
        await loadForm(type);
    };

    const handleGroupChange = (criteriaId: number, score: number, levelId: number) => {
        setGroupScores(prev => ({ ...prev, [criteriaId]: { score, levelId } }));
    };

    const handleIndChange = (studentId: number, criteriaId: number, score: number, levelId: number) => {
        const key = `${studentId}_${criteriaId}`;
        setIndScores(prev => ({ ...prev, [key]: { score, levelId } }));
    };

    // Apply All Logic
    const handleApplyAll = (criteriaId: number, score: number, levelId: number) => {
        if (!formData) return;
        const newScores = { ...indScores };
        formData.students.forEach((std) => {
            const key = `${std.student_id}_${criteriaId}`;
            newScores[key] = { score, levelId };
        });
        setIndScores(newScores);
        Toast_success("ปรับคะแนนทุกคนเรียบร้อย");
    };

    const handleSubmit = async () => {
        if (!evalType) {
            Toast_fail("กรุณาเลือกประเภทการประเมิน");
            return;
        }
        setSubmitting(true);
        try {
            // Filter only scores that belong to the current evaluation criteria
            const validGroupCriteriaIds = new Set(formData?.group_criteria?.map((c: any) => c.id));
            const validIndCriteriaIds = new Set(formData?.individual_criteria?.map((c: any) => c.id));

            const payload = {
                appointment_id: appointmentId,
                evaluation_name: evalType,
                group_scores: Object.entries(groupScores)
                    .filter(([cid]) => validGroupCriteriaIds.has(Number(cid)))
                    .map(([cid, val]: any) => ({
                        criteria_id: Number(cid),
                        score: val.score,
                        criteria_level_id: val.levelId,
                        comment: comments[Number(cid)] || ""
                    })),
                individual_scores: Object.entries(indScores)
                    .filter(([key]) => {
                        const [, cid] = key.split('_');
                        return validIndCriteriaIds.has(Number(cid));
                    })
                    .map(([key, val]: any) => {
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
            Toast_success("บันทึกสำเร็จ!");
            router.back();
        } catch (error: any) {
            Toast_fail(error?.response?.data?.error || "บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', marginTop: 100}}><Spin size="large" /></div>;

    if (showSelector) {
        return (
            <div className="eval-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <div style={{textAlign: 'center', background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                    <h2 style={{marginBottom: 24}}>เลือกประเภทการประเมิน (Select Evaluation Type)</h2>
                    <div style={{display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap'}}>
                        {evaluationOptions.map((option) => (
                            <button
                                key={option}
                                className="btn-primary"
                                onClick={() => handleSelectType(option)}
                            >
                                {labelMap[option] || option}
                            </button>
                        ))}
                    </div>
                    <button className="btn-back" style={{marginTop: 24}} onClick={() => router.back()}>
                        ยกเลิก
                    </button>
                </div>
            </div>
        );
    }

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
                            <span className="tag-badge">{evalType || formData?.eval_type}</span>
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
                {(formData?.group_criteria?.length || 0) > 0 && (
                    <section>
                        <div className="section-header">
                            <AppstoreOutlined style={{fontSize: 24, color: '#9a0120'}}/>
                            <h2>คะแนนรายกลุ่ม (Group Assessment)</h2>
                        </div>
                        
                        <div className="group-grid">
                            {formData?.group_criteria?.map((cri: any) => {
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
                {(formData?.individual_criteria?.length || 0) > 0 && (
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
                                            {formData?.individual_criteria?.map((cri: any) => (
                                                <th key={cri.id} className="th-criteria">
                                                    <div style={{display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'}}>
                                                        {cri.name}
                                                        <Tooltip title={
                                                            <div style={{textAlign: 'left'}}>
                                                                {cri.levels.map((l: any) => (
                                                                    <div key={l.id}><b>{l.score}</b> : {l.description}</div>
                                                                ))}
                                                            </div>
                                                        }>
                                                            <InfoCircleOutlined style={{color: '#1890ff', cursor: 'pointer'}}/>
                                                        </Tooltip>
                                                    </div>
                                                    <span style={{fontSize: '0.85em', color: '#666'}}>(เต็ม {cri.max_score})</span>
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
                                            {formData?.individual_criteria?.map((cri: any) => (
                                                <td key={cri.id}>
                                                    <div className="score-group" style={{ gap: '8px' }}>
                                                        {cri.levels.map((lvl: any) => (
                                                            <button
                                                                key={lvl.id}
                                                                className="score-btn"
                                                                style={{
                                                                    width: 'auto',
                                                                    height: 'auto',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    lineHeight: '1.2'
                                                                }}
                                                                onClick={() => handleApplyAll(cri.id, lvl.score, lvl.id)}
                                                            >
                                                                <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{lvl.score}</span>
                                                                <span style={{ fontSize: '0.7em', fontWeight: 'normal', marginTop: '2px' }}>{lvl.description}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Students Rows */}
                                        {formData?.students?.map((std: any) => (
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
                                                {formData?.individual_criteria?.map((cri: any) => {
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