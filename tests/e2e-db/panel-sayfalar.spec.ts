import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › YASAL METINLER, BELGELER, SAYFA SEO VE GÖRÜNÜM VERITABANINDA,
 * ADIM 5.3 (Asama 5, 5. alan; KARARLAR K-99, K-104)
 *
 * Bu ekranlar veritabanindan okunur ve yazilir; kayit sitede hemen gorunur.
 * Belgelerde dosya yuklenmez, dosyanin adresi girilir (K-104).
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const DOC = { title: `Deneme MSDS ${stamp}`, address: `https://dosya.ornek/msds/deneme-${stamp}.pdf` };

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
  await sql("DELETE FROM documents WHERE title LIKE $1", [`Deneme MSDS ${stamp}%`]);
  await closeDatabase();
});

test("yasal metin: başlık kaydedilir ve sitede görünür; hemen ardından eski haline döner (kendi kaydı uyarı vermez)", async ({ page, request }) => {
  const [{ title: original }] = await sql<{ title: string }>("SELECT title FROM legal_pages WHERE id = 'kvkk'");
  const changed = `KVKK Deneme ${stamp}`;
  await panelLogin(page);
  await page.goto("/yonetim/yasal-metinler/kvkk");
  await page.getByRole("button", { name: "Başlık", exact: true }).click();
  const title = field(page.locator("body"), "Başlık");
  await title.fill(changed);
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Metin kaydedildi.")).toBeVisible();
  expect(await (await request.get("/yasal/kvkk")).text()).toContain(changed);

  await title.fill(original);
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Metin kaydedildi.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect((await sql<{ title: string }>("SELECT title FROM legal_pages WHERE id = 'kvkk'"))[0].title).toBe(original);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'legal_pages' AND entity_id = 'kvkk' ORDER BY id DESC LIMIT 2");
  expect(audit.map((a) => a.action)).toEqual(["update", "update"]);
});

test("Sayfa SEO: başlık sayfada görünür; Varsayılana dön ile satır silinir", async ({ page, request }) => {
  await sql("DELETE FROM page_seo WHERE path = '/msds'");
  const changed = `MSDS Deneme ${stamp}`;
  await panelLogin(page);
  await page.goto("/yonetim/sayfa-seo");
  await page.getByRole("button", { name: "MSDS düzenle" }).click();
  const dialog = page.getByRole("dialog");
  await field(dialog, "Sayfa Başlığı").fill(changed);
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await sql("SELECT title FROM page_seo WHERE path = '/msds'")).toEqual([{ title: changed }]);
  expect(await (await request.get("/msds")).text()).toContain(`<title>${changed}</title>`);

  await expect(page.getByRole("button", { name: "MSDS düzenle" })).toBeEnabled();
  await page.getByRole("button", { name: "MSDS düzenle" }).click();
  await dialog.getByRole("button", { name: "Varsayılana dön" }).click();
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(async () => (await sql("SELECT 1 FROM page_seo WHERE path = '/msds'")).length).toBe(0);
  expect(await (await request.get("/msds")).text()).not.toContain(changed);
});

test("belgeler: dosya yerine adres girilir; eklenen belge sitede görünür; yayından kaldırılır; silinir", async ({ page, request }) => {
  await panelLogin(page);
  await page.goto("/yonetim/belgeler");
  await page.getByRole("button", { name: "Belge Ekle" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(tr.panel.documentUploadDisabled)).toBeVisible();
  await expect(dialog.locator("input[type=file]")).toHaveCount(0);

  // Adres girilince baslik dosya adindan dolar; adres yanlissa kaydedilmez.
  await field(dialog, "Dosya adresi").fill(DOC.address);
  await expect(field(dialog, "Başlık")).toHaveValue(`deneme-${stamp}`);
  await field(dialog, "Başlık").fill(DOC.title);
  await field(dialog, "Dosya adresi").fill("dosya.pdf");
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog.getByText("Dosya adresi https:// ile başlamalı ve boşluk içermemeli.")).toBeVisible();
  await field(dialog, "Dosya adresi").fill(DOC.address);
  await expect(field(dialog, "Başlık")).toHaveValue(DOC.title);
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);

  const [doc] = await sql<{ id: string; file_key: string; size_bytes: string }>(
    "SELECT id, file_key, size_bytes FROM documents WHERE title = $1",
    [DOC.title],
  );
  expect([doc.file_key, doc.size_bytes]).toEqual([DOC.address, "0"]);
  const row = page.locator("tr", { hasText: DOC.title });
  await expect(row.getByText(`deneme-${stamp}.pdf`)).toBeVisible();

  const site = await page.context().newPage();
  await site.goto("/msds");
  await expect(site.getByText(DOC.title)).toBeVisible();
  // Belge adresinde yeni sekmede acilir (ornek adres testte cevaplanir).
  await page.context().route("https://dosya.ornek/**", (route) => route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4" }));
  const [opened] = await Promise.all([site.waitForEvent("popup"), site.locator("li", { hasText: DOC.title }).getByRole("button", { name: "Görüntüle" }).click()]);
  expect(opened.url()).toBe(DOC.address);
  await opened.close();

  await row.getByTitle("Yayından kaldır").click();
  await expect.poll(async () => (await sql<{ active: boolean }>("SELECT active FROM documents WHERE id = $1", [doc.id]))[0].active).toBe(false);
  expect(await (await request.get("/msds")).text()).not.toContain(DOC.title);

  page.once("dialog", (d) => {
    expect(d.message()).toBe(`"${DOC.title}" silinsin mi?`);
    void d.accept();
  });
  await row.getByTitle("Sil").click();
  await expect.poll(async () => (await sql("SELECT id FROM documents WHERE id = $1", [doc.id])).length).toBe(0);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'documents' AND entity_id = $1 ORDER BY id", [doc.id]);
  expect(audit.map((a) => a.action)).toEqual(["create", "update", "delete"]);
  await site.close();
});

test("belge sayfası: açıklama kaydedilir ve sitede görünür; eski haline döner", async ({ page, request }) => {
  const [{ subtitle: original }] = await sql<{ subtitle: string }>("SELECT subtitle FROM document_pages WHERE section = 'msds'");
  const changed = `MSDS açıklama ${stamp}`;
  await panelLogin(page);
  await page.goto("/yonetim/belgeler");
  const text = field(page.locator("body"), "Açıklama");
  await text.fill(changed);
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Kaydedildi", { exact: true })).toBeVisible();
  expect(await (await request.get("/msds")).text()).toContain(changed);

  await text.fill(original);
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(async () => (await sql<{ subtitle: string }>("SELECT subtitle FROM document_pages WHERE section = 'msds'"))[0].subtitle).toBe(original);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("Görünüm: yanlış renk kaydedilmez; punto kaydedilir ve eski haline döner", async ({ page }) => {
  const read = async () => (await sql<{ value: { headingSize: number; bodyColor: string } }>("SELECT value FROM settings WHERE key = 'rich_text'"))[0].value;
  const original = await read();
  await panelLogin(page);
  await page.goto("/yonetim/gorunum");
  const body = page.locator("body");
  const color = field(body, "Gövde rengi").locator("xpath=..").locator("input:not([type=color])");
  await color.fill("kırmızı");
  await page.getByRole("button", { name: "Ayarları Kaydet" }).click();
  await expect(page.getByText("Gövde rengi #RRGGBB biçiminde olmalı (örnek: #141619).")).toBeVisible();
  await color.fill(original.bodyColor);

  const size = page.locator("input[type=range]").first();
  await size.fill(String(original.headingSize === 20 ? 21 : 20));
  await page.getByRole("button", { name: "Ayarları Kaydet" }).click();
  await expect(page.getByText("Görünüm ayarları kaydedildi.")).toBeVisible();
  expect((await read()).headingSize).not.toBe(original.headingSize);

  await size.fill(String(original.headingSize));
  await page.getByRole("button", { name: "Ayarları Kaydet" }).click();
  await expect.poll(async () => (await read()).headingSize).toBe(original.headingSize);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("oturumsuz istekler reddedilir", async ({ request }) => {
  for (const path of ["/api/yonetim/icerik/belge-sil", "/api/yonetim/ayarlar/gorunum"]) {
    const answer = await request.post(path, { data: { id: "d1", updatedAt: "" } });
    expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
  }
});
