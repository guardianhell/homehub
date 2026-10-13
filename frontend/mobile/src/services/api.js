import axios from "axios";
import { safeGet } from "../utils/storage";

// Default LAN IP for physical phone testing (same Wi-Fi/Hotspot)
export const API_BASE_URL = 'http://192.168.1.123:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await safeGet("homehub_token");
    const activeHouseholdId = await safeGet("homehub_active_household_id");
    const lang = (await safeGet("homehub_lang")) || "id";

    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register");

    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeHouseholdId) {
      config.headers["x-household-id"] = activeHouseholdId;
    }
    config.headers["Accept-Language"] = lang;
  } catch (err) {
    console.warn("Request interceptor error:", err);
  }
  return config;
});

export default api;
