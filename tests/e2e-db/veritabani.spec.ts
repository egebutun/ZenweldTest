import { sapItemCode } from "@zenweld/data";
import { formatPrice } from "@zenweld/utils";
import { withLuhn } from "../unit/ornek";
import {
  catalog,
  closeDatabase,
  countInPayload,
  expect,
  expectedOffer,
  memberLogin,
  offerOnPage,
  refreshSite,
  sapStockRead,
  sql,
  test,
} from "./yardimci";

/**
 * VERITABANI MODU (DATA_SOURCE=database; KARARLAR K-88, Asama 3.7)
 *
 * Site test veritabanindan okurken: butun sayfalar acilir, fiyat ve stok
 * veritabaniyla ayni, degisiklik yenilemeden sonra hemen gorunur, SAP stok
 * okumasi sayfaya hemen yansir, agir veri yalnizca gereken sayfaya gider, uye
 * kartla satin alabilir. Veriyi degistiren testler sonunda eski haline
 * dondurur.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const ONLINE = "https://schema.org/InStock";
const OUT = "https://schema.org/OutOfStock";

/** Seceneksiz ve depoda stogu olan bir urun (fiyat ve odeme testleri icin). */
async function plainProductInStock() {
  const { products, warehouseStock } = await catalog();
  const product = products.find(
    (p) => p.active && !(p.options?.variants.length ?? 0) && expectedOffer(p, warehouseStock).inStock,
  );
  if (!product) throw new Error("Test için seçeneksiz, stokta bir ürün yok.");
  return { product, offer: expectedOffer(product, warehouseStock) };
}

test("bütün sayfalar hatasız açılır", async ({ page, problems, request }) => {
  test.setTimeout(10 * 60_000);
  // Sunucu ile tarayicinin ilk cizimi farkli veri gorurse React hata yazar.
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat|Minified React error #(418|423|425)/i.test(m.text())) {
      problems.push(`React: ${m.text().slice(0, 200)}`);
    }
  });
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(paths.length).toBeGreaterThan(100);
  for (const path of [...paths, "/sepet", "/giris", "/arama?q=kaynak"]) {
    problems.length = 0;
    const response = await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    expect.soft(response?.status() ?? 0, `${path}: HTTP durumu`).toBeLessThan(400);
    expect.soft(await page.locator("h1", { hasText: "Sayfa bulunamadı" }).count(), `${path}: 404 sayfası`).toBe(0);
    expect.soft(problems, `${path}: JS hatası`).toEqual([]);
  }
});

test("bütün ürünlerin fiyatı ve stok durumu veritabanıyla aynı", async ({ request }) => {
  const { products, warehouseStock } = await catalog();
  const active = products.filter((p) => p.active);
  expect(active.length).toBeGreaterThan(10);
  for (const product of active) {
    const want = expectedOffer(product, warehouseStock);
    const got = await offerOnPage(request, `/urun/${product.slug}`);
    expect.soft(got.price, `${product.slug}: fiyat`).toBe(want.price);
    expect.soft(got.availability, `${product.slug}: stok`).toBe(want.inStock ? ONLINE : OUT);
  }
});

test("sayfada görünen fiyat ve stok; depo stoğu 0 olunca STOKTA YOK", async ({ page, request }) => {
  const { product, offer } = await plainProductInStock();
  const code = sapItemCode(product.sku);
  const [{ quantity }] = await sql<{ quantity: number }>(
    "SELECT quantity FROM warehouse_stock WHERE sap_item_code = $1",
    [code],
  );
  try {
    await page.goto(`/urun/${product.slug}`);
    const main = page.locator("main");
    await expect(main).toContainText(formatPrice(offer.price));
    await expect(page.getByRole("button", { name: "Sepete Ekle" }).first()).toBeEnabled();

    await sql("UPDATE warehouse_stock SET quantity = 0 WHERE sap_item_code = $1", [code]);
    await refreshSite(request, ["depo-stogu"]);
    await page.goto(`/urun/${product.slug}`);
    await expect(page.getByRole("button", { name: /stokta yok/i }).first()).toBeDisabled();
    expect((await offerOnPage(request, `/urun/${product.slug}`)).availability).toBe(OUT);
  } finally {
    await sql("UPDATE warehouse_stock SET quantity = $2 WHERE sap_item_code = $1", [code, quantity]);
    await refreshSite(request, ["depo-stogu"]);
  }
});

test("SAP stok okuması: stok 0 gelince sayfa hemen STOKTA YOK; hatalı okumada son stok kalır", async ({ page, request }) => {
  const { product } = await plainProductInStock();
  const code = sapItemCode(product.sku);
  const before = await sql<{ code: string; name: string | null; quantity: number }>(
    "SELECT sap_item_code AS code, item_name AS name, quantity::float AS quantity FROM warehouse_stock ORDER BY 1",
  );
  const lastRun = async () =>
    (await sql<{ status: string; error: string | null }>("SELECT status, error FROM sap_sync_runs ORDER BY id DESC LIMIT 1"))[0];
  try {
    // Anahtarsiz okuma yapilamaz.
    expect((await request.get("/api/sap/stok", { headers: { authorization: "Bearer yanlis" } })).status()).toBe(401);

    const read = await sapStockRead(request, before.map((r) => (r.code === code ? { ...r, quantity: 0 } : r)));
    expect(read).toMatchObject({ status: 200, body: { ok: true, kalem: before.length, degisen: 1, yenilendi: true } });
    await page.goto(`/urun/${product.slug}`);
    await expect(page.getByRole("button", { name: /stokta yok/i }).first()).toBeDisabled();
    expect((await offerOnPage(request, `/urun/${product.slug}`)).availability).toBe(OUT);

    // Ayni okuma tekrar: degisiklik yok, sayfalar yenilenmez.
    expect((await sapStockRead(request, before.map((r) => (r.code === code ? { ...r, quantity: 0 } : r)))).body).toMatchObject({
      degisen: 0,
      yenilendi: false,
    });

    // Hatali okuma: son iyi stok kalir, hata kaydedilir.
    const bad = await sapStockRead(request, "kod;ad;miktar\n;;5\n");
    expect(bad).toMatchObject({ status: 502, body: { ok: false, error: "1. satırda kalem kodu boş." } });
    expect(await lastRun()).toEqual({ status: "failed", error: "1. satırda kalem kodu boş." });
    const [row] = await sql<{ quantity: number }>("SELECT quantity::float AS quantity FROM warehouse_stock WHERE sap_item_code = $1", [code]);
    expect(row.quantity).toBe(0);
  } finally {
    expect((await sapStockRead(request, before)).status).toBe(200);
    expect(await lastRun()).toEqual({ status: "success", error: null });
  }
  await page.goto(`/urun/${product.slug}`);
  await expect(page.getByRole("button", { name: "Sepete Ekle" }).first()).toBeEnabled();
});

test("veritabanındaki değişiklik yenilemeden sonra hemen görünür", async ({ page, request }) => {
  const { product } = await plainProductInStock();
  const [before] = await sql<{ price: string }>("SELECT price_ex_vat AS price FROM products WHERE id = $1", [
    product.id,
  ]);
  const [blog] = await sql<{ id: string; title: string }>(
    "SELECT id, title FROM blog_posts WHERE active ORDER BY published_at DESC LIMIT 1",
  );
  const [faq] = await sql<{ id: string; question: string }>("SELECT id, question FROM faqs ORDER BY position LIMIT 1");
  try {
    await sql("UPDATE products SET price_ex_vat = 12345 WHERE id = $1", [product.id]);
    await sql("UPDATE blog_posts SET title = 'Veritabanı Testi Blog Başlığı' WHERE id = $1", [blog.id]);
    await sql("UPDATE faqs SET question = 'Veritabanı testi sorusu?' WHERE id = $1", [faq.id]);
    await refreshSite(request);

    const { products, warehouseStock } = await catalog();
    const changed = products.find((p) => p.id === product.id)!;
    expect((await offerOnPage(request, `/urun/${product.slug}`)).price).toBe(expectedOffer(changed, warehouseStock).price);
    await page.goto("/blog");
    await expect(page.locator("main")).toContainText("Veritabanı Testi Blog Başlığı");
    await page.goto("/sss");
    await expect(page.locator("main")).toContainText("Veritabanı testi sorusu?");
  } finally {
    await sql("UPDATE products SET price_ex_vat = $2 WHERE id = $1", [product.id, before.price]);
    await sql("UPDATE blog_posts SET title = $2 WHERE id = $1", [blog.id, blog.title]);
    await sql("UPDATE faqs SET question = $2 WHERE id = $1", [faq.id, faq.question]);
    await refreshSite(request);
  }
});

test("ağır ve sayfaya özel veri yalnızca gereken sayfaya gider", async ({ request }) => {
  // Bayi stogu en kalabalik urun: sayfasina yalnizca kendi stoktaki satirlari gider.
  const [busiest] = await sql<{ slug: string; rows: number }>(
    `SELECT p.slug, count(*)::int AS rows FROM dealer_stock d JOIN products p ON p.id = d.product_id
      WHERE d.quantity > 0 AND p.active GROUP BY p.slug ORDER BY rows DESC LIMIT 1`,
  );
  const productPage = await (await request.get(`/urun/${busiest.slug}`)).text();
  expect(countInPayload(productPage, "dealerId")).toBe(busiest.rows);

  // Bayinin/saticinin fiyati tarayiciya gonderilmez: ayirt edici bir fiyat
  // yazilir, sayfada gecmemeli.
  const where = "product_id = (SELECT id FROM products WHERE slug = $1)";
  const prices = await sql<{ dealer_id: string; variant_id: string; price: string | null }>(
    `SELECT dealer_id, variant_id, price FROM dealer_stock WHERE ${where}`,
    [busiest.slug],
  );
  try {
    await sql(`UPDATE dealer_stock SET price = 987654 WHERE ${where}`, [busiest.slug]);
    await refreshSite(request, ["stok"]);
    const withSellerPrice = await (await request.get(`/urun/${busiest.slug}`)).text();
    expect(countInPayload(withSellerPrice, "dealerId")).toBe(busiest.rows);
    expect(withSellerPrice).not.toContain("987654");
  } finally {
    for (const row of prices) {
      await sql(
        `UPDATE dealer_stock SET price = $4 WHERE ${where} AND dealer_id = $2 AND variant_id = $3`,
        [busiest.slug, row.dealer_id, row.variant_id, row.price],
      );
    }
    await refreshSite(request, ["stok"]);
  }

  const home = await (await request.get("/")).text();
  expect(countInPayload(home, "dealerId")).toBe(0);

  // Yasal metnin govdesi yalnizca kendi sayfasinda.
  const marker = "VERITABANI-TESTI-KVKK-ISARETI";
  await sql("UPDATE legal_pages SET body = body || $1 WHERE id = 'kvkk'", [` ${marker}`]);
  try {
    await refreshSite(request, ["icerik"]);
    expect(await (await request.get("/yasal/kvkk")).text()).toContain(marker);
    expect(await (await request.get("/")).text()).not.toContain(marker);
    expect(await (await request.get(`/urun/${busiest.slug}`)).text()).not.toContain(marker);
  } finally {
    await sql("UPDATE legal_pages SET body = replace(body, $1, '') WHERE id = 'kvkk'", [` ${marker}`]);
    await refreshSite(request, ["icerik"]);
  }
});

test("üye ürünü veritabanındaki fiyatla kartla satın alır", async ({ page, problems }) => {
  const { product, offer } = await plainProductInStock();
  await memberLogin(page);
  await page.goto(`/urun/${product.slug}`);
  await page.getByRole("button", { name: "Sepete Ekle" }).first().click();

  await page.goto("/sepet");
  const main = page.locator("main");
  await expect(main).toContainText(product.sku);
  await expect(main).toContainText(formatPrice(offer.price));

  await page.goto("/odeme");
  const tc = page.locator("input[maxlength='11']").first();
  if (await tc.count()) await tc.fill("10000000146");
  await page.fill("input[autocomplete=cc-name]", "Deneme Kişi");
  await page.fill("input[autocomplete=cc-number]", withLuhn("440000000000123"));
  await page.fill("input[autocomplete=cc-exp]", `12/${String((new Date().getFullYear() + 2) % 100).padStart(2, "0")}`);
  await page.fill("input[autocomplete=cc-csc]", "123");
  await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
  await page.locator("button:has-text('Öde')").last().click();

  await expect(page).toHaveURL(/\/hesabim\/siparislerim\/SIP-\d{4}-\d{5}/, { timeout: 15_000 });
  await expect(main).toContainText("Hazırlanıyor");
  expect(problems).toEqual([]);
});
