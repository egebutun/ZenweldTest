import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › STOK MATRISI VERITABANINDA, ADIM 4.2 (Asama 5, 4. alan; KARARLAR K-99, K-103)
 *
 * Liste, kaynak sayfasi ve Ürün Bazında veritabanindan okunur; adet
 * duzeltme, satir ekleme ve silme ve "kac gunden eski stok gosterilmez"
 * ayari sunucuya yazilir, stok gecmisine ve islem kaydina duser.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

/** Aktif bir bayinin, seceneksiz ve yayindaki bir urunde adedi olan satiri. */
async function dealerRow() {
  const [row] = await sql<{ dealer_id: string; dealer: string; product_id: string; product: string; quantity: number }>(
    `SELECT s.dealer_id, d.name AS dealer, s.product_id, p.name AS product, s.quantity
       FROM dealer_stock s JOIN dealers d ON d.id = s.dealer_id JOIN products p ON p.id = s.product_id
      WHERE d.active AND p.active AND s.variant_id = '' AND s.quantity > 0
        AND NOT EXISTS (SELECT 1 FROM product_options o WHERE o.product_id = p.id)
      ORDER BY s.dealer_id, s.product_id LIMIT 1`,
  );
  if (!row) throw new Error("Örnek veride uygun stok satırı yok.");
  return row;
}

test("liste: kaynakların stoktaki ürün sayısı veritabanındaki satırlarla aynı", async ({ page }) => {
  const row = await dealerRow();
  const [{ rows, in_stock }] = await sql<{ rows: number; in_stock: number }>(
    "SELECT count(*)::int AS rows, (count(*) FILTER (WHERE quantity > 0))::int AS in_stock FROM dealer_stock WHERE dealer_id = $1",
    [row.dealer_id],
  );
  await panelLogin(page);
  await page.goto("/yonetim/stok");
  await page.getByPlaceholder("Bayi/satıcı veya şehir ara…").fill(row.dealer);
  await expect(page.locator("tr", { hasText: row.dealer }).first()).toContainText(`${in_stock} / ${rows}`);
});

test("kaynak sayfası: adet düzeltilir, hemen ardından geri alınır (kendi kaydı uyarı vermez); geçmişe ve işlem kaydına yazılır", async ({ page }) => {
  const row = await dealerRow();
  await panelLogin(page);
  await page.goto(`/yonetim/stok?kaynak=dealer:${row.dealer_id}`);
  const quantity = page.getByLabel(`${row.product} adet`);
  await quantity.fill("0");
  await quantity.press("Enter");
  await expect
    .poll(async () => (await sql<{ quantity: number }>("SELECT quantity FROM dealer_stock WHERE dealer_id = $1 AND product_id = $2 AND variant_id = ''", [row.dealer_id, row.product_id]))[0].quantity)
    .toBe(0);
  await expect(page.getByText(`${row.product}: adet ${row.quantity} → 0`)).toBeVisible();

  await quantity.fill(String(row.quantity));
  await quantity.press("Enter");
  await expect
    .poll(async () => (await sql<{ quantity: number }>("SELECT quantity FROM dealer_stock WHERE dealer_id = $1 AND product_id = $2 AND variant_id = ''", [row.dealer_id, row.product_id]))[0].quantity)
    .toBe(row.quantity);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  const audit = await sql<{ changes: { quantity: [number, number] } }>(
    "SELECT changes FROM audit_log WHERE entity_type = 'dealer_stock' AND entity_id = $1 ORDER BY id DESC LIMIT 2",
    [`${row.dealer_id}/${row.product_id}|`],
  );
  expect(audit.map((a) => a.changes.quantity).reverse()).toEqual([
    [row.quantity, 0],
    [0, row.quantity],
  ]);
});

test("kaynak sayfası: satır eklenir ve listeden çıkarılır", async ({ page }) => {
  const row = await dealerRow();
  const [missing] = await sql<{ id: string; name: string }>(
    `SELECT p.id, p.name FROM products p
      WHERE p.active AND NOT EXISTS (SELECT 1 FROM dealer_stock s WHERE s.dealer_id = $1 AND s.product_id = p.id)
      ORDER BY p.name LIMIT 1`,
    [row.dealer_id],
  );
  test.skip(!missing, "Bayinin listesinde olmayan ürün yok.");
  await panelLogin(page);
  await page.goto(`/yonetim/stok?kaynak=dealer:${row.dealer_id}`);
  await page.locator("select").filter({ hasText: "Ürün seçin…" }).selectOption(`${missing.id}|`);
  await page.getByLabel("Adet", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Ekle" }).click();
  await expect
    .poll(async () => (await sql("SELECT 1 FROM dealer_stock WHERE dealer_id = $1 AND product_id = $2", [row.dealer_id, missing.id])).length)
    .toBe(1);

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${missing.name} satırını sil` }).click();
  await expect
    .poll(async () => (await sql("SELECT 1 FROM dealer_stock WHERE dealer_id = $1 AND product_id = $2", [row.dealer_id, missing.id])).length)
    .toBe(0);
  await expect(page.getByText(`${missing.name}: listeden çıkarıldı (adet 3)`)).toBeVisible();
});

test("stok geçerlilik süresi kaydedilir ve hemen ardından eski haline döner", async ({ page }) => {
  const [setting] = await sql<{ value: { staleDays: number } }>("SELECT value FROM settings WHERE key = 'stock'");
  const original = setting?.value.staleDays ?? 3;
  await panelLogin(page);
  await page.goto("/yonetim/stok");
  const days = page.getByLabel("Gün");
  await days.fill(String(original + 7));
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  expect((await sql<{ value: { staleDays: number } }>("SELECT value FROM settings WHERE key = 'stock'"))[0].value.staleDays).toBe(original + 7);

  await days.fill(String(original));
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect((await sql<{ value: { staleDays: number } }>("SELECT value FROM settings WHERE key = 'stock'"))[0].value.staleDays).toBe(original);
});

test("Ürün Bazında: ürünün stokta olduğu bayi görünür", async ({ page }) => {
  const row = await dealerRow();
  await panelLogin(page);
  // Adresteki urun acik gelir.
  await page.goto(`/yonetim/stok?sekme=urun&urun=${row.product_id}`);
  await expect(page.getByRole("link", { name: row.dealer }).first()).toBeVisible();
});

test("oturumsuz stok isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/stok/ayar", { data: { staleDays: 5 } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
