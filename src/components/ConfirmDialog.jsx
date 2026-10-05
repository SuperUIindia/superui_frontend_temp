import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible confirmation dialog for destructive actions.
 *
 * Replaces window.confirm, which cannot be styled, is announced poorly by
 * screen readers and offers no way to restate exactly what is about to happen.
 *
 * Resolves to true (confirmed) or false (cancelled / dismissed), so it drops
 * into existing code the same way `window.confirm` did:
 *
 *   if (await confirm({ ... })) { ... }
 */
export default function ConfirmDialog({ request, onClose }) {
  const panelRef = useRef(null);
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger' } = request || {};

  const confirm = useCallback(() => onClose(true), [onClose]);
  const cancel = useCallback(() => onClose(false), [onClose]);

  // Escape cancels; Enter confirms. Bound while the dialog is open.
  useEffect(() => {
    if (!request) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [request, cancel, confirm]);

  // Lock background scroll, remember and restore focus.
  useEffect(() => {
    if (!request) return undefined;
    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus();
    };
  }, [request]);

  // Keep Tab inside the dialog.
  const handleTab = (e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
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

  if (!request || typeof document === 'undefined') return null;

  const isDanger = tone === 'danger';

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onKeyDown={handleTab}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={cancel}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md my-auto rounded-2xl bg-white shadow-2xl border border-[#EDEDED] p-6 z-10"
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#FFF1E8] text-[#FF5E00] border border-[#FF5E00]/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="confirm-dialog-title" className="text-base font-bold text-[#111111]">
                {title}
              </h2>
              <p id="confirm-dialog-message" className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-[#EDEDED] bg-white text-[#111111] hover:bg-[#FAFAFA] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={confirm}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl text-white transition-colors ${
                isDanger
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
                  : 'bg-[#FF5E00] hover:bg-[#e05300] shadow-lg shadow-[#FF5E00]/25'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}