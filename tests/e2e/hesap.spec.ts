import type { Page } from "@playwright/test";
import { expect, test } from "./yardimci";

/**
 * HESABIM › PROFIL: SIFRE DEGISTIRME VE HESABI SILME
 * (docs/IS-KURALLARI.md › 16, WEBSITE-KULLANIM › Hesabım)
 *
 * Demo hesaplar degismesin diye test kendi uyesini olusturur.
 */
async function login(page: Page, email: string, password: string) {
  await page.goto("/giris");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("form button[type=submit]");
}

test("üye şifresini değiştirir ve hesabını siler", async ({ page, problems }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const email = `deneme-${Date.now()}@ornek.com`;
  const main = page.locator("main");

  await page.goto("/kayit");
  // Alan sirasi: Ad, Soyad, E-posta, Telefon, Sehir, Sifre, Sifre (Tekrar)
  const inputs = page.locator("main input");
  await inputs.nth(0).fill("Deneme");
  await inputs.nth(1).fill("Kişi");
  await inputs.nth(2).fill(email);
  await inputs.nth(3).fill("05551112233");
  await inputs.nth(5).fill("ilksifre1");
  await inputs.nth(6).fill("ilksifre1");
  await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
  await page.getByRole("button", { name: "Hesap Oluştur" }).click();
  await expect(page).toHaveURL(/\/hesabim/);

  // Sifre degistirme
  await page.goto("/hesabim/profil");
  const change = async (current: string, next: string, again = next) => {
    await page.fill("#current-password", current);
    await page.fill("#new-password", next);
    await page.fill("#new-password-again", again);
    await page.getByRole("button", { name: "Şifre Değiştir" }).click();
  };
  await change("yanlis", "yenisifre2");
  await expect(main).toContainText("Mevcut şifre hatalı.");
  await change("ilksifre1", "yenisifre2", "baska");
  await expect(main).toContainText("Şifreler eşleşmiyor.");
  await change("ilksifre1", "kisa");
  await expect(main).toContainText("Şifre en az 6 karakter olmalıdır.");
  await change("ilksifre1", "yenisifre2");
  await expect(main).toContainText("Şifreniz değiştirildi.");

  // Eski sifreyle girilemez, yenisiyle girilir.
  await page.goto("/cikis");
  await login(page, email, "ilksifre1");
  await expect(main).toContainText("Şifre hatalı.");
  await login(page, email, "yenisifre2");
  await expect(page).toHaveURL(/\/hesabim/);

  // Hesabi silme: sifre yanlissa silinmez.
  await page.goto("/hesabim/profil");
  await page.fill("#delete-password", "yanlis");
  await page.getByRole("button", { name: "Hesabımı Sil" }).click();
  await expect(main).toContainText("Şifre hatalı.");
  await page.fill("#delete-password", "yenisifre2");
  await page.getByRole("button", { name: "Hesabımı Sil" }).click();
  await expect(page).toHaveURL(/\/giris\?hesap=silindi/);
  await expect(main).toContainText("Hesabınız silindi.");

  await login(page, email, "yenisifre2");
  await expect(main).toContainText("Bu e-posta ile kayıtlı bir hesap bulunamadı.");
  expect(problems).toEqual([]);
});
