import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, products } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  languageAlternates,
  productJsonLd,
} from "@/lib/seo";
import { ProductPageClient } from "./ProductPageClient";

/**
 * Urun sayfasi — sunucu bileseni.
 *
 * Sayfa basligi, aciklamasi, sosyal medya onizlemesi ve yapisal veri burada
 * uretilir; etkilesimli kisim ProductPageClient bileseninde calisir.
 */

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

  const category = categories.find((c) => c.slug === product.categorySlug);
  const title = category
    ? `${product.name} — ${category.name[lang]}`
    : product.name;
  const description = product.shortDescription[lang];
  const image = product.images[0]?.url ?? "/images/products/zenweld-urun.png";

  return {
    title,
    description,
    alternates: languageAlternates(`/urun/${product.slug}`, lang),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `/${lang}/urun/${product.slug}`,
      images: [{ url: image, alt: product.name }],
      locale: lang === "tr" ? "tr_TR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    other: {
      "product:brand": "Zenweld",
      "product:retailer_item_id": product.sku,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const product = products.find((p) => p.slug === slug);

  // Yonetim panelinden eklenen urunler yalnizca tarayicida bulunur; onlar icin
  // yapisal veri uretmeden istemci bilesenini calistiriyoruz.
  if (!product) {
    return <ProductPageClient slug={slug} />;
  }

  const category = categories.find((c) => c.slug === product.categorySlug);
  const sectionLabel = product.section.replace("-", " ");

  return (
    <>
      <JsonLd data={productJsonLd(product, lang, category)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: `/${lang}` },
          { name: sectionLabel, path: `/${lang}/${product.section}` },
          ...(category
            ? [
                {
                  name: category.name[lang],
                  path: `/${lang}/${product.section}/${category.slug}`,
                },
              ]
            : []),
          { name: product.name, path: `/${lang}/urun/${product.slug}` },
        ])}
      />
      <ProductPageClient slug={slug} />
    </>
  );
}
