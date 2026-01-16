export interface SignInInterface {
    username?: string;
    password?: string;
    ispeople?: string;
}

export interface UserDataInterface {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    role: string;
    message: string;
}

export interface ForgotPasswordInterface {
    username: string;
    email: string;
}

export interface ResetPasswordInterface {
    token: string;
    new_password: string;
}

export interface ChangePasswordInterface {
    email: string;
    current_password: string;
    new_password: string;
}
