"use client";

import { useEffect, useMemo, useState, KeyboardEvent } from 'react';
import { Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, BellOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import type { IStudentAppointmentOverview, IStudentAppointmentSlot } from '../../interfaces/Appointment';
import { GetMyProjectAndAppointment } from '../../services/appointment';

interface StudentAppointmentCarouselProps {
    title?: string;
    description?: string;
    interactive?: boolean;
    onCardAction?: (appointmentId: number) => void;
    footerHint?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
    loadingHeight?: number;
}

const defaultFooterHint = 'คลิกเพื่อดูรายละเอียดและการประเมิน';

export default function StudentAppointmentCarousel({
    title = 'การนัดหมายสอบของฉัน',
    description = 'ติดตามกำหนดการสอบและเตรียมตัวให้พร้อม',
    interactive = false,
    onCardAction,
    footerHint = defaultFooterHint,
    emptyTitle = 'ยังไม่มีการนัดหมายสอบ',
    emptyDescription = 'หากมีการนัดหมายสอบ ระบบจะแสดงรายละเอียดให้คุณที่นี่',
    emptyActionLabel,
    onEmptyAction,
    loadingHeight = 240,
}: StudentAppointmentCarouselProps) {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<IStudentAppointmentOverview | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await GetMyProjectAndAppointment();
                if (res.status === 200) {
                    setOverview(res.data as IStudentAppointmentOverview);
                }
            } catch (error) {
                console.error('Error fetching student appointments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const appointments = useMemo(() => {
        if (overview?.appointments && overview.appointments.length > 0) {
            return overview.appointments;
        }
        if (overview?.appointment) {
            return [overview.appointment];
        }
        return [];
    }, [overview]);

    const advisorName = overview?.advisor_name || '-';
    const projectName = overview?.project_name || 'โครงงานของฉัน';
    const groupNumber = overview?.group_number ?? '-';

    const handleCardKey = (event: KeyboardEvent<HTMLDivElement>, appointmentId: number) => {
        if (!interactive || !onCardAction) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCardAction(appointmentId);
        }
    };

    const renderCard = (item: IStudentAppointmentSlot) => {
        const isClickable = interactive && Boolean(onCardAction);
        return (
            <div
                key={item.id}
                className="student-appt-card"
                style={{
                    flex: '0 0 320px',
                    maxWidth: 340,
                    minHeight: 260,
                    cursor: isClickable ? 'pointer' : 'default',
                }}
                role={isClickable ? 'button' : 'group'}
                tabIndex={isClickable ? 0 : -1}
                onClick={() => {
                    if (isClickable && onCardAction) {
                        onCardAction(item.id);
                    }
                }}
                onKeyDown={(event) => handleCardKey(event, item.id)}
            >
                <div className="appt-header">
                    <div className="appt-info">
                        <h2>{item.type}</h2>
                        <p>
                            กลุ่มที่ {groupNumber}: {projectName}
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
                                    {dayjs(item.date_time).locale('th').format('ddddที่ D MMMM YYYY')}
                                </div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="icon-circle icon-time">
                                <ClockCircleOutlined />
                            </div>
                            <div className="detail-text">
                                <div className="label">เวลา</div>
                                <div className="value">{dayjs(item.date_time).format('HH:mm')} น.</div>
                                <div className="sub-value">โปรดมาก่อนเวลาอย่างน้อย 15 นาที</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="icon-circle icon-loc">
                                <EnvironmentOutlined />
                            </div>
                            <div className="detail-text">
                                <div className="label">สถานที่</div>
                                <div className="value">{item.room}</div>
                                <div className="sub-value">{item.location}</div>
                            </div>
                        </div>

                        {item.evaluation_name && (
                            <div className="detail-item">
                                <div className="icon-circle" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                                    <FileTextOutlined />
                                </div>
                                <div className="detail-text">
                                    <div className="label">ประเภทการประเมิน</div>
                                    <div className="value">{item.evaluation_name}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="appt-footer">
                        <div>
                            <span style={{ color: '#64748b' }}>อาจารย์ที่ปรึกษา: </span>
                            <strong>{advisorName}</strong>
                        </div>
                        <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>
                            {isClickable ? footerHint : 'เตรียมเอกสารและการประเมินให้พร้อมก่อนสอบ'}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderEmpty = () => (
        <div
            className="empty-state-card"
            style={{
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                textAlign: 'center',
            }}
        >
            <CalendarOutlined style={{ fontSize: '48px', opacity: 0.5, color: '#9a0120' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{emptyTitle}</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>{emptyDescription}</p>
            {emptyActionLabel && onEmptyAction && (
                <button
                    type="button"
                    onClick={onEmptyAction}
                    style={{
                        marginTop: 8,
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: '#9a0120',
                        color: '#ffffff',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    {emptyActionLabel}
                </button>
            )}
        </div>
    );

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1f2937' }}>{title}</h2>
                    <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>{description}</p>
                </div>
            </div>

            <div
                style={{
                    position: 'relative',
                    minHeight: loadingHeight,
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {loading ? (
                    <div className="dashboard-loading" style={{ flex: 1 }}>
                        <Spin size="large" />
                    </div>
                ) : appointments.length > 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            overflowX: 'auto',
                            paddingBottom: 8,
                            paddingTop: 4,
                            scrollbarWidth: 'thin',
                        }}
                    >
                        {appointments.map(renderCard)}
                    </div>
                ) : (
                    renderEmpty()
                )}
            </div>
        </div>
    );
}
