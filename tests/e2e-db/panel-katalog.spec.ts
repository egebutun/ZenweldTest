import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, offerOnPage, sql, test } from "./yardimci";

/**
 * PANEL › KATALOG VERITABANINDA, ADIM 3.1 VE 3.2 (Asama 5, 3. alan; KARARLAR K-99, K-101)
 *
 * Seçenek Tanımları, Kategoriler ve gruplar, Ürünler veritabanindan okunur
 * ve yazilir. Kategorinin ya da urunun linki degisince sitede eski adres yeni
 * adrese yonlenir ve degisiklik hemen gorunur. Gorsel dosya deposuna
 * yuklenir (DOSYA_KLASORU, scripts/e2e-db.mts; KARARLAR K-108).
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();
/** 1 x 1 PNG (tarayici kucultmez, oldugu gibi yuklenir). */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const OPTION = `Deneme Seçenek ${stamp}`;
const GROUP = { id: `g-e2e-${stamp}`, slug: `deneme-grup-${stamp}`, name: `Deneme Grup ${stamp}` };
const CATEGORY = { id: `c-e2e-${stamp}`, slug: `deneme-kategori-${stamp}`, name: `Deneme Kategori ${stamp}` };
const NEW = { slug: `yeni-kategori-${stamp}`, name: `Yeni Kategori ${stamp}` };
const NEW_GROUP = `Yeni Grup ${stamp}`;
const PRODUCT = { name: `Deneme Ürün ${stamp}`, sku: `ZW-E2E-${stamp}`, slug: `deneme-urun-${stamp}`, newSlug: `deneme-urun-yeni-${stamp}` };

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
  await sql("DELETE FROM products WHERE sku = $1", [PRODUCT.sku]);
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

test("kategori: link değişince sitedeki eski adres yeni adrese yönlenir, yeni ad hemen görünür; görsel yükleme açık", async ({ page }) => {
  await panelLogin(page);
  await page.goto(`/yonetim/kategoriler/${CATEGORY.id}`);
  // Dosya deposu ayarli: yukleme acik, "adres girin" notu yok.
  await expect(page.getByText("Dosya Yükle").first()).toBeVisible();
  await expect(page.getByText(tr.panel.uploadDisabled)).toHaveCount(0);
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

test("ürün: görseli yüklenerek oluşturulur; fiyatı ve linki değişince sitede hemen görünür, eski link yönlenir; yayından kaldırılır, silinir", async ({
  page,
  request,
}) => {
  await panelLogin(page);
  await page.goto("/yonetim/urunler/yeni");
  await field(page, "Ürün Adı").fill(PRODUCT.name);
  await field(page, "Ürün Kodu (SKU)").fill(PRODUCT.sku);
  await field(page, "Normal fiyat (KDV hariç, ₺)").fill("1000");
  await page.getByRole("button", { name: /^Görseller/ }).click();
  await expect(page.getByText(tr.panel.uploadDisabled)).toHaveCount(0);
  // Gorsel dosya deposuna yuklenir; kayda sitedeki adresi yazilir (K-108).
  await page.locator("input[type=file]").setInputFiles({ name: "kapak.png", mimeType: "image/png", buffer: PNG });
  const uploaded = page.locator('img[src^="/dosya/gorsel/"]').first();
  await expect(uploaded).toBeVisible();
  const address = (await uploaded.getAttribute("src"))!;
  expect(address).toMatch(/^\/dosya\/gorsel\/\d{4}\/\d{2}\/[0-9a-f]{16}\.png$/);
  await page.getByRole("button", { name: "Ürünü Oluştur" }).click();
  await expect(page).toHaveURL(/\/yonetim\/urunler\/p-[0-9a-f]+$/);
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  const [{ id, slug, images }] = await sql<{ id: string; slug: string; images: { url: string }[] }>(
    "SELECT id, slug, images FROM products WHERE sku = $1",
    [PRODUCT.sku],
  );
  expect(slug).toBe(PRODUCT.slug);
  expect(images.map((i) => i.url)).toEqual([address]);
  expect((await offerOnPage(request, `/urun/${slug}`)).price).toBe(1200);
  expect(await (await request.get(`/urun/${slug}`)).text()).toContain(address);
  const image = await request.get(address);
  expect([image.status(), image.headers()["content-type"]]).toEqual([200, "image/png"]);
  expect(Buffer.from(await image.body()).equals(PNG)).toBe(true);

  // Hemen ardindan fiyat ve link degisir (kendi kaydi uyari vermez).
  await field(page, "Normal fiyat (KDV hariç, ₺)").fill("2000");
  await page.getByRole("button", { name: "SEO", exact: true }).click();
  await field(page, "Ürün Linki").fill(PRODUCT.newSlug);
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Ürün kaydedildi.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  expect((await offerOnPage(request, `/urun/${PRODUCT.newSlug}`)).price).toBe(2400);
  await page.goto(`/urun/${PRODUCT.slug}`);
  await expect(page).toHaveURL(new RegExp(`/urun/${PRODUCT.newSlug}$`));

  await page.goto("/yonetim/urunler");
  await page.getByPlaceholder("Ürün adı veya SKU ara…").fill(PRODUCT.sku);
  await page.getByRole("button", { name: `${PRODUCT.name} yayından kaldır` }).click();
  await expect(page.getByRole("button", { name: `${PRODUCT.name} yayına al` })).toBeVisible();
  expect((await sql<{ active: boolean }>("SELECT active FROM products WHERE id = $1", [id]))[0].active).toBe(false);
  const hidden = await page.context().newPage();
  await hidden.goto(`/urun/${PRODUCT.newSlug}`);
  await expect(hidden.getByRole("heading", { name: "Sayfa bulunamadı" })).toBeVisible();
  await hidden.close();

  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: `${PRODUCT.name} sil` }).click();
  await expect.poll(async () => (await sql("SELECT id FROM products WHERE id = $1", [id])).length).toBe(0);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'products' AND entity_id = $1 ORDER BY id", [id]);
  expect(audit.map((r) => r.action)).toEqual(["create", "update", "update", "delete"]);
});

test("oturumsuz katalog isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/katalog/grup-sil", { data: { id: GROUP.id, updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
