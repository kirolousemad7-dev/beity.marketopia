import { RegisterForm } from "@/components/register-form";
import { isLocale, Locale } from "@/i18n/config";
import { Dictionary, getDictionary } from "@/i18n/getDictionary";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Create Account | Beity",
  description: "Create an account on Beity Household Electrical Appliances.",
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict: Dictionary = getDictionary(locale);

  return <RegisterForm lang={lang} dict={dict} />;
}