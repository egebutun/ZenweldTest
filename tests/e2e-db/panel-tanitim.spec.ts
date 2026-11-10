import type { Page } from "@playwright/test";
import type { HomeHeroSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { demoAccount, field } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › ANASAYFA TANITIM VERITABANINDA (KARARLAR K-45, K-99)
 *
 * Tanitim alani settings('home_hero') satirina yazilir, islem kaydina
 * girer; kayit anasayfada hemen gorunur. Test sonunda "Varsayılana Dön" ile
 * ornek veriye geri doner. Demo modundaki hali: tests/e2e/tanitim.spec.ts.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const TITLE = `Lazerle kusursuz dikiş ${Date.now() % 100000}`;
const read = async () => (await sql<{ value: HomeHeroSettings }>("SELECT value FROM settings WHERE key = 'home_hero'"))[0]?.value;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("tanıtım alanı kaydedilir, işlem kaydına yazılır ve anasayfada görünür; varsayılana döner", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/tanitim");
  const preview = page.frameLocator('iframe[title="Tanıtım alanı önizlemesi"]');
  await expect(preview.getByRole("heading", { level: 2 }).first()).toBeVisible();

  await page.getByRole("button", { name: /Jasic Lazer/ }).first().click();
  await field(page, "Başlık").fill(TITLE);
  await page.getByRole("button", { name: "Etiket ekle" }).click();
  await page.getByLabel(/^Etiketler .* 4$/).fill("Lazer Kesim");
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Tanıtım alanı kaydedildi.")).toBeVisible();

  const saved = await read();
  expect(saved.slides.map((s) => s.id)).toEqual(["zenweld", "force", "jasic-lazer"]);
  expect(saved.slides[2]).toMatchObject({ title: TITLE, chips: ["Lazer Kaynak", "Lazer Temizleme", "Lazer Markalama", "Lazer Kesim"] });
  const [log] = await sql<{ entity_label: string }>(
    "SELECT entity_label FROM audit_log WHERE entity_type = 'settings' AND entity_id = 'home_hero' ORDER BY id DESC LIMIT 1",
  );
  expect(log.entity_label).toBe("Anasayfa Tanıtım");

  // Kayit sitede hemen gorunur (katalog onbellegi yenilenir).
  await page.goto("/");
  const hero = page.locator('section[aria-roledescription="carousel"]');
  await hero.getByRole("button", { name: "Jasic Lazer" }).click();
  await expect(hero.locator('[aria-roledescription="slide"]').nth(2).getByRole("heading", { level: 2 })).toHaveText(TITLE);

  // Varsayilana don: ornek veri geri gelir; ekran kendi kaydi icin uyari vermez.
  await page.goto("/yonetim/tanitim");
  await page.getByRole("button", { name: "Varsayılana Dön" }).click();
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Tanıtım alanı kaydedildi.")).toBeVisible();
  await expect.poll(async () => (await read()).slides[2].title).toBe("Lazerle daha hızlı, daha temiz, daha hassas");
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("oturumsuz kayıt reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/ayarlar/tanitim", { data: { hero: {}, updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
