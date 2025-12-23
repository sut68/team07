export interface User {
  ID: number;
  firstname?: string;
  lastname?: string;
  username?: string;

}

export interface GroupMember {
  ID: number;
  student_id: number;
  student?: User; 
  leader: boolean;
  group_project_id: number;
}

export interface GroupProject {
  ID: number;
  group_number: number;
  year: number;
  group_status: string;
  membership: number; 
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
  username: string; 
}

// Payload: เพิ่มสมาชิก (Admin)
export interface AddMemberRequest {
  group_project_id: number;
  student_id: number; 
  bypass_quota?: boolean; 
}

// Payload: เปลี่ยนหัวหน้า
export interface ChangeLeaderRequest {
  group_project_id: number;
  new_leader_id: number; 
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