import { describe, expect, it } from "vitest";
import { isInWarehouse, productSapCodes, sapItemCode, warehouseQuantity, warehouseStockMap } from "@zenweld/data";
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
