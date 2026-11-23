import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount, field } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › VIDEOLAR VERITABANINDA (KARARLAR K-125, K-99)
 *
 * Videolar videos tablosuna yazilir, islem kaydina girer; kayit anasayfada
 * hemen gorunur. Test sonunda ornek veriye geri doner. Demo modundaki hali:
 * tests/e2e/videolar.spec.ts.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const TITLE = `Sahada ForceArc ${Date.now() % 100000}`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("video kaydedilir, işlem kaydına yazılır ve anasayfada görünür; örnek veriye döner", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/videolar");
  await page.getByRole("button", { name: "1. videoyu düzenle" }).click();
  await field(page, "Başlık").fill(TITLE);
  await field(page, "Ürün").selectOption({ label: "ForceArc 200 MMA Elektrot Kaynak Makinesi" });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText(TITLE);

  const [row] = await sql<{ title: string; slug: string }>(
    "SELECT v.title, p.slug FROM videos v JOIN products p ON p.id = v.product_id WHERE v.id = 'video-1'",
  );
  expect(row).toEqual({ title: TITLE, slug: "forcearc-200-mma" });
  const [log] = await sql<{ entity_label: string }>("SELECT entity_label FROM audit_log WHERE entity_type = 'videos' ORDER BY id DESC LIMIT 1");
  expect(log.entity_label).toBe(TITLE);

  // Kayit sitede hemen gorunur; oynatici yalnizca Oynat'a basinca acilir.
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  await expect(videos.locator("iframe")).toHaveCount(0);
  await videos.getByRole("button", { name: "1. videoyu oynat" }).click();
  await expect(videos.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/QtZ7JdNzFVo/);

  // Ornek veriye don.
  await page.goto("/yonetim/videolar");
  await page.getByRole("button", { name: "1. videoyu düzenle" }).click();
  await field(page, "Başlık").fill("");
  await field(page, "Ürün").selectOption({ label: "— Ürün yok —" });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(async () => (await sql<{ product_id: string | null }>("SELECT product_id FROM videos WHERE id = 'video-1'"))[0].product_id).toBeNull();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("oturumsuz kayıt reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/icerik/video", { data: { source: "youtube", youtubeId: "abcdefghijk" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
