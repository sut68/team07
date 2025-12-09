export interface GenderInterface {
    ID?: number;
    name?: string; // ตรงกับ json:"name" ใน Go
}

export interface BranchInterface {
    ID?: number;
    branch_name?: string; // ตรงกับ json:"branch_name" ใน Go
}

export interface RoleInterface {
    ID?: number;
    role?: string; // ตรงกับ json:"role" ใน Go
}

export interface StatusInterface {
    ID?: number;
    status?: string; // ตรงกับ json:"status" ใน Go
}

export interface UserProfileInterface {
    ID?: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string; // ✅ เพิ่ม phone เข้ามา
    
    // Relation Objects
    gender_id?: number;
    gender?: GenderInterface; // ✅ รับ Object Gender
    
    branch_id?: number;
    branch?: BranchInterface; // ✅ รับ Object Branch
    
    role_id?: number;
    role?: RoleInterface;
    
    status_id?: number;
    status?: StatusInterface; // ✅ รับ Object Status
}

export interface UpdateUserProfileInterface {
    email?: string;
    phone?: string;
}