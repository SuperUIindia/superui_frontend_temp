import React, { useEffect, useMemo } from 'react';
import ProductCatalogView from '../components/ProductCatalogView';
import { DIGITAL_PRODUCTS_DATA } from '../data/productsData';
import { useContent } from '../lib/siteContent';
import { trackVisit } from '../lib/tracking';

export default function DigitalProductsPage() {
  const content = useContent('digitalproducts');

  // Ensure all 9 cards (3 UI Kits + 2 Website Templates + 2 Mobile App Kits + 2 SaaS Dashboards) are displayed
  const catalogData = useMemo(() => {
    if (!content || !Array.isArray(content.products) || content.products.length <= 1) {
      return DIGITAL_PRODUCTS_DATA;
    }
    const products =
      content.products.length >= DIGITAL_PRODUCTS_DATA.products.length
        ? content.products
        : DIGITAL_PRODUCTS_DATA.products;

    return {
      ...DIGITAL_PRODUCTS_DATA,
      ...content,
      products,
      categories: DIGITAL_PRODUCTS_DATA.categories,
    };
  }, [content]);

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
