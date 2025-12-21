export interface FullChat {
  id: number;
  group_project_id: number;
  process_id: number;
  sender_id: number;
  message: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  client_id?: string;
}

export interface ChatCreate {
  group_project_id: number;
  process_id: number;
  sender_id: number;

  // frontend uses message
  message: string;
}

export interface ProcessInterface {
  id: number;
  file: string;
  group_project_id: number;
  Name: string;
  updated_at?: string;
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

export interface Getteacher {
  teacher_id: number;
}

export interface GroupProject {
  id: number;
  group_number: number;
  group_status: string;
  year: number;
  membership: number;
  teacher_id: number;
}

