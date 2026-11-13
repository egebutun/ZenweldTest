import { expect, test } from "./yardimci";

/**
 * TARAYICI DEPOSU KAPALI (demo modu)
 *
 * Ziyaretci cerezleri/site verisini engellediyse (ornegin iPhone'da "Tum
 * Cerezleri Engelle") tarayicinin deposuna (localStorage, sessionStorage)
 * erismek hata firlatir. Site yine acilir; veri, sepet ve tercihler yalnizca
 * o sayfa acikken bellekte tutulur. Onceden site bu durumda acilmiyor,
 * beyaz sayfada "Bir sorun oluştu" cikiyordu.
 */
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    for (const key of ["localStorage", "sessionStorage"]) {
      Object.defineProperty(window, key, {
        configurable: true,
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      });
    }
  });
});

test("depo kapalıyken sayfalar açılır; sepete ekleme bellekte çalışır", async ({ page, problems }) => {
  for (const path of ["/", "/force", "/ekipmanlar", "/urun/forcemig-200", "/sepet", "/yetkili-bayi-ve-servis-agi", "/yonetim/giris"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText("Bir sorun oluştu");
    await expect(page.locator("main, form").first()).toBeVisible();
  }

  await page.goto("/urun/forcemig-200");
  // Karsilama penceresi ve cerez bandi hatirlanamadigi icin her acilista cikar.
  await page.getByRole("dialog").getByRole("button", { name: "Kapat" }).click();
  await page.getByRole("button", { name: "Tümünü Kabul Et" }).click();
  await page.getByRole("button", { name: /Sepete Ekle/i }).first().click();
  await expect(page.getByRole("link", { name: /Sepete Git/i }).first()).toBeVisible();
  expect(problems).toEqual([]);
});
