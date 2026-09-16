"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Store } from "lucide-react";
import type { Product } from "@zenweld/data";
import { lastStockUpdate, retailersInStockFor, useDatabase } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDate, formatPrice } from "@/lib/format";

/**
 * "Ayrica online alisveris olarak surada da mevcuttur"
 *
 * ONEMLI: Bu liste urune ozeldir. Yalnizca o urunu STOKTA TUTAN saticilar
 * gosterilir — A urunu 3 sitede, B urunu 2 sitede cikabilir. Stok bilgisi
 * admin panelinden (/admin/stok) veya bayinin kendi panelinden guncellenir.
 */
export function OnlineRetailers({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const [expanded, setExpanded] = useState(false);

  const inStock = useMemo(() => retailersInStockFor(product.id, db), [product.id, db]);
  const updatedAt = useMemo(() => lastStockUpdate(product.id, db), [product.id, db]);

  if (inStock.length === 0) {
    return (
      <section className="mt-8 border-t border-zw-grey-200 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-zw-ink">{t.product.onlineRetailers}</h2>
        <p className="rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 px-4 py-4 text-sm text-zw-grey-600">
          {t.product.noOnlineStock}
        </p>
      </section>
    );
  }

  const visible = expanded ? inStock : inStock.slice(0, 8);

  return (
    <section className="mt-8 border-t border-zw-grey-200 pt-6">
      <h2 className="mb-3 text-sm font-semibold text-zw-ink">{t.product.onlineRetailers}</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(({ retailer, stock }) => (
          <a
            key={retailer.id}
            href={stock.productUrl}
            target={retailer.isOwnStore ? undefined : "_blank"}
            rel={retailer.isOwnStore ? undefined : "noopener noreferrer"}
            className="group relative flex h-24 flex-col items-center justify-center gap-1 rounded-[4px] border border-zw-grey-200 bg-white px-3 py-2 text-center transition-all hover:border-zw-ink hover:shadow-md"
            title={`${retailer.name} — ${t.product.goToStore}`}
          >
            {retailer.isOwnStore && (
              <Badge tone="red" className="absolute left-1.5 top-1.5">
                <Store size={10} />
              </Badge>
            )}
            <ExternalLink
              size={13}
              className="absolute right-1.5 top-1.5 text-zw-grey-300 transition-colors group-hover:text-zw-ink"
            />
            <span className="font-display text-[13px] font-bold uppercase leading-tight tracking-tight text-zw-grey-800 group-hover:text-zw-red-600">
              {retailer.logoText}
            </span>
            {stock.price != null && (
              <span className="text-xs font-semibold text-zw-grey-500">
                {formatPrice(stock.price, locale)}
              </span>
            )}
          </a>
        ))}
      </div>

      {inStock.length > 8 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-semibold text-zw-ink hover:text-zw-red-600"
        >
          {expanded ? t.common.showLess : t.common.showMore}
          <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
        </button>
      )}

      {updatedAt && (
        <p className="mt-3 text-xs text-zw-grey-400">
          {t.product.stockUpdated.replace("{date}", formatDate(updatedAt, locale))}
        </p>
      )}
    </section>
  );
}
