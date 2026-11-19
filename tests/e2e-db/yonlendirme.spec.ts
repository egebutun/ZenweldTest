import oldSite from "../../apps/zenweld-web/eski-site-yonlendirmeleri.json";
import { closeDatabase, catalog, expect, firstAnswer, refreshSite, sql, test } from "./yardimci";

/**
 * ESKI LINKLER SUNUCUDA KALICI YONLENIR (KARARLAR K-120)
 *
 * Panelde linki degisen kaydin eski adresi `redirects` tablosundadir.
 * Eski adres istenince sunucu 301 (kalici) ile kaydin bugunku adresine
 * gonderir (istek kontrolu, proxy.ts); arama motoru eski sonucu yeni adresle degistirir. Alti kayit
 * turu: urun (secenege donusen eski urun dahil), grup, kategori, blog,
 * haber, etkinlik. Paneldeki link degisikligiyle ayni akis
 * panel-katalog.spec.ts ve panel-icerik.spec.ts'te de denenir.
 */
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const old = (prefix: string) => `${prefix}/eski-link-${stamp}`;

test.afterAll(closeDatabase);

test("eski adresler 301 ile bugünkü adrese gider; kayıtlı olmayan adres 404 kalır", async ({ request }) => {
  const { products, categories, categoryGroups } = await catalog();
  const product = products.find((p) => p.active && !(p.options?.variants.length ?? 0))!;
  const withVariant = products.find((p) => p.active && (p.options?.variants.length ?? 0) > 0)!;
  const variant = withVariant.options!.variants[0];
  const category = categories[0];
  const group = categoryGroups.find((g) => g.section === category.section)!;
  const [blog] = await sql<{ id: string; slug: string }>("SELECT id, slug FROM blog_posts WHERE active LIMIT 1");
  const [news] = await sql<{ id: string; slug: string }>("SELECT id, slug FROM news WHERE active LIMIT 1");
  const [event] = await sql<{ id: string; slug: string }>("SELECT id, slug FROM events WHERE active LIMIT 1");

  const rows: { path: string; type: string; id: string; variant?: string; to: string }[] = [
    { path: old("/urun"), type: "product", id: product.id, to: `/urun/${product.slug}` },
    {
      path: `/urun/eski-secenek-${stamp}`,
      type: "product",
      id: withVariant.id,
      variant: variant.id,
      to: `/urun/${withVariant.slug}?secenek=${encodeURIComponent(variant.id)}`,
    },
    { path: old(`/${group.section}`), type: "group", id: group.id, to: `/${group.section}/${group.slug}` },
    {
      path: old(`/${category.section}/${category.group}`),
      type: "category",
      id: category.id,
      to: `/${category.section}/${category.group}/${category.slug}`,
    },
    { path: old("/blog"), type: "blog", id: blog.id, to: `/blog/${blog.slug}` },
    { path: old("/haberler"), type: "news", id: news.id, to: `/haberler/${news.slug}` },
    { path: old("/etkinlikler"), type: "event", id: event.id, to: `/etkinlikler/${event.slug}` },
  ];
  try {
    for (const r of rows) {
      await sql("INSERT INTO redirects (old_path, target_type, target_id, variant_id) VALUES ($1, $2, $3, $4)", [
        r.path,
        r.type,
        r.id,
        r.variant ?? null,
      ]);
    }
    await refreshSite(request);

    for (const r of rows) {
      expect(await firstAnswer(request, r.path), r.path).toEqual({ status: 301, location: r.to });
    }
    // Eski adresteki diger parametreler korunur.
    expect(await firstAnswer(request, `${rows[0].path}?utm_source=eposta`)).toEqual({
      status: 301,
      location: `${rows[0].to}?utm_source=eposta`,
    });
    // Eski adres listesinde olmayan adres "sayfa yok" olarak kalir.
    expect((await firstAnswer(request, `/urun/hic-olmamis-${stamp}`)).status).toBe(404);
    expect((await firstAnswer(request, `/blog/hic-olmamis-${stamp}`)).status).toBe(404);
  } finally {
    await sql("DELETE FROM redirects WHERE old_path = ANY($1)", [rows.map((r) => r.path)]);
    await refreshSite(request);
  }
});

test("eski zenweld.com adresleri veritabanı modunda da 301 ile yeni karşılığına gider (K-121)", async ({ request }) => {
  for (const { eski, yeni } of oldSite) expect(await firstAnswer(request, eski), eski).toEqual({ status: 301, location: yeni });
});
