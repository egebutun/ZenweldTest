import { SESSION, expect, field, test } from "./yardimci";

/**
 * PANEL › ANASAYFA TANITIM (demo modu; docs/ADMIN-KULLANIM.md › Anasayfa
 * Tanıtım, KARARLAR K-45)
 *
 * Sayfalar panelden sıralanır, düzenlenir, kapatılır; önizleme kaydedilmemiş
 * taslağı gösterir; kaydedince anasayfa değişir. Veritabanı modundaki hali:
 * tests/e2e-db/panel-tanitim.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("tanıtım alanı panelden düzenlenir: sıra, başlık, etiket, kapatma; önizleme ve anasayfa", async ({ page, problems }) => {
  await page.goto("/yonetim/tanitim");
  await expect(page.getByRole("heading", { level: 1, name: "Anasayfa Tanıtım Alanı" })).toBeVisible();
  const preview = page.frameLocator('iframe[title="Tanıtım alanı önizlemesi"]');
  await expect(preview.getByRole("heading", { level: 2, name: "Atölyeden sahaya, her kaynakta Zenweld gücü" })).toBeVisible();

  // Jasic Lazer ikinci siraya; baslik ve yeni etiket. Onizleme taslagi gosterir.
  await page.getByRole("button", { name: /Jasic Lazer/ }).first().click();
  await page.getByRole("button", { name: "3. sayfayı yukarı taşı" }).click();
  await field(page, "Başlık").fill("Lazerle kusursuz dikiş");
  await page.getByRole("button", { name: "Etiket ekle" }).click();
  await page.getByLabel(/^Etiketler .* 4$/).fill("Lazer Kesim");
  await expect(preview.getByRole("heading", { level: 2, name: "Lazerle kusursuz dikiş" })).toBeVisible();
  await expect(preview.getByText("Lazer Kesim", { exact: true })).toBeVisible();

  // Force Serisi (artik ucuncu) kapatilir; basliksiz kaydedilmez.
  await page.getByRole("button", { name: /Force Serisi/ }).first().click();
  await page.getByLabel("Yayında").uncheck();
  await field(page, "Başlık").fill("");
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("3. sayfa (Force Serisi): başlık yazılmalı.")).toBeVisible();
  await field(page, "Başlık").fill("Kompakt gövde, tam güç");
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Tanıtım alanı kaydedildi.")).toBeVisible();

  // Anasayfa: iki sayfa (Zenweld, Jasic Lazer), Force yok.
  await page.goto("/");
  const hero = page.locator('section[aria-roledescription="carousel"]');
  const slides = hero.locator('[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(2);
  await expect(hero.getByRole("button", { name: "Force Serisi" })).toHaveCount(0);
  await hero.getByRole("button", { name: "Jasic Lazer" }).click();
  await expect(slides.nth(1).getByRole("heading", { level: 2 })).toHaveText("Lazerle kusursuz dikiş");
  await expect(slides.nth(1).getByText("Lazer Kesim", { exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});
