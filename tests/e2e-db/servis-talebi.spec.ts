import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, registerMember, sql, test } from "./yardimci";

/**
 * SERVIS TALEBI AKISI VERITABANINDA (KARARLAR K-117)
 *
 * Uye formu il listesiyle gonderir; talep Hesabim › Servis Taleplerim'de
 * sunucudan okunur. Panel ayni ilcedeki yetkili servisi onerir; "atandı"
 * durumu ve servis service_requests'e ve islem kaydina yazilir; servise
 * giden musteri bilgileri e-postasi email_log'a yazilir. Musteri servis
 * bilgisini gormez. (Demo modundaki hali: tests/e2e/servis-talebi.spec.ts.)
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const email = `servis-uye-${stamp}@ornek.com`;
const PASSWORD = "uzun-sifre-1";
const GSM = "05329998877";
let code = "";

test.afterAll(async () => {
  await sql("UPDATE dealers SET email = 'servis@kayseri-metal.example.com' WHERE id = 'd-kayseri-metal'");
  await closeDatabase();
});

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

async function memberLogin(page: Page) {
  await page.goto("/giris");
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(PASSWORD);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/hesabim/);
}

test("üye: form il listesiyle gönderilir; talep Hesabım › Servis Taleplerim'de sunucudan", async ({ page }) => {
  await registerMember(page.request, email, PASSWORD);
  await page.goto("/servis-talebi");
  const form = page.locator("main form");
  const input = (label: string) => form.getByLabel(new RegExp(`^${label}\\s*\\*?$`));
  await input(tr.service.machine).selectOption({ index: 1 });
  await input(tr.service.model).selectOption({ index: 1 });
  await form.getByLabel(tr.service.reasons.onarim, { exact: true }).check();
  await input(tr.service.complaint).fill(`Ark oluşmuyor ${stamp}`);
  await input(tr.service.address).fill("OSB 3. Cadde No:5");
  await input(tr.service.city).selectOption("Kayseri");
  await input(tr.service.district).fill("Kocasinan");
  await input(tr.service.contactGsm).fill(GSM);
  await expect(form.getByText(tr.service.sharingNotice)).toBeVisible();
  await form.getByRole("checkbox", { name: new RegExp(tr.service.consentLink) }).check();
  await form.getByRole("button", { name: tr.service.submit }).click();
  await expect(page.getByRole("heading", { name: tr.service.successTitle })).toBeVisible();
  code = (await page.locator("main").innerText()).match(/SRV-\d{4}-\d+/)![0];

  expect(await sql("SELECT city, status, service_dealer_id FROM service_requests WHERE code = $1", [code])).toEqual([
    { city: "Kayseri", status: "new", service_dealer_id: null },
  ]);
  await page.getByRole("link", { name: tr.account.myServiceRequests }).click();
  const card = page.locator("[data-servis-talebi]", { hasText: code });
  await expect(card).toContainText("Yetkili servis atanması bekleniyor");
  await expect(card).toContainText("Kocasinan / Kayseri");
});

test("yönetici: aynı ilçedeki servis önerilir; atanınca kaydedilir ve işlem kaydına yazılır; servise iki hazır e-posta", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/servis-talepleri");
  // Acilinca alt satirlar (detay, yazismalar) da talep numarasini icerir; ilk satir talebin kendisi.
  const row = page.locator("tbody tr", { hasText: code }).first();
  await row.click();
  const box = page.locator("[data-yetkili-servis]");
  await expect(box.locator("[data-onerilen]")).toContainText("Kayseri Metal Teknik");
  await expect(box.locator("[data-onerilen]")).toContainText("aynı ilçe");
  const emails = page.locator("[data-kayit-yazismalari]");
  await expect(emails.locator("tr[data-eposta]", { hasText: `Servis talebiniz alındı — ${code}` })).toBeVisible();
  await expect(emails.getByRole("button", { name: "Servise müşteri bilgileri" })).toBeDisabled();

  // Talep bildirimi: musterinin kisisel bilgileri yok.
  await emails.getByRole("button", { name: "Servise talep bildirimi" }).click();
  const composer = emails.locator("[data-eposta-yaz]");
  await expect(composer.getByLabel("Kime")).toHaveValue("servis@kayseri-metal.example.com");
  const notice = await composer.getByLabel("Metin").inputValue();
  expect(notice).toContain(`Ark oluşmuyor ${stamp}`);
  for (const personal of [GSM, email, "OSB 3. Cadde"]) expect(notice).not.toContain(personal);
  await composer.getByRole("button", { name: "Vazgeç" }).click();

  // Servissiz "atandı" sunucuda da reddedilir; onerilen servisle kaydedilir.
  await page.getByLabel("Durum").selectOption({ label: "Yetkili servis atandı" });
  await box.getByLabel("Yetkili servis").selectOption("");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("“Yetkili servis atandı” için önce yetkili servisi seçin.")).toBeVisible();
  await box.getByLabel("Yetkili servis").selectOption("d-kayseri-metal");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  await expect(row).toContainText("Yetkili servis atandı");
  await expect(row).toContainText("Kayseri Metal Teknik");
  expect(await sql("SELECT status, service_dealer_id FROM service_requests WHERE code = $1", [code])).toEqual([
    { status: "assigned", service_dealer_id: "d-kayseri-metal" },
  ]);
  const [entry] = await sql<{ changes: Record<string, unknown> }>(
    "SELECT changes FROM audit_log WHERE entity_type = 'service_requests' AND entity_label = $1 ORDER BY id DESC LIMIT 1",
    [code],
  );
  expect(entry.changes).toMatchObject({ status: ["new", "assigned"], serviceDealerId: [null, "d-kayseri-metal"] });

  // Musteri bilgileri: servis ustlendikten sonra; email_log'a metniyle yazilir.
  await emails.getByRole("button", { name: "Servise müşteri bilgileri" }).click();
  await expect(composer.getByLabel("Metin")).toHaveValue(new RegExp(GSM));
  await composer.getByRole("button", { name: "Gönder" }).click();
  await expect(emails.getByText(tr.panel.emailNotSent)).toBeVisible();
  const [sent] = await sql<{ recipients: string[]; entity_type: string; body: string }>(
    "SELECT recipients, entity_type, body FROM email_log WHERE subject LIKE $1",
    [`Talep ${code} size verildi%`],
  );
  expect(sent).toMatchObject({ recipients: ["servis@kayseri-metal.example.com"], entity_type: "service_requests" });
  expect(sent.body).toContain(GSM);
});

test("üye: atanan talep “Yetkili servis atandı”; servis bilgisi ne ekranda ne yanıtta", async ({ page }) => {
  await memberLogin(page);
  await page.goto("/hesabim/servis-taleplerim");
  await expect(page.locator("[data-servis-talebi]", { hasText: code })).toContainText("Yetkili servis atandı");
  await expect(page.locator("main")).not.toContainText("Kayseri Metal Teknik");
  const answer = await page.request.get("/api/formlar/servis-talepleri");
  const text = await answer.text();
  expect(text).toContain(code);
  expect(text).not.toContain("d-kayseri-metal");
  expect(text).not.toContain("adminNote");
});

test("Bayiler: yetkili servisin e-posta adresi veritabanına yazılır", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/bayiler");
  await page.locator("tr", { hasText: "Kayseri Metal Teknik" }).getByRole("button", { name: "Düzenle" }).click();
  await expect(page.getByLabel("E-posta")).toHaveValue("servis@kayseri-metal.example.com");
  await page.getByLabel("E-posta").fill(`Teknik-${stamp}@Kayseri.example.com`);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect.poll(async () => (await sql("SELECT email FROM dealers WHERE id = 'd-kayseri-metal'"))[0]).toEqual({
    email: `teknik-${stamp}@kayseri.example.com`,
  });
});
