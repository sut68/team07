"use client";
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import '../../style/appointment.css';

interface CalendarViewProps {
    appointments: any[];
    onSelect: (appt: any) => void;
    currentDate: dayjs.Dayjs;
}

// ===== CONFIG =====
const START_HOUR = 9;   // 09:00
const END_HOUR = 20;    // 20:00
const ROW_HEIGHT = 60; // px ต่อ 1 ชั่วโมง

const TIME_SLOTS = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => i + START_HOUR
);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

export default function CalendarView({ appointments, onSelect, currentDate }: CalendarViewProps) {
    // หาจุดเริ่มต้นของสัปดาห์ (วันอาทิตย์) แล้วบวก 1 เป็นวันจันทร์
    const startOfWeek = currentDate.startOf('week'); 

    return (
        <div className="timetable-container">
            {/* ===== Header ===== */}
            <div className="time-col-header" />
            {DAYS_TH.map((day, index) => {
                const thisDay = startOfWeek.add(index + 1, 'day');
                const isToday = thisDay.isSame(dayjs(), 'day');
                
                return (
                    <div
                        key={day}
                        className={`day-header ${isToday ? 'today' : ''}`}
                    >
                        {day}
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                            {thisDay.format('DD/MM')}
                        </span>
                    </div>
                );
            })}

            {/* ===== Grid ===== */}
            {TIME_SLOTS.map((hour) => (
                <React.Fragment key={hour}>
                    {/* Time label */}
                    <div className="time-label" style={{ gridRow: (hour - START_HOUR) + 2 }}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                    </div>

                    {/* Day cells */}
                    {DAYS.map((_, dayIndex) => (
                        <div
                            key={`${hour}-${dayIndex}`}
                            className={`grid-cell ${hour === 12 ? 'lunch-break-row' : ''}`}
                            style={{
                                gridRow: (hour - START_HOUR) + 2,
                                gridColumn: dayIndex + 2,
                            }}
                        />
                    ))}

                    {/* ใส่ข้อความแค่ครั้งเดียว */}
                    {hour === 12 && (
                        <div
                            key={`lunch-${hour}`}
                            className="lunch-break-label"
                            style={{
                                gridRow: (hour - START_HOUR) + 2,
                                gridColumn: '2 / span 7',
                            }}
                        >
                            ช่วงพักรับประทานอาหาร
                        </div>
                    )}

                </React.Fragment>
            ))}


            {/* ===== Appointments ===== */}
            {appointments.map((appt) => {
                const start = dayjs(appt.start_date_time);
                const weekStart = startOfWeek.add(1, 'day').startOf('day');
                const weekEnd = startOfWeek.add(7, 'day').endOf('day');

                if (start.isBefore(weekStart) || start.isAfter(weekEnd)) {
                    return null;
                }

                const startHour = start.hour();

                const dayIndex = (start.day() + 6) % 7;
                const gridColumn = dayIndex + 2;
                const gridRow = (startHour - START_HOUR) + 2;

                return (
                    <div
                        key={appt.id}
                        className={`appt-card ${appt.type_name?.includes('Final') ? 'appt-auto' : 'appt-manual'}`}
                        style={{
                            gridColumn,
                            gridRow,
                            marginTop: `${(start.minute() / 60) * ROW_HEIGHT}px`,
                            height: `${(appt.duration_min / 60) * ROW_HEIGHT}px`,
                        }}
                        onClick={() => onSelect(appt)}
                    >

                        <span className="appt-time">
                            {dayjs(appt.start_date_time).format('HH:mm')}–
                            {dayjs(appt.start_date_time).add(appt.duration_min, 'minute').format('HH:mm')}
                        </span>

                        <span className="appt-title">
                            {appt.group_name || `Group ${appt.group_number}`}
                        </span>
                    </div>


                );
            })}
        </div>
    );
}
