import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { categories, localeSlug, matchesLocaleSlug } from "@zenweld/data";
import { isLocale, localizePath, type Locale } from "@zenweld/i18n";
import { CategoryListing } from "@/components/product/CategoryListing";
import { languageAlternatesFor, ogUrl } from "@/lib/seo";

const SECTION = "dolgu-metalleri";

/** Adres parcasi Turkce veya Ingilizce slug olabilir (bkz. packages/data/src/slugs.ts). */
function findCategory(kategori: string) {
  return categories.find((c) => c.section === SECTION && matchesLocaleSlug(c, kategori));
}

export function generateStaticParams() {
  return categories
    .filter((category) => category.section === SECTION)
    .flatMap((category) =>
      [category.slug, category.slugEn]
        .filter((slug): slug is string => Boolean(slug))
        .map((kategori) => ({ kategori })),
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}): Promise<Metadata> {
  const { locale, kategori } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const category = findCategory(kategori);

  if (!category) {
    return { title: lang === "tr" ? "Kategori" : "Category" };
  }

  const title = category.name[lang];
  const description = category.description[lang];

  return {
    title,
    description,
    // Her dil kendi slug'iyla: /tr/ekipmanlar/lazer-temizleme <-> /en/equipment/laser-cleaning
    alternates: languageAlternatesFor((l) => `/${SECTION}/${localeSlug(category, l)}`, lang),
    openGraph: {
      title,
      description,
      url: ogUrl(`/${SECTION}/${localeSlug(category, lang)}`, lang),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}) {
  const { locale, kategori } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const category = findCategory(kategori);

  // Bilinmeyen veya kaldirilmis kategori adresi 404 doner.
  if (!category) notFound();

  // Dil degistirilince gelen "obur dilin" slug'i bu dilin adresine tasinir:
  // /en/equipment/lazer-temizleme -> /en/equipment/laser-cleaning
  const canonical = localeSlug(category, lang);
  if (kategori !== canonical) {
    permanentRedirect(`/${lang}${localizePath(`/${SECTION}/${canonical}`, lang)}`);
  }

  return <CategoryListing section={SECTION} categorySlug={category.slug} />;
}
