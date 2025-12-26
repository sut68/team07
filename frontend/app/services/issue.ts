// services/issue.ts
import api from "./api"; // Import api instance ที่เราตั้งค่า baseURL ไว้แล้ว
import { CreateIssueInterface } from "../interfaces/Issue";

// GET: ดึงรายการแจ้งปัญหาทั้งหมด
async function GetIssues() {
    return await api.get("/issues");
}

// GET: ดึงรายการตาม ID
async function GetIssueById(id: string) {
    return await api.get(`/issues/${id}`);
}

// POST: สร้างรายการแจ้งปัญหา
async function CreateIssue(data: CreateIssueInterface) {
    return await api.post("/issues", data);
}

async function GetMyIssues() {
    return await api.get("/issues/my");
}

// PATCH: อัปเดตสถานะ + ข้อความตอบกลับ (Admin Only)
async function UpdateIssueStatus(id: number, statusID: number, adminReply?: string) {
    return await api.patch(`/admin/issues/${id}`, { 
        status_id: statusID,
        admin_reply: adminReply // ส่งข้อความตอบกลับไปด้วย
    });
}

// PATCH: แก้ไขรายละเอียดปัญหา (User Edit)
async function UpdateIssue(id: number, data: CreateIssueInterface) {
    return await api.patch(`/issues/${id}`, data);
}

export {
    GetIssues,
    GetIssueById,
    CreateIssue,
    GetMyIssues,
    UpdateIssueStatus,
    UpdateIssue
};