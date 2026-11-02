import { describe, expect, it } from "vitest";
import { isQuotable } from "@zenweld/data";
import { product } from "./ornek";

/* docs/IS-KURALLARI.md › 8. Teklif (KARARLAR K-79) */

describe("Teklif Al listesine giren ürünler", () => {
  it("Ekipmanlar'daki yayındaki ürünün hepsi listelenir", () => {
    expect(isQuotable(product({ section: "ekipmanlar", active: true }))).toBe(true);
  });

  it("Güvenlik, Aksesuarlar ve Dolgu Metalleri'ndeki ürün listelenmez", () => {
    expect(isQuotable(product({ section: "guvenlik", active: true }))).toBe(false);
    expect(isQuotable(product({ section: "aksesuarlar", active: true }))).toBe(false);
    expect(isQuotable(product({ section: "dolgu-metalleri", active: true }))).toBe(false);
  });

  it("yayında olmayan ekipman listelenmez", () => {
    expect(isQuotable(product({ section: "ekipmanlar", active: false }))).toBe(false);
  });
});
