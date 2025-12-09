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