/**
 * Frontend runtime configuration, resolved exclusively from frontend/.env.
 *
 * Rules enforced here:
 *   1. No host, port or URL is hard-coded. Every value comes from a VITE_*
 *      variable, and a missing required value throws at module load instead of
 *      silently defaulting to a localhost address.
 *   2. Only VITE_* variables are readable, and this module is the single place
 *      that touches import.meta.env. Nothing secret may ever be added to
 *      frontend/.env - VITE_ values are inlined into the public JS bundle.
 *   3. The admin username and password are NOT and must never be available
 *      here. They live only in backend/.env and are consumed server-side.
 */
import { logInfo } from './logger';

const env = import.meta.env;

class MissingFrontendEnvError extends Error {
  constructor(name, hint) {
    super(
      `Missing required frontend environment variable ${name}.${hint ? ` ${hint}` : ''} ` +
        'Add it to frontend/.env (see frontend/.env.example).'
    );
    this.name = 'MissingFrontendEnvError';
    this.variable = name;
  }
}

function optional(name, fallback = '') {
  const value = env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function required(name, hint) {
  const value = optional(name);
  if (!value) throw new MissingFrontendEnvError(name, hint);
  return value;
}

function requiredUrl(name, hint) {
  const raw = required(name, hint);
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('bad protocol');
  } catch {
    throw new MissingFrontendEnvError(name, `${hint || ''} (expected an absolute http(s) URL, received "${raw}")`);
  }
  return raw.replace(/\/+$/, '');
}

function list(name, fallback = []) {
  const raw = optional(name);
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function number(name, fallback) {
  const raw = optional(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Localhost/127.0.0.1/0.0.0.0 detection, used only for dev-only warnings. */
function isLoopback(host) {
  return /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i.test(host);
}

const SITE_URL = requiredUrl('VITE_SITE_URL', 'Public origin of this frontend, e.g. http://localhost:5173 locally.');
const SITE_HOST = new URL(SITE_URL).host;

// Blank in local development, which routes requests through the Vite /api proxy.
const API_BASE_URL = optional('VITE_API_BASE_URL').replace(/\/+$/, '');

export const SITE_CONFIG = Object.freeze({
  /** Public origin of this frontend, e.g. "https://superui.in". */
  siteUrl: SITE_URL,
  siteHost: SITE_HOST,
  /** API origin used by the running app. "" means "same origin /api proxy". */
  apiBaseUrl: API_BASE_URL,
  /** Port the dev server binds to. Informational for the runtime code. */
  devPort: number('VITE_PORT', 0),
  locale: optional('VITE_SITE_LOCALE', 'en_IN'),
  brand: optional('VITE_SITE_NAME', 'SuperUI'),
  alternateBrand: optional('VITE_SITE_ALT_NAME', ''),
  logoPath: optional('VITE_LOGO_PATH', '/superui_logo.png'),
  themeColor: optional('VITE_THEME_COLOR', '#FF5E00')
});

/** SEO defaults baked into index.html; overridden at runtime by the DB `seo` section. */
export const SEO_CONFIG = Object.freeze({
  defaultTitle: required('VITE_DEFAULT_TITLE', 'Fallback <title> for crawlers that do not run JavaScript.'),
  defaultDescription: required('VITE_DEFAULT_DESCRIPTION', 'Fallback meta description.'),
  keywords: optional('VITE_SITE_KEYWORDS'),
  ogImage: optional('VITE_OG_IMAGE', SITE_CONFIG.logoPath),
  gscVerification: optional('VITE_GSC_VERIFICATION')
});

/** Public business coordinates. Drives GEO / local-SEO structured data. */
export const BUSINESS_CONFIG = Object.freeze({
  email: optional('VITE_CONTACT_EMAIL'),
  phone: optional('VITE_CONTACT_PHONE'),
  city: optional('VITE_BUSINESS_CITY'),
  region: optional('VITE_BUSINESS_REGION'),
  regionCode: optional('VITE_BUSINESS_REGION_CODE'),
  country: optional('VITE_BUSINESS_COUNTRY'),
  countryName: optional('VITE_BUSINESS_COUNTRY_NAME'),
  postalCode: optional('VITE_BUSINESS_POSTAL_CODE'),
  latitude: optional('VITE_BUSINESS_LATITUDE'),
  longitude: optional('VITE_BUSINESS_LONGITUDE'),
  areasServed: list('VITE_AREAS_SERVED')
});

/**
 * Dev-only sanity warning. Never throws and never changes behaviour: it just
 * makes an accidental production build against a loopback host obvious.
 */
export function warnIfLoopbackInDev() {
  if (!import.meta.env.DEV) return;
  if (isLoopback(SITE_HOST)) {
    logInfo(
      `[config] Frontend origin is a loopback address (${SITE_CONFIG.siteUrl}) - expected for local development. ` +
        'Set VITE_SITE_URL in frontend/.env before deploying.'
    );
  }
  if (!SITE_CONFIG.apiBaseUrl) {
    logInfo('[config] VITE_API_BASE_URL is blank: requests go through the Vite /api proxy.');
  }
}

export { MissingFrontendEnvError, isLoopback };
export default SITE_CONFIG;
