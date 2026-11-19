import { describe, expect, it } from "vitest";
import { pageCount, pageItems, pagedTitle, pagePath, parsePageNumber, POSTS_PER_PAGE, PRODUCTS_PER_PAGE } from "@zenweld/data";

/* docs/IS-KURALLARI.md › 26. Listelerin sayfalanması (KARARLAR K-124) */
describe("Listelerin sayfalanması", () => {
  it("ürün listesi sayfa başına 24, blog, haber ve etkinlik 12", () => {
    expect([PRODUCTS_PER_PAGE, POSTS_PER_PAGE]).toEqual([24, 12]);
  });

  it("örnek: 30 ürün → 2 sayfa (24 + 6); sınır aşılmazsa tek sayfa; boş liste 1 sayfa", () => {
    const items = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(pageCount(30, 24)).toBe(2);
    expect(pageItems(items, 1, 24)).toHaveLength(24);
    expect(pageItems(items, 2, 24)).toEqual([25, 26, 27, 28, 29, 30]);
    expect(pageItems(items, 3, 24)).toEqual([]);
    expect([pageCount(24, 24), pageCount(0, 12)]).toEqual([1, 1]);
  });

  it("adres: 1. sayfa listenin adresi, sonrakiler /sayfa/<n>", () => {
    expect(pagePath("/haberler", 1)).toBe("/haberler");
    expect(pagePath("/haberler", 2)).toBe("/haberler/sayfa/2");
    expect(pagePath("/ekipmanlar/kaynak-makineleri/mig", 3)).toBe("/ekipmanlar/kaynak-makineleri/mig/sayfa/3");
  });

  it("adresteki sayfa numarası: yalnızca 1–9999 arası tam sayı", () => {
    expect([parsePageNumber("2"), parsePageNumber("12")]).toEqual([2, 12]);
    expect([parsePageNumber("0"), parsePageNumber("02"), parsePageNumber("x"), parsePageNumber("-1"), parsePageNumber(undefined)]).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("başlık: 2. sayfadan itibaren \" — Sayfa <n>\"; \"| ZENWELD\" sonda kalır", () => {
    expect(pagedTitle("Haberler | ZENWELD", 1)).toBe("Haberler | ZENWELD");
    expect(pagedTitle("Haberler | ZENWELD", 2)).toBe("Haberler — Sayfa 2 | ZENWELD");
    expect(pagedTitle("Özel Başlık", 3)).toBe("Özel Başlık — Sayfa 3");
  });
});
