import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › STOK MATRISI DOSYA YUKLEME VERITABANINDA, ADIM 4.3 (Asama 5, 4. alan;
 * KARARLAR K-99, K-103)
 *
 * Dosyayi tarayici okur ve onizler; taninmayan kod urune baglanir (sunucuya
 * yazilir), "Stoğu Güncelle" okunan tabloyu sunucuya gonderir, sunucu
 * yeniden eslestirip uygular. Son yukleme geri alininca stok eski haline
 * doner. Test bittiginde stok ilk haline donmus olur.
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const CODE = `BAYI-KOD-${Date.now()}`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

type Row = { product_id: string; variant_id: string; sku: string; quantity: number };
const rowsOf = (dealerId: string) =>
  sql<Row>("SELECT product_id, variant_id, sku, quantity FROM dealer_stock WHERE dealer_id = $1 ORDER BY product_id, variant_id", [dealerId]);

test.afterAll(async () => {
  await sql("DELETE FROM sku_aliases WHERE code = $1", [CODE]);
  await closeDatabase();
});

test("dosya: önizlenir, tanınmayan kod ürüne bağlanır, stok sunucuda güncellenir; son yükleme geri alınınca stok eski haline döner", async ({ page }) => {
  // Aktif bayinin seceneksiz, stoktaki bir urunu ve bayinin listesinde olmayan ikinci bir seceneksiz urun.
  const [row] = await sql<{ dealer_id: string; product_id: string; sku: string; quantity: number }>(
    `SELECT s.dealer_id, p.id AS product_id, p.sku, s.quantity
       FROM dealer_stock s JOIN dealers d ON d.id = s.dealer_id JOIN products p ON p.id = s.product_id
      WHERE d.active AND p.active AND s.variant_id = '' AND s.quantity > 0
        AND NOT EXISTS (SELECT 1 FROM product_options o WHERE o.product_id = p.id)
      ORDER BY s.dealer_id, s.product_id LIMIT 1`,
  );
  test.skip(!row, "Örnek veride uygun stok satırı yok.");
  const [other] = await sql<{ id: string }>(
    `SELECT p.id FROM products p
      WHERE p.active AND NOT EXISTS (SELECT 1 FROM product_options o WHERE o.product_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM dealer_stock s WHERE s.dealer_id = $1 AND s.product_id = p.id)
      ORDER BY p.name LIMIT 1`,
    [row.dealer_id],
  );
  test.skip(!other, "Bayinin listesinde olmayan ürün yok.");
  const before = await rowsOf(row.dealer_id);

  await panelLogin(page);
  await page.goto(`/yonetim/stok?kaynak=dealer:${row.dealer_id}`);
  await page.locator("input[type=file]").setInputFiles({
    name: "bayi-stok.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Kod;Adet\n${row.sku};${row.quantity + 1}\n${CODE};2\n`),
  });
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Tanınmayan kodlar (1)" }).click();
  await dialog.locator("tr", { hasText: CODE }).locator("select").selectOption(`${other.id}|`);
  await dialog.getByRole("button", { name: "Eşleştir" }).click();
  await expect(dialog.getByRole("button", { name: "Tanınmayan kodlar (0)" })).toBeVisible();
  expect(await sql("SELECT product_id FROM sku_aliases WHERE source_id = $1 AND code = $2", [row.dealer_id, CODE])).toEqual([{ product_id: other.id }]);

  // Liste oncekinden cok kisaysa onay istenir.
  const confirm = dialog.getByLabel("Dosyanın tam liste olduğunu kontrol ettim");
  if (await confirm.isVisible()) await confirm.check();
  await dialog.getByRole("button", { name: "Stoğu Güncelle" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(/Stok güncellendi: 2 ürün işlendi/)).toBeVisible();
  expect((await rowsOf(row.dealer_id)).map((r) => [r.product_id, r.sku, r.quantity])).toEqual(
    [
      [row.product_id, row.sku, row.quantity + 1],
      [other.id, CODE, 2],
    ].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
  await expect(page.getByText("bayi-stok.csv")).toBeVisible();

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Bu yüklemeyi geri al" }).click();
  await expect(page.getByText("Yükleme geri alındı; stok önceki haline döndü.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect(await rowsOf(row.dealer_id)).toEqual(before);
  await expect(page.getByText("bayi-stok.csv yüklemesi geri alındı")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bu yüklemeyi geri al" })).toHaveCount(0);
});

test("oturumsuz dosya yükleme isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/stok/dosya", { data: { sourceType: "dealer", sourceId: "d1", table: [], version: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
