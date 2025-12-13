"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Form, Radio, Input, Button, message, Spin, Select, Card, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined,LoginOutlined } from '@ant-design/icons';
import { GetEvaluationForm, GetEvaluationResult, SaveEvaluation } from '../../../../../services/evaluation';
import '../../../../../style/evaluation.css';

const { TextArea } = Input;

export default function EvaluationFormPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = Number(params.id);

    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // State เก็บค่าคะแนน
    const [groupScores, setGroupScores] = useState<Record<number, any>>({});
    const [indScores, setIndScores] = useState<Record<string, any>>({});
    const [comments, setComments] = useState<Record<number, string>>({});

    useEffect(() => {
        const init = async () => {
            try {
                // 1. ดึงโครงสร้างฟอร์ม
                const formRes = await GetEvaluationForm(appointmentId);
                setFormData(formRes.data);

                // 2. ดึงคะแนนเก่า (ถ้ามี)
                try {
                    const resultRes = await GetEvaluationResult(appointmentId);
                    if (resultRes.data) {
                        const oldGroup: any = {};
                        const oldInd: any = {};
                        const oldComm: any = {};

                        resultRes.data.group_scores?.forEach((s: any) => {
                            oldGroup[s.criteria_id] = { score: s.score, levelId: s.criteria_level_id };
                            if (s.comment) oldComm[s.criteria_id] = s.comment;
                        });
                        resultRes.data.individual_scores?.forEach((s: any) => {
                            const key = `${s.student_id}_${s.criteria_id}`;
                            oldInd[key] = { score: s.score, levelId: s.criteria_level_id };
                        });

                        setGroupScores(oldGroup);
                        setIndScores(oldInd);
                        setComments(oldComm);
                    }
                } catch (e) { /* ยังไม่เคยประเมิน */ }

            } catch (error) {
                message.error("ไม่สามารถโหลดข้อมูลได้");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [appointmentId]);

    // Handle Group Score
    const handleGroupChange = (criteriaId: number, score: number, levelId: number) => {
        setGroupScores(prev => ({ ...prev, [criteriaId]: { score, levelId } }));
    };

    // Handle Individual Score
    const handleIndChange = (studentId: number, criteriaId: number, score: number, levelId: number) => {
        const key = `${studentId}_${criteriaId}`;
        setIndScores(prev => ({ ...prev, [key]: { score, levelId } }));
    };

    // 🔥 Killer Feature: Apply All (ให้คะแนนทุกคนในคอลัมน์)
    const handleApplyAll = (criteriaId: number, score: number, levelId: number) => {
        const newIndScores = { ...indScores };
        formData.students.forEach((std: any) => {
            const key = `${std.student_id}_${criteriaId}`;
            newIndScores[key] = { score, levelId };
        });
        setIndScores(newIndScores);
        message.success("ปรับคะแนนทุกคนเรียบร้อย");
    };

    // Submit
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
            message.success("บันทึกผลการประเมินเรียบร้อย!");
            router.back();
        } catch (error) {
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><Spin size="large" /></div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 animate-fade-in bg-gray-50 min-h-screen">
            
            {/* --- Header --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="formHeader">
                    <div className="flex justify-between items-start">
                        <div>
                            <Button 
                                type="text" 
                                icon={<ArrowLeftOutlined />} 
                                className="text-white/80 hover:text-white mb-2 pl-0"
                                onClick={() => router.back()}
                            >
                                ย้อนกลับ
                            </Button>
                            <h1 className="text-3xl font-bold m-0">{formData?.project_name}</h1>
                            <div className="mt-3 flex gap-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                    {formData?.eval_type}
                                </span>
                            </div>
                        </div>
                        <Button 
                            size="large" 
                            type="primary"
                            icon={<SaveOutlined />} 
                            className="bg-white text-[#9a0120] font-bold border-none hover:bg-gray-100 shadow-lg"
                            onClick={handleSubmit}
                            loading={submitting}
                        >
                            บันทึกการประเมิน
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                
                {/* --- 1. Group Assessment --- */}
                {formData?.group_criteria?.length > 0 && (
                    <section>
                        <h2 className="sectionTitle">1. คะแนนรายกลุ่ม (Group Assessment)</h2>
                        <div className="grid gap-6">
                            {formData.group_criteria.map((cri: any) => (
                                <Card key={cri.id} className="shadow-sm border-l-4 border-l-[#9a0120]" title={`${cri.name} (เต็ม ${cri.max_score})`}>
                                    <div className="rubricBox">
                                        <Radio.Group 
                                            onChange={(e) => handleGroupChange(cri.id, e.target.value.score, e.target.value.id)}
                                            value={groupScores[cri.id] ? { score: groupScores[cri.id].score, id: groupScores[cri.id].levelId } : undefined}
                                            className="w-full"
                                        >
                                            <div className="flex flex-col gap-3 w-full">
                                                {cri.levels.map((lvl: any) => (
                                                    <Radio key={lvl.id} value={{ score: lvl.score, id: lvl.id }} className="rubricOption">
                                                        <span>{lvl.description}</span>
                                                        <span className="font-bold text-[#9a0120]">{lvl.score}</span>
                                                    </Radio>
                                                ))}
                                            </div>
                                        </Radio.Group>
                                    </div>
                                    <TextArea 
                                        rows={2} 
                                        placeholder="ความคิดเห็นเพิ่มเติม..." 
                                        value={comments[cri.id] || ""}
                                        onChange={(e) => setComments(prev => ({...prev, [cri.id]: e.target.value}))}
                                        className="bg-gray-50 border-gray-200"
                                    />
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- 2. Individual Assessment --- */}
                {formData?.individual_criteria?.length > 0 && (
                    <section>
                        <h2 className="sectionTitle">2. คะแนนรายบุคคล (Individual Assessment)</h2>
                        <div className="scoreTableContainer">
                            <table className="scoreTable">
                                <thead>
                                    <tr>
                                        <th className="w-64 sticky left-0 z-10 shadow-r">รายชื่อนักศึกษา</th>
                                        {formData.individual_criteria.map((cri: any) => (
                                            <th key={cri.id} className="min-w-[250px]">
                                                {cri.name} <span className="text-gray-400 font-normal block text-xs">(เต็ม {cri.max_score})</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Master Row (Apply All) */}
                                    <tr className="masterRow">
                                        <td className="sticky left-0 z-10 bg-[#fff7ed] shadow-r border-b-2 border-orange-200">
                                            <div className="masterLabel">
                                                <LoginOutlined /> ให้คะแนนทุกคน
                                            </div>
                                        </td>
                                        {formData.individual_criteria.map((cri: any) => (
                                            <td key={cri.id}>
                                                <Select
                                                    placeholder="เลือกเพื่อใส่ทุกคน..."
                                                    className="w-full"
                                                    onChange={(val: any) => {
                                                        const obj = JSON.parse(val);
                                                        handleApplyAll(cri.id, obj.score, obj.id);
                                                    }}
                                                >
                                                    {cri.levels.map((lvl: any) => (
                                                        <Select.Option key={lvl.id} value={JSON.stringify({score: lvl.score, id: lvl.id})}>
                                                            <span className="font-bold text-orange-600 mr-2">{lvl.score}</span> 
                                                            {lvl.description.split('(')[0]}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Students Rows */}
                                    {formData.students.map((std: any) => (
                                        <tr key={std.student_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="sticky left-0 bg-white shadow-r z-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                                                        <UserOutlined />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-700">{std.name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{std.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {formData.individual_criteria.map((cri: any) => {
                                                const key = `${std.student_id}_${cri.id}`;
                                                const currentVal = indScores[key];
                                                return (
                                                    <td key={cri.id}>
                                                        <div className="flex flex-col gap-2">
                                                            {cri.levels.map((lvl: any) => (
                                                                <div 
                                                                    key={lvl.id}
                                                                    onClick={() => handleIndChange(std.student_id, cri.id, lvl.score, lvl.id)}
                                                                    className={`
                                                                        cursor-pointer px-3 py-2 rounded-lg border text-sm transition-all flex justify-between items-center
                                                                        ${currentVal?.levelId === lvl.id 
                                                                            ? 'bg-[#9a0120] text-white border-[#9a0120] shadow-md transform scale-[1.02]' 
                                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#9a0120] hover:text-[#9a0120]'}
                                                                    `}
                                                                >
                                                                    <span>{lvl.description.split(' ')[0]}</span>
                                                                    <span className="font-bold text-lg">{lvl.score}</span>
                                                                </div>
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
                    </section>
                )}
            </div>
        </div>
    );
}