'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { GetMyGroup } from '../../../services/group'; 
import { GetAllTeachers, SaveAdvisorSelection, GetAdvisorSelection } from '../../../services/advisor';
import { GroupProject } from '../../../interfaces/Group';
import { Teacher } from '../../../interfaces/Advisor';
import GroupCard from '../../../components/group/GroupCard';
import '../../../style/StudentSelectAdvisorPage.css';
import api from '../../../services/api'; 

const AdvisorSelectionPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [myGroup, setMyGroup] = useState<GroupProject | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    
    // State สำหรับฟอร์ม
    const [selections, setSelections] = useState<(number | "")[]>([]);
    const [description, setDescription] = useState("");
    const [isAlreadySelected, setIsAlreadySelected] = useState(false);

    // 1. เริ่มต้นโหลดข้อมูล
    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        setLoading(true);
        try {
            let uid = 0;
            try {
                const resMe = await api.get("/me");
                if (resMe.data && resMe.data.id) {
                    uid = resMe.data.id;
                    setCurrentUserId(uid);
                } else {
                    throw new Error("User ID not found");
                }
            } catch (authError) {
                console.error("DEBUG: Authentication failed:", authError);
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณาเข้าสู่ระบบ',
                    text: 'ไม่สามารถระบุตัวตนผู้ใช้ได้',
                    confirmButtonText: 'ตกลง'
                });
                setLoading(false);
                return; 
            }
            let currentTeachers: Teacher[] = [];
            try {
                const resTeachers = await GetAllTeachers();
                const teacherList = (resTeachers.data as any).data || resTeachers.data;
                if (Array.isArray(teacherList)) {
                    setTeachers(teacherList);
                    currentTeachers = teacherList;
                }
            } catch (err) {
                console.error("Failed to fetch teachers:", err);
            }
            let initialSelections = Array(currentTeachers.length).fill("");

            let groupID = 0;
            try {
                const resGroup = await GetMyGroup();
                const groupData = (resGroup.data as any).data || resGroup.data;
                
                if (groupData && groupData.ID) {
                    setMyGroup(groupData);
                    groupID = groupData.ID;
                }
            } catch (err) {
                console.log("User has no group yet.");
            }

            // --- 4. ดึงข้อมูลการเลือกเดิม (ถ้ามี) ---
            if (groupID > 0) {
                try {
                    const resSelection = await GetAdvisorSelection(groupID);
                    const selectionData = (resSelection.data as any).data || resSelection.data;

                    if (Array.isArray(selectionData) && selectionData.length > 0) {
                        setIsAlreadySelected(true);
                        const newSelections = Array(10).fill("");
                        selectionData.forEach((item: any) => {
                            const itemNo = item.no || item.No; 
                            const itemTeacherID = item.teacher_id || item.TeacherID;
                            if (itemNo >= 1 && itemNo <= 10) {
                                newSelections[itemNo - 1] = itemTeacherID;
                            }
                        });
                        setSelections(newSelections);
                        
                        if (selectionData[0]?.Description || selectionData[0]?.description) {
                            setDescription(selectionData[0].Description || selectionData[0].description);
                        }
                    }
                } catch (err) { /* No previous selection */ }
            }
            setSelections(initialSelections);

        } catch (error) {
            console.error("Error init data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChange = (index: number, value: string) => {
        if (isAlreadySelected) return;
        const newSelections = [...selections];
        newSelections[index] = value === "" ? "" : parseInt(value);
        setSelections(newSelections);
    };

    const isTeacherSelected = (teacherId: number, currentIndex: number) => {
        return selections.some((sel, idx) => sel === teacherId && idx !== currentIndex);
    };

    const handleClear = () => {
        if (isAlreadySelected) return;
        setSelections(Array(teachers.length).fill(""));
        setDescription("");
        Swal.fire({ icon: 'success', title: 'ล้างข้อมูลสำเร็จ', timer: 1000, showConfirmButton: false });
    };

    const handleSubmit = async () => {
        if (!currentUserId) {
            Swal.fire({ icon: "warning", title: "กรุณาเข้าสู่ระบบ", text: "ไม่พบข้อมูลผู้ใช้งาน (Session อาจหมดอายุ)", confirmButtonText: "ตกลง" });
            return;
        }

        if (!myGroup) {
            Swal.fire({ icon: "error", title: "คุณยังไม่มีกลุ่มโครงงาน", text: "กรุณาเข้าร่วมกลุ่มโครงงาน", confirmButtonText: "ตกลง" });
            return;
        }

        const me = myGroup.group_members?.find((m: any) => m.student_id === currentUserId);
        if (!me || !me.leader) {
            Swal.fire({ icon: "error", title: "สิทธิ์ไม่เพียงพอ", text: "เฉพาะหัวหน้ากลุ่มเท่านั้นที่สามารถทำรายการได้", confirmButtonText: "ตกลง" });
            return;
        }

        const currentMemberCount = myGroup.group_members?.length || 0;
        if (currentMemberCount < myGroup.membership) {
            Swal.fire({ icon: "warning", title: "สมาชิกกลุ่มยังไม่ครบ", text: `กลุ่มโครงงานของคุณต้องมีสมาชิกอย่างน้อย ${myGroup.membership} คน`, confirmButtonText: "ตกลง" });
            return;
        }

        if (isAlreadySelected) {
            Swal.fire({ icon: "info", title: "ดำเนินการไปแล้ว", text: "กลุ่มของคุณได้เลือกอาจารย์ไปเรียบร้อยแล้ว", confirmButtonText: "ตกลง" });
            return;
        }

        const selectedAdvisors = selections.filter(s => s !== "") as number[];
        if (selectedAdvisors.length < teachers.length || !description.trim()) {
            Swal.fire({ 
                icon: "warning", 
                title: "ข้อมูลไม่ครบ", 
                text: `กรุณาเลือกให้ครบ ${teachers.length} ท่าน และระบุรายละเอียดโครงงาน`, 
                confirmButtonText: "ตกลง" 
            });
            return;
    }

        // --- เตรียม HTML สำหรับแสดงใน Popup ---
        let advisorListHtml = "";
        selections.forEach((sel, index) => {
            if (sel !== "") {
                const teacher = teachers.find((t: any) => (t.ID || t.id) === sel);
                const teacherName = teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown";
                advisorListHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                        <span style="color: #666;">ลำดับที่ ${index + 1}</span>
                        <span style="font-weight: bold; color: #333;">${teacherName}</span>
                    </div>
                `;
            }
        });

        // --- แสดง Popup ยืนยัน ---
        Swal.fire({
            title: "ยืนยันข้อมูลการเลือก?",
            html: `
                <div style="text-align: left; font-size: 14px;">
                    <p style="font-weight: bold; margin-bottom: 5px; color: #8A011D;">รายละเอียดโครงงาน:</p>
                    <div style="background-color: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #ddd; max-height: 100px; overflow-y: auto;">
                        ${description}
                    </div>
                    
                    <p style="font-weight: bold; margin-bottom: 5px; color: #8A011D;">ลำดับอาจารย์ที่เลือก:</p>
                    <div style="max-height: 200px; overflow-y: auto; padding-right: 5px;">
                        ${advisorListHtml}
                    </div>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#00a8ff",
            cancelButtonColor: "#d33",
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            width: '500px'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await SaveAdvisorSelection({
                        group_project_id: myGroup.ID,
                        description: description,
                        advisor_order: selectedAdvisors
                    });
                    
                    await Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
                    initData();
                } catch (error: any) {
                    Swal.fire("เกิดข้อผิดพลาด", error.response?.data?.error || "ไม่สามารถบันทึกได้", "error");
                }
            }
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '10px', color: '#666' }}>
                <div className="spinner" style={{width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #8A011D', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                <span>กำลังโหลดข้อมูล...</span>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="advisor-selection-container">
            <div className="content-wrapper">
                <div className="page-header-advisor">
                    <div className="red-bar"></div>
                    <div className="header-text">
                        <h1>เลือกอาจารย์ที่ปรึกษา</h1>
                        <p>โปรดเลือกอาจารย์ตามลำดับที่กำหนดไว้</p>
                    </div>
                </div>

                <div className="columns-container">
                    <div className="left-column">
                        <div className="selection-form">
                            {selections.map((sel, index) => (
                                <div key={index} className="form-group">
                                    <label className="form-label">ลำดับที่ {index + 1}</label>
                                    <select 
                                        className={`advisor-select ${sel !== "" ? "has-value" : ""}`} 
                                        value={sel}
                                        onChange={(e) => handleSelectChange(index, e.target.value)}
                                        disabled={isAlreadySelected}
                                        style={isAlreadySelected ? { backgroundColor: '#f0f0f0' } : {}}
                                    >
                                        <option value="">-- เลือกอาจารย์ --</option>
                                        {teachers.map((t: any) => {
                                            const tId = t.ID || t.id;
                                            return (
                                                <option key={tId} value={tId} disabled={isTeacherSelected(tId, index)}>
                                                    {t.firstname} {t.lastname}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            ))}
                            <div className="form-group">
                                <label className="form-label">รายละเอียดโครงงานที่ต้องการทำ</label>
                                <textarea 
                                    className={`project-desc-textarea ${description.trim() !== "" ? "has-value" : ""}`}
                                    placeholder="ระบุรายละเอียด..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isAlreadySelected}
                                    style={isAlreadySelected ? { backgroundColor: '#f0f0f0' } : {}}
                                />
                            </div>
                            <div className="form-actions">
                                {!isAlreadySelected && <button className="btn-clear" onClick={handleClear}>เคลียร์ข้อมูล</button>}
                                <button 
                                    className="btn-submit" 
                                    onClick={handleSubmit}
                                    style={isAlreadySelected ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
                                >
                                    {isAlreadySelected ? "ได้เลือกลำดับอาจารย์ที่ปรึกษาไปแล้ว" : "ยืนยัน"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="right-column">
                        {myGroup ? (
                            <div style={{ marginBottom: '20px' }}>
                                <GroupCard 
                                    group={myGroup} 
                                    currentUserId={currentUserId}
                                    globalUserHasGroup={true}
                                    // hideAction={true} 
                                    onJoin={() => {}} 
                                />
                            </div>
                        ) : (
                            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#888', border: '1px dashed #ccc', marginBottom: '20px' }}>
                                --- ยังไม่มีข้อมูลกลุ่มโครงงาน ---
                            </div>
                        )}

                        {/* Summary Card */}
                        <div className="selection-summary-card">
                            <h3 className="summary-title">รายละเอียดการเลือกอาจารย์ที่ปรึกษา</h3>
                            <div style={{ paddingLeft: '10px' }}>
                                
                                {isAlreadySelected ? (
                                    <>
                                        <div style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                                                รายละเอียดโครงงาน:
                                            </p>
                                            <p style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap' }}>
                                                {description || "-"}
                                            </p>
                                        </div>

                                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '10px' }}>
                                            ลำดับอาจารย์:
                                        </p>
                                        {selections.map((sel, index) => {
                                            if (sel === "") return null;
                                            const teacher = teachers.find((t: any) => (t.ID || t.id) === sel);
                                            return (
                                                <div key={index} style={{ marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                                    <span style={{ fontWeight: 'bold', marginRight: '10px', color: '#8A011D' }}>{index + 1}.</span>
                                                    {teacher ? `อ.${teacher.firstname} ${teacher.lastname}` : '-'}
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                                        <p style={{ fontStyle: 'italic', marginBottom: '5px' }}>--- ยังไม่มีการบันทึกข้อมูล ---</p>
                                    </div>
                                )}
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvisorSelectionPage;