import { getAccessToken, setAccessToken } from './tokenStore';

/**
 * In dev, the Vite server and the API run on different ports, so an absolute
 * localhost URL is needed. In a production build (Vercel), the frontend and
 * backend are deployed as same-origin services under one domain (see
 * /vercel.json's rewrites), so a relative path is both correct and avoids
 * ever having to hardcode or configure a production API origin.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/** Exposed for the handful of call sites that need a real browser navigation instead of a fetch — e.g. "Sign in with Microsoft" (OAuth requires a full page redirect to Microsoft's own login page). */
export const API_BASE_URL = BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** A presigned R2 upload target returned by POST /documents/upload-urls. */
export interface PresignedFile {
  key: string;
  uploadUrl: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

/** What a file becomes, everywhere in the app, once it's been uploaded to R2 — never raw bytes again after this. */
export interface FileRef {
  key: string;
  originalFilename: string;
  size: number;
  mimeType: string;
}

/**
 * PUTs a File directly to a presigned R2 URL — deliberately NOT routed
 * through apiRequest/apiUpload, since this goes to a completely different
 * origin (Cloudflare R2, not our own API) and must never carry the app's
 * Authorization/cookie headers. XHR (not fetch) so upload progress is
 * observable, same reasoning as apiUploadWithProgress below.
 */
function putFileToR2(file: File, presigned: PresignedFile, onProgress?: (percent: number) => void): Promise<FileRef> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presigned.uploadUrl);
    // Must match the mimeType declared at presign time exactly — R2 binds
    // Content-Type into the request signature, so a mismatch here fails as
    // a signature error, not a validation error.
    xhr.setRequestHeader('Content-Type', presigned.mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          key: presigned.key,
          originalFilename: presigned.originalFilename,
          size: presigned.size,
          mimeType: presigned.mimeType,
        });
      } else {
        reject(new ApiError(`Upload to storage failed (${xhr.status})`, xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError('Network error uploading file', 0));
    xhr.send(file);
  });
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

  /**
   * Same auth/refresh-retry behavior as apiUpload, but over XHR instead of
   * fetch so upload progress is observable — fetch has no upload-progress
   * event. Only used by features that need a progress bar (bulk import);
   * every other upload still goes through the simpler apiUpload above.
   */
  function apiUploadWithProgress<T>(
    path: string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const send = (isRetry = false) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}${path}`);
        xhr.withCredentials = true;
        const token = config.getAccessToken();
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = async () => {
          if (xhr.status === 401 && !isRetry) {
            const refreshed = await refreshAccessToken();
            if (refreshed) return send(true);
          }

          const contentType = xhr.getResponseHeader('content-type') ?? '';
          const data = contentType.includes('application/json') && xhr.responseText ? JSON.parse(xhr.responseText) : undefined;

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as T);
          } else {
            const message = (data && (data.message || data.error)) || xhr.statusText;
            reject(new ApiError(message, xhr.status));
          }
        };

        xhr.onerror = () => reject(new ApiError('Network error', 0));
        xhr.send(formData);
      };
      send();
    });
  }

  /** Requests presigned R2 PUT URLs for one or more files, via the app's own authenticated API. */
  async function requestUploadUrls(files: { filename: string; mimeType: string; size: number }[]): Promise<PresignedFile[]> {
    const { files: presigned } = await apiRequest<{ files: PresignedFile[] }>('/documents/upload-urls', {
      method: 'POST',
      body: { files },
    });
    return presigned;
  }

  /**
   * Full flow for one or more files: presign, then PUT each directly to R2,
   * resolving to FileRef[] in the same order as `files`. Sequential (not
   * parallel) so progress reporting stays simple and predictable — the app
   * only ever had one FormData-wide progress bar before this, so this is
   * already strictly better even without parallelizing.
   */
  async function uploadFilesToR2(files: File[], onProgress?: (percent: number) => void): Promise<FileRef[]> {
    if (files.length === 0) return [];
    const presigned = await requestUploadUrls(files.map((f) => ({ filename: f.name, mimeType: f.type, size: f.size })));
    const results: FileRef[] = [];
    for (let i = 0; i < files.length; i += 1) {
      results.push(
        await putFileToR2(files[i], presigned[i], (pct) => {
          if (onProgress) onProgress(Math.round(((i + pct / 100) / files.length) * 100));
        })
      );
      if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
    }
    return results;
  }

  /** Fetches a binary response (e.g. a generated .xlsx) as a Blob, with the same auth header as every other call here. */
  async function apiDownload(path: string): Promise<Blob> {
    const token = config.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { headers, credentials: 'include' });

    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return apiDownload(path);
    }

    if (!res.ok) {
      const message = res.headers.get('content-type')?.includes('application/json')
        ? (await res.json()).message ?? res.statusText
        : res.statusText;
      throw new ApiError(message, res.status);
    }

    return res.blob();
  }

  return { apiRequest, apiUpload, apiUploadWithProgress, apiDownload, uploadFilesToR2, refreshAccessToken };
}

/** MS Publishing's client — unchanged behavior/signature from before this was factored out. */
const msPublishingClient = createApiClient({
  getAccessToken,
  setAccessToken,
  refreshPath: '/auth/refresh',
  authPathPrefix: '/auth/',
});

export const { apiRequest, apiUpload, apiUploadWithProgress, apiDownload, uploadFilesToR2, refreshAccessToken } =
  msPublishingClient;
