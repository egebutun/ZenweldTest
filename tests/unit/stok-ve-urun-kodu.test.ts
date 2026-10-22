import { describe, expect, it } from "vitest";
import {
  diffStock,
  isInStock,
  looksTruncated,
  matchStockRows,
  normalizeCode,
  readStockSheet,
  type StockRow,
  type ZenweldDatabase,
} from "@zenweld/data";
import { dealersWithProduct } from "@zenweld/store";
import { optionsError, productCodeError } from "@/components/admin/product/OptionsTab";
import { hoseLength, product } from "./ornek";

const DAY = 86_400_000;
const now = new Date(2026, 9, 22, 12, 0).getTime();
const row = (overrides: Partial<StockRow> = {}): StockRow => ({
  productId: "p1",
  sku: "ZW-URUN",
  quantity: 1,
  updatedAt: new Date(now).toISOString(),
  ...overrides,
});

/* docs/IS-KURALLARI.md › 11. Bayi ve online satıcı stoğu, docs/STOK.md */
describe("Stokta sayılmak", () => {
  it("adet > 0 ve satır stok geçerlilik süresinden eski değil", () => {
    expect(isInStock(row({ quantity: 3 }), 3, now)).toBe(true);
    expect(isInStock(row({ quantity: 0 }), 3, now)).toBe(false);
    expect(isInStock(row({ updatedAt: new Date(now - 3 * DAY).toISOString() }), 3, now)).toBe(true);
    expect(isInStock(row({ updatedAt: new Date(now - 4 * DAY).toISOString() }), 3, now)).toBe(false);
  });

  it("süre 0 ise süre sınırı yok", () => {
    expect(isInStock(row({ updatedAt: new Date(now - 400 * DAY).toISOString() }), 0, now)).toBe(true);
  });

  it("seçenekli üründe: seçeneği belirtilmemiş satır bütün seçenekler için geçerli", () => {
    const db = {
      dealerStock: [
        { ...row({ variantId: "v5" }), dealerId: "bayi-5m" },
        { ...row(), dealerId: "bayi-tumu" },
        { ...row({ variantId: "v3" }), dealerId: "bayi-3m" },
        { ...row({ variantId: "v3", quantity: 0 }), dealerId: "bayi-bitmis" },
      ],
      settings: { stock: { staleDays: 3 } },
    } as unknown as ZenweldDatabase;
    expect([...dealersWithProduct("p1", db, "v5", now)].sort()).toEqual(["bayi-5m", "bayi-tumu"]);
    expect([...dealersWithProduct("p1", db, "v3", now)].sort()).toEqual(["bayi-3m", "bayi-tumu"]);
  });
});

describe("Stok dosyası", () => {
  const products = [
    product({ id: "p1", sku: "ZW-TRC MB25" }),
    product({
      id: "p2",
      sku: "ZW-HORTUM",
      options: { optionId: hoseLength.id, variants: [{ valueId: "v5", sku: "ZW-HORTUM-5", priceDeltaExVat: 0 }] },
    }),
  ];
  const read = (table: unknown[][]) => readStockSheet(table, { withUrl: true });
  const match = (table: unknown[][], aliases = [] as { sourceId: string; code: string; productId: string }[]) =>
    matchStockRows(read(table), { sourceId: "bayi-1", products, aliases, at: new Date(now).toISOString() });

  it("başlık satırı Türkçe adlarla tanınır; sayılar Türkçe biçimde okunur", () => {
    const sheet = read([
      ["Bayi stok listesi"],
      ["Ürün Kodu", "Ürün Adı", "Stok Adedi", "Fiyat"],
      ["ZW-1", "Torç", "1.234", "1.250,50"],
    ]);
    expect(sheet.columns).toMatchObject({ headerRow: 1, code: 0, quantity: 2, price: 3 });
    expect(sheet.rows[0]).toMatchObject({ code: "ZW-1", quantity: 1234, price: 1250.5 });
  });

  it("eksi adet 0 sayılır; kesirli adet ve boş kod hata verir", () => {
    const rows = read([
      ["SKU", "Adet"],
      ["ZW-1", "-5"],
      ["ZW-2", "12,5"],
      ["", "3"],
    ]).rows;
    expect(rows[0]).toMatchObject({ quantity: 0 });
    expect(rows[0].warning).toMatch(/Eksi adet/);
    expect(rows[1].error).toMatch(/tam sayı/);
    expect(rows[2].error).toMatch(/kodu boş/);
  });

  it("link yalnızca http(s) ile başlıyorsa alınır", () => {
    const rows = read([
      ["SKU", "Adet", "Link"],
      ["ZW-1", "1", "https://magaza.example/urun"],
      ["ZW-2", "1", "magaza.example/urun"],
    ]).rows;
    expect(rows[0].url).toBe("https://magaza.example/urun");
    expect(rows[1].url).toBeUndefined();
  });

  it("kod eşleşmesinde boşluklar atılır ve büyük harfe çevrilir; seçenek kodu seçeneğe eşleşir", () => {
    const result = match([
      ["SKU", "Adet"],
      ["zw-trcmb25", "2"],
      ["ZW-HORTUM-5", "4"],
      ["BILINMEYEN", "1"],
    ]);
    expect(result.incoming.map((r) => [r.productId, r.variantId, r.quantity])).toEqual([
      ["p1", undefined, 2],
      ["p2", "v5", 4],
    ]);
    expect(result.unmatched.map((r) => r.code)).toEqual(["BILINMEYEN"]);
  });

  it("eşleştirilen kod sonraki dosyalarda kendiliğinden tanınır (yalnızca o kaynakta)", () => {
    const table = [["SKU", "Adet"], ["BAYI-KOD-77", "3"]];
    expect(match(table, [{ sourceId: "bayi-1", code: "BAYI-KOD-77", productId: "p1" }]).incoming).toHaveLength(1);
    expect(match(table, [{ sourceId: "baska-bayi", code: "BAYI-KOD-77", productId: "p1" }]).incoming).toHaveLength(0);
  });

  it("aynı ürün dosyada birden çok kez geçerse son satır geçerlidir", () => {
    const result = match([
      ["SKU", "Adet"],
      ["ZW-TRCMB25", "5"],
      ["ZW-TRCMB25", "7"],
    ]);
    expect(result.incoming).toHaveLength(1);
    expect(result.incoming[0].quantity).toBe(7);
    expect(result.duplicates).toHaveLength(1);
  });

  it("her dosya kaynağın tam listesidir: dosyada olmayan ürün stoktan çıkar", () => {
    const current = [row({ productId: "a", quantity: 2 }), row({ productId: "b", quantity: 1 })];
    const diff = diffStock(current, [row({ productId: "a", quantity: 2 })]);
    expect(diff.zeroed.map((c) => c.productId)).toEqual(["b"]);
    expect(diff.unchanged).toBe(1);
  });

  it("önceki listede en az 10 stoklu ürün varken yeni dosya yarısından azını içeriyorsa onay istenir", () => {
    const ten = Array.from({ length: 10 }, (_, i) => row({ productId: `p${i}` }));
    expect(looksTruncated(ten, ten.slice(0, 4))).toBe(true);
    expect(looksTruncated(ten, ten.slice(0, 5))).toBe(false);
    expect(looksTruncated(ten.slice(0, 9), [])).toBe(false);
  });
});

/* docs/IS-KURALLARI.md › 12. Ürün kodları */
describe("Ürün kodları", () => {
  const other = product({
    id: "baska",
    name: "Başka Ürün",
    sku: "ZW-BASKA",
    options: { optionId: hoseLength.id, variants: [{ valueId: "v3", sku: "ZW-BASKA-3", priceDeltaExVat: 0 }] },
  });

  it("karşılaştırmada boşluklar atılır ve büyük harfe çevrilir", () => {
    expect(normalizeCode("zw-trc mb25")).toBe("ZW-TRCMB25");
  });

  it("ürün kodu başka bir ürünün ya da seçeneğin koduyla aynı olamaz", () => {
    expect(productCodeError(product({ sku: "zw-baska" }), [other])).not.toBeNull();
    expect(productCodeError(product({ sku: "ZW-BASKA-3" }), [other])).not.toBeNull();
    expect(productCodeError(product({ sku: "ZW-YENI" }), [other])).toBeNull();
    // Urunun kendisi listede olsa da kendi koduyla cakismaz.
    expect(productCodeError(other, [other])).toBeNull();
  });

  it("seçenek kodu zorunlu ve tek: ürünün kendi koduyla, aynı ürünün başka seçeneğiyle ya da başka üründen bir kodla aynı olamaz", () => {
    const withVariants = (variants: { valueId: string; sku: string }[]) =>
      product({
        sku: "ZW-TORC",
        options: { optionId: hoseLength.id, variants: variants.map((v) => ({ ...v, priceDeltaExVat: 0 })) },
      });
    expect(optionsError(withVariants([{ valueId: "v3", sku: "" }]), [hoseLength], [other])).toMatch(/zorunludur/);
    expect(optionsError(withVariants([{ valueId: "v3", sku: "zw-torc" }]), [hoseLength], [other])).not.toBeNull();
    expect(
      optionsError(
        withVariants([
          { valueId: "v3", sku: "ZW-TORC-X" },
          { valueId: "v5", sku: "ZW-TORC-X" },
        ]),
        [hoseLength],
        [other],
      ),
    ).not.toBeNull();
    expect(optionsError(withVariants([{ valueId: "v3", sku: "ZW-BASKA-3" }]), [hoseLength], [other])).not.toBeNull();
    expect(
      optionsError(
        withVariants([
          { valueId: "v3", sku: "ZW-TORC-3" },
          { valueId: "v5", sku: "ZW-TORC-5" },
        ]),
        [hoseLength],
        [other],
      ),
    ).toBeNull();
  });
});
