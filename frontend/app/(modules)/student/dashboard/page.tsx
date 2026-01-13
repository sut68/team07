"use client";

import { useRouter } from 'next/navigation';
import '../../../style/dashboard.css';
import '../../../style/appointment.css';
import NewsList from '../../../components/news/NewsList';
import { useAuth } from '../../roleCheck/authContext';
import StudentAppointmentSliderSection from '../../../components/dashboard/studentAppointmentSliderSection';
import StudentStorage from '../../../components/dashboard/studentStorage';

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const handleOpenExamPage = () => {
        router.push('/student/exam');
    };

    return (
        <div className="student-dashboard-container">
            {/* --- ส่วนซ้าย: ข่าวสาร (40%) --- */}
            <div className="news-section">
                <NewsList currentUserId={user?.id} role="Student" />
            </div>

            {/* --- ส่วนขวา: รวม 2 ส่วน (60%) --- */}
            <div className="right-panel">

                {/* นัดหมาย (Top) */}
                <div className="section top-right">
                    <StudentAppointmentSliderSection
                        actionLabel="เกี่ยวกับสอบ"
                        onActionClick={handleOpenExamPage}
                        onCardClick={handleOpenExamPage}
                    />
                </div>

                {/* โครงงาน (Bottom) */}
                <div className="section bottom-right">
                    <StudentStorage />
                </div>

            </div>

        </div>
    );
}