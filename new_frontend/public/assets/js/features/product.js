import { request } from "../core/api.js";
import { config, money, t } from "../core/config.js";
import {
  descriptionHtml,
  escapeHtml as e,
  image,
  loading,
  renderError,
} from "../core/ui.js";
import { productPrice, registerProduct } from "../components/products.js";

export async function init() {
  const container = jQuery("[data-product-content]").html(loading());
  try {
    const { data: product } = await request(
      `products/${encodeURIComponent(config.slug)}`,
    );
    if (!product || typeof product.name !== "string")
      throw new Error(t("ui.invalid_response"));
    registerProduct(product);
    document.title = `${product.name} | Beity`;
    const price = productPrice(product);
    const inStock = Number(product.stock) > 0;
    container.html(`<div class="product-detail__grid"><div class="product-detail__image-wrapper">${image(product.image, product.name, "product-detail__image")}</div>
      <div class="product-detail__info"><div class="product-detail__header"><span class="card__category">${e(product.category?.name)}</span><h1 class="product-detail__title">${e(product.name)}</h1></div>
      <div class="product-detail__price-group"><span class="product-detail__price">${e(money(price))}</span>${price < Number(product.price) ? `<span class="product-detail__price product-detail__price--original">${e(money(product.price))}</span>` : ""}</div>
      <div class="card__status"><span class="status-dot status-dot--${inStock ? "in-stock" : "out-of-stock"}"></span><span>${e(t(inStock ? "product.inStock" : "product.outOfStock"))}</span></div>
      <div class="product-detail__spec-plate"><span class="product-detail__spec-label">${e(t("ui.stock"))}</span><span class="product-detail__spec-value">${e(product.stock)}</span></div>
      <div class="product-detail__description-box"><h2 class="product-detail__description-heading">${e(t("product.description"))}</h2><div class="product-detail__description">${descriptionHtml(product.description)}</div></div>
      <div class="product-detail__actions"><button type="button" class="card__add-btn" data-add-product="${e(product.id)}" ${inStock ? "" : "disabled"}>${e(t("product.addToCart"))}</button></div></div></div>`);
    container
      .find("img")
      .first()
      .attr("loading", "eager")
      .attr("fetchpriority", "high");
  } catch (error) {
    renderError(container, error, init);
  }
}
