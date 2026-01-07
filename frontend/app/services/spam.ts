
import api from "./api";
import type { ISpamRequest, ISpamAnalysis } from "../interfaces/filter";


async function CheckSpam(payload: ISpamRequest): Promise<ISpamAnalysis> {
  const res = await api.post<ISpamAnalysis>("/checkspam", {
    text: payload.text,
  });

  return res.data;
}

export { CheckSpam };
