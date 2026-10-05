import React from 'react';
import { Mail, Clock, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import ContactForm from './ContactForm';
import Reveal from './Reveal';
import { useContent } from '../lib/siteContent';
import { safeUrl } from '../lib/sanitize';

// Contact points cycle through these markers and alternating accent colours.
const POINT_ICONS = [Mail, Clock, MapPin];
const POINT_ICONS_BG = ['bg-[#FFF1E8] text-[#FF5E00]', 'bg-[#F3EEFF] text-[#7C3AED]', 'bg-[#FFF1E8] text-[#FF5E00]'];

export default function ContactSection() {
  const content = useContent('contact');
  // hrefs are database-driven, so they are normalised before becoming anchors.
  const points = (Array.isArray(content.points) ? content.points : [])
    .map((point) => ({ ...point, href: safeUrl(point.href) }))
    .filter((point) => point.label);
  const guarantees = Array.isArray(content.guarantees) ? content.guarantees : [];

  return (
    <section id={content.anchorId || 'contact'} className="py-20 md:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Heading & Value props */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-[#FF5E00] text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111111] tracking-tight mb-4">
                {content.sectionTitle} <span className="text-[#FF5E00]">{content.sectionHighlight}</span>
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-base text-[#6B6B6B] leading-relaxed mb-8">
                {content.sectionSubtitle}
              </p>
            </Reveal>

            {/* Quick Contact Info Cards */}
            <Reveal delay={0.3}>
              <div className="space-y-4 mb-8">
                {points.map((point, index) => {
                  const Icon = POINT_ICONS[index % POINT_ICONS.length];
                  const bg = POINT_ICONS_BG[index % POINT_ICONS_BG.length];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAFAFA] border border-[#EDEDED]"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-[#6B6B6B]">
                          {point.label}
                        </span>
                        {point.href ? (
                          <a
                            href={point.href}
                            className="text-sm font-bold text-[#111111] hover:text-[#FF5E00] transition-colors"
                          >
                            {point.value}
                          </a>
                        ) : (
                          <span className="text-sm font-bold text-[#111111]">{point.value}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* Guarantees */}
            {guarantees.length > 0 && (
              <Reveal delay={0.4}>
                <div className="space-y-2.5 text-xs text-[#6B6B6B]">
                  {guarantees.map((g, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${index % 2 === 0 ? 'text-[#FF5E00]' : 'text-[#7C3AED]'}`}
                      />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          {/* Right Column: the inquiry form, in the same card it has always
              occupied. The dialog copy opened from the other CTAs stays
              available, and each instance confirms a submission with its own
              popup, so the two never share draft state. */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2}>
              <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#EDEDED] shadow-xl shadow-black/[0.03]">
                <div className="text-center mb-7">
                  <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#111111] tracking-tight">
                    {content.formCardTitle}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mt-2.5 max-w-md mx-auto">{content.formCardSubtitle}</p>
                </div>

                <ContactForm idPrefix="contact-section" />

                <p className="text-xs text-[#6B6B6B] mt-5 text-center">
                  Prefer email?{' '}
                  <a href="mailto:hello.superui@gmail.com" className="font-semibold text-[#111111] hover:text-[#FF5E00] transition-colors">
                    hello.superui@gmail.com
                  </a>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}