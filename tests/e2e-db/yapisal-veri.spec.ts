import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * GOOGLE'A GIDEN YAPISAL VERI, VERITABANI MODU (KARARLAR K-123)
 *
 * Urunun onayli yorumlari varsa yildiz (ortalama puan ve yorum sayisi)
 * gider; sitede gorunen ortalamayla aynidir. Onaysiz yorum sayilmaz.
 */
test.afterAll(closeDatabase);

test("ürün: onaylı yorumların ortalaması ve sayısı yıldız olarak gider; onaysız yorum sayılmaz", async ({ request }) => {
  const [row] = await sql<{ slug: string; average: number; count: number }>(
    `SELECT p.slug, round(avg(r.rating)::numeric, 1)::float AS average, count(*)::int AS count
       FROM reviews r JOIN products p ON p.id = r.product_id
      WHERE r.approved AND p.active GROUP BY p.slug ORDER BY count(*) DESC LIMIT 1`,
  );
  expect(row).toBeTruthy();
  const html = await (await request.get(`/urun/${row.slug}`)).text();
  const product = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((m) => JSON.parse(m[1]) as Record<string, unknown>)
    .find((d) => d["@type"] === "Product")!;
  expect(product.aggregateRating).toMatchObject({ ratingValue: row.average, reviewCount: row.count });
});
