import { tr } from "@zenweld/i18n";
import { SESSION, expect, test } from "./yardimci";

/**
 * PANEL › ISLEM KAYDI (demo modu)
 *
 * Ekran demo modunda da Ayarlar menusundedir. Kayit yalnizca veritabani
 * modunda tutuldugu icin tablo bostur ve bunun nedenini yazar
 * (veritabani modundaki hali: tests/e2e-db/panel-kayitlar.spec.ts).
 * E-posta yazismalari: eposta.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("İşlem Kaydı menüde; boş tablo kaydın ne zaman tutulacağını yazar", async ({ page }) => {
  await page.goto("/yonetim");
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();

  await page.getByRole("link", { name: "İşlem Kaydı" }).click();
  await expect(page).toHaveURL(/\/yonetim\/islem-kaydi$/);
  await expect(page.getByRole("heading", { name: "İşlem Kaydı" })).toBeVisible();
  await expect(page.getByText(tr.panel.auditLogNotRecorded)).toBeVisible();
  await expect(page.getByRole("link", { name: "E-posta Kaydı" })).toHaveCount(0);
});
