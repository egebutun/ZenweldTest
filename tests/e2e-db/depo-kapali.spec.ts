import { expect, test } from "./yardimci";

/**
 * TARAYICI DEPOSU KAPALI (veritabani modu)
 *
 * Ziyaretci cerezleri/site verisini engellediyse tarayicinin deposuna
 * erismek hata firlatir; site yine acilir ve urunler sunucudan gelir.
 * Demo modundaki hali: tests/e2e/depo-kapali.spec.ts.
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

test("depo kapalıyken sayfalar açılır; sepete ekleme çalışır", async ({ page, problems }) => {
  for (const path of ["/", "/force", "/ekipmanlar", "/urun/forcemig-200", "/sepet", "/yonetim/giris"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText("Bir sorun oluştu");
    await expect(page.locator("main, form").first()).toBeVisible();
  }

  await page.goto("/urun/forcemig-200");
  await page.getByRole("dialog").getByRole("button", { name: "Kapat" }).click();
  await page.getByRole("button", { name: "Tümünü Kabul Et" }).click();
  await page.getByRole("button", { name: /Sepete Ekle/i }).first().click();
  await expect(page.getByRole("link", { name: /Sepete Git/i }).first()).toBeVisible();
  expect(problems).toEqual([]);
});
