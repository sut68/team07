import api from "./api";
import type {
    IEvaluationProject,
    IEvaluationFormResponse,
    IEvaluationResultResponse,
    IEvaluationSummaryResponse,
    ISaveEvaluationRequest,
    ISaveEvaluationPeerRequest,
    ICreateCriteriaRequest,
    ICreateLevelRequest
} from "../interfaces/Evaluation";

// TEACHER:

async function GetEvaluationProjects(typeId?: number, mode?: 'advisor' | 'committee', year?: number) {
    let url = "/teacher/evaluation/projects";
    const params = new URLSearchParams();
    if (typeId) params.append("type_id", typeId.toString());
    if (mode) params.append("mode", mode);
    if (year) params.append("year", year.toString());
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    return await api.get<IEvaluationProject[]>(url);
}

async function GetEvaluationProjectYears(mode?: 'advisor' | 'committee') {
    let url = "/teacher/evaluation/projects/years";
    if (mode) {
        url += `?mode=${mode}`;
    }
    return await api.get<{years: number[]}>(url);
}

// ดึงฟอร์มประเมิน (เกณฑ์ + รายชื่อเด็ก)
async function GetEvaluationForm(appointmentId: number | string, evaluationName?: string, mode?: string) {
    let url = `/teacher/evaluation/form/${appointmentId}`;
    const params = new URLSearchParams();
    if (evaluationName) params.append("evaluation_name", evaluationName);
    if (mode) params.append("mode", mode);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    return await api.get<IEvaluationFormResponse>(url);
}

async function GetStudentEvaluationForm() {
    return await api.get<IEvaluationFormResponse>(`/student/evaluation/form`);
}

// ดึงคะแนนที่เคยกรอกไว้ (ดูย้อนหลัง/แก้ไข)
async function GetEvaluationResult(appointmentId: number | string) {
    return await api.get<IEvaluationResultResponse>(`/teacher/evaluation/result/${appointmentId}`);
}

// ดูสรุปผลคะแนนรวมของกลุ่ม (Average Calculation)
async function GetEvaluationSummary(groupProjectId: number | string) {
    return await api.get<IEvaluationSummaryResponse>(`/teacher/evaluation/summary/${groupProjectId}`);
}
async function GetStudentEvaluationResult() {
    return await api.get<IEvaluationResultResponse>(`/student/evaluation/result`);
}

// บันทึกคะแนน (Save)
async function SaveEvaluation(data: ISaveEvaluationRequest) {
    return await api.post("/teacher/evaluation/save", data);
}

// ดึงโครงสร้างเกณฑ์ทั้งหมด
async function ListCriteria() {
    return await api.get("/teacher/criteria");
}

// ดึงรายละเอียดเกณฑ์รายตัว (เพื่อแก้ไข)
async function GetCriteriaById(id: number | string) {
    return await api.get(`/teacher/criteria/${id}`);
}

// --- Criteria (หัวข้อคะแนน) ---
async function CreateCriteria(data: ICreateCriteriaRequest) {
    return await api.post("/teacher/createCriteria", data);
}

async function UpdateCriteria(id: number | string, data: Partial<ICreateCriteriaRequest>) {
    return await api.patch(`/teacher/updateCriteria/${id}`, data);
}

async function DeleteCriteria(id: number | string) {
    return await api.delete(`/teacher/deleteCriteria/${id}`);
}

// --- Criteria Level (ตัวเลือก Rubric) ---
async function CreateCriteriaLevel(data: ICreateLevelRequest) {
    return await api.post("/teacher/createCriteriaLevel", data);
}

async function UpdateCriteriaLevel(id: number | string, data: Partial<ICreateLevelRequest>) {
    return await api.patch(`/teacher/updateCriteriaLevel/${id}`, data);
}

async function DeleteCriteriaLevel(id: number | string) {
    return await api.delete(`/teacher/deleteCriteriaLevel/${id}`);
}

// student
async function SavePeerEvaluation(data: ISaveEvaluationPeerRequest) {
    return await api.post("/student/evaluation/peer", data);
}

export {
    GetEvaluationProjects,
    GetEvaluationProjectYears,
    GetEvaluationForm,
    GetEvaluationResult,
    GetEvaluationSummary,
    SaveEvaluation,
    SavePeerEvaluation,
    ListCriteria,
    GetCriteriaById,
    CreateCriteria,
    UpdateCriteria,
    DeleteCriteria,
    CreateCriteriaLevel,
    UpdateCriteriaLevel,
    DeleteCriteriaLevel,
    GetStudentEvaluationForm,
    GetStudentEvaluationResult
};