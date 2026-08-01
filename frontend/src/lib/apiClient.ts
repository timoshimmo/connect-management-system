import { getAccessToken, setAccessToken } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set on the one internal retry after a silent refresh, to avoid refresh-loop recursion. */
  _isRetry?: boolean;
}

interface ApiClientConfig {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  /** Path (relative to BASE_URL) this client's refresh endpoint lives at, e.g. '/auth/refresh'. */
  refreshPath: string;
  /** Path prefix never retried through the refresh flow (the auth endpoints themselves), e.g. '/auth/'. */
  authPathPrefix: string;
}

/**
 * Builds a fully independent set of {apiRequest, apiUpload, refreshAccessToken}
 * bound to one token store and one refresh endpoint. MS Publishing and the
 * Drawing Register each get their own instance (see drawingRegisterApiClient.ts)
 * so their sessions/tokens never cross — same fetch/retry/error-handling logic,
 * reused rather than duplicated.
 */
export function createApiClient(config: ApiClientConfig) {
  let refreshPromise: Promise<boolean> | null = null;

  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = fetch(`${BASE_URL}${config.refreshPath}`, { method: 'POST', credentials: 'include' })
        .then(async (res) => {
          if (!res.ok) return false;
          const data = await res.json();
          config.setAccessToken(data.accessToken);
          return true;
        })
        .catch(() => false)
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, _isRetry = false } = options;

    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = config.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !_isRetry && !path.startsWith(config.authPathPrefix)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return apiRequest<T>(path, { ...options, _isRetry: true });
    }

    const contentType = res.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await res.json() : undefined;

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      throw new ApiError(message, res.status);
    }

    return data as T;
  }

  async function apiUpload<T>(
    path: string,
    formData: FormData,
    options: { method?: 'POST' | 'PATCH'; _isRetry?: boolean } = {}
  ): Promise<T> {
    const { method = 'POST', _isRetry = false } = options;

    const headers: Record<string, string> = {};
    const token = config.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: formData,
    });

    if (res.status === 401 && !_isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return apiUpload<T>(path, formData, { ...options, _isRetry: true });
    }

    const contentType = res.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await res.json() : undefined;

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      throw new ApiError(message, res.status);
    }

    return data as T;
  }

  return { apiRequest, apiUpload, refreshAccessToken };
}

/** MS Publishing's client — unchanged behavior/signature from before this was factored out. */
const msPublishingClient = createApiClient({
  getAccessToken,
  setAccessToken,
  refreshPath: '/auth/refresh',
  authPathPrefix: '/auth/',
});

export const { apiRequest, apiUpload, refreshAccessToken } = msPublishingClient;
