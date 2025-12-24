import axios from "axios";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
}, error => {
    return Promise.reject(error);
});

export default api;