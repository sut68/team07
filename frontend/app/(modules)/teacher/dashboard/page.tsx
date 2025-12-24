"use client";

import './dashboard.css';

export default function TeacherDashboardPage() {
    return (
        <div className="container">
            
            {/* --- ส่วนซ้าย: ข่าวสาร (50%) --- */}
            <div className="news-section">
                <h1>
                    ข่าวสาร (News) มันจะเเสดงข่าวสารทั้งหมดที่อาจารย์อัพเดต ควรมี ลบ เเก้ไข ถ้ามันเกินหน้าให้ทำเป็น ตัวเลื่อน ตัวเพื่มข่าวสารอยู่ที่ Dropdown ตรงโปรไฟล์
                    ของส่วนรวมใครจะเสนอตัว(News) สร้าง entity news เชื่อม user *teacher api get,post,update,delete
                </h1>
            </div>

            {/* --- ส่วนขวา: รวม 3 ส่วนเดิม (50%) --- */}
            <div className="right-panel">
                
                {/* นัดหมาย */}
                <div className="section top">
                    <h1>นัดหมายของหนึ่ง (Top) ทำเเบบขึ้นว่ามีนัดอะไรเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
                </div>

                {/* แจ้งเตือนกลุ่ม */}
                <div className="section middle">
                    <h1>กลุ่มของเอ แจ้งว่ามีใครเลือกคุณ (Middle) ทำเเบบขึ้นว่ามีเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
                </div>

                {/* ความคืบหน้า */}
                <div className="section bottom">
                    <h1>ของพู แสดงความคืบหน้า (Bottom) ทำเเบบขึ้นว่ามีอะไรเฉยๆเป็นการ์ด เเล้วมีปุ่มให้คลิ๊กไป</h1>
                </div>

            </div>

        </div>
    );
}