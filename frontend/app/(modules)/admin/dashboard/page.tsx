"use client";
import { useState, useEffect } from "react";
import { GetIssues, UpdateIssueStatus } from "../../../services/issue";
import { GetUsers } from "../../../services/user";
import { IssueReportInterface } from "../../../interfaces/Issue";
import { UserProfileInterface } from "../../../interfaces/Users";
import { LoadingOutlined, FileTextOutlined, UserOutlined, TeamOutlined, ReadOutlined } from "@ant-design/icons";
import "../../../style/admin-dashboard.css";

export default function AdminDashboardPage() {
    // State สำหรับ Issues 
    const [issues, setIssues] = useState<IssueReportInterface[]>([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับนับจำนวนคน
    const [studentCount, setStudentCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);

    // ฟังก์ชันโหลดข้อมูล Issues
    const fetchIssues = async () => {
        try {
            const res = await GetIssues();
            if (res.status === 200) {
                setIssues(res.data);
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
        }
    };

    // ฟังก์ชันโหลดและนับจำนวน User
    const fetchUserCounts = async () => {
        try {
            const res = await GetUsers();
            if (res.status === 200) {
                const users: UserProfileInterface[] = res.data;

                // นับจำนวนตาม Role
                const students = users.filter(u => u.role?.role === "Student").length;
                const teachers = users.filter(u => u.role?.role === "Teacher").length;

                setStudentCount(students);
                setTeacherCount(teachers);
            }
        } catch (error) {
            console.error("Error fetching user counts:", error);
        }
    };

    // รวมการโหลดข้อมูลไว้ที่เดียว
    const fetchAllData = async () => {
        setLoading(true);
        // โหลดพร้อมกันทั้ง 2 อย่าง
        await Promise.all([fetchIssues(), fetchUserCounts()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ฟังก์ชันเปลี่ยนสถานะ Issue
    const handleStatusChange = async (id: number, newStatusID: number) => {
        try {
            const res = await UpdateIssueStatus(id, newStatusID);
            if (res.status === 200) {
                alert("✅ อัปเดตสถานะเรียบร้อย!");
                fetchIssues(); // โหลดตารางใหม่
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
                                        <th style={{ width: '50px' }}>ID</th>
                                        <th style={{ width: '120px' }}>ประเภท</th>
                                        <th>รายละเอียด</th>
                                        <th style={{ width: '150px' }}>ผู้แจ้ง</th>
                                        <th style={{ width: '140px' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map((item) => (
                                        <tr key={item.ID}>
                                            <td>{item.ID}</td>
                                            <td><span style={{ fontWeight: 500 }}>{item.type?.type}</span></td>
                                            <td className="col-detail" title={item.detail}>{item.detail}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                                    <UserOutlined style={{ color: '#999' }} />
                                                    {item.user?.firstname}
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    className={`status-badge status-${item.status?.status?.toLowerCase().replace(" ", "-") || "pending"}`}
                                                    style={{ width: '100%', border: 'none', cursor: 'pointer', outline: 'none' }}
                                                    value={item.status_id}
                                                    onChange={(e) => item.ID && handleStatusChange(item.ID, Number(e.target.value))}
                                                >
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

                <div className="section-side">
                    <h3 style={{ margin: '0 0 20px 0' }}>สรุปจำนวนผู้ใช้งาน</h3>

                    {/* การ์ด Teacher */}
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderLeft: '5px solid #1890ff' // สีฟ้า
                    }}>
                        <div>
                            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>อาจารย์ (Teachers)</p>
                            <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#333' }}>{teacherCount}</h2>
                        </div>
                        <div style={{
                            width: '50px', height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#e6f7ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                        </div>
                    </div>

                    {/* การ์ด Student */}
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderLeft: '5px solid #52c41a'
                    }}>
                        <div>
                            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>นักศึกษา (Students)</p>
                            <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#333' }}>{studentCount}</h2>
                        </div>
                        <div style={{
                            width: '50px', height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#f6ffed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ReadOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}