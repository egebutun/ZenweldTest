import type { Page } from "@playwright/test";
import { changeDb, expect, test } from "./yardimci";

/**
 * LISTELERIN SAYFALANMASI (docs/IS-KURALLARI.md › 26; KARARLAR K-124)
 *
 * Haberlerde sayfa basina 12, kategori urun listesinde 24 kayit. Sonraki
 * sayfalar "<liste>/sayfa/<n>"; her sayfanin basligi ve asil adresi kendisi;
 * "/sayfa/1" listenin adresine 301 ile gider. Ornek veride hicbir liste
 * siniri gecmedigi icin kayitlar bu tarayicida cogaltilir.
 */

/** Ana alandaki, verilen onekle baslayan farkli baglantilarin sayisi. */
async function cards(page: Page, prefix: string): Promise<number> {
  const hrefs = await page.locator(`main a[href^="${prefix}"]`).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  return new Set(hrefs.filter((h) => !h?.includes("/sayfa/"))).size;
}

test("haberler: 12'den fazlası sayfalanır; 2. sayfanın başlığı ve asıl adresi kendisi; /sayfa/1 yönlenir", async ({ page, request }) => {
  await page.goto("/haberler");
  await changeDb(page, (db) => {
    const first = db.news[0];
    for (let i = 1; i <= 14; i++) {
      db.news.push({ ...first, id: `n-e2e-${i}`, slug: `e2e-haber-${i}`, title: `Deneme Haber ${i}`, publishedAt: `2001-01-${String(i).padStart(2, "0")}T09:00:00+03:00` });
    }
  });
  const total = (await page.evaluate(() => JSON.parse(localStorage.getItem("zenweld.db.v1")!).news.length)) as number;
  await expect.poll(() => cards(page, "/haberler/")).toBe(12);
  await page.getByRole("navigation", { name: "Sayfalar" }).getByRole("link", { name: "Sayfa 2" }).click();
  await expect(page).toHaveURL(/\/haberler\/sayfa\/2$/);
  await expect.poll(() => cards(page, "/haberler/e2e-haber-")).toBeGreaterThan(0);
  expect(await cards(page, "/haberler/")).toBe(total - 12);

  const html = await (await request.get("/haberler/sayfa/2")).text();
  expect(html).toMatch(/<title>Haberler — Sayfa 2 \| ZENWELD<\/title>/);
  expect(html).toMatch(/<link rel="canonical" href="[^"]*\/haberler\/sayfa\/2"/);
  const first = await request.get("/haberler/sayfa/1", { maxRedirects: 0 });
  expect([first.status(), new URL(first.headers()["location"], "http://site").pathname]).toEqual([301, "/haberler"]);
});

test("kategori: 24'ten fazla ürün sayfalanır; 2. sayfanın başlığı ve asıl adresi kendisi", async ({ page, request }) => {
  const base = "/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri";
  await page.goto(base);
  await changeDb(page, (db) => {
    const model = db.products.find((p) => p.active && p.categorySlug === "mig-gazalti-kaynak-makineleri")!;
    for (let i = 1; i <= 26; i++) {
      db.products.push({ ...model, id: `p-e2e-${i}`, slug: `e2e-urun-${i}`, sku: `ZW-E2E-SAYFA-${i}`, name: `Deneme Ürün ${i}`, options: undefined });
    }
  });
  const total = (await page.evaluate(
    () => JSON.parse(localStorage.getItem("zenweld.db.v1")!).products.filter((p: { active: boolean; categorySlug: string }) => p.active && p.categorySlug === "mig-gazalti-kaynak-makineleri").length,
  )) as number;
  // Sayfa tarayicida hazir olunca cogaltilmis liste gorunur.
  await expect.poll(() => cards(page, "/urun/")).toBe(24);
  await page.getByRole("navigation", { name: "Sayfalar" }).getByRole("link", { name: "Sayfa 2" }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/sayfa/2$`));
  await expect.poll(() => cards(page, "/urun/")).toBe(total - 24);

  const html = await (await request.get(`${base}/sayfa/2`)).text();
  expect(html).toMatch(/<title>[^<]* — Sayfa 2 \| ZENWELD<\/title>/);
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="[^"]*${base}/sayfa/2"`));
});
