"use client";
import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Spin, message, DatePicker } from 'antd';
import { PlusOutlined, SettingOutlined, AppstoreAddOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

import '../../../style/appointment.css';

import CalendarView from '../../../components/appointment/calendarView';
import AppointmentModal from '../../../components/appointment/bookingModal';
import RoomConfig from '../../../components/appointment/roomConfig';
import TypeManager from '../../../components/appointment/typeManager';

import { GetListAppointments, GetRooms, GetAppointmentTypes } from '../../../services/appointment';

export default function TeacherAppointmentPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(dayjs());

    // Modal States
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<any>(null);

    // Load Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [apptRes, roomRes, typeRes] = await Promise.all([
                GetListAppointments(),
                GetRooms(),
                GetAppointmentTypes()
            ]);
            setAppointments(apptRes.data);
            setRooms(roomRes.data);
            setTypes(typeRes.data);
        } catch (error) {
            console.error(error);
            message.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="appointment-page">
            
            {/* Header: Title & Actions */}
            <header className="page-header">
                <div className="header-title">
                    <h1>ระบบนัดหมายสอบ</h1>
                    <p>จัดการตารางสอบรายบุคคล (Advisor) และแบบอัตโนมัติ (Final Defense)</p>
                </div>
                
                <div className="header-actions">
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 16, gap: 4 }}>
                        <Button icon={<LeftOutlined />} onClick={() => setCurrentDate(prev => prev.subtract(1, 'week'))} />
                        <DatePicker 
                            value={currentDate} 
                            onChange={(date) => setCurrentDate(date || dayjs())} 
                            picker="week"
                            allowClear={false}
                            format={(value) => {
                                const start = value.startOf('week').add(1, 'day');
                                const end = value.add(1, 'week').startOf('week');
                                return `${start.format('DD/MM')} - ${end.format('DD/MM')}`;
                            }}
                            style={{ width: 140 }}
                        />
                        <Button icon={<RightOutlined />} onClick={() => setCurrentDate(prev => prev.add(1, 'week'))} />
                        <Button onClick={() => setCurrentDate(dayjs())}>วันนี้</Button>
                    </div>

                    <Tooltip title="จัดการห้องสอบ">
                        <button className="btn-icon" onClick={() => setShowRoomModal(true)}>
                            <AppstoreAddOutlined />
                        </button>
                    </Tooltip>
                    
                    <Tooltip title="จัดการประเภทนัดหมาย">
                        <button className="btn-icon" onClick={() => setShowTypeModal(true)}>
                            <SettingOutlined />
                        </button>
                    </Tooltip>

                    <button 
                        className="btn-primary"
                        onClick={() => { setSelectedAppt(null); setShowBookingModal(true); }}
                    >
                        <PlusOutlined /> สร้างนัดหมาย
                    </button>
                </div>
            </header>

            {/* Content: Calendar Grid */}
            <div className="calendar-wrapper">
                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                    </div>
                ) : (
                    <CalendarView 
                        appointments={appointments} 
                        onSelect={(appt) => { setSelectedAppt(appt); setShowBookingModal(true); }} 
                        currentDate={currentDate}
                    />
                )}
            </div>

            {/* Modals (Logic เดิม) */}
            <AppointmentModal
                visible={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSuccess={fetchData}
                rooms={rooms}
                types={types}
                initialData={selectedAppt}
            />

            <RoomConfig 
                visible={showRoomModal}
                onClose={() => setShowRoomModal(false)}
                onSuccess={fetchData}
            />

            <TypeManager 
                visible={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                types={types}
                onRefresh={fetchData}
            />
        </div>
    );
}