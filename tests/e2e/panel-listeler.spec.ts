import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { SESSION, expect, readDb, test } from "./yardimci";

/**
 * PANEL › UZUN LISTELER (demo modu; docs/ADMIN-KULLANIM.md › 2)
 *
 * Sayfa basina 50 kayit; durum, arama ve sayfa adreste durur. Demo modunda
 * hesap tarayicidaki veriyle yapilir (lib/admin-lists.ts); veritabani
 * modundaki hali: tests/e2e-db/panel-listeler.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("siparişler 50'şer sayfalanır; durum, arama ve sayfa adreste durur", async ({ page, problems }) => {
  await page.goto("/yonetim/siparisler");
  const db = await readDb(page);
  const total = db.orders.length;
  expect(total).toBeGreaterThan(50);
  const pager = page.getByRole("navigation", { name: "Sayfalar" });
  const rows = page.locator("tbody tr");

  await expect(pager).toContainText(`1–50 / ${total}`);
  await expect(rows).toHaveCount(50);

  await pager.getByRole("link", { name: "Sonraki →" }).click();
  await expect(page).toHaveURL(/\?sayfa=2$/);
  await expect(pager).toContainText(`51–${Math.min(100, total)} / ${total}`);

  // Durum secilince 1. sayfaya donulur; sayi o durumdaki siparislerdir.
  const delivered = db.orders.filter((o) => o.status === "delivered").length;
  await page.getByRole("button", { name: /^Teslim Edildi/ }).click();
  await expect(page).toHaveURL(/\?durum=delivered$/);
  await expect(pager).toContainText(`/ ${delivered}`);

  // Arama adrese yazilir; geri tusu onceki suzgece doner.
  const target = db.orders.find((o) => o.status === "delivered")!;
  await page.getByRole("searchbox", { name: "Siparişlerde ara" }).fill(target.code);
  await expect(page).toHaveURL(new RegExp(`ara=${target.code}`));
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(target.code);

  await page.goto("/yonetim/siparisler?durum=delivered&ara=bulunmayan-siparis");
  await expect(page.getByText("Bu filtreye uyan sipariş yok.")).toBeVisible();
  expect(problems).toEqual([]);
});

test("iade talepleri: sayı ve yeni talep sayısı başlıkta; sayfa bilgisi altta", async ({ page, problems }) => {
  await page.goto("/yonetim/iade-talepleri");
  const db = await readDb(page);
  const total = db.returnRequests.length;
  const fresh = db.returnRequests.filter((r) => r.status === "new").length;
  await expect(page.getByText(`${total} talep · ${fresh} yeni`)).toBeVisible();
  if (total > 0) await expect(page.getByRole("navigation", { name: "Sayfalar" })).toContainText(`1–${Math.min(50, total)} / ${total}`);
  expect(problems).toEqual([]);
});

/** Turkiye gunu (YYYY-AA-GG): garantinin suresi doldu mu. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

async function csvOf(page: Page, button: string): Promise<string> {
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: button }).click()]);
  return readFileSync((await download.path())!, "utf8");
}

test("garantiler 50'şer; CSV süzgece uyanların tamamını indirir; durum adreste", async ({ page, problems }) => {
  await page.goto("/yonetim/garantiler");
  const db = await readDb(page);
  const total = db.warranties.length;
  expect(total).toBeGreaterThan(50);
  const pager = page.getByRole("navigation", { name: "Sayfalar" });
  await expect(pager).toContainText(`1–50 / ${total}`);
  await expect(page.locator("tbody tr")).toHaveCount(50);

  // Sayfada 50 kayit gorunse de CSV'de hepsi var.
  const csv = await csvOf(page, "CSV indir");
  for (const w of db.warranties) expect(csv).toContain(w.serialNumber);

  await page.locator("select").filter({ has: page.locator("option[value=expired]") }).selectOption("expired");
  await expect(page).toHaveURL(/\?durum=expired$/);
  const expired = db.warranties.filter((w) => w.expiresAt < today());
  if (expired.length) await expect(pager).toContainText(`/ ${expired.length}`);
  else await expect(page.getByText("Aramanıza uygun kayıt yok.")).toBeVisible();
  expect(problems).toEqual([]);
});

test("teklifler: durum süzgeci adreste; CSV süzgece uyan tekliflerin tamamı", async ({ page, problems }) => {
  await page.goto("/yonetim/teklifler");
  const db = await readDb(page);
  await expect(page.getByText(`${db.quotes.length} teklif talebi`)).toBeVisible();
  const fresh = db.quotes.filter((q) => q.status === "new");
  await page.locator("select").filter({ has: page.locator("option[value=won]") }).first().selectOption("new");
  await expect(page).toHaveURL(/\?durum=new$/);
  await expect(page.getByText(`${fresh.length} teklif talebi`)).toBeVisible();
  const csv = await csvOf(page, "CSV İndir");
  expect(csv.match(/TKL-\d{4}-\d+/g)?.length ?? 0).toBe(fresh.length);
  for (const q of fresh) expect(csv).toContain(q.code);
  expect(problems).toEqual([]);
});

test("yorumlar: onay bekleyenler adreste; servis talepleri: sayılar", async ({ page, problems }) => {
  await page.goto("/yonetim/yorumlar");
  const db = await readDb(page);
  const pending = db.reviews.filter((r) => !r.approved).length;
  await page.getByRole("button", { name: "Onay bekleyenler" }).click();
  await expect(page).toHaveURL(/\?bekleyen=1$/);
  await expect(page.getByText(`${pending} yorum · ${pending} onay bekliyor`)).toBeVisible();

  await page.goto("/yonetim/servis-talepleri");
  const fresh = db.serviceRequests.filter((r) => r.status === "new").length;
  await expect(page.getByText(`${db.serviceRequests.length} talep · ${fresh} yeni`)).toBeVisible();
  expect(problems).toEqual([]);
});

test("üyeler 50'şer; CSV süzgece uyan hesapların tamamı; rol süzgeci adreste", async ({ page, problems }) => {
  await page.goto("/yonetim/uyeler");
  const db = await readDb(page);
  expect(db.users.length).toBeGreaterThan(50);
  const pager = page.getByRole("navigation", { name: "Sayfalar" });
  await expect(pager).toContainText(`1–50 / ${db.users.length}`);
  await expect(page.getByText(`${db.users.length} üye listeleniyor`)).toBeVisible();

  const csv = await csvOf(page, "CSV İndir");
  for (const u of db.users) expect(csv).toContain(u.email);

  const business = db.users.filter((u) => u.role === "business");
  await page.locator("select").filter({ has: page.locator("option[value=business]") }).first().selectOption("business");
  await expect(page).toHaveURL(/\?rol=business$/);
  await expect(page.getByText(`${business.length} üye listeleniyor`)).toBeVisible();
  expect(problems).toEqual([]);
});

test("mesajlar ve bayilik başvuruları: başlıktaki sayılar tarayıcıdaki kayıtlardan", async ({ page, problems }) => {
  await page.goto("/yonetim/mesajlar");
  const db = await readDb(page);
  const messages = db.supportMessages ?? [];
  await expect(page.getByText(`${messages.length} mesaj · ${messages.filter((m) => m.status === "new").length} yeni`)).toBeVisible();
  await page.getByLabel("Tür").selectOption("urun-destek");
  await expect(page).toHaveURL(/\?tur=urun-destek$/);

  const apps = db.dealerApplications ?? [];
  await page.goto("/yonetim/bayilik-basvurulari");
  await expect(page.getByText(`${apps.length} başvuru · ${apps.filter((a) => a.status === "new").length} yeni`)).toBeVisible();
  expect(problems).toEqual([]);
});
