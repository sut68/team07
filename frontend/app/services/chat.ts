import api from "./api";
import type { FullChat, ChatCreate, GetChat, ChatDelete, Getteacher ,GroupProject } from "../interfaces/Chat";




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
      name: payload.name,
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

async function Getteachergroup(payload: Getteacher): Promise<GroupProject[]> {
  const res = await api.get<GroupProject[]>("/get_teacher_id", { params: payload });
  return res.data;
}

export { GetAllChat, InsertChat, DropChat ,DropWholechat, Getteachergroup};
