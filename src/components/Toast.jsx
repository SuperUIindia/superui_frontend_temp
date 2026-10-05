import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const DEFAULT_DURATION = 4000;

const TONES = {
  success: { icon: CheckCircle2, shell: 'border-green-200 bg-green-50 text-green-800' },
  error: { icon: AlertCircle, shell: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: AlertCircle, shell: 'border-[#FF5E00]/30 bg-[#FFF1E8] text-[#111111]' }
};

/**
 * Toast notifications, replacing window.alert for non-blocking feedback.
 *
 * Native dialogs block the main thread, cannot be styled and are announced
 * inconsistently by screen readers. Toasts render into a polite live region
 * instead, and never steal focus.
 *
 * Usage: `const toast = useToast(); toast.success('Saved'); toast.error(msg);`
 */
const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, tone = 'info', duration = DEFAULT_DURATION) => {
      const text = typeof message === 'string' ? message.trim() : '';
      if (!text) return;
      const id = ++nextId.current;
      // Cap the stack so a burst of errors cannot cover the screen.
      setToasts((prev) => [...prev.slice(-3), { id, message: text, tone: TONES[tone] ? tone : 'info' }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show: push,
      success: (message, duration) => push(message, 'success', duration),
      error: (message, duration) => push(message, 'error', duration),
      info: (message, duration) => push(message, 'info', duration)
    }),
    [push]
  );

  // Clear pending timers on unmount so none fire into a dead tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        <div aria-live="polite" className="contents">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const tone = TONES[toast.tone];
              const Icon = tone.icon;
              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  className={`pointer-events-auto w-full sm:w-auto sm:max-w-sm flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg text-xs font-medium ${tone.shell}`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-px" />
                  <span className="flex-1 break-words">{toast.message}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;