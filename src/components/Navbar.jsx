import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react';
import Button from './Button';
import { useContent } from '../lib/siteContent';
import { SITE_CONFIG } from '../lib/env';
import { safeUrl, safeImageUrl } from '../lib/sanitize';

export default function Navbar({ onOpenContactModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const content = useContent('navbar');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Link hrefs come from the database, so every one is normalised: only
  // "#anchor" targets are allowed, which keeps a stored value from becoming a
  // navigation sink or an invalid querySelector argument.
  const navLinks = (Array.isArray(content.links) ? content.links : [])
    .map((link) => ({ ...link, href: safeUrl(link.href) }))
    .filter((link) => link.href.startsWith('#') && link.label);

  const homeHref = safeUrl(content.homeHref, '#top').startsWith('#') ? safeUrl(content.homeHref, '#top') : '#top';
  const logoUrl = safeImageUrl(content.logoUrl, SITE_CONFIG.logoPath);

  // Splits the brand name so the highlight tail can be coloured, but stays
  // correct if an admin removes the highlight or changes the brand name
  // entirely. The base name comes from frontend/.env (VITE_SITE_NAME).
  const brandBase = String(content.brandName || SITE_CONFIG.brand).replace(
    new RegExp(`${String(content.brandHighlight || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, ''),
    ''
  );
  const highlight = new RegExp(`${String(content.brandHighlight || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(
    String(content.brandName || '')
  )
    ? String(content.brandHighlight || '')
    : '';

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // getElementById, not querySelector: an id containing characters that are
    // legal in the database but illegal in a CSS selector throws instead of
    // scrolling.
    const id = href.replace(/^#/, '');
    const target = id ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-[#EDEDED]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href={homeHref}
            onClick={(e) => handleLinkClick(e, homeHref)}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label={`${content.brandName || SITE_CONFIG.brand} Home`}
          >
            <img
              src={logoUrl}
              alt={content.brandName || SITE_CONFIG.brand}
              width={36}
              height={36}
              className="w-9 h-9 object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#111111]">
                {brandBase}
                {highlight && <span className="text-[#FF5E00]">{highlight}</span>}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-[#6B6B6B] hover:text-[#111111] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#FF5E00] hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onOpenContactModal()}
              icon={Sparkles}
            >
              {content.ctaLabel || 'Start a Project'}
            </Button>
          </div>

          {/* Mobile Actions: Start a Project + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenContactModal()}
              icon={Sparkles}
              className="!px-3.5 !py-2 text-xs"
            >
              {content.ctaLabelMobile || content.ctaLabel || 'Start a Project'}
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#FF5E00]"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Animated Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-b border-[#EDEDED] bg-white/98 backdrop-blur-lg px-4 pt-4 pb-6 overflow-hidden shadow-xl"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="px-3 py-2 text-base font-semibold text-[#111111] hover:text-[#FF5E00] hover:bg-[#FFF1E8] rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenContactModal();
                  }}
                  icon={ArrowRight}
                >
                  {content.ctaLabel || 'Start a Project'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
