import { api } from "./api.js";

export const getCampaignsRequest = (clientId) =>
  api.get(`/api/v1/clients/${clientId}/campaigns`);
export const createCampaignRequest = (clientId, data) =>
  api.post(`/api/v1/clients/${clientId}/campaigns`, data);
export const getCampaignRequest = (campaignId) =>
  api.get(`/api/v1/campaigns/${campaignId}`);
export const updateCampaignRequest = (campaignId, data) =>
  api.patch(`/api/v1/campaigns/${campaignId}`, data);
export const archiveCampaignRequest = (campaignId) =>
  api.delete(`/api/v1/campaigns/${campaignId}`);
