import api from "./api";
import type {
  PickProgress,
  AssignProgress,
  UpdateProgress,
  DeleteProgress,
  FullProgress,
  GetGroupProjectByUser,
  GroupProjectIdResponse,
} from "../interfaces/Progress";

async function GetProgress(payload: PickProgress): Promise<FullProgress[]> {
  const res = await api.get<FullProgress[]>("/student/getProcess", { params: payload });
  return res.data;
}

async function GetGroupProjectIDByUser(payload: GetGroupProjectByUser): Promise<GroupProjectIdResponse> {
  const res = await api.get<GroupProjectIdResponse>("/student/getProjectbyuser", { params: payload });
  return res.data;
}

async function AddProgress(payload: AssignProgress) {
  const fd = new FormData();
  fd.append("group_project_id", String(payload.group_project_id));
  fd.append("Name", payload.Name);       
  fd.append("comment", payload.comment);
  fd.append("file", payload.file as any);  

  await api.post("/student/assignProgress", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}


async function UpProgress(payload: UpdateProgress) {
  const fd = new FormData();
  fd.append("id", String(payload.id));

  if (payload.Name?.trim()) fd.append("Name", payload.Name.trim());
  if (payload.comment?.trim()) fd.append("comment", payload.comment.trim());
  if (payload.file) fd.append("file", payload.file as any);

  await api.post("/student/modifyProgress", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

async function EraseProgress(payload: DeleteProgress) {
  await api.delete("/student/deleteProgress", { params: payload });
}



export { GetProgress, AddProgress, UpProgress, EraseProgress, GetGroupProjectIDByUser };
