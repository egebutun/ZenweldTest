import { closeDatabase, expect, firstAnswer, refreshSite, sql, test } from "./yardimci";

/**
 * LISTELERIN SAYFALANMASI, VERITABANI MODU (KARARLAR K-124)
 *
 * Haber sayisi 12'yi gecince 2. sayfa acilir; kayit sayisinin disindaki
 * sayfa 404 doner; /sayfa/1 listenin adresine 301 ile gider.
 */
test.afterAll(closeDatabase);

test("haberler: 2. sayfa açılır (başlık ve asıl adres kendisi), sınır dışı sayfa 404, /sayfa/1 yönlenir", async ({ request }) => {
  const [{ total }] = await sql<{ total: number }>("SELECT count(*)::int AS total FROM news WHERE active");
  const extra = Math.max(0, 13 - total);
  try {
    await sql(
      `INSERT INTO news (id, slug, title, summary, body, cover_url, images, published_at, active)
       SELECT 'n-e2e-' || g, 'e2e-haber-' || g, 'Deneme Haber ' || g, summary, body, cover_url, images, timestamptz '2001-01-01' + g * interval '1 day', true
         FROM (SELECT * FROM news ORDER BY id LIMIT 1) n, generate_series(1, $1) g`,
      [extra],
    );
    await refreshSite(request);
    const pages = Math.ceil((total + extra) / 12);

    const page2 = await request.get("/haberler/sayfa/2");
    expect(page2.status()).toBe(200);
    const html = await page2.text();
    expect(html).toMatch(/<title>Haberler — Sayfa 2 \| ZENWELD<\/title>/);
    expect(html).toMatch(/<link rel="canonical" href="[^"]*\/haberler\/sayfa\/2"/);
    expect(html).toContain("/haberler/e2e-haber-1");
    expect((await request.get(`/haberler/sayfa/${pages + 1}`)).status()).toBe(404);
    expect((await request.get("/haberler/sayfa/abc")).status()).toBe(404);
    expect(await firstAnswer(request, "/haberler/sayfa/1")).toEqual({ status: 301, location: "/haberler" });
  } finally {
    await sql("DELETE FROM news WHERE id LIKE 'n-e2e-%'");
    await refreshSite(request);
  }
});
