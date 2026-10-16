import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EnquiryForm from './pages/EnquiryForm';
import DigitalProductsPage from './pages/DigitalProductsPage';
import EbooksDigitalPage from './pages/EbooksDigitalPage';
import CreativeResourcesPage from './pages/CreativeResourcesPage';
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

                {/* Digital Product Pages */}
                <Route path={PATHS.digitalProducts} element={<DigitalProductsPage />} />
                <Route path={PATHS.ebooksDigital} element={<EbooksDigitalPage />} />
                <Route path={PATHS.creativeResources} element={<CreativeResourcesPage />} />

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
 * Pages Google may index. Every other path (admin, legacy redirects, 404s for
 * mistyped URLs) gets "noindex". When you add a new public page, such as a
 * service or city landing page, ADD ITS PATH HERE or it will not be indexed.
 */
const INDEXABLE_PATHS = new Set([PATHS.home, PATHS.enquiry, PATHS.digitalProducts, PATHS.ebooksDigital, PATHS.creativeResources]);

const ROBOTS_INDEX = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, nofollow, noarchive';

function setRobots(content) {
  let meta = document.head.querySelector('meta[name="robots"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Keeps document head in sync with site content SEO
 */
function SeoSync() {
  const seo = useContent('seo');
  const { content } = useSiteContent();
  const { pathname } = useLocation();

  // "/enquiry/" and "/enquiry" are the same page
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const isIndexable = INDEXABLE_PATHS.has(normalizedPath);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (!isIndexable) {
      setRobots(ROBOTS_NOINDEX);
      return undefined;
    }

    // Set explicitly. The old check /index/i also matched "noindex", so after
    // visiting /admin the tag stayed noindex on public pages.
    setRobots(ROBOTS_INDEX);

    applySeoContent(seo);
    applySeoGraph({ seo, sections: content });
    return undefined;
  }, [seo, content, isIndexable]);

  return null;
}
