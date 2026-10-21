"use client";

import { formatPrice } from '@/lib/helper_functions';
import styles from './bundle-detail.module.css';
import Image from 'next/image';
import ImagePlaceholder from '@/components/image-placeholder';
import { useCart } from '@/context/cart-context';
import { Bundle, Product } from '@/lib/types';

interface ContentProps {
    bundle: Bundle;
    lang: "ar"|"en";
}

export default function BundleDetailsContent({bundle, lang}: ContentProps)
{
    const { addPackage } = useCart();

    const handleAddBundleToCart = () => {
        addPackage(bundle);
    };

    return (
        <main className={styles.mainContainer} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className={styles.heroGrid}>
                <div className={styles.imageWrapper}>
                    {bundle.image ? (
                        <Image src={bundle.image} alt={bundle.title} fill className={styles.image} />
                    ) : (
                        <ImagePlaceholder title={bundle.title} />
                    )}
                </div>

                {/* Bundle Details Info */}
                <div className={styles.contentWrapper}>
                    <div>
                        <span className={styles.badge}>
                            Special Bundle Offer
                        </span>
                        <h1 className={styles.title}>{bundle.title}</h1>

                        <div
                            className={styles.description}
                            dangerouslySetInnerHTML={{ __html: bundle.description }}
                        />

                        {/* Pricing Box */}
                        <div className={styles.pricingBox}>
                            <div>
                                <span className={styles.currentPrice}>{formatPrice(bundle.bundle_price, lang)}</span>
                                <span className={styles.originalPrice}>{formatPrice(bundle.original_price, lang)}</span>
                            </div>
                            <div className={styles.savingsContainer}>
                                <span className={styles.savingsLabel}>Total Savings</span>
                                <span className={styles.savingsValue}>{formatPrice(bundle.savings, lang)}</span>
                            </div>
                        </div>
                    </div>

                    <button className={styles.ctaButton} onClick={handleAddBundleToCart}>
                        Add Bundle to Cart
                    </button>
                </div>
            </div>

            {/* Included Products Section */}
            <section className={styles.productsSection}>
                <h2 className={styles.sectionTitle}>Products Included in This Bundle</h2>
                <div className={styles.productsGrid}>
                    {bundle.products.map((product) => (
                        <div key={product.id} className={styles.productCard}>
                            <div>
                                <div className={styles.productHeader}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <span className={product.inStock ? styles.stockBadgeIn : styles.stockBadgeOut}>
                                        {product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                                <p className={styles.productDesc}>{product.description}</p>
                            </div>

                            <div className={styles.productFooter}>
                                <div>
                                    <span className={styles.productPrice}>
                                        {formatPrice(product.price_after_discount ?? product.price, lang)}
                                    </span>
                                    {product.price_after_discount && (
                                        <span className={styles.productOldPrice}>{formatPrice(product.price, lang)}</span>
                                    )}
                                </div>
                                <span className={styles.productQty}>
                                    {lang === "ar" ? "الكمية" : "Quantity"}: {Number(product.pivot?.quantity) || "—"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}