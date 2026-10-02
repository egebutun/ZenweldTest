import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { CategoryListing } from "@/components/product/CategoryListing";
import { languageAlternates, ogUrl } from "@/lib/seo";

export function generateStaticParams() {
  return categories
    .filter((category) => category.section === "ekipmanlar")
    .map((category) => ({ kategori: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}): Promise<Metadata> {
  const { locale, kategori } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const category = categories.find((c) => c.slug === kategori);

  if (!category) {
    return { title: lang === "tr" ? "Kategori" : "Category" };
  }

  const title = category.name[lang];
  const description = category.description[lang];

  return {
    title,
    description,
    alternates: languageAlternates(`/ekipmanlar/${category.slug}`, lang),
    openGraph: {
      title,
      description,
      url: ogUrl(`/ekipmanlar/${category.slug}`, lang),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}) {
  const { kategori } = await params;
  // Bilinmeyen veya kaldirilmis kategori adresi 404 doner (yonlendirme yok).
  if (!categories.some((c) => c.section === "ekipmanlar" && c.slug === kategori)) notFound();
  return <CategoryListing section="ekipmanlar" categorySlug={kategori} />;
}
