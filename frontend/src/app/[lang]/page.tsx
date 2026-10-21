import { isLocale, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import HomeContent from "@/components/home_content";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return <HomeContent locale={locale} />;
}