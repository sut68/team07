import { User,GroupProject } from "./Group";

export interface Teacher extends User {
}

export interface AdvisorSelectionPayload {
    group_project_id: number;
    description: string;
    advisor_order: number[]; 
}

export interface SelectAdvisor {
    ID: number;
    CreatedAt?: string;
    UpdatedAt?: string;
    DeletedAt?: string | null;

    no: number;             
    description: string;    
    status: string;        

    group_project_id: number;
    group_project?: GroupProject; 

    teacher_id: number;
    teacher?: Teacher;     
}


export interface AdvisorActionRequest {
  selection_id: number;
}

export interface AdvisorStatusRequest {
  is_open: boolean;
}