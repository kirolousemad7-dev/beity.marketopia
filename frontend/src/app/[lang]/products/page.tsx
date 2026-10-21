import { ProductCatalog } from "@/components/product-catalog";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";

export const metadata = {
  title: "All Products — Beity Appliance Catalog",
  description: "Browse the complete collection of Beity household electrical appliances.",
};

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <main className="products-page">
      <div className="home-container">
        <ProductCatalog lang={lang} />
      </div>
    </main>
  );
}