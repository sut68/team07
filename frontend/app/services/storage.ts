import api from './api';
import { ProjectStorage } from '../interfaces/storage';


const getStorageAPI = (role?: string): string => {
    return role === 'Student' ? '/student/storage/projects' : '/teacher/storage/projects';
};

export const getProjects = async (params?: { year?: number; keyword?: string; role?: string }): Promise<{ data: ProjectStorage[] }> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.year) {
            queryParams.append('year', params.year.toString());
        }
        if (params?.keyword) {
            queryParams.append('keyword', params.keyword);
        }

        const STORAGE_API = getStorageAPI(params?.role);
        const url = queryParams.toString() ? `${STORAGE_API}?${queryParams}` : STORAGE_API;
        const response = await api.get(url);

        return { data: response.data.data || [] };
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw error;
    }
};

export const getProject = async (id: number, role?: string): Promise<{ data: ProjectStorage }> => {
    try {
        const STORAGE_API = getStorageAPI(role);
        const response = await api.get(`${STORAGE_API}/${id}`);
        return { data: response.data.data };
    } catch (error) {
        console.error('Failed to fetch project:', error);
        throw error;
    }
};

export const createProject = async (formData: FormData, role?: string): Promise<{ data: ProjectStorage }> => {
    try {
        const STORAGE_API = getStorageAPI(role);
        const response = await api.post(STORAGE_API, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { data: response.data.data };
    } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
    }
};

export const updateProject = async (id: number, formData: FormData, role?: string): Promise<{ data: ProjectStorage }> => {
    try {
        const STORAGE_API = getStorageAPI(role);
        const response = await api.patch(`${STORAGE_API}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { data: response.data.data };
    } catch (error) {
        console.error('Failed to update project:', error);
        throw error;
    }
};

export const deleteProject = async (id: number, role?: string): Promise<{ data: number }> => {
    try {
        const STORAGE_API = getStorageAPI(role);
        const response = await api.delete(`${STORAGE_API}/${id}`);
        return { data: response.data.data };
    } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
    }
};
