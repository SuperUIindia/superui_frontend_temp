import React, { useEffect, useMemo } from 'react';
import ProductCatalogView from '../components/ProductCatalogView';
import { EBOOKS_DATA } from '../data/productsData';
import { useContent } from '../lib/siteContent';
import { trackVisit } from '../lib/tracking';

export default function EbooksDigitalPage() {
  const content = useContent('ebooks');

  // Ensure all 9 e-books cards across all categories are displayed
  const catalogData = useMemo(() => {
    if (!content || !Array.isArray(content.products) || content.products.length <= 1) {
      return EBOOKS_DATA;
    }
    const products =
      content.products.length >= EBOOKS_DATA.products.length
        ? content.products
        : EBOOKS_DATA.products;

    return {
      ...EBOOKS_DATA,
      ...content,
      products,
      categories: EBOOKS_DATA.categories,
    };
  }, [content]);

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
