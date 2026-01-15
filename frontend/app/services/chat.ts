import api from "./api";
import type { FullChat, ChatCreate, GetChat, ChatDelete, Getteacher ,GroupProject } from "../interfaces/Chat";

async function GetAllChat(payload: GetChat): Promise<FullChat[]> {
  const res = await api.get<FullChat[]>("/GetChat", {
    params: payload,
  });
  return Array.isArray(res.data) ? res.data : [];
}

async function InsertChat(payload: ChatCreate) {
  await api.post("/SendChat", {
    group_project_id: payload.group_project_id,
    process_id: payload.process_id,
    sender_id: payload.sender_id,
    type: payload.type,
    name: payload.name,
    message: payload.message,
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

async function UploadFile(file: File): Promise<string> {
  const sm = encodeURIComponent(file.name);

  const res = await api.post<{ url: string }>(`/uploadfile?filename=${sm}`, file, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  const base = api.defaults.baseURL || "";
  
  // Storage API is now under the API Group (e.g. /team07api/storage/...)
  // So we should concatenate base (which includes /team07api) with the relative url
  // Note: res.data.url starts with /storage/...
  // We need to ensure we don't end up with double slashes if base ends with /
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  
  return res.data.url.startsWith("http") ? res.data.url : `${cleanBase}${res.data.url}`;
}

export { GetAllChat, InsertChat, DropChat ,DropWholechat, Getteachergroup, UploadFile };
