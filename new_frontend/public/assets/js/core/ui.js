import { t, route } from "./config.js";

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

export function safeUrl(value) {
  try {
    const url = new URL(String(value), location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

/** Preserve description formatting while discarding scripts and unsafe attributes. */
export function descriptionHtml(value) {
  const parsed = new DOMParser().parseFromString(
    String(value ?? ""),
    "text/html",
  );
  const allowed = new Set([
    "P",
    "BR",
    "STRONG",
    "B",
    "EM",
    "I",
    "UL",
    "OL",
    "LI",
    "H2",
    "H3",
    "H4",
    "BLOCKQUOTE",
  ]);
  for (const element of [...parsed.body.querySelectorAll("*")]) {
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(element.tagName)) {
      element.remove();
      continue;
    }
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of [...element.attributes])
      element.removeAttribute(attribute.name);
  }
  return parsed.body.innerHTML;
}

export function image(value, name, className = "") {
  const url = value ? safeUrl(value) : "";
  return url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" class="${escapeHtml(className)}" loading="lazy" decoding="async" data-api-image>`
    : `<div class="card__image-placeholder" role="img" aria-label="${escapeHtml(name)}"><span class="card__placeholder-text">${escapeHtml(name)}</span></div>`;
}

export function loading() {
  return `<div class="page-state" role="status"><span class="loading-spinner" aria-hidden="true"></span>${escapeHtml(t("ui.loading"))}</div>`;
}

export function empty(
  title,
  hint = "",
  link = "products",
  label = t("cart.browse_catalog"),
) {
  return `<div class="empty-state"><h2 class="empty-state__title">${escapeHtml(title)}</h2><p class="empty-state__hint">${escapeHtml(hint)}</p><a class="empty-state__btn" href="${escapeHtml(route(link))}">${escapeHtml(label)}</a></div>`;
}

export function renderError(container, error, retry) {
  const heading =
    error.status === 404 ? t("ui.not_found") : t("ui.unavailable");
  container.html(
    `<div class="empty-state" role="alert"><h2 class="empty-state__title">${escapeHtml(heading)}</h2><p class="empty-state__hint">${escapeHtml(error.message)}</p><button type="button" class="empty-state__btn" data-retry>${escapeHtml(t("ui.retry"))}</button></div>`,
  );
  container.find("[data-retry]").on("click", retry);
}

export function toast(message, error = false) {
  const region = jQuery("#toast-region");
  region.empty();
  const node = jQuery("<div>")
    .addClass(`toast ${error ? "toast--error" : ""}`)
    .text(message)
    .appendTo(region);
  setTimeout(() => node.remove(), 5000);
}

export function busy(button, active, label) {
  if (active) button.data("original-label", button.text());
  button
    .prop("disabled", active)
    .attr("aria-busy", String(active))
    .text(active ? label : button.data("original-label"));
}

export function signInPrompt() {
  return empty(
    t("auth.sign_in_your_account"),
    t("auth.authorize_warning"),
    "login",
    t("auth.login"),
  );
}
