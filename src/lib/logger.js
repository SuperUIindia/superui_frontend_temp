/**
 * Minimal dev-only logger.
 *
 * Production builds must not leak internals to the console, and errors must
 * never be swallowed. Every `console.*` call in src/ goes through here:
 * `logDebug`/`logInfo` are stripped in production, `logError` and `logWarn`
 * always emit because they report a failure the operator needs to see.
 */

/* eslint-disable no-console */

export const isDev = Boolean(import.meta.env && import.meta.env.DEV);

/** Development-only detail. No-op in a production build. */
export function logDebug(...args) {
  if (isDev) console.debug(...args);
}

/** Development-only informational message. No-op in a production build. */
export function logInfo(...args) {
  if (isDev) console.info(...args);
}

/** Warning. Always emitted: it flags a degraded path, not a detail. */
export function logWarn(...args) {
  console.warn(...args);
}

/**
 * Failure. Always emitted.
 *
 * `context` is a short, non-sensitive label such as 'load site content'. Never
 * pass a payload that could contain a password, cookie or lead PII.
 */
export function logError(context, error) {
  console.error(`[superui] ${context}:`, error && error.message ? error.message : error);
}

export default { isDev, logDebug, logInfo, logWarn, logError };