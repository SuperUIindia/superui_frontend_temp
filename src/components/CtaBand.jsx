import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from './Button';
import Reveal from './Reveal';
import { useContent } from '../lib/siteContent';

export default function CtaBand({ onOpenContactModal }) {
  const content = useContent('ctaband');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Reveal>
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#111111] text-white shadow-2xl border border-white/10">
          {/* Subtle gradient glow accents */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FF5E00]/25 blur-[90px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#7C3AED]/25 blur-[90px]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FF5E00] text-xs font-semibold mb-4 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                {content.heading}
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {content.subtext}
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenContactModal}
                icon={ArrowRight}
                className="shadow-2xl shadow-[#FF5E00]/40 text-base py-4 px-8"
              >
                {content.ctaText || 'Start a Project'}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
