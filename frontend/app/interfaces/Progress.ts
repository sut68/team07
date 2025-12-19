export interface FullProgress {
  id: number;
  group_project_id: number;
  file: string;     
  name: string;    
  comment: string;
  updated_at?: string;
  created_at?: string;
}


export interface PickProgress {
  group_project_id: number;
}


export interface AssignProgress {
  group_project_id: number;
  Name: string;
  file: File;    
  comment: string;
}

export interface UpdateProgress {
  id: number;
  file?: File;   
  Name?: string;
  comment?: string;
}


export interface DeleteProgress {
  id: number;
}


export interface DisplayProgress {
  id: number;
  name: string;
  file: string;
  comment: string;
  updated_at?: string;
}

export interface GetGroupProjectByUser {
  student_id: number;
}

export interface GroupProjectIdResponse {
  group_project_id: number;
  message?: string;
}