"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, localeCookie, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/getDictionary";
import { localizePath } from "@/i18n/middleware";

type LocaleContextValue = {
  locale: Locale;
  direction: "ltr" | "rtl";
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
};
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(localeCookie, locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.cookie = `${localeCookie}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(localeCookie, next);
    const query = window.location.search;
    router.replace(localizePath(next, `${pathname}${query}`));
    router.refresh()
  };

  const value = useMemo(
    () => ({
      locale,
      direction: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
      dictionary: getDictionary(locale),
      setLocale,
    }),
    [locale],
  );
  
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be inside LocaleProvider");
  return value;
}
