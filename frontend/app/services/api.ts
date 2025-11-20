import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(config => {
    
    // ดึง csrfToken ที่ได้จากฟังก์ชัน getCSRFToken
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    const csrfToken = match ? decodeURIComponent(match[1]) : null;
    console.warn(csrfToken)
    
    // แนบ CSRF Token เฉพาะใน Request (POST, PUT, DELETE)
    if (
        csrfToken && 
        config.method && 
        !['get', 'head'].includes(config.method.toLowerCase())
    ) {
        //X-CSRF-Token ต้องตรงกับที่ Backend ใช้ตรวจสอบ
        config.headers["X-CSRF-Token"] = csrfToken; 
    }

    return config;
}, error => {
    return Promise.reject(error);
});


export default api;