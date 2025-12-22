import { User,GroupProject } from "./Group";

export interface Teacher extends User {
}

export interface AdvisorSelectionPayload {
    group_project_id: number;
    description: string;
    advisor_order: number[]; 
}

export interface SelectAdvisor {
    ID: number;
    CreatedAt?: string;
    UpdatedAt?: string;
    DeletedAt?: string | null;

    no: number;             // ลำดับ (1-10)
    description: string;    // รายละเอียด
    status: string;         // 'pending', 'accepted', 'rejected', 'skipped' (สำคัญ!)

    group_project_id: number;
    group_project?: GroupProject; // ข้อมูลกลุ่ม (สำคัญ! ต้องมีเพื่อเอาไปแสดงในการ์ด)

    teacher_id: number;
    teacher?: Teacher;      // ข้อมูลอาจารย์
}

// Teacher's view

// 2. สำหรับ Payload เวลาจะกด Accept/Reject
export interface AdvisorActionRequest {
  selection_id: number;
}

// 3. สำหรับ Payload เวลาจะกด ปิด/เปิด รับสมัคร
export interface AdvisorStatusRequest {
  is_open: boolean;
}