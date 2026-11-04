import type { Metadata } from "next";
import { isInWarehouse, productBrand, warehouseStockMap } from "@zenweld/data";
import { JsonLd } from "@/components/common/JsonLd";
import { catalogTrail } from "@/lib/catalog";
import { getServerCatalog } from "@/lib/server/catalog";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  canonical,
  productJsonLd,
  productSeo,
  seoMetadata,
} from "@/lib/seo";
import { ProductPageClient } from "./ProductPageClient";

/**
 * Urun sayfasi — sunucu bileseni.
 *
 * Sayfa basligi, aciklamasi, sosyal medya onizlemesi ve yapisal veri burada
 * uretilir; etkilesimli kisim ProductPageClient bileseninde calisir. Urunler
 * sunucunun katalogundan okunur: veri kaynagi veritabaniysa tablolardan,
 * degilse koddaki ornek veriden (lib/server/catalog.ts).
 */

async function findActiveProduct(slug: string) {
  const catalog = await getServerCatalog();
  const product = catalog.products.find((p) => p.active && p.slug === slug);
  return { catalog, product };
}

export async function generateStaticParams() {
  const { products } = await getServerCatalog();
  return products.filter((product) => product.active).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await findActiveProduct(slug);

  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  // Panelin SEO sekmesi: ozel baslik tam haliyle kullanilir, bos alanlar
  // otomatik doldurulur.
  const seo = productSeo(product);
  const description = seo.description;
  // Urunun fotografi yoksa paylasim karti olarak markali gorsel kullanilir.
  // Onceden 519 KB'lik dikey bir urun fotografi vardi; sosyal aglar bu
  // olcuyu kirpiyordu.
  const image = product.images[0]?.url ?? "/images/brand/og-cover.png";

  return {
    ...seoMetadata(seo),
    alternates: canonical(`/urun/${product.slug}`),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: seo.title,
      description,
      url: absoluteUrl(`/urun/${product.slug}`),
      images: [{ url: image, alt: product.name }],
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description,
      images: [image],
    },
    other: {
      "product:brand": productBrand(product),
      "product:retailer_item_id": product.sku,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { catalog, product } = await findActiveProduct(slug);

  // Demo modunda panelden eklenen urunler yalnizca tarayicida bulunur; onlar
  // icin yapisal veri uretmeden istemci bilesenini calistiriyoruz.
  if (!product) {
    return <ProductPageClient slug={slug} />;
  }

  const category = catalog.categories.find((c) => c.slug === product.categorySlug);
  const jsonLd = productJsonLd(product, category, {
    now: new Date(),
    inStock: isInWarehouse(product, warehouseStockMap(catalog.warehouseStock)),
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          ...catalogTrail(
            product.section,
            { categorySlug: product.categorySlug },
            { categories: catalog.categories, groups: catalog.categoryGroups },
          ).map((c) => ({
            name: c.label,
            path: c.href,
          })),
          { name: product.name, path: `/urun/${product.slug}` },
        ])}
      />
      <ProductPageClient slug={slug} />
    </>
  );
}
