"use client";
import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, BellOutlined } from '@ant-design/icons';
import { GetMyProjectAndAppointment } from '../../../services/appointment';
import '../../../style/appointment.css';

export default function StudentAppointmentPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await GetMyProjectAndAppointment();
                if (res.status === 200) {
                    setData(res.data);
                }
            } catch (error) {
                console.error("Error fetching appointment:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointment();
    }, []);

    if (loading) {
    return (
        <div className="flex justify-center items-center h-[60vh]">
            <Spin spinning={true} tip="กำลังโหลดข้อมูล..." size="large">
                <div className="h-0" />
            </Spin>
        </div>
    );
}

    const apt = data?.appointment;

    return (
        // ใช้ Tailwind จัด Layout ภายนอก (Container, Padding)
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
            
            {/* Title Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 border-l-8 border-[#8A011D] pl-4">
                    การนัดหมาย (Appointment)
                </h1>
                <p className="text-gray-500 mt-2 pl-6">
                    ตรวจสอบวัน เวลา และสถานที่สอบโครงงานของคุณ
                </p>
            </div>

            {apt ? (
                // --- กรณีมีนัดหมาย (Render Card) ---
                <div className="cardContainer">
                    {/* Header */}
                    <div className="header">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="headerTitle">{apt.type}</h2>
                                <p className="headerSubtitle">
                                    กลุ่มที่ {data?.group_number}: {data?.project_name || "โครงงานคอมพิวเตอร์"}
                                </p>
                            </div>
                            <div className="statusBadge">
                                <BellOutlined /> ยืนยันแล้ว (Confirmed)
                            </div>
                        </div>
                    </div>

                    {/* Content Body (ใช้ Tailwind Grid) */}
                    <div className="content">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            
                            {/* 1. วันที่ */}
                            <div className="flex items-start gap-4">
                                <div className="bg-red-50 p-3 rounded-full text-[#8A011D]">
                                    <CalendarOutlined style={{ fontSize: '28px' }} />
                                </div>
                                <div>
                                    <div className="label">วันที่สอบ</div>
                                    <div className="value">
                                        {new Date(apt.date_time).toLocaleDateString('th-TH', { 
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 2. เวลา */}
                            <div className="flex items-start gap-4">
                                <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                                    <ClockCircleOutlined style={{ fontSize: '28px' }} />
                                </div>
                                <div>
                                    <div className="label">เวลา</div>
                                    <div className="valueHighlight">
                                        {new Date(apt.date_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                    </div>
                                    <div className="text-sm text-gray-400">ระยะเวลาสอบประมาณ 30 นาที</div>
                                </div>
                            </div>

                            {/* 3. สถานที่ */}
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                    <EnvironmentOutlined style={{ fontSize: '28px' }} />
                                </div>
                                <div>
                                    <div className="label">สถานที่ / ห้องสอบ</div>
                                    <div className="value">{apt.room}</div>
                                    <div className="text-sm text-gray-500">{apt.location}</div>
                                </div>
                            </div>
                        </div>

                        <div className="divider"></div>

                        {/* Footer Info */}
                        <div className="flex flex-col md:flex-row justify-between text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                            <span>อาจารย์ที่ปรึกษา: <b>{data?.advisor_name}</b></span>
                            <span className="mt-2 md:mt-0 text-red-600">
                                * กรุณามาก่อนเวลาสอบอย่างน้อย 15 นาที และแต่งกายชุดนักศึกษาให้เรียบร้อย
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                // --- กรณีไม่มีนัดหมาย (Empty State) ---
                <div className="emptyState">
                    <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }} />
                    <h3 className="text-xl font-bold text-[#8A011D] mb-2">ยังไม่มีกำหนดการสอบ</h3>
                    <p className="text-gray-600">
                        อาจารย์ที่ปรึกษายังไม่ได้ทำการนัดหมาย หรือยังไม่ถึงช่วงเวลาการสอบ <br/>
                        กรุณาติดตามประกาศจากอาจารย์อีกครั้ง
                    </p>
                </div>
            )}
        </div>
    );
}