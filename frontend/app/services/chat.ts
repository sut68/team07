import api from "./api";
import type { FullChat, ChatCreate, GetChat, ChatDelete } from "../interfaces/Chat";
import { FullProgress } from "../interfaces/Progress";

async function GetProcessIDByProjectID(group_project_id: number): Promise<FullProgress[]> {
  try {
    const response = await api.get<FullProgress[]>("/GetProcessID", {
      params: { group_project_id },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch process IDs:", error);
    return [];
  }
}

async function GetAllChat(payload: GetChat): Promise<FullChat[]> {
  const res = await api.get<FullChat[]>("/GetChat", {
    params: payload,
  });
  return Array.isArray(res.data) ? res.data : [];
}

async function InsertChat(payload: ChatCreate) {

  await api.post("/SendChat", null, {
    params: {
      group_project_id: payload.group_project_id,
      process_id: payload.process_id,
      sender_id: payload.sender_id,
      messege: payload.message, 
    },
  });
}

async function DropChat(payload: ChatDelete) {
  await api.delete("/DeleteChat", {
    params: payload,
  });
}

async function DropWholechat(payload: GetChat) {
  await api.delete("/Deletechatbyid",{
    params: payload,
  });
}

export { GetAllChat, InsertChat, DropChat, GetProcessIDByProjectID ,DropWholechat};
