// services/https/group/index.ts
import api from "./api"; // import ตัว axios ที่คุณตั้งค่า interceptor ไว้
import { GroupProject } from "../interfaces/Group"; 

// ดึงข้อมูลกลุ่มทั้งหมด
export const GetGroupProjects = async () => {
    // URL ต้องตรงกับที่ Backend router ตั้งไว้ (จาก GroupController.GetGroupProject)
    // ผมสมมติว่าเป็น "/groupProject" ตาม Convention
    return await api.get<GroupProject[]>("/student/group"); 
};

// กดเข้าร่วมกลุ่ม
export const JoinGroup = async (data: { group_project_id: number }) => {
    // URL ตามที่คุณใช้ใน Postman
    return await api.post("/student/addMember", data);
};