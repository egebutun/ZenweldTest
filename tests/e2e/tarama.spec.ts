import type { Page } from "@playwright/test";
import { SESSION, expect, test } from "./yardimci";

/**
 * SAYFA TARAMASI
 *
 * Site haritasindaki her sayfa, haritada olmayan sayfalar, Hesabim ve panel
 * acilir; her birinde: hata kodu yok, "Sayfa bulunamadi" yok, JS hatasi ve
 * guvenlik politikasi ihlali yok, "demo" yazisi ve Ingilizce dil secenegi
 * yok (CLAUDE.md, KARARLAR K-01).
 */

const OUTSIDE_SITEMAP = ["/giris", "/kayit", "/sifremi-unuttum", "/arama?q=kaynak", "/sepet"];
const ACCOUNT = [
  "/hesabim",
  "/hesabim/profil",
  "/hesabim/adreslerim",
  "/hesabim/favorilerim",
  "/hesabim/garantilerim",
  "/hesabim/siparislerim",
  "/hesabim/tekliflerim",
  "/odeme",
];
const PANEL = [
  "",
  "/siparisler",
  "/teklifler",
  "/magaza",
  "/urunler",
  "/urunler/yeni",
  "/kategoriler",
  "/kategoriler/yeni",
  "/kategoriler/grup/yeni",
  "/secenekler",
  "/stok",
  "/yorumlar",
  "/bayiler",
  "/saticilar",
  "/satis-temsilcileri",
  "/uyeler",
  "/servis-talepleri",
  "/garantiler",
  "/haberler",
  "/haberler/yeni",
  "/etkinlikler",
  "/etkinlikler/yeni",
  "/blog",
  "/blog/yeni",
  "/hakkimizda",
  "/sss",
  "/belgeler",
  "/yasal-metinler",
  "/sayfa-seo",
  "/gorunum",
].map((path) => `/yonetim${path}`);

/** "demo" kelimesinin site demosu degil, urun tanitimi anlaminda gectigi icerik. */
const ALLOWED_DEMO = /uygulamalı demo gösterileri|canlı demo\p{L}*|demo ve satış sonrası/gu;

async function scan(page: Page, problems: string[], paths: string[]) {
  for (const path of paths) {
    problems.length = 0;
    const response = await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const text = await page.locator("body").innerText();
    expect.soft(response?.status() ?? 0, `${path}: HTTP durumu`).toBeLessThan(400);
    expect.soft(await page.locator("h1", { hasText: "Sayfa bulunamadı" }).count(), `${path}: 404 sayfası`).toBe(0);
    expect.soft(problems, `${path}: JS hatası / CSP`).toEqual([]);
    // Haric: "@demo.com" e-posta adresleri ve urun tanitimi anlamindaki
    // icerik ("Uygulamalı Demo Gösterileri", "Demo ve Satış Sonrası ...").
    const content = text.toLocaleLowerCase("tr").replace(ALLOWED_DEMO, "");
    expect.soft(content, `${path}: "demo" yazısı`).not.toMatch(/(?<![@\p{L}.])demo/u);
    expect.soft(text, `${path}: İngilizce dil seçeneği`).not.toMatch(/\b(English|İngilizce)\b/);
    const languageLinks = await page.locator('a[href^="/en"], a[href^="/tr/"], a[href="/tr"]').count();
    expect.soft(languageLinks, `${path}: /en ya da /tr bağlantısı`).toBe(0);
  }
}

test.describe("ziyaretçi", () => {
  test.setTimeout(10 * 60_000);

  test("site haritasındaki bütün sayfalar", async ({ page, problems, request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(paths.length).toBeGreaterThan(100);
    await scan(page, problems, paths);
  });

  test("site haritasında olmayan sayfalar", async ({ page, problems }) => {
    await scan(page, problems, OUTSIDE_SITEMAP);
  });

  test("güvenlik başlıkları", async ({ request }) => {
    for (const path of ["/", "/yonetim/giris"]) {
      const headers = (await request.get(path)).headers();
      expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
      expect(headers["strict-transport-security"], path).toBeTruthy();
      expect(headers["x-frame-options"], path).toBe("DENY");
      expect(headers["x-content-type-options"], path).toBe("nosniff");
      expect(headers["referrer-policy"], path).toBeTruthy();
      expect(headers["permissions-policy"], path).toBeTruthy();
    }
    expect((await request.get("/yonetim/giris")).headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("üye", () => {
  test.use({ storageState: SESSION.member });

  test("Hesabım sayfaları", async ({ page, problems }) => {
    await page.goto("/hesabim/siparislerim");
    const order = await page.locator('a[href^="/hesabim/siparislerim/SIP-"]').first().getAttribute("href");
    await scan(page, problems, [...ACCOUNT, ...(order ? [order] : [])]);
  });
});

test.describe("yönetici", () => {
  test.use({ storageState: SESSION.admin });

  test("panel ekranları", async ({ page, problems }) => {
    test.setTimeout(5 * 60_000);
    await scan(page, problems, PANEL);
  });
});
