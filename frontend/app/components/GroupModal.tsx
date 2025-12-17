import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
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

  // --- [Teacher State] ---
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
        
        // const Toast = Swal.mixin({
        //     toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
        // });
        // Toast.fire({ icon: 'success', title: 'บันทึกข้อมูลอาจารย์ที่ปรึกษาเรียบร้อยแล้ว' });

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
        console.warn("Available students data is not an array:", res.data);
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
          text: "คุณต้องการบังคับเพิ่มสมาชิกรายนี้หรือไม่? (Over Quota)",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "ยืนยัน (สิทธิ์ผู้ดูแลระบบ)",
          cancelButtonText: "ยกเลิก"
        });

        if (confirm.isConfirmed) {
          try {
            await callAddApi(true); 
            await fetchGroupData();
            await fetchAvailableStudents();
            Swal.fire("สำเร็จ", "เพิ่มสมาชิกโดยสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว", "success");
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
        Swal.fire("สำเร็จ", "เปลี่ยนหัวหน้ากลุ่มเรียบร้อยแล้ว", "success");
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
               จัดการข้อมูลกลุ่ม: {loading ? "..." : `G-${group?.group_number}`}
            </h2>
            <p className="text-sm text-gray-500">ปีการศึกษา {group?.year}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading && <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>}

          {!loading && group && (
            <div className="flex flex-col gap-6">

              {/* --- [Advisor Selection Section] --- */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-amber-800 mb-2 flex items-center gap-2">
                    🎓 อาจารย์ที่ปรึกษาโครงงาน
                </h3>
                <div className="relative">
                    <select
                        value={selectedTeacherId}
                        onChange={handleTeacherChange}
                        className="w-full border border-amber-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white appearance-none cursor-pointer"
                    >
                        <option value="">-- ยังไม่ระบุอาจารย์ที่ปรึกษา --</option>
                        {teachers.map((t) => (
                            <option key={t.ID} value={t.ID}>
                                {t.firstname} {t.lastname}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
              </div>

              {/* --- Members Section --- */}
              <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-800">สมาชิกในกลุ่ม</h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${memberCount > group.membership ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {memberCount} / {group.membership} คน
                        {memberCount > group.membership && " (เกินจำนวนที่กำหนด)"}
                    </span>
                </div>
                
                <div className="space-y-2">
                    {members.length === 0 && <div className="text-gray-400 text-sm italic border border-dashed border-gray-300 p-4 rounded text-center">ยังไม่มีสมาชิกในกลุ่ม</div>}
                    
                    {members.map((member) => (
                    <div key={member.ID} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs border border-blue-100">
                                        {member.student?.username}
                                    </span>
                                    {member.student?.firstname} {member.student?.lastname}
                                    {member.leader && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">👑 หัวหน้ากลุ่ม</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!member.leader && (
                                <button 
                                    onClick={() => handlePromote(member)} 
                                    className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition font-medium"
                                >
                                    ตั้งเป็นหัวหน้า
                                </button>
                            )}
                            <button 
                                onClick={() => handleRemoveMember(member)} 
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
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

              <hr className="border-gray-100 my-2" />

              {/* --- Add Member Section --- */}
              <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    เพิ่มสมาชิกใหม่ 
                    <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        ( รายชื่อนักศึกษาที่ยังไม่มีกลุ่มในปี {group.year} )
                    </span>
                 </h3>
                 
                 <div className="border border-gray-300 rounded-lg h-64 overflow-y-auto bg-gray-50 p-2 custom-scrollbar shadow-inner">
                    
                    {loadingStudents ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                            <span className="text-sm">กำลังโหลดรายชื่อ...</span>
                        </div>
                    ) : !Array.isArray(availableStudents) || availableStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p>ไม่พบรายชื่อนักศึกษาที่ว่าง หรือ ตรงตามเงื่อนไข</p>
                            <p className="text-xs mt-1">นักศึกษาทุกคนมีกลุ่มแล้ว หรือยังไม่มีสิทธิ์ลงทะเบียน</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {availableStudents.map((s) => (
                                <div key={s.ID} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 hover:border-green-400 hover:shadow-md transition-all group">
                                    
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs border border-blue-100">
                                                    {s.username}
                                                </span>
                                                {s.firstname} {s.lastname}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleAddMember(s)}
                                        className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                    >
                                        <span>+ เพิ่มเข้ากลุ่ม</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

              {/* --- Danger Zone --- */}
              <div className="mt-4 pt-4 border-t border-red-100">
                   <div className="flex justify-between items-center">
                        <div>
                             <p className="text-xs text-gray-400">การลบกลุ่มจะไม่สามารถกู้คืนข้อมูลได้</p>
                        </div>
                        <button 
                            onClick={handleDeleteGroup} 
                            className="text-red-500 text-sm bg-red-300 hover:bg-red-500 px-3 py-2 rounded border-2 transition flex items-center gap-1 font-medium"
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