"use client";

import { useMemo, useState } from "react";
import { PackageOpen, SlidersHorizontal, X } from "lucide-react";
import type { TopLevelSection } from "@zenweld/data";
import { listProducts, useDatabase, useNow } from "@zenweld/store";
import { Button, EmptyState } from "@zenweld/ui";
import { ProductGrid } from "./ProductGrid";
import {
  applyFilters,
  DEFAULT_FILTERS,
  ProductFilters,
  type FilterState,
} from "./ProductFilters";
import { useT } from "@/lib/i18n-client";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { catalogTrail } from "@/lib/catalog";
import { CatalogAbout } from "./CatalogAbout";

interface ListingProps {
  section: TopLevelSection;
  categorySlug: string;
}

/**
 * Kategori sayfasi (/ekipmanlar/kaynak-makineleri/mma-...): kategorinin urunleri. Ayni
 * gruptaki diger kategoriler gosterilmez; her kategorinin ileride kendi
 * filtreleri olacak.
 */
export function CategoryListing({ section, categorySlug }: ListingProps) {
  const t = useT();
  const db = useDatabase();
  const now = useNow();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = useMemo(
    () => db.categories.find((c) => c.slug === categorySlug),
    [db, categorySlug],
  );

  const scoped = useMemo(
    () => listProducts(db).filter((p) => p.section === section && p.categorySlug === categorySlug),
    [db, section, categorySlug],
  );


  const filtered = useMemo(() => applyFilters(scoped, filters, now), [scoped, filters, now]);

  const title = category?.name ?? "";
  const description = category?.description ?? "";
  const trail = catalogTrail(
    section,
    { categorySlug },
    { categories: db.categories, groups: db.categoryGroups },
  ).slice(0, -1);

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container pb-10 pt-4">
          <Breadcrumbs trail={trail} current={title} />
          <h1 className="mt-6 font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-zw-grey-600">{description}</p>
        </div>
      </div>


      <div className="zw-container py-8">
        <div className="mb-5 lg:hidden">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal size={17} />}
          >
            {t.filters.title} ({filtered.length})
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ProductFilters
                value={filters}
                onChange={setFilters}
                resultCount={filtered.length}
              />
            </div>
          </aside>

          <div>
            {/* Kategoride hic urun yoksa "sonuc bulunamadi" (arama dili)
                yerine durumu dogru anlatan mesaj. */}
            {scoped.length === 0 ? (
              <EmptyState icon={<PackageOpen size={40} />} title={t.nav.menuEmptyCategory} />
            ) : (
              <ProductGrid products={filtered} />
            )}
          </div>
        </div>
      </div>

      <CatalogAbout name={title} text={category?.aboutText} />

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[8px] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase">{t.filters.title}</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label={t.common.close}>
                <X size={22} />
              </button>
            </div>
            <ProductFilters
              value={filters}
              onChange={setFilters}
              resultCount={filtered.length}
            />
            <Button
              fullWidth
              className="mt-6"
              onClick={() => setMobileFiltersOpen(false)}
            >
              {t.filters.productCount.replace("{count}", String(filtered.length))}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
