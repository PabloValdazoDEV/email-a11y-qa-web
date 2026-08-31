import { api } from "./api.js";

export const getUsersRequest = (params) => api.get("/users", { params });
export const createUserRequest = (data) => api.post("/users", data);
export const updateUserRequest = (id, data) => api.patch(`/users/${id}`, data);
