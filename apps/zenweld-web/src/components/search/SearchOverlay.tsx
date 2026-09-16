"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package, FolderOpen, FileText, File } from "lucide-react";
import { useSearch } from "@/lib/search/use-search";
import { useHref, useLocale, useT } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { ProductImage } from "@/components/common/ProductImage";
import type { SearchDocType } from "@/lib/search/search-client";

const ICONS: Record<SearchDocType, typeof Package> = {
  product: Package,
  category: FolderOpen,
  article: FileText,
  page: File,
};

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hits, suggestions } = useSearch(query, 24);

  const grouped = useMemo(() => {
    const groups: Record<SearchDocType, typeof hits> = {
      product: [],
      category: [],
      article: [],
      page: [],
    };
    hits.forEach((h) => groups[h.type].push(h));
    return groups;
  }, [hits]);

  const flat = useMemo(
    () => [...grouped.product, ...grouped.category, ...grouped.article, ...grouped.page],
    [grouped],
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    router.push(href(path));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (flat[activeIndex]) go(flat[activeIndex].href);
      else if (query.trim()) go(`/arama?q=${encodeURIComponent(query)}`);
    }
  };

  const sectionTitles: Record<SearchDocType, string> = {
    product: t.search.products,
    category: t.search.categories,
    article: t.search.articles,
    page: t.search.pages,
  };

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[300] bg-black/50" onClick={onClose}>
      <div
        className="mx-auto mt-0 w-full max-w-3xl bg-white shadow-2xl sm:mt-20 sm:rounded-[4px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zw-grey-200 px-4 py-3">
          <Search size={20} className="shrink-0 text-zw-grey-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            className="h-10 w-full border-0 text-base outline-none placeholder:text-zw-grey-400"
          />
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="shrink-0 rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-zw-grey-500">{t.search.hint}</p>
          )}

          {query.trim().length >= 2 && flat.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-lg font-semibold uppercase">
                {t.search.noResultsTitle}
              </p>
              <p className="mt-1 text-sm text-zw-grey-500">{t.search.noResultsText}</p>
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                    {t.search.didYouMean}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="rounded-full border border-zw-grey-300 px-3 py-1 text-sm hover:border-zw-red-600 hover:text-zw-red-600"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(["product", "category", "article", "page"] as SearchDocType[]).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const Icon = ICONS[type];
            return (
              <div key={type} className="border-b border-zw-grey-100 last:border-0">
                <div className="bg-zw-grey-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zw-grey-500">
                  {sectionTitles[type]}
                </div>
                {items.map((hit) => {
                  runningIndex++;
                  const isActive = runningIndex === activeIndex;
                  return (
                    <button
                      key={hit.id}
                      onClick={() => go(hit.href)}
                      onMouseEnter={() => setActiveIndex(flat.indexOf(hit))}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? "bg-zw-grey-100" : "hover:bg-zw-grey-50"
                      }`}
                    >
                      {hit.type === "product" ? (
                        <ProductImage
                          src={hit.image}
                          alt={hit.title}
                          label={hit.title}
                          className="h-11 w-11 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] bg-zw-grey-100 text-zw-grey-500">
                          <Icon size={18} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-zw-ink">
                          {hit.title}
                        </span>
                        <span className="block truncate text-xs text-zw-grey-500">
                          {hit.subtitle}
                        </span>
                      </span>
                      {hit.type === "product" && hit.price != null && (
                        <span className="shrink-0 text-sm font-semibold text-zw-ink">
                          {formatPrice(priceWithVat(hit.price, 20), locale)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {flat.length > 0 && (
            <button
              onClick={() => go(`/arama?q=${encodeURIComponent(query)}`)}
              className="w-full bg-zw-grey-50 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zw-red-600 hover:bg-zw-grey-100"
            >
              {t.common.viewAll} ({hits.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
