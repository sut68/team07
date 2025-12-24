"use client";

import React from 'react';
import './news.css'; 

// 1. สร้าง Interface เพื่อกำหนด Type ของ Props
interface CreateNewsModalProps {
  isOpen: boolean;       // เป็น true/false
  onClose: () => void;   // เป็นฟังก์ชันที่ไม่มีการ return ค่า
}

// 2. นำ Interface มาใช้ตรงนี้
export default function CreateNewsModal({ isOpen, onClose }: CreateNewsModalProps) {
  
  if (!isOpen) return null;

  // 3. ระบุ Type ให้ e เป็น React.FormEvent (event ของฟอร์ม)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // โค้ดส่งข้อมูลไป Backend
    alert("บันทึกข้อมูลเรียบร้อย!");
    onClose(); 
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
        {/* stopPropagation เพื่อไม่ให้คลิกที่กล่องแล้ว Modal ปิด */}
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="modal-header">
                <h2>สร้างข่าวสารใหม่</h2>
                <button type="button" className="close-btn" onClick={onClose}>&times;</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                
                {/* หัวข้อ */}
                <div className="form-group">
                    <label>หัวข้อข่าวสาร</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="ระบุหัวข้อเรื่อง..." 
                        required 
                    />
                </div>

                {/* รายละเอียด */}
                <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea 
                        className="form-control" 
                        placeholder="พิมพ์เนื้อหาข่าวสารที่นี่..."
                        required
                    ></textarea>
                </div>

                {/* อัปโหลดไฟล์ */}
                <div className="form-group">
                    <label>รูปภาพหรือไฟล์แนบ</label>
                    <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*,.pdf" 
                    />
                </div>

                {/* ปุ่ม Action */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-cancel" onClick={onClose}>
                        ยกเลิก
                    </button>
                    <button type="submit" className="btn btn-submit">
                        โพสต์ข่าวสาร
                    </button>
                </div>

            </form>
        </div>
    </div>
  );
}