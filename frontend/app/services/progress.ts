import api from "./api";
import type { PickProgress,AssignProgress,UpdateProgress,DeleteProgress,FullProgress} from "../interfaces/Progress";
import { AxiosResponse } from 'axios';



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

export {GetProgress,AddProgress};

