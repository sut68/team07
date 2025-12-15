"use client";
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

interface CalendarViewProps {
    appointments: any[];
    onSelect: (appt: any) => void;
}

// สร้าง Time Slots 08:00 - 18:00
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => i + 8); // [8, 9, ..., 18]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

export default function CalendarView({ appointments, onSelect }: CalendarViewProps) {
    
    // Helper: คำนวณตำแหน่ง CSS (Top) และความสูง (Height)
    const getStyle = (appt: any) => {
        const start = dayjs(appt.start_date_time);
        const startHour = start.hour();
        const startMin = start.minute();
        const duration = appt.duration_min;

        // คำนวณ Top: เริ่มที่ 8 โมง = 0px. 1 ชม. = 100% ของ Row ความสูง
        // เราใช้ Grid Row แทน: Row เริ่มที่ 2 (เพราะ Row 1 คือ Header)
        // สูตร: (Hour - 8) + 2
        const gridRowStart = (startHour - 8) + 2;
        
        // Offset ละเอียดระดับนาที (ถ้าอยากเป๊ะมากต้องใช้ absolute top % แต่ Grid ง่ายกว่า)
        // เพื่อความง่ายและ Design ที่ Clean: เราจะวางลงใน Slot หลัก แล้วขยับ margin-top เอา
        const topOffset = (startMin / 60) * 100; // % ของความสูงช่อง
        
        // ความสูง: 1 ชม (60นาที) = 100% ความสูงช่อง
        const heightPercent = (duration / 60) * 100;

        return {
            top: `${topOffset}%`,
            height: `${heightPercent}%`,
            gridRowStart: gridRowStart,
            zIndex: 5
        };
    };

    // Helper: หา Appointment ในวันนั้นๆ และเวลานั้นๆ
    // *แต่แบบ Grid เรา map appt โดยตรงเลยดีกว่า ไม่ต้อง loop slot*
    
    return (
        <div className="timetable-container">
            {/* 1. Header Row (มุมซ้ายบนว่าง) */}
            <div className="time-col-header"></div> 
            {DAYS_TH.map((day, index) => (
                <div key={day} className={`day-header ${dayjs().day() === index + 1 ? 'today' : ''}`}>
                    {day}
                    <span style={{fontSize: '0.8rem', fontWeight: 'normal'}}>
                        {/* โชว์วันที่ (สมมติเป็นสัปดาห์ปัจจุบัน) */}
                        {dayjs().startOf('week').add(index + 1, 'day').format('DD/MM')}
                    </span>
                </div>
            ))}

            {/* 2. Grid Content */}
            {TIME_SLOTS.map((hour) => (
                <React.Fragment key={hour}>
                    {/* Time Label Column */}
                    <div className="time-label" style={{ gridRow: (hour - 8) + 2 }}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                    </div>

                    {/* 7 Columns for Days */}
                    {DAYS.map((_, dayIndex) => (
                        <div 
                            key={`${hour}-${dayIndex}`} 
                            className={`grid-cell ${hour === 12 ? 'lunch-break-row' : ''}`}
                            style={{ 
                                gridRow: (hour - 8) + 2,
                                gridColumn: dayIndex + 2 
                            }}
                        />
                    ))}
                </React.Fragment>
            ))}

            {/* 3. Appointments Layer (Overlay) */}
            {appointments.map((appt) => {
                const start = dayjs(appt.start_date_time);
                
                let dayIndex: number = start.day(); 
                if (dayIndex === 0) dayIndex = 7;
                const gridColumn = dayIndex + 1;

                const style = getStyle(appt);

                return (
                    <div
                        key={appt.id}
                        className={`appt-card ${appt.type_name?.includes('Final') ? 'appt-auto' : 'appt-manual'}`}
                        style={{
                            gridColumn: gridColumn,
                            gridRow: style.gridRowStart,
                            marginTop: `${(dayjs(appt.start_date_time).minute() / 60) * 50}px`, // 50px คือความสูงคร่าวๆของ row
                            height: `${(appt.duration_min / 60) * 100}%`, // ปรับความสูงตาม duration
                            position: 'relative', // Override absolute ให้มันอยู่ใน Grid cell ได้ (หรือจะใช้ absolute ก็ได้ถ้า parent relative)
                        }}
                        onClick={() => onSelect(appt)}
                    >
                        <span className="appt-time">
                            {dayjs(appt.start_date_time).format('HH:mm')} - {dayjs(appt.start_date_time).add(appt.duration_min, 'minute').format('HH:mm')}
                        </span>
                        <span className="appt-title">
                            {appt.group_name || `Group ${appt.group_number}`}
                        </span>
                        <div style={{fontSize: '0.7rem', opacity: 0.7}}>{appt.room_name}</div>
                    </div>
                );
            })}
        </div>
    );
}