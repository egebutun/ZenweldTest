import type { Page } from "@playwright/test";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL › UZUN LISTELER SUNUCUDA (veritabani modu; docs/ADMIN-KULLANIM.md › 2)
 *
 * Sunucu yalnizca istenen sayfanin 50 kaydini gonderir; arama, durum ve
 * sayfa adreste durur ve veritabaninda yapilir. Demo modundaki hali:
 * tests/e2e/panel-listeler.spec.ts.
 */
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("siparişler: sayfaya yalnızca o sayfanın siparişleri gelir; arama ve durum sunucuda", async ({ page, problems }) => {
  await panelLogin(page);
  const newest = await sql<{ code: string; status: string }>(
    "SELECT code, status FROM orders ORDER BY created_at DESC, code DESC",
  );
  expect(newest.length).toBeGreaterThan(50);

  const first = await (await page.goto("/yonetim/siparisler"))!.text();
  expect(first).toContain(newest[0].code);
  expect(first, "51. sipariş 1. sayfayla gelmez").not.toContain(newest[50].code);
  const pager = page.getByRole("navigation", { name: "Sayfalar" });
  await expect(pager).toContainText(`1–50 / ${newest.length}`);

  await pager.getByRole("link", { name: "Sonraki →" }).click();
  await expect(page).toHaveURL(/\?sayfa=2$/);
  await expect(page.getByRole("link", { name: newest[50].code })).toBeVisible();

  const delivered = newest.filter((o) => o.status === "delivered");
  await page.getByRole("button", { name: /^Teslim Edildi/ }).click();
  await expect(page).toHaveURL(/\?durum=delivered$/);
  await expect(pager).toContainText(`/ ${delivered.length}`);

  // Turkce arama: I / ı ayni harf (veritabaninda translate + lower).
  const target = newest[60].code;
  await sql("UPDATE orders SET customer_name = 'IŞIK Deneme' WHERE code = $1", [target]);
  try {
    await page.goto("/yonetim/siparisler");
    await page.getByRole("searchbox", { name: "Siparişlerde ara" }).fill("ışık deneme");
    await expect(page).toHaveURL(/ara=/);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("link", { name: target })).toBeVisible();
  } finally {
    await sql("UPDATE orders SET customer_name = 'Deneme' WHERE code = $1 AND customer_name = 'IŞIK Deneme'", [target]);
  }
  expect(problems).toEqual([]);
});

test("iade talepleri: başlıkta veritabanındaki sayılar", async ({ page, problems }) => {
  await panelLogin(page);
  const [{ total, fresh }] = await sql<{ total: number; fresh: number }>(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'new')::int AS fresh FROM return_requests",
  );
  await page.goto("/yonetim/iade-talepleri");
  await expect(page.getByText(`${total} talep · ${fresh} yeni`)).toBeVisible();
  expect(problems).toEqual([]);
});

const istanbulToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

test("garantiler: 1. sayfayla yalnızca 50 kayıt gelir; CSV sunucudan, süzgece uyanların tamamı; oturumsuz CSV yok", async ({ page, request, problems }) => {
  expect((await request.get("/api/yonetim/csv/garantiler")).status()).toBe(401);
  await panelLogin(page);
  const rows = await sql<{ serial_number: string; expires_at: string }>(
    "SELECT serial_number, expires_at::text FROM warranties ORDER BY registered_at DESC, id DESC",
  );
  expect(rows.length).toBeGreaterThan(50);
  const html = await (await page.goto("/yonetim/garantiler"))!.text();
  expect(html).toContain(rows[0].serial_number);
  expect(html, "51. kayıt 1. sayfayla gelmez").not.toContain(rows[50].serial_number);
  await expect(page.getByRole("navigation", { name: "Sayfalar" })).toContainText(`1–50 / ${rows.length}`);

  const all = await (await page.request.get("/api/yonetim/csv/garantiler")).json();
  expect(all.rows).toHaveLength(rows.length);
  const today = istanbulToday();
  const expired = rows.filter((r) => r.expires_at < today).length;
  const some = await (await page.request.get("/api/yonetim/csv/garantiler?durum=expired")).json();
  expect(some.rows).toHaveLength(expired);
  const quotes = await sql<{ n: number }>("SELECT count(*)::int AS n FROM quotes WHERE status = 'new'");
  expect((await (await page.request.get("/api/yonetim/csv/teklifler?durum=new")).json()).rows).toHaveLength(quotes[0].n);
  expect(problems).toEqual([]);
});

test("yorumlar ve servis talepleri: sayılar ve süzgeç veritabanından", async ({ page, problems }) => {
  await panelLogin(page);
  const [{ total, pending }] = await sql<{ total: number; pending: number }>(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE NOT approved)::int AS pending FROM reviews",
  );
  await page.goto("/yonetim/yorumlar?bekleyen=1");
  await expect(page.getByText(`${pending} yorum · ${pending} onay bekliyor`)).toBeVisible();
  await page.getByRole("button", { name: "Onay bekleyenler" }).click();
  await expect(page).toHaveURL(/\/yonetim\/yorumlar$/);
  await expect(page.getByText(`${total} yorum · ${pending} onay bekliyor`)).toBeVisible();

  const [service] = await sql<{ total: number; fresh: number }>(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'new')::int AS fresh FROM service_requests",
  );
  await page.goto("/yonetim/servis-talepleri");
  await expect(page.getByText(`${service.total} talep · ${service.fresh} yeni`)).toBeVisible();
  expect(problems).toEqual([]);
});

test("üyeler: 1. sayfayla yalnızca 50 hesap gelir; CSV sunucudan, süzgece uyanların tamamı, şifre özeti yok", async ({ page, problems }) => {
  await panelLogin(page);
  const users = await sql<{ email: string; role: string; password_hash: string }>(
    "SELECT email, role, password_hash FROM users ORDER BY created_at DESC, email ASC",
  );
  expect(users.length).toBeGreaterThan(50);
  const html = await (await page.goto("/yonetim/uyeler"))!.text();
  expect(html).toContain(users[0].email);
  expect(html, "51. hesap 1. sayfayla gelmez").not.toContain(users[50].email);
  await expect(page.getByRole("navigation", { name: "Sayfalar" })).toContainText(`1–50 / ${users.length}`);

  const all = await (await page.request.get("/api/yonetim/csv/uyeler")).json();
  expect(all.rows).toHaveLength(users.length);
  expect(all.rows[0]).toMatchObject({ rol: expect.any(String), durum: expect.any(String) });
  // Ornek musterilerin cogunun sifresi yok (bos); yalnizca sifresi olan hesaplar denetlenir.
  const text = JSON.stringify(all.rows);
  const hashed = users.filter((u) => u.password_hash);
  expect(hashed.length).toBeGreaterThan(0);
  for (const u of hashed) expect(text).not.toContain(u.password_hash);
  const admins = await (await page.request.get("/api/yonetim/csv/uyeler?rol=admin")).json();
  expect(admins.rows).toHaveLength(users.filter((u) => u.role === "admin").length);
  expect(admins.rows.every((r: { rol: string }) => r.rol === "Yönetici")).toBe(true);
  expect(problems).toEqual([]);
});

test("mesajlar ve bayilik başvuruları: sayılar ve süzgeç veritabanından", async ({ page, problems }) => {
  await panelLogin(page);
  const [m] = await sql<{ total: number; fresh: number; contact: number }>(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'new')::int AS fresh,
            count(*) FILTER (WHERE type = 'iletisim')::int AS contact FROM support_messages`,
  );
  await page.goto("/yonetim/mesajlar?tur=iletisim");
  await expect(page.getByText(`${m.total} mesaj · ${m.fresh} yeni`)).toBeVisible();
  await expect(page.getByLabel("Tür")).toHaveValue("iletisim");
  if (m.contact === 0) await expect(page.getByText(m.total === 0 ? "Henüz mesaj yok." : "Bu türde mesaj yok.")).toBeVisible();

  const [a] = await sql<{ total: number; fresh: number }>(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'new')::int AS fresh FROM dealer_applications",
  );
  await page.goto("/yonetim/bayilik-basvurulari");
  await expect(page.getByText(`${a.total} başvuru · ${a.fresh} yeni`)).toBeVisible();
  expect(problems).toEqual([]);
});
