import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, type TopLevelSection } from "@zenweld/data";
import { CategoryListing } from "@/components/product/CategoryListing";
import { absoluteUrl, canonical } from "@/lib/seo";

/**
 * URUN BOLUMU VE KATEGORI SAYFALARI — ORTAK KOD
 *
 * Dort bolumun (ekipmanlar, guvenlik, aksesuarlar, dolgu-metalleri) sayfa
 * dosyalari yalnizca bu fonksiyonlari cagirir:
 *
 *   const route = sectionRoute("ekipmanlar");          // /ekipmanlar
 *   const route = categoryRoute("ekipmanlar");         // /ekipmanlar/[kategori]
 */
const SECTION_META: Record<TopLevelSection, [title: string, description: string]> = {
  ekipmanlar: ["Ekipmanlar", "Zenweld ekipmanlar ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
  guvenlik: ["Güvenlik Ekipmanları", "Zenweld güvenlik ekipmanları ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
  aksesuarlar: ["Aksesuarlar", "Zenweld aksesuarlar ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
  "dolgu-metalleri": ["Dolgu Metalleri", "Zenweld dolgu metalleri ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."],
};

type CategoryParams = { params: Promise<{ kategori: string }> };

/** /<bolum> sayfasi. */
export function sectionRoute(section: TopLevelSection) {
  return {
    generateMetadata(): Metadata {
      const [title, description] = SECTION_META[section];
      return {
        title,
        description,
        alternates: canonical(`/${section}`),
        openGraph: { title, description, url: absoluteUrl(`/${section}`) },
      };
    },
    Page() {
      return <CategoryListing section={section} />;
    },
  };
}

/** /<bolum>/[kategori] sayfasi. */
export function categoryRoute(section: TopLevelSection) {
  const findCategory = (kategori: string) =>
    categories.find((c) => c.section === section && c.slug === kategori);

  return {
    generateStaticParams() {
      return categories
        .filter((category) => category.section === section)
        .map((category) => ({ kategori: category.slug }));
    },

    async generateMetadata({ params }: CategoryParams): Promise<Metadata> {
      const category = findCategory((await params).kategori);
      if (!category) return { title: "Kategori" };

      const path = `/${section}/${category.slug}`;
      const title = category.name;
      const description = category.description;
      return {
        title,
        description,
        alternates: canonical(path),
        openGraph: { title, description, url: absoluteUrl(path) },
      };
    },

    async Page({ params }: CategoryParams) {
      const category = findCategory((await params).kategori);

      // Bilinmeyen veya kaldirilmis kategori adresi 404 doner.
      if (!category) notFound();

      return <CategoryListing section={section} categorySlug={category.slug} />;
    },
  };
}
