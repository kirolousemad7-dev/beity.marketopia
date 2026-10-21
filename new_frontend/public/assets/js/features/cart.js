import { request, settings } from "../core/api.js";
import { money, route, t } from "../core/config.js";
import { authToken } from "../core/storage.js";
import { validateCartProducts } from "./cart/validate-products.js";
import {
  cartHasBlockedPackages,
  cartItems,
  clearCart,
  flagBundleNeedsReselection,
  legacyBundleGroups,
  packageMatchesOffer,
  removeItem,
  removeLegacyBundle,
  subtotal,
  updateQuantity,
} from "../core/cart.js";
import {
  busy,
  empty,
  escapeHtml as e,
  image,
  loading,
  renderError,
  toast,
} from "../core/ui.js";

let storeSettings;
let coupon = null;
let submitting = false;
let applying = false;

const SHIPPING_NOTICE =
  "للشحن إلى المحافظات خارج القاهرة والجيزة والإسكندرية، يُرجى التواصل معنا.";

function shippingNotice(phone) {
  const phrase = "التواصل معنا";
  const destination = String(phone ?? "").trim();
  const href = destination.replace(/[^\d+]/g, "");
  if (!destination || !href || !SHIPPING_NOTICE.includes(phrase))
    return `<p class="shipping-notice" lang="ar" dir="rtl">${e(SHIPPING_NOTICE)}</p>`;
  const [before, after] = SHIPPING_NOTICE.split(phrase);
  return `<p class="shipping-notice" lang="ar" dir="rtl">${e(before)}<a href="${e(`tel:${href}`)}">${e(phrase)}</a>${e(after)}</p>`;
}

function productRow(item) {
  return `<div class="cart-table__row"><div class="cart-table__item"><div class="cart-table__image-wrapper">${image(item.imageUrl, item.name, "cart-table__image")}</div><div class="cart-table__details"><a href="${e(route(`products/${encodeURIComponent(item.slug)}`))}" class="cart-table__title">${e(item.name)}</a><button type="button" class="cart-table__remove-btn" data-remove="${e(item.key)}">${e(t("cart.remove"))}</button></div></div>
    <div class="cart-table__cell cart-table__cell--price" data-label="${e(t("cart.table_price"))}">${e(money(item.price))}</div><div class="cart-table__cell cart-table__cell--quantity" data-label="${e(t("cart.table_quantity"))}"><div class="quantity-control"><button type="button" class="quantity-control__btn" data-quantity="${e(item.key)}" data-value="${item.quantity - 1}" aria-label="${e(t("cart.decrease"))}">−</button><span class="quantity-control__value">${item.quantity}</span><button type="button" class="quantity-control__btn" data-quantity="${e(item.key)}" data-value="${item.quantity + 1}" aria-label="${e(t("cart.increase"))}">+</button></div></div><div class="cart-table__cell cart-table__cell--total" data-label="${e(t("cart.table_total"))}">${e(money(item.price * item.quantity))}</div></div>`;
}

function packageContents(item) {
  return item.components
    .map(
      (component) =>
        `<li class="cart-package__item"><div class="cart-package__identity">${image(component.imageUrl, component.name, "cart-table__image")}<span>${e(component.name)}</span></div><span class="cart-package__qty">${e(t("cart.table_quantity"))}: ${component.quantity * item.quantity}</span></li>`,
    )
    .join("");
}

function packageRow(item) {
  const blocked = item.needsReselection
    ? `<p class="cart-package__notice">${e(t("ui.package_reselect"))}</p>`
    : "";
  return `<article class="cart-package"><div class="cart-package__header"><div><a href="${e(route(`bundles/${encodeURIComponent(item.slug)}`))}" class="cart-table__title">${e(item.name)}</a><p class="cart-package__count">${e(t("cart.packages_count", { count: item.quantity }))}</p></div><button type="button" class="cart-table__remove-btn" data-remove="${e(item.key)}">${e(t("cart.remove"))}</button></div>${blocked}<ul class="cart-package__contents">${packageContents(item)}</ul><p class="cart-package__total">${e(money(item.price * item.quantity))}</p></article>`;
}

function legacyRows() {
  return legacyBundleGroups()
    .map(({ bundleId, lines }) => {
      const contents = lines
        .map(
          (line) =>
            `<li class="cart-package__item"><div class="cart-package__identity">${image(line.imageUrl, line.name, "cart-table__image")}<span>${e(line.name)}</span></div><span class="cart-package__qty">${e(t("cart.table_quantity"))}: ${line.quantity}</span></li>`,
        )
        .join("");
      return `<article class="cart-package cart-package--blocked"><div class="cart-package__header"><p class="cart-table__title">${e(lines[0]?.spec || t("ui.package_reselect"))}</p><button type="button" class="cart-table__remove-btn" data-remove-package="${e(bundleId)}">${e(t("cart.remove"))}</button></div><p class="cart-package__notice">${e(t("ui.package_reselect"))}</p><ul class="cart-package__contents">${contents}</ul></article>`;
    })
    .join("");
}

function rows(items) {
  const packages = items
    .filter((item) => item.kind === "bundle")
    .map(packageRow)
    .join("");
  const products = items
    .filter((item) => item.kind === "product")
    .map(productRow)
    .join("");
  return `${legacyRows()}${packages}${products}`;
}

function totals() {
  const amount = subtotal();
  const shipping = Number(storeSettings.shipping_cost) || 0;
  const discount = Number(coupon?.discount_amount) || 0;
  return {
    amount,
    shipping,
    discount,
    total: Math.max(0, amount + shipping - discount),
  };
}

function updateTotals() {
  const values = totals();
  jQuery("[data-subtotal]").text(money(values.amount));
  jQuery("[data-shipping]").text(money(values.shipping));
  jQuery("[data-discount]").text(money(values.discount));
  jQuery("[data-total]").text(money(values.total));
  jQuery("[data-discount-row]").prop("hidden", !coupon);
  jQuery("[data-coupon-code]").prop("disabled", Boolean(coupon) || applying);
  jQuery("[data-remove-coupon]").prop("hidden", !coupon);
}

function render() {
  const container = jQuery("[data-cart-content]");
  const items = cartItems();
  if (!items.length) {
    container.html(empty(t("cart.empty_title"), t("cart.empty_hint")));
    return;
  }
  container.html(`<div class="cart-page__header"><div><h1 class="cart-page__title">${e(t("cart.title"))}</h1><p class="cart-page__subtitle">${e(t(items.length === 1 ? "cart.subtitle_one" : "cart.subtitle_other", { count: items.length }))}</p></div><button type="button" class="cart-table__clear-btn" data-clear-cart>${e(t("cart.clear"))}</button></div>
    <div class="cart-layout"><div class="cart-layout__main"><div class="cart-table"><div class="cart-table__header">${["product", "price", "quantity", "total"].map((key) => `<span>${e(t(`cart.table_${key}`))}</span>`).join("")}</div><div class="cart-table__body" data-cart-rows>${rows(items)}</div></div></div>
    <aside class="cart-layout__sidebar"><div class="summary-card"><h2 class="summary-card__title">${e(t("cart.order_summary"))}</h2><div class="summary-card__rows"><div class="summary-card__row"><span>${e(t("cart.subtotal"))}</span><span data-subtotal></span></div><div class="summary-card__row"><span>${e(t("cart.home_delivery"))}</span><span data-shipping></span></div>${shippingNotice(storeSettings.contact_phone)}<div class="summary-card__row" data-discount-row hidden><span>${e(t("cart.discount"))}</span><span data-discount></span></div><div class="summary-card__divider"></div><div class="summary-card__row summary-card__row--total"><strong>${e(t("cart.total_amount"))}</strong><strong data-total></strong></div></div>
      <form data-checkout-form class="order__data" novalidate><fieldset class="payment-fieldset"><legend class="form-label">${e(t("ui.payment"))}</legend><div class="payment__methods">${["instapay", "cash_on_delivery"].map((method) => `<label class="payment-btn"><input type="radio" name="payment_method" value="${method}" required> ${e(t(method === "instapay" ? "cart.payment_instapay" : "cart.payment_cash"))}</label>`).join("")}</div></fieldset>
      <div class="form-group"><label for="customer_name" class="form-label">${e(t("ui.customer_name"))}</label><input id="customer_name" class="form-input" name="customer_name" required maxlength="100" autocomplete="name"></div>
      <div class="form-group"><label for="customer_phone" class="form-label">${e(t("ui.customer_phone"))}</label><input id="customer_phone" class="form-input" name="customer_phone" type="tel" required maxlength="30" autocomplete="tel" dir="ltr"></div>
      <div class="form-group"><label for="additional_phone" class="form-label">${e(t("ui.additional_phone"))}</label><input id="additional_phone" class="form-input" name="additional_phone" type="tel" maxlength="30" dir="ltr"></div>
      <div class="form-group"><label for="shipping_address" class="form-label">${e(t("ui.shipping"))}</label><input id="shipping_address" class="form-input" name="shipping_address" required maxlength="255" autocomplete="street-address">${shippingNotice(storeSettings.contact_phone)}</div>
      <div data-payment-proof hidden><p class="order__instapay">${e(t("cart.instapay_number"))}: <strong>${e(storeSettings.instapay_number)}</strong></p><label for="payment_screenshot" class="form-label">${e(t("ui.payment_screenshot"))}</label><input id="payment_screenshot" type="file" name="payment_screenshot" accept="image/png,image/jpeg,image/webp" aria-describedby="screenshot-hint"><p id="screenshot-hint" class="form-hint">${e(t("ui.screenshot_hint"))}</p><img data-screenshot-preview class="screenshot-preview" alt="${e(t("ui.payment_screenshot"))}" hidden></div>
      <div data-checkout-errors class="auth-alert auth-alert--error" role="alert" tabindex="-1" hidden></div><button type="submit" class="checkout-btn summary-card__checkout-btn">${e(t("cart.checkout"))}</button></form>
      <form data-coupon-form class="coupon-form"><label for="coupon_code" class="form-label">${e(t("cart.coupon_placeholder"))}</label><div class="coupon-controls"><input id="coupon_code" class="form-input" data-coupon-code required maxlength="100"><button type="submit" class="empty-state__btn">${e(t("cart.apply"))}</button><button type="button" class="cart-table__remove-btn" data-remove-coupon hidden>${e(t("ui.remove_coupon"))}</button></div></form>
    </div></aside></div>`);
  updateTotals();
  bindCheckout();
  bindCoupon();
  let previewUrl;
  container.find("[name=payment_method]").on("change", function () {
    const needsProof = this.value !== "cash_on_delivery";
    container.find("[data-payment-proof]").prop("hidden", !needsProof);
    container.find("[name=payment_screenshot]").prop("required", needsProof);
    container.find(".payment-btn").removeClass("selected");
    jQuery(this).closest(".payment-btn").addClass("selected");
  });
  container.find("[name=payment_screenshot]").on("change", function () {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = this.files[0];
    const valid =
      file &&
      ["image/png", "image/jpeg", "image/webp"].includes(file.type) &&
      file.size <= 5 * 1024 * 1024;
    this.setCustomValidity(file && !valid ? t("ui.screenshot_hint") : "");
    previewUrl = valid ? URL.createObjectURL(file) : undefined;
    container
      .find("[data-screenshot-preview]")
      .prop("hidden", !valid)
      .attr("src", previewUrl ?? "");
  });
}

function checkoutError(message, errors = {}) {
  const status = jQuery("[data-checkout-errors]").empty().prop("hidden", false);
  jQuery("<p>").text(message).appendTo(status);
  for (const messages of Object.values(errors))
    jQuery("<p>")
      .text(Array.isArray(messages) ? messages.join(" ") : String(messages))
      .appendTo(status);
  status.trigger("focus");
}

function bindCheckout() {
  const form = document.querySelector("[data-checkout-form]");
  const name = form.elements.namedItem("customer_name");
  const phones = ["customer_phone", "additional_phone"].map((field) =>
    form.elements.namedItem(field),
  );
  const validateCustomer = () => {
    name.setCustomValidity(
      name.value.trim() ? "" : t("ui.customer_name_required"),
    );
    for (const phone of phones) {
      const value = phone.value.trim();
      const digits = value.replace(/\D/g, "");
      const valid =
        /^\+?[0-9 ()-]+$/.test(value) &&
        digits.length >= 7 &&
        digits.length <= 15;
      phone.setCustomValidity(
        (!value && !phone.required) || valid ? "" : t("ui.phone_invalid"),
      );
    }
  };
  jQuery(form)
    .find("[name=customer_name], [type=tel]")
    .on("input", validateCustomer);
  jQuery("[data-checkout-form]").on("submit", async function (event) {
    event.preventDefault();
    if (submitting || applying) return;
    if (!authToken()) {
      checkoutError(t("api.login_required"));
      toast(t("api.login_required"), true);
      return;
    }
    validateCustomer();
    if (!this.reportValidity()) return;
    await reviewStoredBundles();
    const items = cartItems();
    if (!items.length) return;
    if (cartHasBlockedPackages(items)) {
      checkoutError(t("ui.package_reselect"));
      return;
    }
    const data = new FormData(this);
    for (const field of ["customer_name", "customer_phone", "additional_phone"])
      data.set(field, String(data.get(field)).trim());
    if (!data.get("additional_phone")) data.delete("additional_phone");
    if (data.get("payment_method") === "cash_on_delivery")
      data.delete("payment_screenshot");
    const screenshot = data.get("payment_screenshot");
    if (
      screenshot instanceof File &&
      (screenshot.size > 5 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(screenshot.type))
    ) {
      checkoutError(t("ui.screenshot_hint"));
      return;
    }
    items
      .filter((item) => item.kind === "product")
      .forEach((item, index) => {
        data.append(`items[${index}][product_id]`, String(item.id));
        data.append(`items[${index}][quantity]`, String(item.quantity));
      });
    items
      .filter((item) => item.kind === "bundle")
      .forEach((item, index) => {
        data.append(`bundles[${index}][bundle_id]`, String(item.bundleId));
        data.append(`bundles[${index}][quantity]`, String(item.quantity));
      });
    data.append("total_amount", totals().total.toFixed(2));
    if (coupon) data.append("coupon_code", coupon.code);
    submitting = true;
    const button = jQuery(this).find("[type=submit]");
    busy(button, true, t("cart.proceeding"));
    jQuery("[data-checkout-errors]").prop("hidden", true);
    jQuery(
      "[data-coupon-form] :input, [data-quantity], [data-remove], [data-clear-cart]",
    ).prop("disabled", true);
    try {
      await request("orders/checkout", {
        method: "POST",
        authenticated: true,
        data,
      });
      coupon = null;
      clearCart();
      toast(t("ui.order_success"));
      render();
    } catch (error) {
      checkoutError(error.message, error.errors);
    } finally {
      submitting = false;
      busy(button, false);
      jQuery(
        "[data-coupon-form] :input, [data-quantity], [data-remove], [data-clear-cart]",
      ).prop("disabled", false);
      if (cartItems().length) updateTotals();
    }
  });
}

function bindCoupon() {
  jQuery("[data-coupon-form]").on("submit", async function (event) {
    event.preventDefault();
    if (applying || submitting || coupon) return;
    const code = String(jQuery("[data-coupon-code]").val())
      .trim()
      .toUpperCase();
    if (!code) return;
    const amount = Math.round((subtotal() + (Number(storeSettings.shipping_cost) || 0)) * 100) / 100;
    const button = jQuery(this).find("[type=submit]");
    applying = true;
    busy(button, true, t("ui.loading"));
    try {
      const { data } = await request("coupons/apply", {
        method: "POST",
        authenticated: true,
        data: { code, order_amount: amount },
      });
      if (
        !Number.isFinite(Number(data?.discount_amount)) ||
        Number(data.discount_amount) < 0
      )
        throw new Error(t("ui.invalid_response"));
      if (
        Math.round((subtotal() + (Number(storeSettings.shipping_cost) || 0)) * 100) /
          100 !==
        amount
      )
        return;
      coupon = { ...data, code };
      toast(t("cart.coupon_applied"));
    } catch (error) {
      toast(error.message, true);
    } finally {
      applying = false;
      busy(button, false);
      updateTotals();
    }
  });
  jQuery("[data-remove-coupon]").on("click", () => {
    coupon = null;
    jQuery("[data-coupon-code]").val("");
    updateTotals();
  });
}

async function reviewStoredBundles() {
  const items = cartItems().filter(
    (item) => item.kind === "bundle" && !item.needsReselection && item.slug,
  );
  for (const item of items) {
    try {
      const { data } = await request(
        `bundles/${encodeURIComponent(item.slug)}`,
      );
      if (!packageMatchesOffer(item, data))
        flagBundleNeedsReselection(item.key);
    } catch (error) {
      if (error.status === 404) flagBundleNeedsReselection(item.key);
    }
  }
}

export async function init() {
  const container = jQuery("[data-cart-content]").html(loading());
  jQuery(document).off("cart:changed.cart");
  try {
    const [settingsData, validation] = await Promise.all([
      settings(),
      validateCartProducts(),
    ]);
    await reviewStoredBundles();
    storeSettings = settingsData;
    render();
    if (validation.removed) toast(t("ui.cart_missing_removed"));
    if (validation.failed) toast(t("ui.cart_check_failed"), true);
  } catch (error) {
    renderError(container, error, init);
    return;
  }
  container
    .off(
      "click",
      "[data-remove], [data-remove-package], [data-quantity], [data-clear-cart]",
    )
    .on(
      "click",
      "[data-remove], [data-remove-package], [data-quantity], [data-clear-cart]",
      function () {
        if (submitting) return;
        try {
          const button = jQuery(this);
          if (button.is("[data-remove-package]"))
            removeLegacyBundle(button.attr("data-remove-package"));
          else if (button.is("[data-remove]"))
            removeItem(button.attr("data-remove"));
          else if (button.is("[data-quantity]"))
            updateQuantity(
              button.attr("data-quantity"),
              Number(button.attr("data-value")),
            );
          else if (confirm(t("ui.confirm_clear"))) clearCart();
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
      },
    );
  jQuery(document)
    .off("cart:changed.cart")
    .on("cart:changed.cart", () => {
      coupon = null;
      if (!cartItems().length) {
        render();
        return;
      }
      if (!jQuery("[data-cart-rows]").length) {
        render();
        return;
      }
      jQuery("[data-cart-rows]").html(rows(cartItems()));
      updateTotals();
    });
}
