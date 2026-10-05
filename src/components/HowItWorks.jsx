import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';
import { useContent } from '../lib/siteContent';
import { resolveIcon } from '../lib/icons';
import { safeHexColor } from '../lib/sanitize';

export default function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();
  const content = useContent('howitworks');

  // Icon names live in the database; resolve them to components here.
  // step.color is interpolated into a style attribute, so it is validated as a
  // hex colour first - a stored string would otherwise be an injection point.
  const steps = (Array.isArray(content.steps) ? content.steps : []).map((s) => ({
    ...s,
    color: safeHexColor(s.color),
    icon: resolveIcon(s.icon, ArrowRight)
  }));

  return (
    <section id={content.anchorId || 'how-it-works'} className="py-20 md:py-28 bg-white border-b border-[#EDEDED]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-[#FF5E00] text-xs font-bold uppercase tracking-wider mb-4">
              {content.badge}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111111] tracking-tight mb-4">
              {content.sectionTitle} <span className="text-[#FF5E00]">{content.sectionHighlight}</span>
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed">
              {content.sectionSubtitle}
            </p>
          </Reveal>
        </div>

        {/* Steps Grid with connecting line */}
        <div className="relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div
            className="hidden lg:block absolute top-1/2 left-12 right-12 h-[2px] bg-gradient-to-r from-[#FF5E00]/20 via-[#7C3AED]/25 to-[#FF5E00]/20 -translate-y-8 z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <Reveal key={step.num} delay={idx * 0.12} className="h-full">
                  <div className="flex flex-col h-full p-6 sm:p-7 rounded-2xl bg-white border border-[#EDEDED] shadow-sm hover:shadow-md hover:border-[#FF5E00]/30 transition-all duration-300 group">
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: `${step.color}12`,
                          color: step.color
                        }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-2xl font-black text-[#D4D4D8] group-hover:text-[#FF5E00] transition-colors">
                        {step.num}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#111111] mb-2.5 tracking-tight group-hover:text-[#FF5E00] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
