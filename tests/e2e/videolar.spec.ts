import { SESSION, expect, field, test } from "./yardimci";

/**
 * PANEL › ANASAYFA VIDEOLARI (demo modu; docs/ADMIN-KULLANIM.md › Anasayfa
 * Videoları, KARARLAR K-125)
 *
 * Başlık, ürün, sıra ve yayında durumu panelden değişir; bozuk link
 * kaydedilmez; kaydedince anasayfa değişir. Veritabanı modundaki hali:
 * tests/e2e-db/panel-videolar.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("videolar panelden düzenlenir: başlık, ürün, kapatma, bozuk link; anasayfada ürün adı ürün sayfasına gider", async ({ page, problems }) => {
  await page.goto("/yonetim/videolar");
  await expect(page.getByRole("heading", { level: 1, name: "Anasayfa Videoları" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Anasayfa Videoları" })).toBeVisible();

  await field(page, "Bölüm başlığı").fill("Sahada Zenweld");
  const products = page.getByLabel("Ürün");
  await products.first().selectOption({ label: "ForceArc 200 MMA Elektrot Kaynak Makinesi" });
  await page.getByLabel("Yayında").nth(4).uncheck();

  // Bozuk link kaydedilmez.
  await page.getByLabel("YouTube linki").nth(1).fill("https://vimeo.com/1");
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText(/^2\. video: YouTube linki okunamadı/)).toBeVisible();
  await page.getByLabel("YouTube linki").nth(1).fill("https://youtu.be/9CAoUSHs0R4");
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Videolar kaydedildi.")).toBeVisible();

  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(page.getByRole("heading", { level: 2, name: "Sahada Zenweld" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^\d\. videoyu göster$/ })).toHaveCount(4 + 3);
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  expect(problems).toEqual([]);
});
