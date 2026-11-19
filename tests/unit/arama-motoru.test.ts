import { describe, expect, it } from "vitest";
import { defaultSettings, productBrand } from "@zenweld/data";
import { blogPostingJsonLd, countryCode, eventJsonLd, organizationJsonLd, productJsonLd, productSeo, websiteJsonLd } from "@/lib/seo";
import { cooling, options, product } from "./ornek";

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

describe("Seçenekli ürün: her seçenek kendi kodu, fiyatı, stoğu ve linkiyle (ProductGroup)", () => {
  const machine = product({
    slug: "ultimate-300-thp",
    sku: "ZW-300",
    options: options([cooling.id], [
      [["hava"], "ZW-300-H"],
      [["su"], "ZW-300-S", { priceDeltaExVat: 500 }],
    ]),
  });
  const stock = new Map([["ZW-300-S", 2]]);
  const data = productJsonLd(machine, undefined, { ...AT, stock, definitions: [cooling] });
  const variants = data.hasVariant as Record<string, Record<string, unknown>>[];

  it("ürün grubu; seçenek adı, kodu ve seçenekli linki", () => {
    expect([data["@type"], data.productGroupID]).toEqual(["ProductGroup", "ZW-300"]);
    expect(variants.map((v) => [v.name, v.sku, v.offers.url])).toEqual([
      ["Örnek Ürün — Hava Soğutmalı", "ZW-300-H", expect.stringMatching(/\/urun\/ultimate-300-thp\?secenek=hava$/)],
      ["Örnek Ürün — Su Soğutmalı", "ZW-300-S", expect.stringMatching(/\/urun\/ultimate-300-thp\?secenek=su$/)],
    ]);
  });

  it("seçeneğin fiyatı (fiyat farkıyla, KDV dahil) ve kendi stoğu", () => {
    expect(variants.map((v) => [v.offers.price, v.offers.availability])).toEqual([
      [1200, "https://schema.org/OutOfStock"],
      [1800, "https://schema.org/InStock"],
    ]);
  });

  it("seçeneksiz ürün tek ürün olarak gider", () => {
    expect(productJsonLd(product(), undefined, AT)["@type"]).toBe("Product");
  });
});

describe("Ürün açıklaması: kısa açıklama, öne çıkanlar ve uzun açıklama (biçim temizlenir)", () => {
  it("üçü sırayla birleşir; HTML ve biçim işaretleri gitmez", () => {
    const data = productJsonLd(
      product({ shortDescription: "Kısa.", highlights: ["200 A", "3,5 kg"], description: "<p>## Başlık</p><p>**Uzun** metin.</p>" }),
      undefined,
      AT,
    );
    expect(data.description).toBe("Kısa. 200 A. 3,5 kg Başlık Uzun metin.");
  });
});

describe("Site adı ve etkinlik", () => {
  it("site adı ZENWELD (WebSite)", () => {
    expect(websiteJsonLd()).toMatchObject({ "@type": "WebSite", name: "ZENWELD" });
  });

  const event = {
    id: "e1",
    slug: "fuar-2026",
    title: "Fuar",
    summary: "Özet",
    description: "",
    startDate: "2026-06-10",
    endDate: "2026-06-13",
    venue: "İstanbul Fuar Merkezi",
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: "/images/events/fuar.png",
    images: ["https://images.unsplash.com/photo-1?w=1", "/images/events/fuar/1.webp"],
    active: true,
  };

  it("ülke kodla gider; düzenleyen verilmez (Zenweld katılımcı); geçici stok fotoğraf gitmez", () => {
    const data = eventJsonLd(event);
    expect((data.location as { address: { addressCountry: string } }).address.addressCountry).toBe("TR");
    expect(data.organizer).toBeUndefined();
    expect((data.image as string[]).map((u) => u.replace(/^https?:\/\/[^/]+/, ""))).toEqual(["/images/events/fuar/1.webp"]);
    // Gercek fotograf yoksa logo
    expect((eventJsonLd({ ...event, images: [event.images[0]] }).image as string[])[0]).toMatch(/\/images\/events\/fuar\.png$/);
    expect([countryCode("Birleşik Arap Emirlikleri"), countryCode("Suudi Arabistan")]).toEqual(["AE", "SA"]);
  });
});

describe("Şirket bilgisi: marka adı ve ticari unvan", () => {
  it("ad ZENWELD; ticari unvan Mağaza Ayarları'ndan legalName olarak; boşsa gönderilmez", () => {
    const company = { ...defaultSettings.company, legalName: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş." };
    expect(organizationJsonLd(company)).toMatchObject({ name: "ZENWELD", legalName: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş." });
    expect(organizationJsonLd({ ...company, legalName: " " }).legalName).toBeUndefined();
  });
});
