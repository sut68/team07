import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../style/AdminGroupModal.css";

import { 
  GroupProject, 
  StudentSearchResult, 
  GroupMember,
  User 
} from "../interfaces/Group"; 

import { 
  GetGroupDetailById, 
  SearchAvailableStudents, 
  AdminAddMember, 
  AdminRemoveMember, 
  AdminChangeLeader, 
  AdminDeleteGroup,
  GetAllTeachers,     
  UpdateGroupAdvisor  
} from "../services/group"; 
interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
}

const GroupManagementModal = ({ isOpen, onClose, groupId }: Props) => {
  const [group, setGroup] = useState<GroupProject | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Student State
  const [availableStudents, setAvailableStudents] = useState<StudentSearchResult[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Teacher State
  const [teachers, setTeachers] = useState<User[]>([]); 
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | string>(""); 

  // 1. Open Modal -> Load Group Data & Load Teachers
  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupData();
      fetchTeachers();
      setAvailableStudents([]); 
    }
  }, [isOpen, groupId]);

  // 2. Sync Teacher ID when group data is loaded
  useEffect(() => {
    if (group) {
        setSelectedTeacherId(group.teacher_id || ""); 
        
        if (group.year) {
            fetchAvailableStudents();
        }
    }
  }, [group]);

  // Function to load group data
  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const res = await GetGroupDetailById(groupId);
      if (res.data && (res.data as any).data) {
          setGroup((res.data as any).data);
      } else if (res.data) {
          setGroup(res.data as any);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลกลุ่มได้", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Function to load teachers list
  const fetchTeachers = async () => {
    try {
        const res = await GetAllTeachers();
        if (res.data && (res.data as any).data) {
            setTeachers((res.data as any).data);
        } else if (res.data) {
            setTeachers((res.data as any).data || res.data); 
        }
    } catch (error) {
        console.error("Error fetching teachers:", error);
    }
  };

  // Function to change advisor
  const handleTeacherChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeacherId = e.target.value;
    setSelectedTeacherId(newTeacherId); 

    try {
        await UpdateGroupAdvisor({
            group_project_id: groupId,
            teacher_id: newTeacherId ? parseInt(newTeacherId) : null
        });
        
        await fetchGroupData();
        Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลอาจารย์ที่ปรึกษา', timer: 1500, showConfirmButton: false });

    } catch (error) {
        console.error(error);
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลอาจารย์ได้", "error");
        setSelectedTeacherId(group?.teacher_id || "");
    }
  };

  // --- Student Management Functions ---

  const fetchAvailableStudents = async () => {
    if (!group) return;
    setLoadingStudents(true);
    try {
      const res = await SearchAvailableStudents(group.year);
      
      if (res.data && Array.isArray((res.data as any).data)) {
        setAvailableStudents((res.data as any).data);
      } else if (Array.isArray(res.data)) {
        setAvailableStudents(res.data);
      } else {
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error("Fetch available students failed:", error);
      setAvailableStudents([]); 
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddMember = async (student: StudentSearchResult) => {
    if (!group) return;

    const callAddApi = async (bypass: boolean) => {
      return await AdminAddMember({
        group_project_id: group.ID,
        student_id: student.ID,
        bypass_quota: bypass
      });
    };

    try {
      await callAddApi(false);
      await fetchGroupData();           
      await fetchAvailableStudents();   
      Swal.fire({ icon: 'success', title: 'เพิ่มสมาชิกเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });

    } catch (error: any) {
      const errCode = error.response?.data?.error;
      const errMsg = error.response?.data?.message;

      if (errCode === "OVER_QUOTA") {
        const confirm = await Swal.fire({
          title: "สมาชิกครบตามจำนวนแล้ว",
          text: "คุณต้องการบังคับเพิ่มสมาชิกรายนี้หรือไม่?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "ยืนยัน",
          cancelButtonText: "ยกเลิก"
        });

        if (confirm.isConfirmed) {
          try {
            await callAddApi(true); 
            await fetchGroupData();
            await fetchAvailableStudents();
            Swal.fire({ icon: 'success', title: 'เเพิ่มสมาชิกเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
          } catch (retryError) {
            Swal.fire("ข้อผิดพลาด", "ไม่สามารถเพิ่มสมาชิกได้", "error");
          }
        }
      } 
      else if (errCode === "DUPLICATE_YEAR_GROUP") {
        Swal.fire("ไม่สามารถเพิ่มได้", "นักศึกษาคนนี้มีกลุ่มในปีการศึกษานี้แล้ว", "error");
        await fetchAvailableStudents(); 
      }
      else {
        Swal.fire("ข้อผิดพลาด", errMsg || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
      }
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (member.leader) {
      Swal.fire("ไม่สามารถลบได้", "กรุณาแต่งตั้งหัวหน้ากลุ่มคนใหม่ ก่อนลบหัวหน้ากลุ่มคนปัจจุบัน", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการลบสมาชิก?",
      text: `ต้องการลบ ${member.student?.firstname} ออกจากกลุ่มหรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบออก",
      cancelButtonText: "ยกเลิก"
    });

    if (confirm.isConfirmed) {
      try {
        await AdminRemoveMember({
          group_project_id: group!.ID,
          student_id: member.student_id
        });
        
        await fetchGroupData();         
        await fetchAvailableStudents(); 
        
        Swal.fire({ icon: 'success', title: 'ลบสมาชิกเรียบร้อยแล้ว', timer: 1000, showConfirmButton: false });
      } catch (error) {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบสมาชิกได้", "error");
      }
    }
  };

  const handlePromote = async (member: GroupMember) => {
    const confirm = await Swal.fire({
      title: "เปลี่ยนหัวหน้ากลุ่ม?",
      text: `ต้องการแต่งตั้ง ${member.student?.firstname} เป็นหัวหน้ากลุ่มแทนคนเดิมหรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    });

    if (confirm.isConfirmed) {
      try {
        await AdminChangeLeader({
          group_project_id: group!.ID,
          new_leader_id: member.student_id
        });
        await fetchGroupData();
        Swal.fire({ icon: 'success', title: 'เปลี่ยนหัวหน้ากลุ่มเรียบร้อยแล้ว', timer: 1000, showConfirmButton: false });
      } catch (error) {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนหัวหน้ากลุ่มได้", "error");
      }
    }
  };

  const handleDeleteGroup = async () => {
    const confirm = await Swal.fire({
      title: "⚠️ ยืนยันลบกลุ่มนี้?",
      html: `การกระทำนี้ไม่สามารถย้อนกลับได้<br/>สมาชิกทุกคนในกลุ่ม G-${group?.group_number} จะมีสถานะเป็น 'ไม่มีกลุ่ม'`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ยืนยันลบกลุ่ม",
      cancelButtonText: "ยกเลิก"
    });

    if (confirm.isConfirmed) {
      try {
        await AdminDeleteGroup(groupId);
        Swal.fire("ลบกลุ่มแล้ว", "กลุ่มถูกลบออกจากระบบเรียบร้อยแล้ว", "success");
        onClose(); 
      } catch (error) {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบกลุ่มได้", "error");
      }
    }
  };

  if (!isOpen) return null;

  const members = group?.group_members || [];
  const memberCount = members.length;

return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header (เหมือนเดิม) */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
               จัดการข้อมูลกลุ่ม: {loading ? "..." : `G-${group?.group_number}`}
            </h2>
            <p className="modal-subtitle">ปีการศึกษา {group?.year}</p>
          </div>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* Content */}
        <div className="modal-content custom-scrollbar">
          {loading && <div className="loading-container">กำลังโหลดข้อมูล...</div>}

          {!loading && group && (
            <div className="flex-col-gap">

              {/* 🟡 1. Advisor Section (Yellow) */}
              <div className="section-box advisor-section">
                <h3 className="section-title text-advisor">
                   <div>🎓 อาจารย์ที่ปรึกษาโครงงาน</div>
                </h3>
                <div className="select-wrapper">
                    <select
                        value={selectedTeacherId}
                        onChange={handleTeacherChange}
                        className="advisor-select"
                    >
                        <option value="">-- ยังไม่ระบุอาจารย์ที่ปรึกษา --</option>
                        {teachers.map((t) => (
                            <option key={t.ID} value={t.ID}>
                                {t.firstname} {t.lastname}
                            </option>
                        ))}
                    </select>
                    <div className="select-icon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
              </div>

              <div className="section-box members-section">
                <div className="section-title text-members">
                    <div>👥 สมาชิกในกลุ่ม</div>
                    <span className="count-badge">
                        {memberCount} / {group.membership} คน
                        {memberCount > group.membership && " (เกินจำนวน)"}
                    </span>
                </div>
                
                <div className="members-list">
                    {members.length === 0 && <div className="empty-members">ยังไม่มีสมาชิกในกลุ่ม</div>}
                    
                    {members.map((member) => (
                    <div key={member.ID} className="member-card">
                        <div className="student-info">
                            <div>
                                <p className="student-name">
                                    <span className="code-badge">
                                        {member.student?.username}
                                    </span>
                                    {member.student?.firstname} {member.student?.lastname}
                                    {member.leader && <span className="leader-badge">👑 หัวหน้า</span>}
                                </p>
                            </div>
                        </div>
                        <div className="action-buttons">
                            {!member.leader && (
                                <button 
                                    onClick={() => handlePromote(member)} 
                                    className="btn-promote"
                                >
                                    ตั้งเป็นหัวหน้า
                                </button>
                            )}
                            <button 
                                onClick={() => handleRemoveMember(member)} 
                                className="btn-remove"
                                title="ลบสมาชิกออก"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
              </div>

              <div className="section-box add-member-section">
                 <h3 className="section-title text-add">
                    <div>
                        ➕ เพิ่มสมาชิกใหม่ 
                        <span className="add-member-subtitle">
                            ( รายชื่อนักศึกษาที่ยังไม่มีกลุ่มในปีการศึกษา {group.year} )
                        </span>
                    </div>
                 </h3>
                 
                 <div className="student-list-container custom-scrollbar">
                    {loadingStudents ? (
                        <div className="loading-list">
                            <div className="spinner"></div>
                            <span className="text-sm">กำลังโหลดรายชื่อ...</span>
                        </div>
                    ) : !Array.isArray(availableStudents) || availableStudents.length === 0 ? (
                        <div className="empty-list">
                            <p>ไม่พบรายชื่อนักศึกษาที่ว่าง</p>
                            <p className="text-xs mt-1">นักศึกษาทุกคนมีกลุ่มแล้ว หรือยังไม่มีสิทธิ์</p>
                        </div>
                    ) : (
                        <div>
                            {availableStudents.map((s) => (
                                <div key={s.ID} className="student-search-item">
                                    <div className="student-info">
                                        <div>
                                            <p className="student-name">
                                                <span className="code-badge">
                                                    {s.username}
                                                </span>
                                                {s.firstname} {s.lastname}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleAddMember(s)}
                                        className="btn-add"
                                    >
                                        <span>+ เพิ่มเข้ากลุ่ม</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

              <div className="section-box danger-zone">
                   <h3 className="section-title text-danger">
                        ⚠️ โซนอันตราย
                   </h3>
                   <div className="danger-content">
                        <div>
                             <p className="danger-warning">การลบกลุ่มจะไม่สามารถกู้คืนข้อมูลได้ สมาชิกทั้งหมดจะถูกลอยแพ</p>
                        </div>
                        <button 
                            onClick={handleDeleteGroup} 
                            className="btn-delete-group"
                        >
                            ลบกลุ่มทิ้ง
                        </button>
                   </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;