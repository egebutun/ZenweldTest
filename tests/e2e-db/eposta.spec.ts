import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › E-POSTA VERITABANINDA (KARARLAR K-116)
 *
 * Adresler email_settings'e yazilir ve sitenin e-postasi o turun
 * gondericisinden, o turun alicilarina gider. Panelden yazilan e-posta
 * metniyle email_log'a ve islem kaydina yazilir (testte e-posta servisi
 * ayarli olmadigi icin "Gönderilmedi"). Posta kutusu (deneme parcasi:
 * POSTA_KLASORU) "Şimdi oku" ile okunur; kayit numarasi tasiyan yanit
 * talebin yazismalarina girer. (Demo modundaki hali: tests/e2e/eposta.spec.ts.)
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const CONTACT = `iletisim-${stamp}@zenweld.com`;

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test.afterAll(async () => {
  await sql("DELETE FROM email_settings WHERE type = 'iletisim'");
  await closeDatabase();
});

test("Adresler: yazılan gönderici ve alıcı o türün e-postasında kullanılır; e-postanın metni saklanır; boşaltılınca varsayılana döner", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/e-posta?tur=iletisim&sekme=adresler");
  await page.getByLabel("Gönderici adresi").fill("Destek@Zenweld.com");
  await page.getByLabel("Alıcı adresleri").fill(` ${CONTACT.toUpperCase()} `);
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  await expect(page.locator("[data-gonderen]")).toHaveText("destek@zenweld.com");
  expect(await sql("SELECT sender, recipients FROM email_settings WHERE type = 'iletisim'")).toEqual([
    { sender: "destek@zenweld.com", recipients: [CONTACT] },
  ]);
  expect(await sql("SELECT action FROM audit_log WHERE entity_type = 'email_settings' AND entity_id = 'iletisim' ORDER BY id DESC LIMIT 1")).toEqual([
    { action: "create" },
  ]);

  const message = await page.request.post("/api/bildirim", {
    data: { type: "iletisim", data: { name: "Deneme", email: `uye-${stamp}@ornek.com`, subject: `Konu ${stamp}`, message: "Merhaba Zenweld" } },
  });
  expect((await message.json()).saved).toBe(true);
  await expect
    .poll(async () => (await sql("SELECT from_address, recipients, body FROM email_log WHERE type = 'iletisim' AND subject LIKE $1", [`%Konu ${stamp}%`]))[0])
    .toMatchObject({ from_address: "destek@zenweld.com", recipients: [CONTACT], body: expect.stringContaining("Mesaj:\nMerhaba Zenweld") });

  await page.getByLabel("Gönderici adresi").fill("");
  await page.getByLabel("Alıcı adresleri").fill("");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect.poll(async () => (await sql("SELECT 1 FROM email_settings WHERE type = 'iletisim'")).length).toBe(0);
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);
});

test("Yazışmalar: bildirim açılır; yanıtlanır, metni ve yazan yönetici kaydedilir; işlem kaydına yazılır", async ({ page }) => {
  await panelLogin(page);
  await page.goto(`/yonetim/e-posta?tur=iletisim&ara=${encodeURIComponent(`Konu ${stamp}`)}`);
  const notice = page.locator("tr[data-eposta]").first();
  await expect(notice).toContainText(`Konu ${stamp}`);
  await notice.locator("td").first().click();
  await expect(page.locator("[data-eposta-metni]")).toContainText("Merhaba Zenweld");
  await page.getByRole("button", { name: "Yanıtla" }).click();
  const composer = page.locator("[data-eposta-yaz]");
  await expect(composer.getByLabel("Kime")).toHaveValue(`uye-${stamp}@ornek.com`);
  const text = composer.getByLabel("Metin");
  await expect(text).toHaveValue(/> Merhaba Zenweld/);
  await text.fill(`Teşekkürler, bayimiz sizi arayacak. ${stamp}${await text.inputValue()}`);
  await composer.getByRole("button", { name: "Gönder" }).click();
  await expect(page.getByText(tr.panel.emailNotSent)).toBeVisible();

  const [row] = await sql<{ id: string; status: string; actor_name: string; parent_id: string | null; body: string; recipients: string[] }>(
    "SELECT id, status, actor_name, parent_id, body, recipients FROM email_log WHERE type = 'iletisim' AND body LIKE $1",
    [`%bayimiz sizi arayacak. ${stamp}%`],
  );
  expect(row).toMatchObject({ status: "skipped", actor_name: expect.any(String), recipients: [`uye-${stamp}@ornek.com`] });
  expect(row.parent_id).not.toBeNull();
  expect(row.body).toContain("> Merhaba Zenweld");
  expect(await sql("SELECT action FROM audit_log WHERE entity_type = 'email_log' AND entity_id = $1", [String(row.id)])).toEqual([{ action: "create" }]);
});

test("Posta kutusu: kayıt numarası taşıyan yanıt 'Şimdi oku' ile talebin yazışmalarına girer; diğer e-posta alınmaz", async ({ page }) => {
  const [request] = await sql<{ id: string; code: string; email: string }>("SELECT id, code, email FROM service_requests ORDER BY created_at DESC LIMIT 1");
  const eml = (id: string, from: string, subject: string, body: string) =>
    [`Message-ID: <${id}-${stamp}@ornek.com>`, `From: ${from}`, "To: info@zenweld.com", `Subject: ${subject}`, "Content-Type: text/plain; charset=utf-8", "", body].join("\r\n");
  const dir = process.env.POSTA_KLASORU!;
  await writeFile(join(dir, `${stamp}-1.eml`), eml("y1", request.email, `Re: Talebim ${request.code}`, `Makinenin seri numarası ZW-${stamp}.`));
  await writeFile(join(dir, `${stamp}-2.eml`), eml("y2", "reklam@ornek.com", "Kampanya", "İndirim"));

  await panelLogin(page);
  await page.goto("/yonetim/e-posta?tur=servis");
  await expect(page.locator("[data-posta-kutusu]")).toContainText(dir);
  await page.getByRole("button", { name: "Şimdi oku" }).click();
  await expect(page.getByText("Posta kutusu okundu: 1 yeni e-posta panele alındı.")).toBeVisible();
  const incoming = page.locator("tr[data-eposta]", { hasText: `Re: Talebim ${request.code}` });
  await expect(incoming).toContainText("Gelen");
  await expect(incoming.getByRole("link", { name: request.id })).toHaveAttribute("href", "/yonetim/servis-talepleri");

  // Talep ekraninda: yazismalarda gorunur (sunucudan okunur).
  await page.goto("/yonetim/servis-talepleri");
  await page.locator("tbody tr").first().click();
  const box = page.locator("[data-kayit-yazismalari]");
  await expect(box.locator("tr[data-eposta]", { hasText: `Re: Talebim ${request.code}` })).toBeVisible();
  await box.getByRole("button", { name: "E-posta gönder" }).click();
  await box.locator("[data-eposta-yaz]").getByLabel("Metin").fill(`Kaydınız alındı. ${stamp}`);
  await box.locator("[data-eposta-yaz]").getByRole("button", { name: "Gönder" }).click();
  await expect(box.getByText(tr.panel.emailNotSent)).toBeVisible();
  await expect(box.locator("tr[data-eposta]", { hasText: `Servis talebiniz ${request.code} hakkında` }).first()).toBeVisible();
  expect(await sql("SELECT entity_type, entity_id FROM email_log WHERE body = $1", [`Kaydınız alındı. ${stamp}`])).toEqual([
    { entity_type: "service_requests", entity_id: request.id },
  ]);
});

test("oturumsuz e-posta isteği reddedilir; zamanlanmış okuma anahtarsız çalışmaz", async ({ request }) => {
  const send = await request.post("/api/yonetim/eposta/gonder", { data: { type: "servis", to: "a@ornek.com", subject: "x", body: "y" } });
  expect([send.status(), (await send.json()).error]).toEqual([401, tr.panel.sessionEnded]);
  const list = await request.get("/api/yonetim/eposta/kayit?tur=service_requests&id=x&eposta=servis");
  expect(list.status()).toBe(401);
  const read = await request.post("/api/posta/oku");
  expect(read.status()).toBe(401);
  const withKey = await request.post("/api/posta/oku", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(withKey.status()).toBe(200);
});
