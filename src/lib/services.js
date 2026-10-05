/**
 * Services are stored in MongoDB (SiteContent, key = "services") and served by
 * GET /api/content/services. This module is the single frontend access point:
 * it fetches the section once, caches it, and shares it across components.
 *
 * Shape returned by the API (SiteContent envelope):
 *   { success, data: { key, title, description, data: { header, categories } } }
 * Unwrapped below to:
 *   { header: { badge, heading, highlight, subtext }, categories: [...] }
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

let cache = { header: FALLBACK_HEADER, categories: [] };
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