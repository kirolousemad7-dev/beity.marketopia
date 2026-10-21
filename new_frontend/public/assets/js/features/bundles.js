import { fetchList } from "../core/api.js";
import { t } from "../core/config.js";
import { empty, loading, renderError } from "../core/ui.js";
import { bundleCard } from "../components/bundles.js";

export async function init() {
  const container = jQuery("[data-bundles-content]").html(loading());
  try {
    const { data } = await fetchList("bundles");
    const bundles = data.filter(
      (bundle) =>
        bundle && typeof bundle.slug === "string" && bundle.slug.trim(),
    );
    container.html(
      bundles.length
        ? `<div class="grid grid--no-padding">${bundles.map(bundleCard).join("")}</div>`
        : empty(t("ui.empty_bundles")),
    );
  } catch (error) {
    renderError(container, error, init);
  }
}
