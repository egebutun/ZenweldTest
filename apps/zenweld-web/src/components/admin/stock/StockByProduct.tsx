"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { isInStock } from "@zenweld/data";
import { getStockSettings, listStockSources, stockOfProduct, useDatabase, useNow } from "@zenweld/store";
import { Input, ProductImage } from "@zenweld/ui";
import { SOURCE_TYPE_LABEL, ageText, productLabel, sourceParam } from "./shared";

/**
 * Stok Matrisi > Ürün Bazında: bir urun hangi bayide/saticida kac adet.
 * Yalnizca goruntuleme; duzeltme kaynagin kendi sayfasindan yapilir.
 */
export function StockByProduct({ initialProduct }: { initialProduct?: string }) {
  const db = useDatabase();
  const now = useNow().getTime();
  const { staleDays } = getStockSettings(db);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(initialProduct ?? null);
  const sources = useMemo(() => new Map(listStockSources(db).map((s) => [`${s.type}:${s.id}`, s])), [db]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.products
      .filter((p) => p.active)
      .filter((p) => !q || p.name.toLocaleLowerCase("tr").includes(q) || p.sku.toLocaleLowerCase("tr").includes(q))
      .map((p) => {
        const levels = stockOfProduct(p.id, db).filter((l) => sources.has(`${l.sourceType}:${l.sourceId}`));
        const live = levels.filter((l) => isInStock(l, staleDays, now));
        return {
          product: p,
          levels,
          dealers: new Set(live.filter((l) => l.sourceType === "dealer").map((l) => l.sourceId)).size,
          retailers: new Set(live.filter((l) => l.sourceType === "retailer").map((l) => l.sourceId)).size,
        };
      })
      .sort((a, b) => (a.product.id === initialProduct ? -1 : b.product.id === initialProduct ? 1 : a.product.name.localeCompare(b.product.name, "tr")));
  }, [db, query, sources, staleDays, now, initialProduct]);

  return (
    <>
      <div className="relative mb-4 sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı veya SKU ara…" className="pl-9" />
      </div>
      <p className="mb-3 text-xs text-zw-grey-500">
        “Sitede” sayıları: adedi 0’dan büyük ve son {staleDays || "∞"} gün içinde güncellenmiş kaynaklar.
      </p>

      <div className="overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3 text-right">Sitede: bayi</th>
              <th className="px-4 py-3 text-right">Sitede: online satıcı</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {rows.map(({ product, levels, dealers, retailers }) => {
              const expanded = open === product.id;
              return (
                <Fragment key={product.id}>
                  <tr className={`cursor-pointer hover:bg-zw-grey-50 ${product.id === initialProduct ? "bg-amber-50" : ""}`} onClick={() => setOpen(expanded ? null : product.id)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <ProductImage src={product.images[0]?.url} alt={product.name} label={product.name} className="h-9 w-9 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover" />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{product.name}</div>
                          <div className="text-xs text-zw-grey-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${dealers === 0 ? "text-amber-700" : ""}`}>{dealers}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${retailers === 0 ? "text-amber-700" : ""}`}>{retailers}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ChevronDown size={16} className={`inline transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={4} className="bg-zw-grey-50 px-4 py-3">
                        {levels.length === 0 ? (
                          <p className="text-sm text-zw-grey-500">Hiçbir bayi ya da satıcının listesinde yok.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <tbody className="divide-y divide-zw-grey-200">
                              {levels
                                .slice()
                                .sort((a, b) => b.quantity - a.quantity)
                                .map((l) => {
                                  const s = sources.get(`${l.sourceType}:${l.sourceId}`)!;
                                  const live = isInStock(l, staleDays, now);
                                  return (
                                    <tr key={`${l.sourceType}:${l.sourceId}:${l.variantId ?? ""}`}>
                                      <td className="py-1.5 pr-3">
                                        <Link href={`/yonetim/stok?kaynak=${sourceParam(l.sourceType, l.sourceId)}`} className="font-semibold hover:text-zw-red-600">
                                          {s.name}
                                        </Link>{" "}
                                        <span className="text-zw-grey-500">· {SOURCE_TYPE_LABEL[l.sourceType]}</span>
                                      </td>
                                      <td className="py-1.5 pr-3 text-zw-grey-600">{l.variantId ? productLabel(db, l.productId, l.variantId).replace(product.name, "").trim() : ""}</td>
                                      <td className="py-1.5 pr-3 text-right font-semibold">{l.quantity} adet</td>
                                      <td className="py-1.5 pr-3 text-zw-grey-500">{ageText(l.updatedAt, now)}</td>
                                      <td className={`py-1.5 text-right font-semibold ${live ? "text-emerald-700" : "text-zw-grey-400"}`}>
                                        {live ? "Sitede" : l.quantity > 0 ? "Eski · gizli" : "Stokta yok"}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

