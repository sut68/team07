'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { GetMyGroup } from '../../../services/group'; 
import { GetAllTeachers, SaveAdvisorSelection, GetAdvisorSelection } from '../../../services/advisor';
import { GroupProject } from '../../../interfaces/Group';
import { Teacher } from '../../../interfaces/Advisor';
import GroupCard from '../../../components/GroupCard';
import '../../../style/StudentSelectAdvisorPage.css';

// Helper: แกะ ID จาก Token
const getCurrentUserId = () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload).id;
    } catch (e) {
        return null;
    }
};

const AdvisorSelectionPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [myGroup, setMyGroup] = useState<GroupProject | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    
    // State สำหรับฟอร์ม
    const [selections, setSelections] = useState<(number | "")[]>(Array(10).fill(""));
    const [description, setDescription] = useState("");
    
    // State เช็คว่าเคยบันทึกไปแล้วหรือยัง
    const [isAlreadySelected, setIsAlreadySelected] = useState(false);

    useEffect(() => {
        const uid = getCurrentUserId();
        if (uid) {
            setCurrentUserId(uid);
        }
        initData(uid || 0);
    }, []);

    const initData = async (uid: number) => {
        setLoading(true);
        try {
            // --- 1. ดึงรายชื่ออาจารย์ ---
            try {
                const resTeachers = await GetAllTeachers();
                const teacherList = (resTeachers.data as any).data || resTeachers.data;
                if (Array.isArray(teacherList)) {
                    setTeachers(teacherList);
                }
            } catch (err) {
                console.error("Failed to fetch teachers:", err);
            }

            // --- 2. ดึงข้อมูลกลุ่มของนักศึกษา ---
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

            // --- 3. ดึงข้อมูลการเลือกอาจารย์เดิม (ถ้ามี) ---
            if (groupID > 0) {
                try {
                    const resSelection = await GetAdvisorSelection(groupID);
                    const selectionData = (resSelection.data as any).data || resSelection.data;

                    if (Array.isArray(selectionData) && selectionData.length > 0) {
                        setIsAlreadySelected(true);
                        
                        // Map ข้อมูลลง State
                        const newSelections = Array(10).fill("");
                        // ใส่ข้อมูลตามลำดับ No (1-10)
                        selectionData.forEach((item: any) => {
                            if (item.No >= 1 && item.No <= 10) {
                                newSelections[item.No - 1] = item.TeacherID || item.teacher_id;
                            }
                        });
                        setSelections(newSelections);

                        // ใส่ Description (เอาจาก row แรก)
                        if (selectionData[0]?.Description) {
                            setDescription(selectionData[0].Description);
                        }
                    }
                } catch (err) {
                    console.log("No existing selection found.");
                }
            }

        } catch (error) {
            console.error("Error init data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChange = (index: number, value: string) => {
        // ถ้าเคยเลือกไปแล้ว ห้ามแก้ (Optional: ถ้าอยากให้แก้ได้ ลบเงื่อนไขนี้ออก)
        // if (isAlreadySelected) return; 

        const newSelections = [...selections];
        newSelections[index] = value === "" ? "" : parseInt(value);
        setSelections(newSelections);
    };

    const isTeacherSelected = (teacherId: number, currentIndex: number) => {
        return selections.some((sel, idx) => sel === teacherId && idx !== currentIndex);
    };

    const handleClear = () => {
        if (isAlreadySelected) {
            Swal.fire("ไม่สามารถล้างข้อมูลได้", "เนื่องจากคุณได้ทำการยืนยันการเลือกไปแล้ว", "warning");
            return;
        }
        setSelections(Array(10).fill(""));
        setDescription("");
        Swal.fire({ icon: 'success', title: 'ล้างข้อมูล', timer: 1000, showConfirmButton: false });
    };

    const handleSubmit = async () => {
        // ดึง ID สดๆ อีกรอบเพื่อความชัวร์ แก้ปัญหา "กรุณาเข้าสู่ระบบ" มั่ว
        const uid = getCurrentUserId(); 

        // 1. เช็ค Login
        if (!uid) {
            Swal.fire({
                icon: "warning",
                title: "กรุณาเข้าสู่ระบบ",
                text: "ระบบไม่พบข้อมูลผู้ใช้งานของคุณ",
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // 2. เช็คว่ามีกลุ่มไหม
        if (!myGroup) {
            Swal.fire({
                icon: "error",
                title: "คุณยังไม่มีกลุ่มโครงงาน",
                text: "กรุณาเข้าร่วมกลุ่มหรือสร้างกลุ่มก่อนทำการเลือกอาจารย์ที่ปรึกษา",
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // 3. เช็คว่าเป็นหัวหน้ากลุ่มไหม
        const me = myGroup.group_members?.find((m: any) => m.student_id === uid);
        if (!me || !me.leader) {
            Swal.fire({
                icon: "error",
                title: "คุณไม่ใช่หัวหน้ากลุ่มโครงงาน",
                text: "ไม่มีสิทธิ์ในการเลือกอาจารย์ที่ปรึกษา (เฉพาะหัวหน้ากลุ่มเท่านั้น)",
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // --- [เงื่อนไขใหม่ 1] เช็คจำนวนสมาชิกในกลุ่ม ---
        // เช็คจำนวนคนปัจจุบัน vs จำนวนที่รับสมัคร (membership)
        // เช่น รับ 3 คน ต้องมี 3 คนขึ้นไป (ปกติจะไม่เกินอยู่แล้ว แต่เงื่อนไขบอก 'ไม่น้อยกว่า')
        const currentMemberCount = myGroup.group_members?.length || 0;
        if (currentMemberCount < myGroup.membership) {
            Swal.fire({
                icon: "warning",
                title: "สมาชิกในกลุ่มยังไม่ครบ",
                text: `กลุ่มของคุณรับสมัคร ${myGroup.membership} คน แต่ปัจจุบันมี ${currentMemberCount} คน กรุณาหาสมาชิกให้ครบก่อน`,
                confirmButtonText: "เข้าใจแล้ว"
            });
            return;
        }

        // --- [เงื่อนไขใหม่ 3] เช็คว่าเคยเลือกไปแล้วหรือยัง ---
        if (isAlreadySelected) {
            Swal.fire({
                icon: "info",
                title: "ดำเนินการไปแล้ว",
                text: "กลุ่มของคุณได้ทำการเลือกลำดับอาจารย์ที่ปรึกษาเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง"
            });
            return; // จบการทำงาน ไม่ให้บันทึกซ้ำ
        }

        // --- [เงื่อนไขใหม่ 2] เช็คข้อมูลครบ 10 คน + รายละเอียด ---
        const selectedAdvisors = selections.filter(s => s !== "") as number[];
        
        // ต้องครบ 10 คน
        if (selectedAdvisors.length < 10) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบถ้วน",
                text: `กรุณาเลือกอาจารย์ที่ปรึกษาให้ครบทั้ง 10 ลำดับ (ปัจจุบันเลือกไป ${selectedAdvisors.length} ท่าน)`,
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // ต้องมีรายละเอียด
        if (!description.trim()) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบถ้วน",
                text: "กรุณาระบุรายละเอียดโครงงานที่ต้องการทำ",
                confirmButtonText: "ตกลง"
            });
            return;
        }

        // 5. บันทึก
        Swal.fire({
            title: "ยืนยันการบันทึก?",
            text: "ข้อมูลลำดับอาจารย์จะถูกบันทึกเข้าระบบ",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#00a8ff",
            cancelButtonColor: "#d33",
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await SaveAdvisorSelection({
                        group_project_id: myGroup.ID,
                        description: description,
                        advisor_order: selectedAdvisors
                    });
                    
                    Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
                    
                    // อัปเดตสถานะว่าเลือกแล้ว และรีโหลดข้อมูลเพื่อความชัวร์
                    setIsAlreadySelected(true);
                    initData(uid);

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
                
                {/* Header */}
                <div className="page-header-advisor">
                    <div className="red-bar"></div>
                    <div className="header-text">
                        <h1>เลือกอาจารย์ที่ปรึกษา</h1>
                        <p>โปรดเลือกอาจารย์ตามลำดับที่กำหนดไว้</p>
                    </div>
                </div>

                <div className="columns-container">
                    
                    {/* Left Column */}
                    <div className="left-column">
                        <div className="selection-form">
                            {selections.map((sel, index) => (
                                <div key={index} className="form-group">
                                    <label className="form-label">ลำดับที่ {index + 1}</label>
                                    <select 
                                        className="advisor-select"
                                        value={sel}
                                        onChange={(e) => handleSelectChange(index, e.target.value)}
                                        disabled={isAlreadySelected} // ถ้าเลือกไปแล้ว ห้ามแก้
                                        style={isAlreadySelected ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                                    >
                                        <option value="">-- เลือกอาจารย์ --</option>
                                        {teachers.map((t: any) => {
                                            const tId = t.ID || t.id;
                                            return (
                                                <option 
                                                    key={tId} 
                                                    value={tId}
                                                    disabled={isTeacherSelected(tId, index)}
                                                    style={isTeacherSelected(tId, index) ? {color: '#ccc'} : {}}
                                                >
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
                                    className="project-desc-textarea"
                                    placeholder="ระบุรายละเอียด..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isAlreadySelected} // ถ้าเลือกไปแล้ว ห้ามแก้
                                    style={isAlreadySelected ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                                />
                            </div>

                            <div className="form-actions">
                                <button 
                                    className="btn-clear" 
                                    onClick={handleClear}
                                    disabled={isAlreadySelected}
                                    style={isAlreadySelected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    เคลียร์ข้อมูล
                                </button>
                                <button className="btn-submit" onClick={handleSubmit}>
                                    {isAlreadySelected ? "บันทึกข้อมูลแล้ว" : "ยืนยัน"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        
                        {/* Group Card */}
                        {myGroup ? (
                            <div style={{ marginBottom: '20px' }}>
                                <GroupCard 
                                    group={myGroup} 
                                    currentUserId={currentUserId}
                                    globalUserHasGroup={true}
                                    hideAction={true} 
                                    onJoin={() => {}} 
                                />
                            </div>
                        ) : (
                            <div style={{ padding: '30px', background: 'white', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px dashed #ccc' }}>
                                <p style={{color: '#888', margin: 0, fontSize: '16px'}}>ยังไม่มีข้อมูลกลุ่ม</p>
                                <p style={{color: '#bbb', fontSize: '12px', marginTop: '5px'}}>กรุณาสร้างหรือเข้าร่วมกลุ่มก่อน</p>
                            </div>
                        )}

                        {/* Summary Card */}
                        <div className="selection-summary-card">
                            <h3 className="summary-title">ลำดับของอาจารย์ที่เลือก</h3>
                            <div style={{ paddingLeft: '10px' }}>
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
                                {selections.every(s => s === "") && <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>ยังไม่ได้เลือกอาจารย์</p>}
                            </div>
                        </div>

                    </div>
                </div> 
            </div>
        </div>
    );
};

export default AdvisorSelectionPage;