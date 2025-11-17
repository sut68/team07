import api from "./api";
import type { ForgotPasswordInterface, SignInInterface,ResetPasswordInterface } from "../interfaces/Login";

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

async function ForgotPassword(data: ForgotPasswordInterface) {
    return await api.post("/forgot-password", data);
}

async function ResetPassword(data: ResetPasswordInterface) {
    return await api.post("/reset-password", data);
}

export { SignIn, Logout, GetMe , ForgotPassword ,ResetPassword};