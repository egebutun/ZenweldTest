import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › MAGAZA AYARLARI VERITABANINDA, ADIM 5.1 (Asama 5, 5. alan;
 * KARARLAR K-99, K-104)
 *
 * Kargo ve Ödeme sekmesi sunucuya yazilir ve sitede hemen gecerli olur.
 * E-posta Alıcıları sekmesinde yazilan adres, o turun e-postasinin alicisi
 * olur (email_log); bos birakilinca varsayilan adrese doner.
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const CONTACT = `iletisim-${stamp}@zenweld.com`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

/** Formdaki alan: etiketi verilen satirin girisi (etiketler girise bagli degil). */
const field = (scope: Locator, label: string) =>
  scope
    .locator("div")
    .filter({ has: scope.page().locator("label", { hasText: label }) })
    .last()
    .locator("input, textarea, select")
    .first();

const shippingFee = async () =>
  (await sql<{ value: { shippingFee: number } }>("SELECT value FROM settings WHERE key = 'shop'"))[0].value.shippingFee;

test.afterAll(async () => {
  await sql("DELETE FROM email_recipients WHERE $1 = ANY(recipients)", [CONTACT]);
  await closeDatabase();
});

test("Kargo ve Ödeme: kargo ücreti kaydedilir ve sitede hemen geçerli olur; hemen ardından eski haline döner (kendi kaydı uyarı vermez)", async ({
  page,
  request,
}) => {
  const original = await shippingFee();
  await panelLogin(page);
  await page.goto("/yonetim/magaza");
  const fee = field(page.locator("body"), "Kargo ücreti (₺, KDV dahil)");
  await fee.fill("151.37");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Mağaza ayarları kaydedildi.")).toBeVisible();
  await expect.poll(shippingFee).toBe(151.37);
  // Site sepet hesabinda ayari sayfa cercevesinden alir.
  expect(await (await request.get("/sepet")).text()).toMatch(/shippingFee\\?":151\.37/);

  await fee.fill(String(original));
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(shippingFee).toBe(original);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  await expect(page.getByText("Kaydedilmemiş değişiklikler var.", { exact: false })).toHaveCount(0);
  const audit = await sql<{ changes: { shippingFee: [number, number] } }>(
    "SELECT changes FROM audit_log WHERE entity_type = 'settings' AND entity_id = 'shop' ORDER BY id DESC LIMIT 2",
  );
  expect(audit.map((a) => a.changes.shippingFee).reverse()).toEqual([
    [original, 151.37],
    [151.37, original],
  ]);
});

test("E-posta Alıcıları: yazılan adres o türün e-postasının alıcısı olur; boşaltılınca varsayılana döner", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/magaza");
  await page.getByRole("button", { name: "E-posta Alıcıları" }).click();
  const contact = page.getByLabel("İletişim formu alıcıları");
  await contact.fill(` ${CONTACT.toUpperCase()} `);
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("E-posta alıcıları kaydedildi.")).toBeVisible();
  await expect(contact).toHaveValue(CONTACT);
  expect(await sql("SELECT recipients FROM email_recipients WHERE type = 'iletisim'")).toEqual([{ recipients: [CONTACT] }]);

  const message = await page.request.post("/api/bildirim", {
    data: { type: "iletisim", data: { name: "Deneme", email: `uye-${stamp}@ornek.com`, message: "Merhaba" } },
  });
  expect((await message.json()).saved).toBe(true);
  await expect
    .poll(async () => (await sql<{ recipients: string[] }>("SELECT recipients FROM email_log WHERE type = 'iletisim' ORDER BY id DESC LIMIT 1"))[0]?.recipients)
    .toEqual([CONTACT]);

  await contact.fill("");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(async () => (await sql("SELECT 1 FROM email_recipients WHERE type = 'iletisim'")).length).toBe(0);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("oturumsuz ayar isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/ayarlar/eposta-alicilari", { data: { items: [], version: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
