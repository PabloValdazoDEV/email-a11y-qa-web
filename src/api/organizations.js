import { api } from "./api.js";

export const getOrganizationsRequest = () => api.get("/api/v1/organizations");
export const getOrganizationRequest = (id) => api.get(`/api/v1/organizations/${id}`);
export const createOrganizationRequest = (data) => api.post("/api/v1/organizations", data);
