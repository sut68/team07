import api from "./api";
import { 
    Teacher, 
    AdvisorSelectionPayload, 
    SelectAdvisor, 
    AdvisorActionRequest, 
    AdvisorStatusRequest
} from "../interfaces/Advisor";


export const GetAllTeachers = async () => {
    return await api.get<{ data: Teacher[] }>("/student/teachers/search");
};

export const SaveAdvisorSelection = async (data: AdvisorSelectionPayload) => {
    return await api.post("/student/select", data);
};

export const GetAdvisorSelection = async (groupId: number) => {
    return await api.get<{ data: SelectAdvisor[] }>(`/student/selection/${groupId}`);
};


// ส่วนของอาจารย์ (Teacher View)

// 1. ดึงรายการคำขอที่เข้ามา (Incoming Requests)
export const GetAdvisorRequests = async () => {
  // แก้จาก AdvisorSelection -> SelectAdvisor ให้ตรงกับที่ import มา
  return await api.get<{ data: SelectAdvisor[] }>("/teacher/requests");
};

// 2. กด "อนุมัติ" (Accept)
export const AcceptRequest = async (data: AdvisorActionRequest) => {
  return await api.post("/teacher/request/accept", data);
};

// 3. กด "ปฏิเสธ" (Reject)
export const RejectRequest = async (data: AdvisorActionRequest) => {
  return await api.post("/teacher/request/reject", data);
};

// 4. กด "ปิด/เปิด" รับสมัคร (Toggle Status)
export const ToggleAdvisorStatus = async (data: AdvisorStatusRequest) => {
  return await api.post("/teacher/status/toggle", data);
};