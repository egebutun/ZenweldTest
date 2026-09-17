import type { Metadata } from "next";
import { categories } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { CategoryListing } from "@/components/product/CategoryListing";
import { languageAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return categories
    .filter((category) => category.section === "aksesuarlar")
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
    alternates: languageAlternates(`/aksesuarlar/${category.slug}`, lang),
    openGraph: {
      title,
      description,
      url: `/${lang}/aksesuarlar/${category.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}) {
  const { kategori } = await params;
  return <CategoryListing section="aksesuarlar" categorySlug={kategori} />;
}
