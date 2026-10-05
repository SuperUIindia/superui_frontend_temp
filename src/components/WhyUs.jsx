import React from 'react';
import { Sparkles } from 'lucide-react';
import Reveal from './Reveal';
import { useContent } from '../lib/siteContent';
import { resolveIcon } from '../lib/icons';
import { safeHexColor } from '../lib/sanitize';

export default function WhyUs() {
  const content = useContent('whyus');

  // Icons come from the database as names, resolved through the shared map.
  // accent is interpolated into a style attribute, so validate it as hex first.
  const trustPoints = (Array.isArray(content.points) ? content.points : []).map((p) => ({
    ...p,
    accent: safeHexColor(p.accent, '#7C3AED'),
    icon: resolveIcon(p.icon, Sparkles)
  }));

  return (
    <section id={content.anchorId || 'why-us'} className="py-20 md:py-28 bg-[#FAFAFA]/70 border-b border-[#EDEDED]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFF] border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{content.badge}</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Solid #111111 rather than a bg-clip-text gradient: that gradient
                only paints inside the element padding box, so descenders (the
                tail of the 'y' in "ambitious teams") fell outside it and rendered
                invisible against text-transparent. */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111111] tracking-tight leading-[1.15] pb-1 mb-4">
              {content.sectionTitle} {content.sectionHighlight}
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed">
              {content.sectionSubtitle}
            </p>
          </Reveal>
        </div>

        {/* 4 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Reveal key={item.title} delay={idx * 0.1}>
                <div className="flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-white border border-[#EDEDED] shadow-sm hover:shadow-md hover:border-[#7C3AED]/30 transition-all duration-300 group">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${item.accent}14`,
                          color: item.accent
                        }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#EDEDED] text-[#6B6B6B]">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#111111] mb-2 tracking-tight group-hover:text-[#FF5E00] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EDEDED]/60 flex items-center gap-2 text-xs font-semibold text-[#6B6B6B]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                    <span>{content.cardFooter}</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
