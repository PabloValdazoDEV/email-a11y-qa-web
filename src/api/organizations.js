import { api } from "./api.js";

export const getOrganizationsRequest = () => api.get("/api/v1/organizations");
export const getOrganizationRequest = (id) => api.get(`/api/v1/organizations/${id}`);
export const createOrganizationRequest = (data) => api.post("/api/v1/organizations", data);
export const getOrganizationMembersRequest = (organizationId) =>
  api.get(`/api/v1/organizations/${organizationId}/members`);
export const updateOrganizationMemberRequest = (organizationId, membershipId, data) =>
  api.patch(`/api/v1/organizations/${organizationId}/members/${membershipId}`, data);
export const deleteOrganizationMemberRequest = (organizationId, membershipId) =>
  api.delete(`/api/v1/organizations/${organizationId}/members/${membershipId}`);
export const createOrganizationInvitationRequest = (organizationId, data) =>
  api.post(`/api/v1/organizations/${organizationId}/invitations`, data);
