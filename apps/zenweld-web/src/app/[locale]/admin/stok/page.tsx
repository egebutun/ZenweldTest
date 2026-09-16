"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Search, Upload, X } from "lucide-react";
import {
  applyStockCsv,
  bulkSetRetailerStock,
  getRetailerStock,
  parseStockCsv,
  setRetailerStock,
  useDatabase,
} from "@zenweld/store";
import { Alert, Badge, Button, Input, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ProductImage } from "@/components/common/ProductImage";
import { formatDateTime } from "@/lib/format";

/**
 * STOK MATRISI — Urun x Online Satici
 *
 * Bir urunun hangi online magazalarda stokta oldugunu buradan isaretlersiniz.
 * Isaretli olan satici, o urunun sayfasinda "Ayrica online alisveris olarak
 * surada da mevcuttur" bolumunde gorunur; isaretsiz olan gorunmez.
 */
function StockMatrixInner() {
  const db = useDatabase();
  const params = useSearchParams();

  const [query, setQuery] = useState("");
  const [focusRetailer, setFocusRetailer] = useState("");
  const [csvRetailer, setCsvRetailer] = useState("");
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(params.get("urun") ?? "");

  const retailers = useMemo(() => db.retailers.filter((r) => r.active), [db]);
  const visibleRetailers = focusRetailer
    ? retailers.filter((r) => r.id === focusRetailer)
    : retailers;

  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.products
      .filter((p) => p.active)
      .filter(
        (p) =>
          !q ||
          p.name.toLocaleLowerCase("tr").includes(q) ||
          p.sku.toLocaleLowerCase("tr").includes(q),
      );
  }, [db, query]);

  const onCsv = async (file: File) => {
    if (!csvRetailer) {
      setCsvResult("Önce CSV'nin ait olduğu satıcıyı seçin.");
      return;
    }
    const rows = parseStockCsv(await file.text());
    const applied = applyStockCsv(csvRetailer, rows);
    setCsvResult(
      `${applied} ürün güncellendi. ${rows.length - applied} satır eşleştirilemedi (SKU bulunamadı).`,
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Stok Matrisi"
        description="Her ürünün hangi online satıcıda stokta olduğunu işaretleyin. Yalnızca işaretli satıcılar ürün sayfasında görünür."
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı veya SKU ara…"
            className="pl-9"
          />
        </div>
        <Select
          value={focusRetailer}
          onChange={(e) => setFocusRetailer(e.target.value)}
          className="lg:w-64"
        >
          <option value="">Tüm satıcılar (matris)</option>
          {retailers.map((r) => (
            <option key={r.id} value={r.id}>
              Sadece: {r.name}
            </option>
          ))}
        </Select>

        {focusRetailer && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkSetRetailerStock(focusRetailer, products.map((p) => p.id), true)
              }
            >
              Tümünü işaretle
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkSetRetailerStock(focusRetailer, products.map((p) => p.id), false)
              }
            >
              Tümünü temizle
            </Button>
          </div>
        )}
      </div>

      <div className="mb-5 rounded-[4px] border border-zw-grey-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zw-grey-700">
          CSV ile toplu güncelleme
        </h2>
        <p className="mt-1 text-xs text-zw-grey-500">
          Bayiden gelen listeyi <code>sku;stok;adet;fiyat</code> biçiminde yükleyin. Stok
          sütununa <code>1 / var / evet</code> yazılabilir.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Select
            value={csvRetailer}
            onChange={(e) => setCsvRetailer(e.target.value)}
            className="sm:w-72"
          >
            <option value="">CSV hangi satıcıya ait?</option>
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
            <Upload size={16} />
            CSV Seç
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onCsv(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {csvResult && (
          <div className="mt-3">
            <Alert tone="info">{csvResult}</Alert>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="sticky left-0 z-10 bg-zw-grey-50 px-4 py-3 text-left">Ürün</th>
              {visibleRetailers.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center">
                  <div className="whitespace-nowrap">{r.logoText}</div>
                  {r.isOwnStore && (
                    <Badge tone="red" className="mt-1">
                      Kendi mağazamız
                    </Badge>
                  )}
                </th>
              ))}
              {focusRetailer && (
                <>
                  <th className="px-3 py-3 text-center">Adet</th>
                  <th className="px-3 py-3 text-center">Fiyat (₺)</th>
                  <th className="px-3 py-3 text-center">Güncelleme</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {products.map((p) => {
              const inStockCount = visibleRetailers.filter(
                (r) => getRetailerStock(p.id, r.id, db)?.inStock,
              ).length;
              return (
                <tr
                  key={p.id}
                  className={highlight === p.id ? "bg-amber-50" : undefined}
                  onClick={() => setHighlight("")}
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={p.images[0]?.url}
                        alt={p.name}
                        label={p.name}
                        className="h-9 w-9 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-xs text-zw-grey-500">
                          {p.sku}
                          <span
                            className={`ml-2 ${inStockCount === 0 ? "font-semibold text-amber-600" : ""}`}
                          >
                            {inStockCount} satıcıda stokta
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {visibleRetailers.map((r) => {
                    const stock = getRetailerStock(p.id, r.id, db);
                    const on = stock?.inStock ?? false;
                    return (
                      <td key={r.id} className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setRetailerStock(p.id, r.id, { inStock: !on })}
                          aria-label={`${p.name} — ${r.name}`}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-[3px] border transition-colors ${
                            on
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zw-grey-300 bg-white text-zw-grey-300 hover:border-zw-grey-500"
                          }`}
                        >
                          {on ? <Check size={16} /> : <X size={14} />}
                        </button>
                      </td>
                    );
                  })}

                  {focusRetailer && (
                    <>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          value={getRetailerStock(p.id, focusRetailer, db)?.quantity ?? ""}
                          onChange={(e) =>
                            setRetailerStock(p.id, focusRetailer, {
                              quantity: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-20 rounded-[3px] border border-zw-grey-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={getRetailerStock(p.id, focusRetailer, db)?.price ?? ""}
                          onChange={(e) =>
                            setRetailerStock(p.id, focusRetailer, {
                              price: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-28 rounded-[3px] border border-zw-grey-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-zw-grey-500">
                        {getRetailerStock(p.id, focusRetailer, db)?.updatedAt
                          ? formatDateTime(
                              getRetailerStock(p.id, focusRetailer, db)!.updatedAt,
                              "tr",
                            )
                          : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminStockPage() {
  return (
    <Suspense fallback={<div className="py-10 text-zw-grey-500">Yükleniyor…</div>}>
      <StockMatrixInner />
    </Suspense>
  );
}
