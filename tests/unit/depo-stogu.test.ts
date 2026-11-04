import { describe, expect, it } from "vitest";
import {
  diffWarehouseStock,
  isInWarehouse,
  looksLikePartialSapRead,
  productSapCodes,
  readSapStock,
  sapItemCode,
  warehouseQuantity,
  warehouseStockMap,
} from "@zenweld/data";
import { product } from "./ornek";

/* docs/IS-KURALLARI.md › 20. Zenweld depo stoğu (KARARLAR K-82) */

const stock = warehouseStockMap([
  { sapItemCode: "ZW30100000001", quantity: 4, syncedAt: "2026-11-02T09:00:00Z" },
  { sapItemCode: "ZW30100000027", quantity: 2, syncedAt: "2026-11-02T09:00:00Z" },
  { sapItemCode: "ZW30100000028", quantity: 0, syncedAt: "2026-11-02T09:00:00Z" },
]);

const variant = (id: string, sku: string) => ({ id, values: {}, sku, priceDeltaExVat: 0 });

describe("SAP kalem kodu", () => {
  it("seçenek kodundan torç ve ara paket ekleri atılır; boşluk ve küçük harf fark etmez", () => {
    expect(sapItemCode("ZW30100000027-3M-AP5M")).toBe("ZW30100000027");
    expect(sapItemCode("ZW30100000024-8M")).toBe("ZW30100000024");
    expect(sapItemCode("zw 30100000001")).toBe("ZW30100000001");
    expect(sapItemCode("ZW-GECICI-FORCEARC250")).toBe("ZW-GECICI-FORCEARC250");
  });
});

describe("depo stoğu", () => {
  it("seçeneksiz ürün kendi kodunun stoğunu gösterir; SAP'ta olmayan kod stokta değildir", () => {
    expect(warehouseQuantity(product({ sku: "ZW30100000001" }), stock)).toBe(4);
    expect(isInWarehouse(product({ sku: "ZW-GECICI-FORCEARC250" }), stock)).toBe(false);
  });

  it("aynı SAP kalemini paylaşan seçenekler aynı stoğu gösterir; toplamda bir kez sayılır", () => {
    const torch = product({
      sku: "ZW-ULTIMATE",
      options: {
        optionIds: ["sogutma", "torc-uzunlugu"],
        variants: [
          variant("hava_3-m", "ZW30100000027-3M"),
          variant("hava_5-m", "ZW30100000027-5M"),
          variant("su_3-m", "ZW30100000028-3M"),
        ],
      },
    });
    expect(productSapCodes(torch)).toEqual(["ZW30100000027", "ZW30100000028"]);
    expect(warehouseQuantity(torch, stock, "hava_5-m")).toBe(2);
    expect(warehouseQuantity(torch, stock)).toBe(2);
    // Su soğutmalı kalem stoksuz: o seçenek sepete eklenmez, ürün yine stokta.
    expect(isInWarehouse(torch, stock, "su_3-m")).toBe(false);
    expect(isInWarehouse(torch, stock)).toBe(true);
  });

  it("bütün seçenekleri stoksuz ürün stokta değildir", () => {
    const none = product({
      sku: "ZW-X",
      options: { optionIds: ["sogutma"], variants: [variant("su", "ZW30100000028")] },
    });
    expect(isInWarehouse(none, stock)).toBe(false);
  });
});

describe("SAP okuması (IS-KURALLARI › 20 › SAP okuması)", () => {
  it("kodlar sadeleşir; aynı kalemin satırları toplanır; toplam eksiyse 0; ondalık 3 basamak", () => {
    expect(
      readSapStock([
        { code: "zw 30100000001", name: "Ultimate 255", quantity: "4" },
        { code: "ZW30100000001", quantity: 2 },
        { code: "ZW30100000027", quantity: "3" },
        { code: "ZW30100000027", quantity: "-5" },
        { code: "ZW40100000001", name: " Tel ", quantity: "12,3456" },
      ]),
    ).toEqual([
      { sapItemCode: "ZW30100000001", itemName: "Ultimate 255", quantity: 6 },
      { sapItemCode: "ZW30100000027", quantity: 0 },
      { sapItemCode: "ZW40100000001", itemName: "Tel", quantity: 12.346 },
    ]);
  });

  it("boş okuma, kodu boş ya da miktarı okunamayan satır okumanın tamamını geçersiz kılar", () => {
    expect(() => readSapStock([])).toThrow("SAP'tan hiç kalem gelmedi.");
    expect(() => readSapStock([{ code: "A", quantity: 1 }, { code: " ", quantity: 1 }])).toThrow("2. satırda kalem kodu boş.");
    expect(() => readSapStock([{ code: "A", quantity: "yok" }])).toThrow("A: miktar okunamadı (yok).");
    expect(() => readSapStock([{ code: "A", quantity: "" }])).toThrow("A: miktar okunamadı (boş).");
  });

  it("iki okuma arasındaki fark: yeni gelen, okumadan çıkan, miktarı değişen", () => {
    const before = [
      { sapItemCode: "A", quantity: 1 },
      { sapItemCode: "B", quantity: 2 },
      { sapItemCode: "C", quantity: 3 },
    ];
    const after = [
      { sapItemCode: "A", quantity: 1 },
      { sapItemCode: "B", quantity: 0 },
      { sapItemCode: "D", quantity: 5 },
    ];
    expect(diffWarehouseStock(before, after)).toEqual({ added: ["D"], removed: ["C"], changed: ["B"] });
    expect(diffWarehouseStock(after, after)).toEqual({ added: [], removed: [], changed: [] });
  });

  it("yarım okuma: önceki okumada en az 10 kalem stoktayken stoktaki kalem yarının altına düşerse (K-93)", () => {
    const rows = (inStock: number, out = 0) => [
      ...Array.from({ length: inStock }, () => ({ quantity: 3 })),
      ...Array.from({ length: out }, () => ({ quantity: 0 })),
    ];
    expect(looksLikePartialSapRead(rows(20), rows(9, 11))).toEqual({ before: 20, after: 9 });
    expect(looksLikePartialSapRead(rows(20), rows(10))).toBeNull();
    // Az kalemli stokta (ilk okuma, deneme) koruma calismaz.
    expect(looksLikePartialSapRead(rows(9), rows(1))).toBeNull();
    expect(looksLikePartialSapRead([], rows(50))).toBeNull();
  });
});
