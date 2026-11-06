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
