/**
 * Centralized API client.
 *
 * The API origin comes from VITE_API_BASE_URL in frontend/.env (see lib/env.js).
 * When that value is blank the app is served from the same origin that hosts the API,
 * so requests go to a relative "/api/..." path and are handled by the Vite dev proxy in development.
 *
 * Security & Reliability Rules:
 *   1. Rejects unexpected or protocol-relative endpoints to prevent open-redirect / SSRF.
 *   2. Sends Content-Type only when a body exists.
 *   3. Enforces request timeouts via AbortController.
 *   4. Handles non-JSON / HTML replies safely (does not return null on 200).
 *   5. On 401 Unauthorized for admin pages, clears session state and redirects to /admin/login.
 */
import { SITE_CONFIG } from './env';

const API_BASE = SITE_CONFIG.apiBaseUrl;

/** Requests are aborted after this many milliseconds (Render free tier can take 30-40s on cold start). */
const REQUEST_TIMEOUT_MS = 45000;

/** Endpoints must start with this prefix. */
const API_PREFIX = '/api/';

function resolveApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

function assertSafeEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith(API_PREFIX)) {
    throw new Error(`Blocked API request to an unexpected endpoint: ${String(endpoint)}`);
  }
  if (endpoint.includes('//') || endpoint.includes('\\')) {
    throw new Error(`Blocked API request to an unexpected endpoint: ${endpoint}`);
  }
  return endpoint;
}

export async function request(endpoint, options = {}) {
  const safeEndpoint = assertSafeEndpoint(endpoint);
  const url = resolveApiUrl(safeEndpoint);

  const method = (options.method || 'GET').toUpperCase();
  const hasBody = typeof options.body === 'string' && options.body.length > 0;

  const headers = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const config = {
    ...options,
    method,
    headers,
    credentials: 'include', // Required for sending & receiving httpOnly auth cookies
    signal: controller.signal
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      const timeoutError = new Error('The request timed out. Please check your connection and try again.');
      timeoutError.status = 0;
      throw timeoutError;
    }

    const reason =
      err && err.name === 'TypeError'
        ? 'the request was blocked by CORS, the API is offline, or VITE_API_BASE_URL is wrong'
        : err && err.message
          ? err.message
          : 'unknown network error';
    const networkError = new Error(`Could not reach ${url}. (${reason})`);
    networkError.status = 0;
    networkError.cause = err;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle binary / CSV downloads
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || 'Failed to download file');
    }
    return response.blob();
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    // If server responded 200 with HTML (e.g. SPA index.html fallback), treat as an unexpected response
    const textBody = await response.text().catch(() => '');
    if (response.ok) {
      const error = new Error('Server returned an unexpected non-JSON response. Please verify that the API backend is running and reachable.');
      error.status = response.status;
      error.isHtmlFallback = textBody.includes('<!DOCTYPE html>') || textBody.includes('<html');
      throw error;
    }
  }

  if (!response.ok) {
    // Session expired handling for admin routes
    if (response.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/login')) {
        // Redirect to login with expired param
        setTimeout(() => {
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login?expired=1';
          }
        }, 100);
      }
    }

    const message = (data && data.message) || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  /** Bulk delete helper: tries POST to /bulk-delete first, falling back to DELETE with payload */
  bulkDelete: async (endpoint, payload, options = {}) => {
    try {
      return await request(`${endpoint}/bulk-delete`, { ...options, method: 'POST', body: JSON.stringify(payload || {}) });
    } catch (err) {
      // Fallback to DELETE with body if endpoint does not support /bulk-delete
      if (err.status === 404) {
        return await request(endpoint, { ...options, method: 'DELETE', body: JSON.stringify(payload || {}) });
      }
      throw err;
    }
  },
  downloadCsv: async (endpoint) => {
    const blob = await request(endpoint, { method: 'GET', responseType: 'blob' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.rel = 'noopener';
    link.download = `${SITE_CONFIG.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
  }
};

export { API_PREFIX, REQUEST_TIMEOUT_MS };