import { SESSION, expect, readDb, test } from "./yardimci";

/**
 * PANEL ANA SAYFASI (demo modu; docs/ADMIN-KULLANIM.md › 3)
 *
 * Demo modunda ozet tarayicidaki veriyle, veritabani modundakiyle ayni
 * fonksiyonla hesaplanir (lib/admin-stats.ts › dashboardSummary).
 * Veritabani modundaki hali: tests/e2e-db/panel-ana-sayfa.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("dönem seçimi grafikleri değiştirir ve hatırlanır; genel durum tarayıcıdaki veriyi sayar", async ({ page, problems }) => {
  await page.goto("/yonetim");
  await expect(page.getByRole("heading", { name: "Genel durum" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Son 30 gün" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Günlük ciro", { exact: false })).toBeVisible();

  const db = await readDb(page);
  const orders = page.locator('a[href="/yonetim/siparisler"]').filter({ has: page.locator(".font-display") }).first();
  await expect(orders.locator(".font-display")).toHaveText(String(db.orders.length));

  await page.getByRole("radio", { name: "Son 90 gün" }).click();
  await expect(page.getByText("Haftalık ciro", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("radio", { name: "Son 90 gün" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Haftalık ciro", { exact: false })).toBeVisible();
  expect(problems).toEqual([]);
});
