import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { field } from "../e2e/yardimci";
import { closeDatabase, expect, registerMember, sql, test } from "./yardimci";

/**
 * FORMLAR SUNUCUDA (Asama 5.3; KARARLAR K-81, IS-KURALLARI › Form e-postaları)
 *
 * Veritabani modunda Teklif Al, servis talebi, garanti kaydi ve urun yorumu
 * sunucuda kaydedilir; iletisim, bayilik ve urun sorusu kendi tablolarina
 * da yazilir; gonderilen her e-posta email_log'a yazilir.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const PASSWORD = "uzun-sifre-1";
const newEmail = (name: string) => `${name}-${Date.now()}@ornek.com`;

/** Kaydin bildirim e-postasi kaydi (yanit e-postayi beklemez; biraz sonra yazilir). */
const mailLog = (entityType: string, entityId: string) =>
  sql<{ type: string; status: string; source_path: string | null }>(
    "SELECT type, status, source_path FROM email_log WHERE entity_type = $1 AND entity_id = $2",
    [entityType, entityId],
  );

async function sendQuote(page: Page): Promise<string> {
  await page.goto("/teklif-al");
  const main = page.locator("main");
  await field(main, "Firma Ünvanı").fill("Deneme Firma");
  await field(main, "Yetkili Kişi").fill("Deneme Kişi");
  await field(main, "E-posta").fill("deneme@ornek.com");
  await field(main, "Telefon").fill("05551112233");
  await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("tab", { name: /^Kaynak Makineleri/ }).click();
  await page.getByRole("button", { name: /^MMA/ }).click();
  await page.getByRole("button", { name: "Ultimate 255 MMA Elektrot Kaynak Makinesi" }).click();
  await page.getByRole("button", { name: "Teklif Listesine Ekle" }).click();
  await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "Teklif Talebini Gönder" }).click();
  await expect(page.locator("main")).toContainText("Teklif talebiniz alındı");
  return (await page.locator("main").innerText()).match(/TKL-\d{4}-\d{4}/)![0];
}

test("Teklif Al sunucuda: ziyaretçi ve üye; üyenin teklifi Tekliflerim'de; bildirim e-postası kaydı", async ({ page, problems }) => {
  const guest = await sendQuote(page);
  const [row] = await sql<{ id: string; user_id: string | null; company_name: string }>(
    "SELECT id, user_id, company_name FROM quotes WHERE code = $1",
    [guest],
  );
  expect(row).toMatchObject({ user_id: null, company_name: "Deneme Firma" });
  expect(await sql("SELECT product_name, sku, quantity FROM quote_items WHERE quote_id = $1", [row.id])).toEqual([
    { product_name: "Ultimate 255 MMA Elektrot Kaynak Makinesi", sku: expect.any(String), quantity: 1 },
  ]);
  await expect.poll(async () => (await mailLog("quotes", row.id)).length).toBe(1);
  expect((await mailLog("quotes", row.id))[0]).toMatchObject({ type: "teklif", source_path: "/teklif-al" });

  const email = newEmail("teklif");
  await registerMember(page.request, email, PASSWORD);
  const own = await sendQuote(page);
  expect(Number(own.slice(-4))).toBe(Number(guest.slice(-4)) + 1);
  await page.goto("/hesabim/tekliflerim");
  await expect(page.locator("main")).toContainText(own);
  await expect(page.locator("main")).not.toContainText(guest);
  expect(problems).toEqual([]);
});

test("servis talebi, garanti kaydı ve ürün yorumu sunucuda; garanti sorgulama ve Garantilerim sunucudan", async ({ page }) => {
  const email = newEmail("garanti");
  await registerMember(page.request, email, PASSWORD);
  const [p] = await sql<{ id: string; slug: string; category: string; name: string }>(
    `SELECT p.id, p.slug, c.slug AS category, p.name FROM products p JOIN categories c ON c.id = p.category_id
      JOIN category_groups g ON g.id = c.group_id WHERE p.active AND g.section = 'ekipmanlar' ORDER BY p.position LIMIT 1`,
  );

  const service = await page.request.post("/api/formlar/servis", {
    data: {
      categorySlug: p.category,
      productId: p.id,
      complaint: "Ark oluşmuyor",
      companyName: "Firma",
      address: "Adres",
      city: "Konya",
      district: "Selçuklu",
      email,
      phone: "0555",
      contactName: "Yetkili",
      contactGsm: "0532",
      reasons: ["onarim"],
      consent: true,
    },
  });
  const { code } = (await service.json()) as { code: string };
  expect(code).toMatch(/^SRV-\d{4}-\d{4}$/);
  expect(await sql("SELECT product_name, reasons, status FROM service_requests WHERE code = $1", [code])).toEqual([
    { product_name: p.name, reasons: ["onarim"], status: "new" },
  ]);
  // Musteriye "talebiniz alindi" e-postasi talebin yazismalarina yazilir; servis bilgisi yok (K-117).
  await expect
    .poll(async () => (await sql<{ to: string[]; body: string }>("SELECT recipients AS to, body FROM email_log WHERE subject = $1", [`Servis talebiniz alındı — ${code}`]))[0])
    .toMatchObject({ to: [email], body: expect.stringContaining("En yakın yetkili servisimiz sizinle iletişime geçecektir.") });
  // Hesabim › Servis Taleplerim: uyenin talebi; ic not ve servis gelmez.
  const mine = (await (await page.request.get("/api/formlar/servis-talepleri")).json()) as { serviceRequests: Record<string, unknown>[] };
  expect(mine.serviceRequests.map((r) => r.code)).toEqual([code]);
  expect(Object.keys(mine.serviceRequests[0])).not.toContain("serviceDealerId");
  // Il listede yoksa ve eksik bilgi sunucuda da reddedilir.
  const otherCity = await page.request.post("/api/formlar/servis", {
    data: { categorySlug: p.category, productId: p.id, complaint: "x", companyName: "F", address: "A", city: "Ostim", district: "D", email, phone: "0555", contactName: "Y", contactGsm: "0532", reasons: ["onarim"], consent: true },
  });
  expect([otherCity.status(), (await otherCity.json()).error]).toEqual([400, "İli listeden seçin."]);
  expect((await page.request.post("/api/formlar/servis", { data: { productId: p.id } })).status()).toBe(400);

  const serial = `E2E-${Date.now()}`;
  const warranty = {
    ownerName: "Deneme Üye",
    email: email.toUpperCase(),
    phone: "0555",
    city: "Konya",
    postalCode: "42000",
    address: "Adres",
    categorySlug: p.category,
    productId: p.id,
    serialNumber: serial.toLowerCase(),
    sellerTaxNumber: "1234567890",
    extended: false,
  };
  expect((await page.request.post("/api/formlar/garanti", { data: warranty })).status()).toBe(200);
  const again = await page.request.post("/api/formlar/garanti", { data: warranty });
  expect([again.status(), (await again.json()).error]).toEqual([409, "Bu seri numarası daha önce kaydedilmiş."]);

  await page.goto("/garanti/sorgulama");
  await page.getByPlaceholder("ZW250-2026-000000").fill(` ${serial.toLowerCase()} `);
  await page.getByRole("button", { name: "Sorgula", exact: true }).click();
  await expect(page.locator("main")).toContainText(serial);
  await expect(page.locator("main")).toContainText(p.name);
  await page.goto("/hesabim/garantilerim");
  await expect(page.locator("main")).toContainText(serial);

  const review = await page.request.post("/api/formlar/yorum", {
    data: { productId: p.id, rating: 5, authorName: "Deneme", body: "Çok iyi", media: [] },
  });
  expect(review.status()).toBe(200);
  expect(
    await sql("SELECT approved, verified_purchase FROM reviews r JOIN users u ON u.id = r.user_id WHERE u.email = $1", [email]),
  ).toEqual([{ approved: false, verified_purchase: true }]);
});

test("iletişim formu kendi tablosuna yazılır; bot tuzağına takılan kaydedilmez", async ({ page }) => {
  const email = newEmail("iletisim");
  await page.goto("/iletisim");
  const form = page.locator("main form").first();
  // Sira: Ad Soyad, E-posta, Konu; sonra Mesaj.
  const inputs = form.locator("input:visible");
  await inputs.nth(0).fill("Deneme Kişi");
  await inputs.nth(1).fill(email);
  await inputs.nth(2).fill("Bilgi");
  await form.locator("textarea").fill("Merhaba, bilgi almak istiyorum.");
  await form.locator("button[type=submit]").click();
  await expect(page.locator("main")).toContainText("Mesajınız alındı.");
  const [message] = await sql<{ id: string; type: string; page_url: string; subject: string }>(
    "SELECT id, type, page_url, subject FROM support_messages WHERE email = $1",
    [email],
  );
  expect(message).toMatchObject({ type: "iletisim", page_url: "/iletisim", subject: "Bilgi" });
  await expect.poll(async () => (await mailLog("support_messages", message.id)).length).toBe(1);

  const bot = await page.request.post("/api/bildirim", {
    data: { type: "iletisim", data: { name: "Bot", email: "bot@ornek.com", message: "Spam" }, website: "http://spam" },
  });
  expect(bot.status()).toBe(200);
  expect(await sql("SELECT 1 FROM support_messages WHERE email = 'bot@ornek.com'")).toEqual([]);
});

test("yorum fotoğrafı dosya deposuna yazılır ve sitede sunulur; formda video sınırı 10 MB (K-128)", async ({ page }) => {
  const [p] = await sql<{ id: string; slug: string }>("SELECT id, slug FROM products WHERE active ORDER BY id LIMIT 1");
  // Testler depo kokunden calisir (npm run test:e2e:db).
  const photo = readFileSync(join(process.cwd(), "apps/zenweld-web/public/images/news/istanbul-hirdavat-fuari-2026.webp"));
  const author = `Fotoğraflı ${Date.now() % 100000}`;
  const answer = await page.request.post("/api/formlar/yorum", {
    data: {
      productId: p.id,
      rating: 4,
      authorName: author,
      body: "Fotoğraflı yorum",
      media: [{ kind: "image", url: `data:image/webp;base64,${photo.toString("base64")}` }],
    },
  });
  expect(answer.status()).toBe(200);
  const [row] = await sql<{ media: { url: string; kind: string }[] }>("SELECT media FROM reviews WHERE author_name = $1", [author]);
  expect(row.media).toHaveLength(1);
  expect(row.media[0]).toMatchObject({ kind: "image", url: expect.stringMatching(/^\/dosya\/yorum\/\d{4}\/\d{2}\/[0-9a-f]{16}\.webp$/) });
  const file = await page.request.get(row.media[0].url);
  expect([file.status(), file.headers()["content-type"]]).toEqual([200, "image/webp"]);
  expect(Buffer.from(await file.body()).equals(photo)).toBe(true);

  // Video sigmiyorsa ya da turu yanlissa kaydedilmez.
  const wrong = await page.request.post("/api/formlar/yorum", {
    data: { productId: p.id, rating: 4, authorName: author, body: "Yanlış", media: [{ kind: "video", url: `data:video/mp4;base64,${photo.toString("base64")}` }] },
  });
  expect([wrong.status(), (await wrong.json()).error]).toEqual([400, "Video MP4, MOV, M4V ya da WebM olmalı."]);

  // Formdaki not: veritabani modunda video en fazla 10 MB.
  await page.goto(`/urun/${p.slug}`);
  const hint = page.getByText(/Video en fazla 10 MB olabilir/);
  await expect(async () => {
    await page.getByRole("button", { name: "Değerlendirme Yaz" }).click();
    await expect(hint).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20_000 });

  await sql("DELETE FROM reviews WHERE author_name = $1", [author]);
});
