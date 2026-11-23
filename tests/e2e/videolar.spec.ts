import { SESSION, expect, field, test } from "./yardimci";

/**
 * PANEL › VIDEOLAR (demo modu; docs/ADMIN-KULLANIM.md › Videolar, KARARLAR
 * K-125)
 *
 * Video kütüphanesi: video eklenir, düzenlenir (ürün, anasayfada göster),
 * sıralanır, silinir; aynı video ve bozuk link kaydedilmez; bölüm başlığı
 * ayrı kaydedilir. Anasayfa kütüphaneden okur. Veritabanı modundaki hali:
 * tests/e2e-db/panel-videolar.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("video kütüphanesi: ekleme, düzenleme, sıra, silme, bölüm başlığı; anasayfada ürün adı ürün sayfasına gider", async ({ page, problems }) => {
  await page.goto("/yonetim/videolar");
  await expect(page.getByRole("heading", { level: 1, name: "Videolar" })).toBeVisible();
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(5);

  // Bolum basligi
  await field(page, "Anasayfa bölüm başlığı").fill("Sahada Zenweld");
  await page.getByRole("button", { name: "Başlığı Kaydet" }).click();
  await expect(page.getByText("Bölüm başlığı kaydedildi.")).toBeVisible();

  // 1. videoya urun; 5. video anasayfadan cikarilir
  await page.getByRole("button", { name: "1. videoyu düzenle" }).click();
  await field(page, "Ürün").selectOption({ label: "ForceArc 200 MMA Elektrot Kaynak Makinesi" });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows.first()).toContainText("ForceArc 200 MMA Elektrot Kaynak Makinesi");
  await page.getByRole("button", { name: "5. videoyu düzenle" }).click();
  await page.getByLabel("Anasayfada göster").uncheck();
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows.nth(4).getByText("Anasayfada")).toHaveCount(0);

  // Yeni video: bozuk link ve ayni video kaydedilmez
  await page.getByRole("button", { name: "Yeni Video" }).click();
  await field(page, "YouTube linki").fill("https://vimeo.com/1");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText(/YouTube linki okunamadı/)).toBeVisible();
  await field(page, "YouTube linki").fill("https://youtu.be/9CAoUSHs0R4");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Bu YouTube videosu kütüphanede zaten var.")).toBeVisible();
  await field(page, "YouTube linki").fill("https://www.youtube.com/shorts/abcdefghijk");
  await field(page, "Başlık").fill("Yeni çekim");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows).toHaveCount(6);
  await expect(rows.last()).toContainText("Yeni çekim");

  // Sira ve silme
  await page.getByRole("button", { name: "6. videoyu yukarı taşı" }).click();
  await expect(rows.nth(4)).toContainText("Yeni çekim");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "5. videoyu sil" }).click();
  await expect(rows).toHaveCount(5);

  // Anasayfa: baslik, 4 video (5. anasayfada degil), urun adi urun sayfasina gider
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(page.getByRole("heading", { level: 2, name: "Sahada Zenweld" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^\d\. videoyu göster$/ })).toHaveCount(4 + 3);
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  expect(problems).toEqual([]);
});
