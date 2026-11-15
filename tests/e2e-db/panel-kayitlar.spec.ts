import type { Page } from "@playwright/test";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › ISLEM KAYDI (Asama 5, 6. alan)
 *
 * Ayarlar menusundedir ve veritabanindan okur. Panele giris islem
 * kaydinda gorunur; suzgecler adreste durur. E-posta yazismalari:
 * eposta.spec.ts.
 */
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const stamp = Date.now();

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("işlem kaydı: panele giriş görünür; işleme ve yöneticiye göre süzülür", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim");
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page.getByRole("link", { name: "İşlem Kaydı" }).click();
  await expect(page).toHaveURL(/\/yonetim\/islem-kaydi$/);
  await expect(page.getByRole("heading", { name: "İşlem Kaydı" })).toBeVisible();

  await page.getByLabel("İşlem", { exact: true }).selectOption("login");
  await page.getByRole("button", { name: "Süz" }).click();
  await expect(page).toHaveURL(/islem=login/);
  const [{ id, name }] = await sql<{ id: string; name: string }>(
    "SELECT actor_user_id AS id, actor_name AS name FROM audit_log WHERE action = 'login' ORDER BY id DESC LIMIT 1",
  );
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText("Giriş yaptı");
  await expect(first).toContainText(name);
  // Baska islem turu bu suzgecte yok.
  await expect(page.locator("tbody tr", { hasText: "Değiştirdi" })).toHaveCount(0);

  await page.goto(`/yonetim/islem-kaydi?yonetici=${id}&ara=${encodeURIComponent("bulunmayacak-" + stamp)}`);
  await expect(page.getByText("Kayıt yok.")).toBeVisible();
});

test("oturumsuz kayıt ekranı açılmaz", async ({ page }) => {
  await page.goto("/yonetim/islem-kaydi");
  await expect(page).toHaveURL(/\/yonetim\/giris/);
  await expect(page.getByText("Giriş yaptı")).toHaveCount(0);
});
