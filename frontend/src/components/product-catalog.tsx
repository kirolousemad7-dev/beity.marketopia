"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { isLocale, Locale } from "@/i18n/config";
import { fetchCategories, fetchProducts } from "@/lib/api";
import PageLoading from "./page-loading";

interface ProductCatalogProps {
  categories?: Category[];
  products?: Product[];
  dict: Dictionary;
  lang: 'ar' | 'en';
}

function ProductCatalogContent({
  categories = [],
  products = [],
  dict,
  lang
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = useMemo(() => {
    return safeProducts
      .filter((product) => {
        // Matches nested product.category.slug
        const matchesCategory =
          selectedCategory === "all" ||
          product.category?.slug === selectedCategory;

        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;

        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
        return 0;
      });
  }, [safeProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="catalog">
      <div className="catalog-filter">
        <div className="catalog-pills" role="tablist">
          <button
            type="button"
            className={`catalog-pill ${selectedCategory === "all" ? "catalog-pill--active" : ""}`}
            onClick={() => setSelectedCategory("all")}>
            {dict.product.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`catalog-pill ${selectedCategory === cat.slug ? "catalog-pill--active" : ""}`}
              onClick={() => setSelectedCategory(cat.slug)}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="catalog-controls">
          <input
            type="search"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="catalog-input"
          />

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as "featured" | "price-asc" | "price-desc" | "name"
              )
            }
            className="catalog-select"
          >
            <option value="">---</option>
            <option value="price-asc">السعر: من الأقل للأعلى</option>
            <option value="price-desc">السعر: من الأعلى للأقل</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid--no-padding">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} dict={dict} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="empty-state__title">لا توجد نتائج متطابقة</h2>
          <p className="empty-state__hint">
            جرب تغيير كلمات البحث أو اختر فئة أخرى.
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductCatalog({ lang }: { lang: Locale }) {
  if (!isLocale(lang)) {
    notFound();
  }

  const dict: Dictionary = getDictionary(lang);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(lang),
          fetchProducts(lang),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading catalog:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [lang]);

  if (loading) return <PageLoading />;
  if (error) return <p>Error loading catalog.</p>;

  return (
    <>
      <div className="section-header">
        <div>
          <span className="hero__eyebrow">{dict.product.catalog}</span>
          <h1 className="section-header__title">{dict.product.all_products}</h1>
        </div>
        <span className="section-header__meta">{dict.product.items} {products.length}</span>
      </div>
      <ProductCatalogContent categories={categories} products={products} lang={lang} dict={dict} />
    </>
  );
}