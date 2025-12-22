// services/https/group/index.ts
import api from "./api";
import {
    GroupProject,
    StudentCountResponse,
    GenerateGroupRequest,
    GenerateGroupResponse,
    StudentSearchResult,
    AddMemberRequest,
    ChangeLeaderRequest,
    RemoveMemberRequest,
    User
} from "../interfaces/Group";

// **** Group ****
// ดึงข้อมูลกลุ่มทั้งหมด
export const GetGroupProjects = async (year?: number) => {
    const url = year ? `/group?year=${year}` : "/student/group";
    return await api.get<GroupProject[]>(url);
};

// กดเข้าร่วมกลุ่ม
export const JoinGroup = async (data: { group_project_id: number }) => {
    return await api.post("/student/addMember", data);
};

// ดึงกลุ่มของฉัน (Student Logged In)
export const GetMyGroup = async () => {
    // Backend returns { data: GroupProject }
    // Note: The backend returns { data: GroupProject } structure.
    return await api.get<{ data: GroupProject }>("/student/myGroup");
};

// ดึงปี
export const GetAcademicYears = async () => {
    return await api.get<number[]>("/academicYears");
};

// ------------------------------------------------------------------------

// **** Admin ****

// 0. ดึงรายละเอียดกลุ่มรายตัว (เพื่อโหลดข้อมูลใหม่หลังแก้ไข)
export const GetGroupDetailById = async (id: number) => {
    return await api.get<GroupProject>(`/admin/group/${id}`);
};

// 1. ดึงจำนวนนักศึกษา (Stat)
export const GetEligibleStudentCount = async () => {
    return await api.get<StudentCountResponse>("/admin/studentCount");
};

// 2. สร้างกลุ่ม (Random/Generate)
export const GenerateGroups = async (data: GenerateGroupRequest) => {
    return await api.post<GenerateGroupResponse>("/admin/generateGroups", data);
};

// 3. ค้นหานักศึกษาที่ยังไม่มีกลุ่ม (ต้องส่งปีไปด้วย)
export const SearchAvailableStudents = async (year: number) => {
    return await api.get<StudentSearchResult[]>(`/admin/students/search?year=${year}`);
};

// 4. เพิ่มสมาชิกเข้ากลุ่ม (Admin Override)
export const AdminAddMember = async (data: AddMemberRequest) => {
    return await api.post("/admin/group/addMember", data);
};

// 5. ลบสมาชิกออกจากกลุ่ม
export const AdminRemoveMember = async (data: RemoveMemberRequest) => {
    return await api.post("/admin/group/removeMember", data);
};

// 6. เปลี่ยนหัวหน้ากลุ่ม
export const AdminChangeLeader = async (data: ChangeLeaderRequest) => {
    return await api.post("/admin/group/changeLeader", data);
};

// 7. ลบกลุ่มทิ้ง (Danger)
export const AdminDeleteGroup = async (id: number) => {
    return await api.delete(`/admin/group/${id}`);
};

// ส่วนในการดึงข้อมูลอาจารย์
export const GetAllTeachers = async () => {
    return await api.get<{ data: User[] }>("/admin/teachers/search");
};

// 2. อัปเดตอาจารย์ประจำกลุ่ม
export const UpdateGroupAdvisor = async (data: { group_project_id: number; teacher_id: number | null }) => {
    return await api.post("/admin/group/updateAdvisor", data);
};


// อัปเดตสถานะกลุ่ม  ของหนึ่งนะเอ อย่าลบ
export const UpdateGroupStatus = async (groupId: number, status: string) => {
    return await api.patch(`/teacher/groups/${groupId}/status`, { status });
};