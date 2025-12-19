export interface FullChat {
  id: number;
  group_project_id: number;
  process_id: number;
  sender_id: number;
  message: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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

  // ✅ DO NOT add sender_id here (backend doesn't need it, and TS will complain)
}

export interface ChatDelete {
  id: number;
  group_project_id: number;
  process_id: number;
}
