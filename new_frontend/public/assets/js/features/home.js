import { fetchList } from "../core/api.js";
import { t, route } from "../core/config.js";
import { escapeHtml as e, loading, renderError, empty } from "../core/ui.js";
import { productCard, validProducts } from "../components/products.js";
import { bundlesSection } from "../components/bundles.js";

export async function init() {
  const container = jQuery("[data-home-content]").html(loading());
  try {
    const [products, bestSellers, bundles] = await Promise.all([
      fetchList("products"),
      fetchList("products/best-selling"),
      fetchList("bundles"),
    ]);
    const valid = validProducts(products.data);
    container.html(
      `${bundlesSection(bundles.data)}${section(t("home.bestSelling"), validProducts(bestSellers.data))}${section(t("home.featured"), valid.slice(0, 3), valid.length)}`,
    );
    container.find("[data-slide]").on("click", function () {
      const track = container.find("[data-bundle-track]")[0];
      const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
      track.scrollBy({
        left: Number(jQuery(this).attr("data-slide")) * track.clientWidth * rtl,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  } catch (error) {
    renderError(container, error, init);
  }
}

function section(title, products, total) {
  return `<section class="home-section"><div class="section-header"><h2 class="section-header__title">${e(title)}</h2>${total !== undefined ? `<a href="${e(route("products"))}" class="section-header__link">${e(t("home.seeAll"))} (${total})</a>` : ""}</div>${products.length ? `<div class="grid grid--no-padding">${products.map(productCard).join("")}</div>` : empty(t("ui.no_results"), t("ui.no_results_hint"))}</section>`;
}
