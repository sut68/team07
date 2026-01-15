import api from "./api";
import { Topic, TopicApproval } from "../interfaces/Topic";

export const getTopics = async (params?: { teacher_id?: number; filter?: string; proposer_role?: string; group_id?: number }) => {
    const res = await api.get<{ data: Topic[] }>("/groupProject/topics", { params });
    return res.data;
};

export const getTopicById = async (id: number) => {
    const res = await api.get<{ data: Topic }>(`/groupProject/topics/${id}`);
    return res.data;
};

export const createTopic = async (data: FormData) => {
    const res = await api.post<{ data: Topic }>("/groupProject/topics", data);
    return res.data;
};

export const updateTopic = async (id: number, data: FormData) => {
    const res = await api.patch<{ data: Topic }>(`/groupProject/topics/${id}`, data);
    return res.data;
};

export const deleteTopic = async (id: number) => {
    const res = await api.delete(`/groupProject/topics/${id}`);
    return res.data;
};

export const approveTopic = async (id: number, data: { status: string; comment?: string; teacher_id: number }) => {
    const res = await api.patch<{ data: Topic; approval: TopicApproval }>(`/teacher/topics/${id}/approval`, data);
    return res.data;
};

export const selectTopic = async (id: number, data: { group_project_id: number }) => {
    const res = await api.post(`/student/topics/${id}/select`, data);
    return res.data;
};

export const cancelSelection = async (data: { group_project_id: number }) => {
    const res = await api.post(`/student/topics/cancel-selection`, data);
    return res.data;
};

export const getStudentTopic = async (params: { group_id: number }) => {
    const res = await api.get(`/student/topic`, { params });
    return res.data;
};
