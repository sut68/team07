import api from "./api";
import { Teacher, AdvisorSelectionPayload, SelectAdvisor } from "../interfaces/Advisor";

export const GetAllTeachers = async () => {
    return await api.get<{ data: Teacher[] }>("/student/teachers/search");
};

export const SaveAdvisorSelection = async (data: AdvisorSelectionPayload) => {
    return await api.post("/student/select", data);
};

export const GetAdvisorSelection = async (groupId: number) => {
    return await api.get<{ data: SelectAdvisor[] }>(`/student/selection/${groupId}`);
};