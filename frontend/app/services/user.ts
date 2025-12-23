import api from "./api";
import type { UserProfileInterface } from "../interfaces/Users";
import {CreateUserInterface, GenderInterface, RoleInterface, BranchInterface, StatusInterface} from "../interfaces/Users";

async function GetUserProfile() {
    // URL "/profile" ต้องตรงกับที่ backend กำหนดใน r.GET(...)
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

// GET: ดึงข้อมูล User ทั้งหมด (Admin)
async function GetUsers() {
    return await api.get("/admin/users");
}

async function CreateUser(data: CreateUserInterface) {
    // กำหนด ID ของ Role Admin (ต้องเช็คใน DB ว่าเลขอะไร ปกติคือ 1)
    const ADMIN_ROLE_ID = 1; 

    if (data.role_id === ADMIN_ROLE_ID) {
        // Throw Error เพื่อให้หน้า Form จับได้แล้วแจ้งเตือน
        throw new Error("Access Denied: ไม่อนุญาตให้สร้างผู้ดูแลระบบ (Admin) ผ่านช่องทางนี้");
    }

    return await api.post("/admin/user", data);
}

// ✅ ใหม่: DELETE ลบ User ตาม ID
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
    GetUsers,
    GetUserProfile,
    UpdateUserProfile,
    ImportUsersCSV,
    CreateUser,
    DeleteUser
};