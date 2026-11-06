import { SESSION, expect, readDb, test } from "./yardimci";

/**
 * PANEL › UZUN LISTELER (demo modu; docs/ADMIN-KULLANIM.md › 2)
 *
 * Sayfa basina 50 kayit; durum, arama ve sayfa adreste durur. Demo modunda
 * hesap tarayicidaki veriyle yapilir (lib/admin-lists.ts); veritabani
 * modundaki hali: tests/e2e-db/panel-listeler.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("siparişler 50'şer sayfalanır; durum, arama ve sayfa adreste durur", async ({ page, problems }) => {
  await page.goto("/yonetim/siparisler");
  const db = await readDb(page);
  const total = db.orders.length;
  expect(total).toBeGreaterThan(50);
  const pager = page.getByRole("navigation", { name: "Sayfalar" });
  const rows = page.locator("tbody tr");

  await expect(pager).toContainText(`1–50 / ${total}`);
  await expect(rows).toHaveCount(50);

  await pager.getByRole("link", { name: "Sonraki →" }).click();
  await expect(page).toHaveURL(/\?sayfa=2$/);
  await expect(pager).toContainText(`51–${Math.min(100, total)} / ${total}`);

  // Durum secilince 1. sayfaya donulur; sayi o durumdaki siparislerdir.
  const delivered = db.orders.filter((o) => o.status === "delivered").length;
  await page.getByRole("button", { name: /^Teslim Edildi/ }).click();
  await expect(page).toHaveURL(/\?durum=delivered$/);
  await expect(pager).toContainText(`/ ${delivered}`);

  // Arama adrese yazilir; geri tusu onceki suzgece doner.
  const target = db.orders.find((o) => o.status === "delivered")!;
  await page.getByRole("searchbox", { name: "Siparişlerde ara" }).fill(target.code);
  await expect(page).toHaveURL(new RegExp(`ara=${target.code}`));
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(target.code);

  await page.goto("/yonetim/siparisler?durum=delivered&ara=bulunmayan-siparis");
  await expect(page.getByText("Bu filtreye uyan sipariş yok.")).toBeVisible();
  expect(problems).toEqual([]);
});

test("iade talepleri: sayı ve yeni talep sayısı başlıkta; sayfa bilgisi altta", async ({ page, problems }) => {
  await page.goto("/yonetim/iade-talepleri");
  const db = await readDb(page);
  const total = db.returnRequests.length;
  const fresh = db.returnRequests.filter((r) => r.status === "new").length;
  await expect(page.getByText(`${total} talep · ${fresh} yeni`)).toBeVisible();
  if (total > 0) await expect(page.getByRole("navigation", { name: "Sayfalar" })).toContainText(`1–${Math.min(50, total)} / ${total}`);
  expect(problems).toEqual([]);
});
