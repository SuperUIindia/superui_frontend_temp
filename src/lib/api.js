/**
 * Centralized API client.
 *
 * The API origin comes from VITE_API_BASE_URL in frontend/.env (see
 * lib/env.js). When that value is blank the app is served from the same origin
 * that hosts the API, so requests go to a relative "/api/..." path and are
 * handled by the Vite dev proxy in development. No host or port is ever written
 * in code.
 *
 * Security rules enforced here rather than in each caller:
 *   1. Every endpoint must be a same-origin relative "/api/..." path. An
 *      absolute URL (or a protocol-relative `//host`) is rejected outright, so
 *      a value that reached this function from the database or a query string
 *      can never redirect a credentialed request to a third party.
 *   2. `Content-Type: application/json` is sent only when a body exists.
 *      Advertising JSON on a bodyless GET turns it into a CORS preflight and
 *      breaks on simple cross-origin setups.
 *   3. Every request is bounded by an AbortController timeout, so a hung socket
 *      cannot leave the UI spinning forever.
 *   4. `credentials: 'include'` carries the httpOnly session cookie.
 *
 * The admin username and password are never referenced here: the browser only
 * ever posts whatever the operator types into the login form, and the session
 * is a httpOnly cookie set by the backend.
 */
import { SITE_CONFIG } from './env';

const API_BASE = SITE_CONFIG.apiBaseUrl;

/** Requests are aborted after this many milliseconds. */
const REQUEST_TIMEOUT_MS = 20000;

/** Endpoints must start with this prefix. */
const API_PREFIX = '/api/';

/**
 * Resolves an endpoint against the API base.
 *
 * A blank VITE_API_BASE_URL means same-origin "/api/...", which is the correct
 * target for a Vercel deployment that rewrites /api to the backend and for local
 * development behind the Vite proxy.
 *
 * API_BASE is already stripped of any trailing "/api" by lib/env.js, so this
 * concatenation can never emit "/api/api/...".
 */
function resolveApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

/**
 * Rejects anything that is not a plain same-origin "/api/..." path.
 * Guards against open-redirect / SSRF-by-proxy through a DB-controlled path.
 */
function assertSafeEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith(API_PREFIX)) {
    throw new Error(`Blocked API request to an unexpected endpoint: ${String(endpoint)}`);
  }
  // "/api//evil.com" and backslashes are treated as absolute by some parsers.
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
    // Name the real cause: a bare "could not reach the server" sent people
    // looking at the wrong box when the actual problem was CORS, an offline
    // dev server or a bad VITE_API_BASE_URL.
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
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
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
  /** DELETE with a JSON body, e.g. bulkDelete(url, { ids }) or { scope: 'all' } */
  bulkDelete: (endpoint, payload, options = {}) =>
    request(endpoint, { ...options, method: 'DELETE', body: JSON.stringify(payload || {}) }),
  downloadCsv: async (endpoint) => {
    const blob = await request(endpoint, { method: 'GET', responseType: 'blob' });
    // Revoking synchronously after click() can cancel the download in some
    // browsers, so the object URL is released on the next tick instead.
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