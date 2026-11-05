import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › SATIS VERITABANINDA (Asama 5, 1. alan; KARARLAR K-99)
 *
 * Veritabani modunda Siparisler, Iade Talepleri ve Kuponlar ekranlari
 * veriyi sunucudan okur ve degisiklikleri sunucuya yazar. Kayit ekran
 * acildiktan sonra degismisse kaydedilmez. Her degisiklik ve panel girisi /
 * cikisi islem kaydina (audit_log) yazilir.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const ORDER = { id: `o-e2e-${stamp}`, code: `SIP-E2E-${stamp}` };
const RETURN = { id: `r-e2e-${stamp}`, code: `IAD-E2E-${stamp}` };
const COUPON = `PANEL-${stamp}`.slice(0, 30);

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

const auditRows = (entityId: string) =>
  sql<{ action: string; actor_name: string; changes: Record<string, unknown> | null }>(
    "SELECT action, actor_name, changes FROM audit_log WHERE entity_id = $1 ORDER BY id",
    [entityId],
  );

test.beforeAll(async () => {
  const address = { fullName: "Panel Deneme", phone: "05550000000", city: "Konya", district: "Selçuklu", line: "Örnek Cad. No:1" };
  await sql(
    `INSERT INTO orders (id, code, status, customer_name, email, phone, shipping_address, invoice,
                         subtotal, vat, shipping, total, payment_method, paid_at, terms_accepted_at)
     VALUES ($1, $2, 'preparing', 'Panel Deneme', 'panel-deneme@ornek.com', '05550000000', $3, $4,
             1200, 200, 0, 1200, 'card', now(), now())`,
    [ORDER.id, ORDER.code, address, { type: "individual", fullName: "Panel Deneme", tcKimlikNo: "10000000146", address }],
  );
  await sql("INSERT INTO order_status_history (order_id, seq, status, at) VALUES ($1, 0, 'preparing', now())", [ORDER.id]);
  await sql(
    `INSERT INTO return_requests (id, code, order_id, order_code, customer_name, email, phone, reason)
     VALUES ($1, $2, $3, $4, 'Panel Deneme', 'panel-deneme@ornek.com', '05550000000', 'defective')`,
    [RETURN.id, RETURN.code, ORDER.id, ORDER.code],
  );
});

test.afterAll(async () => {
  await sql("DELETE FROM return_requests WHERE id = $1", [RETURN.id]);
  await sql("DELETE FROM shipments WHERE order_id = $1", [ORDER.id]);
  await sql("DELETE FROM orders WHERE id = $1", [ORDER.id]);
  await sql("DELETE FROM coupons WHERE code = $1", [COUPON]);
});

test("oturumsuz ya da başka siteden gelen panel isteği reddedilir", async ({ request }) => {
  const anonymous = await request.post("/api/yonetim/satis/siparis-notu", { data: { id: ORDER.id, adminNote: "x" } });
  expect([anonymous.status(), (await anonymous.json()).error]).toEqual([401, tr.panel.sessionEnded]);
  const foreign = await request.post("/api/yonetim/satis/siparis-notu", {
    data: { id: ORDER.id, adminNote: "x" },
    headers: { origin: "https://baska-site.example" },
  });
  expect(foreign.status()).toBe(403);
  expect((await sql<{ admin_note: string | null }>("SELECT admin_note FROM orders WHERE id = $1", [ORDER.id]))[0].admin_note).toBeNull();
});

test("sipariş: kargoya verme ve teslim sunucuya yazılır; ekran açıldıktan sonra değişen kayıt kaydedilmez", async ({ page, problems }) => {
  const started = new Date();
  await panelLogin(page);
  const [login] = await sql<{ actor_name: string }>(
    "SELECT actor_name FROM audit_log WHERE action = 'login' AND entity_label = $1 AND at >= $2",
    [admin.email, started],
  );
  expect(login).toBeTruthy();

  // Liste veritabanindan: deneme siparisi gorunur.
  await page.goto("/yonetim/siparisler");
  await page.getByPlaceholder("Sipariş no, müşteri, e-posta…").fill(ORDER.code);
  await page.getByRole("link", { name: ORDER.code }).click();
  await expect(page).toHaveURL(new RegExp(`/yonetim/siparisler/${ORDER.id}$`));

  await page.getByLabel("Takip numarası").fill("TAKIP-1");
  await page.getByRole("button", { name: "Kargoya Ver" }).click();
  await expect(page.getByRole("button", { name: "Teslim Edildi" })).toBeVisible();
  const [shipped] = await sql<{ status: string; tracking_number: string }>(
    "SELECT o.status, s.tracking_number FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.id = $1",
    [ORDER.id],
  );
  expect(shipped).toEqual({ status: "shipped", tracking_number: "TAKIP-1" });

  // Baska biri (ya da baska ekran) siparisi degistirdi: kaydedilmez.
  await sql("UPDATE orders SET admin_note = 'Başka yönetici', updated_at = now() WHERE id = $1", [ORDER.id]);
  await page.getByRole("button", { name: "Teslim Edildi" }).click();
  await expect(page.getByText(tr.panel.staleRecord)).toBeVisible();
  expect((await sql<{ status: string }>("SELECT status FROM orders WHERE id = $1", [ORDER.id]))[0].status).toBe("shipped");

  await page.reload();
  await page.getByRole("button", { name: "Teslim Edildi" }).click();
  await expect(page.getByText("Bu sipariş teslim edildi; başka işlem yok.")).toBeVisible();
  expect((await sql<{ status: string }>("SELECT status FROM orders WHERE id = $1", [ORDER.id]))[0].status).toBe("delivered");

  const rows = await auditRows(ORDER.id);
  expect(rows.map((r) => [r.action, r.changes?.status])).toEqual([
    ["update", ["preparing", "shipped"]],
    ["update", ["shipped", "delivered"]],
  ]);
  expect(rows[0].actor_name).toBeTruthy();
  expect(problems).toEqual([]);
});

test("iade talebi: durum ve iç not sunucuya yazılır", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/iade-talepleri");
  await page.getByText(RETURN.code).click();
  await page.getByLabel("Durum").selectOption("approved");
  await page.getByPlaceholder("İç not (yalnızca panelde görünür)").fill("Kargo kodu verildi");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  const [row] = await sql<{ status: string; admin_note: string }>("SELECT status, admin_note FROM return_requests WHERE id = $1", [
    RETURN.id,
  ]);
  expect(row).toEqual({ status: "approved", admin_note: "Kargo kodu verildi" });
  expect((await auditRows(RETURN.id)).map((r) => r.changes)).toEqual([
    { status: ["new", "approved"], adminNote: [null, "Kargo kodu verildi"] },
  ]);
});

test("kupon: oluşturma, pasife alma ve silme sunucuya yazılır; çıkış kaydedilir", async ({ page, problems }) => {
  await panelLogin(page);
  await page.goto("/yonetim/kuponlar/yeni");
  await page.fill("#coupon-code", COUPON.toLowerCase());
  await page.fill("#coupon-value", "15");
  await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
  await expect(page).toHaveURL(/\/yonetim\/kuponlar\/cpn-[0-9a-f]+$/);
  await expect(page.getByRole("heading", { name: COUPON })).toBeVisible();
  const [coupon] = await sql<{ id: string; discount_value: number; active: boolean }>(
    "SELECT id, discount_value::int, active FROM coupons WHERE code = $1",
    [COUPON],
  );
  expect(coupon).toMatchObject({ discount_value: 15, active: true });

  // Ayni kod ikinci kez kullanilamaz.
  await page.goto("/yonetim/kuponlar/yeni");
  await page.fill("#coupon-code", COUPON);
  await page.fill("#coupon-value", "10");
  await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
  await expect(page.getByText(`"${COUPON}" kodu başka bir kuponda kullanılıyor.`)).toBeVisible();

  await page.goto("/yonetim/kuponlar");
  await page.getByPlaceholder("Kupon kodu veya ad ara…").fill(COUPON);
  const row = page.locator("tr", { hasText: COUPON });
  await row.getByTitle("Pasife al").click();
  await expect(row.getByTitle("Aktif yap")).toBeVisible();
  expect((await sql<{ active: boolean }>("SELECT active FROM coupons WHERE id = $1", [coupon.id]))[0].active).toBe(false);

  page.once("dialog", (dialog) => void dialog.accept());
  await row.getByTitle("Sil").click();
  await expect(page.locator("tr", { hasText: COUPON })).toHaveCount(0);
  expect(await sql("SELECT id FROM coupons WHERE id = $1", [coupon.id])).toEqual([]);
  expect((await auditRows(coupon.id)).map((r) => r.action)).toEqual(["create", "update", "delete"]);

  const before = new Date();
  await page.getByRole("button", { name: "Çıkış" }).click();
  await expect(page).toHaveURL(/\/yonetim\/giris/);
  await expect
    .poll(async () => (await sql("SELECT id FROM audit_log WHERE action = 'logout' AND entity_label = $1 AND at >= $2", [admin.email, before])).length)
    .toBe(1);
  expect(problems).toEqual([]);
});
