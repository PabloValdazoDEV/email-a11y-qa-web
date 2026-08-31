import { api } from "./api.js";

export const loginRequest = (data) => api.post("/auth/login", data);
export const logoutRequest = () => api.post("/auth/logout", {});
export const meRequest = () => api.get("/auth/me");
export const refreshRequest = () => api.post("/auth/refresh", {});
export const forgotPasswordRequest = (data) => api.post("/auth/forgot-password", data);
export const resetPasswordRequest = (data) => api.post("/auth/reset-password", data);
export const verifyEmailRequest = (data) => api.post("/auth/verify-email", data);
export const resendVerificationRequest = (data) =>
  api.post("/auth/resend-verification", data);
export const updateProfileRequest = (data) => api.put("/auth/me", data);
export const changePasswordRequest = (data) => api.put("/auth/me/password", data);
