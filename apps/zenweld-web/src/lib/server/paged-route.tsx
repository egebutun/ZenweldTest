import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { pageCount, parsePageNumber } from "@zenweld/data";
import { pagedMetadata } from "@/lib/seo";
import { usesDatabase } from "./db";

/**
 * SAYFALI LISTENIN 2. VE SONRAKI SAYFALARI (KARARLAR K-124)
 *
 *   app/(site)/haberler/sayfa/[sayfa]/page.tsx
 *
 * - Sayfalar onceden hazirlanir (sunucunun bildigi kayit sayisina gore);
 *   panelde eklenen kayitla olusan yeni sayfa ilk istekte hazirlanir.
 * - Sayi olmayan ya da 2'den kucuk sayfa 404 ("/sayfa/1" next.config'de
 *   listenin adresine yonlenir). Veritabani modunda kayit sayisinin
 *   disindaki sayfa 404 doner. Demo modunda panelde eklenen kayitlar
 *   yalnizca tarayicida oldugu icin sinir disi sayfayi tarayicidaki liste
 *   cozer ("Bu sayfada kayit yok").
 */
export function pagedRoute<P extends { sayfa: string }>(options: {
  /** Listenin 1. sayfasinin adresi (parametrelerden) */
  basePath: (params: P) => string;
  perPage: number;
  /** Sunucunun bildigi kayit sayisi; liste yoksa null (404) */
  count: (params: P) => Promise<number | null>;
  /** 1. sayfanin sayfa bilgileri (baslik, aciklama, asil adres) */
  metadata: (params: P) => Promise<Metadata>;
  /** Parametreler (sayfa haric) ve kayit sayisi -> onceden hazirlanacak sayfalar */
  staticParams: () => Promise<{ params: Omit<P, "sayfa">; count: number }[]>;
  render: (params: P, page: number) => ReactNode;
}) {
  return {
    async generateStaticParams(): Promise<P[]> {
      const lists = await options.staticParams();
      return lists.flatMap(({ params, count }) =>
        Array.from({ length: pageCount(count, options.perPage) - 1 }, (_, i) => ({ ...params, sayfa: String(i + 2) }) as P),
      );
    },

    async generateMetadata({ params }: { params: Promise<P> }): Promise<Metadata> {
      const p = await params;
      const page = parsePageNumber(p.sayfa) ?? 1;
      return pagedMetadata(await options.metadata(p), options.basePath(p), page);
    },

    async Page({ params }: { params: Promise<P> }) {
      const p = await params;
      const page = parsePageNumber(p.sayfa);
      if (!page || page < 2) notFound();
      if (usesDatabase()) {
        const count = await options.count(p);
        if (count === null || page > pageCount(count, options.perPage)) notFound();
      }
      return options.render(p, page);
    },
  };
}
