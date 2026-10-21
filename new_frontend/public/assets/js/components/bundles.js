import { config, money, route, t } from "../core/config.js";
import { escapeHtml as e, image } from "../core/ui.js";

export function bundleCard(bundle) {
  const heading = config.page === "bundles" ? "h2" : "h3";
  const href = route(`bundles/${encodeURIComponent(bundle.slug)}`);
  const products = Array.isArray(bundle.products) ? bundle.products : [];
  return `<article class="bundle-card__card"><div class="bundle-card__imageWrapper">${image(bundle.image, bundle.title, "bundle-card__image")}
    <div class="bundle-card__saveBadge">${e(t("bundles.saveAmount", { amount: money(bundle.savings) }))}</div><div class="bundle-card__itemsBadge">${products.length} ${e(t("product.items"))}</div></div>
    <div class="bundle-card__content"><a href="${e(href)}" class="card__title-link"><${heading} class="bundle-card__cardTitle">${e(bundle.title)}</${heading}></a><p class="bundle-card__description">${e(t("bundles.description", { count: products.length }))}</p>
      <div class="bundle-card__tags">${products.map((product) => `<span class="bundle-card__tag">${e(product.name)}</span>`).join("")}</div><div class="bundle-card__footer"><div class="bundle-card__priceBlock"><span class="bundle-card__price">${e(money(bundle.bundle_price))}</span><span class="bundle-card__originalPrice">${e(t("bundles.originalValue", { amount: money(bundle.original_price) }))}</span></div><a href="${e(href)}" class="bundle-card__button">${e(t("bundles.exploreBundleButton"))}</a></div>
    </div></article>`;
}

export function bundlesSection(bundles) {
  const valid = bundles.filter(
    (bundle) => bundle && typeof bundle.slug === "string" && bundle.slug.trim(),
  );
  if (!valid.length) return "";
  return `<section class="bundle-section__section"><div class="bundle-section__container"><div class="bundle-section__header"><div class="bundle-section__headingBlock"><span class="bundle-section__badge">${e(t("bundles.badge"))}</span><h2 class="bundle-section__title">${e(t("bundles.title"))}<span class="bundle-section__titleAccent">${e(t("bundles.titleAccent"))}</span></h2><p class="bundle-section__subtitle">${e(t("bundles.subtitle"))}</p></div><a class="bundle-section__viewAllLink" href="${e(route("bundles"))}">${e(t("bundles.viewAllLink"))}</a></div>
    <div class="bundle-slider__sliderWrapper"><div class="bundle-slider__track" data-bundle-track tabindex="0" aria-label="${e(t("bundles.allBundles"))}">${valid.map((bundle) => `<div class="bundle-slider__slide">${bundleCard(bundle)}</div>`).join("")}</div><div class="slider-controls"><button type="button" class="empty-state__btn" data-slide="-1" aria-label="${e(t("ui.previous"))}">‹</button><button type="button" class="empty-state__btn" data-slide="1" aria-label="${e(t("ui.next"))}">›</button></div></div>
  </div></section>`;
}
