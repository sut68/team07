import api from "./api";
import type { FullChat, ChatCreate, GetChat, ChatDelete, ProcessInterface } from "../interfaces/Chat";


async function GetProcessIDByProjectID(group_project_id: number): Promise<ProcessInterface[]> {
    try {
        const response = await api.get<ProcessInterface[]>("/GetProcessID", {
            params: {

                group_project_id: group_project_id,
            },
        });

        console.warn(response.data)
        return response.data;

    } catch (error) {
        console.error("Failed to fetch process IDs:", error);
        return [];
    }
}

async function GetAllChat(payload: GetChat): Promise<FullChat[]> {
    const res = await api.get<FullChat[]>("/GetChat", {

        params: payload,
    });
    return res.data;
}

async function InsertChat(payload: ChatCreate) {
    await api.post("/SendChat", null, {
        params: payload,
    });
    console.warn("InsertChat complete", payload);
}

async function DropChat(payload: ChatDelete) {

    await api.delete("/DeleteChat", {
        params: payload,
    });
    console.warn("delete chat complete", payload);
}


export { GetAllChat, InsertChat, DropChat, GetProcessIDByProjectID as GetProcessIDbyGroupID };