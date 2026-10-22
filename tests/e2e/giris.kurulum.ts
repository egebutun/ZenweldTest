import { SESSION, demoAccount, expect, test } from "./yardimci";

/**
 * Testlerden once uye ve yonetici bir kez giris yapar; oturumlar
 * SESSION dosyalarina kaydedilir, hesap ve panel testleri bunlarla acilir.
 */
test("bireysel üye girişi", async ({ page }) => {
  const { email, password } = demoAccount("Bireysel");
  await page.goto("/giris");
  await page.fill("input[type=email]", email);
  await page.fill("input[type=password]", password);
  await page.click("form button[type=submit]");
  await expect(page).toHaveURL(/\/hesabim/);
  await page.context().storageState({ path: SESSION.member });
});

test("yönetici girişi", async ({ page }) => {
  const { email, password } = demoAccount("Yönetici");
  await page.goto("/yonetim/giris");
  await page.fill("input[type=email]", email);
  await page.fill("input[type=password]", password);
  await page.click("form button[type=submit]");
  await expect(page).toHaveURL(/\/yonetim\/?$/);
  await page.context().storageState({ path: SESSION.admin });
});
