"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { findProductById, useDatabase } from "@zenweld/store";
import { Button, EmptyState } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useSearch } from "@/lib/search/use-search";
import { useHref, useT } from "@/lib/i18n-client";

function SearchPageInner() {
  const t = useT();
  const href = useHref();
  const router = useRouter();
  const params = useSearchParams();
  const db = useDatabase();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setInput(initial);
    setQuery(initial);
  }, [initial]);

  const { hits, suggestions } = useSearch(query, 60);

  const productHits = hits.filter((h) => h.type === "product");
  const otherHits = hits.filter((h) => h.type !== "product");

  const products = productHits
    .map((h) => findProductById(h.id.replace("product:", ""), db))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase">{t.search.title}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input);
          router.replace(href(`/arama?q=${encodeURIComponent(input)}`));
        }}
        className="mt-5 flex max-w-2xl gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400"
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.search.placeholder}
            className="h-12 w-full rounded-[4px] border border-zw-grey-300 pl-10 pr-4 text-sm outline-none focus:border-zw-ink"
          />
        </div>
        <Button type="submit" size="lg">
          {t.common.search}
        </Button>
      </form>

      <p className="mt-3 text-xs text-zw-grey-500">{t.search.hint}</p>

      {query.trim().length >= 2 && (
        <p className="mt-6 text-sm text-zw-grey-600">
          {t.search.resultsFor
            .replace("{query}", query)
            .replace("{count}", String(hits.length))}
        </p>
      )}

      {hits.length === 0 && query.trim().length >= 2 && (
        <div className="mt-8">
          <EmptyState
            icon={<Search size={40} />}
            title={t.search.noResultsTitle}
            text={t.search.noResultsText}
            action={
              suggestions.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        setQuery(s);
                      }}
                      className="rounded-full border border-zw-grey-300 px-3 py-1 text-sm hover:border-zw-red-600 hover:text-zw-red-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : undefined
            }
          />
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-2xl font-bold uppercase">{t.search.products}</h2>
          <ProductGrid products={products} />
        </div>
      )}

      {otherHits.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-bold uppercase">{t.search.pages}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherHits.map((hit) => (
              <LocaleLink
                key={hit.id}
                href={hit.href}
                className="flex items-center gap-3 rounded-[4px] border border-zw-grey-200 p-3 transition-colors hover:border-zw-ink"
              >
                {hit.image ? (
                  <ProductImage
                    src={hit.image}
                    alt={hit.title}
                    label={hit.title}
                    className="h-12 w-12 shrink-0 rounded-[3px] object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[3px] bg-zw-grey-100 text-zw-grey-500">
                    <Search size={18} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{hit.title}</span>
                  <span className="block truncate text-xs text-zw-grey-500">{hit.subtitle}</span>
                </span>
              </LocaleLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="zw-container py-20">…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
