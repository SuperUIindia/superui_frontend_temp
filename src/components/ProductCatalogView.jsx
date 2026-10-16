import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  ShoppingBag,
  Star,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Download,
  Sparkles,
  Layers,
  Globe,
  Smartphone,
  Layout,
  BookOpen,
  Heart,
  Activity,
  Code,
  TrendingUp,
  Coffee,
  Check,
  Tag,
  ArrowUpDown,
  ExternalLink,
  Mail,
  Coins
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import ContactModal from './ContactModal';

// Supported international currencies with INR (India) as default base region
export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'INR (₹)', country: 'India (Default)', rate: 85, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'USD ($)', country: 'United States', rate: 1, locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP (£)', country: 'United Kingdom', rate: 0.79, locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR (€)', country: 'European Union', rate: 0.92, locale: 'de-DE' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'CAD (C$)', country: 'Canada', rate: 1.38, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD (A$)', country: 'Australia', rate: 1.52, locale: 'en-AU' },
  AED: { code: 'AED', symbol: 'AED ', name: 'AED', country: 'United Arab Emirates', rate: 3.67, locale: 'en-AE' },
};

/**
 * Format a base USD price according to the selected currency.
 */
export const formatPrice = (usdAmount, currencyCode = 'INR') => {
  if (usdAmount === undefined || usdAmount === null || usdAmount === '') return '';
  const num = Number(usdAmount);
  if (isNaN(num)) return usdAmount;

  const curr = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const converted = num * curr.rate;

  if (currencyCode === 'INR') {
    return `${curr.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  if (currencyCode === 'AED') {
    return `${Math.round(converted).toLocaleString()} ${curr.code}`;
  }
  return `${curr.symbol}${converted.toFixed(2)}`;
};

const ICON_MAP = {
  Sparkles,
  Layers,
  Globe,
  Smartphone,
  Layout,
  BookOpen,
  Heart,
  Activity,
  Code,
  TrendingUp,
  Coffee,
};

export default function ProductCatalogView({
  catalogData,
  defaultCategory = 'all',
  pageType = 'digital-products', // or 'ebooks'
}) {
  const { title, badge, subtitle, bannerSlides, categories, products, accentColor = '#FF5E00' } = catalogData;

  // Currency selection state: Default is INR (Rupee based on user region)
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('superui_catalog_currency') || 'INR';
  });

  const handleCurrencyChange = (newCurr) => {
    setSelectedCurrency(newCurr);
    localStorage.setItem('superui_catalog_currency', newCurr);
    const currObj = CURRENCIES[newCurr] || CURRENCIES.INR;
    showToast(`Currency updated to ${currObj.name} • ${currObj.country}`);
  };

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all'); // all, under-20, 20-40, 40-plus
  const [sortBy, setSortBy] = useState('popular'); // popular, rating, price-asc, price-desc
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);

  // Auto-scrolling banner state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  // Checkout modal state
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '' });
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message: msg });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2800);
  }, []);

  // Auto-scroll banner timer
  useEffect(() => {
    if (!bannerSlides || bannerSlides.length <= 1 || isBannerHovered) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [bannerSlides, isBannerHovered]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Price filter
    if (priceFilter === 'under-20') {
      result = result.filter((p) => p.price < 20);
    } else if (priceFilter === '20-40') {
      result = result.filter((p) => p.price >= 20 && p.price <= 40);
    } else if (priceFilter === '40-plus') {
      result = result.filter((p) => p.price > 40);
    }

    // Bestseller only toggle
    if (onlyBestsellers) {
      result = result.filter((p) => p.isBestseller);
    }

    // Sort order
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // popular
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, priceFilter, onlyBestsellers, sortBy]);

  // Dynamically calculate accurate counts per category from the actual products array
  const categoryCounts = useMemo(() => {
    const counts = { all: Array.isArray(products) ? products.length : 0 };
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p.category) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });
    }
    return counts;
  }, [products]);

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (onlyBestsellers ? 1 : 0) +
    (sortBy !== 'popular' ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceFilter('all');
    setSortBy('popular');
    setOnlyBestsellers(false);
  };

  const DEFAULT_REDIRECT_URL = 'https://www.instagram.com/p/DeS-JkIzRyi/';

  const handleBuyClick = (product) => {
    const targetUrl =
      product?.buyLink && typeof product.buyLink === 'string' && product.buyLink.trim().length > 0
        ? product.buyLink.trim()
        : DEFAULT_REDIRECT_URL;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-[#FAFAFA] text-[#111111]">
      <Navbar onOpenContactModal={() => setContactModalOpen(true)} />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title & Eyebrow */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border"
              style={{
                backgroundColor: `${accentColor}12`,
                borderColor: `${accentColor}30`,
                color: accentColor,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              {badge}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight leading-[1.15] mb-4">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
          </div>

          {/* SECTION 1: Auto-Scrolling Image Banner Carousel (Commented out as requested - preserved in code)
          bannerSlides && bannerSlides.length > 0 && (
            <div
              className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-12 sm:mb-16 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/5 bg-[#171717]"
              onMouseEnter={() => setIsBannerHovered(true)}
              onMouseLeave={() => setIsBannerHovered(false)}
            >
              <div className="relative min-h-[320px] sm:min-h-[380px] md:min-h-[420px] w-full flex items-center">
                // Background Banner Slides
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={bannerSlides[currentSlide].image}
                      alt={bannerSlides[currentSlide].title}
                      className="w-full h-full object-cover object-center brightness-60"
                      loading="lazy"
                    />
                    // Rich Dark Backdrop Gradient Overlay
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                  </motion.div>
                </AnimatePresence>

                // Banner Content
                <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-2xl text-white">
                  <motion.div
                    key={`content-${currentSlide}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="flex flex-wrap items-center gap-2.5 mb-3 sm:mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-sm"
                        style={{
                          backgroundColor: bannerSlides[currentSlide].accent || accentColor,
                          color: '#FFFFFF',
                        }}
                      >
                        {bannerSlides[currentSlide].tag}
                      </span>
                      {bannerSlides[currentSlide].discount && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/20">
                          {bannerSlides[currentSlide].discount}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                      {bannerSlides[currentSlide].title}
                    </h2>

                    <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6 line-clamp-2 sm:line-clamp-none max-w-xl">
                      {bannerSlides[currentSlide].description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const target = document.getElementById('catalog-products-section');
                          if (target) target.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer"
                        style={{ backgroundColor: bannerSlides[currentSlide].accent || accentColor }}
                      >
                        <span>{bannerSlides[currentSlide].ctaText || 'Explore Deals'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <span className="text-xs text-white/70 flex items-center gap-1.5 py-1">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        Instant Digital Delivery
                      </span>
                    </div>
                  </motion.div>
                </div>

                // Banner Controls: Prev / Next
                <button
                  onClick={prevSlide}
                  aria-label="Previous banner slide"
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next banner slide"
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                // Indicator Dots
                <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  {bannerSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
          */}

          {/* SECTION 2: All Category Names Bar */}
          <div id="catalog-products-section" className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-extrabold text-[#888888]">
                  Browse Categories
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-[#111111]">
                  Select a Category to Explore
                </h3>
              </div>

              {/* Currency Selector (India INR default base region, US, UK, Europe, etc.) */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white px-3.5 py-2 rounded-xl border border-[#E0E0E0] shadow-sm hover:border-gray-400 transition-colors">
                <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs font-bold text-gray-600">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  aria-label="Select store currency"
                  className="text-xs font-black text-[#111111] bg-transparent outline-none cursor-pointer pr-1"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} • {c.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responsive Category Pills Bar */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-max pb-2">
                {categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Sparkles;
                  const isActive = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'bg-white text-[#444444] border-[#E8E8E8] hover:bg-[#F2F2F2] hover:text-[#111111]'
                      }`}
                      style={{
                        backgroundColor: isActive ? accentColor : undefined,
                        borderColor: isActive ? accentColor : undefined,
                        boxShadow: isActive ? `0 6px 18px ${accentColor}35` : undefined,
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                      <span>{cat.name}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#EFEFEF] text-[#666666]'
                        }`}
                      >
                        {cat.id === 'all'
                          ? (products?.length ?? cat.count ?? 0)
                          : (categoryCounts[cat.id] ?? cat.count ?? 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Search & All Types of Filters */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDEDED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Search Bar */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, topic, or format..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ '--tw-ring-color': accentColor }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Price Filter (Formatted in selected currency) */}
              <div className="md:col-span-3">
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#333333] focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">💰 All Prices</option>
                  <option value="under-20">Under {formatPrice(20, selectedCurrency)}</option>
                  <option value="20-40">{formatPrice(20, selectedCurrency)} to {formatPrice(40, selectedCurrency)}</option>
                  <option value="40-plus">{formatPrice(40, selectedCurrency)} &amp; above</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#333333] focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="popular">🔥 Most Popular</option>
                  <option value="rating">⭐ Highest Rated</option>
                  <option value="price-asc">💵 Price: Low to High</option>
                  <option value="price-desc">💎 Price: High to Low</option>
                </select>
              </div>

              {/* Currency Quick Dropdown & Bestseller Toggle */}
              <div className="md:col-span-3 flex items-center gap-2 justify-end">
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="flex-1 py-2.5 px-2.5 text-xs font-bold bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#222222] focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                  title="Switch Currency"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setOnlyBestsellers(!onlyBestsellers)}
                  title="Filter bestsellers"
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                    onlyBestsellers
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F9F9F9] text-[#555555] border-[#E5E5E5] hover:bg-[#EFEFEF]'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyBestsellers ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  <span className="hidden lg:inline">Bestsellers</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    title="Reset all filters"
                    className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {activeFiltersCount > 0 && (
              <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                <span className="font-semibold text-[#333333]">Active Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFEFEF] text-[#222222]">
                    Category:{' '}
                    {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setSelectedCategory('all')}
                    />
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFEFEF] text-[#222222]">
                    "{searchQuery}"
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setSearchQuery('')}
                    />
                  </span>
                )}
                {priceFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFEFEF] text-[#222222]">
                    Price: {priceFilter}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setPriceFilter('all')}
                    />
                  </span>
                )}
                {onlyBestsellers && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFEFEF] text-[#222222]">
                    Bestsellers only
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setOnlyBestsellers(false)}
                    />
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold underline text-[#FF5E00] hover:text-[#d95000] ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: Product Cards Grid ("image title price buybutton") */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#EDEDED] shadow-sm max-w-lg mx-auto">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#111111] mb-2">No matching products found</h3>
              <p className="text-sm text-[#777777] mb-6">
                Try adjusting your search terms or clearing current category and price filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((product, idx) => (
                <ProductCardItem
                  key={product.id || idx}
                  product={product}
                  idx={idx}
                  accentColor={accentColor}
                  selectedCurrency={selectedCurrency}
                  onBuyClick={handleBuyClick}
                />
              ))}
            </div>
          )}

          {/* SECTION 5: Bottom Contact CTA for custom work & inquiries */}
          <div className="mt-16 sm:mt-20 rounded-3xl overflow-hidden bg-gradient-to-br from-[#121212] via-[#1B1B1B] to-[#0A0A0A] p-8 sm:p-12 md:p-16 text-white border border-white/10 shadow-2xl relative">
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                style={{
                  borderColor: `${accentColor}50`,
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Need Custom Packages, Bulk Licensing or Help?
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Get In Touch With Our Team
              </h3>
              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
                Have specific questions or need custom digital assets, e-books, or templates built for your brand? Reach out to us directly and our team will get back to you promptly.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="px-8 py-3.5 rounded-xl font-black text-sm text-white flex items-center gap-2.5 shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* QUICK CHECKOUT & INSTANT DOWNLOAD MODAL */}
      {/* QUICK CHECKOUT & INSTANT DOWNLOAD MODAL (Commented out per user request: buy button redirects directly to Instagram/custom URL)
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black/10 flex flex-col"
            >
              // Modal Header
              <div className="p-6 border-b border-[#F0F0F0] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#111111]">Instant Digital Checkout</h3>
                    <p className="text-xs text-[#777777]">Lifetime access &amp; instant direct download</p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutProduct(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              // Modal Body
              <div className="p-6 space-y-5">
                {checkoutComplete ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-black text-[#111111]">Order Completed!</h4>
                    <p className="text-sm text-[#666666]">
                      Thank you! Your direct download link for <strong>{checkoutProduct.title}</strong> is ready.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#F8F8F8] border border-[#EDEDED]">
                      <img
                        src={checkoutProduct.image}
                        alt={checkoutProduct.title}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          {checkoutProduct.categoryName}
                        </span>
                        <h4 className="text-sm font-bold text-[#111111] truncate">{checkoutProduct.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-black text-[#111111]">
                            {formatPrice(checkoutProduct.price, selectedCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      */}

      {/* Floating Toast Notification */}
      <div
        className={`fixed right-6 bottom-6 z-50 max-w-[calc(100vw-48px)] px-4 py-3 rounded-xl text-white bg-[#1A1A1A] text-sm shadow-2xl pointer-events-none transition-all duration-300 flex items-center gap-2.5 border border-white/10 ${
          toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        {toast.message}
      </div>

      {/* Contact modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        selectedService="Digital Products & E-Books Inquiry"
      />
    </div>
  );
}

/**
 * ProductCardItem supports multiple images (up to 5) with dot indicators,
 * custom badges, currency formatting, and buy redirect links.
 */
function ProductCardItem({ product, idx, accentColor, selectedCurrency = 'INR', onBuyClick }) {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.slice(0, 5)
    : [product.image];
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Filter out Bestseller badge as requested by user; keep discount and custom promotional badges
  const badges = Array.isArray(product.badges) && product.badges.length > 0
    ? product.badges.filter((b) => b && b.toLowerCase() !== 'bestseller')
    : [product.discount].filter(Boolean);

  const hasBuyLink =
    product.buyLink && typeof product.buyLink === 'string' && product.buyLink.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: idx * 0.04 }}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:border-[#D0D0D0] transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Product Image with Hover Scale */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4F4F4]">
          <img
            src={images[activeImgIndex] || images[0] || product.image}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Top Category Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/95 text-[#111111] shadow-sm backdrop-blur-sm border border-black/5">
              {product.categoryName || product.category}
            </span>
          </div>

          {/* Badges top right (Bestseller removed per user request) */}
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 z-10">
            {badges.map((b) => (
              <span
                key={b}
                className="px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase text-white shadow-md flex items-center gap-1"
                style={{ backgroundColor: accentColor }}
              >
                {b}
              </span>
            ))}
          </div>

          {/* Multiple Images Dots indicator (up to 5 images) */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    i === activeImgIndex ? 'w-4 bg-white' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Format pill at bottom */}
          {product.format && (
            <div className="absolute bottom-2.5 left-3 pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md">
                {product.format}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Rating row */}
          <div className="flex items-center gap-1.5 text-xs text-[#666666] mb-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="font-bold ml-1 text-[#111111]">{product.rating || 4.9}</span>
            </div>
            <span>•</span>
            <span>({product.reviewsCount || 100} reviews)</span>
          </div>

          {/* Title */}
          <h4 className="text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#FF5E00] transition-colors leading-snug line-clamp-2 mb-2">
            {product.title}
          </h4>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#666666] line-clamp-2 leading-relaxed mb-4">
            {product.description}
          </p>

          {/* Tag badges */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#555555]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Bottom: Price and Buy Button */}
      <div className="p-5 pt-0 mt-auto border-t border-[#F2F2F2] flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400">Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#111111]">
              {formatPrice(product.price, selectedCurrency)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice, selectedCurrency)}
              </span>
            )}
          </div>
        </div>

        {/* Buy Button: redirects directly to Instagram or card's link */}
        <button
          onClick={() => onBuyClick(product)}
          className="px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          <ExternalLink className="w-4 h-4" />
          <span>{product.buyButtonLabel || 'Buy Now'}</span>
        </button>
      </div>
    </motion.div>
  );
}

