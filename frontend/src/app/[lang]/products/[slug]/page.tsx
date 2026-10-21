import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { isLocale, Locale } from "@/i18n/config";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { arrow, formatPrice } from "@/lib/helper_functions";

interface ProductPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamicParams = false;

export async function generateStaticParams({
  params: { lang },
}: {
  params: { lang: string };
}) {
  if (!isLocale(lang)) return [];

  const products = await fetchProducts(lang, undefined, { requireStaticParams: true });
  return [...new Set(products.map((product) => product.slug))].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, lang } = await params;
  try {
    const product = await fetchProductBySlug(slug, lang);
    if (!product) return { title: "Product Not Found | BEITY" };
    return {
      title: `${product.name} | BEITY - كل حاجة لبيتي`,
      description: product.description || `Buy ${product.name} at BEITY home store.`,
    };
  } catch (error) {
    return { title: "BEITY - كل حاجة لبيتي" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict: Dictionary = getDictionary(locale);

  let product = null;
  try {
    product = await fetchProductBySlug(slug, lang);
  } catch (error) {
    console.error(`Error loading product [${slug}] from @/lib/api:`, error);
  }
  if (!product) notFound();

  const inStock = Boolean(product.inStock);
  const hasDiscount =
    product.price_after_discount != null &&
    Number(product.price_after_discount) < Number(product.price);

  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.price_after_discount)) / Number(product.price)) * 100)
    : 0;

  return (
    <main className="home-container product-detail-page">
      <Link href={`/${lang}/products`} className="product-detail__back">
        {dict.product.back_to_catalog} {arrow(lang)}
      </Link>

      <div className="product-detail__grid">
        <div className="product-detail__image-wrapper">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="product-detail__image"
            />
          ) : (
            <div className="product-detail__image-placeholder">
              <span className="card__placeholder-text">{product.name}</span>
            </div>
          )}
          {hasDiscount && <span className="product-detail__badge">-{discountPercent}%</span>}
        </div>

        <div className="product-detail__info">
          <div className="product-detail__header">
            <span className="card__category">
              {typeof product.category === "object"
                ? product.category?.name
                : product.category || "Home Essentials"}
            </span>
            <h1 className="product-detail__title">{product.name}</h1>
          </div>

          {/* Price with discount */}
          <div className="product-detail__price-group">
            {hasDiscount ? (
              <>
                <span className="product-detail__price product-detail__price--discount">
                  {formatPrice(product.price_after_discount!, lang)}
                </span>
                <span className="product-detail__price product-detail__price--original">
                  {formatPrice(product.price, lang)}
                </span>
                <span className="product-detail__discount-badge">Save {discountPercent}%</span>
              </>
            ) : (
              <span className="product-detail__price">
                {formatPrice(product.price, lang)}
              </span>
            )}
          </div>

          <div className="card__status">
            <span className={`status-dot ${inStock ? "status-dot--in-stock" : "status-dot--out-of-stock"}`} />
            <span className="card__status-text">
              {inStock ? `${dict.product.inStock} . ${dict.product.ready_for_delivery}` : dict.product.outOfStock}
            </span>
          </div>

          {product.stock && (
            <div className="product-detail__spec-plate">
              <span className="product-detail__spec-label">Stocks:</span>
              <span className="product-detail__spec-value">{product.stock}</span>
            </div>
          )}

          {product.description && (
            <div className="product-detail__description-box">
              <h3 className="product-detail__description-heading">{dict.product.description}</h3>
              <p className="product-detail__description">{product.description}</p>
            </div>
          )}

          <div className="product-detail__actions">
            <AddToCartButton product={product} dict={dict} />
          </div>
        </div>
      </div>
    </main>
  );
}
