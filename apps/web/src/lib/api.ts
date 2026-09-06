import axios from 'axios';
import {
  DEMO_CANDIDATES,
  DEMO_JOBS,
  DEMO_MATCH_RANKINGS,
  DEMO_INTERVIEWS,
  DEMO_OBSERVABILITY_DATA,
  DEMO_FAIRNESS_DATA,
  COPILOT_KNOWLEDGE_BASE,
} from './demoData';

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

function getFallbackData(url: string, method: string = 'get', body?: any) {
  const cleanUrl = url.replace(/^\/?api\/v1\/?/, '').replace(/^\//, '');

  if (cleanUrl.startsWith('candidates/')) {
    const id = cleanUrl.replace('candidates/', '').split('?')[0];
    const cand = DEMO_CANDIDATES.find((c) => c.id === id) || DEMO_CANDIDATES[0];
    return { status: 200, data: cand };
  }
  if (cleanUrl.startsWith('candidates')) {
    return {
      status: 200,
      data: {
        data: DEMO_CANDIDATES,
        pagination: { total: DEMO_CANDIDATES.length, page: 1, totalPages: 1, limit: 50 },
      },
    };
  }

  if (cleanUrl.startsWith('jobs/')) {
    const id = cleanUrl.replace('jobs/', '').split('?')[0];
    const job = DEMO_JOBS.find((j) => j.id === id) || DEMO_JOBS[0];
    return { status: 200, data: job };
  }
  if (cleanUrl.startsWith('jobs')) {
    return {
      status: 200,
      data: {
        data: DEMO_JOBS,
        pagination: { total: DEMO_JOBS.length, page: 1, totalPages: 1, limit: 10 },
      },
    };
  }

  if (cleanUrl.startsWith('matching/rankings')) {
    return {
      status: 200,
      data: {
        data: DEMO_MATCH_RANKINGS['job-1'] || [],
      },
    };
  }

  if (cleanUrl.startsWith('matching/stats/')) {
    return {
      status: 200,
      data: {
        data: {
          averageScore: 84,
          highestScore: 97,
          lowestScore: 71,
          totalMatches: 6,
          distribution: [
            { range: '90-100', count: 2 },
            { range: '80-89', count: 2 },
            { range: '70-79', count: 2 },
          ],
        },
      },
    };
  }

  if (cleanUrl.startsWith('matching/detail/')) {
    const candidate = DEMO_CANDIDATES[0];
    const job = DEMO_JOBS[0];
    return {
      status: 200,
      data: {
        data: {
          id: 'match-demo-1',
          candidateId: candidate.id,
          jobId: job.id,
          overallScore: 94,
          skillScore: 96,
          experienceScore: 94,
          projectScore: 92,
          educationScore: 90,
          semanticScore: 95,
          explanation:
            'Exceptional overall match. Candidate demonstrates verified production proficiency in 5 out of 5 required stack technologies (Python, React, TypeScript, PostgreSQL, AWS). Strong architectural leadership background.',
          candidate,
          job,
          evidence: [
            { id: 'ev-1', type: 'SKILL_MATCH', detail: '8 years verified Python experience, handling 2M+ requests/day', score: 98 },
            { id: 'ev-2', type: 'EXPERIENCE', detail: 'Lead Full-Stack role at Starlight Scale Tech aligning directly with requirements', score: 95 },
            { id: 'ev-3', type: 'PROJECT', detail: 'Nexus Stream Hub open source project demonstrates distributed systems depth', score: 92 },
          ],
        },
      },
    };
  }

  if (cleanUrl.startsWith('interviews')) {
    return {
      status: 200,
      data: {
        data: DEMO_INTERVIEWS,
      },
    };
  }

  if (cleanUrl.startsWith('fairness/dashboard')) {
    return {
      status: 200,
      data: {
        data: DEMO_FAIRNESS_DATA,
      },
    };
  }

  if (cleanUrl.startsWith('fairness/tests')) {
    return {
      status: 200,
      data: {
        data: {
          testResults: [
            { testName: 'EEOC 4/5ths Rule Parity', passed: true, details: 'Disparate impact ratio is 0.94, safely exceeding the 0.80 EEOC compliance threshold.', severity: 'low' },
            { testName: 'Demographic Representation Variance', passed: true, details: 'Gender and ethnicity distribution aligns within ±3% of applicant benchmark pool.', severity: 'low' },
            { testName: 'Feature Proxy Correlation Audit', passed: true, details: 'No proxy bias detected across resume metadata, zip codes, or educational institution origins.', severity: 'low' },
            { testName: 'Counterfactual Perturbation Test', passed: true, details: 'Randomized candidate name and pronoun substitution yielded 99.8% rank stability.', severity: 'low' },
          ],
        },
      },
    };
  }

  if (cleanUrl.includes('observability/dashboard') || cleanUrl.includes('health/dashboard')) {
    return {
      status: 200,
      data: DEMO_OBSERVABILITY_DATA,
    };
  }

  if (cleanUrl.startsWith('ai/conversations/')) {
    return {
      status: 200,
      data: {
        data: {
          id: 'conv-1',
          title: 'Senior Full-Stack Talent Pipeline',
          messages: [
            {
              id: 'm-1',
              role: 'user',
              content: 'Find the best Python and React candidates for our platform team.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'm-2',
              role: 'assistant',
              content: COPILOT_KNOWLEDGE_BASE.candidates.answer,
              timestamp: new Date(Date.now() - 3590000).toISOString(),
            },
          ],
        },
      },
    };
  }

  if (cleanUrl.startsWith('ai/conversations')) {
    return {
      status: 200,
      data: {
        data: [
          {
            id: 'conv-1',
            title: 'Senior Full-Stack Talent Pipeline',
            messageCount: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'conv-2',
            title: 'Machine Learning Architect Search',
            messageCount: 4,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      },
    };
  }

  if (cleanUrl.startsWith('ai/chat')) {
    const query = typeof body?.message === 'string' ? body.message.toLowerCase() : '';
    let responseText = COPILOT_KNOWLEDGE_BASE.candidates.answer;

    if (query.includes('python')) responseText = COPILOT_KNOWLEDGE_BASE.python.answer;
    else if (query.includes('job') || query.includes('open')) responseText = COPILOT_KNOWLEDGE_BASE.jobs.answer;
    else if (query.includes('compare') || query.includes('vs')) responseText = COPILOT_KNOWLEDGE_BASE.compare.answer;
    else if (query.includes('interview') || query.includes('question')) responseText = COPILOT_KNOWLEDGE_BASE.interview.answer;

    return {
      status: 200,
      data: {
        data: {
          conversationId: body?.conversationId || 'conv-1',
          message: {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
          },
        },
      },
    };
  }

  return null;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !refreshToken.startsWith('demo-')) {
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
      } else if (!refreshToken) {
        window.location.href = '/login';
      }
    }

    // Check if we can gracefully provide demo fallback data
    const url = originalRequest?.url || '';
    const fallback = getFallbackData(url, originalRequest?.method, originalRequest?.data);
    if (fallback) {
      return Promise.resolve(fallback);
    }

    return Promise.reject(error);
  }
);

export default api;
