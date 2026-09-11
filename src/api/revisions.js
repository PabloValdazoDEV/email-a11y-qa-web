import { api } from "./api.js";

export const getRevisionsRequest = (campaignId) =>
  api.get(`/api/v1/campaigns/${campaignId}/revisions`);

export const createRevisionRequest = (campaignId) =>
  api.post(`/api/v1/campaigns/${campaignId}/revisions`, {});

export const getRevisionRequest = (revisionId) =>
  api.get(`/api/v1/revisions/${revisionId}`);
