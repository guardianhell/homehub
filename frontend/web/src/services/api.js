import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // In the browser, prefer relative /api/v1 to leverage Vite proxy seamlessly across localhost & LAN
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return "http://localhost:8000/api/v1";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically inject token & active household context
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("homehub_token");
  const activeHouseholdId =
    localStorage.getItem("homehub_active_household_id") || "";
  const lang = localStorage.getItem("i18nextLng") || "id";

  // Only attach authorization header if not calling public auth endpoints
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

  return config;
});

// Response interceptor for centralized error handling, session expiration & quota limit detection
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    // Handle 401 Unauthorized / Token Expired on protected routes
    if (error.response?.status === 401 && !isAuthEndpoint) {
      console.warn("401 Unauthorized encountered. Purging expired session...");
      localStorage.removeItem("homehub_token");
      localStorage.removeItem("homehub_user");
      localStorage.removeItem("homehub_active_household_id");
      localStorage.removeItem("homehub_households");

      window.dispatchEvent(
        new CustomEvent("homehub:session_expired", {
          detail: {
            message:
              error.response?.data?.message ||
              "Sesi login Anda telah berakhir. Silakan masuk kembali.",
            errorCode: error.response?.data?.errorCode || "ERR_UNAUTHORIZED",
          },
        }),
      );
    }

    if (error.response?.data?.errorCode === "ERR_QUOTA_EXCEEDED") {
      window.dispatchEvent(
        new CustomEvent("homehub:quota_exceeded", {
          detail: error.response.data,
        }),
      );
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
