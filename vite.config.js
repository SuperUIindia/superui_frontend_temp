import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev/preview server and production build configuration.
 *
 * Port and proxy target are read from frontend/.env. Neither is hard-coded, so
 * there is no chance of silently binding an unexpected port or proxying to the
 * wrong backend - but they are ONLY required while serving. A production build
 * (`npm run build`, and every CI/Vercel build) must not fail just because the
 * build machine has no dev server to run, which is why the requirement below is
 * gated on the command instead of applied unconditionally.
 */
function optionalInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

export default defineConfig(({ mode, command }) => {
  const isServe = command === 'serve';
  const env = loadEnv(mode, process.cwd(), '');
  const port = optionalInt((env.VITE_PORT || '').trim(), 5173);
  const proxyTarget = (env.VITE_PROXY_TARGET || '').trim();
  const proxyEnabled = isServe && Boolean(proxyTarget);

  // Localhost by default. `host: true` exposed the dev server on every network
  // interface, which on a shared or public machine hands the source and the API
  // proxy to anyone on the same network. Opt in with VITE_DEV_HOST=0.0.0.0 when
  // you genuinely need container or LAN access.
  const devHost = (env.VITE_DEV_HOST || 'localhost').trim() || 'localhost';

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: devHost,
      // The /api proxy is dev-only. Without a target, requests fall through to
      // VITE_API_BASE_URL exactly as they do in production.
      proxy: proxyEnabled
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              // Never let the dev server follow a redirect to another origin
              // with the cookie attached.
              followRedirects: false
            }
          }
        : undefined
    },
    preview: {
      port,
      strictPort: true,
      host: devHost
    },
    build: {
      // Source maps stay off in production so the bundle is not a free map of
      // the application internals.
      sourcemap: false,
      target: 'es2020',
      cssMinify: 'lightningcss',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          /**
           * Split the three vendors that are always on the critical path out of
           * the app chunk, so a copy edit does not invalidate ~400 kB of cache.
           *
           * Two rules matter here:
           *   1. No catch-all chunk. A named chunk that holds BOTH entry-graph and
           *      lazy-only modules becomes a static import of the entry, which
           *      preloads everything in it. A `return 'vendor'` fallback does
           *      exactly that and drags Recharts onto the public first paint.
           *   2. Anything not named here is left to the bundler, which keeps the
           *      admin-only Recharts/d3 code inside the lazy Dashboard chunk.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'motion';
            }
            if (id.includes('react-router')) return 'router';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'react';
            }
            return undefined;
          }
        }
      }
    }
  };
});