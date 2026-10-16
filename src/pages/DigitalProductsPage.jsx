import React, { useEffect, useMemo } from 'react';
import ProductCatalogView from '../components/ProductCatalogView';
import { DIGITAL_PRODUCTS_DATA } from '../data/productsData';
import { useContent } from '../lib/siteContent';
import { trackVisit } from '../lib/tracking';

export default function DigitalProductsPage() {
  const content = useContent('digitalproducts');

  // Always render the latest cards from admin/database with millisecond accuracy
  const catalogData = useMemo(() => {
    if (content && Array.isArray(content.products) && content.products.length > 0) {
      return {
        ...DIGITAL_PRODUCTS_DATA,
        ...content,
        products: content.products,
        categories:
          Array.isArray(content.categories) && content.categories.length > 0
            ? content.categories
            : DIGITAL_PRODUCTS_DATA.categories,
      };
    }
    return DIGITAL_PRODUCTS_DATA;
  }, [content]);

  // Ensure content is fresh on page load
  useEffect(() => {
    if (typeof content?.reload === 'function') {
      content.reload();
    }
  }, []);

  useEffect(() => {
    trackVisit('/digital-products');
  }, []);

  useEffect(() => {
    document.title = 'Digital Products & UI Kits — Templates, Portfolios & Design Systems | SuperUI';
  }, []);

  return (
    <ProductCatalogView
      catalogData={catalogData}
      defaultCategory="all"
      pageType="digital-products"
    />
  );
}
