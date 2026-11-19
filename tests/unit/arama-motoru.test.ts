import { describe, expect, it } from "vitest";
import { productBrand } from "@zenweld/data";
import { blogPostingJsonLd, productJsonLd, productSeo } from "@/lib/seo";
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

/* docs/IS-KURALLARI.md › 13 › Yapısal veri (KARARLAR K-123) */
describe("Ürünün yapısal verisi: kargo, iade, yıldız", () => {
  // Ornek urun: 1.000 TL + %20 KDV = 1.200 TL
  const offer = (shop: { shippingFee: number; freeShippingThreshold: number }) =>
    productJsonLd(product(), undefined, { ...AT, shop }).offers as Record<string, Record<string, unknown>>;

  it("kargo: fiyat ücretsiz kargo sınırının altındaysa Mağaza Ayarları'ndaki ücret, sınıra ulaşıyorsa 0; Türkiye'ye", () => {
    expect(offer({ shippingFee: 250, freeShippingThreshold: 5000 }).shippingDetails).toEqual({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: 250, currency: "TRY" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
    });
    expect((offer({ shippingFee: 250, freeShippingThreshold: 1200 }).shippingDetails.shippingRate as { value: number }).value).toBe(0);
  });

  it("iade: Türkiye, teslimden itibaren 14 gün, kargoyla", () => {
    expect(offer({ shippingFee: 250, freeShippingThreshold: 5000 }).hasMerchantReturnPolicy).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "TR",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
    });
  });

  it("yıldız: onaylı yorumların ortalaması (bir ondalık) ve sayısı; yorum yoksa gönderilmez", () => {
    expect(productJsonLd(product(), undefined, { ...AT, ratings: [5, 4, 4] }).aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.3,
      reviewCount: 3,
      bestRating: 5,
      worstRating: 1,
    });
    expect(productJsonLd(product(), undefined, AT).aggregateRating).toBeUndefined();
  });
});

describe("Blog yazısının yapısal verisi (BlogPosting)", () => {
  const post = {
    id: "b1",
    slug: "gaz-secimi",
    title: "MIG Kaynağında Doğru Gaz Seçimi",
    excerpt: "Özet",
    body: "Metin",
    coverUrl: "/images/blog/gaz.webp",
    category: "Rehber",
    author: "Zenweld Teknik Ekip",
    publishedAt: "2026-01-10T09:00:00+03:00",
  };

  it("başlık, özet, tarih, görsel, yazar ve yayıncı (Zenweld, logosuyla) gider; değişmediyse güncelleme tarihi yayın tarihidir", () => {
    const data = blogPostingJsonLd(post);
    expect(data).toMatchObject({
      "@type": "BlogPosting",
      headline: "MIG Kaynağında Doğru Gaz Seçimi",
      description: "Özet",
      datePublished: "2026-01-10T09:00:00+03:00",
      dateModified: "2026-01-10T09:00:00+03:00",
      author: { "@type": "Organization", name: "Zenweld Teknik Ekip" },
      publisher: { "@type": "Organization", name: "ZENWELD" },
    });
    expect((data.image as string[])[0]).toMatch(/\/images\/blog\/gaz\.webp$/);
    expect(blogPostingJsonLd({ ...post, updatedAt: "2026-02-01T10:00:00Z" }).dateModified).toBe("2026-02-01T10:00:00Z");
  });
});
