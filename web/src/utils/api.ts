import { createAdminApiClient, createPublicApiClient } from "@nutcrack/shared";

const API_BASE_URL = "";

export function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function handleUnauthorized() {
  clearAuthToken();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export const publicApi = createPublicApiClient({
  base_url: API_BASE_URL,
});

export const dailySiteUrl = (import.meta.env.VITE_DAILY_SITE_URL || "").replace(
  /\/+$/,
  "",
);

export const adminApi = createAdminApiClient({
  base_url: API_BASE_URL,
  get_access_token: getAuthToken,
  on_unauthorized: handleUnauthorized,
});
