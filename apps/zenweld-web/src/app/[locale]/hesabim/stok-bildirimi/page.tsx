"use client";

import { useMemo, useState } from "react";
import { Check, Percent, Search, Store, Upload } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import {
  applyDiscount,
  discountPercentOf,
  FLASH_DISCOUNT_THRESHOLD,
  MAX_DISCOUNT_PERCENT,
  MIN_DISCOUNT_PERCENT,
  validateDiscount,
  type Product,
  type ProductDiscount,
} from "@zenweld/data";
import {
  applyStockCsv,
  bulkSetRetailerStock,
  getRetailerStock,
  parseStockCsv,
  setRetailerStock,
  useDatabase,
  useNow,
} from "@zenweld/store";
import { Alert, Badge, Button, FormRow, Input, Modal } from "@zenweld/ui";
import { CampaignBadge } from "@/components/admin/CampaignBadge";
import { ProductImage } from "@/components/common/ProductImage";
import { useLocale, useT } from "@/lib/i18n-client";
import {
  formatDateTime,
  formatPrice,
  fromDateTimeLocal,
  priceWithVat,
  toDateTimeLocal,
} from "@/lib/format";

/**
 * BAYI STOK, FIYAT VE KAMPANYA
 *
 * Bayi kendi magazasindaki stok durumunu isaretler. Isaretlenen urunler,
 * Zenweld ana sitesindeki ilgili urun sayfasinda "Ayrica online alisveris
 * olarak surada da mevcuttur" bolumunde bu bayinin logosuyla gorunur.
 *
 * Fiyat ve kampanya BAYININ kendisine aittir (RetailerStock.price /
 * .discount) ve yalnizca bayi magazasinda uygulanir. Zenweld ana sitesinin
 * fiyat ve kampanyalari yonetim panelinden (Product.priceExVat /
 * .discount) ayrica yonetilir; iki taraf birbirini etkilemez.
 */
export default function DealerStockPage() {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  /** Kampanyasi duzenlenen urun (modal acik) */
  const [campaignFor, setCampaignFor] = useState<Product | null>(null);
  const now = useNow();

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
        yazabilirsiniz. Fiyatlar KDV dahildir; fiyat boş bırakılırsa Zenweld liste fiyatı
        (kutudaki soluk rakam) kullanılır.
      </p>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3 w-24">Stokta</th>
              <th className="px-4 py-3 w-24">Adet</th>
              <th className="px-4 py-3 w-40">Fiyatınız (₺, KDV dahil)</th>
              <th className="px-4 py-3 min-w-[240px]">Kampanya</th>
              <th className="px-4 py-3 w-36">Güncelleme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {products.map((p) => {
              const stock = getRetailerStock(p.id, retailerId, db);
              const listPrice = priceWithVat(p.priceExVat, p.vatRate);
              const normal = stock?.price ?? listPrice;
              const percent = discountPercentOf(stock?.discount, now);
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
                      placeholder={String(listPrice)}
                      onChange={(e) =>
                        setRetailerStock(p.id, retailerId, {
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-28 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-sm"
                    />
                    {percent > 0 && (
                      <div className="mt-1 text-xs font-semibold text-zw-red-700">
                        Kampanyalı: {formatPrice(applyDiscount(normal, percent), locale)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col items-start gap-1.5">
                      <CampaignBadge discount={stock?.discount} now={now} />
                      <button
                        type="button"
                        onClick={() => setCampaignFor(p)}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-zw-red-600 hover:underline"
                      >
                        <Percent size={13} />
                        {stock?.discount ? "Kampanyayı düzenle" : "Kampanya ekle"}
                      </button>
                    </div>
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

      {campaignFor && (
        <DealerCampaignModal
          key={campaignFor.id}
          product={campaignFor}
          normalPrice={
            getRetailerStock(campaignFor.id, retailerId, db)?.price ??
            priceWithVat(campaignFor.priceExVat, campaignFor.vatRate)
          }
          current={getRetailerStock(campaignFor.id, retailerId, db)?.discount}
          now={now}
          onClose={() => setCampaignFor(null)}
          onSave={(discount) => {
            setRetailerStock(campaignFor.id, retailerId, { discount });
            setCampaignFor(null);
            flash();
          }}
        />
      )}
    </div>
  );
}

/**
 * Bayinin tek bir urun icin kendi magazasindaki kampanyasi. Kurallar
 * yonetim panelindeki Zenweld kampanyasiyla aynidir (bkz.
 * packages/data/src/discount.ts); yalnizca bu bayinin fiyatina uygulanir.
 */
function DealerCampaignModal({
  product,
  normalPrice,
  current,
  now,
  onClose,
  onSave,
}: {
  product: Product;
  /** Bayinin normal fiyati (KDV dahil) */
  normalPrice: number;
  current?: ProductDiscount;
  now: Date;
  onClose: () => void;
  /** undefined: kampanyayi kaldir */
  onSave: (discount: ProductDiscount | undefined) => void;
}) {
  const [draft, setDraft] = useState<ProductDiscount>(current ?? { percent: 10 });
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateDiscount(draft);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(draft);
  };

  return (
    <Modal open onClose={onClose} title={`Kampanya — ${product.name}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-zw-grey-600">
          Bu kampanya yalnızca sizin mağazanızda geçerlidir. Tarihler gelince kendiliğinden
          başlar ve biter.
        </p>

        {error && <Alert tone="danger">{error}</Alert>}

        <FormRow
          label="İndirim oranı (%)"
          required
          hint={`%${MIN_DISCOUNT_PERCENT}–%${MAX_DISCOUNT_PERCENT}. %${FLASH_DISCOUNT_THRESHOLD} ve üzeri "Flaş İndirim" olarak gösterilir.`}
        >
          <Input
            type="number"
            required
            min={MIN_DISCOUNT_PERCENT}
            max={MAX_DISCOUNT_PERCENT}
            step={1}
            value={draft.percent}
            onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) })}
          />
        </FormRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label="Başlangıç" hint="Boş bırakılırsa hemen başlar">
            <Input
              type="datetime-local"
              value={toDateTimeLocal(draft.startsAt)}
              onChange={(e) => setDraft({ ...draft, startsAt: fromDateTimeLocal(e.target.value) })}
            />
          </FormRow>
          <FormRow label="Bitiş" hint="Boş bırakılırsa süresiz">
            <Input
              type="datetime-local"
              value={toDateTimeLocal(draft.endsAt)}
              onChange={(e) => setDraft({ ...draft, endsAt: fromDateTimeLocal(e.target.value) })}
            />
          </FormRow>
        </div>

        {/* Canli onizleme: musterinin magazada gorecegi fiyat */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 px-4 py-3 text-sm">
          <span className="text-zw-grey-600">
            Normal: <span className="line-through">{formatPrice(normalPrice, "tr")}</span>
          </span>
          <span className="font-semibold text-zw-ink">
            Kampanya fiyatı:{" "}
            <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-white">
              {formatPrice(applyDiscount(normalPrice, draft.percent), "tr")}
            </span>
          </span>
          <CampaignBadge discount={draft} now={now} />
        </div>

        <div className="flex flex-wrap justify-between gap-3 pt-2">
          {current ? (
            <Button type="button" variant="outline" onClick={() => onSave(undefined)}>
              Kampanyayı kaldır
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
