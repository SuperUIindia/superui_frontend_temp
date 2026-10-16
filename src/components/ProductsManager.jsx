import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  FileJson,
  Image as ImageIcon,
  Check,
  AlertCircle,
  X,
  Search,
  Copy,
  Layers,
  BookOpen,
  ShoppingBag,
  Tag,
  Globe,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { useConfirm } from './useConfirm';
import Button from './Button';
import { DIGITAL_PRODUCTS_DATA, EBOOKS_DATA } from '../data/productsData';
import { PATHS } from '../routes/paths';

const indent = (obj) => JSON.stringify(obj, null, 2);

const PRESET_BADGES = ['50% OFF', 'HOT DEAL', 'NEW RELEASE', 'FEATURED', 'LIMITED'];

export default function ProductsManager() {
  const toast = useToast();
  const { confirm, confirmElement } = useConfirm();

  // Active Catalog: 'digitalproducts' | 'ebooks'
  const [activeCatalog, setActiveCatalog] = useState('digitalproducts');

  // Catalogs State
  const [catalogs, setCatalogs] = useState({
    digitalproducts: DIGITAL_PRODUCTS_DATA,
    ebooks: EBOOKS_DATA,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'json'

  // Card modal: null | { mode: 'create' | 'edit', product: object | null }
  const [cardModal, setCardModal] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // JSON Editor state
  const [jsonData, setJsonData] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Fetch both catalogs from admin content API
  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/content');
      const sections = res?.data?.sections || [];

      const dpDoc = sections.find((s) => s.key === 'digitalproducts');
      const ebDoc = sections.find((s) => s.key === 'ebooks');

      setCatalogs({
        digitalproducts:
          dpDoc?.data?.products ? dpDoc.data : DIGITAL_PRODUCTS_DATA,
        ebooks: ebDoc?.data?.products ? ebDoc.data : EBOOKS_DATA,
      });
    } catch {
      // Fallback to local default data
      setCatalogs({
        digitalproducts: DIGITAL_PRODUCTS_DATA,
        ebooks: EBOOKS_DATA,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  // Sync JSON text when switching catalog or when catalogs load
  useEffect(() => {
    const current = catalogs[activeCatalog] || {};
    setJsonData(indent(current));
    setJsonError('');
  }, [activeCatalog, catalogs]);

  // Current active catalog data
  const currentCatalog = catalogs[activeCatalog] || {};
  const products = currentCatalog.products || [];
  const categories = currentCatalog.categories || [];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.badges?.some((b) => b.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  // Save current catalog back to MongoDB
  const saveCatalogToDb = async (catalogKey, updatedData) => {
    setSaving(true);
    try {
      const title =
        catalogKey === 'digitalproducts'
          ? 'Digital Products & UI Kits Catalog'
          : 'E-Books & Digital Guides Catalog';
      const description =
        catalogKey === 'digitalproducts'
          ? 'Catalog items, banner slides, and categories for /digital-products'
          : 'Catalog items, banner slides, and categories for /ebooks-digital';

      await api.put(`/api/admin/content/${catalogKey}`, {
        key: catalogKey,
        title,
        description,
        data: updatedData,
      });

      setCatalogs((prev) => ({
        ...prev,
        [catalogKey]: updatedData,
      }));

      toast.success(
        `Saved ${catalogKey === 'digitalproducts' ? 'Digital Products' : 'E-Books'} catalog successfully!`
      );
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to save catalog');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete product card
  const handleDeleteProduct = async (product) => {
    const confirmed = await confirm({
      title: `Delete "${product.title}"?`,
      message: 'This will remove the product card from the public catalog. This cannot be undone.',
      confirmLabel: 'Delete Product',
    });
    if (!confirmed) return;

    const updatedProducts = products.filter((p) => p.id !== product.id);
    const updatedCatalog = { ...currentCatalog, products: updatedProducts };

    await saveCatalogToDb(activeCatalog, updatedCatalog);
  };

  // Save or Update Product Card from Form
  const handleSaveProductCard = async (formValues) => {
    const isEdit = cardModal?.mode === 'edit';
    const targetKey = formValues.catalogKey || activeCatalog;
    const targetCatalog = catalogs[targetKey] || {};
    let targetProducts = [...(targetCatalog.products || [])];

    // Build the formatted product object
    const newProduct = {
      id: isEdit ? cardModal.product.id : `prod-${Date.now()}`,
      title: formValues.title.trim(),
      category: formValues.category,
      categoryName: formValues.categoryName || formValues.category,
      description: formValues.description.trim(),
      price: Number(formValues.price) || 0,
      originalPrice: formValues.originalPrice ? Number(formValues.originalPrice) : null,
      discount: formValues.discount || (formValues.originalPrice ? `${Math.round(((formValues.originalPrice - formValues.price) / formValues.originalPrice) * 100)}% OFF` : ''),
      rating: formValues.rating || 4.9,
      reviewsCount: formValues.reviewsCount || Math.floor(Math.random() * 50) + 10,
      isBestseller: formValues.badges?.includes('Bestseller') || false,
      image: formValues.images[0] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      images: formValues.images.filter(Boolean).slice(0, 5), // multiple up to 5 image URLs
      badges: formValues.badges || [],
      buyLink: formValues.buyLink?.trim() || '', // buy button redirect link
      buyButtonLabel: formValues.buyButtonLabel?.trim() || 'Buy Now',
      format: formValues.format || '',
      tags: formValues.tags || [],
    };

    if (isEdit) {
      targetProducts = targetProducts.map((p) => (p.id === newProduct.id ? newProduct : p));
    } else {
      targetProducts = [newProduct, ...targetProducts];
    }

    const updatedCatalog = { ...targetCatalog, products: targetProducts };
    const success = await saveCatalogToDb(targetKey, updatedCatalog);
    if (success) {
      setCardModal(null);
    }
  };

  // Save raw JSON
  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        setJsonError('JSON must include a "products" array');
        return;
      }
      setJsonError('');
      await saveCatalogToDb(activeCatalog, parsed);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Catalog Switcher */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EDEDED] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#F0F0F0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF1E8] text-[#FF5E00] border border-[#FF5E00]/20">
                Products Console
              </span>
              <span className="text-xs text-gray-400">• Full CRUD &amp; JSON Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111]">
              Manage Product Catalogs &amp; Cards
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
              Create product cards with up to 5 image URLs, badges, and external redirect buy links for both public pages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live page preview links */}
            <a
              href={activeCatalog === 'digitalproducts' ? PATHS.digitalProducts : PATHS.ebooksDigital}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Page</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'json' : 'cards')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-[#FF5E00]" />
              <span>{viewMode === 'cards' ? 'Edit Raw JSON' : 'View Cards Grid'}</span>
            </button>

            {/* Create Product Card Button */}
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCardModal({ mode: 'create', product: null })}
            >
              Create Product Card
            </Button>
          </div>
        </div>

        {/* Catalog Selector Tabs */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={() => setActiveCatalog('digitalproducts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalog === 'digitalproducts'
                ? 'bg-[#FF5E00] text-white shadow-md shadow-[#FF5E00]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Digital Products &amp; UI Kits</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                activeCatalog === 'digitalproducts' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {catalogs.digitalproducts?.products?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveCatalog('ebooks')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalog === 'ebooks'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>All Types of E-Books</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                activeCatalog === 'ebooks' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {catalogs.ebooks?.products?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL PRODUCT CARDS GRID */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {/* Search & Category Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDEDED] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, badge..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <span className="text-xs text-gray-500 whitespace-nowrap hidden md:inline">
                Showing <strong>{filteredProducts.length}</strong> of {products.length} products
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#EDEDED]">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No products found</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                No products match your search or filter. You can create a new product card below.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setCardModal({ mode: 'create', product: null })}
              >
                Create Product Card
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => {
                const imgList = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image];
                const badges = Array.isArray(p.badges)
                  ? p.badges.filter((b) => b && b.toLowerCase() !== 'bestseller')
                  : [p.discount].filter(Boolean);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#EDEDED] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image & Multiple Image Indicator */}
                      <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                        <img
                          src={imgList[0]}
                          alt={p.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Multiple Images Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>{imgList.length} {imgList.length === 1 ? 'Image' : 'Images'}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-800 backdrop-blur-sm">
                            {p.categoryName || p.category}
                          </span>
                        </div>

                        {/* Badges top right */}
                        <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1">
                          {badges.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FF5E00] text-white shadow-xs"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sm text-[#111111]">
                            ₹{Number(p.price || 0).toLocaleString('en-IN')}{' '}
                            {p.originalPrice && (
                              <span className="text-gray-400 font-normal line-through text-xs ml-1">
                                ₹{Number(p.originalPrice || 0).toLocaleString('en-IN')}
                              </span>
                            )}
                          </span>
                          <span className="text-amber-500 font-semibold text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {p.rating || 4.9}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#111111] line-clamp-1 group-hover:text-[#FF5E00] transition-colors">
                          {p.title}
                        </h3>

                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>

                        {/* Buy Link Preview Row */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-700">Buy Button:</span>
                          {p.buyLink ? (
                            <a
                              href={p.buyLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF5E00] hover:underline flex items-center gap-1 truncate max-w-[180px]"
                              title={p.buyLink}
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{p.buyLink}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Default Checkout Modal</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">ID: {p.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCardModal({ mode: 'edit', product: p })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-xs text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: RAW JSON EDITOR */
        <div className="bg-white rounded-2xl p-5 border border-[#EDEDED] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">
                Editing JSON for: <code className="bg-gray-100 px-2 py-0.5 rounded text-[#FF5E00]">{activeCatalog}</code>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  !jsonError
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                {!jsonError ? 'Valid JSON' : 'Syntax Error'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    setJsonData(indent(JSON.parse(jsonData)));
                    setJsonError('');
                  } catch (e) {
                    setJsonError(e.message);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-black border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Format
              </button>
              <button
                type="button"
                onClick={fetchCatalogs}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-black border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          <textarea
            rows={22}
            value={jsonData}
            onChange={(e) => {
              setJsonData(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError('');
              } catch (err) {
                setJsonError(err.message);
              }
            }}
            spellCheck={false}
            className={`w-full p-4 font-mono text-xs leading-relaxed rounded-xl border bg-gray-50 text-[#111111] resize-y focus:outline-none focus:bg-white ${
              !jsonError ? 'border-gray-300 focus:border-[#FF5E00]' : 'border-red-400'
            }`}
          />

          {jsonError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={Check}
              loading={saving}
              disabled={!!jsonError}
              onClick={handleSaveJson}
            >
              Save JSON to Database
            </Button>
          </div>
        </div>
      )}

      {/* CREATE & EDIT PRODUCT CARD MODAL */}
      <AnimatePresence>
        {cardModal && (
          <ProductCardModal
            mode={cardModal.mode}
            product={cardModal.product}
            activeCatalog={activeCatalog}
            categories={categories}
            onClose={() => setCardModal(null)}
            onSave={handleSaveProductCard}
          />
        )}
      </AnimatePresence>

      {confirmElement}
    </div>
  );
}

/**
 * Dedicated Card Creation & Edit Modal
 * Form fields:
 * - images: multiple up to 5 image URLs
 * - title
 * - description
 * - badges
 * - buyLink: link to redirect when buy button is clicked
 */
function ProductCardModal({ mode, product, activeCatalog, categories, onClose, onSave }) {
  const isEdit = mode === 'edit';

  const [catalogKey, setCatalogKey] = useState(activeCatalog);
  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || (categories[1]?.id || 'ui-kits'));
  const [price, setPrice] = useState(product?.price || 29);
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || 59);

  // Multiple Image URLs (Up to 5)
  const initialImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : product?.image
    ? [product.image]
    : [''];
  const [images, setImages] = useState(initialImages);

  // Badges (Bestseller removed per request)
  const initialBadges = Array.isArray(product?.badges)
    ? product.badges.filter((b) => b && b.toLowerCase() !== 'bestseller')
    : [product?.discount].filter(Boolean);
  const [badges, setBadges] = useState(initialBadges);
  const [customBadgeInput, setCustomBadgeInput] = useState('');

  // Buy Button Redirect Link (defaults to Instagram link if creating or not set)
  const [buyLink, setBuyLink] = useState(product?.buyLink || 'https://www.instagram.com/p/DeS-JkIzRyi/');
  const [buyButtonLabel, setBuyButtonLabel] = useState(product?.buyButtonLabel || 'Buy Now');

  const [formError, setFormError] = useState('');

  // Add another image URL (max 5)
  const handleAddImageUrl = () => {
    if (images.length >= 5) return;
    setImages([...images, '']);
  };

  const handleUpdateImageUrl = (index, value) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const handleRemoveImageUrl = (index) => {
    if (images.length <= 1) {
      setImages(['']);
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  // Badges handling
  const handleToggleBadge = (badgeName) => {
    if (badges.includes(badgeName)) {
      setBadges(badges.filter((b) => b !== badgeName));
    } else {
      setBadges([...badges, badgeName]);
    }
  };

  const handleAddCustomBadge = () => {
    const b = customBadgeInput.trim();
    if (!b || badges.includes(b)) return;
    setBadges([...badges, b]);
    setCustomBadgeInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Product title is required.');
      return;
    }
    const cleanImages = images.map((img) => img.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      setFormError('At least 1 image URL is required.');
      return;
    }

    setFormError('');
    onSave({
      catalogKey,
      title,
      description,
      category,
      categoryName: categories.find((c) => c.id === category)?.name || category,
      price,
      originalPrice,
      images: cleanImages.slice(0, 5),
      badges,
      buyLink,
      buyButtonLabel,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EDEDED] z-10 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEDED] bg-gray-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              {isEdit ? 'Edit Product Card' : 'Create New Product Card'}
            </h2>
            <p className="text-xs text-gray-500">
              Configure up to 5 image URLs, title, description, badges, and buy redirect link.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Collection & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Target Catalog <span className="text-red-500">*</span>
              </label>
              <select
                value={catalogKey}
                onChange={(e) => setCatalogKey(e.target.value)}
                disabled={isEdit}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
              >
                <option value="digitalproducts">Digital Products &amp; UI Kits</option>
                <option value="ebooks">All Types of E-Books</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SuperUI Complete Design System"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF5E00]/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this template or e-book..."
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF5E00]/20"
            />
          </div>

          {/* MULTIPLE IMAGE URLS (UP TO 5) */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-900">
                  Product Images (Multiple, Up to 5 URLs) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  Add between 1 and 5 image URLs. The first image is the primary cover image.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                {images.length}/5
              </span>
            </div>

            <div className="space-y-2.5">
              {images.map((imgUrl, index) => (
                <div key={index} className="flex items-center gap-2">
                  {/* Thumbnail Preview */}
                  <div className="w-9 h-9 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {imgUrl.trim() ? (
                      <img
                        src={imgUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => handleUpdateImageUrl(index, e.target.value)}
                      placeholder={index === 0 ? 'Primary Image URL (e.g. /E_Books.png or https://...)' : `Additional Image URL #${index + 1}`}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/20 pr-16"
                    />
                    {index === 0 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#FF5E00] bg-[#FFF1E8] px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove image URL"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {images.length < 5 && (
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5E00] hover:text-[#e05300] pt-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Image URL (Max 5)
              </button>
            )}
          </div>

          {/* BADGES */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Badges
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {PRESET_BADGES.map((b) => {
                const isSelected = badges.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleToggleBadge(b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF5E00] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>

            {/* Custom Badge Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customBadgeInput}
                onChange={(e) => setCustomBadgeInput(e.target.value)}
                placeholder="Or type custom badge (e.g. 30% OFF)"
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddCustomBadge}
                className="px-3 py-1.5 rounded-xl bg-gray-800 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Active Badges List */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-gray-400 self-center">Active:</span>
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFF1E8] text-[#FF5E00] border border-[#FF5E00]/20"
                  >
                    {badge}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => handleToggleBadge(badge)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing in Indian Rupees (₹ INR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Price (₹ Indian Rupee) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1274"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Original Price (₹ Indian Rupee) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 2549"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* BUY BUTTON REDIRECT LINK (Critical Requirement) */}
          <div className="bg-[#FFF8F5] rounded-2xl p-4 border border-[#FF5E00]/25 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FF5E00]" />
              <label className="block text-xs font-black text-gray-900">
                Buy Button Redirect Link Website
              </label>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When visitors click the <strong>Buy Now</strong> button on this card, they will directly redirect to this URL.
            </p>
            <input
              type="url"
              value={buyLink}
              onChange={(e) => setBuyLink(e.target.value)}
              placeholder="e.g. https://gumroad.com/l/myproduct or https://mywebsite.com/checkout"
              className="w-full px-3 py-2 text-xs bg-white border border-[#FF5E00]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/30"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" icon={Check}>
              {isEdit ? 'Save Changes' : 'Create Product Card'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

