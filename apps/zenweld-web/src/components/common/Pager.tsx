"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pagePath } from "@zenweld/data";
import { useT } from "@/lib/i18n-client";

/**
 * SITEDEKI LISTELERIN SAYFA NUMARALARI (KARARLAR K-124)
 *
 * Tek sayfalik listede gorunmez. Numaralar gercek baglantidir (arama
 * motoru sonraki sayfalardaki kayitlari bu baglantilardan bulur). Sayfa
 * adresi "<liste>/sayfa/<n>"; `hrefFor` verilirse o kullanilir (arama
 * sonuclari: "?sayfa=<n>"). `query` (ornegin kategori filtreleri)
 * baglantilara eklenir.
 */
export function Pager({
  page,
  pageCount,
  basePath,
  query = "",
  hrefFor,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  query?: string;
  hrefFor?: (page: number) => string;
}) {
  const t = useT();
  if (pageCount <= 1) return null;
  const href = (n: number) => hrefFor?.(n) ?? `${pagePath(basePath, n)}${query}`;
  const numbers = visiblePages(page, pageCount);
  const arrow = "flex h-10 w-10 items-center justify-center rounded-[4px] border border-zw-grey-200";

  return (
    <nav aria-label={t.pagination.label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" aria-label={t.pagination.previous} className={`${arrow} hover:border-zw-grey-500`}>
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} text-zw-grey-300`}>
          <ChevronLeft size={18} />
        </span>
      )}
      {numbers.map((n, i) =>
        n === null ? (
          <span key={`bos-${i}`} className="px-1 text-zw-grey-400">
            …
          </span>
        ) : n === page ? (
          <span
            key={n}
            aria-current="page"
            className="flex h-10 min-w-10 items-center justify-center rounded-[4px] border-2 border-zw-red-600 bg-zw-red-50 px-3 font-semibold"
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-label={t.pagination.page.replace("{page}", String(n))}
            className="flex h-10 min-w-10 items-center justify-center rounded-[4px] border border-zw-grey-200 px-3 font-semibold hover:border-zw-grey-500"
          >
            {n}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" aria-label={t.pagination.next} className={`${arrow} hover:border-zw-grey-500`}>
          <ChevronRight size={18} />
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} text-zw-grey-300`}>
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}

/** Gosterilen numaralar: ilk, son, bulunulan ve iki yanindaki; aralar "…" (null). */
function visiblePages(page: number, pageCount: number): (number | null)[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...shown].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

/** Sinirin disindaki sayfa (tarayicidaki veriyle): bos durum ve 1. sayfaya baglanti. */
export function EmptyPage({ basePath }: { basePath: string }) {
  const t = useT();
  return (
    <div className="py-16 text-center">
      <p className="text-zw-grey-600">{t.pagination.empty}</p>
      <Link href={basePath} className="mt-4 inline-block font-semibold text-zw-red-600 hover:underline">
        {t.pagination.first}
      </Link>
    </div>
  );
}
