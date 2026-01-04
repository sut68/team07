import React from 'react';
import { Card, Tag, Empty } from 'antd';
import { CalendarOutlined, EnvironmentOutlined} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { IAppointment } from '../../interfaces/Appointment';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

interface AppointmentSliderProps {
    appointments: IAppointment[];
    category: 'advisor' | 'committee';
}

const AppointmentSlider: React.FC<AppointmentSliderProps> = ({ appointments, category }) => {
    const router = useRouter();

    if (appointments.length === 0) {
        return <Empty description="ไม่มีการนัดหมาย" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const handleClick = (appt: IAppointment) => {
        let evalType = "Advisor Evaluation";
        if (category === 'committee' || appt.type_name === 'Final Defense') {
            evalType = "Committee Evaluation";
        }
        
        // Navigate to evaluation form
        router.push(`/teacher/evaluation/form/${appt.id}?evalType=${encodeURIComponent(evalType)}`);
    };

    return (
        <div style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '16px', 
            padding: '4px 4px 16px 4px',
            scrollbarWidth: 'thin',
            width: '100%',
            height: '100%', 
            alignItems: 'flex-start'
        }}>
            {appointments.map(appt => (
                <Card 
                    key={appt.id}
                    hoverable
                    style={{ 
                        minWidth: 220, 
                        maxWidth: 220, 
                        flexShrink: 0,
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => handleClick(appt)}
                >
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                            {appt.group_name || `Group ${appt.group_number}`}
                        </h4>
                        <Tag color={category === 'committee' ? 'red' : 'blue'} style={{ marginRight: 0 }}>
                            {appt.type_name}
                        </Tag>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#4b5563', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarOutlined style={{ color: '#9ca3af' }} />
                            <span>{dayjs(appt.start_date_time).locale('th').format('D MMM YYYY HH:mm')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EnvironmentOutlined style={{ color: '#9ca3af' }} />
                            <span>{appt.room_name} ({appt.location})</span>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default AppointmentSlider;
