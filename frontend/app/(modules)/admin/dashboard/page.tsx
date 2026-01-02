"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { GetIssues } from "../../../services/issue"; 
import { GetUsers } from "../../../services/user";
import { IssueReportInterface } from "../../../interfaces/Issue";
import { UserProfileInterface } from "../../../interfaces/Users";
import { LoadingOutlined, FileTextOutlined, UserOutlined, TeamOutlined, ReadOutlined } from "@ant-design/icons";
import "../../../style/admin-dashboard.css";

export default function AdminDashboardPage() {
    const router = useRouter(); 

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
                const sortedIssues = res.data.sort((a: any, b: any) => (b.ID || 0) - (a.ID || 0));
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
        await Promise.all([fetchIssues(), fetchUserCounts()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ฟังก์ชันคลิกแถวเพื่อไปหน้าจัดการ Issue
    const handleRowClick = (id: number) => {
        router.push('/admin/issue'); 
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
                                        <th style={{ width: '50px' }}>ID</th>
                                        <th style={{ width: '120px' }}>ประเภท</th>
                                        <th>รายละเอียด</th>
                                        <th style={{ width: '150px' }}>ผู้แจ้ง</th>
                                        <th style={{ width: '140px' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map((item) => (
                                        <tr 
                                            key={item.ID} 
                                            onClick={() => item.ID && handleRowClick(item.ID)} 
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }} 
                                            className="hover:bg-gray-50" 
                                        >
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
                                                <span 
                                                    className={`status-badge status-${item.status?.status?.toLowerCase().replace(" ", "-") || "pending"}`}
                                                    style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'inline-block',
                                                        textAlign: 'center',
                                                        minWidth: '80px'
                                                    }}
                                                >
                                                    {item.status?.status || "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ส่วน 30%: Side Content (แสดงจำนวน Teacher/Student) */}
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
                        borderLeft: '5px solid #1890ff' 
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