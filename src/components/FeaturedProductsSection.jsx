import React, { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CloudBackdrop from './CloudBackdrop';
import { PATHS } from '../routes/paths';
import { useContent } from '../lib/siteContent';

const DEFAULT_PRODUCTS = [
  {
    id: 'ebooks',
    name: 'All Types of E-Books',
    href: PATHS.ebooksDigital,
    buttonLabel: 'E-Books',
    image: 'https://i.postimg.cc/3wy1kdpF/E-Books.png/E_Books.png',
    imageAlt: 'All Types of E-Books - Devotional, Fitness, Recipes, Marketing Guides',
    bgColor: 'bg-[#F5F3FF]',
    accentColor: '#7C3AED',
  },
  {
    id: 'digital-products',
    name: 'UI Kits & Digital Assets',
    href: PATHS.digitalProducts,
    buttonLabel: 'Websites',
    image:
      'https://i.postimg.cc/FR0HsVHP/Digital-Design-Portfolio-Showcase.png',
    imageAlt: 'Digital UI Kits and Web Development Systems',
    bgColor: 'bg-[#EFF6FF]',
    accentColor: '#FF5E00',
  },
];

export default function FeaturedProductsSection() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const content = useContent('featuredproducts');

  const badge = content?.badge || 'Curated Digital Marketplace';
  const title = content?.title || 'Explore Featured Collections & Digital Assets';
  const subtitle =
    content?.subtitle ||
    'Choose a collection below to browse ready-to-download e-books, templates, UI components, and creative systems.';

  const products =
    Array.isArray(content?.products) && content.products.length > 0
      ? content.products
      : DEFAULT_PRODUCTS;

  const handleCardClick = useCallback(
    (href) => {
      navigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate]
  );

  return (
    <section
      id="featured-products"
      aria-labelledby="featured-title"
      className="relative overflow-hidden pt-2 pb-10 sm:pt-4 sm:pb-14 lg:pt-6 lg:pb-16"
    >
      {/* Hero Animated Cloud Backdrop continuation */}
      <CloudBackdrop hideTopFade hideHeadlineGlow />

      {/* Ambient Colored Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-[440px] w-[440px] rounded-full bg-[#FF5E00]/[0.05] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/4 h-[440px] w-[440px] rounded-full bg-[#7C3AED]/[0.04] blur-[130px]"
      />

      {/* Soft bottom transition gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/50 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {/* <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-[#FF5E00] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#FF5E00] animate-pulse" />
            {badge}
          </div>
          <h2
            id="featured-title"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight leading-[1.18]"
          >
            {title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#6B6B6B] max-w-xl mx-auto">
            {subtitle}
          </p>
        </div> */}

        {/* 2 Big Showcase Cards — Advanced Responsive Layout for all screen sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {products.map((product, index) => {
            const fallbackLabel = index === 0 ? 'E-Books' : 'Websites';
            const buttonText = product.buttonLabel || fallbackLabel;
            const accent = product.accentColor || (index === 0 ? '#7C3AED' : '#FF5E00');

            return (
              <motion.article
                key={product.id || index}
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : 20,
                }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.45,
                  delay: shouldReduceMotion ? 0 : index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                onClick={() => handleCardClick(product.href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(product.href);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`View ${product.name}`}
                className="group relative rounded-3xl sm:rounded-[28px] overflow-hidden border border-[#EDEDED] hover:border-black/15 shadow-[0_4px_24px_rgba(20,20,20,0.04)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5E00]"
              >
                {/* Clean Image Showcase */}
                <div
                  className={`relative w-full aspect-[16/10] min-[568px]:aspect-[16/9] overflow-hidden ${
                    product.bgColor || 'bg-[#F9F9F9]'
                  } flex items-center justify-center`}
                >
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Soft bottom gradient overlay: always visible below 567px, reveals on hover on larger screens */}
                  <div className="absolute inset-x-0 bottom-0 h-20 min-[568px]:h-28 bg-gradient-to-t from-black/60 via-black/25 to-transparent max-[567px]:opacity-100 min-[568px]:opacity-0 min-[568px]:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Centered Button: always visible and centered at bottom below 567px, hover-revealed on desktop */}
                  <div className="absolute inset-x-0 bottom-3 min-[568px]:bottom-6 z-20 flex items-center justify-center px-4 max-[567px]:opacity-100 max-[567px]:translate-y-0 max-[567px]:pointer-events-auto min-[568px]:opacity-0 min-[568px]:translate-y-3 min-[568px]:pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition-all duration-300 ease-out">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(product.href);
                      }}
                      className="px-5 min-[568px]:px-8 py-2 min-[568px]:py-3 rounded-xl min-[568px]:rounded-2xl font-bold text-xs min-[568px]:text-base text-white flex items-center justify-center gap-2 min-[568px]:gap-2.5 shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                      style={{ backgroundColor: accent }}
                    >
                      <span>{buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5 min-[568px]:w-4 min-[568px]:h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
