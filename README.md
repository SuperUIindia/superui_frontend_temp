# superui_frontend_temp

React 19 + Vite 8 frontend for **SuperUI** — the public marketing site and the
private admin analytics dashboard.

This repository contains the frontend only. The Express/MongoDB API it talks to
is a separate service and is not part of this repository.

---

## Stack

| Concern      | Choice                                          |
| ------------ | ----------------------------------------------- |
| UI           | React 19, React Router 7                         |
| Build        | Vite 8, `@vitejs/plugin-react`                   |
| Styling      | Tailwind CSS 4 (`@tailwindcss/postcss`)          |
| Animation    | Framer Motion 14                                 |
| Icons        | lucide-react                                     |
| Charts       | Recharts 3 (admin dashboard only)                |

## Requirements

- Node.js **24.x** (see [Node version](#node-version) below)
- npm 10+
- The backend API reachable (see `VITE_API_BASE_URL` below)

### Node version

Node 24 is pinned in two places that must agree:

- `package.json` → `"engines": { "node": "24.x" }`
- `.nvmrc` → `24`

`24.x` is a deliberately bounded range. Vite 8 itself accepts a wider set
(`^20.19.0 || >=22.12.0`), but an open-ended range such as `>=20.19.0` lets the
hosting provider silently move the build to a new major release the moment one
ships — which can break a build that was never tested against it. Bounding the
major means patch and minor updates still land automatically, but a major bump
becomes a deliberate, reviewable change.

Locally, use whichever of these matches:

```bash
nvm use            # reads .nvmrc
# or
node --version     # expect v24.x
```

## Getting started

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:5173
```

`.env` is git-ignored, so it is never shared. Two env files are committed:
`.env.example` (the template) and `.env.production` (the public production
values). `.env.production` is safe to commit because every `VITE_*` value is
inlined into the public JavaScript bundle by definition — it holds brand, SEO
and GEO values only, never a secret. Without it a fresh Vercel clone builds with
fallback defaults and the start-up warning reports every value the build lacked.

## Scripts

| Command           | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR and the `/api` proxy      |
| `npm run build`   | Production build into `dist/`                      |
| `npm run preview` | Serve the built `dist/` locally                    |

## Configuration

Every runtime value comes from a `VITE_*` variable or a fallback defined in one
place — `src/lib/env.js` is the only module that touches `import.meta.env`.

**No variable is required for the app to run.** `.env` is git-ignored, so a fresh
clone or a CI build falls back to `.env.production` (committed public values)
and then to the defaults below. The fallbacks are chosen so a missing value
degrades rather than breaks:

| Missing value | Falls back to |
| --- | --- |
| `VITE_SITE_URL` | the origin the page was served from (`window.location.origin`) — correct for a static SPA, and never a guessed host |
| `VITE_DEFAULT_TITLE`, `VITE_DEFAULT_DESCRIPTION` | the byte-identical static values in `index.html` |
| `VITE_SITE_NAME`, `VITE_LOGO_PATH`, `VITE_THEME_COLOR`, `VITE_SITE_LOCALE` | SuperUI brand defaults |
| `VITE_BUSINESS_COUNTRY`, `VITE_BUSINESS_COUNTRY_NAME` | `IN` / `India` |
| everything else | empty string, and the feature that needs it is skipped |

`warnAboutMissingEnv()` (called once from `src/main.jsx`) reports anything the
build lacked, so a misconfigured deployment is visible in the console instead of
silent.

### Setting variables on Vercel

`.env` is never deployed, and `.env.production` already supplies the values below.
Set a Vercel variable only to **override** it —
**Vercel → Project → Settings → Environment Variables** for Production, Preview
and Development as needed. Variables set in Vercel take precedence over
`.env.production`, and `.env.production` takes precedence over the fallbacks in
`src/lib/env.js`. The usual reason to override is `VITE_API_BASE_URL`:

| Variable | Why it matters |
| --- | --- |
| `VITE_SITE_URL` | Canonical URLs, Open Graph, JSON-LD `@id`s |
| `VITE_DEFAULT_TITLE` / `VITE_DEFAULT_DESCRIPTION` | What crawlers and AI answer engines read |
| `VITE_API_BASE_URL` | Only if the API is on a different origin than the frontend |
| `VITE_BUSINESS_CITY` / `_REGION` / `_REGION_CODE` / `_POSTAL_CODE` / `_LATITUDE` / `_LONGITUDE` | GEO / local-SEO structured data |
| `VITE_CONTACT_EMAIL` / `VITE_CONTACT_PHONE` | `ContactPoint` structured data |

### Pointing `/api` at the backend

With `VITE_API_BASE_URL` blank, requests go to same-origin `/api/...`. That only
reaches the backend when the host proxies `/api` to it. On Vercel, add both
rewrites to `vercel.json` — **in this order**:

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://YOUR-BACKEND.example.com/api/:path*" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Do **not** try to exclude `api/` and `assets/` from the SPA rewrite with a
negative lookahead such as `"/((?!api/|assets/).*)"`. Vercel matches `source`
with path-to-regexp, not a full regex engine, and that pattern silently matches
nothing: every client-side route returns `404` from the static origin. The symptom
is a homepage that loads but a `/admin` that never resolves. `rewrites` are only
applied *after* the filesystem check, so the plain `/(.*)` catch-all cannot shadow
`index.html`, `/assets/*` or any other real file — they are served before any
rewrite is considered.

The `/api` rewrite must come **first** so an API path is never answered with
`index.html`.

Verify both halves after any deploy:

```bash
curl -sI https://YOUR-FRONTEND.example.com/admin            # must be 200, not 404
curl -s  https://YOUR-FRONTEND.example.com/api/health      # must be the API's JSON
```

If the backend is on a different domain instead, set `VITE_API_BASE_URL` to that
origin and add the frontend origin to the backend's `CORS_ORIGINS`. Either way the
value is normalised by `src/lib/env.js`: a base of `""`, `/api`,
`https://host` and `https://host/api` all resolve to the same URL, so a trailing
`/api` in the variable can never produce `/api/api/content`.

### Security rules for `.env`

Anything prefixed `VITE_` is **inlined into the public JavaScript bundle** and is
readable by every visitor.

- Never put `ADMIN_USERNAME`, `ADMIN_PASSWORD`, API keys or tokens here. Admin
  credentials live only in the backend's own `.env`.
- Only set `VITE_GSC_VERIFICATION` to a real token — a placeholder is published
  as a bogus verification tag and makes Search Console report an ownership
  mismatch.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Landing page: hero, services, process, contact form. |
| `/admin/login` | public | Admin sign-in. Sets an httpOnly session cookie issued by the API. |
| `/admin` | authenticated | Analytics, leads, visitor telemetry, offer popups, content sections. |
| anything else | public | Redirects to `/`. |

Client-side route protection is a UX convenience only. **Every admin endpoint
is authorised server-side by the API.**

## Project layout

```
frontend/
├── index.html            Pre-render SEO/AEO/GEO defaults + static JSON-LD graph
├── vercel.json           SPA rewrites + security response headers
├── vite.config.js        Dev server, proxy, build and chunking
├── public/               Copied verbatim to dist/ (robots, sitemap, llms.txt, logo)
└── src/
    ├── main.jsx          Entry point: config check + React root
    ├── App.jsx           Routes, SEO sync, toast provider
    ├── components/       Presentational + admin UI
    ├── lib/
    │   ├── env.js        Single reader of import.meta.env
    │   ├── api.js        Fetch client: endpoint allowlist, timeout, credentials
    │   ├── sanitize.js   URL/colour/handle validation for database values
    │   ├── seo.js        Meta tags and the JSON-LD graph
    │   ├── siteContent.jsx  Database-driven page copy, with fallbacks
    │   ├── logger.js     Dev-only console output
    │   └── tracking.js   Anonymous visit/click telemetry
    └── pages/            Home and the admin routes
```

## Security notes

These are the invariants the code maintains. Please keep them when editing.

- **No secret ever enters the bundle.** Only `VITE_*` values are read, and none
  of them may hold a secret.
- **Database values are never trusted as URLs.** Every `href`, `src`, popup
  redirect and colour interpolated into a `style` attribute goes through
  `src/lib/sanitize.js`. A stored `javascript:` URL would otherwise execute on
  click, and a stored colour would break out of the CSS declaration.
- **API requests are same-origin paths only.** `src/lib/api.js` rejects anything
  that is not a plain `/api/...` path, so a value that reached it from the
  database cannot redirect a cookie-bearing request to another origin.
- **No inline scripts.** `vercel.json` sets `script-src 'self'`. Keep it that way
  when adding third-party tags — the JSON-LD blocks are data, not script.
- **External links use `rel="noopener noreferrer"`.**
- **`/admin` is `noindex` and `no-store`**, both in the response headers and in
  the document head.
- **Source maps are off in production builds.**
- **Dev telemetry is anonymous.** Visitor IDs are random v4 UUIDs in
  `localStorage`; no IP address or fingerprint is collected client-side.

## Deployment

`vercel.json` supplies the SPA rewrite and the security headers (CSP, HSTS,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-*`).

Two things to configure on the host:

1. **Environment variables** — see [Setting variables on Vercel](#setting-variables-on-vercel).
2. **`/api` routing** — see [Pointing `/api` at the backend](#pointing-api-at-the-backend). Until this
   is set, the frontend loads but every API call 404s and the page falls back to
   its built-in content.

Set the host's Node version to 24 to match `.nvmrc`.

On any other static host, `public/_redirects` provides the equivalent SPA
fallback for Netlify. Replicate the `headers` block from `vercel.json` by hand —
`index.html` alone does not set them.

## Troubleshooting

**Blank page, `MissingFrontendEnvError` or a blank `#root` in the console.**
Fixed in the current revision — an older build threw when `VITE_SITE_URL` was
absent, which is every Vercel build, because `.env` is not deployed. If you still
see it, set `VITE_SITE_URL` on the host and redeploy.

**`Loading a manifest from 'https://vercel.com/...' violates Content Security
Policy`.** Vercel's dashboard probes the deployment's web manifest from its own
origin. `manifest-src 'self' https://vercel.com` in `vercel.json` permits that
probe; it does not weaken `script-src`, so no Vercel script can execute in your
page.

**API requests return the HTML page instead of JSON, or 404.** The `/api`
rewrite is missing or ordered after the SPA rewrite — see above.