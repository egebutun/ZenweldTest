import type { Metadata } from "next";
import { products, retailerStock } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/JsonLd";
import { languageAlternates, shopProductJsonLd } from "@/lib/seo";
import { STORE } from "@/lib/store-config";
import { ShopProductPageClient } from "./ShopProductPageClient";

export function generateStaticParams() {
  return products
    .filter((product) => product.active)
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return { title: lang === "tr" ? "Ürün bulunamadı" : "Product not found" };
  }

  const title = product.name;
  const description = product.shortDescription[lang];
  const image = product.images[0]?.url ?? "/images/products/zenweld-urun.png";

  return {
    title,
    description,
    alternates: languageAlternates(`/urun/${product.slug}`, lang),
    openGraph: {
      type: "website",
      siteName: STORE.name,
      title: `${title} | ${STORE.name}`,
      description,
      url: `/${lang}/urun/${product.slug}`,
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${STORE.name}`,
      description,
      images: [image],
    },
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const product = products.find((p) => p.slug === slug);

  if (!product) return <ShopProductPageClient slug={slug} />;

  const stock = retailerStock.find(
    (s) => s.productId === product.id && s.retailerId === STORE.retailerId,
  );

  return (
    <>
      <JsonLd data={shopProductJsonLd(product, stock, lang)} />
      <ShopProductPageClient slug={slug} />
    </>
  );
}
