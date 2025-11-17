import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080", 
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(config => {
    
    // ดึง csrfToken ที่ได้จากฟังก์ชัน getCSRFToken
    const csrfToken = localStorage.getItem("csrfToken");
    
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