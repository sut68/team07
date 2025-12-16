import api from "./api";
import type { FullChat,ChatCreate,GetChat,ChatDelete,ProcessInterface} from "../interfaces/Chat";




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
    console.warn("InsertChat complete",payload); /// test
}


async function DropChat(payload: ChatDelete) {
    await api.delete("/DeleteChat", {
        params: payload,
    });
    console.warn("delete chat complete",payload); //test
}
 
async function GetProcessIDbyGroupID(group_member_id: number): Promise<ProcessInterface[]> {
    try {
        const response = await api.get<ProcessInterface[]>("/GetProcessID", {
            params: {
                group_member_id: group_member_id, 
            },
        });
        
        return response.data; // <--- SUCCESS: Returns the array
        
    } catch (error) {
        console.error("Failed to fetch process IDs:", error);
        
        return []; // <--- ERROR: Returns an empty array (ProcessInterface[])

    }
}

export {GetAllChat,InsertChat,DropChat,GetProcessIDbyGroupID};

