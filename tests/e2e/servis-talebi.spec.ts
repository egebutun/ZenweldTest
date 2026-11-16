import { tr } from "@zenweld/i18n";
import { PROVINCE_NAMES } from "@zenweld/data";
import { SESSION, expect, test } from "./yardimci";

/**
 * SERVIS TALEBI AKISI (demo modu; KARARLAR K-117)
 *
 * Form: il 81 illik listeden, KVKK paylasim metni; musteriye "talebiniz
 * alindi" e-postasi (demo: Gonderilmedi). Hesabim › Servis Taleplerim: talep
 * ve durumu, servis bilgisi yok. Panel: en yakin yetkili servis onerisi,
 * "atandı" icin servis secimi, servise iki hazir e-posta. Veritabani
 * modundaki hali: tests/e2e-db/servis-talebi.spec.ts.
 */

const stamp = Date.now();

test.describe("üye", () => {
  test.use({ storageState: SESSION.member });

  test("form: il listeden, KVKK paylaşım metni; talep Hesabım › Servis Taleplerim'de, servis bilgisi yok", async ({ page }) => {
    await page.goto("/servis-talebi");
    const form = page.locator("main form");
    const input = (label: string) => form.getByLabel(new RegExp(`^${label}\\s*\\*?$`));
    const city = input(tr.service.city);
    await expect(city.locator("option")).toHaveCount(PROVINCE_NAMES.length + 1);
    // Uyenin ili kendiliginden secili (Profil'deki il).
    await expect(city).toHaveValue("İstanbul");
    await expect(form.getByText(tr.service.sharingNotice)).toBeVisible();

    await input(tr.service.machine).selectOption({ index: 1 });
    await input(tr.service.model).selectOption({ index: 1 });
    await form.getByLabel(tr.service.reasons.bakim, { exact: true }).check();
    await input(tr.service.complaint).fill(`Periyodik bakım ${stamp}`);
    await input(tr.service.address).fill("Deneme sk. 1");
    await input(tr.service.district).fill("Maltepe");
    await input(tr.service.contactGsm).fill("05325550000");
    await form.getByRole("checkbox", { name: new RegExp(tr.service.consentLink) }).check();
    await form.getByRole("button", { name: tr.service.submit }).click();
    await expect(page.getByText("Talebiniz başarıyla oluşturulmuştur. En yakın yetkili servisimiz sizinle iletişime geçecektir.")).toBeVisible();
    const code = (await page.locator("main").innerText()).match(/SRV-\d{4}-\d+/)![0];

    await page.getByRole("link", { name: tr.account.myServiceRequests }).click();
    await expect(page).toHaveURL(/\/hesabim\/servis-taleplerim$/);
    const card = page.locator("[data-servis-talebi]", { hasText: code });
    await expect(card).toContainText("Yetkili servis atanması bekleniyor");
    await expect(card).toContainText(`Periyodik bakım ${stamp}`);
    // Ornek veride uyenin her durumdan talebi var; hicbirinde servis bilgisi yok.
    await expect(page.getByText("Yetkili servis atandı").first()).toBeVisible();
    await expect(page.getByText("Tamamlandı").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Kocaeli Endüstriyel Kaynak");
    await expect(page.locator("main")).not.toContainText("example.com");
  });
});

test.describe("yönetici", () => {
  test.use({ storageState: SESSION.admin });

  test("panel: en yakın servis önerilir; “atandı” servissiz kaydedilmez; servise iki hazır e-posta", async ({ page }) => {
    await page.goto("/yonetim/servis-talepleri");
    // En yeni talep: atanmasi bekleniyor.
    const first = page.locator("tbody tr").first();
    await expect(first).toContainText("Yetkili servis atanması bekleniyor");
    const code = (await first.locator("td").first().innerText()).match(/SRV-\d{4}-\d+/)![0];
    await first.click();

    const box = page.locator("[data-yetkili-servis]");
    await expect(box.locator("[data-onerilen]")).toContainText("Önerilen:");
    const service = box.getByLabel("Yetkili servis");
    const suggested = await service.inputValue();
    expect(suggested).not.toBe("");
    const emails = page.locator("[data-kayit-yazismalari]");
    await expect(emails.getByRole("button", { name: "Servise müşteri bilgileri" })).toBeDisabled();
    await expect(emails).toContainText("önce durumu “Yetkili servis atandı” yapıp kaydedin");
    // Musteriye giden "talebiniz alindi" e-postasi talebin yazismalarinda.
    await expect(emails.locator("tr[data-eposta]", { hasText: `Servis talebiniz alındı — ${code}` })).toBeVisible();

    // Talep bildirimi: musterinin kisisel bilgileri yok.
    const detail = page.locator("tbody tr").nth(1);
    const phone = (await detail.innerText()).match(/Telefon\s+(\S[^\n]*)/)?.[1]?.trim() ?? "";
    await emails.getByRole("button", { name: "Servise talep bildirimi" }).click();
    const composer = emails.locator("[data-eposta-yaz]");
    await expect(composer.getByLabel("Kime")).toHaveValue(/@.*example\.com$/);
    await expect(composer.getByLabel("Konu")).toHaveValue(new RegExp(`^Zenweld servis talebi — ${code} — `));
    expect(phone).not.toBe("");
    expect(await composer.getByLabel("Metin").inputValue()).not.toContain(phone);
    await composer.getByRole("button", { name: "Vazgeç" }).click();

    // "Atandi" servissiz kaydedilmez.
    await service.selectOption("");
    await page.getByLabel("Durum").selectOption({ label: "Yetkili servis atandı" });
    await page.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(page.getByText("“Yetkili servis atandı” için önce yetkili servisi seçin.")).toBeVisible();

    await service.selectOption(suggested);
    await page.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(page.getByText("Kaydedildi")).toBeVisible();
    await expect(first).toContainText("Yetkili servis atandı");

    // Musteri bilgileri: servis ustlendikten sonra; kisisel bilgiler metinde.
    await emails.getByRole("button", { name: "Servise müşteri bilgileri" }).click();
    await expect(composer.getByLabel("Konu")).toHaveValue(new RegExp(`^Talep ${code} size verildi`));
    await expect(composer.getByLabel("Metin")).toHaveValue(new RegExp(phone.replace(/[+]/g, "\\+")));
    await composer.getByRole("button", { name: "Gönder" }).click();
    await expect(emails.getByText(tr.panel.emailNotSent)).toBeVisible();
    await expect(emails.locator("tr[data-eposta]", { hasText: `Talep ${code} size verildi` })).toBeVisible();

    // Sayfa yenilense de kalir.
    await page.reload();
    await expect(page.locator("tbody tr").first()).toContainText("Yetkili servis atandı");
  });

  test("Bayiler: e-posta adresi girilir; yanlış adres kaydedilmez", async ({ page }) => {
    await page.goto("/yonetim/bayiler");
    await page.locator("tr", { hasText: "Kocaeli Endüstriyel Kaynak" }).getByRole("button", { name: "Düzenle" }).click();
    const email = page.getByLabel("E-posta");
    await expect(email).toHaveValue("servis@kocaeli-endustri.example.com");
    await email.fill("servis@");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText("E-posta adresi geçersiz görünüyor.")).toBeVisible();
    await email.fill(`Teknik-${stamp}@Kocaeli.example.com`);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await page.locator("tr", { hasText: "Kocaeli Endüstriyel Kaynak" }).getByRole("button", { name: "Düzenle" }).click();
    await expect(page.getByLabel("E-posta")).toHaveValue(`teknik-${stamp}@kocaeli.example.com`);
  });
});
