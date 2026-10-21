import { config, money, route, t } from "../core/config.js";
import { escapeHtml as e, image } from "../core/ui.js";
import { addProduct } from "../core/cart.js";
import { toast } from "../core/ui.js";
import { productPrice } from "../core/pricing.js";

export { productPrice } from "../core/pricing.js";

const productsById = new Map();

export function validProducts(products) {
  return products.filter(
    (product) =>
      product && typeof product.slug === "string" && product.slug.trim(),
  );
}

export function registerProduct(product) {
  productsById.set(String(product.id), product);
}

export function productCard(product) {
  registerProduct(product);
  const heading = config.page === "catalog" ? "h2" : "h3";
  const inStock = Number(product.stock) > 0;
  const price = productPrice(product);
  const href = route(`products/${encodeURIComponent(product.slug)}`);
  return `<article class="card">
    <a href="${e(href)}" class="card__media-link" tabindex="-1"><div class="card__image-container">${image(product.image, product.name, "card__image-img")}</div></a>
    <div class="card__content"><div class="card__header"><span class="card__category">${e(product.category?.name)}</span><a href="${e(href)}" class="card__title-link"><${heading} class="card__title">${e(product.name)}</${heading}></a></div>
      <div class="card__footer"><div class="card__price-group"><span class="card__price ${price < Number(product.price) ? "card__price--discount" : ""}">${e(money(price))}</span>${price < Number(product.price) ? `<span class="card__price card__price--original">${e(money(product.price))}</span>` : ""}</div>
        <div class="card__actions"><div class="card__status"><span class="status-dot status-dot--${inStock ? "in-stock" : "out-of-stock"}"></span><span class="card__status-text">${e(t(inStock ? "product.inStock" : "product.outOfStock"))}</span></div><button type="button" class="card__add-btn" data-add-product="${e(product.id)}" ${inStock ? "" : "disabled"} aria-label="${e(t("product.addToCartAria", { name: product.name }))}">${e(t("product.addToCart"))}</button></div>
      </div>
    </div></article>`;
}

export function bindProductButtons() {
  jQuery(document).on("click", "[data-add-product]", function () {
    const product = productsById.get(
      String(jQuery(this).attr("data-add-product")),
    );
    if (!product) return;
    try {
      addProduct(product);
      toast(t("ui.added"));
    } catch (error) {
      toast(
        t(
          error.message === "out_of_stock"
            ? "product.outOfStock"
            : "ui.cart_unavailable",
        ),
        true,
      );
    }
  });
}
