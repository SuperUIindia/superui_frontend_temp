import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound (404) page.
 *
 * Rendered by the catch-all route in App.jsx for any URL the app does not
 * recognise. This prevents soft 404s — previously every unknown URL was
 * redirected to "/" with a 200, which Googlebot treats as a successful page
 * and may index, wasting crawl budget.
 *
 * The meta[name="robots"] noindex tag is set imperatively because this is a
 * pure SPA without a server-side 404 status. The `noindex` stops the page
 * from being indexed even though the HTTP status code is 200 (unavoidable in
 * a static SPA). The canonical still points to "/" so the link value from
 * any inbound links passes through to the homepage.
 */
export default function NotFound() {
  useEffect(() => {
    // Mark this page as noindex so search engines don't index a 404 page.
    let meta = document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    // Set a meaningful title for browser history and screen readers.
    const prev = document.title;
    document.title = 'Page Not Found — SuperUI';

    return () => {
      document.title = prev;
      // Restore the indexable robots directive when navigating away.
      if (meta) {
        meta.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large');
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#111111] px-6 py-20">
      <div className="max-w-md text-center">
        {/* Large 404 number */}
        <p
          className="text-[120px] sm:text-[160px] font-extrabold leading-none text-[#FF5E00]/10 select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] mt-2 mb-4 tracking-tight">
          Page not found
        </h1>

        <p className="text-base text-[#6B6B6B] leading-relaxed mb-8">
          The page you were looking for doesn&rsquo;t exist or has been moved.
          Head back to the homepage or start a project directly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#FF5E00] text-white font-semibold text-sm hover:bg-[#e05500] transition-colors duration-200 w-full sm:w-auto"
          >
            Go to Homepage
          </Link>
          <a
            href="mailto:hello.superui@gmail.com"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#EDEDED] text-[#111111] font-semibold text-sm hover:border-[#FF5E00] hover:text-[#FF5E00] transition-colors duration-200 w-full sm:w-auto"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}

