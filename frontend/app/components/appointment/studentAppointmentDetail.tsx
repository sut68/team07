"use client";

import { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, BellOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { GetMyProjectAndAppointment } from '../../services/appointment';
import type { IStudentAppointmentOverview, IStudentAppointmentSlot } from '../../interfaces/Appointment';
import '../../style/appointment.css';

interface StudentAppointmentDetailProps {
    variant?: 'standalone' | 'embedded';
    title?: string;
    subTitle?: string;
    showHeader?: boolean;
}

const DEFAULT_TITLE = 'การนัดหมาย (Appointment)';
const DEFAULT_SUBTITLE = 'ตรวจสอบวัน เวลา และสถานที่สอบโครงงานของคุณ';

export default function StudentAppointmentDetail({
    variant = 'standalone',
    title = DEFAULT_TITLE,
    subTitle = DEFAULT_SUBTITLE,
    showHeader = true,
}: StudentAppointmentDetailProps) {
    const [overview, setOverview] = useState<IStudentAppointmentOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await GetMyProjectAndAppointment();
                if (res.status === 200) {
                    setOverview(res.data as IStudentAppointmentOverview);
                }
            } catch (error) {
                console.error('Error fetching appointment:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, []);

    const appointment: IStudentAppointmentSlot | null = useMemo(() => {
        if (!overview) {
            return null;
        }
        if (overview.appointment) {
            return overview.appointment;
        }
        if (overview.appointments && overview.appointments.length > 0) {
            return overview.appointments[0];
        }
        return null;
    }, [overview]);

    const renderLoading = () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: variant === 'standalone' ? 100 : 40,
            }}
        >
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="empty-state-card">
            <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5, color: '#9a0120' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#333', marginBottom: 8 }}>ยังไม่มีกำหนดการสอบ</h3>
            <p style={{ color: '#666' }}>
                อาจารย์ที่ปรึกษายังไม่ได้ทำการนัดหมาย หรือยังไม่ถึงช่วงเวลาการสอบ <br />
                กรุณาติดตามประกาศจากอาจารย์อีกครั้ง
            </p>
        </div>
    );

    const renderAppointmentCard = (apt: IStudentAppointmentSlot) => (
        <div className="student-appt-card">
            <div className="appt-header">
                <div className="appt-info">
                    <h2>{apt.type}</h2>
                    <p>
                        กลุ่มที่ {overview?.group_number}: {overview?.project_name || 'โครงงานคอมพิวเตอร์'}
                    </p>
                </div>
                <div className="status-badge">
                    <BellOutlined /> ยืนยันแล้ว
                </div>
            </div>

            <div className="appt-body">
                <div className="detail-grid">
                    <div className="detail-item">
                        <div className="icon-circle icon-date">
                            <CalendarOutlined />
                        </div>
                        <div className="detail-text">
                            <div className="label">วันที่สอบ</div>
                            <div className="value">
                                {dayjs(apt.date_time).locale('th').format('ddddที่ D MMMM YYYY')}
                            </div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="icon-circle icon-time">
                            <ClockCircleOutlined />
                        </div>
                        <div className="detail-text">
                            <div className="label">เวลา</div>
                            <div className="value">{dayjs(apt.date_time).format('HH:mm')} น.</div>
                            <div className="sub-value">ระยะเวลาประมาณ 30 นาที</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="icon-circle icon-loc">
                            <EnvironmentOutlined />
                        </div>
                        <div className="detail-text">
                            <div className="label">ห้องสอบ</div>
                            <div className="value">{apt.room}</div>
                            <div className="sub-value">{apt.location}</div>
                        </div>
                    </div>

                    {apt.evaluation_name && (
                        <div className="detail-item">
                            <div className="icon-circle" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                                <FileTextOutlined />
                            </div>
                            <div className="detail-text">
                                <div className="label">ประเภทการประเมิน</div>
                                <div className="value">{apt.evaluation_name}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="appt-footer">
                    <div>
                        <span style={{ color: '#64748b' }}>อาจารย์ที่ปรึกษา: </span>
                        <strong>{overview?.advisor_name}</strong>
                    </div>
                    <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>
                        * กรุณามาก่อนเวลาสอบอย่างน้อย 15 นาที และแต่งกายชุดนักศึกษาให้เรียบร้อย
                    </div>
                </div>
            </div>
        </div>
    );

    const content = loading ? renderLoading() : appointment ? renderAppointmentCard(appointment) : renderEmptyState();

    if (variant === 'standalone') {
        return (
            <div className="student-page">
                <div className="student-container animate-fade-in">
                    {showHeader && (
                        <div className="page-title-box">
                            <h1>{title}</h1>
                            <p>{subTitle}</p>
                        </div>
                    )}
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {showHeader && (
                <div className="page-title-box" style={{ marginBottom: 0 }}>
                    <h1>{title}</h1>
                    <p>{subTitle}</p>
                </div>
            )}
            {content}
        </div>
    );
}
