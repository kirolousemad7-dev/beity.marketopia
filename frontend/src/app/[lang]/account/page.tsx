import { AccountView } from "@/components/account-view";
import { isLocale, Locale } from "@/i18n/config";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { notFound } from "next/navigation";

export const metadata = {
  title: "My Account | Beity",
  description: "View and manage your Beity account, orders, and credentials.",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict: Dictionary = getDictionary(locale);
  
  return <AccountView lang={lang} dict={dict} />;
}
