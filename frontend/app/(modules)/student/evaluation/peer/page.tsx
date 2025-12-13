"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SavePeerEvaluation } from '../../../../services/evaluation';
import { GetMyProjectAndAppointment } from '../../../../services/appointment';
import type { ISaveEvaluationPeerRequest } from '../../../../interfaces/Evaluation';
import '../../../../style/evaluation.css';

// Mock เกณฑ์คะแนน (Rubric)
const rubric = [
    { value: 5, label: "5 - สม่ำเสมอ (Always)" },
    { value: 4, label: "4 - บ่อยครั้ง (Often)" },
    { value: 3, label: "3 - บางครั้ง (Sometimes)" },
    { value: 1, label: "1 - น้อยมาก (Rarely)" },
];

export default function PeerEvaluationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]); // เก็บเพื่อนในกลุ่ม
    const [appointmentId, setAppointmentId] = useState<number | null>(null);
    const [scores, setScores] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [myId, setMyId] = useState<number>(0); // สมมติว่าเก็บ ID ตัวเองเพื่อไม่ให้ประเมินตัวเอง

    // 1. โหลดข้อมูลกลุ่ม เพื่อเอาเพื่อนและ Appointment ID
    useEffect(() => {
        const initData = async () => {
            try {
                // เรียก API ดึงข้อมูลกลุ่ม
                const res = await GetMyProjectAndAppointment();
                if (res.status === 200 && res.data) {
                    // TODO: Backend ต้องส่งสมาชิกในกลุ่มมาให้ด้วย หรือต้องยิง API แยก getGroupMembers
                    // ในที่นี้สมมติว่า res.data.members มีข้อมูลเพื่อน หรือใช้ Mock ไปก่อนถ้ายิงไม่ได้
                    
                    // --- MOCK MEMBERS (เพราะ API GetMyProject.. ปัจจุบันอาจยังไม่ส่ง members list) ---
                    // คุณต้องปรับ Backend หรือ Service ให้ส่ง members array มาด้วยนะครับ
                    const mockMembers = [
                        { id: 8, firstname: "สมชาย", lastname: "ใจดี", code: "B6600001" },
                        { id: 9, firstname: "สมหญิง", lastname: "รักเรียน", code: "B6600002" }
                    ];
                    setMembers(mockMembers);
                    
                    // สมมติว่านัดหมายล่าสุดคืออันที่จะประเมิน
                    if(res.data.appointment) {
                        // appointment id อาจจะต้องดึงมาจาก field อื่น ถ้า API ส่งมาไม่ครบ
                        // ในที่นี้ Hardcode 1 ไว้ก่อนเพื่อทดสอบการบันทึก
                        setAppointmentId(1); 
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
        // Validation
        if (Object.keys(scores).length < members.length) {
            message.warning("กรุณาประเมินเพื่อนให้ครบทุกคน");
            return;
        }
        if (!appointmentId) {
            message.error("ไม่พบข้อมูลนัดหมาย ไม่สามารถบันทึกได้");
            return;
        }

        setSubmitting(true);
        try {
            // เตรียม Payload ตาม Interface
            const payload: ISaveEvaluationPeerRequest = {
                appointment_id: appointmentId,
                scores: Object.entries(scores).map(([targetId, score]) => ({
                    target_student_id: Number(targetId),
                    criteria_id: 2, // ID ของ Collaboration (Fix ตาม DB)
                    criteria_level_id: null, 
                    score: score
                }))
            };

            await SavePeerEvaluation(payload);
            message.success("บันทึกผลการประเมินเรียบร้อย!");
            router.push('/student/evaluation');
        } catch (error) {
            console.error(error);
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spin size="large"/></div>;

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-8 animate-fade-in">
            <button 
                onClick={() => router.back()} 
                className="mb-4 text-gray-500 hover:text-[#9a0120] flex items-center gap-2 transition-colors"
            >
                <ArrowLeftOutlined /> ย้อนกลับ
            </button>

            <div className="container">
                {/* Header Form */}
                <div className="header">
                    <h1 className="text-xl font-bold m-0">📝 แบบฟอร์มประเมินเพื่อน (Peer Assessment)</h1>
                    <p className="opacity-80 text-sm mt-1">หัวข้อ: ความร่วมมือ (Collaboration)</p>
                </div>

                {/* List Friends */}
                <div className="bg-white">
                    {members.length > 0 ? members.map((friend) => (
                        <div key={friend.id} className="friendRow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="avatar">
                                    {friend.firstname.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-gray-800">
                                        {friend.firstname} {friend.lastname}
                                    </div>
                                    <div className="text-sm text-gray-400 font-mono">
                                        {friend.code}
                                    </div>
                                </div>
                            </div>

                            {/* Rubric Choices */}
                            <div className="pl-0 md:pl-16">
                                <Radio.Group 
                                    onChange={(e) => handleScoreChange(friend.id, e.target.value)} 
                                    value={scores[friend.id]}
                                    className="w-full flex flex-col gap-2"
                                >
                                    {rubric.map(r => (
                                        <Radio key={r.value} value={r.value} className="radioLabel">
                                            <span className="font-bold text-[#9a0120] mr-2">{r.value}</span> 
                                            {r.label.split('-')[1]}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10"><Empty description="ไม่พบสมาชิกในกลุ่ม" /></div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button className="text-gray-500 hover:bg-gray-200 px-4 py-2 rounded-lg" onClick={() => router.back()}>
                        ยกเลิก
                    </button>
                    <button 
                        className="submitBtn"
                        onClick={handleSubmit}
                        disabled={submitting || members.length === 0}
                    >
                        {submitting ? 'กำลังบันทึก...' : 'ยืนยันการประเมิน'}
                    </button>
                </div>
            </div>
        </div>
    );
}