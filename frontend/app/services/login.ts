import api from "./api";
import type { SignInInterface } from "../interfaces/Login";


async function getCSRFToken(): Promise<string> {
    const res = await api.post("/refresh", {}); 
    const token = res.data.csrf_token;

    if (token) {
        localStorage.setItem("csrfToken", token); 
    }
    return token;
}

async function SignIn(data: SignInInterface) {
    return await api.post("/login", data);
}

async function Logout() {
    return await api.post("/logout"); 
}

async function GetMe() {
    return await api.get("/me");
}

export { getCSRFToken, SignIn, Logout, GetMe };