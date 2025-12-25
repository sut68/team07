"use client";
import { useState, useEffect } from "react";
import { GetIssues, UpdateIssueStatus } from "../../../services/issue";
import { IssueReportInterface } from "../../../interfaces/Issue";
import { Toast_success, Toast_fail } from "../../../components/Webmessage";
import {
    LoadingOutlined,
    FileTextOutlined,
    UserOutlined,
    CalendarOutlined,
    EyeOutlined,
    CloseOutlined,
    CheckCircleOutlined 
} from "@ant-design/icons";
import "../../../style/admin-dashboard.css";

export default function AdminIssuePage() {
    const [issues, setIssues] = useState<IssueReportInterface[]>([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับข้อความตอบกลับ
    const [replyMessage, setReplyMessage] = useState("");
    
    // State สำหรับเก็บสถานะชั่วคราวใน Modal (ยังไม่บันทึกจนกว่าจะกดปุ่ม)
    const [tempStatus, setTempStatus] = useState<number>(3);

    // State สำหรับ Modal ดูรายละเอียด
    const [showModal, setShowModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueReportInterface | null>(null);

    // ฟังก์ชันโหลดข้อมูล
    const fetchIssues = async () => {
        setLoading(true);
        try {
            const res = await GetIssues();
            if (res.status === 200) {
                // เรียงลำดับ ID มาก -> น้อย (ล่าสุดขึ้นก่อน)
                const sortedIssues = res.data.sort((a: any, b: any) => (b.ID || 0) - (a.ID || 0));
                setIssues(sortedIssues);
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
            Toast_fail("ไม่สามารถดึงข้อมูลปัญหาได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    // ฟังก์ชันเปลี่ยนสถานะ (ทำงานเมื่อกดปุ่มยืนยัน)
    const handleStatusChange = async (id: number, newStatusID: number) => {
        try {
            // ส่งทั้ง StatusID และ replyMessage ไปที่ Backend
            const res = await UpdateIssueStatus(id, newStatusID, replyMessage);
            
            if (res.status === 200) {
                Toast_success("อัปเดตและแจ้งเตือนผู้ใช้เรียบร้อย!");
                
                // อัปเดตข้อมูลในหน้าเว็บ
                fetchIssues();
                
                // อัปเดตข้อมูลใน Modal (เผื่อยังเปิดอยู่)
                if (selectedIssue && selectedIssue.ID === id) {
                    setSelectedIssue({ ...selectedIssue, status_id: newStatusID });
                }
                
                // ปิด Modal หลังจากบันทึกสำเร็จ
                setShowModal(false); 
            } else {
                Toast_fail("เกิดข้อผิดพลาด: " + res.data.error);
            }
        } catch (error: any) {
            console.error("Update error:", error);
            Toast_fail("ไม่สามารถเชื่อมต่อ Server ได้");
        }
    };

    // ฟังก์ชันเปิด Modal ดูรายละเอียด
    const handleViewDetail = (issue: IssueReportInterface) => {
        setSelectedIssue(issue);
        setReplyMessage("");
        setTempStatus(issue.status_id || 3); 
        setShowModal(true);
    };

    // Helper: กำหนด Class สีให้ Dropdown/Badge
    const getStatusClass = (statusId: number) => {
        switch (statusId) {
            case 1: return "status-completed";
            case 2: return "status-in-progress";
            default: return "status-pending";
        }
    };

    // Helper: แสดงชื่อสถานะ
    const getStatusText = (statusId: number) => {
        switch (statusId) {
            case 1: return "Completed";
            case 2: return "In Progress";
            default: return "Pending";
        }
    };

    // Helper: แปลงวันที่ให้สวยงาม
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("th-TH", {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>รายการแจ้งปัญหา (Issues)</h1>
                <p>จัดการปัญหาและข้อร้องเรียนจากผู้ใช้งาน</p>
            </div>

            <div className="section-main">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <FileTextOutlined /> รายการปัญหาทั้งหมด ({issues.length})
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <LoadingOutlined style={{ fontSize: 30, color: '#9a0120' }} />
                        <p style={{ marginTop: '10px', color: '#666' }}>กำลังโหลดข้อมูล...</p>
                    </div>
                ) : issues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #eee', borderRadius: '8px' }}>
                        <FileTextOutlined style={{ fontSize: 40, color: '#ccc', marginBottom: '10px' }} />
                        <p style={{ color: '#999' }}>ยังไม่มีการแจ้งปัญหาเข้ามา</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                                    <th style={{ width: '140px' }}>ประเภท</th>
                                    <th>รายละเอียดปัญหา</th>
                                    <th style={{ width: '200px' }}>ผู้แจ้ง</th>
                                    <th style={{ width: '160px', textAlign: 'center' }}>สถานะ</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>ดูข้อมูล</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.map((item) => (
                                    <tr key={item.ID}>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#9a0120' }}>
                                            #{item.ID}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#555',
                                                backgroundColor: '#f5f5f5',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {item.type?.type || "General"}
                                            </span>
                                        </td>
                                        <td className="col-detail" title={item.detail}>
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                                {item.detail}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '35px', height: '35px',
                                                    background: '#e6f7ff',
                                                    borderRadius: '50%',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    color: '#1890ff',
                                                    border: '1px solid #91d5ff',
                                                    flexShrink: 0
                                                }}>
                                                    <UserOutlined />
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        color: '#333',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {item.user?.firstname} {item.user?.lastname}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                                        {item.user?.role?.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span
                                                className={`status-badge ${getStatusClass(item.status_id || 3)}`}
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                {getStatusText(item.status_id || 3)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleViewDetail(item)}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', color: '#1890ff',
                                                    fontSize: '1.2rem', padding: '5px'
                                                }}
                                                title="ดูรายละเอียดและแก้ไขสถานะ"
                                            >
                                                <EyeOutlined />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal แสดงรายละเอียดทั้งหมด */}
            {showModal && selectedIssue && (
                <div className="modal-overlay" style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '30px', borderRadius: '16px',
                        width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s',
                        maxHeight: '90vh', overflowY: 'auto' 
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                            <div>
                                <span style={{ backgroundColor: '#9a0120', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginRight: '10px' }}>
                                    #{selectedIssue.ID}
                                </span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                                    รายละเอียดการแจ้งปัญหา
                                </span>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>
                                <CloseOutlined />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* ผู้แจ้ง */}
                            <div style={{ display: 'flex', gap: '15px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '2rem', color: '#1890ff' }}><UserOutlined /></div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888' }}>ผู้แจ้งปัญหา</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {selectedIssue.user?.firstname} {selectedIssue.user?.lastname}
                                    </div>
                                    <div style={{ color: '#666' }}>
                                        Role: {selectedIssue.user?.role?.role} | Tel: {selectedIssue.user?.phone || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* รายละเอียดปัญหา */}
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>
                                    <FileTextOutlined /> หัวข้อ/ประเภท:
                                    <span style={{ marginLeft: '10px', color: '#000', fontWeight: 'normal' }}>{selectedIssue.type?.type}</span>
                                </div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>รายละเอียด:</div>
                                <div style={{
                                    backgroundColor: '#fff', border: '1px solid #ddd',
                                    borderRadius: '8px', padding: '15px',
                                    minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333'
                                }}>
                                    {selectedIssue.detail}
                                </div>
                            </div>

                            {/* วันที่และส่วนแก้ไขสถานะ */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}><CalendarOutlined /> วันที่แจ้ง</div>
                                    <div style={{ fontWeight: '600' }}>
                                        {formatDate(selectedIssue.report_date || (selectedIssue as any).CreatedAt)}
                                    </div>
                                </div>
                                
                                <div style={{ flex: 2, minWidth: '250px' }}>
                                    {/* --- ส่วนตอบกลับ --- */}
                                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>ข้อความตอบกลับ (ถึงผู้แจ้ง)</div>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        style={{ width: '100%', marginBottom: '10px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        placeholder="ระบุรายละเอียดการแก้ไข หรือข้อความถึงผู้ใช้..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                    />

                                    {/* --- ส่วนเลือกสถานะ --- */}
                                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>เลือกสถานะใหม่</div>
                                    <div className="status-select-wrapper" style={{ marginBottom: '15px' }}>
                                        <select
                                            className={`status-select ${getStatusClass(tempStatus)}`}
                                            value={tempStatus}
                                            onChange={(e) => setTempStatus(Number(e.target.value))}
                                            style={{ width: '100%' }}
                                        >
                                            <option value={3}>Pending</option>
                                            <option value={2}>In Progress</option>
                                            <option value={1}>Completed</option>
                                        </select>
                                    </div>

                                    {/* ปุ่มยืนยันการบันทึก */}
                                    <button
                                        onClick={() => selectedIssue && handleStatusChange(selectedIssue.ID!, tempStatus)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#1890ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'background 0.3s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                                    >
                                        <CheckCircleOutlined /> ยืนยันการแก้ไขและส่งแจ้งเตือน
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div style={{ textAlign: 'right', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 25px', backgroundColor: '#f0f0f0', color: '#333',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                ยกเลิก / ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}