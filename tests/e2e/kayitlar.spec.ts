import { tr } from "@zenweld/i18n";
import { SESSION, expect, test } from "./yardimci";

/**
 * PANEL › ISLEM KAYDI VE E-POSTA KAYDI (demo modu)
 *
 * Iki ekran demo modunda da Ayarlar menusundedir. Kayit yalnizca
 * veritabani modunda tutuldugu icin tablo bostur ve bunun nedenini yazar
 * (veritabani modundaki hali: tests/e2e-db/panel-kayitlar.spec.ts).
 */
test.use({ storageState: SESSION.admin });

test("İşlem Kaydı ve E-posta Kaydı menüde; boş tablo kaydın ne zaman tutulacağını yazar", async ({ page }) => {
  await page.goto("/yonetim");
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();

  await page.getByRole("link", { name: "İşlem Kaydı" }).click();
  await expect(page).toHaveURL(/\/yonetim\/islem-kaydi$/);
  await expect(page.getByRole("heading", { name: "İşlem Kaydı" })).toBeVisible();
  await expect(page.getByText(tr.panel.auditLogNotRecorded)).toBeVisible();

  await page.getByRole("link", { name: "E-posta Kaydı" }).click();
  await expect(page).toHaveURL(/\/yonetim\/e-posta-kaydi$/);
  await expect(page.getByRole("heading", { name: "E-posta Kaydı" })).toBeVisible();
  await expect(page.getByText(tr.panel.emailLogNotRecorded)).toBeVisible();
});
