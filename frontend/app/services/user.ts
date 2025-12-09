import api from "./api";
import type { UserProfileInterface } from "../interfaces/Users";

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

export { 
    GetUserProfile,
    UpdateUserProfile,
    ImportUsersCSV
};