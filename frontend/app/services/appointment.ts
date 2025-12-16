import api from "./api";
import type {
    IAppointment,
    IAppointmentDetail,
    IRoom,
    IAppointmentType,
    IGroupSearchResult,
    ICreateAppointmentRequest,
    IAutoScheduleRequest,
    IUpdateAppointmentRequest
} from "../interfaces/Appointment";

// TEACHER: Appointment Management

// ดูรายการนัดหมายทั้งหมด (ของตัวเอง + Final)
async function GetListAppointments() {
    return await api.get<IAppointment[]>("/teacher/listAppointments");
}

// ดูรายละเอียดนัดหมายรายตัว (สำหรับ Modal)
async function GetAppointmentById(id: number | string) {
    return await api.get<IAppointmentDetail>(`/teacher/appointments/${id}`);
}

// ดึงข้อมูลห้อง (Dropdown)
async function GetRooms() {
    return await api.get<IRoom[]>("/teacher/rooms");
}

// ดึงประเภทการนัดหมาย (Dropdown)
async function GetAppointmentTypes() {
    return await api.get<IAppointmentType[]>("/teacher/appointmentTypes");
}

// ค้นหากลุ่มโครงงาน (Manual Search)
async function SearchGroup(keyword: string, typeId?: number, mode?: 'manual' | 'auto') {
    let url = `/teacher/groups/search?keyword=${keyword}`;
    if (typeId) url += `&type_id=${typeId}`;
    if (mode) url += `&mode=${mode}`;
    return await api.get<IGroupSearchResult[]>(url);
}

// สุ่มกลุ่ม (Random Button)
async function GetRandomGroup() {
    return await api.get<IGroupSearchResult>("/teacher/groups/random");
}

// สร้างการนัดหมาย (Manual Save)
async function CreateAppointment(data: ICreateAppointmentRequest) {
    return await api.post("/teacher/createAppointment", data);
}

// จัดตารางอัตโนมัติ (Auto Schedule)
async function AutoCreateAppointments(data: IAutoScheduleRequest) {
    return await api.post("/teacher/autoCreateAppointments", data);
}

// แก้ไขการนัดหมาย
async function UpdateAppointment(id: number | string, data: IUpdateAppointmentRequest) {
    return await api.patch(`/teacher/updateAppointment/${id}`, data);
}

// สร้างห้องใหม่ (Quick Create)
async function CreateRoom(data: Partial<IRoom>) {
    return await api.post("/teacher/createRoom", data);
}

// ยกเลิก/ลบการนัดหมาย
async function DeleteAppointment(id: number | string) {
    return await api.delete(`/teacher/deleteAppointment/${id}`);
}

// สร้างประเภทนัดหมายใหม่
async function CreateAppointmentType(data: { name: string }) {
    return await api.post("/teacher/createAppointmentTypes", data);
}

// ลบประเภทนัดหมาย
async function DeleteAppointmentType(id: number | string) {
    return await api.delete(`/teacher/deleteAppointmentTypes/${id}`);
}

// student

async function GetMyProjectAndAppointment() {
    const w = await api.get("/student/myAppointment")
    console.log("my appt: ", w)
    return await api.get("/student/myAppointment");
}

export {
    GetListAppointments,
    GetAppointmentById,
    GetRooms,
    GetAppointmentTypes,
    SearchGroup,
    GetRandomGroup,
    CreateAppointment,
    AutoCreateAppointments,
    UpdateAppointment,
    CreateRoom,
    DeleteAppointment,
    CreateAppointmentType,
    DeleteAppointmentType,
    GetMyProjectAndAppointment
};