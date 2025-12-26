export interface GenderInterface {
    ID?: number;
    name?: string; 
}

export interface BranchInterface {
    ID?: number;
    branch_name?: string; 
}

export interface RoleInterface {
    ID?: number;
    role?: string; 
}

export interface StatusInterface {
    ID?: number;
    status?: string;
}

export interface UserProfileInterface {
    ID?: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string; 
    
    gender_id?: number;
    gender?: GenderInterface; 
    
    branch_id?: number;
    branch?: BranchInterface;
    
    role_id?: number;
    role?: RoleInterface;
    
    status_id?: number;
    status?: StatusInterface;
}

export interface UpdateUserProfileInterface {
    email?: string;
    phone?: string;
}

export interface CreateUserInterface {
    username?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    gender_id?: number;
    branch_id?: number;
    role_id?: number;
    status_id?: number;
}