"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { stockForRetailer, useDatabase } from "@zenweld/store";
import { EmptyState, Input, Select } from "@zenweld/ui";
import { ShopProductCard } from "@/components/ShopProductCard";
import { useLocale, useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";
import { trNormalize } from "@/lib/tr-normalize";

function StoreInner() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [group, setGroup] = useState(params.get("grup") ?? "");
  const [sort, setSort] = useState("featured");
  const [onlyInStock, setOnlyInStock] = useState(true);

  const stockMap = useMemo(
    () => new Map(stockForRetailer(STORE.retailerId, db).map((s) => [s.productId, s])),
    [db],
  );

  const groups = db.categoryGroups;

  const products = useMemo(() => {
    const q = trNormalize(query);
    const list = db.products.filter((p) => {
      if (!p.active) return false;
      const stock = stockMap.get(p.id);
      if (onlyInStock && !stock?.inStock) return false;
      if (group) {
        const category = db.categories.find((c) => c.slug === p.categorySlug);
        if (category?.group !== group) return false;
      }
      if (q) {
        const haystack = trNormalize(`${p.name} ${p.sku} ${p.shortDescription[locale]}`);
        if (!q.split(" ").every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    const sorted = [...list];
    const priceOf = (id: string, fallback: number) => stockMap.get(id)?.price ?? fallback;
    if (sort === "priceAsc")
      sorted.sort((a, b) => priceOf(a.id, a.priceExVat) - priceOf(b.id, b.priceExVat));
    if (sort === "priceDesc")
      sorted.sort((a, b) => priceOf(b.id, b.priceExVat) - priceOf(a.id, a.priceExVat));
    if (sort === "nameAsc") sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    if (sort === "featured") sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    return sorted;
  }, [db, stockMap, query, group, sort, onlyInStock, locale]);

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase">
        {group ? groups.find((g) => g.slug === group)?.name[locale] : "Tüm Ürünler"}
      </h1>

      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <Select value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">Tüm kategoriler</option>
          {groups.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.name[locale]}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">{t.filters.sortFeatured}</option>
          <option value="priceAsc">{t.filters.sortPriceAsc}</option>
          <option value="priceDesc">{t.filters.sortPriceDesc}</option>
          <option value="nameAsc">{t.filters.sortNameAsc}</option>
        </Select>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-zw-grey-600">
        <input
          type="checkbox"
          className="h-4 w-4 accent-zw-red-600"
          checked={onlyInStock}
          onChange={(e) => setOnlyInStock(e.target.checked)}
        />
        {t.filters.inStockOnly}
      </label>

      <p className="mt-4 text-sm text-zw-grey-600">
        {t.filters.productCount.replace("{count}", String(products.length))}
      </p>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState title={t.search.noResultsTitle} text={t.search.noResultsText} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ShopProductCard key={p.id} product={p} stock={stockMap.get(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={<div className="zw-container py-20">…</div>}>
      <StoreInner />
    </Suspense>
  );
}
