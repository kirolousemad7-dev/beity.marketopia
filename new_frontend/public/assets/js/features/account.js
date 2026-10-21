import { request } from "../core/api.js";
import { route, t } from "../core/config.js";
import { authToken, clearSession } from "../core/storage.js";
import {
  busy,
  escapeHtml as e,
  loading,
  renderError,
  signInPrompt,
  toast,
} from "../core/ui.js";

export async function init() {
  const container = jQuery("[data-account-content]");
  if (!authToken()) {
    container.html(signInPrompt());
    return;
  }
  container.html(loading());
  try {
    const { data: user } = await request("auth/profile", {
      authenticated: true,
    });
    if (!user || typeof user.email !== "string")
      throw new Error(t("ui.invalid_response"));
    container.html(`<div class="account-card"><div class="account-card__header"><div class="account-card__identity"><div class="account-avatar" aria-hidden="true">${e(user.name?.charAt(0) ?? "B")}</div><div><span class="account-badge">${e(t("auth.authenticated"))}</span><h1 class="account-name">${e(user.name)}</h1><p class="account-email">${e(user.email)}</p></div></div><button type="button" class="account-logout-btn" data-logout>${e(t("auth.logout"))}</button></div>
      <div class="account-section"><h2 class="account-section__title">${e(t("auth.quick_access"))}</h2><div class="account-tiles-grid">${[
        ["orders", "order_history"],
        ["cart", "shopping_cart"],
        ["products", "appliance_catalog"],
      ]
        .map(
          ([path, key]) =>
            `<a href="${e(route(path))}" class="account-tile"><h3 class="account-tile__title">${e(t(`auth.${key}`))}</h3><p class="account-tile__desc">${e(t(`auth.${key}_desc`))}</p></a>`,
        )
        .join("")}</div></div></div>`);
    container.find("[data-logout]").on("click", async function () {
      const button = jQuery(this);
      busy(button, true, t("auth.logout_loading"));
      try {
        await request("auth/logout", { method: "POST", authenticated: true });
        clearSession();
        location.assign(route("login"));
      } catch (error) {
        if (error.status === 401) {
          container.html(signInPrompt());
          return;
        }
        toast(t("ui.logout_failed"), true);
      } finally {
        busy(button, false);
      }
    });
  } catch (error) {
    if (error.status === 401) container.html(signInPrompt());
    else renderError(container, error, init);
  }
}
