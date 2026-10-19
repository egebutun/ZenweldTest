import type { StockImport, StockLevel } from "../types";
import { products } from "./products.seed";
import { retailers } from "./retailers.seed";
import { dealers } from "./dealers.seed";

/**
 * ORNEK STOK LISTELERI
 *
 * Her bayi ve online satici icin, sanki son gunlerde stok dosyasi
 * yuklenmis gibi adetler uretilir. Tarihler veritabaninin tarayicida
 * kuruldugu ana gore hesaplanir (aksi halde 3 gunluk sinir yuzunden stok
 * hemen gizlenirdi). Bir bayi ve bir satici bilerek 5 gun eski birakilir:
 * panelde "guncellenmedi" uyarisi ve sitede gizlenme boyle gorulur.
 *
 * Gercek kullanimda stok panelden (/yonetim/stok) dosya ile yuklenir.
 */

const DAY = 86_400_000;

/** Deterministik "rastgele": iki metinden sabit sayi uretir. */
function hash(a: string, b: string): number {
  let h = 7;
  const s = a + "|" + b;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function createSampleStock(nowMs: number = Date.now()): {
  stockLevels: StockLevel[];
  stockImports: StockImport[];
} {
  const stockLevels: StockLevel[] = [];
  const stockImports: StockImport[] = [];
  const staleDealer = dealers[3]?.id;
  const staleRetailer = retailers[2]?.id;

  /** Kaynagin son yukleme zamani: 0-1 gun once, eski birakilanlar 5 gun once */
  const uploadedAt = (sourceId: string, stale: boolean) =>
    nowMs - (stale ? 5 * DAY : (hash(sourceId, "t") % 30) * 3_600_000) - 60_000;

  const record = (sourceType: StockImport["sourceType"], sourceId: string, at: number, rows: StockLevel[]) =>
    stockImports.push({
      id: `si-ornek-${sourceId}`,
      sourceType,
      sourceId,
      kind: "file",
      fileName: `${sourceId}-stok.csv`,
      createdAt: iso(at),
      createdBy: "Zenweld Yönetici",
      summary: {
        rows: rows.length,
        matched: rows.length,
        unmatched: 0,
        invalid: 0,
        added: rows.filter((r) => r.quantity > 0).length,
        changed: 0,
        zeroed: 0,
      },
    });

  // Online saticilar: urun bazinda adet, fiyat ve urun linki
  retailers.forEach((retailer) => {
    const at = uploadedAt(retailer.id, retailer.id === staleRetailer);
    const rows: StockLevel[] = [];
    products.forEach((product) => {
      const h = hash(product.id, retailer.id);
      if (h % 100 >= 92) return; // satici bu urunu hic satmiyor
      const inStock = h % 100 < 55;
      rows.push({
        sourceType: "retailer",
        sourceId: retailer.id,
        productId: product.id,
        sku: product.sku,
        quantity: inStock ? (h % 17) + 1 : 0,
        price: Math.round((product.priceExVat * (1 + product.vatRate / 100) * (0.96 + (h % 9) / 100)) / 10) * 10,
        url: `${retailer.websiteUrl.replace(/\/$/, "")}/urun/${product.slug}`,
        updatedAt: iso(at),
      });
    });
    stockLevels.push(...rows);
    record("retailer", retailer.id, at, rows);
  });

  // Fiziksel bayiler: secenekli urunlerde secenek bazinda (3 m torc var, 5 m yok olabilir)
  dealers.forEach((dealer) => {
    const at = uploadedAt(dealer.id, dealer.id === staleDealer);
    const rows: StockLevel[] = [];
    products.forEach((product) => {
      const options = product.variantGroups?.[0]?.options ?? [undefined];
      options.forEach((option, index) => {
        const h = hash(dealer.id, `${product.id}${option ? `-${option.id}` : ""}`);
        if (h % 100 >= 85) return; // bayi bu urunu hic tutmuyor
        // Uzun secenekler daha az bayide bulunur.
        const inStock = h % 100 < 62 - index * 14;
        rows.push({
          sourceType: "dealer",
          sourceId: dealer.id,
          productId: product.id,
          variantId: option?.id,
          sku: option?.sku ?? product.sku,
          quantity: inStock ? (h % 9) + 1 : 0,
          updatedAt: iso(at),
        });
      });
    });
    stockLevels.push(...rows);
    record("dealer", dealer.id, at, rows);
  });

  return { stockLevels, stockImports };
}
