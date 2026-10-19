"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { findStockSource, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { StockByProduct } from "@/components/admin/stock/StockByProduct";
import { StockSourceDetail } from "@/components/admin/stock/StockSourceDetail";
import { StockSources } from "@/components/admin/stock/StockSources";
import { parseSourceParam } from "@/components/admin/stock/shared";

/**
 * STOK MATRISI
 *
 * Bayiler ve online saticilar her gun SKU + adet listesi gonderir; liste
 * burada her kaynagin sayfasindan (CSV / XLSX) yuklenir. Urun sayfasindaki
 * "online saticilar" ve "stoktaki bayiler" bu verilerden gelir: adet > 0
 * ve stok, ayarlanan gun sayisindan eski degil.
 *
 *   /yonetim/stok                        bayi ve saticilar (durum listesi)
 *   /yonetim/stok?kaynak=dealer:<id>     kaynagin stok listesi, yukleme, gecmis
 *   /yonetim/stok?sekme=urun[&urun=<id>] urun bazinda gorunum
 *
 * Zenweld'in kendi deposu burada yok: sitede her urun her zaman satista.
 */
function StockPageInner() {
  const db = useDatabase();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sourceRef = parseSourceParam(params.get("kaynak"));
  if (sourceRef) {
    const source = findStockSource(sourceRef.type, sourceRef.id, db);
    return source ? <StockSourceDetail key={`${source.type}:${source.id}`} source={source} /> : <Alert tone="danger">Bayi/satıcı bulunamadı.</Alert>;
  }

  const tab = params.get("sekme") === "urun" ? "urun" : "kaynaklar";
  const tabs = [
    { id: "kaynaklar", label: "Bayi ve Satıcılar" },
    { id: "urun", label: "Ürün Bazında" },
  ] as const;

  return (
    <>
      <AdminPageHeader
        title="Stok Matrisi"
        description="Bayilerin ve online satıcıların gönderdiği stok listeleri. Dosyayı ilgili bayinin/satıcının sayfasından yükleyin."
      />
      <div className="mb-5 flex gap-1 border-b border-zw-grey-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.replace(t.id === "kaynaklar" ? pathname : `${pathname}?sekme=urun`)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t.id ? "border-zw-red-600 text-zw-ink" : "border-transparent text-zw-grey-500 hover:text-zw-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "urun" ? <StockByProduct initialProduct={params.get("urun") ?? undefined} /> : <StockSources />}
    </>
  );
}

export default function AdminStockPage() {
  return (
    <Suspense fallback={<div className="py-10 text-zw-grey-500">Yükleniyor…</div>}>
      <StockPageInner />
    </Suspense>
  );
}
