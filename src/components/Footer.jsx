import React from 'react';
import { ArrowUp, Mail, MapPin, Clock } from 'lucide-react';
import { useServices } from '../lib/services';
import { SOCIAL_LINKS } from '../lib/social';
import { useContent } from '../lib/siteContent';
import { SITE_CONFIG } from '../lib/env';
import { safeUrl, safeImageUrl, singleLine, EXTERNAL_REL } from '../lib/sanitize';
import InstagramIcon from './InstagramIcon';
import FacebookIcon from './FacebookIcon';

const CONTACT_ICONS = [Mail, Clock, MapPin];
const CONTACT_ACCENTS = ['text-[#FF5E00]', 'text-[#7C3AED]', 'text-[#FF5E00]'];

export default function Footer({ onSelectService }) {
  const services = useServices();
  const content = useContent('footer');

  const logoUrl = safeImageUrl(content.logoUrl, SITE_CONFIG.logoPath);

  // Hrefs are database-driven: normalise them before they reach an anchor.
  const companyLinks = (Array.isArray(content.companyLinks) ? content.companyLinks : [])
    .map((link) => ({ ...link, href: safeUrl(link.href) }))
    .filter((link) => link.href && link.label);

  const contactItems = (Array.isArray(content.contactItems) ? content.contactItems : [])
    .map((item) => ({ ...item, href: safeUrl(item.href), label: singleLine(item.label) }))
    .filter((item) => item.label);

  // Splits the brand name so the highlight tail can be coloured. The base name
  // comes from frontend/.env (VITE_SITE_NAME).
  const brandName = String(content.brandName || SITE_CONFIG.brand);
  const highlightRaw = String(content.brandHighlight || '');
  const highlight =
    highlightRaw && brandName.endsWith(highlightRaw) ? highlightRaw : '';
  const brandBase = highlight ? brandName.slice(0, -highlight.length) : brandName;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceClick = (e, serviceTitle) => {
    e.preventDefault();
    const servicesEl = document.getElementById('services');
    if (servicesEl) {
      servicesEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (onSelectService) {
      onSelectService(serviceTitle);
    }
  };

  const handleNavClick = (e, id) => {
    e.preventDefault();
    // getElementById: a database id that is not a legal CSS selector would make
    // querySelector throw instead of scrolling.
    const target = id ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-white border-t border-[#EDEDED] text-[#111111]">
      {/* Subtle top accent gradient line */}
      <div
        className="h-[2px] w-full bg-gradient-to-r from-[#FF5E00] via-[#7C3AED] to-[#FF5E00]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Column 1: Brand & Social */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={logoUrl}
                alt={brandName}
                className="w-8 h-8 object-contain rounded-xl"
              />
              <span className="text-xl font-extrabold tracking-tight">
                {brandBase}
                {highlight && <span className="text-[#FF5E00]">{highlight}</span>}
              </span>
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              {content.tagline}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel={EXTERNAL_REL}
                  className={`w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#EDEDED] flex items-center justify-center text-[#6B6B6B] transition-colors ${link.hover}`}
                  aria-label={link.label}
                >
                  {link.id === 'instagram' && <InstagramIcon className="w-4 h-4" />}
                  {link.id === 'facebook' && <FacebookIcon className="w-4 h-4" />}
                  {link.id === 'linkedin' && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Services Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-4">
              {content.servicesGroupTitle || 'Services'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {services.slice(0, content.servicesLimit || 6).map((srv) => (
                <li key={srv.key}>
                  <a
                    href="#services"
                    onClick={(e) => handleServiceClick(e, srv.title)}
                    className="text-[#6B6B6B] hover:text-[#FF5E00] transition-colors"
                  >
                    {srv.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-4">
              {content.companyGroupTitle || 'Company'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (link.href === '#top') {
                        scrollToTop();
                      } else {
                        handleNavClick(e, link.href.replace(/^#/, ''));
                      }
                    }}
                    className="text-[#6B6B6B] hover:text-[#FF5E00] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & SLA */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-4">
              {content.contactGroupTitle || 'Contact'}
            </h4>
            <ul className="space-y-3 text-sm text-[#6B6B6B]">
              {contactItems.map((item, index) => {
                const Icon = CONTACT_ICONS[index % CONTACT_ICONS.length];
                const accent = CONTACT_ACCENTS[index % CONTACT_ACCENTS.length];
                return (
                  <li key={index} className="flex items-start gap-2.5">
                    <Icon className={`w-4 h-4 ${accent} shrink-0 mt-0.5`} />
                    {item.href ? (
                      <a href={item.href} className="hover:text-[#111111] transition-colors">
                        {item.label}
                      </a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Privacy Note, Back to Top */}
        <div className="pt-8 border-t border-[#EDEDED] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B6B]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>
              &copy; {new Date().getFullYear()} {content.copyrightText}
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="text-[11px] text-[#A1A1AA]">{content.privacyNote}</span>
          </div>

          {/* Back to Top Button */}
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAFAFA] border border-[#EDEDED] hover:bg-[#FFF1E8] hover:border-[#FF5E00]/30 hover:text-[#FF5E00] transition-all cursor-pointer font-medium"
            aria-label={`${content.backToTopLabel || 'Back to top'} of page`}
          >
            <span>{content.backToTopLabel || 'Back to top'}</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
