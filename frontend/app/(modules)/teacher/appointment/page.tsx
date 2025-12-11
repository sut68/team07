"use client";
import React, { useEffect, useState } from 'react';
import { Button, Spin, message, Tooltip } from 'antd';
import { PlusOutlined, SettingOutlined, AppstoreAddOutlined } from '@ant-design/icons';
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
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 border-l-8 border-[#9a0120] pl-4">
                        ระบบนัดหมายสอบ
                    </h1>
                    <p className="text-gray-500 pl-6 mt-1">จัดการตารางสอบรายบุคคลและแบบอัตโนมัติ</p>
                </div>
                
                <div className="flex gap-2">
                    <Tooltip title="จัดการห้องสอบ">
                        <Button icon={<AppstoreAddOutlined />} onClick={() => setShowRoomModal(true)} />
                    </Tooltip>
                    <Tooltip title="จัดการประเภทนัดหมาย">
                        <Button icon={<SettingOutlined />} onClick={() => setShowTypeModal(true)} />
                    </Tooltip>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        className="bg-[#9a0120] hover:bg-[#b90226] ml-2"
                        onClick={() => { setSelectedAppt(null); setShowBookingModal(true); }}
                    >
                        สร้างนัดหมาย
                    </Button>
                </div>
            </div>

            <div className="calendarContainer">
                {loading ? (
                    <div className="flex justify-center items-center h-96"><Spin size="large" /></div>
                ) : (
                    <CalendarView 
                        appointments={appointments} 
                        onSelect={(appt) => { setSelectedAppt(appt); setShowBookingModal(true); }} 
                    />
                )}
            </div>

            {/* Modals */}
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