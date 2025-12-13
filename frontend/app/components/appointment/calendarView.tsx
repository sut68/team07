"use client";
import React from 'react';
import { Tag, Empty } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

interface CalendarViewProps {
    appointments: any[];
    onSelect: (appt: any) => void;
}

export default function CalendarView({ appointments, onSelect }: CalendarViewProps) {
    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>ยังไม่มีนัดหมายในขณะนี้</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] p-2">
            {appointments.map((appt) => (
                <div 
                    key={appt.id} 
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-red-200 transition cursor-pointer relative overflow-hidden group"
                    onClick={() => onSelect(appt)}
                >
                    {/* แถบสีด้านซ้าย */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${appt.type_name.includes('Final') ? 'bg-orange-500' : 'bg-[#9a0120]'}`}></div>
                    
                    <div className="pl-4">
                        <div className="flex justify-between items-start mb-3">
                            <Tag color={appt.type_name.includes('Final') ? 'orange' : 'red'} className="m-0">
                                {appt.type_name}
                            </Tag>
                            <span className="text-xs text-gray-400 font-mono">#{appt.id}</span>
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1" title={appt.group_name}>
                            {appt.group_name || `Group ${appt.group_number}`}
                        </h3>
                        
                        <div className="text-sm text-gray-600 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <CalendarOutlined className="text-gray-400"/>
                                <span>{dayjs(appt.start_date_time).locale('th').format('DD MMM BBBB')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ClockCircleOutlined className="text-gray-400"/>
                                <span>
                                    {dayjs(appt.start_date_time).format('HH:mm')} - {dayjs(appt.start_date_time).add(appt.duration_min, 'minute').format('HH:mm')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <EnvironmentOutlined className="text-gray-400"/>
                                <span>{appt.room_name} ({appt.location})</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                            <span>ผู้สร้าง: {appt.teacher_name}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}