"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    GetListAppointments,GetAppointmentById,GetRooms,
    GetAppointmentTypes,SearchGroup,CreateAppointment,
    AutoCreateAppointments,UpdateAppointment,CreateRoom,
    DeleteAppointment,CreateAppointmentType,DeleteAppointmentType
} from '../../../services/appointment';

import type {
    IAppointment,
    IAppointmentDetail,
    IRoom,
    IAppointmentType,
    IGroupSearchResult,
    ICreateAppointmentRequest,
    IAutoScheduleRequest,
    IUpdateAppointmentRequest
} from "../../../interfaces/Appointment";

export default function TeacherAppointmentPage() {
    const router = useRouter();
    return (
        <div>
            <h1>Appointment ผู้สอน</h1>
            <p>ยินดีต้อนรับ...</p>
        </div>
    );
}