import api from "./api";
import type { FullChat,ChatCreate,GetChat,ChatDelete} from "../interfaces/Chat";




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

export {GetAllChat,InsertChat,DropChat};

