import api from "./api";
import type { PickProgress,AssignProgress,UpdateProgress,DeleteProgress,FullProgress,GetGroupProjectByUser,GroupProjectIdResponse} from "../interfaces/Progress";




async function GetProgress(payload: PickProgress): Promise<FullProgress[]> {
    const res = await api.get<FullProgress[]>("/student/getProcess", {
        params: payload,
    });
    return res.data;
}

async function AddProgress(payload: AssignProgress) {     
    await api.post("/student/assignProgress", null, {
        params: payload,
    });
}

async function UpProgress(payload: UpdateProgress) {
    await api.post("/student/modifyProgress", null, {
        params: payload,
    });
}

async function EraseProgress(payload: DeleteProgress) {
    await api.delete("/student/deleteProgress", {
        params: payload,
    });
}

async function GetGroupProjectIDByUser(payload: GetGroupProjectByUser): Promise<GroupProjectIdResponse> {
  const res = await api.get<GroupProjectIdResponse>("/student/getProjectbyuser", {
    params: payload,
  });
  return res.data;
}


export {GetProgress,AddProgress,UpProgress,EraseProgress,GetGroupProjectIDByUser};

