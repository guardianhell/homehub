import axios from 'axios';

// Admin API client pointing to Gateway (port 8000) or direct Auth Service (port 8001)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject admin token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('homehub_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
