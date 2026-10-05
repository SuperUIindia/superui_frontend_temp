import React from 'react';
import { useServicesContent } from '../lib/services';
import { trackClick } from '../lib/tracking';
import ServiceCard from './ServiceCard';
import Reveal from './Reveal';

export default function ServicesSection({ onSelectService }) {
  const { header, categories: services } = useServicesContent();

  const handleCardClick = (service) => {
    // 1. Log click event to backend analytics
    trackClick(service.key);
    // 2. Open contact modal with preselected service
    onSelectService(service.title);
  };

  return (
    <section id="services" className="py-20 md:py-28 bg-[#FAFAFA]/70 border-b border-[#EDEDED]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFF] border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-bold uppercase tracking-wider mb-4">
              {header.badge}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Solid #111111 rather than a bg-clip-text gradient: that gradient
                only paints inside the element padding box, so descenders (the
                tail of the 'y' in "ambitious teams") fell outside it and rendered
                invisible against text-transparent. */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111111] tracking-tight leading-[1.15] pb-1 mb-4">
              {header.heading} {header.highlight}
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed">
              {header.subtext}
            </p>
          </Reveal>
        </div>

        {/* Services Grid (catalogue stored in the database) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.key}
              service={service}
              index={index}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
