import { request } from "../core/api.js";
import { config, money, t } from "../core/config.js";
import {
  descriptionHtml,
  escapeHtml as e,
  image,
  loading,
  renderError,
  toast,
} from "../core/ui.js";
import { addBundle, includedQuantity } from "../core/cart.js";

function includedProduct(product) {
  let quantity = "—";
  try {
    quantity = String(includedQuantity(product));
  } catch {
    quantity = "—";
  }
  return `<article class="bundle-detail__productCard">${image(product.image, product.name, "bundle-detail__includedImage")}<div class="bundle-detail__productHeader"><h3 class="bundle-detail__productName">${e(product.name)}</h3></div><p class="bundle-detail__productQty">${e(t("cart.table_quantity"))}: ${e(quantity)}</p></article>`;
}

export async function init() {
  const container = jQuery("[data-bundle-content]").html(loading());
  try {
    const { data: bundle } = await request(
      `bundles/${encodeURIComponent(config.slug)}`,
    );
    if (!bundle || !Array.isArray(bundle.products))
      throw new Error(t("ui.invalid_response"));
    document.title = `${bundle.title} | Beity`;
    container.html(`<div class="bundle-detail__heroGrid"><div class="bundle-detail__imageWrapper">${image(bundle.image, bundle.title, "bundle-detail__image")}</div><div class="bundle-detail__contentWrapper"><div><span class="bundle-detail__badge">${e(t("bundles.badge"))}</span><h1 class="bundle-detail__title">${e(bundle.title)}</h1><div class="bundle-detail__description">${descriptionHtml(bundle.description)}</div><div class="bundle-detail__pricingBox"><div><span class="bundle-detail__currentPrice">${e(money(bundle.bundle_price))}</span><span class="bundle-detail__originalPrice">${e(money(bundle.original_price))}</span></div><div class="bundle-detail__savingsContainer"><span class="bundle-detail__savingsLabel">${e(t("bundles.youSave"))}</span><span class="bundle-detail__savingsValue">${e(money(bundle.savings))}</span></div></div></div><button type="button" class="bundle-detail__ctaButton" data-add-bundle>${e(t("ui.bundle_add"))}</button></div></div>
      <section class="bundle-detail__productsSection"><h2 class="bundle-detail__sectionTitle">${e(t("bundles.whatIsIncluded"))}</h2><div class="bundle-detail__productsGrid">${bundle.products.map(includedProduct).join("")}</div></section>`);
    container.find("[data-add-bundle]").on("click", () => {
      try {
        addBundle(bundle);
        toast(t("ui.added"));
      } catch (error) {
        toast(
          t(
            error.message === "out_of_stock"
              ? "product.outOfStock"
              : error.message === "bundle_unavailable"
                ? "ui.bundle_unavailable"
                : error.message === "bundle_reselect"
                  ? "ui.package_reselect"
                  : "ui.cart_unavailable",
          ),
          true,
        );
      }
    });
  } catch (error) {
    renderError(container, error, init);
  }
}
