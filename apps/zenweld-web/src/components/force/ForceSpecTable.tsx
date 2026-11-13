"use client";

import { useState } from "react";
import { Check, Heart, X } from "lucide-react";
import type { Product } from "@zenweld/data";
import { isProductInStock, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { CardCartButton, ProductPrice } from "@/components/product/ProductCard";
import { useFavourites } from "@/lib/favourites";
import { FORCE_SHOWCASE, FORCE_SPEC_ROWS, type ForceMachine, type ForceMachineKey } from "@/lib/force";
import { useT } from "@/lib/i18n-client";

/**
 * FORCE TEKNIK OZELLIKLER (sayfanin en alti)
 *
 * Tanitilan dort makinenin katalogdaki teknik tablosu (degerler i18n ›
 * forcePage.machines[].specs; urun kayitlarindaki teknik ozellikler
 * kullanilmaz). Ustte makineler isaretlenir; tablo yalnizca isaretlenenleri
 * sayfadaki sirayla yan yana gosterir (acilista dordu de secili). Her
 * kolonun ustunde fotograf, tur ve ad (kolonu cikaran carpi), altinda urun
 * kaydindan fiyat, Sepete Ekle ve favori kalbi; urun yayinda degilse "—".
 * Telefonda tablo yana kayar; satir adlari solda sabit kalir.
 */
export function ForceSpecTable({ products }: { products: Record<ForceMachineKey, Product | undefined> }) {
  const f = useT().forcePage;
  const [picked, setPicked] = useState<ForceMachineKey[]>(() => FORCE_SHOWCASE.map((m) => m.key));

  const selected = FORCE_SHOWCASE.filter((m) => picked.includes(m.key));
  const toggle = (key: ForceMachineKey) =>
    setPicked((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  return (
    <div className="flex flex-col gap-6">
      {/* Makine secimi */}
      <div className="rounded-[6px] border border-zw-grey-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgb(20_22_25/0.35)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-xl font-bold uppercase text-zw-ink">{f.tablePick}</h3>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setPicked([])}
              className="text-sm font-semibold text-zw-grey-600 underline-offset-4 hover:text-zw-ink hover:underline"
            >
              {f.tableClear}
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FORCE_SHOWCASE.map((m) => {
            const on = picked.includes(m.key);
            return (
              <label
                key={m.key}
                className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-zw-red-600 ${
                  on ? "border-zw-ink bg-zw-ink text-white" : "border-zw-grey-300 text-zw-grey-800 hover:border-zw-ink"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(m.key)} className="sr-only" />
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${on ? "border-zw-red-500 bg-zw-red-600" : "border-current"}`}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {m.name}
              </label>
            );
          })}
        </div>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-[6px] border border-dashed border-zw-grey-300 bg-white px-6 py-12 text-center text-zw-grey-600">{f.tableEmpty}</p>
      ) : (
        <Table machines={selected} products={products} onRemove={toggle} />
      )}
    </div>
  );
}

function Table({
  machines,
  products,
  onRemove,
}: {
  machines: ForceMachine[];
  products: Record<ForceMachineKey, Product | undefined>;
  onRemove: (key: ForceMachineKey) => void;
}) {
  const f = useT().forcePage;

  const labelCell =
    "sticky left-0 z-10 w-[132px] border-r border-zw-grey-200 px-3 py-3.5 text-left align-top text-xs font-semibold uppercase tracking-[0.06em] text-zw-grey-500 sm:w-[210px] sm:px-6";
  const cell = "border-l border-zw-grey-100 px-4 py-3.5 align-top text-sm font-medium leading-snug text-zw-ink sm:px-6";

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-[6px] border border-zw-grey-200 bg-white shadow-[0_30px_80px_-40px_rgb(20_22_25/0.35)]">
      {/* Kolonlar esit; telefonda her kolon en az ~170 px, gerisi yana kayar. */}
      <table className="w-full table-fixed border-separate border-spacing-0 text-left" style={{ minWidth: 132 + machines.length * 170 }}>
        <thead>
          <tr>
            <th scope="col" className={`${labelCell} bg-white align-bottom`}>
              {f.tableModel}
            </th>
            {machines.map((m) => {
              const product = products[m.key];
              const head = (
                <>
                  <div className="flex h-28 items-end justify-center sm:h-36">
                    <ProductImage
                      src={m.image}
                      alt={m.name}
                      label={m.name}
                      className="max-h-28 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-36"
                    />
                  </div>
                  <span className="mt-4 block text-[11px] font-bold uppercase tracking-[0.16em] text-zw-red-600">{f.machines[m.key].method}</span>
                  <span data-model className="mt-1 block font-display text-xl font-bold leading-tight text-zw-ink group-hover:text-zw-red-600 sm:text-2xl">
                    {m.name}
                  </span>
                </>
              );
              return (
                <th key={m.key} scope="col" className={`${cell} relative bg-white pb-5 pt-4 text-left`}>
                  <button
                    type="button"
                    onClick={() => onRemove(m.key)}
                    aria-label={`${m.name}: ${f.tableRemove}`}
                    title={f.tableRemove}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-zw-grey-400 transition-colors hover:bg-zw-grey-100 hover:text-zw-ink"
                  >
                    <X size={16} />
                  </button>
                  {product ? (
                    <Link href={`/urun/${product.slug}`} className="group block">
                      {head}
                    </Link>
                  ) : (
                    <div>{head}</div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {FORCE_SPEC_ROWS.map((row, i) => (
            <tr key={row} className={i % 2 ? "bg-white" : "bg-zw-grey-50"}>
              <th scope="row" className={`${labelCell} bg-inherit`}>
                {f.specLabels[row]}
              </th>
              {machines.map((m) => (
                <td key={m.key} className={cell}>
                  {f.machines[m.key].specs[row]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <th scope="row" className={`${labelCell} border-t-2 border-t-zw-ink bg-white`}>
              {f.tablePrice}
            </th>
            {machines.map((m) => {
              const product = products[m.key];
              return (
                <td key={m.key} className={`${cell} border-t-2 border-t-zw-ink bg-white pb-6 pt-4`}>
                  {product ? (
                    <>
                      <ProductPrice product={product} compact />
                      <TableActions product={product} />
                    </>
                  ) : (
                    <span className="text-zw-grey-300">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Sepete Ekle (urun kartindaki kurallarla) ve favori kalbi. */
function TableActions({ product }: { product: Product }) {
  const favourites = useFavourites();
  const inStock = isProductInStock(product, undefined, useDatabase());
  const liked = favourites.has(product.id);
  return (
    <div className="mt-1 flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <CardCartButton product={product} inStock={inStock} />
      </div>
      <button
        type="button"
        onClick={() => favourites.toggle(product.id)}
        aria-label="Favori"
        aria-pressed={liked}
        className="flex h-[38px] w-10 shrink-0 items-center justify-center rounded-[4px] border border-zw-grey-300 text-zw-grey-500 transition-colors hover:border-zw-red-600 hover:text-zw-red-600"
      >
        <Heart size={17} className={liked ? "fill-zw-red-600 text-zw-red-600" : ""} />
      </button>
    </div>
  );
}
