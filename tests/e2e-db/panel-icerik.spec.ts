import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › ICERIK VERITABANINDA, ADIM 5.2 (Asama 5, 5. alan; KARARLAR K-99, K-101)
 *
 * Haberler, Etkinlikler, Blog, Sık Sorulan Sorular ve Hakkımızda
 * veritabanindan okunur ve yazilir; kayit sitede hemen gorunur, link
 * degisince eski adres yeni adrese yonlenir. Gorsel dosyasi yukleme dosya
 * deposu gelene kadar kapalidir (K-101).
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const NEWS = { title: `Deneme Haber ${stamp}`, slug: `deneme-haber-${stamp}`, renamed: `deneme-haber-yeni-${stamp}` };
const FAQ = `Deneme sorusu ${stamp}?`;

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
  await sql("DELETE FROM news WHERE slug LIKE $1", [`deneme-haber-%${stamp}`]);
  await sql("DELETE FROM faqs WHERE question = $1", [FAQ]);
  await closeDatabase();
});

test("haber: eklenir ve sitede görünür; görsel yükleme açık; linki değişince eski adres yönlenir; listeden silinir", async ({ page }) => {
  const body = page.locator("body");
  await panelLogin(page);
  await page.goto("/yonetim/haberler/yeni");
  await field(body, "Haber Başlığı").fill(NEWS.title);
  await page.getByRole("button", { name: "Görseller", exact: true }).click();
  // Dosya deposu ayarli (K-108): yukleme acik, "adres girin" notu yok.
  await expect(page.getByText("Dosya Yükle").first()).toBeVisible();
  await expect(page.getByText(tr.panel.uploadDisabled)).toHaveCount(0);
  await page.getByRole("button", { name: "Haberi Oluştur" }).click();
  await expect(page).toHaveURL(/\/yonetim\/haberler\/n-[0-9a-f]+$/);
  const [{ id }] = await sql<{ id: string }>("SELECT id FROM news WHERE slug = $1", [NEWS.slug]);

  const site = await page.context().newPage();
  await site.goto(`/haberler/${NEWS.slug}`);
  await expect(site.getByText(NEWS.title).first()).toBeVisible();

  await page.getByRole("button", { name: "SEO", exact: true }).click();
  await field(body, "Haber Linki").fill(NEWS.renamed);
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Haber kaydedildi.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect(await sql("SELECT target_id FROM redirects WHERE old_path = $1", [`/haberler/${NEWS.slug}`])).toEqual([{ target_id: id }]);
  await site.goto(`/haberler/${NEWS.slug}`);
  await expect(site).toHaveURL(new RegExp(`/haberler/${NEWS.renamed}$`));
  await site.close();

  await page.goto("/yonetim/haberler");
  await page.getByPlaceholder("Haber başlığı veya özet ara…").fill(NEWS.title);
  page.once("dialog", (d) => void d.accept());
  await page.locator("tr", { hasText: NEWS.title }).getByTitle("Sil").click();
  await expect.poll(async () => (await sql("SELECT id FROM news WHERE id = $1", [id])).length).toBe(0);
  expect(await sql("SELECT 1 FROM redirects WHERE target_id = $1", [id])).toEqual([]);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'news' AND entity_id = $1 ORDER BY id", [id]);
  expect(audit.map((a) => a.action)).toEqual(["create", "update", "delete"]);
});

test("SSS: soru eklenir ve SSS sayfasında görünür; yukarı taşınır; silinir", async ({ page, request }) => {
  await panelLogin(page);
  await page.goto("/yonetim/sss");
  await page.getByRole("button", { name: "Yeni Soru" }).click();
  const dialog = page.getByRole("dialog");
  await field(dialog, "Soru").fill(FAQ);
  await field(dialog, "Cevap").fill("Deneme cevabı.");
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  const [faq] = await sql<{ id: string }>("SELECT id FROM faqs WHERE question = $1", [FAQ]);
  expect(await (await request.get("/sss")).text()).toContain(FAQ);

  // Listedeki yeri (sira numaralari ilk tasimada 1'den yeniden verilir).
  const rank = async () => (await sql<{ id: string }>("SELECT id FROM faqs ORDER BY position, id")).findIndex((r) => r.id === faq.id);
  const before = await rank();
  await page.locator("tr", { hasText: FAQ }).getByRole("button", { name: "Yukarı taşı" }).click();
  await expect.poll(rank).toBe(before - 1);

  page.once("dialog", (d) => void d.accept());
  await page.locator("tr", { hasText: FAQ }).getByRole("button", { name: "Sil" }).click();
  await expect.poll(async () => (await sql("SELECT id FROM faqs WHERE id = $1", [faq.id])).length).toBe(0);
});

test("Hakkımızda: alt başlık kaydedilir ve sitede görünür; hemen ardından eski haline döner (kendi kaydı uyarı vermez)", async ({ page, request }) => {
  const [{ hero_subtitle: original }] = await sql<{ hero_subtitle: string }>("SELECT hero_subtitle FROM about_page WHERE id = 1");
  const changed = `Deneme alt başlık ${stamp}`;
  await panelLogin(page);
  await page.goto("/yonetim/hakkimizda");
  const subtitle = field(page.locator("body"), "Alt başlık");
  await subtitle.fill(changed);
  // Kaydet ustte ve altta var.
  await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
  await expect(page.getByText("Kaydedildi. Hakkımızda sayfası güncellendi.")).toBeVisible();
  expect(await (await request.get("/hakkimizda")).text()).toContain(changed);

  await subtitle.fill(original);
  // Ilk kaydin mesaji ekranda durur; ikinci kaydin sunucu yaniti beklenir.
  const second = page.waitForResponse((r) => r.url().endsWith("/api/yonetim/icerik/hakkimizda"));
  // Kaydet ustte ve altta var.
  await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
  expect((await (await second).json()).ok).toBe(true);
  await expect(page.getByText("Kaydedildi. Hakkımızda sayfası güncellendi.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect((await sql<{ hero_subtitle: string }>("SELECT hero_subtitle FROM about_page WHERE id = 1"))[0].hero_subtitle).toBe(original);
});

test("oturumsuz içerik isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/icerik/sss-sil", { data: { id: "f1", updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
