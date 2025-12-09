import axios from "axios";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
// const BASE_URL = "http://localhost:8080";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // ✅ Kept enabled as requested
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Your important CSRF interceptor (UNTOUCHED)
api.interceptors.request.use(config => {
    
    // Get csrfToken
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    const csrfToken = match ? decodeURIComponent(match[1]) : null;
    
    // Attach CSRF Token only for mutation requests
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