import "../globals.css";
import { CartProvider } from "@/context/cart-context";
import { Header } from "@/layouts/header";
import { Footer } from "@/layouts/footer";
import { getDictionary } from "@/i18n/getDictionary";
import { i18n, isLocale, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/context/locale-context";
import { fetchSettings } from "@/lib/api";

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export const metadata = {
  title: "Beity — Household Electrical Appliances",
  description: "Minimal catalog for high-performance household appliances.",
  icons: "/logo.png",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const settings = await fetchSettings();

  return (
    <LocaleProvider initialLocale={locale}>
      <a href="#main-content" className="skip-link">
        {dict.common.skipToContent}
      </a>
      <CartProvider>
        <Header lang={locale} dict={dict} />
        <div id="main-content">{children}</div>
        <Footer lang={locale} dict={dict} settings={settings} />
      </CartProvider>
    </LocaleProvider>
  );
}