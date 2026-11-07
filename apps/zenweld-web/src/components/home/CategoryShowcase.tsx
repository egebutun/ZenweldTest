"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, TopLevelSection } from "@zenweld/data";
import { listProducts, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { SECTION_TITLES, categoryHref } from "@/lib/catalog";
import { useT } from "@/lib/i18n-client";

/**
 * Kategori kartinda gosterilecek gorsel, kategoriye ozel (fotografi olmayan
 * lazer kaynak kategorisi icin sahibinin gonderdigi Jasic fotografi).
 */
const CARD_PHOTO: Record<string, string> = {
  "lazer-kaynak-makineleri": "/images/home/jasic-lazer-kaynak.webp",
};

/** Kategori cizimi ya da gecici seri fotografi gercek urun fotografi sayilmaz. */
const isRealPhoto = (url?: string) =>
  !!url && !url.startsWith("/images/categories/") && !url.includes("gecici") && !url.startsWith("data:image/svg");

/** Kategorinin kart gorseli: ozel gorsel, yoksa kategoride fotografi olan ilk urun, yoksa kategorinin cizimi. */
function cardImage(slug: string, products: Product[], fallback?: string): string | undefined {
  if (CARD_PHOTO[slug]) return CARD_PHOTO[slug];
  const photo = products.map((p) => p.images[0]?.url).find(isRealPhoto);
  return photo ?? products[0]?.images[0]?.url ?? fallback;
}

const OTHER_SECTIONS: TopLevelSection[] = ["guvenlik", "aksesuarlar", "dolgu-metalleri"];

/**
 * KATEGORI KARTLARI (urun listesi yerine)
 *
 * Ekipmanlar bolumunun kategorileri, panelde verilen sirayla (grup, sonra
 * kategori) kart olarak dizilir; kart kategorinin sayfasina gider. Altinda
 * diger uc bolumun (Guvenlik, Aksesuarlar, Dolgu Metalleri) genis kartlari.
 */
export function CategoryShowcase() {
  const t = useT();
  const db = useDatabase();

  const { categories, sections } = useMemo(() => {
    const visible = listProducts(db);
    const groupOrder = new Map(db.categoryGroups.map((g) => [`${g.section}/${g.slug}`, g.order]));
    const categories = db.categories
      .filter((c) => c.section === "ekipmanlar")
      .sort(
        (a, b) =>
          (groupOrder.get(`${a.section}/${a.group}`) ?? 0) - (groupOrder.get(`${b.section}/${b.group}`) ?? 0) ||
          a.order - b.order,
      )
      .map((c) => {
        const products = visible.filter((p) => p.categorySlug === c.slug);
        return { id: c.id, name: c.name, href: categoryHref(c), count: products.length, image: cardImage(c.slug, products, c.image) };
      });
    const sections = OTHER_SECTIONS.map((section) => {
      const groups = db.categoryGroups.filter((g) => g.section === section).sort((a, b) => a.order - b.order);
      return {
        section,
        title: SECTION_TITLES[section],
        groups: groups.map((g) => g.name),
        count: db.categories.filter((c) => c.section === section).length,
        image: groups[0]?.image,
      };
    });
    return { categories, sections };
  }, [db]);

  return (
    <section className="bg-white">
      <div className="zw-container zw-section">
        <SectionTitle eyebrow={t.home.categoriesEyebrow} title={t.home.categoriesTitle} subtitle={t.home.categoriesSubtitle} />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={c.href}
                className="zw-cat-card group relative flex h-full flex-col overflow-hidden rounded-[6px] bg-zw-grey-100 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_44px_-16px_rgb(20_22_25/0.35)] sm:p-5 zw-focus"
              >
                <div className="flex items-start justify-between text-xs font-semibold text-zw-grey-500">
                  <span className="font-display text-sm font-bold text-zw-red-600">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t.home.categoryCount.replace("{count}", String(c.count))}</span>
                </div>
                <div className="relative mx-auto my-3 flex aspect-[4/3] w-full items-center justify-center sm:my-4">
                  <ProductImage
                    src={c.image}
                    alt=""
                    label={c.name}
                    className="max-h-full max-w-[86%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.07]"
                  />
                </div>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <h3 className="min-w-0 font-display text-base font-bold uppercase leading-[1.05] text-zw-ink sm:text-[22px]">{c.name}</h3>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zw-grey-300 text-zw-ink transition-colors group-hover:border-zw-red-600 group-hover:bg-zw-red-600 group-hover:text-white">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-zw-red-600 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Diger bolumler: genis, koyu kartlar */}
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 md:grid-cols-3">
          {sections.map((s) => (
            <li key={s.section}>
              <Link
                href={`/${s.section}`}
                className="group relative flex h-full items-center gap-4 overflow-hidden rounded-[6px] bg-zw-ink p-5 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-16px_rgb(20_22_25/0.6)] zw-focus"
              >
                <span className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-white/95">
                  <ProductImage src={s.image} alt="" label={s.title} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl font-bold uppercase leading-none">{s.title}</span>
                  <span className="mt-1.5 block truncate text-xs text-white/60">{s.groups.join(" · ")}</span>
                  <span className="mt-1 block text-xs font-semibold text-zw-red-400">
                    {t.home.sectionCardText.replace("{count}", String(s.count))}
                  </span>
                </span>
                <ArrowUpRight size={20} className="shrink-0 text-white/50 transition-colors group-hover:text-white" />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-zw-red-600 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Anasayfa bolum basligi: kirmizi cizgili ust yazi, buyuk baslik, aciklama, sagda baglanti. */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
  dark,
}: {
  eyebrow: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-zw-red-600">
          <span className="h-[2px] w-8 bg-zw-red-600" />
          {eyebrow}
        </div>
        <h2 className={`mt-3 font-display text-4xl font-bold uppercase leading-[0.95] sm:text-5xl ${dark ? "text-white" : "text-zw-ink"}`}>
          {title}
        </h2>
        {subtitle && <p className={`mt-3 ${dark ? "text-white/70" : "text-zw-grey-600"}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
