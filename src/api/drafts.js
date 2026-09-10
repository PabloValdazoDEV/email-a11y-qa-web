import { api } from "./api.js";

export const getDraftRequest = (campaignId) =>
  api.get(`/api/v1/campaigns/${campaignId}/draft`);
export const replaceDraftRequest = (campaignId, html) =>
  api.put(`/api/v1/campaigns/${campaignId}/draft`, { html });
export const updateDraftRequest = (campaignId, htmlCurrent) =>
  api.patch(`/api/v1/campaigns/${campaignId}/draft`, { htmlCurrent });
export const importDraftRequest = (campaignId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/api/v1/campaigns/${campaignId}/draft/import`, formData);
};
