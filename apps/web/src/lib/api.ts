import axios from 'axios';

// API base URL. Set VITE_API_URL at build time to point at your hosted API
// (e.g. https://my-api.example.com/api/v1). Without it we use a same-origin
// path, which works in local dev (Vite proxies /api -> http://localhost:3001)
// and when the API is served from the same domain as the frontend.
const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_URL = configuredApiUrl || '/api/v1';
export const API_ORIGIN = configuredApiUrl && configuredApiUrl.startsWith('http')
  ? new URL(configuredApiUrl).origin
  : '';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
