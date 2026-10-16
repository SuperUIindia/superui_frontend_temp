import React, { useEffect, useMemo } from 'react';
import ProductCatalogView from '../components/ProductCatalogView';
import { EBOOKS_DATA } from '../data/productsData';
import { useContent } from '../lib/siteContent';
import { trackVisit } from '../lib/tracking';

export default function EbooksDigitalPage() {
  const content = useContent('ebooks');

  // Always render the latest cards from admin/database with millisecond accuracy
  const catalogData = useMemo(() => {
    if (content && Array.isArray(content.products) && content.products.length > 0) {
      return {
        ...EBOOKS_DATA,
        ...content,
        products: content.products,
        categories:
          Array.isArray(content.categories) && content.categories.length > 0
            ? content.categories
            : EBOOKS_DATA.categories,
      };
    }
    return EBOOKS_DATA;
  }, [content]);

  // Ensure content is fresh on page load
  useEffect(() => {
    if (typeof content?.reload === 'function') {
      content.reload();
    }
  }, []);

  useEffect(() => {
    trackVisit('/ebooks-digital');
  }, []);

  useEffect(() => {
    document.title = 'All Types of E-Books — Devotional, Fitness, Business, Tech & Digital Guides | SuperUI';
  }, []);

  return (
    <ProductCatalogView
      catalogData={catalogData}
      defaultCategory="all"
      pageType="ebooks"
    />
  );
}
