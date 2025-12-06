export interface FullChat {
  id: number;
  group_member_id: number;
  process_id: number;
  sender_id: number;
  messege: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatCreate {
  group_member_id: number;
  process_id: number;
  sender_id: number;
  messege: string;
}

export interface getChat {
  process_id: number;
  group_member_id: number;
}

export interface ChatDelete {
  id: number;
  group_member_id: number;
  process_id: number;
}
