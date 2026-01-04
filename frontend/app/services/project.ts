import api from "./api";
import type { IProject, ICreateProjectRequest, IUpdateProjectRequest } from "../interfaces/Project";

// สร้างข้อมูลโครงงาน
async function CreateProject(data: ICreateProjectRequest) {
    const formData = new FormData();
    formData.append('abstract', data.abstract);
    formData.append('keywords', data.keywords);

    if (data.project_document) {
        formData.append('project_document', data.project_document);
    }

    return await api.post("/student/project", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// ดึงข้อมูลโครงงานของนักศึกษา
async function GetMyProject() {
    return await api.get<{ data: IProject }>("/student/project");
}

// แก้ไขข้อมูลโครงงาน
async function UpdateProject(id: number, data: IUpdateProjectRequest) {
    const formData = new FormData();

    if (data.abstract) formData.append('abstract', data.abstract);
    if (data.keywords) formData.append('keywords', data.keywords);
    if (data.status) formData.append('status', data.status);
    if (data.project_document) {
        formData.append('project_document', data.project_document);
    }

    return await api.patch(`/student/project/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export {
    CreateProject,
    GetMyProject,
    UpdateProject
};
