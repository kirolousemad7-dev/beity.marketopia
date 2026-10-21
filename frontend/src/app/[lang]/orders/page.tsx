import OrderList from "@/components/order-list";
import { getDictionary } from "@/i18n/getDictionary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order History | Beity",
  description: "View your past orders and track shipments.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ lang: "en"|"ar" }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang)
  return <OrderList dict={dict} lang={lang} />;
}
