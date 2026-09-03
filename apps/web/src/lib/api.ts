import axios from 'axios';

// API base URL. Set VITE_API_URL at build time to point at your hosted API.
// It may be the full prefix (https://my-api.example.com/api/v1) or just the
// origin (https://my-api.example.com) — in the latter case /api/v1 is appended
// automatically. Without it we use a same-origin path, which works in local dev
// (Vite proxies /api -> http://localhost:3001) and when the API is served from
// the same domain as the frontend.
const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

function resolveApiUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return '/api/v1';
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const path = u.pathname.replace(/\/+$/, '');
      // Host root or a bare /api path: mount the standard API prefix.
      if (path === '' || path === '/api') u.pathname = '/api/v1';
      return u.toString().replace(/\/+$/, '');
    } catch {
      // Fall through to the raw value on malformed URLs.
    }
  }
  return trimmed.replace(/\/+$/, '');
}

export const API_URL = resolveApiUrl(configuredApiUrl);
export const API_ORIGIN = API_URL.startsWith('http') ? new URL(API_URL).origin : '';

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
