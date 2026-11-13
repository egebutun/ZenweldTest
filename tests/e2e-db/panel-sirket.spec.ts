import type { Locator, Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, newVisitor, sql, test } from "./yardimci";

/**
 * PANEL › SIRKET VE ILETISIM, KARGO TAKIP BAGLANTISI (Asama 5, 5. alan,
 * adim 5.3; KARARLAR K-99, K-105)
 *
 * Mağaza Ayarları'nin 3. sekmesinde girilen MERSIS numarasi sozlesmelerdeki
 * Satici bolumunde, telefon alt bilgide hemen gorunur. Kargo firmasina
 * girilen takip adresiyle musteri sipariş detayinda "Kargoyu takip et"
 * baglantisini gorur.
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const member = demoAccount("Kurumsal");
const MERSIS = "0123456789012345";
const TRACKING = "https://kargo.ornek/sorgula?no={takip}";

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

/** Formdaki alan: etiketi verilen satirin girisi (etiketler girise bagli degil). */
const field = (scope: Locator, label: string) =>
  scope
    .locator("div")
    .filter({ has: scope.page().locator("label", { hasText: label }) })
    .last()
    .locator("input, textarea, select")
    .first();

type Company = { mersisNo: string; phone: string };
const companyRow = async () => (await sql<{ value: Company }>("SELECT value FROM settings WHERE key = 'company'"))[0]?.value;

test.afterAll(async () => {
  await sql("UPDATE carriers SET tracking_url = NULL WHERE name = 'Yurtiçi Kargo'");
  await closeDatabase();
});

test("Şirket ve İletişim: MERSİS no sözleşmede, telefon alt bilgide hemen görünür; hemen ardından eski haline döner", async ({ page, request }) => {
  const original = await companyRow();
  const phone = "+90 212 000 00 99";
  await panelLogin(page);
  await page.goto("/yonetim/magaza");
  await page.getByRole("button", { name: "Şirket ve İletişim" }).click();
  // Sirket kutusu; Kaydet acik sekmenin ustunde (gizli sekmelerin dugmeleri sayilmaz).
  const card = page.locator("div").filter({ has: page.getByRole("heading", { name: "Şirket", exact: true }) }).last();
  const save = page.getByRole("button", { name: "Kaydet", exact: true });

  // Kurala uymayan MERSIS kaydedilmez.
  await field(card, "MERSİS no").fill("123");
  await save.click();
  await expect(page.getByText("MERSİS numarası 16 rakamdan oluşur (boş bırakılabilir).")).toBeVisible();

  await field(card, "MERSİS no").fill(MERSIS);
  const phoneInput = field(card, "Telefon");
  const oldPhone = await phoneInput.inputValue();
  await phoneInput.fill(phone);
  await save.click();
  await expect(page.getByText("Şirket ve iletişim bilgileri kaydedildi.")).toBeVisible();
  await expect.poll(async () => (await companyRow())?.mersisNo).toBe(MERSIS);

  const contract = await (await request.get("/yasal/mesafeli-satis-sozlesmesi")).text();
  expect(contract).toContain(MERSIS);
  expect(await (await request.get("/")).text()).toContain(phone);

  // Kendi kaydi uyari vermez; eski haline doner.
  await field(card, "MERSİS no").fill(original?.mersisNo ?? "");
  await phoneInput.fill(oldPhone);
  await save.click();
  await expect(page.getByText("Şirket ve iletişim bilgileri kaydedildi.")).toBeVisible();
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
  await expect.poll(async () => (await companyRow())?.phone).toBe(oldPhone);
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'settings' AND entity_id = 'company' ORDER BY id DESC LIMIT 2");
  expect(audit.length).toBe(2);
});

test("kargo takip bağlantısı: firmaya takip adresi girilir; müşteri ve panel sipariş detayında bağlantı çıkar", async ({ page, browser }) => {
  await panelLogin(page);
  await page.goto("/yonetim/magaza");
  // Ilk kargo firmasi (ornek veride Yurtiçi Kargo) ve takip adresi.
  const tracking = page.getByPlaceholder("https://…{takip}").first();
  const row = tracking.locator("xpath=ancestor::div[.//label[normalize-space()='Firma']][1]");
  await expect(row.locator("input").first()).toHaveValue("Yurtiçi Kargo");
  const save = page.getByRole("button", { name: "Kaydet", exact: true });
  await tracking.fill("https://kargo.ornek/sorgula");
  await save.click();
  await expect(page.getByText("Yurtiçi Kargo: takip adresi https:// ile başlamalı, {takip} içermeli ve boşluk içermemeli.")).toBeVisible();
  await tracking.fill(TRACKING);
  await save.click();
  await expect(page.getByText("Mağaza ayarları kaydedildi.")).toBeVisible();
  await expect
    .poll(async () => (await sql<{ tracking_url: string }>("SELECT tracking_url FROM carriers WHERE name = 'Yurtiçi Kargo'"))[0].tracking_url)
    .toBe(TRACKING);

  // Panel: kargodaki siparis (Yurtiçi Kargo, YK 1029 3847 56).
  const [order] = await sql<{ id: string; code: string }>("SELECT id, code FROM orders WHERE code = 'SIP-2026-00002'");
  const expected = "https://kargo.ornek/sorgula?no=YK1029384756";
  await page.goto(`/yonetim/siparisler/${order.id}`);
  await expect(page.getByRole("link", { name: /Yurtiçi Kargo takip sayfasını aç/ })).toHaveAttribute("href", expected);

  // Musteri: kendi siparisinin detayi.
  const customer = await (await newVisitor(browser)).newPage();
  await customer.goto("/giris");
  const form = customer.locator("main form").filter({ has: customer.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(member.email);
  await form.locator("input[type=password]").fill(member.password);
  await form.locator("button[type=submit]").click();
  await expect(customer).toHaveURL(/\/hesabim/);
  await customer.goto(`/hesabim/siparislerim/${order.code}`);
  await expect(customer.getByRole("link", { name: "Kargoyu takip et" })).toHaveAttribute("href", expected);
  await customer.close();
});

test("oturumsuz şirket isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/ayarlar/sirket", { data: { company: {}, updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});
