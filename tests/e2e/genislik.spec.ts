import type { Page } from "@playwright/test";
import { SESSION, expect, test } from "./yardimci";

/**
 * EKRAN GENISLIKLERI (telefon, tablet, dizustu)
 *
 * Sayfa yana tasmaz; sekme cubuklarinda ([data-sekmeler]) hicbir sekme
 * ekranin disinda kalmaz: sigmayan sekmeler alt satira gecer. Genis tablolar
 * kendi kutusunda yana kayar, sayfa kaymaz. Telefonda butun panel sayfalari,
 * tablet ve dizustunde sekmeli sayfalar denenir. Telefonda ve tablette panel
 * menusu tek "Menu" dugmesidir; sayfa ilk ekranda gorunur.
 */
const TABBED = [
  "/yonetim/magaza",
  "/yonetim/urunler/p-evomig-205-p",
  "/yonetim/urunler/yeni",
  "/yonetim/kategoriler/yeni",
  "/yonetim/kuponlar/yeni",
  "/yonetim/haberler/yeni",
  "/yonetim/etkinlikler/yeni",
  "/yonetim/blog/yeni",
  "/yonetim/belgeler",
];
const PANEL = [
  ...TABBED,
  "/yonetim",
  "/yonetim/siparisler",
  "/yonetim/siparisler/o-ornek-129",
  "/yonetim/teklifler",
  "/yonetim/iade-talepleri",
  "/yonetim/kuponlar",
  "/yonetim/urunler",
  "/yonetim/kategoriler",
  "/yonetim/secenekler",
  "/yonetim/stok",
  "/yonetim/yorumlar",
  "/yonetim/bayiler",
  "/yonetim/saticilar",
  "/yonetim/satis-temsilcileri",
  "/yonetim/uyeler",
  "/yonetim/servis-talepleri",
  "/yonetim/garantiler",
  "/yonetim/mesajlar",
  "/yonetim/welders-club",
  "/yonetim/bayilik-basvurulari",
  "/yonetim/haberler",
  "/yonetim/etkinlikler",
  "/yonetim/blog",
  "/yonetim/hakkimizda",
  "/yonetim/sss",
  "/yonetim/yasal-metinler",
  "/yonetim/sayfa-seo",
  "/yonetim/gorunum",
];
const SITE = ["/", "/urun/evomig-205-p", "/sepet", "/teklif-al", "/servis-talebi", "/garanti/kayit", "/iletisim", "/bayilik-basvurusu"];

/** Sayfanin tasmasi ve ekran disindaki sekmeler. */
async function problems(page: Page, path: string): Promise<string[]> {
  await page.goto(path);
  // Panel ekrani basligiyla, site sayfasi ana icerigiyle cizilmis olur.
  await expect(page.locator(path.startsWith("/yonetim") ? "h1" : "main").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  const found = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const out: string[] = [];
    const overflow = document.documentElement.scrollWidth - width;
    if (overflow > 0) out.push(`sayfa ${overflow} px yana taşıyor`);
    for (const bar of document.querySelectorAll("[data-sekmeler]")) {
      for (const tab of bar.querySelectorAll("button")) {
        const box = tab.getBoundingClientRect();
        if (box.width > 0 && (box.left < 0 || box.right > width)) out.push(`sekme ekran dışında: ${tab.textContent?.trim()}`);
      }
    }
    return out;
  });
  return found.map((p) => `${path}: ${p}`);
}

async function check(page: Page, width: number, paths: string[]) {
  await page.setViewportSize({ width, height: 900 });
  const found: string[] = [];
  for (const path of paths) found.push(...(await problems(page, path)));
  expect(found).toEqual([]);
}

test.describe("panel", () => {
  test.use({ storageState: SESSION.admin });
  test("telefonda (390 px) sayfalar taşmaz, sekmeler ekranda", async ({ page }) => {
    test.setTimeout(180_000);
    await check(page, 390, PANEL);
  });
  test("telefonda menü tek düğme: sayfa ilk ekranda; menü açılır, sayfa seçilince kapanır", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/yonetim/magaza");
    const toggle = page.getByRole("button", { name: /^Menü/ });
    const nav = page.locator("#panel-menu");
    await expect(toggle).toContainText("Mağaza Ayarları");
    await expect(nav).toBeHidden();
    // Sayfanin basligi ilk ekranda (menunun altinda kalmaz).
    const title = await page.getByRole("heading", { name: "Mağaza Ayarları" }).boundingBox();
    expect(title!.y + title!.height).toBeLessThan(844);

    await toggle.click();
    await expect(nav).toBeVisible();
    // Acik sayfanin grubu (Satis) acik gelir.
    await nav.getByRole("link", { name: "Siparişler" }).click();
    await expect(page).toHaveURL(/\/yonetim\/siparisler$/);
    await expect(nav).toBeHidden();
    await expect(toggle).toContainText("Siparişler");
  });

  test("dizüstünde menü solda açık, Menü düğmesi yok", async ({ page }) => {
    await page.goto("/yonetim/magaza");
    await expect(page.locator("#panel-menu")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Menü/ })).toBeHidden();
  });

  for (const width of [768, 1280]) {
    test(`${width} px'te sekmeli sayfalar taşmaz, sekmeler ekranda`, async ({ page }) => {
      test.setTimeout(120_000);
      await check(page, width, TABBED);
    });
  }
});

test("site: telefonda ve tablette sayfalar taşmaz, ürün sekmeleri ekranda", async ({ page }) => {
  test.setTimeout(120_000);
  await check(page, 390, SITE);
  await check(page, 768, SITE);
});
