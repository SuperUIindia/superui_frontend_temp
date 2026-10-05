import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import Button from './Button';
import CloudBackdrop from './CloudBackdrop';
import { useContent } from '../lib/siteContent';

// Icons cycle through the trust points so each one gets a distinct marker.
const TRUST_ICONS = [CheckCircle2, ShieldCheck, Zap];

export default function Hero({ onOpenContactModal }) {
  const shouldReduceMotion = useReducedMotion();
  const content = useContent('hero');

  const headline = String(content.headline || '').trim();

  // The headline is split once, at the word the admin marks as the highlight, so
  // the closing phrase ("websites that grow your business.") carries the brand
  // orange while the rest stays black. `headlineHighlightFrom` counts words from
  // zero; a value outside the range renders the whole line in one colour.
  const headlineParts = (() => {
    const words = headline.split(/\s+/).filter(Boolean);
    const from = Number(content.headlineHighlightFrom);
    const split =
      Number.isInteger(from) && from > 0 && from < words.length ? from : words.length;
    return {
      plain: words.slice(0, split).join(' '),
      accent: words.slice(split).join(' ')
    };
  })();

  const trustPoints = Array.isArray(content.trustPoints) ? content.trustPoints : [];

  const handleScrollToServices = (e) => {
    e.preventDefault();
    const target = document.getElementById('services');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // The headline arrives as one block: a short blur that resolves into focus
  // while it rises. It is deliberately NOT a per-word stagger - words appearing
  // one at a time made a sentence nobody can read until the last word landed,
  // and the per-word clipping that effect needs is what previously clipped
  // descenders off the line. The blur lives on this element, never on the two
  // coloured spans, so a filtered span cannot rasterise its own text away.
  const headlineVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 22,
      filter: shouldReduceMotion ? 'blur(0px)' : 'blur(10px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.75,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section id={content.anchorId || 'top'} className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <CloudBackdrop />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Top Pill / Trust Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-[#FF5E00] text-xs font-semibold uppercase tracking-wider mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF5E00] animate-pulse" />
            {content.pillText}
          </motion.div>

          {/* The headline resolves in as one block, so the sentence is readable
              immediately instead of assembling word by word. Its closing
              phrase keeps the brand orange. */}
          <motion.h1
            variants={headlineVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111111] tracking-tight leading-[1.15] pb-2 mb-6 will-change-[transform,filter]"
          >
            {headlineParts.plain}
            {headlineParts.accent && (
              <>
                {' '}
                <span className="text-[#FF5E00]">{headlineParts.accent}</span>
              </>
            )}
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed mb-10"
          >
            {content.subtext}
          </motion.p>

          {/* Call to actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => onOpenContactModal()}
              icon={ArrowRight}
              className="w-full sm:w-auto shadow-xl shadow-[#FF5E00]/25"
            >
              {content.primaryCtaText || 'Start a Project'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleScrollToServices}
              icon={ChevronDown}
              className="w-full sm:w-auto"
            >
              {content.secondaryCtaText || 'View Services'}
            </Button>
          </motion.div>

          {/* Mini Trust Highlights */}
          {trustPoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-[#6B6B6B] pt-4 border-t border-[#EDEDED]/80 max-w-2xl mx-auto"
            >
              {trustPoints.map((point, index) => {
                const Icon = TRUST_ICONS[index % TRUST_ICONS.length];
                const accent = index % 2 === 0 ? 'text-[#FF5E00]' : 'text-[#7C3AED]';
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${accent}`} />
                    <span>{typeof point === 'string' ? point : point?.text}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
