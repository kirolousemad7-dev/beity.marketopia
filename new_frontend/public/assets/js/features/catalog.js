import { fetchList } from "../core/api.js";
import { config, t } from "../core/config.js";
import { empty, escapeHtml as e, loading, renderError } from "../core/ui.js";
import {
  productCard,
  productPrice,
  validProducts,
} from "../components/products.js";

let products = [];
let category = new URLSearchParams(location.search).get("category") || "all";

function render() {
  const query = jQuery("[data-catalog-search]").val().toLowerCase();
  const sort = jQuery("[data-catalog-sort]").val();
  const filtered = products.filter(
    (product) =>
      (category === "all" || product.category?.slug === category) &&
      `${product.name} ${product.description ?? ""}`
        .toLowerCase()
        .includes(query),
  );
  filtered.sort((a, b) =>
    sort === "price-asc"
      ? productPrice(a) - productPrice(b)
      : sort === "price-desc"
        ? productPrice(b) - productPrice(a)
        : sort === "name"
          ? a.name.localeCompare(b.name, config.locale)
          : 0,
  );
  jQuery("[data-product-count]")
    .text(`${t("product.items")} ${filtered.length}`)
    .attr("aria-live", "polite");
  jQuery("[data-catalog-content]").html(
    filtered.length
      ? `<div class="grid grid--no-padding">${filtered.map(productCard).join("")}</div>`
      : empty(t("ui.no_results"), t("ui.no_results_hint")),
  );
  jQuery("[data-category]").each(function () {
    const active = jQuery(this).attr("data-category") === category;
    jQuery(this)
      .toggleClass("catalog-pill--active", active)
      .attr("aria-pressed", String(active));
  });
}

export async function init() {
  const container = jQuery("[data-catalog-content]").html(loading());
  try {
    const [productResult, categories] = await Promise.all([
      fetchList("products"),
      fetchList("categories"),
    ]);
    products = validProducts(productResult.data);
    const filters = [
      { slug: "all", name: t("product.all") },
      ...categories.data,
    ];
    if (!filters.some((filter) => filter.slug === category)) category = "all";
    jQuery("[data-category-filters]").html(
      filters
        .map(
          (filter) =>
            `<button type="button" class="catalog-pill" data-category="${e(filter.slug)}">${e(filter.name)}</button>`,
        )
        .join(""),
    );
    jQuery("[data-category]").on("click", function () {
      category = jQuery(this).attr("data-category");
      const url = new URL(location.href);
      if (category === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", category);
      history.replaceState(null, "", url);
      render();
    });
    jQuery("[data-catalog-search]").off("input").on("input", render);
    jQuery("[data-catalog-sort]").off("change").on("change", render);
    render();
  } catch (error) {
    renderError(container, error, init);
  }
}
