/**
 * Head management for SEO, AEO (answer-engine optimisation) and GEO
 * (generative-engine optimisation / local SEO).
 *
 * Three layers, in order of authority:
 *   1. index.html holds the pre-render defaults, so crawlers that never execute
 *      JavaScript still see a complete, valid head.
 *   2. The database-driven `seo` section (Admin -> All Sections -> SEO) is
 *      applied at runtime, so copy changes need no rebuild.
 *   3. This module injects the JSON-LD graph, the GEO meta tags and the
 *      hreflang/canonical hints that no human would maintain by hand.
 *
 * Every URL comes from frontend/.env via lib/env.js. Nothing is hard-coded.
 */
import { SITE_CONFIG, SEO_CONFIG, BUSINESS_CONFIG } from './env';
import { SOCIAL_LINKS, INSTAGRAM_URL, FACEBOOK_URL, LINKEDIN_URL } from './social';

const MANAGED = [
  ['name', 'description'],
  ['name', 'keywords'],
  ['name', 'author'],
  ['name', 'robots'],
  ['name', 'googlebot'],
  ['name', 'rating'],
  ['name', 'geo.region'],
  ['name', 'geo.placename'],
  ['name', 'geo.position'],
  ['name', 'ICBM'],
  ['property', 'og:type'],
  ['property', 'og:url'],
  ['property', 'og:site_name'],
  ['property', 'og:locale'],
  ['property', 'og:title'],
  ['property', 'og:description'],
  ['property', 'og:image'],
  ['property', 'og:image:alt'],
  ['property', 'og:image:width'],
  ['property', 'og:image:height'],
  ['name', 'twitter:card'],
  ['name', 'twitter:url'],
  ['name', 'twitter:site'],
  ['name', 'twitter:title'],
  ['name', 'twitter:description'],
  ['name', 'twitter:image'],
  ['name', 'twitter:image:alt']
];

const SITE_URL = SITE_CONFIG.siteUrl;

function setMeta(attr, key, content) {
  if (content === undefined || content === null || content === '') return;
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', String(content));
}

function setLink(rel, key, href) {
  if (!href || typeof document === 'undefined') return;
  let el = document.head.querySelector(`link[rel="${rel}"]${key ? `[hreflang="${key}"]` : ''}`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (key) el.setAttribute('hreflang', key);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Turns a site-relative asset path into an absolute URL for social cards. */
function absolute(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * @param {object} seo - the `seo` section data from the database
 */
export function applySeoContent(seo) {
  if (typeof document === 'undefined') return;

  const s = seo && typeof seo === 'object' ? seo : {};

  if (s.title) document.title = s.title;

  const canonical = s.canonical || s.siteUrl || SITE_URL;
  const ogImage = absolute(s.ogImage || SEO_CONFIG.ogImage);

  for (const [attr, key] of MANAGED) {
    const mapKey = key.replace(/^og:/, 'og').replace(/^twitter:/, 'twitter');
    let value = s[mapKey];
    // og:title / twitter:title fall back to the plain title when unset
    if (value === undefined || value === null || value === '') {
      value = key.endsWith(':title') ? s.title : undefined;
    }
    // og:url / twitter:url always resolve against the canonical URL
    if ((key === 'og:url' || key === 'twitter:url') && !value) value = canonical;
    if (key === 'og:image') value = ogImage || undefined;
    if (key === 'og:site_name' && !value) value = SITE_CONFIG.brand;
    if (key === 'og:locale' && !value) value = SITE_CONFIG.locale.replace('_', '-');
    if (key === 'author' && !value) value = SITE_CONFIG.brand;
    if (key === 'keywords' && !value) value = SEO_CONFIG.keywords || undefined;
    setMeta(attr, key, value);
  }

  setLink('canonical', null, canonical);
  setLink('alternate', 'x-default', canonical);

  // Local business / open graph address, consumed by several engines.
  if (BUSINESS_CONFIG.regionCode) {
    setMeta('name', 'geo.region', BUSINESS_CONFIG.regionCode);
  }
  if (BUSINESS_CONFIG.city) {
    // cityName() strips any region/country a hand-edited .env appended, so this
    // renders "Warangal, India" rather than "Warangal, Telangana, India., India".
    setMeta('name', 'geo.placename', `${cityName()}, ${BUSINESS_CONFIG.countryName || ''}`.replace(/,\s*$/, ''));
  }
  if (BUSINESS_CONFIG.latitude && BUSINESS_CONFIG.longitude) {
    setMeta('name', 'geo.position', `${BUSINESS_CONFIG.latitude};${BUSINESS_CONFIG.longitude}`);
    setMeta('name', 'ICBM', `${BUSINESS_CONFIG.latitude}, ${BUSINESS_CONFIG.longitude}`);
  }
  if (BUSINESS_CONFIG.email) setMeta('name', 'author', BUSINESS_CONFIG.email);
  setMeta('name', 'theme-color', SITE_CONFIG.themeColor);
}

/** Stable @id nodes so the JSON-LD graph cross-references cleanly. */
const ID = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  webpage: `${SITE_URL}/#webpage`,
  logo: `${SITE_URL}${SITE_CONFIG.logoPath}`,
  service: `${SITE_URL}/#service`,
  faq: `${SITE_URL}/#faq`,
  breadcrumb: `${SITE_URL}/#breadcrumb`
};

/**
 * Bare city name.
 *
 * VITE_BUSINESS_CITY is meant to hold only the city, but a hand-edited .env can
 * easily carry "Warangal, Telangana, India." instead. Schema.org
 * addressLocality and the geo.placename meta tag both require a single locality,
 * so the extra commas are stripped rather than emitted verbatim.
 */
function cityName() {
  if (!BUSINESS_CONFIG.city) return '';
  return BUSINESS_CONFIG.city.split(',')[0].trim().replace(/\.$/, '');
}

function postalAddress() {
  if (!BUSINESS_CONFIG.city && !BUSINESS_CONFIG.country) return undefined;
  return {
    '@type': 'PostalAddress',
    streetAddress: undefined,
    // Bare city name: addressLocality must not carry the region or country.
    addressLocality: cityName() || undefined,
    addressRegion: BUSINESS_CONFIG.region || undefined,
    // addressCountry must be ISO 3166-1 alpha-2 (e.g. "IN"), NOT a region/subdivision
    // code like "IN-TG". BUSINESS_CONFIG.country holds the correct "IN" value.
    addressCountry: BUSINESS_CONFIG.country || undefined,
    postalCode: BUSINESS_CONFIG.postalCode || undefined
  };
}

function geoCoordinates() {
  if (!BUSINESS_CONFIG.latitude || !BUSINESS_CONFIG.longitude) return undefined;
  return {
    '@type': 'GeoCoordinates',
    latitude: Number(BUSINESS_CONFIG.latitude),
    longitude: Number(BUSINESS_CONFIG.longitude)
  };
}

function areaServed() {
  if (!BUSINESS_CONFIG.areasServed.length) return undefined;
  // Known city names in the areasServed list. Schema.org requires that
  // @type matches the actual entity: City for cities, Country for countries.
  const CITY_NAMES = new Set(['warangal', 'hyderabad', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'chennai', 'kolkata', 'pune']);
  return BUSINESS_CONFIG.areasServed.map((name) => {
    const isCity = CITY_NAMES.has(name.toLowerCase());
    return { '@type': isCity ? 'City' : 'Country', name };
  });
}

function contactPoint() {
  if (!BUSINESS_CONFIG.email && !BUSINESS_CONFIG.phone) return undefined;
  return [
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: BUSINESS_CONFIG.email || undefined,
      telephone: BUSINESS_CONFIG.phone || undefined,
      availableLanguage: ['en', 'hi'],
      areaServed: areaServed()
    },
    {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      email: BUSINESS_CONFIG.email || undefined,
      availableLanguage: ['en']
    }
  ];
}

function sameAs() {
  return [INSTAGRAM_URL, FACEBOOK_URL, LINKEDIN_URL].filter(Boolean);
}

/**
 * Builds the full JSON-LD graph.
 *
 * `sections` is the merged site-content object, so the FAQ entries and the
 * service catalogue always describe what is actually rendered on the page.
 */
export function buildStructuredData({ seo = {}, sections = {} } = {}) {
  const brand = SITE_CONFIG.brand;
  const alt = SITE_CONFIG.alternateBrand ? [SITE_CONFIG.alternateBrand] : [];
  const canonical = seo.canonical || seo.siteUrl || SITE_URL;
  const description = seo.description || SEO_CONFIG.defaultDescription;
  const logo = absolute(SITE_CONFIG.logoPath);
  const image = absolute(seo.ogImage || SEO_CONFIG.ogImage);

  const organization = {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ID.organization,
    name: brand,
    alternateName: alt,
    legalName: alt[0] || brand,
    description,
    url: SITE_URL,
    logo,
    image,
    email: BUSINESS_CONFIG.email || undefined,
    telephone: BUSINESS_CONFIG.phone || undefined,
    address: postalAddress(),
    geo: geoCoordinates(),
    areaServed: areaServed(),
    sameAs: sameAs(),
    contactPoint: contactPoint(),
    knowsAbout: [
      'Web Development',
      'UI/UX Design',
      'E-commerce Development',
      'React Development',
      'Next.js Development',
      'Node.js and Express APIs',
      'SEO',
      'Cloud Deployment',
      'Website Maintenance',
      'Business Automation'
    ],
    slogan: seo.title || SEO_CONFIG.defaultTitle
  };

  const website = {
    '@type': 'WebSite',
    '@id': ID.website,
    url: SITE_URL,
    name: brand,
    alternateName: alt,
    description,
    inLanguage: SITE_CONFIG.locale.replace('_', '-'),
    publisher: { '@id': ID.organization }
  };

  const webpage = {
    '@type': 'WebPage',
    '@id': ID.webpage,
    url: canonical,
    name: seo.title || SEO_CONFIG.defaultTitle,
    description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.organization },
    primaryImageOfPage: image ? { '@id': `${canonical}#primaryimage`, url: image } : undefined,
    inLanguage: SITE_CONFIG.locale.replace('_', '-'),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#top h1', '#services h2', '#how-it-works h2', '#why-us h2', '#contact h2']
    }
  };

  const serviceCategories = Array.isArray(sections.services?.categories) ? sections.services.categories : [];
  const service = serviceCategories.length
    ? {
        '@type': 'Service',
        '@id': ID.service,
        name: `${brand} Digital Product Engineering`,
        description,
        url: `${SITE_URL}/#services`,
        image,
        provider: { '@id': ID.organization },
        areaServed: areaServed(),
        serviceType: serviceCategories.map((c) => c.title),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: serviceCategories.map((category) => ({
            '@type': 'Offer',
            position: serviceCategories.indexOf(category) + 1,
            itemOffered: {
              '@type': 'Service',
              name: category.title,
              description: category.shortTitle ? `${category.title} - ${category.shortTitle}` : category.title,
              url: `${SITE_URL}/#services`,
              provider: { '@id': ID.organization },
              areaServed: areaServed(),
              ...(Array.isArray(category.items) && category.items.length
                ? { hasOfferCatalog: { '@type': 'OfferCatalog', itemListElement: category.items.map((item) => ({ '@type': 'Service', name: item })) } }
                : {})
            }
          }))
        }
      }
    : null;

  const faqItems = buildFaqItems(sections);
  const faq = faqItems.length
    ? {
        '@type': 'FAQPage',
        '@id': ID.faq,
        mainEntity: faqItems
      }
    : null;

  // BreadcrumbList: this site is a single-page application; all navbar links are
  // in-page anchors (#top, #services …). Schema.org BreadcrumbList.item requires
  // the URL of a web page, not a fragment identifier, so we emit a single-item
  // breadcrumb pointing to the canonical homepage rather than fabricated URLs.
  // This is the correct representation for a flat, one-page site hierarchy.
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      }
    ]
  };

  const graph = [organization, website, webpage];
  if (service) graph.push(service);
  if (faq) graph.push(faq);
  if (breadcrumb) graph.push(breadcrumb);

  return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) };
}

/**
 * Question/answer pairs derived from the live page copy.
 *
 * AEO: answer engines quote short, self-contained answers, so each entry pairs
 * the question a buyer actually asks with the site's own answer sentence.
 */
function buildFaqItems(sections) {
  const items = [];
  const brand = SITE_CONFIG.brand;
  const guarantees = Array.isArray(sections.contact?.guarantees) ? sections.contact.guarantees : [];
  const steps = Array.isArray(sections.howitworks?.steps) ? sections.howitworks.steps : [];
  const points = Array.isArray(sections.whyus?.points) ? sections.whyus.points : [];
  const heroSubtext = sections.hero?.subtext || '';

  const question = (q, a) => {
    if (!q || !a) return;
    const answer = String(a).trim();
    if (answer.length < 25) return;
    items.push({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    });
  };

  question(
    `What does ${brand} do?`,
    heroSubtext || `${brand} is a full-stack web development and UI/UX design studio that builds fast, secure, SEO-optimised websites, e-commerce stores and custom web applications.`
  );

  question(
    `How long does a project with ${brand} take?`,
    steps[1]?.description
      ? `${steps[1].description} Typical engagements move from requirements to a fixed-price proposal in ${steps[0]?.title?.toLowerCase() || 'one step'} and from approval to launch in ${steps[3]?.title?.toLowerCase() || 'weeks'}.`
      : ''
  );

  question(
    `How much does a website cost at ${brand}?`,
    'Pricing is fixed upfront with no hidden charges and depends on scope. Send your requirements through the inquiry form and you receive a transparent, itemised quote with milestones and a timeline within 24 business hours.'
  );

  question(
    `How quickly does ${brand} respond?`,
    sections.contactform?.footnote ||
      'Every inquiry receives a tailored response within 24 business hours, and the intake form blocks automated spam with a honeypot and rate limiting.'
  );

  guarantees.slice(0, 3).forEach((guarantee) => {
    question(`What is included when I work with ${brand}?`, guarantee);
  });

  points.forEach((point) => {
    question(`Why should I choose ${brand} for ${String(point.title || '').toLowerCase()}?`, point.description);
  });

  return items;
}

/**
 * Writes (or refreshes) the single JSON-LD script tag. A stable id means the
 * tag is updated in place rather than appended on every re-render.
 */
export function applyStructuredData(graph) {
  if (typeof document === 'undefined') return;
  const id = 'superui-structured-data';
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(graph, (key, value) => (value === undefined ? undefined : value));
}

/** Convenience: build and apply in one call. */
export function applySeoGraph({ seo, sections }) {
  const graph = buildStructuredData({ seo, sections });
  applyStructuredData(graph);
  return graph;
}

/**
 * Emits the Search Console verification meta tag.
 *
 * SEO_CONFIG.gscVerification is read from VITE_GSC_VERIFICATION, but the token
 * can only be injected at runtime (index.html is static), so it is applied here
 * with the rest of the head. Without this the token configured in .env was
 * silently ignored and site verification never completed.
 */
export function applyVerificationTags() {
  if (typeof document === 'undefined') return;
  const token = (SEO_CONFIG.gscVerification || '').trim();
  if (!token) return;
  setMeta('name', 'google-site-verification', token);
}

export { SOCIAL_LINKS, MANAGED, SITE_URL, absolute };
export default applySeoContent;
