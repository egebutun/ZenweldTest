import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { catalog, closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › TALEPLER VERITABANINDA (Asama 5, 2. alan; KARARLAR K-99, K-100)
 *
 * Teklifler, Yorumlar ve sitedeki formlardan gelen Bayilik Basvurulari ve
 * Mesajlar veritabanindan okunur ve yazilir.
 * Onaylanan yorum sitede hemen gorunur.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const QUOTE = { id: `q-e2e-${stamp}`, code: `TKL-E2E-${stamp}` };
const REVIEW = { id: `rv-e2e-${stamp}`, body: `Panel deneme yorumu ${stamp}` };
const COMPANY = `Başvuru Deneme ${stamp}`;
const MESSAGE = `Panel deneme sorusu ${stamp}`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

let productSlug = "";

test.beforeAll(async () => {
  const product = (await catalog()).products.find((p) => p.active);
  if (!product) throw new Error("Yayında ürün yok.");
  productSlug = product.slug;
  await sql(
    `INSERT INTO quotes (id, code, company_name, contact_name, email, phone, city, payment_preference)
     VALUES ($1, $2, 'Teklif Deneme', 'Yetkili', 'teklif-deneme@ornek.com', '0555', 'Konya', 'havale')`,
    [QUOTE.id, QUOTE.code],
  );
  await sql(
    "INSERT INTO reviews (id, product_id, author_name, rating, body, approved) VALUES ($1, $2, 'Panel Deneme', 5, $3, false)",
    [REVIEW.id, product.id, REVIEW.body],
  );
});

test.afterAll(async () => {
  await sql("DELETE FROM quotes WHERE id = $1", [QUOTE.id]);
  await sql("DELETE FROM reviews WHERE id = $1", [REVIEW.id]);
  await sql("DELETE FROM dealer_applications WHERE company_name = $1", [COMPANY]);
  await sql("DELETE FROM support_messages WHERE message = $1", [MESSAGE]);
});

test("yeni ekranlar menüde: Bayilik Başvuruları, Mesajlar", async ({ page, problems }) => {
  await panelLogin(page);
  const nav = page.locator("nav");
  await nav.getByRole("button", { name: "Bayi ve Satış Ağı" }).click();
  await nav.getByRole("link", { name: "Bayilik Başvuruları" }).click();
  await expect(page).toHaveURL(/\/yonetim\/bayilik-basvurulari$/);
  await nav.getByRole("button", { name: "Müşteriler ve Servis" }).click();
  await nav.getByRole("link", { name: "Mesajlar" }).click();
  await expect(page).toHaveURL(/\/yonetim\/mesajlar$/);
  await expect(nav.getByRole("link", { name: "Welders Club" })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("teklif: durum ve hemen ardından iç not kaydedilir (kendi kaydı uyarı vermez)", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/teklifler");
  await page.getByRole("button", { name: new RegExp(QUOTE.code) }).click();
  await page.getByLabel("Durum").selectOption("sent");
  await page.getByLabel("İç not").fill("Fiyat gönderildi");
  await page.getByLabel("İç not").blur();
  await expect
    .poll(async () => (await sql<{ status: string; admin_note: string | null }>("SELECT status, admin_note FROM quotes WHERE id = $1", [QUOTE.id]))[0])
    .toEqual({ status: "sent", admin_note: "Fiyat gönderildi" });
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("yorum: onaylanınca ürün sayfasında hemen görünür; yayından kaldırılınca gider", async ({ page, request }) => {
  const productHtml = async () => (await request.get(`/urun/${productSlug}`)).text();
  expect(await productHtml()).not.toContain(REVIEW.body);

  await panelLogin(page);
  await page.goto("/yonetim/yorumlar");
  // Yorumun kendi kutusu: metni iceren en icteki kutu.
  const card = page.locator("div", { hasText: REVIEW.body }).last();
  await card.getByRole("button", { name: "Onayla" }).click();
  await expect(card.getByRole("button", { name: "Yayından kaldır" })).toBeVisible();
  expect(await productHtml()).toContain(REVIEW.body);

  await card.getByRole("button", { name: "Yayından kaldır" }).click();
  await expect(card.getByRole("button", { name: "Onayla" })).toBeVisible();
  expect(await productHtml()).not.toContain(REVIEW.body);
  const changes = await sql<{ changes: Record<string, unknown> }>(
    "SELECT changes FROM audit_log WHERE entity_type = 'reviews' AND entity_id = $1 ORDER BY id",
    [REVIEW.id],
  );
  expect(changes.map((r) => r.changes.approved)).toEqual([
    [false, true],
    [true, false],
  ]);
});

test("sitedeki bayilik başvurusu ve ürün sorusu panelde görünür; durumu kaydedilir", async ({ page, request }) => {
  const application = await request.post("/api/bayilik", { data: { company: COMPANY, email: "basvuru-deneme@ornek.com", city: "Konya" } });
  expect((await application.json()).saved).toBe(true);
  const question = await request.post("/api/destek", {
    data: { message: MESSAGE, name: "Soru Deneme", email: "soru-deneme@ornek.com", productName: "Makine", productSku: "ZW-1" },
  });
  expect((await question.json()).saved).toBe(true);

  await panelLogin(page);
  await page.goto("/yonetim/bayilik-basvurulari");
  await page.getByText(COMPANY).click();
  await page.getByLabel("Durum").selectOption("reviewing");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  expect((await sql<{ status: string }>("SELECT status FROM dealer_applications WHERE company_name = $1", [COMPANY]))[0].status).toBe(
    "reviewing",
  );

  await page.goto("/yonetim/mesajlar");
  await page.getByText("Soru Deneme").click();
  await expect(page.getByText(MESSAGE)).toBeVisible();
  await page.getByLabel("Durum").selectOption("answered");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  expect((await sql<{ status: string }>("SELECT status FROM support_messages WHERE message = $1", [MESSAGE]))[0].status).toBe("answered");
});

test("oturumsuz panel isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/talepler/mesaj", { data: { id: "yok", status: "read" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
