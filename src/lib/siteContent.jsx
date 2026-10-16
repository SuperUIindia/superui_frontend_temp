/**
 * Site content store.
 *
 * Every editable string on the public site lives in the `sitecontents` MongoDB
 * collection and is edited from Admin -> All Sections. This module fetches the
 * whole collection once per page load and exposes it through a React context.
 *
 * Each section also has a hard-coded fallback identical to the seed in
 * `backend/src/utils/defaultContent.js`, so a failed or slow request degrades to
 * the currently deployed copy instead of an empty page.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { logError } from './logger';
import { DIGITAL_PRODUCTS_DATA, EBOOKS_DATA } from '../data/productsData';

/** Section keys, lowercased exactly as the SiteContent model stores them. */
export const SECTION_KEYS = [
  'navbar',
  'hero',
  'featuredproducts',
  'digitalproducts',
  'ebooks',
  'marquee',
  'services',
  'howitworks',
  'whyus',
  'contact',
  'ctaband',
  'footer',
  'contactmodal',
  'contactform',
  'seo'
];

const FALLBACKS = {
  digitalproducts: DIGITAL_PRODUCTS_DATA,
  ebooks: EBOOKS_DATA,
  navbar: {
    brandName: 'SuperUI',
    brandHighlight: '',
    logoUrl: '/superui_logo.png',
    homeHref: '#top',
    links: [
      { label: 'Home', href: '#top' },
      { label: 'Services', href: '#services' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Why SuperUI', href: '#why-us' },
      { label: 'Contact', href: '#contact' }
    ],
    ctaLabel: 'Start a Project',
    ctaLabelMobile: 'Start Project'
  },
  hero: {
    anchorId: 'top',
    pillText: 'Full-Stack Digital Product Engineering',
    headline: 'We build fast, secure websites that grow your business.',
    headlineHighlightFrom: 4,
    subtext:
      'From high-converting web apps and performant dashboards to custom automations—SuperUI delivers production-ready engineering designed for measurable business growth.',
    primaryCtaText: 'Start a Project',
    secondaryCtaText: 'View Services',
    trustPoints: ['Production-ready code', 'Secure by default', 'Fast 24h turnaround']
  },
  featuredproducts: {
    badge: 'Curated Digital Marketplace',
    title: 'Explore Featured Collections & Digital Assets',
    subtitle:
      'Choose a collection below to browse ready-to-download e-books, templates, UI components, and creative systems.',
    products: [
      {
        id: 'ebooks',
        name: 'All Types of E-Books',
        href: '/ebooks-digital',
        buttonLabel: 'E-Books',
        image: '/E_Books.png',
        imageAlt: 'All Types of E-Books - Devotional, Fitness, Recipes, Marketing Guides',
        bgColor: 'bg-[#F5F3FF]',
        accentColor: '#7C3AED'
      },
      {
        id: 'digital-products',
        name: 'UI Kits & Digital Assets',
        href: '/digital-products',
        buttonLabel: 'Websites',
        image:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
        imageAlt: 'Digital UI Kits and Web Development Systems',
        bgColor: 'bg-[#EFF6FF]',
        accentColor: '#FF5E00'
      }
    ]
  },
  marquee: {
    rows: [
      [
        { text: 'Website Development', highlight: true },
        { text: 'React 19 & Next.js', highlight: false },
        { text: 'E-commerce Platforms', highlight: true },
        { text: 'Tailwind CSS & Framer Motion', highlight: false },
        { text: 'Admin Dashboards', highlight: true },
        { text: 'Payment Gateway Integration', highlight: false },
        { text: 'High-Converting Landing Pages', highlight: false },
        { text: 'Modern REST & GraphQL APIs', highlight: false }
      ],
      [
        { text: 'UI/UX Design & Prototyping', highlight: true },
        { text: 'Business Workflow Automation', highlight: true },
        { text: 'MongoDB & Cloud Architecture', highlight: false },
        { text: 'Core Web Vitals & SEO', highlight: true },
        { text: 'Zero-Downtime Maintenance', highlight: false },
        { text: 'Mobile-First Responsive Design', highlight: false },
        { text: 'Custom SaaS Web Applications', highlight: true },
        { text: 'Speed & Security Hardening', highlight: false }
      ]
    ]
  },
  howitworks: {
    anchorId: 'how-it-works',
    badge: 'Simple 4-Step Process',
    sectionTitle: 'How we turn ideas into',
    sectionHighlight: 'reality',
    sectionSubtitle:
      'Transparent, reliable engineering from the first consultation through release day and beyond.',
    steps: [
      {
        num: '01',
        title: 'Tell Us Your Needs',
        description:
          'Fill out our 1-minute form with your goals, target audience, and feature wish-list.',
        icon: 'MessageSquareText',
        color: '#FF5E00'
      },
      {
        num: '02',
        title: 'Scope & Proposal',
        description:
          'Receive a transparent, fixed-price quote with milestones, timeline, and tech specs.',
        icon: 'FileSpreadsheet',
        color: '#7C3AED'
      },
      {
        num: '03',
        title: 'Agile Build & Feedback',
        description:
          'We code with modern stacks, delivering sprint previews and weekly milestone updates.',
        icon: 'Code2',
        color: '#FF5E00'
      },
      {
        num: '04',
        title: 'Launch & Support',
        description:
          'Thorough QA, cloud deployment, asset handover, and continuous maintenance warranty.',
        icon: 'Rocket',
        color: '#7C3AED'
      }
    ]
  },
  whyus: {
    anchorId: 'why-us',
    badge: 'Why Choose Us',
    sectionTitle: 'Built with precision, engineered for',
    sectionHighlight: 'growth',
    sectionSubtitle:
      'We partner with founders and enterprises to ship digital products that convert, scale, and endure.',
    cardFooter: 'Included in every engagement',
    points: [
      {
        title: 'Production-Ready Code',
        description:
          'Clean, documented, maintainable code written to modern industry standards. No shortcuts, no spaghetti.',
        icon: 'Code',
        badge: 'Architecture',
        accent: '#FF5E00'
      },
      {
        title: 'Secure by Default',
        description:
          'OWASP-compliant best practices, rate limiting, hashed sensitive data, and encrypted transport built-in.',
        icon: 'ShieldCheck',
        badge: 'Security',
        accent: '#7C3AED'
      },
      {
        title: 'High Velocity Delivery',
        description:
          'Streamlined agile workflow that turns requirements into shipped products in days, not quarters.',
        icon: 'Zap',
        badge: 'Speed',
        accent: '#FF5E00'
      },
      {
        title: 'Continuous Maintenance',
        description:
          'Post-launch monitoring, performance tuning, and guaranteed SLA support so your product never goes down.',
        icon: 'HeartHandshake',
        badge: 'Reliability',
        accent: '#7C3AED'
      }
    ]
  },
  contact: {
    anchorId: 'contact',
    badge: 'Get In Touch',
    sectionTitle: "Let's discuss your next",
    sectionHighlight: 'breakthrough',
    sectionSubtitle:
      'Whether you need a new website, a full product redesign, or ongoing technical support, share your project requirements below.',
    points: [
      {
        label: 'Direct Email',
        value: 'hello.superui@gmail.com',
        href: 'mailto:hello.superui@gmail.com'
      },
      { label: 'Response SLA', value: 'Within 24 business hours' },
      { label: 'Location', value: 'Warangal, Telangana, India (Serving Global Clients)' }
    ],
    guarantees: [
      'Free architecture & technical consultation',
      'Fixed upfront quote with zero hidden charges',
      'NDA signed upon request for confidential ideas'
    ],
    // The inquiry form renders inline in the right-hand card of this section.
    // These three strings head that form.
    formCardTitle: 'Project Inquiry Form',
    formCardSubtitle:
      'Fill out the parameters below and our engineering team will get back to you with a roadmap.',
    formCardButton: 'Open the contact form'
  },
  ctaband: {
    badge: 'Ready to kickstart?',
    heading: "Let's turn your vision into a live product.",
    subtext:
      "Send your requirements today. We'll examine your architecture, recommend the best tech stack, and share a fixed-price proposal.",
    ctaText: 'Start a Project'
  },
  footer: {
    brandName: 'SuperUI',
    brandHighlight: '',
    logoUrl: '/superui_logo.png',
    tagline:
      'Full-stack digital engineering studio building performant, conversion-driven websites and scalable web applications for forward-thinking businesses.',
    servicesGroupTitle: 'Services',
    servicesLimit: 6,
    companyGroupTitle: 'Company',
    companyLinks: [
      { label: 'Home', href: '#top' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Why SuperUI', href: '#why-us' },
      { label: 'Start Inquiry', href: '#contact' }
    ],
    contactGroupTitle: 'Contact',
    contactItems: [
      { label: 'hello.superui@gmail.com', href: 'mailto:hello.superui@gmail.com' },
      { label: 'Response in under 24 hours' },
      { label: 'Warangal, Telangana, India (Global Remote)' }
    ],
    copyrightText: 'SuperUI. All rights reserved.',
    privacyNote:
      'Privacy Note: We respect your privacy. Visitor metrics are anonymized with SHA-256 and never shared.',
    backToTopLabel: 'Back to top'
  },
  contactmodal: {
    badge: 'Start Your Project',
    heading: "Let's build something",
    headingHighlight: 'exceptional',
    subtext:
      "Tell us about your requirements. We'll review your project scope and follow up with a proposal within 24 hours."
  },
  contactform: {
    fields: {
      name: { label: 'Your Name', placeholder: 'John Doe' },
      email: { label: 'Email Address', placeholder: 'john@company.com' },
      phone: { label: 'Phone / WhatsApp', placeholder: '+91 98765 43210' },
      instagram: { label: 'Instagram ID', placeholder: '@yourhandle' },
      purpose: { label: 'Purpose', placeholder: 'Select a service' },
      description: {
        label: 'Reason / Note',
        placeholder:
          'Briefly tell us what you need built, your goals, target audience, or any reference websites...'
      }
    },
    optionalSuffix: '(Optional)',
    honeypotLabel: 'Leave this empty',
    submitText: 'Send Project Requirements',
    footnote: 'No spam guaranteed. We respond with a tailored proposal in <24 hours.',
    successHeadingPrefix: 'Thank you dear',
    successFallbackName: 'there',
    successTagline: 'We build fast, secure websites that grow your business.',
    successBody:
      'We have received your requirements and we will contact you soon. Our team usually replies within 24 business hours.',
    successFasterReply: 'Want a faster reply?',
    successDmCta: 'Message me on Instagram',
    successFollowCta: 'Follow SuperUI on Instagram',
    successSubmitAnother: 'Submit Another Request',
    successClose: 'Continue',
    errorFallbackEmail: 'hello.superui@gmail.com'
  },
  seo: {
    title: 'SuperUI — Web Development, UI/UX Design & Custom Software Studio',
    description:
      'SuperUI is a full-stack web development and UI/UX design studio in Warangal, Telangana, India. We build fast, secure, SEO-optimised websites, e-commerce stores and custom web applications. Get a fixed-price proposal within 24 hours.',
    keywords:
      'web development company Warangal, UI UX design services India, custom web application development, ecommerce website development, React Next.js developers India, website maintenance SEO services, admin dashboard development, SuperUI, SuperUI Warangal',
    author: 'SuperUI',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    ogType: 'website',
    siteUrl: 'https://superui.in/',
    ogSiteName: 'SuperUI',
    ogLocale: 'en_IN',
    ogTitle: 'SuperUI — Web Development, UI/UX Design & Custom Software Studio',
    ogDescription:
      'A full-stack engineering and design studio in Warangal, Telangana delivering high-speed web apps, e-commerce stores, custom software and conversion-optimised websites.',
    ogImage: 'https://superui.in/superui_logo.png',
    ogImageAlt: 'SuperUI — Web Development & UI/UX Design Studio logo',
    twitterCard: 'summary_large_image'
  }
};

const SYNC_CHANNEL_NAME = 'superui_content_sync_channel';
const LOCAL_CACHE_KEY = 'superui_content_cache_v2';

let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  syncChannel = null;
}

/**
 * Instantly broadcast an update to all active components and browser tabs in 0ms.
 */
export function updateContentInstantly(key, data) {
  if (!key || !data) return;
  const k = String(key).toLowerCase();

  // 1. Update localStorage cache immediately
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[k] = data;
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore storage errors */
  }

  // 2. Dispatch custom event for current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('superui:content-instant-update', {
        detail: { key: k, data }
      })
    );
  }

  // 3. Post to BroadcastChannel for all other tabs/windows
  try {
    if (syncChannel) {
      syncChannel.postMessage({ key: k, data, timestamp: Date.now() });
    }
  } catch {
    /* ignore channel errors */
  }
}

const SiteContentContext = createContext({
  content: FALLBACKS,
  loading: true,
  error: null,
  reload: () => {},
  updateInstant: updateContentInstantly
});

/** Loads every section and shares it with all consumers with instant real-time sync. */
export function SiteContentProvider({ children }) {
  // Read initial content from localStorage cache merged with fallbacks for 0ms paint
  const [content, setContent] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        return { ...FALLBACKS, ...cached };
      }
    } catch {
      /* ignore storage errors */
    }
    return FALLBACKS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // Listen for instant updates in the current window and across other tabs
  useEffect(() => {
    const handleInstantUpdate = (e) => {
      if (!e?.detail) return;
      const { key, data } = e.detail;
      if (key && data) {
        setContent((prev) => ({
          ...prev,
          [key.toLowerCase()]: data
        }));
      }
    };

    const handleBroadcast = (event) => {
      if (event?.data?.key && event.data.data) {
        setContent((prev) => ({
          ...prev,
          [event.data.key.toLowerCase()]: event.data.data
        }));
      }
    };

    window.addEventListener('superui:content-instant-update', handleInstantUpdate);
    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      window.removeEventListener('superui:content-instant-update', handleInstantUpdate);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    api
      .get(`/api/content?_t=${Date.now()}`)
      .then((res) => {
        if (!active) return;
        const sections = res && res.data ? res.data : null;
        if (!sections || typeof sections !== 'object') return;

        // Merge per key so a section missing from the response keeps its fallback.
        const merged = { ...FALLBACKS };
        for (const key of Object.keys(sections)) {
          const section = sections[key];
          if (section && section.data && typeof section.data === 'object') {
            merged[key.toLowerCase()] = section.data;
          }
        }
        setContent(merged);
        setError(null);

        // Update local cache
        try {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(merged));
        } catch {
          /* ignore */
        }
      })
      .catch((err) => {
        if (!active) return;
        logError('load site content', err);
        setError(err.message || 'Failed to load site content');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tick]);

  const value = useMemo(
    () => ({
      content,
      loading,
      error,
      reload: () => setTick((t) => t + 1),
      updateInstant: updateContentInstantly
    }),
    [content, loading, error]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/** Full store: { content, loading, error, reload, updateInstant } */
export function useSiteContent() {
  return useContext(SiteContentContext);
}

/**
 * One section's data object, merged over its hard-coded fallback so a partially
 * edited section never renders `undefined`.
 */
export function useContent(key) {
  const { content, loading, error, reload } = useSiteContent();
  const k = String(key).toLowerCase();
  const fallback = FALLBACKS[k] || {};
  const value = useMemo(
    () => ({ ...fallback, ...(content[k] || {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, k]
  );
  return { ...value, loading, error, reload };
}

export { FALLBACKS as CONTENT_FALLBACKS };