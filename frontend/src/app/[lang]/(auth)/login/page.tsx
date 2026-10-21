import { LoginForm } from "@/components/login-form";
import { isLocale, Locale } from "@/i18n/config";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Sign In | Beity",
  description: "Sign in to your Beity account to manage orders and appliance warranties.",
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict: Dictionary = getDictionary(locale);

  return <LoginForm lang={lang} dict={dict} />;
}