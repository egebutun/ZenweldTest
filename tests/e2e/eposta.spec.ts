import { tr } from "@zenweld/i18n";
import { EMAIL_KINDS } from "@zenweld/data";
import { SESSION, expect, test } from "./yardimci";

/**
 * PANEL › E-POSTA (demo modu; KARARLAR K-116)
 *
 * Menude Müşteriler ve Servis altinda. Her e-posta turunun sekmesi,
 * yazismalari (ornek yazismalar), adresleri ve Yeni e-posta / Yanitla
 * vardir. Demo modunda e-posta gonderilmez: "Gönderilmedi" olarak
 * kaydedilir. Servis Talepleri ve Mesajlar'da kaydin yazismalari ve
 * "E-posta gönder". (Veritabani modundaki hali: tests/e2e-db/eposta.spec.ts.)
 */
test.use({ storageState: SESSION.admin });

const stamp = Date.now();

test("menüden açılır; her türün sekmesi var; örnek yazışma açılır, yanıtlanır ve kaydedilir", async ({ page }) => {
  await page.goto("/yonetim");
  await page.getByRole("button", { name: "Müşteriler ve Servis", exact: true }).click();
  await page.getByRole("link", { name: "E-posta", exact: true }).click();
  await expect(page).toHaveURL(/\/yonetim\/e-posta$/);
  for (const kind of EMAIL_KINDS) await expect(page.getByRole("button", { name: kind.label, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "E-posta Kaydı" })).toHaveCount(0);

  await page.getByRole("button", { name: "Servis", exact: true }).click();
  await expect(page).toHaveURL(/tur=servis/);
  await expect(page.getByText(EMAIL_KINDS.find((k) => k.type === "servis")!.sends)).toBeVisible();
  await expect(page.locator("[data-gonderen]")).toHaveText("info@zenweld.com");

  // Gelen yanit: metni, eki ve bagli talep.
  const incoming = page.locator("tr[data-eposta]", { hasText: "Gelen" }).first();
  await expect(incoming).toContainText("Re: Servis talebiniz");
  await expect(incoming).toContainText("Geldi");
  await incoming.locator("td").first().click();
  await expect(page.locator("[data-eposta-metni]")).toContainText("Seri numarası");
  await expect(page.getByText("Ekler (posta kutusunda): ariza-foto.jpg")).toBeVisible();

  // Yanitla: alici gonderen, konu "Re:", onceki metin alintili.
  await page.getByRole("button", { name: "Yanıtla" }).click();
  const composer = page.locator("[data-eposta-yaz]");
  await expect(composer.getByLabel("Kime")).toHaveValue(/@example\.com$/);
  await expect(composer.getByLabel("Konu")).toHaveValue(/^Re: Servis talebiniz SRV-/);
  await expect(composer.getByLabel("Metin")).toHaveValue(/yazdı:\n> Merhaba,/);
  await composer.getByLabel("Metin").fill(`Teşekkürler, servisimiz arayacak. ${stamp}`);
  await composer.getByRole("button", { name: "Gönder" }).click();
  await expect(page.getByText(tr.panel.emailNotSent)).toBeVisible();
  const sent = page.locator("tr[data-eposta]").first();
  await expect(sent).toContainText("Gönderilmedi");
  await sent.locator("td").first().click();
  await expect(page.locator("[data-eposta-metni]")).toContainText(`servisimiz arayacak. ${stamp}`);
  await expect(page.getByText("Panelden gönderen: Zenweld Yönetici")).toBeVisible();

  // Sayfa yenilense de kalir.
  await page.reload();
  await expect(page.locator("tr[data-eposta]").first()).toContainText("Gönderilmedi");
});

test("Adresler: türün göndericisi ve alıcıları kaydedilir; yanlış adres kaydedilmez", async ({ page }) => {
  await page.goto("/yonetim/e-posta?tur=servis&sekme=adresler");
  await page.getByLabel("Gönderici adresi").fill("servis@");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText('Gönderici: "servis@" geçerli bir e-posta adresi değil.')).toBeVisible();

  await page.getByLabel("Gönderici adresi").fill("Servis@Zenweld.com");
  await page.getByLabel("Alıcı adresleri").fill("servis@zenweld.com, teknik@zenweld.com");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  await expect(page.locator("[data-gonderen]")).toHaveText("servis@zenweld.com");
  await expect(page.getByText("servis@zenweld.com, teknik@zenweld.com")).toBeVisible();

  // Yeni e-posta bu adresten gider.
  await page.getByRole("button", { name: "Yazışmalar" }).click();
  await page.getByRole("button", { name: "Yeni e-posta" }).click();
  await expect(page.locator("[data-eposta-yaz]")).toContainText("Gönderen: servis@zenweld.com");

  // Musteriye giden turde alici kutusu yok.
  await page.goto("/yonetim/e-posta?tur=sifre-sifirlama&sekme=adresler");
  await expect(page.getByLabel("Gönderici adresi")).toBeVisible();
  await expect(page.getByLabel("Alıcı adresleri")).toHaveCount(0);
});

test("Servis Talepleri: talebin yazışmaları görünür; talepten e-posta gönderilir", async ({ page }) => {
  await page.goto("/yonetim/servis-talepleri");
  // Ornek yazismasi olan talep: listede ikinci (en yeni ikinci) talep.
  await page.locator("tbody tr").nth(1).click();
  const box = page.locator("[data-kayit-yazismalari]");
  await expect(box).toContainText("Yazışmalar (3)");
  await expect(box.locator("tr[data-eposta]", { hasText: "Gelen" })).toHaveCount(1);

  await box.getByRole("button", { name: "E-posta gönder" }).click();
  const composer = box.locator("[data-eposta-yaz]");
  await expect(composer.getByLabel("Kime")).toHaveValue(/^servis\d+@example\.com$/);
  await expect(composer.getByLabel("Konu")).toHaveValue(/^Servis talebiniz SRV-\d{4}-\d{4} hakkında$/);
  await composer.getByLabel("Metin").fill(`Servis noktamız yarın arayacak. ${stamp}`);
  await composer.getByRole("button", { name: "Gönder" }).click();
  await expect(box.getByText(tr.panel.emailNotSent)).toBeVisible();
  await expect(box).toContainText("Yazışmalar (4)");

  // Ayni e-posta E-posta › Servis'te de gorunur.
  await page.goto("/yonetim/e-posta?tur=servis");
  await page.locator("tr[data-eposta] td:first-child").first().click();
  await expect(page.locator("[data-eposta-metni]")).toContainText(`yarın arayacak. ${stamp}`);
});

test("Mağaza Ayarları'nda E-posta Alıcıları sekmesi yok", async ({ page }) => {
  await page.goto("/yonetim/magaza");
  await expect(page.getByRole("button", { name: "Kargo ve Ödeme" })).toBeVisible();
  await expect(page.getByRole("button", { name: "E-posta Alıcıları" })).toHaveCount(0);
});
