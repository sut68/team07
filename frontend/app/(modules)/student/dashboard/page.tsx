import './dashboard.css';

export default function StudentDashboardPage() {
    return (
        <div className="container">
            
            {/* 1. ส่วนบน (ข่าวสาร) */}
            <div className="section top">
                <h1>
                    ข่าวสาร ของส่วนรวมใครจะเสนอตัว(News) สร้าง entity news เชื่อม user 
                    *student get ให้ดีควรมีรูปภาพ ส่งไฟล์ได้ นักศึกษาสามารถดาวโหลดไฟล์ได้
                </h1>
            </div>

            {/* 2. ส่วนล่าง (Container สำหรับแถวล่าง) */}
            <div className="row-container">
                
                {/* 2.1 โครงงาน (ด้านซ้าย - กว้าง) */}
                <div className="section middle">
                    <h1>โครงงานของ Jornor</h1>
                </div>

                {/* 2.2 แจ้งนัดหมาย (ด้านขวา - แคบ) */}
                <div className="section bottom">
                    <h1>แจ้งนัดหมาย ของ หนึ่ง</h1>
                </div>

            </div>

        </div>
    );
}