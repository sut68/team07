"use client";
import { useState, useEffect } from "react";
import { CreateIssue, GetMyIssues } from "../../services/issue"; 
import { GetUserProfile } from "../../services/user"; 
import { IssueReportInterface, CreateIssueInterface } from "../../interfaces/Issue";
import { BugOutlined, FileTextOutlined, LoadingOutlined } from "@ant-design/icons";
import "../../style/issue-report.css";
import Swal from "sweetalert2";

export default function ReportIssueContent() {
    const [issues, setIssues] = useState<IssueReportInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Form State
    const [detail, setDetail] = useState("");
    const [typeID, setTypeID] = useState<number>(1); 

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
                setIssues(res.data);
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
        }
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

        const confirmResult = await Swal.fire({
            title: 'ยืนยันการแจ้งปัญหา?',
            text: "คุณตรวจสอบรายละเอียดถูกต้องแล้วใช่ไหม?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ส่งเรื่องเลย!',
            cancelButtonText: 'ยกเลิก',
            // ✅ กำหนด zIndex ให้สูงกว่า Modal ของ Antd (Modal ปกติ ~1000)
            customClass: {
                container: 'swal-z-index-high' 
            }
        });

        if (confirmResult.isConfirmed) {
            const data: CreateIssueInterface = {
                detail: detail,
                type_id: Number(typeID),
                user_id: currentUserId,
            };

            try {
                Swal.fire({ title: 'กำลังส่งข้อมูล...', didOpen: () => Swal.showLoading() });
                const res = await CreateIssue(data);

                if (res.status === 201) {
                    Swal.close();
                    await Swal.fire({ icon: 'success', title: 'แจ้งปัญหาสำเร็จ!', timer: 1500, showConfirmButton: false });
                    setDetail("");
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

    // ✅ ปรับ Layout ให้เหมาะกับการอยู่ใน Modal (ตัด container ใหญ่ออก)
    return (
        <div style={{ padding: '0 10px' }}>
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="issue-form" style={{ marginBottom: '20px' }}>
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

                <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={!currentUserId}
                    style={{ 
                        width: '100%', padding: '10px', backgroundColor: '#8A011D', color: '#fff', 
                        border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' 
                    }}
                >
                    {currentUserId ? "ส่งเรื่องแจ้งปัญหา" : "กำลังโหลด..."}
                </button>
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
                            display: 'flex', gap: '10px', alignItems: 'flex-start'
                        }}>
                            <div style={{ fontSize: '20px', color: '#555' }}>
                                {item.type?.type === 'Bug' ? <BugOutlined /> : <FileTextOutlined />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.type?.type || "General"}</span>
                                    <span style={{ 
                                        fontSize: '12px', padding: '2px 8px', borderRadius: '10px',
                                        backgroundColor: item.status?.status === 'Completed' ? '#f6ffed' : '#fffbe6',
                                        color: item.status?.status === 'Completed' ? '#52c41a' : '#faad14',
                                        border: `1px solid ${item.status?.status === 'Completed' ? '#b7eb8f' : '#ffe58f'}`
                                    }}>
                                        {item.status?.status || "Pending"}
                                    </span>
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