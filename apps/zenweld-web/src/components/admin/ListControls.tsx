"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { downloadCsv } from "@zenweld/store";
import { Input } from "@zenweld/ui";
import { PANEL_PAGE_SIZE, pageWindow } from "@zenweld/utils";
import type { CsvRow } from "@/lib/admin-csv";
import type { ParamReader } from "@/lib/admin-lists";

/**
 * PANEL LISTELERI — ADRESTEKI SUZGECLER, ARAMA KUTUSU, SAYFA DUGMELERI
 *
 * Suzgec ve sayfa adreste durur (lib/admin-lists.ts). Suzgec degisince
 * sayfa 1'e doner. Veritabani modunda adres degisince sunucu yeni sayfayi
 * okur; yanit gelene kadar pending true'dur (liste soluk gorunur).
 */
export function useListQuery() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const get: ParamReader = (name) => params.get(name)?.trim().slice(0, 100) || undefined;

  /** Ayni suzgeclerle, verilen degisikliklerle adres. Sayfa verilmezse 1. sayfa. */
  const hrefWith = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    if (!("sayfa" in changes)) next.delete("sayfa");
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const text = next.toString();
    return text ? `${pathname}?${text}` : pathname;
  };

  /** Suzgeci degistirir; arama kutusu gecmise her harfi yazmasin diye replace kullanir. */
  const go = (changes: Record<string, string | undefined>, replace = false) => {
    const href = hrefWith(changes);
    startTransition(() => (replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false })));
  };

  return { get, hrefWith, go, pending, query: params.toString() };
}

/**
 * CSV indir: suzgece uyan kayitlarin tamami. Veritabani modunda satirlar
 * sunucudan gelir (GET /api/yonetim/csv/<liste>?<suzgecler>); demo modunda
 * rows verilir. Basarisizsa hata metni doner.
 */
export async function downloadListCsv(
  file: string,
  source: { rows: CsvRow[] } | { list: string; query: string },
): Promise<string | null> {
  let rows: CsvRow[];
  if ("rows" in source) rows = source.rows;
  else {
    const response = await fetch(`/api/yonetim/csv/${source.list}?${source.query}`).catch(() => null);
    const body = response?.ok ? ((await response.json()) as { rows?: CsvRow[] }) : null;
    if (!body?.rows) return "CSV hazırlanamadı. Sayfayı yenileyip tekrar deneyin.";
    rows = body.rows;
  }
  // Kayit yoksa dosya inmez (onceki gibi).
  downloadCsv(rows, file);
  return null;
}

/** Arama kutusu: yazmayi birakinca (0,3 sn) adrese yazar. */
export function ListSearch({
  value,
  onSearch,
  placeholder,
  label,
  className = "w-full sm:w-72",
}: {
  value?: string;
  onSearch: (value: string | undefined) => void;
  placeholder: string;
  label: string;
  /** Kutunun genisligi */
  className?: string;
}) {
  const [text, setText] = useState(value ?? "");
  // Adrese en son yazilan arama. Sunucunun yaniti gelirken yazmaya devam
  // edilirse kutu eski degere donmesin diye yalnizca baska bir deger
  // gelince (geri tusu) kutu adresten guncellenir.
  const last = useRef(value ?? "");
  const search = useEffectEvent((q: string) => onSearch(q || undefined));

  useEffect(() => {
    if ((value ?? "") === last.current) return;
    last.current = value ?? "";
    setText(value ?? "");
  }, [value]);

  useEffect(() => {
    const q = text.trim();
    if (q === last.current) return;
    const timer = setTimeout(() => {
      last.current = q;
      search(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
      <Input
        type="search"
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

/** "51–100 / 133" ve Onceki / Sonraki baglantilari (tek sayfada yalnizca sayi). */
export function ListPager({
  page,
  total,
  hrefFor,
}: {
  page: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const { pageCount } = pageWindow(total, page);
  const from = (page - 1) * PANEL_PAGE_SIZE + 1;
  const to = Math.min(page * PANEL_PAGE_SIZE, total);
  return (
    <nav aria-label="Sayfalar" className="mt-4 flex flex-wrap items-center gap-4 text-sm">
      <span className="text-zw-grey-600">
        {from}–{to} / {total}
      </span>
      {pageCount > 1 && (
        <>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} scroll={false} className="font-semibold text-zw-red-700 hover:underline">
              ← Önceki
            </Link>
          ) : (
            <span className="font-semibold text-zw-grey-300">← Önceki</span>
          )}
          <span className="text-zw-grey-600">
            Sayfa {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} scroll={false} className="font-semibold text-zw-red-700 hover:underline">
              Sonraki →
            </Link>
          ) : (
            <span className="font-semibold text-zw-grey-300">Sonraki →</span>
          )}
        </>
      )}
    </nav>
  );
}
