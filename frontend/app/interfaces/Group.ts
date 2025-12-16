// interfaces/IGroup.ts

export interface User {
  ID: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  // เพิ่ม field อื่นๆ ของ User ตามต้องการ
}

export interface GroupMember {
  ID: number;
  student_id: number;
  student?: User; // Preloaded มาจาก Backend
  leader: boolean;
  group_project_id: number;
}

export interface GroupProject {
  ID: number;
  group_number: number;
  year: number;
  group_status: string;
  membership: number; // จำนวนที่รับ (3 หรือ 5)
  teacher_id?: number;
  teacher?: User;
  group_members: GroupMember[]; // รายชื่อสมาชิกในกลุ่ม
}


// ---- Admin ----

// Interface สำหรับผลการค้นหานักศึกษา (ที่ยังไม่มีกลุ่ม)
export interface StudentSearchResult {
  ID: number;
  firstname: string;
  lastname: string;
  username: string; // รหัสนักศึกษา
}

// Payload: เพิ่มสมาชิก (Admin)
export interface AddMemberRequest {
  group_project_id: number;
  student_id: number; // หรือจะใช้ username ก็ได้ ขึ้นอยู่กับ Backend
  bypass_quota?: boolean; // true = ยัดเข้ากลุ่มแม้จะเต็มแล้ว
}

// Payload: เปลี่ยนหัวหน้า
export interface ChangeLeaderRequest {
  group_project_id: number;
  new_leader_id: number; // ID ของสมาชิกคนที่จะให้เป็นหัวหน้า
}

// Payload: ลบสมาชิก
export interface RemoveMemberRequest {
  group_project_id: number;
  student_id: number;
}

// Response จำนวนนักศึกษา
export interface StudentCountResponse {
  count: number;
}

// Payload สร้างกลุ่ม
export interface GenerateGroupRequest {
  year: number;
  count_5: number;
  count_4: number;
  count_3: number;
}

// Interface สำหรับ Response หลังสร้างกลุ่มเสร็จ
export interface GenerateGroupResponse {
  message: string;
  year: number;
  last_group_number: number;
}