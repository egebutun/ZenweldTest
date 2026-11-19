"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageOpen, SlidersHorizontal, X } from "lucide-react";
import {
  PRODUCTS_PER_PAGE,
  applyFilterSelection,
  categoryHref,
  filterFacets,
  pageCount,
  pageItems,
  selectionFromQuery,
  writeSelectionToQuery,
  type FilterSelection,
  type TopLevelSection,
} from "@zenweld/data";
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
import { EmptyPage, Pager } from "@/components/common/Pager";

interface ListingProps {
  section: TopLevelSection;
  categorySlug: string;
  /** Sayfa (adresteki /sayfa/<n>); filtre degisince 1. sayfaya donulur */
  page?: number;
}

/**
 * Kategori sayfasi (/ekipmanlar/kaynak-makineleri/mma-...): kategorinin urunleri. Ayni
 * gruptaki diger kategoriler gosterilmez; her kategorinin kendi filtreleri
 * vardir (Category.filters). Filtre secimi adrese yazilir
 * (?calisma-modu=puls); arama motoruna sayfa filtresiz adresle gider.
 * Sayfa basina 24 urun; sonraki sayfalar /…/sayfa/<n>, filtreler sayfa
 * baglantilarinda korunur (K-124).
 */
export function CategoryListing({ section, categorySlug, page: initialPage = 1 }: ListingProps) {
  const t = useT();
  const db = useDatabase();
  const now = useNow();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(initialPage);
  // Adresin sorgu kismi; secim bundan kategorinin filtrelerine gore okunur
  // (panelde eklenen filtre tarayicidaki veri yuklenince taninir).
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(window.location.search), []);

  const category = useMemo(
    () => db.categories.find((c) => c.slug === categorySlug),
    [db, categorySlug],
  );

  const scoped = useMemo(
    () => listProducts(db).filter((p) => p.section === section && p.categorySlug === categorySlug),
    [db, section, categorySlug],
  );

  const categoryFilters = useMemo(() => category?.filters ?? [], [category]);
  const selection = useMemo(
    () => selectionFromQuery(new URLSearchParams(query), categoryFilters),
    [query, categoryFilters],
  );
  const facets = useMemo(() => filterFacets(categoryFilters, scoped, selection), [categoryFilters, scoped, selection]);
  const filtered = useMemo(
    () => applyFilters(applyFilterSelection(scoped, categoryFilters, selection), filters, now),
    [scoped, categoryFilters, selection, filters, now],
  );

  const basePath = category ? categoryHref(category) : "";
  const shown = pageItems(filtered, page, PRODUCTS_PER_PAGE);

  // Secim adrese yazilir: link paylasilinca ve geri donulunce ayni secimle
  // acilir. Secim degisince liste 1. sayfaya doner.
  const select = (next: FilterSelection) => {
    const url = new URL(window.location.href);
    url.search = writeSelectionToQuery(url.searchParams, next, categoryFilters).toString();
    if (page > 1 && basePath) url.pathname = basePath;
    window.history.replaceState(null, "", url);
    setQuery(url.search);
    setPage(1);
  };
  const changeFilters = (next: FilterState) => {
    if (page > 1 && basePath) window.history.replaceState(null, "", `${basePath}${window.location.search}`);
    setPage(1);
    setFilters(next);
  };
  const toggleValue = (filterId: string, valueId: string) => {
    const own = selection[filterId] ?? [];
    select({ ...selection, [filterId]: own.includes(valueId) ? own.filter((v) => v !== valueId) : [...own, valueId] });
  };
  const clear = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    select({});
  };
  const panelProps = {
    value: filters,
    onChange: changeFilters,
    resultCount: filtered.length,
    facets,
    onToggleValue: toggleValue,
    onClear: clear,
  };

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
              <ProductFilters {...panelProps} />
            </div>
          </aside>

          <div>
            {/* Kategoride hic urun yoksa "sonuc bulunamadi" (arama dili)
                yerine durumu dogru anlatan mesaj. */}
            {scoped.length === 0 ? (
              <EmptyState icon={<PackageOpen size={40} />} title={t.nav.menuEmptyCategory} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<SlidersHorizontal size={40} />}
                title={t.filters.noMatch}
                action={
                  <Button variant="outline" onClick={clear}>
                    {t.filters.clear}
                  </Button>
                }
              />
            ) : page > 1 && shown.length === 0 ? (
              <EmptyPage basePath={basePath} />
            ) : (
              <ProductGrid products={shown} />
            )}
            <Pager page={page} pageCount={pageCount(filtered.length, PRODUCTS_PER_PAGE)} basePath={basePath} query={query} />
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
            <ProductFilters {...panelProps} showTitle={false} />
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
