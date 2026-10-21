import type { Locale } from "@/i18n/config";
import en from "@/dictionaries/en.json";
import ar from "@/dictionaries/ar.json";

export const dictionaries = { en, ar } satisfies Record<Locale, typeof en>;
export type Dictionary = (typeof dictionaries)[Locale];

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];