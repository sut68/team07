import api from "./api";
import type { SignInInterface } from "../interfaces/Login";

async function SignIn(data: SignInInterface) {
    const res = await api.post("/login", data);
    if (res.data.csrf_token) {
        localStorage.setItem("csrfToken", res.data.csrf_token); 
    }
    return res;
}

async function Logout() {
    return await api.post("/logout"); 
}

async function GetMe() {
    return await api.get("/me");
}

export { SignIn, Logout, GetMe };