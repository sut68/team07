"use client";

import '../../../style/dashboard.css';
import NewsList from '../../../components/news/NewsList';
import { useAuth } from '../../roleCheck/authContext';

export default function StudentDashboardPage() {
    const { user } = useAuth();

    return (
        <div className="container">
            
            {/* --- ส่วนซ้าย: ข่าวสาร (40%) --- */}
            <div className="news-section">
                <NewsList currentUserId={user?.id} role="Student" />
            </div>

            {/* --- ส่วนขวา: รวม 2 ส่วน (60%) --- */}
            <div className="right-panel">
                
                {/* นัดหมาย (Top) */}
                <div className="section top-right">
                    <h1>แจ้งนัดหมาย ของ หนึ่ง</h1>
                </div>

                {/* โครงงาน (Bottom) */}
                <div className="section bottom-right">
                    <h1>โครงงานของ Jornor</h1>
                </div>

            </div>

        </div>
    );
}