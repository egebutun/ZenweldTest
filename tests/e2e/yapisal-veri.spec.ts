import type { APIRequestContext } from "@playwright/test";
import { createSeedDatabase } from "@zenweld/data";
import { expect, test } from "./yardimci";

/**
 * GOOGLE'A GIDEN YAPISAL VERI (docs/IS-KURALLARI.md › 13; KARARLAR K-123)
 *
 * Urun sayfasinda kargo ve iade bilgisi, blog yazisinda BlogPosting.
 * Demo modunda yorumlar tarayicida durdugu icin urunde yildiz gonderilmez
 * (veritabani modunda: tests/e2e-db/yapisal-veri.spec.ts).
 */
const seed = createSeedDatabase(Date.now());

async function jsonLd(request: APIRequestContext, path: string): Promise<Record<string, unknown>[]> {
  const html = await (await request.get(path)).text();
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
}

test("ürün: kargo (Türkiye, ücret Mağaza Ayarları'na göre) ve 14 günlük iade bilgisi gider; demoda yıldız gitmez", async ({ request }) => {
  const product = seed.products.find((p) => p.active && !p.options?.variants.length)!;
  const data = (await jsonLd(request, `/urun/${product.slug}`)).find((d) => d["@type"] === "Product")!;
  const offer = data.offers as { price: number; shippingDetails: { shippingRate: { value: number }; shippingDestination: unknown }; hasMerchantReturnPolicy: Record<string, unknown> };
  const { shippingFee, freeShippingThreshold } = seed.settings.shop;
  expect(offer.shippingDetails.shippingRate.value).toBe(offer.price >= freeShippingThreshold ? 0 : shippingFee);
  expect(offer.shippingDetails.shippingDestination).toEqual({ "@type": "DefinedRegion", addressCountry: "TR" });
  expect(offer.hasMerchantReturnPolicy).toMatchObject({ applicableCountry: "TR", merchantReturnDays: 14 });
  expect(data.aggregateRating).toBeUndefined();
});

test("blog yazısı: başlık, özet, tarih ve yayıncıyla BlogPosting gider", async ({ request }) => {
  const post = seed.blogPosts.find((p) => p.active !== false)!;
  const data = (await jsonLd(request, `/blog/${post.slug}`)).find((d) => d["@type"] === "BlogPosting");
  expect(data).toMatchObject({
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    publisher: { "@type": "Organization", name: "ZENWELD" },
  });
});

test("seçenekli ürün: ürün grubu; her seçenek kendi kodu ve seçenekli linkiyle", async ({ request }) => {
  const product = seed.products.find((p) => p.active && (p.options?.variants.length ?? 0) > 1)!;
  const data = (await jsonLd(request, `/urun/${product.slug}`)).find((d) => d["@type"] === "ProductGroup")!;
  const variants = data.hasVariant as { sku: string; offers: { url: string } }[];
  expect(variants.map((v) => v.sku).sort()).toEqual(product.options!.variants.map((v) => v.sku).sort());
  for (const v of variants) expect(v.offers.url).toMatch(new RegExp(`/urun/${product.slug}\\?secenek=`));
});

test("anasayfada site adı (WebSite); etkinlikte ülke kodu, düzenleyen yok", async ({ request }) => {
  expect((await jsonLd(request, "/")).find((d) => d["@type"] === "WebSite")).toMatchObject({ name: "ZENWELD" });
  const event = seed.events.find((e) => e.active && e.country === "Türkiye")!;
  const data = (await jsonLd(request, `/etkinlikler/${event.slug}`)).find((d) => d["@type"] === "Event")!;
  expect((data.location as { address: { addressCountry: string } }).address.addressCountry).toBe("TR");
  expect(data.organizer).toBeUndefined();
});

test("videolar (K-123, K-125): Videolar sayfasında her video VideoObject; site haritasında video bilgisi", async ({ request }) => {
  const videos = (await jsonLd(request, "/videolar")).filter((d) => d["@type"] === "VideoObject");
  expect(videos).toHaveLength(seed.videos.filter((v) => v.active).length);
  expect(videos[0]).toMatchObject({
    // Ornek veride basliksiz, Y300 QCW'ye bagli: ad urunun adi.
    name: "Y300 QCW Lazer Kaynak Makinesi",
    description: "Y300 QCW Lazer Kaynak Makinesi videosu — Zenweld.",
    uploadDate: seed.videos[0].createdAt,
    embedUrl: `https://www.youtube-nocookie.com/embed/${seed.videos[0].youtubeId}`,
    thumbnailUrl: [`https://i.ytimg.com/vi/${seed.videos[0].youtubeId}/hqdefault.jpg`],
  });
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("xmlns:video=");
  expect(sitemap).toContain(`<video:player_loc>https://www.youtube-nocookie.com/embed/${seed.videos[0].youtubeId}</video:player_loc>`);
});
