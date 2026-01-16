import axios from "axios";


export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use(config => {
    
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    const csrfToken = match ? decodeURIComponent(match[1]) : null;
    
    if (
        csrfToken && 
        config.method && 
        !['get', 'head'].includes(config.method.toLowerCase())
    ) {
        config.headers["X-CSRF-Token"] = csrfToken; 
    }

    return config;
}, error => {
    return Promise.reject(error);
});

export default api;