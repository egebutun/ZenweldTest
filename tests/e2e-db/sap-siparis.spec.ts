import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * SIPARISLERIN SAP'A AKTARIMI (KARARLAR K-108; deneme aktaricisi)
 *
 * Havale siparisinde panelde "Odeme Alindi" denince siparis SAP aktarim
 * sirasina girer; zamanlanmis is (/api/sap/siparis) gonderir ve sipariş
 * detayindaki SAP Aktarimi kutusu "Aktarildi" ve belge numarasini
 * gosterir. Basarisiz siparis panelden yeniden siraya alinir. Deneme
 * aktaricisi siparisi dosyaya yazar (SAP_SIPARIS_DOSYASI, scripts/e2e-db.mts).
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const ORDER = { id: `o-sap-${stamp}`, code: `SIP-SAP-${stamp}` };

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

const sapBox = (page: Page) => page.locator("div").filter({ has: page.getByRole("heading", { name: "SAP Aktarımı" }) }).last();

const runExport = async (request: import("@playwright/test").APIRequestContext) => {
  const response = await request.post("/api/sap/siparis", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(response.status()).toBe(200);
  return (await response.json()) as { gonderildi: string[] };
};

test.beforeAll(async () => {
  const address = { fullName: "SAP Deneme", phone: "05550000000", city: "Konya", district: "Selçuklu", line: "Örnek Cad. No:1" };
  await sql(
    `INSERT INTO orders (id, code, status, customer_name, email, phone, shipping_address, invoice,
                         subtotal, vat, shipping, total, payment_method, due_at, terms_accepted_at)
     VALUES ($1, $2, 'awaiting_payment', 'SAP Deneme', 'sap-deneme@ornek.com', '05550000000', $3, $4,
             1200, 200, 0, 1200, 'transfer', now() + interval '3 days', now())`,
    [ORDER.id, ORDER.code, address, { type: "individual", fullName: "SAP Deneme", tcKimlikNo: "10000000146", address }],
  );
  await sql(
    `INSERT INTO order_items (order_id, line, product_name, sku, quantity, unit_price_ex_vat, vat_rate, unit_price)
     VALUES ($1, 0, 'Makine', 'ZW-SAP', 1, 1000, 20, 1200)`,
    [ORDER.id],
  );
  await sql("INSERT INTO order_status_history (order_id, seq, status, at) VALUES ($1, 0, 'awaiting_payment', now())", [ORDER.id]);
});

test.afterAll(async () => {
  await sql("DELETE FROM sap_order_exports WHERE order_id = $1", [ORDER.id]);
  await sql("DELETE FROM orders WHERE id = $1", [ORDER.id]);
  await closeDatabase();
});

test("havale onaylanınca sipariş SAP sırasına girer; iş gönderir, panelde belge no görünür", async ({ page, request }) => {
  await panelLogin(page);
  await page.goto(`/yonetim/siparisler/${ORDER.id}`);
  // Odeme beklenen sipariste SAP kutusu yok.
  await expect(page.getByRole("heading", { name: "SAP Aktarımı" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ödeme Alındı" }).click();
  await expect(sapBox(page).getByText("Sırada", { exact: true })).toBeVisible();

  expect((await runExport(request)).gonderildi).toContain(ORDER.code);
  await page.reload();
  await expect(sapBox(page).getByText("Aktarıldı", { exact: true })).toBeVisible();
  await expect(sapBox(page).getByText(`DENEME-${ORDER.code}`)).toBeVisible();

  // Deneme aktaricisi siparisi dosyaya yazdi.
  const lines = (await readFile(process.env.SAP_SIPARIS_DOSYASI!, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  expect(lines.find((l) => l.orderCode === ORDER.code)).toMatchObject({ total: 1200, lines: [{ sku: "ZW-SAP", quantity: 1 }] });
});

test("başarısız aktarım panelden yeniden sıraya alınır", async ({ page, request }) => {
  await sql(
    "UPDATE sap_order_exports SET status = 'failed', attempts = 8, sap_doc_no = NULL, sent_at = NULL, last_error = 'SAP bağlantısı kurulamadı.' WHERE order_id = $1",
    [ORDER.id],
  );
  await panelLogin(page);
  await page.goto(`/yonetim/siparisler/${ORDER.id}`);
  await expect(sapBox(page).getByText("Aktarılamadı", { exact: true })).toBeVisible();
  await expect(sapBox(page).getByText("SAP bağlantısı kurulamadı.")).toBeVisible();
  await sapBox(page).getByRole("button", { name: "Yeniden sıraya al" }).click();
  await expect(sapBox(page).getByText("Sırada", { exact: true })).toBeVisible();
  await expect(sapBox(page).getByRole("button", { name: "Yeniden sıraya al" })).toHaveCount(0);
  const audit = await sql<{ changes: unknown }>(
    "SELECT changes FROM audit_log WHERE entity_type = 'orders' AND entity_id = $1 ORDER BY id DESC LIMIT 1",
    [ORDER.id],
  );
  expect(audit[0].changes).toEqual({ sapExport: ["failed", "pending"] });

  expect((await runExport(request)).gonderildi).toContain(ORDER.code);
});

test("SAP sipariş ucu anahtarsız ya da yanlış anahtarla çalışmaz", async ({ request }) => {
  expect((await request.post("/api/sap/siparis")).status()).toBe(401);
  expect((await request.post("/api/sap/siparis", { headers: { authorization: "Bearer yanlis" } })).status()).toBe(401);
});
