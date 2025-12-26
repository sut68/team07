"use client";
import { useState, useEffect } from "react";
import { CreateIssue, GetMyIssues, UpdateIssue } from "../../services/issue";
import { GetUserProfile } from "../../services/user";
import { IssueReportInterface, CreateIssueInterface } from "../../interfaces/Issue";
import { BugOutlined, FileTextOutlined, LoadingOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons"; 
import "../../style/issue-report.css";
import Swal from "sweetalert2";

export default function ReportIssueContent() {
    const [issues, setIssues] = useState<IssueReportInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Form State
    const [detail, setDetail] = useState("");
    const [typeID, setTypeID] = useState<number>(1);
    
    // State สำหรับโหมดแก้ไข
    const [editMode, setEditMode] = useState(false);
    const [editIssueId, setEditIssueId] = useState<number | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userRes = await GetUserProfile();
                if (userRes.status === 200 && userRes.data) {
                    const userData = userRes.data.data || userRes.data;
                    setCurrentUserId(userData.ID);
                }
                await fetchIssues();
            } catch (error) {
                console.error("Error initializing data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await GetMyIssues();
            if (res.status === 200) {
                // เรียงลำดับ ล่าสุดขึ้นก่อน
                const sorted = res.data.sort((a: any, b: any) => a.ID - b.ID);
                setIssues(sorted);
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
        }
    };

    // ฟังก์ชันเริ่มแก้ไข (เมื่อกดปุ่มดินสอ)
    const handleEditClick = (issue: IssueReportInterface) => {
        setEditMode(true);
        setEditIssueId(issue.ID!);
        setDetail(issue.detail || "");
        setTypeID(issue.type_id || 1);
        
        // Scroll ขึ้นไปที่ฟอร์มด้านบน
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ฟังก์ชันยกเลิกการแก้ไข
    const handleCancelEdit = () => {
        setEditMode(false);
        setEditIssueId(null);
        setDetail("");
        setTypeID(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUserId) {
            Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลผู้ใช้งาน', text: 'กรุณา Login ใหม่' });
            return;
        }
        if (!detail) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกรายละเอียดปัญหา' });
            return;
        }

        const actionText = editMode ? "แก้ไขรายการปัญหา" : "แจ้งปัญหาใหม่";

        const confirmResult = await Swal.fire({
            title: `ยืนยันการ${actionText}?`,
            text: "ตรวจสอบความถูกต้องก่อนบันทึก",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'บันทึกข้อมูล',
            cancelButtonText: 'ยกเลิก',
            customClass: { container: 'swal-z-index-high' }
        });

        if (confirmResult.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
                
                let res;
                if (editMode && editIssueId) {
                    // เรียก API อัปเดต
                    res = await UpdateIssue(editIssueId, { detail, type_id: typeID, user_id: currentUserId });
                } else {
                    // เรียก API สร้างใหม่
                    res = await CreateIssue({ detail, type_id: typeID, user_id: currentUserId });
                }

                if (res.status === 200 || res.status === 201) {
                    Swal.close();
                    await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', timer: 1500, showConfirmButton: false });
                    
                    // Reset Form
                    handleCancelEdit(); 
                    fetchIssues();
                } else {
                    Swal.close();
                    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: res.data.error });
                }
            } catch (error) {
                Swal.close();
                Swal.fire({ icon: 'error', title: 'การเชื่อมต่อล้มเหลว' });
            }
        }
    };

    return (
        <div style={{ padding: '0 10px' }}>
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="issue-form" style={{ marginBottom: '20px', border: editMode ? '2px solid #1890ff' : '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: editMode ? '#1890ff' : '#333' }}>
                    {editMode ? `✏️ กำลังแก้ไขรายการ` : "📝 แจ้งปัญหาใหม่"}
                </h4>
                
                <div className="form-group">
                    <label>ประเภทปัญหา</label>
                    <select
                        className="form-input"
                        value={typeID}
                        onChange={(e) => setTypeID(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    >
                        <option value={1}>Bug (ข้อผิดพลาดของระบบ)</option>
                        <option value={2}>Feature Request (ขอฟีเจอร์เพิ่ม)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="ระบุรายละเอียด..."
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={!currentUserId}
                        style={{
                            flex: 1, padding: '10px', 
                            backgroundColor: editMode ? '#1890ff' : '#8A011D', 
                            color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}
                    >
                        {editMode ? "บันทึกการแก้ไข" : "ส่งเรื่องแจ้งปัญหา"}
                    </button>
                    
                    {editMode && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                                padding: '10px 20px', backgroundColor: '#f0f0f0', 
                                color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer'
                            }}
                        >
                            ยกเลิก
                        </button>
                    )}
                </div>
            </form>

            <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

            {/* List Section */}
            <h4 style={{ marginBottom: '15px' }}>ประวัติการแจ้งปัญหา</h4>
            <div className="issue-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <LoadingOutlined /> กำลังโหลด...
                    </div>
                ) : issues.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>ยังไม่มีรายการแจ้งปัญหา</p>
                ) : (
                    issues.map((item) => (
                        <div key={item.ID} className="issue-item" style={{
                            border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '10px',
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                            backgroundColor: editIssueId === item.ID ? '#e6f7ff' : '#fff' // ไฮไลท์รายการที่กำลังแก้
                        }}>
                            <div style={{ fontSize: '20px', color: '#555' }}>
                                {item.type?.type === 'Bug' ? <BugOutlined /> : <FileTextOutlined />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                        {item.type?.type || "General"} <span style={{fontSize:'0.8em', color:'#999'}}></span>
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className={`issue-status status-${(item.status?.status || "Pending").toLowerCase().replace(" ", "-")}`}>
                                            {item.status?.status || "Pending"}
                                        </span>
                                        {item.status?.status === "Pending" && (
                                            <EditOutlined 
                                                onClick={() => handleEditClick(item)} 
                                                style={{ cursor: 'pointer', color: '#1890ff', fontSize: '16px' }}
                                                title="แก้ไขรายละเอียด"
                                            />
                                        )}
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{item.detail}</p>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                    {item.report_date ? new Date(item.report_date).toLocaleDateString('th-TH') : "-"}
                                </div>
                                {item.admin_reply && (
                                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px' }}>
                                        <strong>Admin ตอบกลับ:</strong> <span style={{ color: '#1890ff' }}>{item.admin_reply}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}