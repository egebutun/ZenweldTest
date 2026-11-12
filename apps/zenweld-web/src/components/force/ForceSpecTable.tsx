"use client";

import { Heart } from "lucide-react";
import type { Product } from "@zenweld/data";
import { isProductInStock, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { CardCartButton, ProductPrice } from "@/components/product/ProductCard";
import { useFavourites } from "@/lib/favourites";
import { forceFamily, forceModelName, forceSpecRows } from "@/lib/force";
import { useT } from "@/lib/i18n-client";

/**
 * FORCE TEKNIK KARSILASTIRMA TABLOSU
 *
 * Urunler yan yana (kolon), teknik ozellikler yukaridan asagi (satir); en
 * ustte aile bandi (ForceMIG, ForceTIG ...), her kolonun en altinda fiyat,
 * Sepete Ekle ve favori kalbi. Urunde olmayan ozellik "—" yazar. Tablo yana
 * kayar; ozellik adlari solda sabit kalir.
 */
export function ForceSpecTable({ products }: { products: Product[] }) {
  const t = useT();
  const f = t.forcePage;
  const rows = forceSpecRows(products);

  // Ardisik ayni aile tek bantta birlesir.
  const families = products.reduce<{ name: string; span: number }[]>((acc, p) => {
    const name = forceFamily(p);
    const last = acc[acc.length - 1];
    if (last?.name === name) last.span += 1;
    else acc.push({ name, span: 1 });
    return acc;
  }, []);

  const labelCell = "sticky left-0 z-10 w-36 min-w-36 border-r border-zw-grey-200 px-3 py-3 text-left align-top text-xs font-semibold text-zw-grey-600 sm:w-52 sm:min-w-52 sm:px-5 sm:text-[13px]";
  const cell = "w-48 min-w-48 border-l border-zw-grey-100 px-4 py-3 align-top text-[13px] leading-snug text-zw-grey-800 sm:w-56 sm:min-w-56";

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-[6px] border border-zw-grey-200 bg-white shadow-[0_30px_80px_-40px_rgb(20_22_25/0.35)]">
      <table className="w-max min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <td className={`${labelCell} bg-zw-ink`} />
            {families.map((fam, i) => (
              <th
                key={`${fam.name}-${i}`}
                colSpan={fam.span}
                scope="colgroup"
                className="border-l border-white/10 bg-zw-ink px-4 py-2.5 text-left font-display text-sm font-bold uppercase tracking-[0.2em] text-white"
              >
                {fam.name}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col" className={`${labelCell} bg-white align-bottom`}>
              {f.tableModel}
            </th>
            {products.map((p) => (
              <th key={p.id} scope="col" className={`${cell} bg-white pb-4 pt-5`}>
                <Link href={`/urun/${p.slug}`} className="group block">
                  <div className="flex h-28 items-end justify-center">
                    <ProductImage
                      src={p.images[0]?.url}
                      alt={p.images[0]?.alt || p.name}
                      label={p.name}
                      className="max-h-28 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-3 block font-display text-lg font-bold leading-tight text-zw-ink group-hover:text-zw-red-600">
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
              <td key={p.id} className={`${cell} border-t-2 border-t-zw-ink bg-white pb-5 pt-4`}>
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
    <div className="flex items-end gap-2">
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
