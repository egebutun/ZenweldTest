"use client";

import { useMemo, useState } from "react";
import { Check, Heart, X } from "lucide-react";
import type { Product } from "@zenweld/data";
import { isProductInStock, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { CardCartButton, ProductPrice } from "@/components/product/ProductCard";
import { useFavourites } from "@/lib/favourites";
import { FORCE_SHOWCASE, forceFamily, forceModelName, forceSpecRows } from "@/lib/force";
import { useT } from "@/lib/i18n-client";

/** Tabloda ayni anda en fazla bu kadar model yan yana durur. */
const MAX_SELECTED = 4;

/**
 * FORCE TEKNIK KARSILASTIRMA
 *
 * Ustte seri modelleri ailelerine gore (ForceMIG, ForceTIG ...) isaretlenir;
 * tablo yalnizca isaretlenen modelleri seri sirasiyla yan yana gosterir (en
 * fazla 4). Sayfa acilinca tanitilan dort makine isaretlidir. Satirlar
 * yalnizca secilen modellerin teknik ozellikleridir; secilen bir modelde
 * olmayan ozellik "—" yazar. Her kolonun ustunde fotograf, aile ve model adi
 * (kolonu cikaran carpi), altinda fiyat, Sepete Ekle ve favori kalbi.
 * Telefonda tablo yana kayar; ozellik adlari solda sabit kalir.
 */
export function ForceSpecTable({ products }: { products: Product[] }) {
  const f = useT().forcePage;

  const [picked, setPicked] = useState<string[]>(() => {
    const showcase = products.filter((p) => FORCE_SHOWCASE.some((m) => m.slug === p.slug)).map((p) => p.id);
    return (showcase.length ? showcase : products.map((p) => p.id)).slice(0, MAX_SELECTED);
  });

  // Seri sirasi korunur; panelden kalkan urun secimden de duser.
  const selected = useMemo(() => products.filter((p) => picked.includes(p.id)), [products, picked]);
  const full = selected.length >= MAX_SELECTED;

  const families = useMemo(
    () =>
      products.reduce<{ name: string; items: Product[] }[]>((acc, p) => {
        const name = forceFamily(p);
        const group = acc.find((g) => g.name === name);
        if (group) group.items.push(p);
        else acc.push({ name, items: [p] });
        return acc;
      }, []),
    [products],
  );

  const toggle = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= MAX_SELECTED ? list : [...list, id]));

  return (
    <div className="flex flex-col gap-6">
      {/* Model secimi */}
      <div className="rounded-[6px] border border-zw-grey-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgb(20_22_25/0.35)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-xl font-bold uppercase text-zw-ink">{f.tablePick}</h3>
          <div className="flex items-baseline gap-4 text-sm">
            <span className={full ? "font-semibold text-zw-red-600" : "text-zw-grey-500"} aria-live="polite">
              {f.tableSelected.replace("{count}", String(selected.length)).replace("{max}", String(MAX_SELECTED))}
            </span>
            {selected.length > 0 && (
              <button type="button" onClick={() => setPicked([])} className="font-semibold text-zw-grey-600 underline-offset-4 hover:text-zw-ink hover:underline">
                {f.tableClear}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-zw-grey-500">{f.tableMax.replace("{max}", String(MAX_SELECTED))}</p>

        <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {families.map((family) => (
            <fieldset key={family.name} className="min-w-0">
              <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zw-red-600">{family.name}</legend>
              <div className="flex flex-wrap gap-2">
                {family.items.map((p) => {
                  const on = picked.includes(p.id);
                  const locked = !on && full;
                  return (
                    <label
                      key={p.id}
                      className={`inline-flex select-none items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        on
                          ? "cursor-pointer border-zw-ink bg-zw-ink text-white"
                          : locked
                            ? "cursor-not-allowed border-zw-grey-200 text-zw-grey-400"
                            : "cursor-pointer border-zw-grey-300 text-zw-grey-800 hover:border-zw-ink"
                      } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-zw-red-600`}
                    >
                      <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(p.id)} className="sr-only" />
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          on ? "border-zw-red-500 bg-zw-red-600" : "border-current"
                        }`}
                      >
                        {on && <Check size={11} strokeWidth={3} />}
                      </span>
                      {forceModelName(p)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-[6px] border border-dashed border-zw-grey-300 bg-white px-6 py-12 text-center text-zw-grey-600">{f.tableEmpty}</p>
      ) : (
        <Table products={selected} onRemove={toggle} />
      )}
    </div>
  );
}

function Table({ products, onRemove }: { products: Product[]; onRemove: (id: string) => void }) {
  const f = useT().forcePage;
  const rows = forceSpecRows(products);

  const labelCell =
    "sticky left-0 z-10 w-[132px] border-r border-zw-grey-200 px-3 py-3.5 text-left align-top text-xs font-semibold uppercase tracking-[0.06em] text-zw-grey-500 sm:w-[210px] sm:px-6";
  const cell = "border-l border-zw-grey-100 px-4 py-3.5 align-top text-sm font-medium leading-snug text-zw-ink sm:px-6";

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-[6px] border border-zw-grey-200 bg-white shadow-[0_30px_80px_-40px_rgb(20_22_25/0.35)]">
      {/* Kolonlar esit; telefonda her kolon en az ~170 px, gerisi yana kayar. */}
      <table className="w-full table-fixed border-separate border-spacing-0 text-left" style={{ minWidth: 132 + products.length * 170 }}>
        <thead>
          <tr>
            <th scope="col" className={`${labelCell} bg-white align-bottom`}>
              {f.tableModel}
            </th>
            {products.map((p) => (
              <th key={p.id} scope="col" className={`${cell} relative bg-white pb-5 pt-4 text-left`}>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`${forceModelName(p)}: ${f.tableRemove}`}
                  title={f.tableRemove}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-zw-grey-400 transition-colors hover:bg-zw-grey-100 hover:text-zw-ink"
                >
                  <X size={16} />
                </button>
                <Link href={`/urun/${p.slug}`} className="group block">
                  <div className="flex h-28 items-end justify-center sm:h-36">
                    <ProductImage
                      src={p.images[0]?.url}
                      alt={p.images[0]?.alt || p.name}
                      label={p.name}
                      className="max-h-28 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-36"
                    />
                  </div>
                  <span className="mt-4 block text-[11px] font-bold uppercase tracking-[0.2em] text-zw-red-600">{forceFamily(p)}</span>
                  <span data-model className="mt-1 block font-display text-xl font-bold leading-tight text-zw-ink group-hover:text-zw-red-600 sm:text-2xl">
                    {forceModelName(p)}
                  </span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 ? "bg-white" : "bg-zw-grey-50"}>
              <th scope="row" className={`${labelCell} bg-inherit`}>
                {row.label}
              </th>
              {row.values.map((value, j) => (
                <td key={products[j].id} className={cell}>
                  {value ?? <span className="text-zw-grey-300">—</span>}
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
            {products.map((p) => (
              <td key={p.id} className={`${cell} border-t-2 border-t-zw-ink bg-white pb-6 pt-4`}>
                <ProductPrice product={p} compact />
                <TableActions product={p} />
              </td>
            ))}
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
