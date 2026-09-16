"use client";

import { useMemo, useState } from "react";
import { Check, Search, Store, Upload } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import {
  applyStockCsv,
  bulkSetRetailerStock,
  getRetailerStock,
  parseStockCsv,
  setRetailerStock,
  useDatabase,
} from "@zenweld/store";
import { Alert, Badge, Button, Input } from "@zenweld/ui";
import { ProductImage } from "@/components/common/ProductImage";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDateTime } from "@/lib/format";

/**
 * BAYI STOK BILDIRIMI
 *
 * Bayi kendi magazasindaki stok durumunu isaretler. Isaretlenen urunler,
 * Zenweld ana sitesindeki ilgili urun sayfasinda "Ayrica online alisveris
 * olarak surada da mevcuttur" bolumunde bu bayinin logosuyla gorunur.
 */
export default function DealerStockPage() {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  const retailerId = user?.retailerId;
  const retailer = useMemo(
    () => db.retailers.find((r) => r.id === retailerId),
    [db, retailerId],
  );

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

  if (!user) return null;

  if (user.status === "pending" || !retailerId || !retailer) {
    return (
      <Alert tone="warning">
        {user.status === "pending"
          ? t.account.notDealerYet
          : "Hesabınıza bağlı bir online mağaza tanımı bulunamadı. Zenweld ekibiyle iletişime geçin."}
      </Alert>
    );
  }

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onCsv = async (file: File) => {
    const rows = parseStockCsv(await file.text());
    const applied = applyStockCsv(retailerId, rows);
    setCsvResult(
      `${applied} ürün güncellendi. ${rows.length - applied} satır eşleştirilemedi (SKU bulunamadı).`,
    );
  };

  return (
    <div>
      <div className="mb-6 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-5">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-zw-red-600" />
          <h2 className="font-display text-xl font-bold uppercase">
            {t.account.stockNoticeTitle}
          </h2>
          <Badge tone="dark">{retailer.name}</Badge>
        </div>
        <p className="mt-2 text-sm text-zw-grey-600">{t.account.stockNoticeDesc}</p>
      </div>

      {saved && (
        <div className="mb-4">
          <Alert tone="success">{t.account.stockSaved}</Alert>
        </div>
      )}
      {csvResult && (
        <div className="mb-4">
          <Alert tone="info">{csvResult}</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı veya SKU ara…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              bulkSetRetailerStock(retailerId, products.map((p) => p.id), true);
              flash();
            }}
          >
            Tümünü stokta işaretle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              bulkSetRetailerStock(retailerId, products.map((p) => p.id), false);
              flash();
            }}
          >
            Tümünü temizle
          </Button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-3 text-sm font-semibold hover:border-zw-ink">
            <Upload size={15} />
            CSV Yükle
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
      </div>

      <p className="mb-4 text-xs text-zw-grey-500">
        CSV biçimi: <code>sku;stok;adet;fiyat</code> — stok sütununa <code>1 / var / evet</code>{" "}
        yazabilirsiniz.
      </p>

      <div className="overflow-hidden rounded-[4px] border border-zw-grey-200">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3 w-28">Stokta</th>
              <th className="px-4 py-3 w-28">Adet</th>
              <th className="px-4 py-3 w-36">Fiyatınız (₺)</th>
              <th className="px-4 py-3 w-40">Güncelleme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {products.map((p) => {
              const stock = getRetailerStock(p.id, retailerId, db);
              return (
                <tr key={p.id} className={stock?.inStock ? "bg-emerald-50/40" : ""}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={p.images[0]?.url}
                        alt={p.name}
                        label={p.name}
                        className="h-10 w-10 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-xs text-zw-grey-500">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-zw-red-600"
                        checked={stock?.inStock ?? false}
                        onChange={(e) => {
                          setRetailerStock(p.id, retailerId, { inStock: e.target.checked });
                          flash();
                        }}
                      />
                      {stock?.inStock && <Check size={15} className="text-emerald-600" />}
                    </label>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      value={stock?.quantity ?? ""}
                      onChange={(e) =>
                        setRetailerStock(p.id, retailerId, {
                          quantity: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-20 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={stock?.price ?? ""}
                      onChange={(e) =>
                        setRetailerStock(p.id, retailerId, {
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-28 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-500">
                    {stock?.updatedAt ? formatDateTime(stock.updatedAt, locale) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
