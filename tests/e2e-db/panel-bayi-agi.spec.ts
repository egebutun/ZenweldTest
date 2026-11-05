import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › BAYI AGI VERITABANINDA, ADIM 4.1 (Asama 5, 4. alan; KARARLAR K-99, K-103)
 *
 * Bayiler, Online Satıcılar ve Satış Temsilcileri veritabanindan okunur ve
 * yazilir; degisiklik sitede (Bayi Bul, Satış Temsilcilerimiz) hemen
 * gorunur. Temsilci fotografi dosya deposuna yuklenebilir (K-108).
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const DEALER = { name: `Deneme Bayi ${stamp}`, renamed: `Deneme Bayi Yeni ${stamp}` };
const RETAILER = `Deneme Satıcı ${stamp}`;
const REP = { name: `Deneme Temsilci ${stamp}`, email: `temsilci-${stamp}@ornek.com` };

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

test.afterAll(async () => {
  await sql("DELETE FROM dealers WHERE name LIKE $1", [`Deneme Bayi%${stamp}`]);
  await sql("DELETE FROM retailers WHERE name = $1", [RETAILER]);
  await sql("DELETE FROM sales_reps WHERE email = $1", [REP.email]);
});

test("bayi: eklenir ve Bayi Bul'da hemen görünür; adı değişir (kendi kaydı uyarı vermez); silinir", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/bayiler");
  await page.getByRole("button", { name: "Yeni Bayi" }).click();
  const dialog = page.getByRole("dialog");
  await field(dialog, "Bayi Adı").fill(DEALER.name);
  await field(dialog, "Şehir").fill("Konya");
  await field(dialog, "İlçe").fill("Selçuklu");
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  const [{ id }] = await sql<{ id: string }>("SELECT id FROM dealers WHERE name = $1", [DEALER.name]);

  const finder = await page.context().newPage();
  await finder.goto("/yetkili-bayi-ve-servis-agi");
  await expect(finder.getByText(DEALER.name).first()).toBeVisible();

  await page.locator("tr", { hasText: DEALER.name }).getByRole("button", { name: "Düzenle" }).click();
  await field(dialog, "Bayi Adı").fill(DEALER.renamed);
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect((await sql<{ name: string }>("SELECT name FROM dealers WHERE id = $1", [id]))[0].name).toBe(DEALER.renamed);
  await finder.reload();
  await expect(finder.getByText(DEALER.renamed).first()).toBeVisible();
  await finder.close();

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${DEALER.renamed} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM dealers WHERE id = $1", [id])).length).toBe(0);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'dealers' AND entity_id = $1 ORDER BY id", [id]);
  expect(audit.map((r) => r.action)).toEqual(["create", "update", "delete"]);
});

test("online satıcı: eklenir (logo metni addan), silinir", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/saticilar");
  await page.getByRole("button", { name: "Yeni Satıcı" }).click();
  const dialog = page.getByRole("dialog");
  await field(dialog, "Satıcı Adı").fill(RETAILER);
  await field(dialog, "Site Adresi").fill("https://deneme-satici.ornek");
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(RETAILER.toLocaleUpperCase("tr"))).toBeVisible();
  const [{ id }] = await sql<{ id: string }>("SELECT id FROM retailers WHERE name = $1", [RETAILER]);

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${RETAILER} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM retailers WHERE id = $1", [id])).length).toBe(0);
});

test("satış temsilcisi: fotoğraf yükleme açık; eklenince sitede görünür, gizlenince gider; silinir", async ({ page, request }) => {
  const repsPage = async () => (await request.get("/satis-temsilcilerimiz")).text();
  await panelLogin(page);
  await page.goto("/yonetim/satis-temsilcileri");
  await page.getByRole("button", { name: "Temsilci ekle" }).click();
  const dialog = page.getByRole("dialog");
  // Dosya deposu ayarli (K-108): yukleme acik, "adres girin" notu yok.
  await expect(dialog.getByText("Dosya yükle")).toBeVisible();
  await expect(dialog.getByText(tr.panel.uploadDisabled)).toHaveCount(0);
  await field(dialog, "Ad Soyad").fill(REP.name);
  await field(dialog, "Bölge / Görev").fill("Deneme Bölgesi");
  await field(dialog, "Telefon").fill("+90 532 000 00 99");
  await field(dialog, "E-posta").fill(REP.email);
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await repsPage()).toContain(REP.name);

  await page.getByRole("button", { name: `${REP.name} sitede gizle` }).click();
  await expect(page.getByRole("button", { name: `${REP.name} sitede göster` })).toBeVisible();
  expect(await repsPage()).not.toContain(REP.name);

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${REP.name} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM sales_reps WHERE email = $1", [REP.email])).length).toBe(0);
});

test("oturumsuz bayi ağı isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/bayi-agi/bayi-sil", { data: { id: "d1", updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
