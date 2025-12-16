"use client";
import { useState, useEffect } from "react";
// ✅ เพิ่ม UpdateIssueStatus
import { GetIssues, UpdateIssueStatus } from "../../../services/issue"; 
import { IssueReportInterface } from "../../../interfaces/Issue";
import { LoadingOutlined, FileTextOutlined, UserOutlined, ClockCircleOutlined } from "@ant-design/icons";
import "../../../style/admin-dashboard.css";

export default function AdminDashboardPage() {
    const [issues, setIssues] = useState<IssueReportInterface[]>([]);
    const [loading, setLoading] = useState(true);

    // ฟังก์ชันโหลดข้อมูล (แยกออกมาเพื่อเรียกใช้ซ้ำตอนอัปเดตเสร็จ)
    const fetchIssues = async () => {
        try {
            const res = await GetIssues(); 
            if (res.status === 200) {
                setIssues(res.data);
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    // ✅ ฟังก์ชันเปลี่ยนสถานะเมื่อเลือก Dropdown
    const handleStatusChange = async (id: number, newStatusID: number) => {
        try {
            const res = await UpdateIssueStatus(id, newStatusID);
            if (res.status === 200) {
                alert("อัปเดตสถานะเรียบร้อย!");
                fetchIssues(); // โหลดข้อมูลใหม่เพื่อให้ตารางอัปเดต
            } else {
                alert("เกิดข้อผิดพลาด: " + res.data.error);
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("ไม่สามารถเชื่อมต่อ Server ได้");
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard ผู้ดูแลระบบ</h1>
                <p>ภาพรวมระบบและการรายงานปัญหา</p>
            </div>

            <div className="dashboard-layout">
                {/* ส่วน 70%: รายงานปัญหา */}
                <div className="section-main">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
                        <FileTextOutlined /> รายการแจ้งปัญหาล่าสุด
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <LoadingOutlined style={{ fontSize: 24, color: '#9a0120' }} /> กำลังโหลด...
                        </div>
                    ) : issues.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999' }}>ไม่มีรายการแจ้งปัญหา</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{width: '50px'}}>ID</th>
                                        <th style={{width: '120px'}}>ประเภท</th>
                                        <th>รายละเอียด</th>
                                        <th style={{width: '150px'}}>ผู้แจ้ง</th>
                                        <th style={{width: '140px'}}>สถานะ</th> {/* ปรับขนาดคอลัมน์ */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map((item) => (
                                        <tr key={item.ID}>
                                            <td>#{item.ID}</td>
                                            <td><span style={{ fontWeight: 500 }}>{item.type?.type}</span></td>
                                            <td className="col-detail" title={item.detail}>{item.detail}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                                    <UserOutlined style={{ color: '#999' }} />
                                                    {item.user?.firstname}
                                                </div>
                                            </td>
                                            <td>
                                                {/* ✅ เปลี่ยนเป็น Dropdown */}
                                                <select
                                                    className={`status-badge status-${item.status?.status?.toLowerCase().replace(" ", "-") || "pending"}`}
                                                    style={{ 
                                                        border: 'none', 
                                                        cursor: 'pointer',
                                                        outline: 'none',
                                                        width: '100%' 
                                                    }}
                                                    value={item.status_id} // ใช้ ID ในการจับคู่
                                                    onChange={(e) => {
                                                        if (item.ID) {
                                                            handleStatusChange(item.ID, Number(e.target.value));
                                                        }
                                                    }}
                                                >
                                                    {/* Value ต้องตรงกับ ID ใน Database */}
                                                    <option value={1}>Completed</option>
                                                    <option value={2}>In Progress</option>
                                                    <option value={3}>Pending</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ส่วน 30%: Side Content */}
                <div className="section-side">
                    <h3 style={{ margin: '0 0 20px 0' }}>สถานะผู้ใช้งาน</h3>
                    <div style={{ 
                        border: '2px dashed #ddd', 
                        borderRadius: '8px', 
                        padding: '40px 20px', 
                        textAlign: 'center',
                        color: '#999',
                        backgroundColor: '#fafafa'
                    }}>
                        <ClockCircleOutlined style={{ fontSize: '24px', marginBottom: '10px' }} />
                        <p>ส่วนนี้สำหรับแสดง User Status ในอนาคต</p>
                    </div>
                </div>
            </div>
        </div>
    );
}