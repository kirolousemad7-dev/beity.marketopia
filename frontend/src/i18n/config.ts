export const i18n = {
  defaultLocale: "en",
  locales: ["ar", "en"],
} as const;

export type Locale = (typeof i18n)["locales"][number];

export const localeCookie = "beity_locale";
export const defaultLocale: Locale = "en";

export const isLocale = (lang: string): lang is Locale =>
  (i18n.locales as readonly string[]).includes(lang);