import { describe, expect, it } from "vitest";
import { productBrand } from "@zenweld/data";
import { productJsonLd, productSeo } from "@/lib/seo";
import { product } from "./ornek";

const AT = { now: new Date("2026-11-02T09:00:00Z"), inStock: true };

/* docs/IS-KURALLARI.md › 13. Linkler, yönlendirme ve arama motorları */
describe("Ürün sayfası başlığı ve marka", () => {
  const machine = product({ name: "Ultimate 405 THP TIG Argon Kaynak Makinesi", shortDescription: "Kısa açıklama" });

  it('başlık boşsa "<Ürün adı> | ZENWELD"; kategori adı eklenmez', () => {
    expect(productSeo(machine).title).toBe("Ultimate 405 THP TIG Argon Kaynak Makinesi | ZENWELD");
    expect(productSeo(machine).description).toBe("Kısa açıklama");
  });

  it("panelde yazılan başlık olduğu gibi kullanılır", () => {
    expect(productSeo({ ...machine, seo: { title: "Özel Başlık" } }).title).toBe("Özel Başlık");
  });

  it("marka boşsa Zenweld; yazılmışsa arama motoruna o marka gider", () => {
    expect(productBrand(product())).toBe("Zenweld");
    expect(productBrand(product({ brand: "  " }))).toBe("Zenweld");
    expect(productJsonLd(product({ brand: "Jasic" }), undefined, AT).brand).toEqual({ "@type": "Brand", name: "Jasic" });
  });
});

describe("Ürünün yapısal verisi: stok durumu (K-82)", () => {
  const offer = (inStock: boolean) =>
    productJsonLd(product(), undefined, { ...AT, inStock }).offers as Record<string, unknown>;

  it("Zenweld deposunda stok varsa arama motoruna stokta bildirilir", () => {
    expect(offer(true).availability).toBe("https://schema.org/InStock");
  });

  it("depoda stok yoksa stokta yok bildirilir (sitede de sepete eklenmez)", () => {
    expect(offer(false).availability).toBe("https://schema.org/OutOfStock");
  });
});
