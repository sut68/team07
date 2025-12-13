"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImportUsersCSV } from '../../../services/user'; // เช็ค path ให้ถูกต้อง
import "../../../style/import-user.css"; // Import CSS
import { CloudUploadOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons'; // ใช้ Icon จาก Ant Design

export default function ImportUsersPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // ใช้ Ref เพื่อควบคุม input file ที่ซ่อนอยู่
    const fileInputRef = useRef<HTMLInputElement>(null);

    // เมื่อคลิกที่กล่อง ให้ไปคลิกที่ input type="file" จริงๆ
    const handleBoxClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    // เมื่อเลือกไฟล์เสร็จ
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            // ตรวจสอบนามสกุลไฟล์
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                alert("❌ กรุณาเลือกไฟล์นามสกุล .csv เท่านั้น");
                return;
            }
            setFile(selectedFile);
        }
    };

    // ฟังก์ชันสร้างและดาวน์โหลด Template CSV (ไม่ต้องมีไฟล์จริงบน Server)
    const handleDownloadTemplate = () => {
        // Header ตามที่ Backend ต้องการ
        const csvHeader = "username,password,firstname,lastname,email,phone,gender_id,branch_id,role_id,status_id";
        // ข้อมูลตัวอย่าง
        const csvExample = "user01,123456,Somchai,Rakdee,somchai@email.com,0811111111,1,1,1,1";
        
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvExample;
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ฟังก์ชัน Upload
    const handleUpload = async () => {
        if (!file) {
            alert("⚠️ กรุณาเลือกไฟล์ก่อนกดอัปโหลด");
            return;
        }

        // ยืนยันอีกครั้ง
        if (!confirm(`คุณต้องการนำเข้าข้อมูลจากไฟล์ "${file.name}" ใช่หรือไม่?`)) {
            return;
        }

        setIsUploading(true);
        try {
            const res = await ImportUsersCSV(file);
            
            if (res.status === 200) {
                alert(`✅ นำเข้าสำเร็จ!\n${res.data.message || "เพิ่มข้อมูลเรียบร้อยแล้ว"}`);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = ""; // เคลียร์ input
                
                // กลับไปหน้า Dashboard หรือหน้ารายชื่อ User
                router.push('/admin/dashboard');
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${res.data.error || "Unknown Error"}`);
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("❌ ไม่สามารถเชื่อมต่อกับ Server ได้");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="import-container">
            <div className="import-card">
                
                {/* Header Section */}
                <div className="import-header">
                    <h2>นำเข้าข้อมูลผู้ใช้งาน (Import Users)</h2>
                    <p>รองรับไฟล์ .csv เท่านั้น</p>
                </div>

                <div className="import-content">
                    
                    {/* Template Download Section */}
                    <div className="template-section">
                        <span>ยังไม่มีไฟล์ต้นแบบ? </span>
                        <button onClick={handleDownloadTemplate} className="btn-template">
                            <DownloadOutlined /> ดาวน์โหลด Template CSV
                        </button>
                    </div>

                    {/* Upload Area (Clickable Box) */}
                    <div 
                        className="upload-area" 
                        onClick={handleBoxClick}
                        style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'wait' : 'pointer' }}
                    >
                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        
                        <div className="upload-icon">
                            <CloudUploadOutlined />
                        </div>
                        
                        <div className="upload-text-main">
                            คลิกเพื่อเลือกไฟล์ CSV
                        </div>
                        <div className="upload-text-sub">
                            หรือลากไฟล์มาวางที่นี่
                        </div>

                        {/* แสดงชื่อไฟล์เมื่อเลือกแล้ว */}
                        {file && (
                            <div className="selected-file-badge" onClick={(e) => e.stopPropagation()}>
                                <FileTextOutlined /> 
                                <span>{file.name}</span>
                                <span style={{fontSize:'0.8em', color:'#999'}}>
                                    ({(file.size / 1024).toFixed(2)} KB)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            className="btn-back" 
                            onClick={() => router.back()}
                            disabled={isUploading}
                        >
                            ย้อนกลับ
                        </button>
                        <button 
                            className="btn-upload" 
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                        >
                            {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการนำเข้า'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}