import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount, field, selectTab } from "../e2e/yardimci";
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
  // Ornek veride diger videolar Y300 QCW'de (Lazer Kaynak sekmesi); bu video MMA sekmesinde.
  await selectTab(page, "MMA (Stick) Örtülü Elektrot");
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  await expect(videos.locator("iframe")).toHaveCount(0);
  await videos.getByRole("button", { name: "1. videoyu oynat" }).click();
  await expect(videos.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/QtZ7JdNzFVo/);

  // Ornek veriye don.
  await page.goto("/yonetim/videolar");
  await page.getByRole("button", { name: "1. videoyu düzenle" }).click();
  await field(page, "Başlık").fill("");
  await field(page, "Ürün").selectOption({ label: "Y300 QCW Lazer Kaynak Makinesi" });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(async () => (await sql<{ product_id: string | null }>("SELECT product_id FROM videos WHERE id = 'video-1'"))[0].product_id).toBe("p-y300-qcw");
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("kendi videomuz: panelden yüklenir, sunucuda 1080p, 720p ve kapak hazırlanır; sitede parça parça oynar; silinir (K-125)", async ({ page, request }) => {
  test.setTimeout(180_000);
  // 3 saniyelik dik (1080x1920) sesli deneme videosu (iPhone MOV gibi).
  const dir = mkdtempSync(join(tmpdir(), "zenweld-video-test-"));
  const source = join(dir, "Deneme Cekim.mov");
  execFileSync("ffmpeg", [
    "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1080x1920:rate=30:duration=3", "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source,
  ]);

  await panelLogin(page);
  await page.goto("/yonetim/videolar");
  await page.getByRole("button", { name: "Yeni Video" }).click();
  await page.getByLabel("Kendi videomuz (dosya yükle)").check();
  await page.locator('input[type="file"][accept*="video"]').setInputFiles(source);
  await expect(page.getByText(/^Yüklendi: Deneme Cekim\.mov/)).toBeVisible();
  await field(page, "Başlık").fill("Kendi çekimimiz");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  const row = page.locator("tbody tr").filter({ hasText: "Kendi çekimimiz" });
  await expect(row).toBeVisible();

  // Sunucu hazirlar; ekran kendiliginden yenilenir.
  await expect(row.getByText("Hazırlanıyor…")).toHaveCount(0, { timeout: 150_000 });
  await expect(row).toContainText(/Kendi videomuz · 0:03 · 1080×1920/);
  const [video] = await sql<{ file_status: string; file_hd: string; file_sd: string; file_poster: string; file_original: string | null }>(
    "SELECT file_status, file_hd, file_sd, file_poster, file_original FROM videos WHERE title = 'Kendi çekimimiz'",
  );
  expect(video).toMatchObject({ file_status: "ready", file_original: null });
  expect(video.file_hd).toMatch(/^\/dosya\/video\/\d{4}\/\d{2}\/[0-9a-f]{16}\/1080\.mp4$/);

  // Parca parca sunma: 206 ve dogru aralik; orijinal sunulmaz.
  const part = await request.get(video.file_hd, { headers: { range: "bytes=0-99" } });
  expect(part.status()).toBe(206);
  expect(part.headers()["content-range"]).toMatch(/^bytes 0-99\/\d+$/);
  expect((await part.body()).length).toBe(100);
  expect((await request.get(video.file_sd)).headers()["content-type"]).toBe("video/mp4");
  expect((await request.get(video.file_poster)).status()).toBe(200);
  expect((await request.get(video.file_hd.replace("1080.mp4", "orijinal.mov"))).status()).toBe(404);

  // Sitede: kapak gorunur, Oynat'a basinca genis ekranda 1080p oynar.
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  // Urunsuz video "Genel" sekmesinde, tek video.
  await selectTab(page, "Genel");
  await videos.getByRole("button", { name: "1. videoyu oynat" }).click();
  await expect(videos.locator("video")).toHaveAttribute("src", video.file_hd);

  // Temizlik
  await page.goto("/yonetim/videolar");
  page.once("dialog", (d) => void d.accept());
  const n = (await sql<{ n: number }>("SELECT count(*)::int AS n FROM videos"))[0].n;
  await page.getByRole("button", { name: `${n}. videoyu sil` }).click();
  await expect(row).toHaveCount(0);
});

test("oturumsuz kayıt reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/icerik/video", { data: { source: "youtube", youtubeId: "abcdefghijk" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
