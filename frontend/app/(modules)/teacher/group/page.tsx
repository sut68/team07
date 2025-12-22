'use client'

import React, { useState, useEffect, useCallback } from 'react';
import AdvisorCardWrapper from '../../../components/AdvisorCardWrapper';
import { SelectAdvisor } from '../../../interfaces/Advisor';
import { GetAcademicYears } from '../../../services/group';
import { 
    GetAdvisorRequests, 
    AcceptRequest, 
    RejectRequest,
    ToggleAdvisorStatus
} from '../../../services/advisor';

import Swal from 'sweetalert2';
import "../../../style/TeacherSelectPage.css";

const TeacherSelectPage = () => {
    const [pendingRequests, setPendingRequests] = useState<SelectAdvisor[]>([]);
    const [myAdvisees, setMyAdvisees] = useState<SelectAdvisor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(true); 
    const [academicYears, setAcademicYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543);

    const initData = useCallback(async () => {
        setLoading(true);
        try {
            const resYear = await GetAcademicYears();
            if (resYear.data && resYear.data.length > 0) {
                setAcademicYears(resYear.data);
                setSelectedYear(prev => prev || resYear.data[0]); 
            }
            const resRequests = await GetAdvisorRequests();
            
            if (resRequests.data) {
                const allRequests = resRequests.data.data || [];
                const pending = allRequests.filter(req => req.status === 'pending');
                const accepted = allRequests.filter(req => req.status === 'accepted');

                setPendingRequests(pending);
                setMyAdvisees(accepted);

                const serverIsOpen = (resRequests.data as any).is_open;
                
                if (typeof serverIsOpen === 'boolean') {
                    // console.log("Sync Status form Server:", serverIsOpen); // Debug ดูค่า
                    setIsAccepting(serverIsOpen);
                }
            }

            const serverIsOpen = (resRequests.data as any).is_open;
            // console.log("SERVER SENT IS_OPEN =", serverIsOpen); // <--- ดู log นี้ใน Console Browser

            if (typeof serverIsOpen === 'boolean') {
                setIsAccepting(serverIsOpen);
            } else {
                console.warn("Server sent weird status, defaulting to TRUE");
                setIsAccepting(true);
            }
            
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        initData();
    }, [initData]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(e.target.value, 10);
        setSelectedYear(year);
        console.log("Selected Year changed to:", year);
    };

    const handleToggleStatus = async () => {
        const actionText = isAccepting ? "ปิดรับสมัคร" : "เปิดรับสมัคร";
        const confirmColor = isAccepting ? "#c0392b" : "#27ae60";

        const result = await Swal.fire({
            title: `ยืนยันการ${actionText}?`,
            text: isAccepting 
                ? "หากปิดรับ คำขอที่ค้างอยู่ทั้งหมดจะถูกปฏิเสธทันที!" 
                : "นักศึกษาจะสามารถส่งคำขอเข้ามาหาท่านได้อีกครั้ง",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: `ยืนยัน${actionText}`,
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await ToggleAdvisorStatus({ is_open: !isAccepting });
                setIsAccepting(!isAccepting);
                
                await Swal.fire("สำเร็จ", `ท่านได้ทำการ${actionText}เรียบร้อยแล้ว`, "success");
                initData(); 
            } catch (error) {
                Swal.fire("ผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้", "error");
            }
        }
    };

    const handleAccept = async (selectionId: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการรับกลุ่มนี้ ?',
            text: "กลุ่มนี้จะเข้ามาอยู่ในความดูแลของท่านทันที",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await AcceptRequest({ selection_id: selectionId });
                if (res.status === 200) {
                    await Swal.fire("สำเร็จ", "รับกลุ่มเข้าที่ปรึกษาเรียบร้อยแล้ว", "success");
                    initData();
                }
            } catch (error: any) {
                Swal.fire("เกิดข้อผิดพลาด", error.response?.data?.error || "ไม่สามารถทำรายการได้", "error");
            }
        }
    };

    const handleReject = async (selectionId: number) => {
        const result = await Swal.fire({
            title: 'ปฏิเสธคำขอ?',
            text: "ระบบจะส่งกลุ่มนี้ไปให้อาจารย์ลำดับถัดไปพิจารณา",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ปฏิเสธ',
            confirmButtonColor: '#d33',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await RejectRequest({ selection_id: selectionId });
                if (res.status === 200) {
                    await Swal.fire("เรียบร้อย", "ปฏิเสธคำขอแล้ว", "success");
                    initData();
                }
            } catch (error: any) {
                Swal.fire("เกิดข้อผิดพลาด", error.response?.data?.error || "ไม่สามารถทำรายการได้", "error");
            }
        }
    };

    const filteredMyAdvisees = myAdvisees.filter(item => {
        const groupYear = item.group_project?.year;
        return String(groupYear) === String(selectedYear);
    });

    const filteredPendingRequests = pendingRequests.filter(item => {
        const groupYear = item.group_project?.year;
        return String(groupYear) === String(selectedYear);
    });

    if (loading && pendingRequests.length === 0 && myAdvisees.length === 0) {
        return <div style={{padding: 50, textAlign: 'center'}}>กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="teacher-dashboard-container">
            <div className="dashboard-content-wrapper">
                
              {/* Header หน้าหลัก */}
              <div className="header-left">
                <div className="thick-red-bar"></div>
                <div className="header-text-content">
                  <h1 className="page-title">เลือกกลุ่มโครงงานที่ต้องการเป็นที่ปรึกษา</h1>
                  <p className="page-subtitle">โปรดเลือกกลุ่มโครงงานตามลำดับที่ท่านถูกเลือก</p>
                </div>
              </div>

                {/* --- Section 1: กลุ่มในที่ปรึกษา --- */}
                <div className="dashboard-section">
                    <div className="section-header-with-action">
                        <div className="section-title my-group">
                            กลุ่มในที่ปรึกษาของท่าน {/*({filteredMyAdvisees.length}) */}
                        </div>
                        
                        {/* Dropdown เลือกปี */}
                        <div className="year-selector-wrapper">
                            <span className="year-label">ปีการศึกษา:</span>
                            <select
                                value={selectedYear}
                                onChange={handleYearChange}
                                className="year-select"
                            >
                                {academicYears.length > 0 ? (
                                    academicYears.map(y => <option key={y} value={y}>{y}</option>)
                                ) : (
                                    <option value={selectedYear}>{selectedYear}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="cards-grid-container">
                        {filteredMyAdvisees.length === 0 ? (
                            <div className="empty-state-card">
                                ไม่พบกลุ่มในที่ปรึกษา สำหรับปีการศึกษา {selectedYear}
                            </div>
                        ) : (
                            filteredMyAdvisees.map(group => (
                                <AdvisorCardWrapper 
                                    key={group.group_project?.ID}
                                    selectionData={group}
                                    type="accepted"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* --- Section 2: คำขอที่รอการพิจารณา --- */}
                  <div className="dashboard-section">
                    <div className="section-header-with-action">
                        <div className="section-title pending">
                            คำขอที่รอการพิจารณา
                            {filteredPendingRequests.length > 0 && (
                                <span className="request-count-badge">({filteredPendingRequests.length})</span>
                            )}
                        </div>

                        <button 
                            className={`status-toggle-btn ${isAccepting ? 'is-open' : 'is-closed'}`}
                            onClick={handleToggleStatus}
                        >
                            {isAccepting ? (
                                <>
                                    <span>🟢</span> เปิดรับสมัคร
                                </>
                            ) : (
                                <>
                                    <span>🔴</span> ปิดรับสมัคร
                                </>
                            )}
                        </button>
                    </div>
                    
                    <div className="cards-grid-container">
                        {filteredPendingRequests.length === 0 ? (
                            <div className="empty-state-card">
                                ไม่มีคำขอใหม่ในขณะนี้ (ปีการศึกษา {selectedYear})
                            </div>
                        ) : (
                            filteredPendingRequests.map(request => (
                                <AdvisorCardWrapper 
                                    key={request.ID}
                                    selectionData={request}
                                    type="pending"
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                />
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeacherSelectPage;