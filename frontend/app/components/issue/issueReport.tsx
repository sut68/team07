"use client";
import { useState, useEffect } from "react";
// Import Services
import { CreateIssue, GetMyIssues } from "../../services/issue"; // เช็ค path ให้ถูกต้อง
import { GetUserProfile } from "../../services/user"; // ✅ เพิ่มการเรียก User เพื่อเอา ID

// Import Interfaces
import { IssueReportInterface, CreateIssueInterface } from "../../interfaces/Issue";

// Import Icons & CSS
import { BugOutlined, FileTextOutlined, LoadingOutlined } from "@ant-design/icons";
import "../../style/issue-report.css"; 

export default function ReportIssueContent() {
  const [issues, setIssues] = useState<IssueReportInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Form State
  const [detail, setDetail] = useState("");
  const [typeID, setTypeID] = useState<number>(1); // Default 1 = Bug

  // 1. โหลดข้อมูล User และ รายการปัญหาเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            // 1.1 ดึงข้อมูล User ปัจจุบันเพื่อเอา ID
            const userRes = await GetUserProfile();
            if (userRes.status === 200 && userRes.data) {
                // เช็คโครงสร้างว่า backend ส่งมาเป็น { data: user } หรือ user โดยตรง
                const userData = userRes.data.data || userRes.data;
                setCurrentUserId(userData.ID);
            }

            // 1.2 ดึงรายการปัญหาทั้งหมด
            await fetchIssues();

        } catch (error) {
            console.error("Error initializing data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchInitialData();
  }, []);

  // ฟังก์ชันดึงรายการปัญหา (แยกออกมาเพื่อให้เรียกใช้ซ้ำได้ตอนกด Submit)
  const fetchIssues = async () => {
      try {
        const res = await GetMyIssues();
        if (res.status === 200) {
            setIssues(res.data);
        }
      } catch (error) {
          console.error("Error fetching issues:", error);
      }
  };

  // 2. ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
        alert("❌ ไม่พบข้อมูลผู้ใช้งาน กรุณา Login ใหม่");
        return;
    }

    if (!detail) {
        alert("⚠️ กรุณากรอกรายละเอียดปัญหา");
        return;
    }

    const data: CreateIssueInterface = {
        detail: detail,
        type_id: Number(typeID),
        user_id: currentUserId, // ✅ ส่ง ID ของคนที่ Login อยู่จริง
    };

    try {
        const res = await CreateIssue(data);
        if (res.status === 201) {
            alert("✅ แจ้งปัญหาสำเร็จ!");
            setDetail(""); // เคลียร์ฟอร์ม
            fetchIssues(); // โหลดข้อมูลใหม่มาแสดงทันที
        } else {
            alert("❌ เกิดข้อผิดพลาด: " + (res.data.error || "Unknown Error"));
        }
    } catch (error) {
        console.error("Submit Error:", error);
        alert("❌ ไม่สามารถเชื่อมต่อ Server ได้");
    }
  };

  return (
    <div className="report-container">
      <div className="report-card">
        
        {/* Header Section */}
        <div className="report-header">
          <h2>แจ้งปัญหาการใช้งาน (Report Issue)</h2>
          <p>พบเจอปัญหาหรือข้อเสนอแนะ แจ้งให้เราทราบได้ที่นี่</p>
        </div>

        <div className="report-content">
            
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="issue-form">
                <div className="form-group">
                    <label>หัวข้อ/ประเภทปัญหา</label>
                    <select 
                        className="form-input" 
                        value={typeID} 
                        onChange={(e) => setTypeID(Number(e.target.value))}
                    >
                        <option value={1}>Bug (ข้อผิดพลาดของระบบ)</option>
                        <option value={2}>Feature Request (ขอฟีเจอร์เพิ่ม)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea 
                        className="form-input" 
                        rows={4}
                        placeholder="อธิบายปัญหาที่พบ หรือระบุขั้นตอนที่ทำให้เกิด Error..." 
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={!currentUserId} // ป้องกันการกดถ้ายังโหลด User ไม่เสร็จ
                >
                    {currentUserId ? "ส่งเรื่องแจ้งปัญหา" : "กำลังโหลดข้อมูลผู้ใช้..."}
                </button>
            </form>

            <hr className="divider" />

            {/* List Section */}
            <h3>ประวัติการแจ้งปัญหา</h3>
            <div className="issue-list">
                {loading ? (
                    <div style={{textAlign: 'center', padding: 20}}>
                        <LoadingOutlined style={{fontSize: 24, color: '#9a0120'}} /> กำลังโหลด...
                    </div>
                ) : issues.length === 0 ? (
                    <p className="no-data">ยังไม่มีรายการแจ้งปัญหา</p>
                ) : (
                    issues.map((item) => (
                        <div key={item.ID} className="issue-item">
                            <div className="issue-icon">
                                {/* เลือก Icon ตามประเภทปัญหา */}
                                {item.type?.type === 'Bug' ? <BugOutlined /> : <FileTextOutlined />}
                            </div>
                            <div className="issue-info">
                                <div className="issue-header-row">
                                    <span className="issue-type">{item.type?.type || "General"}</span>
                                    {/* จัดการสีของ Badge ตาม Status */}
                                    <span className={`issue-status status-${item.status?.status.toLowerCase().replace(" ", "-") || "pending"}`}>
                                        {item.status?.status || "Pending"}
                                    </span>
                                </div>
                                <p className="issue-detail">{item.detail}</p>
                                <div className="issue-footer">
                                    <span>แจ้งโดย: {item.user?.firstname} {item.user?.lastname}</span>
                                    <span>
                                        วันที่: {item.report_date 
                                            ? new Date(item.report_date).toLocaleDateString('th-TH', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                                              }) 
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}