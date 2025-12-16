
export interface FullChat {
    id: number;
    
 
    group_project_id: number;
    
    process_id: number;
    sender_id: number;
    

    message: string; 
    
    created_at: string;
    updated_at: string;
    
    deleted_at: string | null; 


}


export interface ChatCreate {

    group_project_id: number; 
    
    process_id: number;
    sender_id: number;
    
 
    message: string; 
}

export interface ProcessInterface {
    id: number;
    file: string;
    group_project_id: number; 
    
    updated_at: string; 
  
    comment?: string; 
}


export interface GetChat {
    process_id: number;
    group_project_id: number;
}


export interface ChatDelete {
    id: number;

    group_project_id: number;
    process_id: number;
}