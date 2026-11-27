import { expect, test } from "./yardimci";

/**
 * HIZ KURALLARI (docs/YAPILACAKLAR.md › Ölçüm (hız))
 *
 * Önceden yükleme (9): sayfa açılınca ekrandaki bağlantıların sayfaları
 * indirilmez; ziyaretçi bağlantının üzerine gelince (masaüstü) ya da
 * dokununca (telefon) indirilir. Ölçüm: scripts/sayfa-olcumu.mjs.
 */
const prefetches = (page: import("@playwright/test").Page) => {
  const list: string[] = [];
  page.on("request", (r) => {
    if (r.headers()["next-router-prefetch"]) list.push(new URL(r.url()).pathname);
  });
  return list;
};

test("önceden yükleme: açılışta yok; masaüstünde bağlantının üzerine gelince o sayfa yüklenir", async ({ page, problems }) => {
  const list = prefetches(page);
  await page.goto("/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri");
  await page.waitForLoadState("networkidle");
  expect(list).toEqual([]);
  const link = page.locator("main a[href^='/urun/']").first();
  const href = (await link.getAttribute("href"))!;
  await link.hover();
  await expect.poll(() => list).toContain(href);
  expect(problems).toEqual([]);
});

test.describe("telefon", () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  test("önceden yükleme: telefonda bağlantıya dokununca sayfa yüklenir ve açılır", async ({ page, problems }) => {
    const list = prefetches(page);
    await page.goto("/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri");
    await page.waitForLoadState("networkidle");
    expect(list).toEqual([]);
    const link = page.locator("main a[href^='/urun/']").first();
    const href = (await link.getAttribute("href"))!;
    await link.tap();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    expect(problems).toEqual([]);
  });
});
