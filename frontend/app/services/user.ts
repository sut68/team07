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

    return await api.post("/admin/importUsersCSV", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

// GET: ดึงข้อมูล User ทั้งหมด (Admin)
async function GetUsers() {
    return await api.get("/admin/users");
}

// POST: สร้าง User ใหม่
async function CreateUser(data: CreateUserInterface) {
    return await api.post("/admin/user", data);
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
    CreateUser
};