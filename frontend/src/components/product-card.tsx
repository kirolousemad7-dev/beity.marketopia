"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/helper_functions";
import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import ImagePlaceholder from "./image-placeholder";

export function ProductCard({
  product,
  lang,
  dict,
}: {
  product: Product;
  lang: Locale;
  dict: Dictionary;
}) {
  const { addItem } = useCart();
  const inStock = product.inStock ?? product.stock > 0;
  const href = `/${lang}/products/${product.slug}`;
  const hasDiscount = 
    product.price_after_discount != null && 
    Number(product.price_after_discount) < Number(product.price);

  return (
    <article className="card">
      <Link href={href} className="card__media-link" tabIndex={-1}>
        <div className="card__image-container">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="card__image-img"
            />
          ) : <ImagePlaceholder title={product.name} />}
        </div>
      </Link>

      <div className="card__content">
        <div className="card__header">
          {product.category?.name && (
            <span className="card__category">{product.category.name}</span>
          )}
          <Link href={href} className="card__title-link">
            <h3 className="card__title">{product.name}</h3>
          </Link>
        </div>

        <div className="card__footer">
          <div className="card__price-group">
            {hasDiscount ? (
              <>
                <span className="card__price card__price--discount">
                  {formatPrice(product.price_after_discount!, lang)}
                </span>
                <span className="card__price card__price--original">
                  {formatPrice(product.price, lang)}
                </span>
              </>
            ) : (
              <span className="card__price">{formatPrice(product.price, lang)}</span>
            )}
          </div>

          <div className="card__actions">
            <div className="card__status">
              <span
                className={`status-dot ${
                  inStock ? "status-dot--in-stock" : "status-dot--out-of-stock"
                }`}
              />
              <span className="card__status-text">
                {inStock ? dict.product.inStock : dict.product.outOfStock}
              </span>
            </div>

            <button
              type="button"
              onClick={() => addItem(product)}
              disabled={!inStock}
              className="card__add-btn"
              aria-label={dict.product.addToCartAria.replace("{name}", product.name)}
            >
              {dict.product.addToCart}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}