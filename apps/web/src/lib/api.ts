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

// Response interceptor - handle token refresh and transient failures
//
// The hosted API (Render free tier) sleeps after ~15 min without traffic and
// needs 30-60s to cold-start, so the first request after idle can fail at the
// network level. We transparently retry transient failures a few times with
// backoff instead of surfacing "Cannot reach the server" to the user.
const MAX_TRANSIENT_RETRIES = 3;
const TRANSIENT_RETRY_DELAYS_MS = [3000, 8000, 15000];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A transient failure is a network-level error (no response at all — e.g. the
// server was asleep/restarting) or a gateway error (mid-deploy window).
// Real HTTP errors (4xx, and most 5xx) are NOT retried.
function isTransientFailure(error: unknown): boolean {
  const err = error as { response?: { status?: number }; message?: string; code?: string };
  if (!err?.response) {
    return (
      err?.message === 'Network Error' ||
      err?.code === 'ECONNABORTED' ||
      err?.code === 'ERR_NETWORK'
    );
  }
  return err.response.status === 502 || err.response.status === 503 || err.response.status === 504;
}

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

    // Cold-start / restart resilience: retry with backoff, then give up.
    if (originalRequest && isTransientFailure(error)) {
      const attempts = originalRequest._retryCount ?? 0;
      if (attempts < MAX_TRANSIENT_RETRIES) {
        originalRequest._retryCount = attempts + 1;
        await sleep(TRANSIENT_RETRY_DELAYS_MS[attempts] ?? 15000);
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
