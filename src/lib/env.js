/**
 * Frontend runtime configuration, resolved from frontend/.env.
 *
 * Rules enforced here:
 *   1. No host, port or URL is hard-coded. Every value comes from a VITE_*
 *      variable when one is present.
 *   2. A missing variable must never break the running site. `frontend/.env` is
 *      git-ignored on purpose (VITE_ values are inlined into the public
 *      bundle), so a fresh CI/Vercel clone has NO env file at all. Anything
 *      that can be derived at runtime therefore falls back to a real source -
 *      `window.location.origin` for the public origin - and anything that
 *      cannot falls back to the same value index.html ships. Deriving beats
 *      guessing a host, and a blank page beats a wrong-but-loaded page.
 *   3. Only VITE_* variables are readable, and this module is the single place
 *      that touches import.meta.env. Nothing secret may ever be added to
 *      frontend/.env - VITE_ values are inlined into the public JS bundle.
 *   4. The admin username and password are NOT and must never be available
 *      here. They live only in backend/.env and are consumed server-side.
 */
import { logWarn } from './logger';

const env = import.meta.env;

/** Collected so a misconfigured build can be reported once, after start-up. */
const missingInBuild = [];

function optional(name, fallback = '') {
  const value = env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/**
 * Reads a variable, records that the build lacked it, and returns the fallback
 * so the app still runs.
 */
function configured(name, fallback = '') {
  const value = optional(name);
  if (!value) missingInBuild.push(name);
  return value || fallback;
}

function normalizeUrl(raw) {
  const parsed = new URL(raw);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`unsupported protocol "${parsed.protocol}"`);
  }
  return raw.replace(/\/+$/, '');
}

/**
 * Public origin of this frontend.
 *
 * Order: VITE_SITE_URL, then the origin the page was actually served from. The
 * second fallback is correct rather than a guess: for a static SPA the deployed
 * origin IS `location.origin`, so canonical URLs, Open Graph and structured data
 * come out right even when the build machine had no .env file.
 */
function resolveSiteUrl() {
  const configuredUrl = optional('VITE_SITE_URL');
  if (configuredUrl) {
    try {
      return normalizeUrl(configuredUrl);
    } catch {
      logWarn(
        `[config] VITE_SITE_URL="${configuredUrl}" is not an absolute http(s) URL - ` +
          'ignoring it and using the origin the page was served from.'
      );
    }
  } else {
    missingInBuild.push('VITE_SITE_URL');
  }

  const origin = typeof window !== 'undefined' ? window.location?.origin : '';
  if (origin && origin !== 'null') return normalizeUrl(origin);

  // Only reachable outside a browser (a build-time or test import).
  throw new Error(
    'VITE_SITE_URL is not set and no browser origin is available. ' +
      'Add it to frontend/.env (see frontend/.env.example).'
  );
}

function list(name, fallback = []) {
  const raw = configured(name);
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

/** Localhost/127.0.0.1/0.0.0.0 detection, used only for warnings. */
function isLoopback(host) {
  return /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i.test(host);
}

const SITE_URL = resolveSiteUrl();
const SITE_HOST = new URL(SITE_URL).host;

// Blank means "same origin", which is correct for a Vercel-hosted frontend
// whose /api routes are rewritten to the backend, and for local dev where the
// Vite proxy handles it.
const API_BASE_URL = configured('VITE_API_BASE_URL').replace(/\/+$/, '');

export const SITE_CONFIG = Object.freeze({
  /** Public origin of this frontend, e.g. "https://superui.in". */
  siteUrl: SITE_URL,
  siteHost: SITE_HOST,
  /** API origin used by the running app. "" means "same origin /api". */
  apiBaseUrl: API_BASE_URL,
  /** Port the dev server binds to. Informational for the runtime code. */
  devPort: number('VITE_PORT', 0),
  locale: configured('VITE_SITE_LOCALE', 'en_IN'),
  brand: configured('VITE_SITE_NAME', 'SuperUI'),
  alternateBrand: configured('VITE_SITE_ALT_NAME', 'SuperUI'),
  logoPath: configured('VITE_LOGO_PATH', '/superui_logo.png'),
  themeColor: configured('VITE_THEME_COLOR', '#FF5E00')
});

/**
 * SEO defaults. The fallbacks are byte-identical to the static values in
 * index.html, so a build without a .env file still serves correct metadata to
 * crawlers, and the two files cannot drift apart in behaviour.
 */
export const SEO_CONFIG = Object.freeze({
  defaultTitle: configured(
    'VITE_DEFAULT_TITLE',
    'SuperUI — Web Development, UI/UX Design & Custom Software Studio'
  ),
  defaultDescription: configured(
    'VITE_DEFAULT_DESCRIPTION',
    'SuperUI is a full-stack web development and UI/UX design studio in Warangal, Telangana, India. We build fast, secure, SEO-optimised websites, e-commerce stores and custom web applications. Get a fixed-price proposal within 24 hours.'
  ),
  keywords: configured('VITE_SITE_KEYWORDS'),
  ogImage: configured('VITE_OG_IMAGE', SITE_CONFIG.logoPath),
  gscVerification: configured('VITE_GSC_VERIFICATION')
});

/** Public business coordinates. Drives GEO / local-SEO structured data. */
export const BUSINESS_CONFIG = Object.freeze({
  email: configured('VITE_CONTACT_EMAIL'),
  phone: configured('VITE_CONTACT_PHONE'),
  city: configured('VITE_BUSINESS_CITY'),
  region: configured('VITE_BUSINESS_REGION'),
  regionCode: configured('VITE_BUSINESS_REGION_CODE'),
  country: configured('VITE_BUSINESS_COUNTRY', 'IN'),
  countryName: configured('VITE_BUSINESS_COUNTRY_NAME', 'India'),
  postalCode: configured('VITE_BUSINESS_POSTAL_CODE'),
  latitude: configured('VITE_BUSINESS_LATITUDE'),
  longitude: configured('VITE_BUSINESS_LONGITUDE'),
  areasServed: list('VITE_AREAS_SERVED')
});

/**
 * Reports a build that shipped without its env file. Never throws and never
 * changes behaviour - the values above are already usable fallbacks. This exists
 * so the gap is visible instead of silent.
 */
export function warnAboutMissingEnv() {
  if (!missingInBuild.length) return;

  const names = [...new Set(missingInBuild)].sort();
  const detail = import.meta.env.PROD
    ? 'These were absent from the BUILD, so defaults are in use. Set them as environment variables in the hosting provider (Project Settings > Environment Variables) for production.'
    : 'Add them to frontend/.env (see frontend/.env.example).';

  logWarn(`[config] ${names.length} frontend env variable(s) not set by this build: ${names.join(', ')}. ${detail}`);

  if (import.meta.env.PROD && isLoopback(SITE_HOST)) {
    logWarn(
      `[config] The page is being served from a loopback address (${SITE_URL}). ` +
        'Set VITE_SITE_URL on the host, or canonical URLs and structured data will be wrong.'
    );
  }
}

export { isLoopback };
export default SITE_CONFIG;
