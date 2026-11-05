import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › KATALOG VERITABANINDA, ADIM 3.1 (Asama 5, 3. alan; KARARLAR K-99, K-101)
 *
 * Seçenek Tanımları, Kategoriler ve gruplar veritabanindan okunur ve
 * yazilir. Kategorinin linki degisince sitede eski adres yeni adrese
 * yonlenir ve yeni ad hemen gorunur. Gorsel yukleme dosya deposu gelene
 * kadar kapalidir.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const OPTION = `Deneme Seçenek ${stamp}`;
const GROUP = { id: `g-e2e-${stamp}`, slug: `deneme-grup-${stamp}`, name: `Deneme Grup ${stamp}` };
const CATEGORY = { id: `c-e2e-${stamp}`, slug: `deneme-kategori-${stamp}`, name: `Deneme Kategori ${stamp}` };
const NEW = { slug: `yeni-kategori-${stamp}`, name: `Yeni Kategori ${stamp}` };
const NEW_GROUP = `Yeni Grup ${stamp}`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

/** Formdaki alan: etiketi verilen satirin girisi (etiketler girise bagli degil). */
const field = (page: Page, label: string) =>
  page
    .locator("div")
    .filter({ has: page.locator("label", { hasText: label }) })
    .last()
    .locator("input, textarea, select")
    .first();

test.beforeAll(async () => {
  await sql("INSERT INTO category_groups (id, section, slug, name, position) VALUES ($1, 'ekipmanlar', $2, $3, 999)", [
    GROUP.id,
    GROUP.slug,
    GROUP.name,
  ]);
  await sql("INSERT INTO categories (id, group_id, slug, name, description, position) VALUES ($1, $2, $3, $4, '', 1)", [
    CATEGORY.id,
    GROUP.id,
    CATEGORY.slug,
    CATEGORY.name,
  ]);
});

test.afterAll(async () => {
  await sql("DELETE FROM redirects WHERE target_id = $1 OR target_id = $2", [GROUP.id, CATEGORY.id]);
  await sql("DELETE FROM categories WHERE id = $1", [CATEGORY.id]);
  await sql("DELETE FROM category_groups WHERE id = $1 OR name = $2", [GROUP.id, NEW_GROUP]);
  await sql("DELETE FROM option_definitions WHERE name LIKE $1", [`${OPTION}%`]);
});

test("seçenek tanımı: eklenir, hemen ardından adı değişir (kendi kaydı uyarı vermez), silinir", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/secenekler");
  await page.getByRole("button", { name: "Yeni Seçenek" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("ör. Soğutma, Torç Uzunluğu").fill(OPTION);
  await dialog.getByPlaceholder("Yeni değer, ör. 10 m").fill("3 m");
  await dialog.getByRole("button", { name: "Ekle" }).click();
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: `${OPTION} düzenle` })).toBeVisible();

  await page.getByRole("button", { name: `${OPTION} düzenle` }).click();
  await dialog.getByPlaceholder("ör. Soğutma, Torç Uzunluğu").fill(`${OPTION} B`);
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  const rows = await sql<{ id: string; label: string }>(
    "SELECT d.id, v.label FROM option_definitions d JOIN option_values v ON v.option_definition_id = d.id WHERE d.name = $1",
    [`${OPTION} B`],
  );
  expect(rows.map((r) => r.label)).toEqual(["3 m"]);

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${OPTION} B sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM option_definitions WHERE id = $1", [rows[0].id])).length).toBe(0);
  const audit = await sql<{ action: string }>(
    "SELECT action FROM audit_log WHERE entity_type = 'option_definitions' AND entity_id = $1 ORDER BY id",
    [rows[0].id],
  );
  expect(audit.map((r) => r.action)).toEqual(["create", "update", "delete"]);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("kategori: link değişince sitedeki eski adres yeni adrese yönlenir, yeni ad hemen görünür; görsel yükleme kapalı", async ({ page }) => {
  await panelLogin(page);
  await page.goto(`/yonetim/kategoriler/${CATEGORY.id}`);
  await expect(page.getByText(tr.panel.uploadDisabled)).toBeVisible();
  await expect(page.getByText("Dosya Yükle")).toHaveCount(0);
  await field(page, "Kategori Adı").fill(NEW.name);
  await page.getByRole("button", { name: "SEO", exact: true }).click();
  await field(page, "Kategori Linki").fill(NEW.slug);
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Kategori kaydedildi.")).toBeVisible();

  expect(await sql("SELECT slug, name FROM categories WHERE id = $1", [CATEGORY.id])).toEqual([{ slug: NEW.slug, name: NEW.name }]);
  expect(await sql("SELECT old_path FROM redirects WHERE target_id = $1", [CATEGORY.id])).toEqual([
    { old_path: `/ekipmanlar/${GROUP.slug}/${CATEGORY.slug}` },
  ]);

  await page.goto(`/ekipmanlar/${GROUP.slug}/${CATEGORY.slug}`);
  await expect(page).toHaveURL(new RegExp(`/ekipmanlar/${GROUP.slug}/${NEW.slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(NEW.name);
});

test("grup eklenir ve silinir; kategorisi olan grup silinemez; kategori silinir", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/kategoriler/grup/yeni?bolum=ekipmanlar");
  await field(page, "Grup Adı").fill(NEW_GROUP);
  await page.getByRole("button", { name: "Grubu Oluştur" }).click();
  await expect(page).toHaveURL(/\/yonetim\/kategoriler\/grup\/[^/]+$/);
  await expect(page.getByRole("heading", { name: NEW_GROUP })).toBeVisible();
  await expect(page.getByText(tr.panel.recordNotFound)).toHaveCount(0);

  await page.goto("/yonetim/kategoriler");
  await expect(page.getByRole("button", { name: `${GROUP.name} sil` })).toBeDisabled();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${NEW_GROUP} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM category_groups WHERE name = $1", [NEW_GROUP])).length).toBe(0);

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${NEW.name} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM categories WHERE id = $1", [CATEGORY.id])).length).toBe(0);
  // Silinen kategorinin eski adresleri de kalkar.
  expect(await sql("SELECT old_path FROM redirects WHERE target_id = $1", [CATEGORY.id])).toEqual([]);
  await expect(page.getByRole("button", { name: `${GROUP.name} sil` })).toBeEnabled();
});

test("oturumsuz katalog isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/katalog/grup-sil", { data: { id: GROUP.id, updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
