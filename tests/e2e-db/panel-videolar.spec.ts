import type { Page } from "@playwright/test";
import { defaultSettings, type HomeVideoSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { demoAccount, field } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › ANASAYFA VIDEOLARI VERITABANINDA (KARARLAR K-125, K-99)
 *
 * Videolar settings('home_videos') satirina yazilir, islem kaydina girer;
 * kayit anasayfada hemen gorunur. Test sonunda ornek veriye geri doner.
 * Demo modundaki hali: tests/e2e/videolar.spec.ts.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const TITLE = `Sahada Zenweld ${Date.now() % 100000}`;
const read = async () => (await sql<{ value: HomeVideoSettings }>("SELECT value FROM settings WHERE key = 'home_videos'"))[0]?.value;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("videolar kaydedilir, işlem kaydına yazılır ve anasayfada görünür; örnek veriye döner", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/videolar");
  await field(page, "Bölüm başlığı").fill(TITLE);
  await page.getByLabel("Ürün").first().selectOption({ label: "ForceArc 200 MMA Elektrot Kaynak Makinesi" });
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Videolar kaydedildi.")).toBeVisible();

  const saved = await read();
  expect(saved.title).toBe(TITLE);
  const [{ id }] = await sql<{ id: string }>("SELECT id FROM products WHERE slug = 'forcearc-200-mma'");
  expect(saved.videos[0]).toEqual({ id: "video-1", youtubeId: "QtZ7JdNzFVo", productId: id, active: true });
  const [log] = await sql<{ entity_label: string }>(
    "SELECT entity_label FROM audit_log WHERE entity_type = 'settings' AND entity_id = 'home_videos' ORDER BY id DESC LIMIT 1",
  );
  expect(log.entity_label).toBe("Anasayfa Videoları");

  // Kayit sitede hemen gorunur; oynatici yalnizca Oynat'a basinca acilir.
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(page.getByRole("heading", { level: 2, name: TITLE })).toBeVisible();
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  await expect(videos.locator("iframe")).toHaveCount(0);
  await videos.getByRole("button", { name: "1. videoyu oynat" }).click();
  await expect(videos.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/QtZ7JdNzFVo/);

  // Ornek veriye don.
  await page.goto("/yonetim/videolar");
  await field(page, "Bölüm başlığı").fill(defaultSettings.homeVideos.title);
  await page.getByLabel("Ürün").first().selectOption({ label: "— Ürün yok —" });
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Videolar kaydedildi.")).toBeVisible();
  await expect.poll(async () => (await read()).videos[0].productId).toBeUndefined();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("oturumsuz kayıt reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/ayarlar/videolar", { data: { videos: {}, updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
