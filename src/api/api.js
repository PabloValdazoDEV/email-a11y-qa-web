import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
if (!baseURL) throw new Error("VITE_API_URL is required");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const excludedPaths = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
]);

let refreshRequest = null;

function requestPath(config) {
  try {
    return new URL(config.url, baseURL).pathname;
  } catch {
    return config.url?.split("?")[0] || "";
  }
}

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = refreshClient.post("/auth/refresh", {}).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED") {
      window.dispatchEvent(new Event("auth:password-change-required"));
      throw error;
    }
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !excludedPaths.has(requestPath(originalRequest));

    if (!shouldRefresh) throw error;
    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      return await api(originalRequest);
    } catch (refreshError) {
      window.dispatchEvent(new Event("auth:unauthorized"));
      throw refreshError;
    }
  },
);
