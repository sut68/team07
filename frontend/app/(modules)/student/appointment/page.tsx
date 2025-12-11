"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetMyProjectAndAppointment } from '../../../services/appointment';


export default function StudentAppointmentPage() {
    const router = useRouter();
    return (
        <div>
            <h1>Appointment ผู้เรียน</h1>
            <p>ยินดีต้อนรับ...</p>
        </div>
    );
}