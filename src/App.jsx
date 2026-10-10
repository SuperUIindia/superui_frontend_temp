import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EnquiryForm from './pages/EnquiryForm';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { SiteContentProvider, useContent, useSiteContent } from './lib/siteContent';
import { applySeoContent, applySeoGraph, applyVerificationTags } from './lib/seo';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { PATHS } from './routes/paths';

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
  useEffect(() => {
    applyVerificationTags();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <SiteContentProvider>
          <SeoSync />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing Page */}
                <Route path={PATHS.home} element={<Home />} />

                {/* Canonical Enquiry Page */}
                <Route path={PATHS.enquiry} element={<EnquiryForm />} />

                {/* Legacy contact / enquiry form redirects */}
                <Route path={PATHS.enquiryLegacy} element={<Navigate to={PATHS.enquiry} replace />} />
                <Route path={PATHS.leadContactLegacy} element={<Navigate to={PATHS.enquiry} replace />} />

                {/* Admin Login */}
                <Route path={PATHS.adminLogin} element={<Login />} />
                <Route path={PATHS.loginLegacy} element={<Navigate to={PATHS.adminLogin} replace />} />

                {/* Admin Console Route Redirects & Tabs */}
                <Route path={PATHS.admin} element={<Navigate to={PATHS.adminOverview} replace />} />

                <Route
                  path={`${PATHS.admin}/*`}
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 handler */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SiteContentProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

/**
 * Keeps document head in sync with site content SEO
 */
function SeoSync() {
  const seo = useContent('seo');
  const { content } = useSiteContent();
  const { pathname } = useLocation();
  const isPublicPage = !pathname.startsWith('/admin');

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (!isPublicPage) {
      let meta = document.head.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow, noarchive');
      return undefined;
    }

    const meta = document.head.querySelector('meta[name="robots"]');
    if (meta && !/index/i.test(meta.getAttribute('content') || '')) {
      meta.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large');
    }

    applySeoContent(seo);
    applySeoGraph({ seo, sections: content });
    return undefined;
  }, [seo, content, isPublicPage]);

  return null;
}