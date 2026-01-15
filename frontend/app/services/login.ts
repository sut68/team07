import api from "./api";
import type { ForgotPasswordInterface, SignInInterface,ResetPasswordInterface ,UserDataInterface, ChangePasswordInterface} from "../interfaces/Login";
import { AxiosResponse } from 'axios';

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

async function GetMe(): Promise<UserDataInterface> {
    const res: AxiosResponse<UserDataInterface> = await api.get("/me");
    return res.data;
}

async function ForgotPassword(data: ForgotPasswordInterface) {
    return await api.post("/forgot-password", data);
}

async function ResetPassword(data: ResetPasswordInterface) {
    return await api.post("/reset-password", data);
}

async function ChangePassword(data: ChangePasswordInterface) {
    return await api.post("/change-password", data);
}

export { SignIn, Logout, GetMe , ForgotPassword ,ResetPassword, ChangePassword};