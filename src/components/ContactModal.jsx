import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import ContactForm from './ContactForm';
import { useContent } from '../lib/siteContent';

export default function ContactModal({ isOpen, onClose, selectedService = '' }) {
  const modalRef = useRef(null);
  const content = useContent('contactmodal');

  // Close on Escape key press & handle focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
        >
          {/* Backdrop with blur fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container with Spring scale-in */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EDEDED] p-6 sm:p-8 z-10 my-auto overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5E00]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-[#FF5E00] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </div>
              <h2
                id="contact-modal-title"
                className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight"
              >
                {content.heading} <span className="text-[#FF5E00]">{content.headingHighlight}</span>
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">
                {content.subtext}
              </p>
            </div>

            {/* Modal Form Content */}
            <ContactForm
              initialService={selectedService}
              isModal={true}
              onSuccessCallback={() => {
                // Keep modal open so client sees checkmark reference code
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
