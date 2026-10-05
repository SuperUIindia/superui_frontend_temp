import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Horizontally scrollable table area with explicit scroll controls.
 *
 * The native scrollbar is hidden (overflow stays hidden on the page, the inner
 * track scrolls), so overflow is driven by buttons instead of a scrollbar that
 * may not be visible on touch devices or short viewports.
 */
export default function TableScrollArea({ children, className = '' }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < max - 1);
  }, []);

  // Re-evaluate on mount, on content/layout changes and on window resize
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [sync, children]);

  const scrollByStep = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        onScroll={sync}
        tabIndex={0}
        role="region"
        aria-label="Scrollable table, use left and right arrow keys or the arrow buttons"
        className="overflow-x-auto overflow-y-hidden scroll-x-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5E00] focus-visible:ring-inset"
      >
        {children}
      </div>

      {/* Left control */}
      {canScrollLeft && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            aria-label="Scroll table left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white border border-[#EDEDED] text-[#6B6B6B] hover:text-[#FF5E00] hover:border-[#FF5E00]/40 shadow-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Right control */}
      {canScrollRight && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            aria-label="Scroll table right"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white border border-[#EDEDED] text-[#6B6B6B] hover:text-[#FF5E00] hover:border-[#FF5E00]/40 shadow-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}