import { config, route, t } from "./core/config.js";
import { settings } from "./core/api.js";
import { cartItems } from "./core/cart.js";
import { clearSession } from "./core/storage.js";
import { escapeHtml as e, safeUrl, toast } from "./core/ui.js";
import { bindProductButtons } from "./components/products.js";

function updateBadge() {
  const count = cartItems().reduce((total, item) => total + item.quantity, 0);
  jQuery("[data-cart-count]").text(count);
  jQuery("[data-cart-link]").attr(
    "aria-label",
    t("header.cartAriaLabel", { count }),
  );
}

async function loadContacts() {
  try {
    const data = await settings();
    const list = jQuery("[data-footer-contacts]").empty();
    for (const [value, prefix] of [
      [data.contact_phone, "tel:"],
      [data.contact_email, "mailto:"],
    ]) {
      if (typeof value !== "string" || !value.trim()) continue;
      const item = jQuery("<li>").appendTo(list);
      jQuery("<a>")
        .addClass("footer__link footer__link--contact")
        .attr("href", `${prefix}${value.replace(/[\r\n]/g, "")}`)
        .attr("dir", "ltr")
        .text(value)
        .appendTo(item);
    }
  } catch (_error) {
    const list = jQuery("[data-footer-contacts]").empty();
    jQuery("<li>").text(t("ui.unavailable")).appendTo(list);
    jQuery('<button type="button">')
      .addClass("footer__link")
      .text(t("ui.retry"))
      .on("click", loadContacts)
      .appendTo(jQuery("<li>").appendTo(list));
  }
}

function initNavigation() {
  const toggle = jQuery("[data-menu-toggle]");
  toggle.on("click", () => {
    const expanded = toggle.attr("aria-expanded") !== "true";
    toggle.attr("aria-expanded", String(expanded));
    jQuery("#mobile-menu").prop("hidden", !expanded);
  });
  jQuery(document).on("keydown", (event) => {
    if (event.key === "Escape" && toggle.attr("aria-expanded") === "true") {
      toggle.attr("aria-expanded", "false").trigger("focus");
      jQuery("#mobile-menu").prop("hidden", true);
    }
  });
  // Delegation also handles images created after the initial page load.
  document.addEventListener(
    "error",
    (event) => {
      if (
        !(event.target instanceof HTMLImageElement) ||
        !event.target.hasAttribute("data-api-image")
      )
        return;
      event.target.outerHTML = `<div class="card__image-placeholder"><span class="card__placeholder-text">${e(event.target.alt)}</span></div>`;
    },
    true,
  );
  jQuery("[data-language-switch]").on("click", function () {
    try {
      localStorage.setItem(
        "beity_locale",
        config.locale === "en" ? "ar" : "en",
      );
    } catch {
      /* Locale links still work without storage. */
    }
  });
}

const pages = {
  home: () => import("./features/home.js"),
  catalog: () => import("./features/catalog.js"),
  product: () => import("./features/product.js"),
  bundles: () => import("./features/bundles.js"),
  bundle: () => import("./features/bundle.js"),
  cart: () => import("./features/cart.js"),
  login: () => import("./features/auth.js"),
  register: () => import("./features/auth.js"),
  account: () => import("./features/account.js"),
  orders: () => import("./features/orders.js"),
};

jQuery(async () => {
  initNavigation();
  updateBadge();
  bindProductButtons();
  jQuery(document).on("cart:changed", updateBadge);
  window.addEventListener("storage", (event) => {
    if (event.key === "beity_cart_items")
      document.dispatchEvent(new CustomEvent("cart:changed"));
    if (event.key === "auth_token" && !event.newValue) {
      clearSession();
      if (["account", "orders"].includes(config.page))
        location.assign(route("login"));
    }
  });
  loadContacts();
  try {
    if (pages[config.page]) await (await pages[config.page]()).init();
  } catch (_error) {
    toast(t("ui.unavailable"), true);
  }
});

export { safeUrl };
