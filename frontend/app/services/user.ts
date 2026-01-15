import api from "./api";
import type { UserProfileInterface } from "../interfaces/Users";
import {CreateUserInterface, GenderInterface, RoleInterface, BranchInterface, StatusInterface} from "../interfaces/Users";

async function GetUserProfile() {
    return await api.get("/getUserProfile");
}

async function UpdateUserProfile(data: UserProfileInterface) {
    return await api.patch("/updateUserProfile", data);
}

// ฟังก์ชันสำหรับ Upload CSV
async function ImportUsersCSV(file: File) {
    const formData = new FormData();
    formData.append("file", file); // ชื่อ "file" ต้องตรงกับ backend c.FormFile("file")

    return await api.post("/admin/importUsersCSV", formData);
}

// GET: ดึงข้อมูล User ทั้งหมด หรือใช้ params สำหรับการค้นหา/กรอง
// params example: { q?: string, gender_id?: number, branch_id?: number, role_id?: number, status_id?: number }
async function ListUsers(params?: Record<string, any>) {
    return await api.get("/admin/users", { params });
}

async function CreateUser(data: CreateUserInterface) {
    // กำหนด ID ของ Role Admin
    const ADMIN_ROLE_ID = 1; 

    if (data.role_id === ADMIN_ROLE_ID) {
        // Throw Error เพื่อให้หน้า Form จับได้แล้วแจ้งเตือน
        throw new Error("Access Denied: ไม่อนุญาตให้สร้างผู้ดูแลระบบ (Admin) ผ่านช่องทางนี้");
    }

    return await api.post("/admin/user", data);
}

// ฟังก์ชันแก้ไขข้อมูล User (Admin)
async function UpdateUser(id: number, data: { firstname: string; lastname: string; status_id: number }) {
    return await api.patch(`/admin/user/${id}`, data);
}

// DELETE ลบ User ตาม ID
async function DeleteUser(id: number) {
    return await api.delete(`/admin/user/${id}`);
}

async function GetGenders() {
    return await api.get("/admin/genders");
}

async function GetBranches() {
    return await api.get("/admin/branches");
}

async function GetRoles() {
    return await api.get("/admin/roles");
}

async function GetUserStatuses() {
    return await api.get("/admin/statuses");
}

export {
    GetGenders,
    GetBranches,
    GetRoles,
    GetUserStatuses,
    ListUsers,
    GetUserProfile,
    UpdateUserProfile,
    ImportUsersCSV,
    CreateUser,
    DeleteUser,
    UpdateUser
};