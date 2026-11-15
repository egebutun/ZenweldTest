import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › MAGAZA AYARLARI VERITABANINDA, ADIM 5.1 (Asama 5, 5. alan;
 * KARARLAR K-99)
 *
 * Kargo ve Ödeme sekmesi sunucuya yazilir ve sitede hemen gecerli olur.
 * E-posta adresleri: eposta.spec.ts.
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");

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

test.afterAll(closeDatabase);

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

test("oturumsuz ayar isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/ayarlar/magaza", { data: { shop: {} } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
