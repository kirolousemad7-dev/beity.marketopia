import { CartContent } from "@/components/cart_components";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { isLocale, Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { fetchSettings } from "@/lib/api";

export default async function CartPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict: Dictionary = getDictionary(locale);

  const settings = await fetchSettings();

  return <CartContent dict={dict} settings={settings} lang={lang} />
}