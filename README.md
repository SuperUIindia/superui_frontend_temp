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

- Node.js **>= 20.19**
- npm 10+
- The backend API reachable (see `VITE_API_BASE_URL` below)

## Getting started

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:5173
```

`.env` is git-ignored. Only `.env.example` is committed.

## Scripts

| Command           | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR and the `/api` proxy      |
| `npm run build`   | Production build into `dist/`                      |
| `npm run preview` | Serve the built `dist/` locally                    |

## Configuration

Every runtime value comes from a `VITE_*` variable. Nothing hard-codes a host,
port or URL — see `src/lib/env.js`, which is the only module that touches
`import.meta.env` and which throws at start-up if a required value is missing.

| Variable | Purpose |
| --- | --- |
| `VITE_PORT` | Dev/preview server port. |
| `VITE_DEV_HOST` | Interface the dev server binds to. Keep `localhost`; `0.0.0.0` exposes the source and the `/api` proxy to the whole network. |
| `VITE_SITE_URL` | Public origin. Drives canonical URLs, Open Graph and all structured data. |
| `VITE_PROXY_TARGET` | Origin the **dev server** proxies `/api` to. |
| `VITE_API_BASE_URL` | API origin the **running app** uses. Leave blank locally (the proxy handles it); set the deployed API origin in production. |
| `VITE_SITE_NAME` / `VITE_SITE_ALT_NAME` | Brand name and alternate name. |
| `VITE_LOGO_PATH` | Logo path served from `public/`. |
| `VITE_DEFAULT_TITLE` / `VITE_DEFAULT_DESCRIPTION` / `VITE_SITE_KEYWORDS` | SEO floor for crawlers that never run JavaScript. |
| `VITE_CONTACT_*` / `VITE_BUSINESS_*` / `VITE_AREAS_SERVED` | Business coordinates used for local-SEO structured data. |
| `VITE_INSTAGRAM_URL` / `VITE_FACEBOOK_URL` / `VITE_LINKEDIN_URL` | Social profile links. A blank value hides that footer icon. |
| `VITE_GSC_VERIFICATION` | Google Search Console token, injected at runtime by `src/lib/seo.js`. |

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

On any other static host, `public/_redirects` provides the equivalent SPA
fallback for Netlify. Replicate the `headers` block from `vercel.json` by hand —
`index.html` alone does not set them.

The build needs `VITE_SITE_URL`, `VITE_DEFAULT_TITLE` and
`VITE_DEFAULT_DESCRIPTION` in the host's environment; `src/lib/env.js` throws
without them rather than silently building a page with the wrong origin.