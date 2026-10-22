import { withLuhn } from "../unit/ornek";
import { SESSION, expect, test } from "./yardimci";

/**
 * SEPET VE ODEME (docs/IS-KURALLARI.md › 3–5, KABUL-KONTROL-LISTESI › 7–8)
 *
 * Kart numarasi README'deki test karti degildir; test kendi gecerli
 * numarasini uretir. Ilk 6 hanenin rakam toplami 8'in kati: demoda kart
 * programi Bonus secilir (taksitli POS).
 */
const card = withLuhn("440000000000123");
const expiry = `12/${String((new Date().getFullYear() + 2) % 100).padStart(2, "0")}`;
/** Algoritmaya uyan, kimseye ait olmayan deneme T.C. kimlik numarasi. */
const TEST_TC = "10000000146";

test.describe("üye", () => {
  test.use({ storageState: SESSION.member });

  test("seçenekli ürün kartla satın alınır", async ({ page, problems }) => {
    await page.goto("/urun/mig-torcu-mb25?secenek=5-m");
    const main = page.locator("main");
    await expect(main).toContainText("ZW-TRC-MB25-5");
    await expect(main).toContainText("2.430");
    await page.getByRole("button", { name: "Sepete Ekle" }).first().click();

    await page.goto("/sepet");
    await expect(main).toContainText("ZW-TRC-MB25-5");

    await page.goto("/odeme");
    const tc = page.locator("input[maxlength='11']").first();
    if (await tc.count()) await tc.fill(TEST_TC);
    await page.fill("input[autocomplete=cc-name]", "Deneme Kişi");
    await page.fill("input[autocomplete=cc-number]", card);
    await page.fill("input[autocomplete=cc-exp]", expiry);
    await page.fill("input[autocomplete=cc-csc]", "123");
    await expect(main).toContainText("Kart programı");
    await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
    await page.locator("button:has-text('Öde')").last().click();

    await expect(page).toHaveURL(/\/hesabim\/siparislerim\/SIP-\d{4}-\d{5}/, { timeout: 15_000 });
    await expect(main).toContainText("Hazırlanıyor");
    expect(problems).toEqual([]);
  });
});

test("sepette adet 1 ile 99 arasında tutulur", async ({ page, problems }) => {
  await page.goto("/urun/mig-torcu-mb25");
  await page.getByRole("button", { name: "Sepete Ekle" }).first().click();
  await page.goto("/sepet");
  const quantity = page.getByLabel("Adet").first();
  await quantity.fill("150");
  await expect(quantity).toHaveValue("99");
  await expect(page.getByRole("button", { name: "Artır" }).first()).toBeDisabled();
  await page.getByRole("button", { name: "Azalt" }).first().click();
  await expect(quantity).toHaveValue("98");
  expect(problems).toEqual([]);
});
