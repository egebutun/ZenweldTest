import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { SESSION, expect, test } from "./yardimci";

/**
 * FORM KAYITLARI DEMO MODUNDA (KARARLAR K-109)
 *
 * Iletisim formu, urun destek sorusu ve bayilik basvurusu demo modunda
 * e-postayla birlikte tarayiciya da kaydedilir; panelde Mesajlar ve Bayilik
 * Basvurulari ekranlarinda ayni tarayicida gorunur, durum ve not kaydedilir.
 * Servis talebi de tarayiciya kaydedilir ve Servis Talepleri listesinin
 * en ustunde gorunur. (Veritabani modundaki hali:
 * tests/e2e-db/formlar.spec.ts ve panel-talepler.spec.ts.)
 */
test.use({ storageState: SESSION.admin });

const stamp = Date.now();

/** Formdaki alan: etiketi verilen satirin girisi. */
const field = (page: Page, label: string): Locator =>
  page
    .locator("main div")
    .filter({ has: page.locator("label", { hasText: label }) })
    .last()
    .locator("input, textarea, select")
    .first();

test("formlar tarayıcıya kaydedilir; panelde görünür, durum ve not kaydedilir", async ({ page }) => {
  // Iletisim
  await page.goto("/iletisim");
  await field(page, tr.support.name).fill("Ayşe Demo");
  await field(page, tr.support.email).fill(`ayse-${stamp}@ornek.com`);
  await field(page, tr.support.subject).fill(`Bayi bilgisi ${stamp}`);
  await field(page, tr.support.message).fill("Konya'da en yakın bayi?");
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText(tr.support.sent)).toBeVisible();

  // Urun destek sorusu
  await page.goto("/urun/evomig-205-p");
  await page.getByRole("button", { name: tr.support.chatTitle }).first().click();
  await page.getByPlaceholder(tr.support.chatPlaceholder).fill(`Torç uzunluğu ${stamp}?`);
  await page.getByPlaceholder(tr.support.chatEmail, { exact: true }).fill(`soru-${stamp}@ornek.com`);
  await page.getByRole("button", { name: tr.support.chatSend }).click();
  await expect(page.getByText(tr.support.chatAnswer)).toBeVisible();

  // Bayilik basvurusu
  await page.goto("/bayilik-basvurusu");
  await field(page, tr.dealerApply.company).fill(`Demo Hırdavat ${stamp}`);
  await field(page, tr.dealerApply.city).fill("Bursa");
  await field(page, tr.dealerApply.contactName).fill("Mehmet Bayi");
  await field(page, tr.dealerApply.email).fill(`bayi-${stamp}@ornek.com`);
  await field(page, tr.dealerApply.phone).fill("05551112233");
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText(tr.dealerApply.thanksTitle)).toBeVisible();

  // Panel › Mesajlar: iki mesaj; durum ve not kaydedilir, yenilenince kalir.
  await page.goto("/yonetim/mesajlar");
  const contact = page.locator("tr", { hasText: `Bayi bilgisi ${stamp}` });
  await expect(contact).toBeVisible();
  // Urun sorusu: gonderenin e-postasi ve urun adiyla.
  await expect(page.locator("tr", { hasText: `soru-${stamp}@ornek.com` })).toContainText("Evomig 205 P");
  await contact.click();
  await page.locator("select").filter({ has: page.locator("option[value=answered]") }).first().selectOption("answered");
  await page.locator("textarea").first().fill("Telefonla dönüldü.");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await page.reload();
  await expect(page.locator("tr", { hasText: `Bayi bilgisi ${stamp}` })).toContainText("Yanıtlandı");

  // Panel › Bayilik Basvurulari: basvuru gorunur, durumu degisir.
  await page.goto("/yonetim/bayilik-basvurulari");
  const application = page.locator("tr", { hasText: `Demo Hırdavat ${stamp}` });
  await expect(application).toContainText("Bursa");
  await application.click();
  await page.locator("select").filter({ has: page.locator("option[value=reviewing]") }).first().selectOption("reviewing");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await page.reload();
  await expect(page.locator("tr", { hasText: `Demo Hırdavat ${stamp}` })).toContainText("İnceleniyor");
});

test("servis talebi: gönderilen talep panelde Servis Talepleri listesinin en üstünde", async ({ page }) => {
  // Ornek talepler Turkiye saatiyle (+03:00), yeni talep UTC (Z) yazilir; liste
  // saate gore siralanir (ayni gunun ornek taleplerinin altina dusmez).
  await page.goto("/servis-talebi");
  const form = page.locator("main form");
  const input = (label: string) => form.getByLabel(new RegExp(`^${label}\\s*\\*?$`));
  await input(tr.service.machine).selectOption({ index: 1 });
  await input(tr.service.model).selectOption({ index: 1 });
  await form.getByLabel(tr.service.reasons.onarim).check();
  for (const [label, value] of [
    [tr.service.complaint, "Makine açılmıyor."],
    [tr.service.companyName, `Servis Deneme ${stamp}`],
    [tr.service.address, "Deneme sk. 1"],
    [tr.service.city, "İstanbul"],
    [tr.service.district, "Kadıköy"],
    [tr.service.email, `servis-${stamp}@ornek.com`],
    [tr.service.phone, "02125550000"],
    [tr.service.contactName, "Ali Deneme"],
    [tr.service.contactGsm, "05325550000"],
  ]) {
    await input(label).fill(value);
  }
  await form.getByRole("checkbox", { name: new RegExp(tr.service.consentLink) }).check();
  await form.getByRole("button", { name: tr.service.submit }).click();
  await expect(page.getByRole("heading", { name: tr.service.successTitle })).toBeVisible();
  const code = (await page.locator("main").innerText()).match(/SRV-\d{4}-\d+/)![0];

  await page.goto("/yonetim/servis-talepleri");
  await expect(page.locator("tbody tr").first()).toContainText(code);
  await expect(page.locator("tbody tr").first()).toContainText(`Servis Deneme ${stamp}`);
});
