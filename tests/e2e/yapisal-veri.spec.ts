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
  const product = seed.products.find((p) => p.active)!;
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
