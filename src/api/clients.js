import { api } from "./api.js";

export const getClientsRequest = (organizationId) =>
  api.get(`/api/v1/organizations/${organizationId}/clients`);
export const createClientRequest = (organizationId, data) =>
  api.post(`/api/v1/organizations/${organizationId}/clients`, data);
export const getClientRequest = (clientId) => api.get(`/api/v1/clients/${clientId}`);
export const updateClientRequest = (clientId, data) =>
  api.patch(`/api/v1/clients/${clientId}`, data);
export const archiveClientRequest = (clientId) => api.delete(`/api/v1/clients/${clientId}`);
export const restoreClientRequest = (clientId) =>
  api.patch(`/api/v1/clients/${clientId}/restore`, {});
