/**
 * Central social profile links.
 *
 * Every Instagram icon across the app links to the profile configured in
 * frontend/.env, so the URL only ever has to be changed there:
 *   VITE_INSTAGRAM_URL   full profile URL
 *   VITE_FACEBOOK_URL    full page URL
 *   VITE_LINKEDIN_URL    full company URL
 *
 * Leave a value blank to hide that icon (the footer skips unconfigured links).
 * Nothing here is hard-coded - there is deliberately no fallback profile URL.
 */
import { SITE_CONFIG } from './env';
import { safeUrl } from './sanitize';

const clean = (value) => (value || '').trim().replace(/\/+$/, '');

const readEnv = (name) => clean(import.meta.env[name]);

export const BRAND_NAME = SITE_CONFIG.brand;

/**
 * Env-provided URLs are still run through safeUrl: a mistyped value in .env
 * (or a value pasted from somewhere else) must not become a `javascript:` sink
 * in a rendered href.
 */
export const INSTAGRAM_URL = safeUrl(readEnv('VITE_INSTAGRAM_URL'));
export const FACEBOOK_URL = safeUrl(readEnv('VITE_FACEBOOK_URL'));
export const LINKEDIN_URL = safeUrl(readEnv('VITE_LINKEDIN_URL'));

/** Direct-message deep link with tracking params for the contact form. */
export const INSTAGRAM_DM_URL = INSTAGRAM_URL
  ? `${INSTAGRAM_URL}/?utm_source=superui&utm_medium=contact_form`
  : '';

/** Handle shown in link text, derived from the profile URL when not set. */
export const INSTAGRAM_HANDLE = (() => {
  const explicit = (readEnv('VITE_INSTAGRAM_HANDLE') || '').trim();
  if (explicit) return explicit.startsWith('@') ? explicit : `@${explicit}`;
  const match = INSTAGRAM_URL.match(/instagram\.com\/([^/?#]+)/i);
  if (match && match[1] && !match[1].includes('.')) {
    return `@${match[1].replace(/^@/, '')}`;
  }
  return '';
})();

/** Footer icon order: Facebook, Instagram, LinkedIn. Unconfigured links drop out. */
export const SOCIAL_LINKS = [
  { id: 'facebook', label: `${BRAND_NAME} Facebook`, href: FACEBOOK_URL, hover: 'hover:text-[#1877F2] hover:border-[#1877F2]/40' },
  { id: 'instagram', label: `${BRAND_NAME} Instagram`, href: INSTAGRAM_URL, hover: 'hover:text-[#E1306C] hover:border-[#E1306C]/40' },
  { id: 'linkedin', label: `${BRAND_NAME} LinkedIn`, href: LINKEDIN_URL, hover: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40' }
].filter((link) => link.href);
