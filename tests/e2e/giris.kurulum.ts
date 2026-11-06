import { SESSION, demoAccount, expect, test } from "./yardimci";

/**
 * Testlerden once uye ve yonetici bir kez giris yapar; oturumlar
 * SESSION dosyalarina kaydedilir, hesap ve panel testleri bunlarla acilir.
 */
test("bireysel üye girişi", async ({ page }) => {
  const { email, password } = demoAccount("Bireysel");
  await page.goto("/giris");
  // Giris formu sayfa acildiktan sonra cizilir; alt bilgideki bulten
  // kutusu da e-posta alanidir. Bu yuzden sifre alani olan formu bekleriz.
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(password);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/hesabim/);
  await page.context().storageState({ path: SESSION.member });
});

test("yönetici girişi", async ({ page }) => {
  const { email, password } = demoAccount("Yönetici");
  await page.goto("/yonetim/giris");
  const form = page.locator("form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(password);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/yonetim\/?$/);
  await page.context().storageState({ path: SESSION.admin });
});
