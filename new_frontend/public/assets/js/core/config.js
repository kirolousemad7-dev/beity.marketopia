export const config = JSON.parse(
  document.getElementById("storefront-config").textContent,
);

export function t(key, replacements = {}) {
  const value = key
    .split(".")
    .reduce((result, part) => result?.[part], config.dictionary);
  let text = typeof value === "string" ? value : key;
  for (const [name, replacement] of Object.entries(replacements)) {
    text = text.replaceAll(`{${name}}`, String(replacement));
  }
  return text;
}

export function route(path = "") {
  return `${config.baseUrl}/${config.locale}${path ? `/${path}` : ""}`;
}

export function money(value) {
  return new Intl.NumberFormat(config.locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}
