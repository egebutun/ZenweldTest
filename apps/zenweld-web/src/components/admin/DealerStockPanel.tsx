"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { listDealers, setDealerStock, useDatabase } from "@zenweld/store";
import { Button, Input, ProductImage, Select } from "@zenweld/ui";

interface StockRow {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  variant?: string;
  sku: string;
  image?: string;
}

/**
 * STOK MATRISI > FIZIKSEL BAYILER
 *
 * Secilen bayide hangi urunlerin stokta oldugunu isaretlersiniz. Urun
 * sayfasindaki "Stoktaki Bayileri Gor" haritasi ve "yalnizca bu urunu
 * bulunduranlar" filtresi bu kayitlari kullanir.
 *
 * Secenekli urunlerde (3 m / 5 m torc) her secenek ayri satirdir; bir
 * bayide 3 m bulunurken 5 m bulunmayabilir.
 */
export function DealerStockPanel() {
  const db = useDatabase();
  const dealers = listDealers(db);
  const [dealerId, setDealerId] = useState(dealers[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const rows = useMemo<StockRow[]>(
    () =>
      db.products
        .filter((p) => p.active)
        .flatMap((p) => {
          const base = { productId: p.id, name: p.name, sku: p.sku, image: p.images[0]?.url };
          const group = p.variantGroups?.[0];
          if (!group) return [{ ...base, key: p.id }];
          return group.options.map((o) => ({
            ...base,
            key: `${p.id}|${o.id}`,
            variantId: o.id,
            variant: `${group.label}: ${o.label}`,
            sku: o.sku ?? p.sku,
          }));
        }),
    [db],
  );

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = rows.filter(
    (r) =>
      !q ||
      r.name.toLocaleLowerCase("tr").includes(q) ||
      r.sku.toLocaleLowerCase("tr").includes(q),
  );

  // "bayi|urun|secenek" -> stokta. Her satirda tum kayitlari taramamak icin.
  const stocked = useMemo(
    () =>
      new Set(
        db.dealerStock
          .filter((s) => s.inStock)
          .map((s) => `${s.dealerId}|${s.productId}|${s.variantId ?? ""}`),
      ),
    [db],
  );

  // Seceneksiz kayit urunun tum secenekleri icin gecerlidir.
  const inStock = (row: StockRow, dealer = dealerId) =>
    stocked.has(`${dealer}|${row.productId}|`) ||
    (row.variantId !== undefined && stocked.has(`${dealer}|${row.productId}|${row.variantId}`));

  const dealerCount = (row: StockRow) => dealers.filter((d) => inStock(row, d.id)).length;
  const stockedHere = rows.filter((r) => inStock(r)).length;
  const dealer = dealers.find((d) => d.id === dealerId);

  const bulk = (value: boolean) =>
    setDealerStock(
      dealerId,
      visible.map((r) => ({ productId: r.productId, variantId: r.variantId })),
      value,
    );

  if (!dealer) {
    return <p className="text-sm text-zw-grey-500">Aktif bayi yok. Önce Bayiler sayfasından bayi ekleyin.</p>;
  }

  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-[320px_1fr_auto]">
        <Select value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.city}
            </option>
          ))}
        </Select>
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı veya SKU ara…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => bulk(true)}>
            Listelenenleri işaretle
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk(false)}>
            Listelenenleri temizle
          </Button>
        </div>
      </div>

      <p className="mb-3 text-sm text-zw-grey-600">
        <strong>{dealer.name}</strong> ({dealer.district} / {dealer.city}): {stockedHere} / {rows.length} satır stokta.
      </p>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3 text-center">Bu bayide stokta</th>
              <th className="px-4 py-3 text-center">Toplam bayi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {visible.map((r) => {
              const on = inStock(r);
              const count = dealerCount(r);
              return (
                <tr key={r.key}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={r.image}
                        alt={r.name}
                        label={r.name}
                        className="h-9 w-9 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{r.name}</div>
                        <div className="text-xs text-zw-grey-500">
                          {r.sku}
                          {r.variant && ` · ${r.variant}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() =>
                        setDealerStock(dealerId, [{ productId: r.productId, variantId: r.variantId }], !on)
                      }
                      aria-label={`${r.name}${r.variant ? ` (${r.variant})` : ""} — ${dealer.name}`}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-[3px] border transition-colors ${
                        on
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zw-grey-300 bg-white text-zw-grey-300 hover:border-zw-grey-500"
                      }`}
                    >
                      {on ? <Check size={16} /> : <X size={14} />}
                    </button>
                  </td>
                  <td className={`px-4 py-2.5 text-center text-xs ${count === 0 ? "font-semibold text-amber-600" : "text-zw-grey-600"}`}>
                    {count} bayi
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
