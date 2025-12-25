import api from "./api";
import { News } from "../interfaces/News";

export const getNews = async () => {
  const res = await api.get<{ data: News[] }>("/news");
  return res.data.data;
};

export const createNews = async (data: FormData) => {
  const res = await api.post<{ data: News }>("/news", data);
  return res.data.data;
};

export const updateNews = async (id: number, data: FormData) => {
  const res = await api.patch<{ data: News }>(`/news/${id}`, data);
  return res.data.data;
};

export const deleteNews = async (id: number) => {
  const res = await api.delete(`/news/${id}`);
  return res.data;
};
