"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Card, Divider, Button, Statistic } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { GetEvaluationSummary } from '../../../../../services/evaluation';
import '../../../../../style/evaluation.css';

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

    if (loading) return <div className="p-20 text-center"><Spin size="large" /></div>;

    return (
        <div className="w-full max-w-4xl mx-auto p-6 animate-fade-in">
            <Button onClick={() => router.back()} icon={<ArrowLeftOutlined />} className="mb-4">ย้อนกลับ</Button>
            
            <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 สรุปผลการประเมิน</h1>

            {/* Score Overview */}
            <div className="summaryCard">
                <div className="flex flex-col items-center">
                    <div className="bg-yellow-100 p-4 rounded-full text-yellow-600 mb-4">
                        <TrophyOutlined style={{ fontSize: 40 }} />
                    </div>
                    <h2 className="text-gray-500 text-lg mb-2">คะแนนกลุ่มเฉลี่ย (Group Total)</h2>
                    <div className="bigScore">{data.group_total_score}</div>
                    <p className="text-gray-400 mt-2">จากกรรมการ {data.group_details[0]?.teacher_count || 0} ท่าน</p>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 border-l-4 border-[#9a0120] pl-3">รายละเอียดคะแนนรายบุคคล</h3>
                <div className="grid gap-4">
                    {data.individual_details.map((std: any) => (
                        <Card key={std.student_id} className="shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                                        {std.student_name.charAt(0)}
                                    </div>
                                    <h4 className="text-lg font-bold m-0">{std.student_name}</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-gray-500 block">คะแนนสุทธิ (Total)</span>
                                    <span className="text-2xl font-bold text-[#9a0120]">{std.grand_total}</span>
                                </div>
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {std.scores.map((s: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">{s.evaluation_name}</p>
                                        <p className="font-bold text-gray-700">{s.average_score}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}