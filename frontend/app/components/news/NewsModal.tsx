"use client";

import React, { useState, useEffect } from 'react';
import '../../style/news.css';
import { News } from '../../interfaces/News';
import { createNews, updateNews } from '../../services/news';
import { Toast_success, Toast_fail } from '../Webmessage';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: News | null;
}

export default function NewsModal({ isOpen, onClose, onSuccess, initialData }: NewsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.Title);
      setDescription(initialData.Description);
      setCategory(initialData.Category);
      setFile(null);
    } else {
      setTitle("");
      setDescription("");
      setCategory("General");
      setFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    Modal.confirm({
      title: initialData ? 'ยืนยันการแก้ไขข่าวสาร' : 'ยืนยันการสร้างข่าวสาร',
      icon: <ExclamationCircleOutlined />,
      content: initialData ? 'คุณต้องการบันทึกการแก้ไขใช่หรือไม่?' : 'คุณต้องการสร้างข่าวสารนี้ใช่หรือไม่?',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("category", category);
        if (file) {
          formData.append("file", file);
        }

        try {
          if (initialData) {
            await updateNews(initialData.ID, formData);
            Toast_success("แก้ไขข่าวสารเรียบร้อย!");
          } else {
            await createNews(formData);
            Toast_success("สร้างข่าวสารเรียบร้อย!");
          }
          if (onSuccess) onSuccess();
          onClose();
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || "เกิดข้อผิดพลาด";
          Toast_fail(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
                <h2>{initialData ? "แก้ไขข่าวสาร" : "สร้างข่าวสารใหม่"}</h2>
                <button type="button" className="close-btn" onClick={onClose}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
                
                <div className="form-group">
                    <label>หัวข้อข่าวสาร</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="ระบุหัวข้อเรื่อง..." 
                        required 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>ประเภทข่าวสาร</label>
                    <select 
                        className="form-control" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="General">ทั่วไป (General)</option>
                        <option value="Advisor">สำหรับนักศึกษาในที่ปรึกษา (Advisor)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea 
                        className="form-control" 
                        placeholder="พิมพ์เนื้อหาข่าวสารที่นี่..."
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>รูปภาพหรือไฟล์แนบ {initialData?.File && "(มีไฟล์เดิมอยู่แล้ว อัปโหลดใหม่เพื่อเปลี่ยน)"}</label>
                    <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*,.pdf,.doc,.docx" 
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setFile(e.target.files[0]);
                            }
                        }}
                    />
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-cancel" onClick={onClose} disabled={loading}>
                        ยกเลิก
                    </button>
                    <button type="submit" className="btn btn-submit" disabled={loading}>
                        {loading ? "กำลังบันทึก..." : (initialData ? "บันทึกการแก้ไข" : "โพสต์ข่าวสาร")}
                    </button>
                </div>

            </form>
        </div>
    </div>
  );
}
