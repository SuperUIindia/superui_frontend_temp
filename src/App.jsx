import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EnquiryForm from './pages/EnquiryForm';
import ProtectedRoute from './components/ProtectedRoute';
import { SiteContentProvider, useContent, useSiteContent } from './lib/siteContent';
import { applySeoContent, applySeoGraph, applyVerificationTags } from './lib/seo';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-load admin modules to optimize bundle size & page speed
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div
        className="w-8 h-8 rounded-full border-2 border-[#FF5E00] border-t-transparent animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function App() {
  // Search Console verification can only be injected at runtime, so it runs
  // once on mount rather than inside the route-dependent effect below.
  useEffect(() => {
    applyVerificationTags();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        {/* Every public section reads its copy from this provider, which loads
            the whole sitecontents collection once per page load. */}
        <SiteContentProvider>
          <SeoSync />
          {/* A lazy admin chunk that fails to load must not blank the site. */}
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<Home />} />

                {/* Standalone enquiry form. Renders the same ContactForm the home
                    page does and posts to the same endpoint, so both write to
                    one leads collection. */}
                <Route path="/enquiryform" element={<EnquiryForm />} />

                {/* Legacy contact-form URL. Serves the same enquiry form so a
                    visitor reaching /lead/contactform is not silently dropped
                    onto the home page by the catch-all below. */}
                <Route path="/lead/contactform" element={<EnquiryForm />} />

                {/* Admin Login */}
                <Route path="/admin/login" element={<Login />} />

                {/* Protected Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SiteContentProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

/**
 * Keeps the document head in sync with the database-driven `seo` section and
 * (re)emits the JSON-LD graph for SEO / AEO / GEO.
 *
 * The admin routes are excluded: indexing a login screen helps nobody and the
 * head should describe the public site, not the dashboard.
 */
function SeoSync() {
  const seo = useContent('seo');
  const { content } = useSiteContent();
  // useLocation, not window.location: a direct window read is not reactive, so
  // a client-side navigation into /admin would never re-run this effect and the
  // admin routes would stay indexable.
  const { pathname } = useLocation();
  const isPublicPage = !pathname.startsWith('/admin');

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (!isPublicPage) {
      // Explicitly keep the dashboard and login screen out of every index.
      let meta = document.head.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow, noarchive');
      return undefined;
    }

    // Returning to the public site must restore the indexable directive that the
    // admin branch just overwrote.
    const meta = document.head.querySelector('meta[name="robots"]');
    if (meta && !/index/i.test(meta.getAttribute('content') || '')) {
      meta.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large');
    }

    applySeoContent(seo);
    applySeoGraph({ seo, sections: content });
    return undefined;
    // `content` changes identity whenever any section is reloaded, which is
    // exactly when the JSON-LD graph must be regenerated.
  }, [seo, content, isPublicPage]);

  return null;
}