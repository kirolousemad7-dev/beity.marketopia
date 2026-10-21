"use client";

import Link from "next/link";
import { fetchBestSeller, fetchBundles, fetchProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import BundlesSection from "@/components/bundles/bundles-section";
import { type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/getDictionary";
import { useEffect, useState } from "react";
import { Bundle, Product } from "@/lib/types";
import PageLoading from "./page-loading";

export default function HomeContent({ locale }: { locale: Locale }) {
    const dict: Dictionary = getDictionary(locale);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [featured, setFeatured] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [bundles, setBundles] = useState<Bundle[]>([]);

    useEffect(() => {
        async function loadFreshData() {
            try {
                setLoading(true);
                const [productsData, bundlesData, bestSellersData] = await Promise.all([
                    fetchBestSeller(locale),
                    fetchBundles(locale),
                    fetchProducts(locale),
                ]);

                setBestSellers(bestSellersData);
                setBundles(bundlesData);
                setProducts(productsData);
                setFeatured(productsData.slice(0, 3));
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        if (locale) {
            loadFreshData();
        }
    }, [locale]);

    if (loading) return <PageLoading />;
    if (error) return <p>Error loading configuration.</p>;

    return (
        <main className="home-container">
            <section className="hero">
                <div className="hero__content">
                    <p className="hero__eyebrow">{dict.home.eyebrow}</p>
                    <h1 className="hero__title">{dict.home.title}</h1>
                    <p className="hero__description">{dict.home.description}</p>
                    <div className="hero__actions">
                        <Link href={`/${locale}/products`} className="hero__btn">
                            {dict.home.browseCatalog}
                        </Link>
                    </div>
                </div>
            </section>

            <BundlesSection bundles={bundles} lang={locale} dict={dict} />

            <section className="home-section">
                <div className="section-header">
                    <h2 className="section-header__title">{dict.home.bestSelling}</h2>
                </div>
                <div className="grid grid--no-padding">
                    {bestSellers.map((product) => (
                        <ProductCard key={product.id} product={product} lang={locale} dict={dict} />
                    ))}
                </div>
            </section>

            <section className="home-section">
                <div className="section-header">
                    <h2 className="section-header__title">{dict.home.featured}</h2>
                    <Link href={`/${locale}/products`} className="section-header__link">
                        {dict.home.seeAll} ({products.length})
                    </Link>
                </div>
                <div className="grid grid--no-padding">
                    {featured.map((product) => (
                        <ProductCard key={product.id} product={product} lang={locale} dict={dict} />
                    ))}
                </div>
            </section>
        </main>
    )
};