// interfaces/Issue.ts

// 1. Import UserProfileInterface จากไฟล์ Users.ts ของคุณ
// (เช็ค path ให้ถูกว่าไฟล์ Users.ts อยู่โฟลเดอร์เดียวกันไหม)
import { UserProfileInterface } from "../interfaces/Users"; 

export interface IssueTypeInterface {
    ID: number;
    type: string;
}

export interface IssueStatusInterface {
    ID: number;
    status: string;
}

export interface IssueReportInterface {
    ID?: number;
    detail?: string;
    report_date?: string;

    admin_reply?: string;
    
    // Foreign Keys & Relations
    type_id?: number;
    type?: IssueTypeInterface;
    
    status_id?: number;
    status?: IssueStatusInterface;
    
    user_id?: number;
    user?: UserProfileInterface; 
}



export interface CreateIssueInterface {
    detail: string;
    type_id: number;
    user_id: number;
}