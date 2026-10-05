# change.md — superui.in issues found and what to do

Date: 2026-10-05
Scope: `frontend` (`superui_frontend_temp`) and `backend` (`superui_backend_temp`)

---

## TL;DR

Every error in your console came from a **stale deployment**, not from the current
code. All of the following are already fixed and committed on
`frontend@97b2a66` and `backend@8a8623d`. **The only remaining action is to
redeploy the frontend on Vercel.**

Proof: the bundle currently served at `https://www.superui.in/` is
`index-CdmVMzyv.js`, and it does **not** contain `submittedFullName`,
`normalizeApiBase`, or `cloudflareinsights` — all three are present in the repo.
It was built before commits `68cdd44` and `97b2a66`.

---

## 1. `/api/api/content/...` returned 404 — FIXED, needs redeploy

**What you saw**

```
/api/api/content/services  404
/api/api/content           404
/api/api/popups            404
```

**Cause.** Two separate things compounded:

- `VITE_API_BASE_URL` was set to `https://superui.in/api`, which repeats the
  prefix. Every endpoint passed to the API client already starts with `/api/`,
  so the base must contribute nothing beyond the origin. The result was
  `/api` + `/api/content` = `/api/api/content`.
- The old `vercel.json` rewrite used a negative lookahead that also excluded
  `/api/`, so even a correct path was not proxied.

**Fix (`frontend/src/lib/env.js`).** `normalizeApiBase()` now treats
`VITE_API_BASE_URL` as a *prefix*, never an endpoint:

| Value you set | Resolves to |
| --- | --- |
| *(blank)* | same-origin `/api/...` |
| `/api` | same-origin `/api/...` |
| `https://api.example.com` | `https://api.example.com/api/...` |
| `https://api.example.com/api` | `https://api.example.com/api/...` |

All four are correct. Verified: `/api/content`, `/api/content/services`
(15 categories) and `/api/popups` all return 200 on the live site today.

---

## 2. `www.superui.in/admin` returned 404 — FIXED, needs redeploy

**What you saw**

```
/admin         404
/admin/login   404
```

**Cause.** The old SPA rewrite in `vercel.json` was:

```json
{ "source": "/((?!api/|assets/|.*\\.[a-zA-Z0-9]+$).*)", "destination": "/index.html" }
```

That regex is not reliably evaluated the way it looks on Vercel, and the live
site 404s on **every** unknown path, not just `/admin`:

| Path | Live status |
| --- | --- |
| `/` | 200 |
| `/admin` | 404 |
| `/admin/login` | 404 |
| `/does-not-exist-xyz` | 404 |
| `/some/deep/route` | 404 |

**Fix (`frontend/vercel.json`).** Split into two unambiguous rules, the `/api`
proxy first:

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://superui-backend-temp.onrender.com/api/:path*" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

`/admin` is a client-side route. It must be served `index.html` and then resolved
by React Router — there is no `/admin` directory in the build output.

---

## 3. Cloudflare Insights blocked by CSP — FIXED, needs redeploy

**What you saw**

```
Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/...'
violates the following Content Security Policy directive: "script-src 'self'"
```

**Cause.** Cloudflare injects the Web Analytics beacon automatically, and
`script-src 'self'` blocked it.

**Fix (`frontend/vercel.json`).** Two additions:

- `script-src 'self' https://static.cloudflareinsights.com`
- `connect-src` now also allows `https://cloudflareinsights.com`

Confirmed present in the live CSP header already.

---

## 4. 16 environment variables reported unset — ACTION REQUIRED

**What you saw**

```
[config] 16 frontend env variable(s) not set by this build:
VITE_BUSINESS_CITY, VITE_BUSINESS_COUNTRY, ... VITE_THEME_COLOR
```

**This is not a crash.** All 16 have working fallbacks in
`frontend/src/lib/env.js`, verified by building with `.env` removed entirely —
the build succeeds and the site renders. The warning is telling you that
`frontend/.env` is **not deployed** (correctly, it is git-ignored), so you must
set them as Vercel environment variables.

**What you lose until you set them:** Open Graph tags, `twitter:` cards and the
JSON-LD `PostalAddress` / `GeoCoordinates` fall back to generic values, so
link previews and local SEO are weaker. Nothing breaks.

**Set these in Vercel → Project → Settings → Environment Variables** (Production,
Preview and Development):

| Variable | Value | Why it matters |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://www.superui.in` | Canonical URLs, OG `url`, JSON-LD `@id` |
| `VITE_DEFAULT_TITLE` | `SuperUI — Web Development, UI/UX Design & Custom Software Studio` | `<title>` for crawlers |
| `VITE_DEFAULT_DESCRIPTION` | *(the full 232-char description)* | Meta description |
| `VITE_SITE_NAME` | `SuperUI` | Brand in schema |
| `VITE_SITE_ALT_NAME` | `SuperUI` | `alternateName` |
| `VITE_SITE_KEYWORDS` | *(the keyword list)* | Keywords meta |
| `VITE_SITE_LOCALE` | `en_IN` | `og:locale` |
| `VITE_LOGO_PATH` | `/superui_logo.png` | Logo + schema logo |
| `VITE_OG_IMAGE` | `/superui_logo.png` | Link preview image |
| `VITE_THEME_COLOR` | `"#FF5E00"` | Theme colour — **must be quoted** |
| `VITE_CONTACT_EMAIL` | `hello.superui@gmail.com` | `ContactPoint` |
| `VITE_CONTACT_PHONE` | `+918000000000` | `telephone` |
| `VITE_BUSINESS_CITY` | `Warangal` | `addressLocality` — **city only** |
| `VITE_BUSINESS_REGION` | `Telangana` | `addressRegion` |
| `VITE_BUSINESS_REGION_CODE` | `IN-TG` | `geo.region`, `addressCountry` |
| `VITE_BUSINESS_COUNTRY` | `IN` | Country fallback |
| `VITE_BUSINESS_COUNTRY_NAME` | `India` | `geo.placename` |
| `VITE_BUSINESS_POSTAL_CODE` | `506002` | Postal code |
| `VITE_BUSINESS_LATITUDE` | `17.9689` | `geo.position` |
| `VITE_BUSINESS_LONGITUDE` | `79.5941` | `geo.position` |
| `VITE_AREAS_SERVED` | `India, United Arab Emirates, United Kingdom, United States, Singapore, Australia, Canada, Germany` | `areaServed` |

Two traps, both already guarded in code but worth avoiding anyway:

- **`VITE_THEME_COLOR` must be quoted.** dotenv treats an unquoted value starting
  with `#` as a comment, so `#FF5E00` loads as an **empty string**.
- **`VITE_BUSINESS_CITY` must be the city alone.** `Warangal, Telangana, India.`
  would render `geo.placename` as `Warangal, Telangana, India., India`. The code
  now strips it, but set it correctly.

Do **not** set `VITE_API_BASE_URL`. Leave it blank so `/api` is same-origin and
routed by the Vercel rewrite. Setting it to a separate origin reintroduces CORS,
and because requests carry `credentials: 'include'`, the session cookie would
also need `SameSite=None; Secure`.

---

## 5. Full name instead of first name — ALREADY FIXED

You asked that the confirmation show the full name typed into **Your Name ***.

Splitting on whitespace and taking `[0]` greeted "Priya Sharma" as
"Thank you dear Priya!" and dropped the surname. Now the name is used exactly as
typed, with runs of whitespace collapsed for tidiness:

```js
const submittedFullName = (formData.name || '').trim().replace(/\s+/g, ' ');
```

Rendered through `SubmissionSuccessPopup` in a portal, so it appears as a popup
over the form. Live verification blocked: submitting a lead would create a real
record in your database, and an automated submission is exactly the kind of
outward-facing action to confirm first. Tell me if you want me to submit a test
lead and then delete it.

---

## 6. Admin login page — FIXED, needs redeploy

After redeploying, `https://www.superui.in/admin` serves the app and React Router
resolves it to the login screen. `/admin` is deliberately:

- `X-Robots-Tag: noindex, nofollow, noarchive` so it never enters a search index
- `Cache-Control: no-store, max-age=0` so a shared machine cannot cache it

Auth is enforced server-side by the API on every `/api/admin/*` route. The
client-side route guard is a UX convenience only — hiding it grants no access.

---

## Redeploy checklist

1. Vercel → Project → Settings → Environment Variables — add the values from
   section 4, with `VITE_THEME_COLOR` quoted.
2. Redeploy. No new commit is needed; `main` is already at `97b2a66`.
3. Verify: `/admin` returns 200, `/api/content` returns 200 JSON, and the console
   CSP warning is gone.
4. Hard-refresh (Ctrl+Shift+R) — the old bundle is cached at the edge
   (`X-Vercel-Cache: HIT`, `Age: 24` was observed).

---

## Repository state

| Repo | Branch | HEAD | Contents |
| --- | --- | --- | --- |
| `superui_frontend_temp` | `main` | `97b2a66` | frontend only |
| `superui_backend_temp` | `main` | `8a8623d` | backend only |

Both working trees are clean. Neither contains `.env`, `node_modules/`, `dist/`
or any test file.
