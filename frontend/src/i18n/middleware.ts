import { isLocale, type Locale } from "./config";

const externalUrl = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

export function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  return isLocale(segments[1]) ? `/${segments.slice(2).join("/")}` : pathname;
}

export function localizePath(locale: Locale, href: string) {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    externalUrl.test(href)
  ) {
    return href;
  }

  const [pathname, suffix = ""] = href.split(/(?=[?#])/u, 2);
  const cleanPath = stripLocale(pathname) || "/";
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}${suffix}`;
}
