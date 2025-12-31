"use client";

import { useEffect, useMemo, useState } from 'react';
import { Spin, Empty, Button, Card, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { GetMyProjectAndAppointment } from '../../services/appointment';
import type { IStudentAppointmentOverview, IStudentAppointmentSlot } from '../../interfaces/Appointment';

interface StudentAppointmentSliderSectionProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onActionClick?: () => void;
    onCardClick?: (appointmentId: number) => void;
}

export default function StudentAppointmentSliderSection({
    title = 'การนัดหมายสอบ',
    description = 'ติดตามตารางสอบและนัดหมายสำคัญของคุณ',
    actionLabel,
    onActionClick,
    onCardClick,
}: StudentAppointmentSliderSectionProps) {
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

    const projectName = overview?.project_name || 'โครงงานของฉัน';
    const groupNumber = overview?.group_number ?? '-';

    const renderCard = (item: IStudentAppointmentSlot, index: number) => {
        const fallbackKey = `${item.type}-${item.date_time}-${index}`;
        const cardKey = typeof item.id === 'number' ? item.id : fallbackKey;

        return (
        <div
            key={cardKey}
            style={{
                minWidth: 240,
                maxWidth: 240,
                flexShrink: 0,
                display: 'flex',
                cursor: onCardClick ? 'pointer' : 'default',
                height: '100%',
            }}
            role={onCardClick ? 'button' : 'group'}
            tabIndex={onCardClick ? 0 : -1}
            onClick={() => onCardClick?.(item.id)}
            onKeyDown={(event) => {
                if (!onCardClick) {
                    return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCardClick(item.id);
                }
            }}
        >
            <Card
                hoverable={Boolean(onCardClick)}
                style={{ borderRadius: 12, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.1)' }}
                styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12, padding: 16 } }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>{item.type}</h3>
                        <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                            กลุ่มที่ {groupNumber} · {projectName}
                        </p>
                    </div>
                    <Tag color="red" style={{ margin: 0, fontSize: '0.7rem', padding: '2px 8px' }}>{item.evaluation_name || 'นัดหมายสอบ'}</Tag>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#4b5563', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarOutlined style={{ color: '#9ca3af', fontSize: '0.9rem' }} />
                        <span>{dayjs(item.date_time).locale('th').format('D MMM YYYY')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: '0.9rem' }} />
                        <span>{dayjs(item.date_time).format('HH:mm')} น.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: '#9ca3af', fontSize: '0.9rem' }} />
                        <span>{item.room} ({item.location})</span>
                    </div>
                </div>
            </Card>
        </div>
        );
    };

    return (
        <div className="student-dashboard-appointment">
            <div className="student-dashboard-appointment__header">
                <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
                {actionLabel && (
                    <Button
                        type="primary"
                        size="middle"
                        className="student-dashboard-appointment__action"
                        onClick={onActionClick}
                        disabled={!onActionClick}
                        style={{ fontWeight: 600, backgroundColor: '#9a0120', borderColor: '#9a0120' }}
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>

            <div className="student-dashboard-appointment__body">
                {loading ? (
                    <div className="student-dashboard-appointment__loading">
                        <Spin size="large" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="student-dashboard-appointment__empty">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="ยังไม่มีนัดหมายสอบ"
                        />
                    </div>
                ) : (
                    <div className="student-dashboard-appointment__carousel">
                        {appointments.map((item, index) => renderCard(item, index))}
                    </div>
                )}
            </div>
        </div>
    );
}
