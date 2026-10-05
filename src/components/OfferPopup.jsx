import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { logError } from '../lib/logger';
import { safeUrl, safeImageUrl, EXTERNAL_REL } from '../lib/sanitize';
import Button from './Button';

const DISMISS_KEY = 'superui:popup-dismissed';
const POLL_MS = 60000;

/**
 * How long a dismissed popup stays hidden.
 *
 * Was sessionStorage, which is thrown away the moment the tab closes, so the
 * poster reappeared on every single page load and refresh. localStorage
 * survives the tab, so one dismissal keeps the poster away for a week instead.
 */
const REOPEN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Ids of the popups this visitor has already dismissed and that have not yet
 * aged out.
 *
 * Entries are `{ id, at }` rather than bare ids because the cool-down has to be
 * measured from the moment of dismissal. Expired entries are pruned on read as
 * well as on write, so the stored list cannot grow without bound.
 */
function hiddenIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const live = parsed.filter(
      (entry) => entry && typeof entry === 'object' && now - entry.at < REOPEN_AFTER_MS
    );
    if (live.length !== parsed.length) {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(live));
    }
    return live.map((entry) => entry.id).filter(Boolean);
  } catch {
    return [];
  }
}

function rememberDismissed(id) {
  try {
    const stored = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
    const kept = Array.isArray(stored) ? stored.filter((entry) => entry && entry.id !== id) : [];
    localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify([...kept, { id, at: Date.now() }].slice(-20))
    );
  } catch {
    /* storage unavailable (private mode) - popup simply reappears */
  }
}

function isExpired(popup) {
  return new Date(popup.toDate).getTime() < Date.now();
}

/**
 * Visitor-facing offer popup.
 *
 * Shows one 1:1 poster at a time from the admin-managed feed. Expired popups are
 * filtered out client-side too, so a popup still open when its end date passes
 * disappears on the next poll rather than lingering.
 */
export default function OfferPopup({ onOpenContact }) {
  const [popup, setPopup] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);
  // Poster src is admin-supplied: normalise it so a non-http(s) value renders
  // the placeholder instead of reaching the browser as an arbitrary scheme.
  const posterUrl = popup ? safeImageUrl(popup.imageUrl) : '';

  // The header text is optional: a poster-only offer renders no heading at all,
  // and an empty one must never leave a bare <h2></h2> or an empty accessible
  // name behind.
  const headingText = popup ? String(popup.title || '').trim() : '';
  const dialogLabel = headingText || 'Special offer';

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/popups');
      const list = (res && res.data && res.data.popups) || [];
      const hidden = hiddenIds();
      const next = list.find((p) => !hidden.includes(p._id) && !isExpired(p)) || null;
      setPopup((current) => (current && isExpired(current) ? null : next));
      setLoadedAt(new Date().toISOString());
    } catch (err) {
      logError('load offer popups', err);
    }
  }, []);

  // Slight delay so the popup does not fight the hero animation on first paint
  useEffect(() => {
    const timer = setTimeout(load, 1200);
    const poll = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
    };
  }, [load]);

  // Re-check when the tab regains focus, in case the end date passed
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handleDismiss = () => {
    if (popup) rememberDismissed(popup._id);
    setPopup(null);
  };

  const handleCta = () => {
    if (!popup) return;
    // The redirect target is database-driven. safeUrl rejects `javascript:`
    // and any other non-http(s) scheme, so a crafted value cannot execute on
    // click; an unsafe or empty value falls through to the contact form.
    const url = safeUrl(popup.ctaUrl);
    if (url) {
      if (url.startsWith('/') || url.startsWith('#')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', EXTERNAL_REL);
      }
      handleDismiss();
      return;
    }
    // No usable redirect configured -> open the contact form
    handleDismiss();
    if (onOpenContact) onOpenContact();
  };

  return (
    <AnimatePresence>
      {popup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleDismiss();
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border border-[#EDEDED] overflow-hidden z-10"
          >
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 text-[#6B6B6B] hover:text-[#111111] border border-[#EDEDED] transition-colors"
              aria-label="Close offer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 1:1 poster */}
            <div className="relative w-full aspect-square bg-[#FAFAFA]">
              {imageFailed || !posterUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                    Poster unavailable
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] break-all">{popup.imageUrl}</span>
                </div>
              ) : (
                <img
                  src={posterUrl}
                  alt={popup.title}
                  loading="lazy"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-5 sm:p-6">
              {headingText && (
                <h2 className="text-lg sm:text-xl font-extrabold text-[#111111] tracking-tight mb-1.5 pr-8">
                  {headingText}
                </h2>
              )}

              {popup.bodyText && (
                <p className="text-sm text-[#6B6B6B] leading-relaxed mb-3">{popup.bodyText}</p>
              )}

              {popup.footerText && (
                <p className="text-xs font-semibold text-[#7C3AED] mb-4">{popup.footerText}</p>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleCta}
                icon={ArrowRight}
                className="w-full justify-center"
              >
                {popup.ctaLabel || 'Contact Us'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}