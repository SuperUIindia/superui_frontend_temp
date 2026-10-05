import { api } from './api';
import { logDebug } from './logger';

/**
 * Generates a standard v4 UUID
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VISITOR_KEY = 'superui_visitor_id';
const SESSION_KEY = 'superui_session_id';
const TRACKED_PREFIX = 'superui_tracked_visit_';

/**
 * Reads a storage slot and returns the value only when it is still a
 * well-formed UUID. Anything else is discarded and regenerated: a tampered or
 * stale value would otherwise be sent to the API as an arbitrary identifier.
 */
function readOrCreateUUID(storage, key) {
  try {
    const existing = storage.getItem(key);
    if (existing && UUID_RE.test(existing)) return existing;
    const created = generateUUID();
    storage.setItem(key, created);
    return created;
  } catch {
    // Storage unavailable (private mode, blocked cookies): fall back to an
    // in-memory id for this page load rather than failing the render.
    return `anon-${generateUUID()}`;
  }
}

/**
 * Gets or creates persistent visitorId in localStorage
 */
export function getVisitorId() {
  return readOrCreateUUID(window.localStorage, VISITOR_KEY);
}

/**
 * Gets or creates sessionId in sessionStorage
 */
export function getSessionId() {
  return readOrCreateUUID(window.sessionStorage, SESSION_KEY);
}

/**
 * Tracks visit once per session. Skips if already tracked or if on /admin routes.
 */
export async function trackVisit(path = window.location.pathname) {
  if (path.startsWith('/admin')) {
    return;
  }

  const sessionId = getSessionId();
  const alreadyTrackedKey = `${TRACKED_PREFIX}${sessionId}`;

  // sessionStorage access itself can throw, so the dedupe check is guarded too.
  try {
    if (window.sessionStorage.getItem(alreadyTrackedKey)) {
      return; // Already tracked for this session
    }
  } catch {
    // Ignore: tracking is best-effort and must never break the page.
  }

  try {
    const visitorId = getVisitorId();
    const referrer = document.referrer || '';
    const screenWidth = window.innerWidth;

    await api.post('/api/track/visit', {
      visitorId,
      sessionId,
      path,
      referrer,
      screenWidth
    });

    try {
      window.sessionStorage.setItem(alreadyTrackedKey, 'true');
    } catch {
      /* storage unavailable - the visit may be recorded again next load */
    }
  } catch (err) {
    // Silent fail for analytics to prevent disturbing user experience
    logDebug('Visit tracking skipped:', err.message);
  }
}

/**
 * Tracks click on a service card
 */
export async function trackClick(serviceKey) {
  try {
    await api.post('/api/track/click', {
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      service: String(serviceKey || '').slice(0, 64)
    });
  } catch (err) {
    logDebug('Click tracking skipped:', err.message);
  }
}
