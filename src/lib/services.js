/**
 * Services are stored in MongoDB (SiteContent, key = "services") and served by
 * GET /api/content/services. This module is the single frontend access point:
 * it fetches the section once, caches it, and shares it across components.
 *
 * Shape returned by the API (SiteContent envelope):
 *   { success, data: { key, title, description, data: { header, categories } } }
 * Unwrapped below to:
 *   { header: { badge, heading, highlight, subtext }, categories: [...] }
 *
 * The catalogue below is the fallback and is byte-identical to
 * DEFAULT_SERVICES in backend/src/utils/defaultContent.js. It exists because an
 * empty `categories` array renders a heading with no cards at all, which is what
 * a failed API request used to produce.
 */
import { useEffect, useState } from 'react';
import { api } from './api';
import { logError } from './logger';

const FALLBACK_HEADER = {
  badge: 'Our Capabilities',
  heading: 'Tailored services for',
  highlight: 'ambitious teams',
  subtext:
    'Select a service below to get an instant scope review and fixed-rate proposal for your project in under a minute.'
};

const FALLBACK_CATEGORIES = [
  {
    key: 'website-development',
    title: 'Website Development',
    shortTitle: 'Web Development',
    description:
      'High-speed, responsive websites for every business model, from brochure sites to complex web applications and PWAs.',
    icon: 'Globe',
    badge: 'Core',
    items: [
      'Business website development',
      'Corporate website',
      'Portfolio website',
      'Landing page development',
      'Personal website',
      'Blog website',
      'News/magazine website',
      'Booking website',
      'Membership website',
      'Directory/listing website',
      'Custom web applications',
      'Progressive Web Apps (PWA)'
    ]
  },
  {
    key: 'ecommerce-development',
    title: 'E-commerce Development',
    shortTitle: 'E-commerce',
    description:
      'Conversion-focused storefronts with friction-free checkout, catalog management and multi-vendor capability.',
    icon: 'ShoppingBag',
    badge: 'Popular',
    items: [
      'E-commerce website',
      'Online store development',
      'Custom shopping website',
      'Product catalog website',
      'Multi-vendor marketplace',
      'Digital-product store',
      'Subscription website',
      'Payment gateway integration',
      'Shopping cart & checkout',
      'Order management system',
      'Inventory management',
      'Coupon/discount systems'
    ]
  },
  {
    key: 'admin-business-systems',
    title: 'Admin & Business Systems',
    shortTitle: 'Business Systems',
    description:
      'Bespoke admin panels, CRMs and operational dashboards with live metrics, permissions and data filters.',
    icon: 'LayoutDashboard',
    badge: 'Enterprise',
    items: [
      'Admin dashboard development',
      'Custom admin panel',
      'CRM development',
      'Customer management system',
      'Order management',
      'Invoice management',
      'Employee management',
      'Inventory dashboard',
      'Analytics dashboard',
      'Booking management',
      'Customer support dashboard',
      'Internal business tools'
    ]
  },
  {
    key: 'ui-ux-design',
    title: 'UI/UX & Design',
    shortTitle: 'UI/UX Design',
    description:
      'Intuitive user flows, wireframes and pixel-perfect design systems crafted around real user behaviour.',
    icon: 'Palette',
    badge: 'Creative',
    items: [
      'Website UI design',
      'SaaS UI design',
      'Dashboard UI',
      'Mobile UI',
      'Landing page design',
      'E-commerce UI',
      'Design systems',
      'UI component libraries',
      'Figma design',
      'UX research',
      'Wireframes',
      'Prototypes',
      'Website redesign'
    ]
  },
  {
    key: 'react-frontend-development',
    title: 'React & Frontend Development',
    shortTitle: 'React & Frontend',
    description:
      'Blazing-fast React and Next.js applications with clean component architecture and API integration.',
    icon: 'Code2',
    badge: 'Tech Stack',
    items: [
      'React.js development',
      'Next.js development',
      'Responsive frontend',
      'React dashboard',
      'React component development',
      'SaaS frontend',
      'API integration',
      'Authentication UI',
      'Payment UI',
      'Performance optimization',
      'Frontend bug fixing'
    ]
  },
  {
    key: 'backend-api-development',
    title: 'Backend & API Development',
    shortTitle: 'Backend & APIs',
    description:
      'Robust Node.js and Express backends with secure auth, RBAC, webhooks and third-party API integration.',
    icon: 'Server',
    badge: 'APIs',
    items: [
      'Node.js development',
      'Express.js APIs',
      'REST API development',
      'Authentication systems',
      'Authorization/RBAC',
      'Database integration',
      'Third-party API integration',
      'Webhooks',
      'Payment APIs',
      'Email APIs',
      'File-storage systems',
      'Backend optimization'
    ]
  },
  {
    key: 'website-maintenance',
    title: 'Website Maintenance',
    shortTitle: 'Maintenance',
    description:
      'Recurring monthly care covering security updates, backups, uptime monitoring and proactive optimisation.',
    icon: 'Wrench',
    badge: 'Recurring',
    items: [
      'Website maintenance',
      'Security updates',
      'Bug fixing',
      'Content updates',
      'Product updates',
      'Backup management',
      'Performance optimization',
      'Database maintenance',
      'SSL/domain assistance',
      'Hosting management',
      'Broken-page fixing',
      'Mobile responsiveness fixes',
      'Monthly maintenance plans'
    ]
  },
  {
    key: 'security-services',
    title: 'Security Services',
    shortTitle: 'Security',
    description:
      'Hardened applications with MFA, role-based access control, rate limiting, CAPTCHA and security headers.',
    icon: 'ShieldCheck',
    badge: 'Protection',
    items: [
      'Website security audit',
      'Authentication implementation',
      'MFA/TOTP integration',
      'Role-based access control',
      'API security',
      'Secure file downloads',
      'Payment security integration',
      'Rate limiting',
      'CAPTCHA/anti-spam',
      'Security headers',
      'Backup strategy',
      'Vulnerability review'
    ]
  },
  {
    key: 'cloud-deployment',
    title: 'Cloud & Deployment',
    shortTitle: 'Cloud & DevOps',
    description:
      'Zero-downtime releases across Vercel, Render, VPS and Cloudflare with CI/CD pipelines built in.',
    icon: 'Cloud',
    badge: 'Infrastructure',
    items: [
      'Vercel deployment',
      'Cloudflare configuration',
      'VPS deployment',
      'Node.js deployment',
      'Database deployment',
      'Domain configuration',
      'DNS configuration',
      'SSL setup',
      'CDN configuration',
      'Cloud storage',
      'Object storage integration',
      'Production environment setup',
      'CI/CD setup'
    ]
  },
  {
    key: 'digital-products',
    title: 'Digital Products',
    shortTitle: 'Digital Products',
    description:
      'Reusable, commercial-ready assets you can own outright: components, templates, kits and boilerplate.',
    icon: 'Package',
    badge: 'Scalable',
    items: [
      'React UI components',
      'HTML/CSS templates',
      'SaaS templates',
      'Dashboard templates',
      'Landing-page templates',
      'Portfolio templates',
      'E-commerce templates',
      'Figma UI kits',
      'Design systems',
      'Icons',
      'Illustrations',
      'Website templates',
      'Admin templates',
      'Code snippets',
      'Starter projects',
      'Boilerplates',
      'Developer resources'
    ]
  },
  {
    key: 'ebooks-educational-products',
    title: 'Ebooks & Educational Products',
    shortTitle: 'Ebooks & Courses',
    description:
      'Practical, project-based learning material covering ebooks, guides, cheat sheets and video mini-courses.',
    icon: 'BookOpen',
    badge: 'Education',
    items: [
      'Web development ebooks',
      'React ebooks',
      'JavaScript ebooks',
      'UI/UX ebooks',
      'CSS ebooks',
      'Design-system guides',
      'SEO guides',
      'Freelancing guides',
      'Business/technology guides',
      'Programming cheat sheets',
      'PDF guides',
      'Coding resources',
      'Video courses',
      'Mini courses',
      'Developer checklists'
    ]
  },
  {
    key: 'seo-digital-marketing',
    title: 'SEO & Digital Marketing',
    shortTitle: 'SEO & Marketing',
    description:
      'Technical and on-page SEO plus analytics, pixel and social setups so every visit is measurable.',
    icon: 'TrendingUp',
    badge: 'Growth',
    items: [
      'SEO setup',
      'Technical SEO',
      'On-page SEO',
      'Website SEO audit',
      'Keyword research',
      'Search Console setup',
      'Google Analytics setup',
      'Meta Pixel setup',
      'Conversion tracking',
      'Landing-page optimization',
      'Social-media setup',
      'Social-media creatives',
      'Paid-ad landing pages'
    ]
  },
  {
    key: 'automation',
    title: 'Automation',
    shortTitle: 'Automation',
    description:
      'Connected workflows that remove manual work across CRM, email, invoicing, orders and reporting.',
    icon: 'Cpu',
    badge: 'Efficiency',
    items: [
      'Business automation',
      'Email automation',
      'Lead management',
      'Form-to-email automation',
      'Invoice automation',
      'Order automation',
      'Telegram notifications',
      'WhatsApp integrations',
      'CRM automation',
      'Webhook automation',
      'Scheduled reports',
      'Excel/Google Sheets automation',
      'API automation'
    ]
  },
  {
    key: 'payment-digital-delivery',
    title: 'Payment & Digital Delivery',
    shortTitle: 'Payments & Delivery',
    description:
      'Razorpay and Stripe checkout, webhook handling, invoicing and secure time-limited digital delivery.',
    icon: 'CreditCard',
    badge: 'Fintech',
    items: [
      'Razorpay integration',
      'Stripe integration',
      'Payment gateway setup',
      'Payment webhook integration',
      'Order processing',
      'Digital product delivery',
      'Secure download links',
      'Temporary download URLs',
      'Invoice generation',
      'Email delivery',
      'Payment-failure handling',
      'Refund workflow'
    ]
  },
  {
    key: 'hosting-domain-services',
    title: 'Hosting & Domain Services',
    shortTitle: 'Hosting & Domain',
    description:
      'Domain, DNS, hosting, CDN and migration handled end to end, with monitoring and backup configuration.',
    icon: 'Network',
    badge: 'Infrastructure',
    items: [
      'Domain setup',
      'DNS configuration',
      'Cloudflare setup',
      'Hosting setup',
      'VPS setup',
      'Website migration',
      'SSL setup',
      'Email-domain setup',
      'CDN configuration',
      'Server monitoring',
      'Backup configuration'
    ]
  }
];

let cache = { header: FALLBACK_HEADER, categories: FALLBACK_CATEGORIES };
let inFlight = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach((fn) => fn(cache));
}

export async function loadServices() {
  if (inFlight) return inFlight;

  inFlight = api
    .get('/api/content/services')
    .then((res) => {
      const body = res && res.data ? res.data : null;
      // The API wraps the section in a SiteContent envelope:
      //   { success, data: { key, title, description, data: { header, categories } } }
      const payload = body && typeof body === 'object' && !Array.isArray(body) && body.data ? body.data : body;

      const categories = Array.isArray(payload)
        ? payload
        : payload && Array.isArray(payload.categories)
          ? payload.categories
          : null;
      const header = payload && !Array.isArray(payload) && payload.header ? payload.header : null;

      // Only replace the catalogue when the response actually carries one, so a
      // partial or empty response cannot blank out the grid.
      if (categories && categories.length > 0) {
        cache = { header: { ...FALLBACK_HEADER, ...(header || {}) }, categories };
        notify();
      }
      return cache;
    })
    .catch((err) => {
      logError('load services', err);
      return cache;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

function useServicesSection() {
  const [section, setSection] = useState(cache);

  useEffect(() => {
    let active = true;
    setSection(cache);

    const listener = (next) => {
      if (active) setSection(next);
    };
    subscribers.add(listener);

    loadServices();

    return () => {
      active = false;
      subscribers.delete(listener);
    };
  }, []);

  return section;
}

/** Full section: header text plus the service catalogue */
export function useServicesContent() {
  return useServicesSection();
}

/** Just the service categories */
export function useServices() {
  return useServicesSection().categories;
}

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'In Discussion',
  'Won',
  'Lost'
];
