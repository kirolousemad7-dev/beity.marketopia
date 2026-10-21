import { Locale } from "@/i18n/config";

export function formatPrice(price: number | string, locale: Locale = "en") {
  const amount = typeof price === "string" ? parseFloat(price) : price;

  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0, // drop if you need piasters
  }).format(amount);
}

export function arrow(lang: 'ar'|'en') {
  return (
    lang == 'en' ? <>&rarr;</> : <>&larr;</>
  )
}