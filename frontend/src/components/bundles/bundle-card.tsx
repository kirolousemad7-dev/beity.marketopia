import Image from 'next/image';
import Link from 'next/link';
import { Bundle } from '@/lib/types';
import { Dictionary } from '@/i18n/getDictionary';
import { formatPrice } from '@/lib/helper_functions';
import { Locale } from '@/i18n/config';
import styles from './bundle_card.module.css';
import ImagePlaceholder from '../image-placeholder';

interface BundleProps {
    bundle: Bundle;
    lang: Locale;
    dict: Dictionary;
}

export default function BundleCard({ bundle, lang, dict }: BundleProps) {
    const href = `/${lang}/bundles/${bundle.slug}`;

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                {bundle.image ? (
                    <Image
                        src={bundle.image}
                        alt={bundle.title || 'Bundle image'}
                        fill
                        className={styles.image}
                    />
                ) : (
                    <ImagePlaceholder title={bundle.title} />
                )}
                
                <div className={styles.saveBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M16.5 9.5l-5 5-2.5-2.5"/>
                    </svg>
                    <span>{dict.bundles.saveAmount.replace('{amount}', formatPrice(bundle.savings, lang))}</span>
                </div>

                <div className={styles.itemsBadge}>
                    <span className={styles.itemsCount}>{bundle.products.length}</span>
                    <span>{dict.product.items}</span>
                </div>
            </div>

            <div className={styles.content}>
                <Link href={href} className="card__title-link">
                    <h3 className={styles.cardTitle}>{bundle.title}</h3>
                </Link>

                <p className={styles.description}>
                    {dict.bundles.description.replace('{count}', bundle.products.length.toString())}
                </p>

                <div className={styles.tags}>
                    {bundle.products.map((product) => (
                        <span key={product.id} className={styles.tag}>
                            {product.name}
                        </span>
                    ))}
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceBlock}>
                        <div className={styles.price}>
                            {formatPrice(bundle.bundle_price, lang)}
                        </div>
                        <div className={styles.originalPrice}>
                            {dict.bundles.originalValue.replace('{amount}', formatPrice(bundle.original_price, lang))}
                        </div>
                    </div>
                    <Link href={href} className={styles.button}>
                        {dict.bundles.exploreBundleButton}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}