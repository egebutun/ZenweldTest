import type { Page } from "@playwright/test";
import { uploadTypeError } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, test } from "./yardimci";

/**
 * PANELDEN DOSYA YUKLEME VE /dosya ADRESI (KARARLAR K-108)
 *
 * Yukleme ucu yalnizca panel oturumuyla ve ayni siteden calisir; dosyanin
 * turu icerigine bakilarak bulunur. /dosya adresi yalnizca depodaki
 * gecerli anahtarlari sunar. Yuklemenin ekranlardaki hali: panel-katalog
 * (urun gorseli) ve panel-sayfalar (belge).
 */
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const file = (name: string, mimeType: string, buffer: Buffer) => ({ multipart: { dosya: { name, mimeType, buffer } } });

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

test("oturumsuz ya da başka siteden gelen yükleme reddedilir", async ({ request }) => {
  const anonymous = await request.post("/api/yonetim/dosya?tur=gorsel", file("a.png", "image/png", PNG));
  expect([anonymous.status(), (await anonymous.json()).error]).toEqual([401, tr.panel.sessionEnded]);
  const foreign = await request.post("/api/yonetim/dosya?tur=gorsel", {
    ...file("a.png", "image/png", PNG),
    headers: { origin: "https://baska-site.example" },
  });
  expect(foreign.status()).toBe(403);
});

test("yükleme: türü içeriğinden bulunur; uygunsa adresinden sunulur", async ({ page }) => {
  await panelLogin(page);
  const api = page.request;

  // Adi ve bildirilen turu gorsel olan ama icerigi HTML olan dosya; SVG.
  for (const [name, mimeType, body] of [
    ["resim.png", "image/png", "<html><script>alert(1)</script></html>"],
    ["logo.svg", "image/svg+xml", '<svg xmlns="http://www.w3.org/2000/svg"/>'],
  ]) {
    const refused = await api.post("/api/yonetim/dosya?tur=gorsel", file(name, mimeType, Buffer.from(body)));
    expect([refused.status(), (await refused.json()).error]).toEqual([400, uploadTypeError("gorsel")]);
  }
  expect((await api.post("/api/yonetim/dosya?tur=baska", file("a.png", "image/png", PNG))).status()).toBe(400);

  // Uzantisi yanlis ama icerigi PNG: gercek turuyle kaydedilir.
  const answer = await api.post("/api/yonetim/dosya?tur=gorsel", file("foto.jpg", "image/jpeg", PNG));
  const body = (await answer.json()) as { ok: boolean; address: string; size: number };
  expect(answer.status()).toBe(200);
  expect(body).toMatchObject({ ok: true, size: PNG.length });
  expect(body.address).toMatch(/^\/dosya\/gorsel\/\d{4}\/\d{2}\/[0-9a-f]{16}\.png$/);
  const served = await api.get(body.address);
  expect([served.status(), served.headers()["content-type"], served.headers()["cache-control"]]).toEqual([
    200,
    "image/png",
    "public, max-age=31536000, immutable",
  ]);
});

test("/dosya yalnızca depodaki geçerli anahtarları sunar", async ({ request }) => {
  for (const path of [
    "/dosya/gorsel/2026/11/0123456789abcdef.png",
    "/dosya/gorsel/2026/11/zzzz.png",
    "/dosya/belge/2026/11/0123456789abcdef/..%2F..%2Fpackage.json",
    "/dosya/%2E%2E/%2E%2E/package.json",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
