import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { categories, localeSlug, matchesLocaleSlug, type TopLevelSection } from "@zenweld/data";
import { isLocale, localizePath, type Locale } from "@zenweld/i18n";
import { CategoryListing } from "@/components/product/CategoryListing";
import { languageAlternates, languageAlternatesFor, ogUrl } from "@/lib/seo";

/**
 * URUN BOLUMU VE KATEGORI SAYFALARI — ORTAK KOD
 *
 * Dort bolumun (ekipmanlar, guvenlik, aksesuarlar, dolgu-metalleri) sayfa
 * dosyalari yalnizca bu fonksiyonlari cagirir:
 *
 *   const route = sectionRoute("ekipmanlar");          // /ekipmanlar
 *   const route = categoryRoute("ekipmanlar");         // /ekipmanlar/[kategori]
 */
const SECTION_META: Record<TopLevelSection, Record<Locale, [title: string, description: string]>> = {
  ekipmanlar: {
    tr: ["Ekipmanlar", "Zenweld ekipmanlar ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
    en: ["Equipment", "Browse Zenweld equipment, and buy from your nearest authorised dealer."],
  },
  guvenlik: {
    tr: ["Güvenlik Ekipmanları", "Zenweld güvenlik ekipmanları ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
    en: ["Safety Equipment", "Browse Zenweld safety equipment, and buy from your nearest authorised dealer."],
  },
  aksesuarlar: {
    tr: ["Aksesuarlar", "Zenweld aksesuarlar ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
    en: ["Accessories", "Browse Zenweld accessories, and buy from your nearest authorised dealer."],
  },
  "dolgu-metalleri": {
    tr: ["Dolgu Metalleri", "Zenweld dolgu metalleri ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
    en: ["Filler Metals", "Browse Zenweld filler metals, and buy from your nearest authorised dealer."],
  },
};

const toLocale = (locale: string): Locale => (isLocale(locale) ? locale : "tr");

type LocaleParams = { params: Promise<{ locale: string }> };
type CategoryParams = { params: Promise<{ locale: string; kategori: string }> };

/** /<bolum> sayfasi. */
export function sectionRoute(section: TopLevelSection) {
  return {
    async generateMetadata({ params }: LocaleParams): Promise<Metadata> {
      const lang = toLocale((await params).locale);
      const [title, description] = SECTION_META[section][lang];
      return {
        title,
        description,
        alternates: languageAlternates(`/${section}`, lang),
        openGraph: { title, description, url: ogUrl(`/${section}`, lang) },
      };
    },
    Page() {
      return <CategoryListing section={section} />;
    },
  };
}

/** /<bolum>/[kategori] sayfasi. Adres parcasi Turkce veya Ingilizce slug olabilir. */
export function categoryRoute(section: TopLevelSection) {
  const findCategory = (kategori: string) =>
    categories.find((c) => c.section === section && matchesLocaleSlug(c, kategori));

  return {
    generateStaticParams() {
      return categories
        .filter((category) => category.section === section)
        .flatMap((category) =>
          [category.slug, category.slugEn]
            .filter((slug): slug is string => Boolean(slug))
            .map((kategori) => ({ kategori })),
        );
    },

    async generateMetadata({ params }: CategoryParams): Promise<Metadata> {
      const { locale, kategori } = await params;
      const lang = toLocale(locale);
      const category = findCategory(kategori);
      if (!category) return { title: lang === "tr" ? "Kategori" : "Category" };

      const title = category.name[lang];
      const description = category.description[lang];
      return {
        title,
        description,
        // Her dil kendi slug'iyla: /tr/ekipmanlar/lazer-temizleme <-> /en/equipment/laser-cleaning
        alternates: languageAlternatesFor((l) => `/${section}/${localeSlug(category, l)}`, lang),
        openGraph: {
          title,
          description,
          url: ogUrl(`/${section}/${localeSlug(category, lang)}`, lang),
        },
      };
    },

    async Page({ params }: CategoryParams) {
      const { locale, kategori } = await params;
      const lang = toLocale(locale);
      const category = findCategory(kategori);

      // Bilinmeyen veya kaldirilmis kategori adresi 404 doner.
      if (!category) notFound();

      // Dil degistirilince gelen "obur dilin" slug'i bu dilin adresine tasinir:
      // /en/equipment/lazer-temizleme -> /en/equipment/laser-cleaning
      const canonical = localeSlug(category, lang);
      if (kategori !== canonical) {
        permanentRedirect(`/${lang}${localizePath(`/${section}/${canonical}`, lang)}`);
      }

      return <CategoryListing section={section} categorySlug={category.slug} />;
    },
  };
}
