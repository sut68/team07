import { User } from "./Group";

export interface Teacher extends User {
}

export interface AdvisorSelectionPayload {
    group_project_id: number;
    description: string;
    advisor_order: number[]; 
}

export interface SelectAdvisor {
    ID: number;
    no: number;
    description: string;
    group_project_id: number;
    teacher_id: number;
    teacher?: Teacher;
}