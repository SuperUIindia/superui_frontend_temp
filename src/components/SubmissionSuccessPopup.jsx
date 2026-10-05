import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useContent } from '../lib/siteContent';
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, INSTAGRAM_DM_URL } from '../lib/social';
import { EXTERNAL_REL } from '../lib/sanitize';
import { SITE_CONFIG } from '../lib/env';
import InstagramIcon from './InstagramIcon';

/**
 * Post-submission popup shown once the lead is stored, from both copies of the
 * contact form (the inline one in the contact section and the dialog one).
 * It sits above the dialog (z-[95] vs the modal's z-50) so a submission made
 * from either place is confirmed the same way.
 */
export default function SubmissionSuccessPopup({ isOpen, firstName = '', onClose }) {
  const panelRef = useRef(null);
  const c = useContent('contactform');

  // Escape closes; Tab stays inside the dialog; background scroll is locked.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Escape closes this popup only. The contact dialog behind it also
        // listens for Escape, so the event is consumed here in the capture
        // phase, before it can reach that listener.
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    const timer = window.setTimeout(() => panelRef.current?.focus?.(), 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  const name = firstName || c.successFallbackName || 'there';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submission-success-title"
          aria-describedby="submission-success-body"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md my-auto rounded-3xl bg-white border border-[#EDEDED] shadow-2xl p-6 sm:p-8 z-10 text-center focus:outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] transition-colors"
              aria-label="Close confirmation"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center text-green-600 mx-auto mb-5 shadow-lg shadow-green-500/20"
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </motion.div>

            <motion.h2
              id="submission-success-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl sm:text-3xl font-extrabold text-green-700 tracking-tight"
            >
              {c.successHeadingPrefix || 'Thank you dear'} {name}!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 rounded-2xl bg-gradient-to-r from-[#FFF1E8] via-[#F3EEFF] to-[#FFF1E8] border border-[#FF5E00]/20 px-4 py-3"
            >
              <p className="text-base sm:text-lg font-extrabold leading-snug text-[#111111]">
                {c.successTagline || 'We build fast, secure websites that grow your business.'}
              </p>
            </motion.div>

            <motion.p
              id="submission-success-body"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm text-[#6B6B6B] max-w-sm mx-auto mt-4 leading-relaxed"
            >
              {c.successBody}
            </motion.p>

            {(INSTAGRAM_DM_URL || INSTAGRAM_URL) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-5 space-y-2.5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  {c.successFasterReply || 'Want a faster reply?'}
                </p>

                {INSTAGRAM_DM_URL && (
                  <a
                    href={INSTAGRAM_DM_URL}
                    target="_blank"
                    rel={EXTERNAL_REL}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E00] to-[#7C3AED] text-white text-sm font-bold shadow-lg shadow-[#FF5E00]/20 hover:opacity-95 transition-opacity"
                  >
                    <InstagramIcon className="w-4 h-4" />
                    {c.successDmCta || 'Message me on Instagram'}
                  </a>
                )}

                {INSTAGRAM_URL && (
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel={EXTERNAL_REL}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white border border-[#EDEDED] text-[#111111] text-sm font-semibold hover:border-[#7C3AED]/40 hover:text-[#7C3AED] transition-colors"
                  >
                    <InstagramIcon className="w-4 h-4" />
                    {c.successFollowCta || `Follow ${SITE_CONFIG.brand} on Instagram`}
                  </a>
                )}

                {INSTAGRAM_HANDLE && (
                  <p className="text-[11px] text-[#6B6B6B]">{INSTAGRAM_HANDLE}</p>
                )}
              </motion.div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full px-5 py-3 text-sm font-bold rounded-xl text-white bg-[#FF5E00] hover:bg-[#e05300] shadow-lg shadow-[#FF5E00]/25 transition-colors"
            >
              {c.successClose || 'Continue'}
            </button>

            <p className="text-[11px] text-[#6B6B6B] mt-3">{c.footnote}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}