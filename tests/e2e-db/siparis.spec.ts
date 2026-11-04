import type { Page } from "@playwright/test";
import { formatPrice } from "@zenweld/utils";
import { withLuhn } from "../unit/ornek";
import { catalog, closeDatabase, expect, expectedOffer, plainProductInStock, registerMember, sql, test } from "./yardimci";

/**
 * SIPARISLER SUNUCUDA (Asama 5.2; KARARLAR K-97, IS-KURALLARI › Sipariş)
 *
 * Veritabani modunda siparisi sunucu kaydeder: tutar, stok ve kupon
 * sunucuda yeniden hesaplanir; Siparislerim sunucudan okunur; odeme suresi
 * dolan havale okunurken iptal edilir; iade talebi sunucuda acilir.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const PASSWORD = "uzun-sifre-1";
const newEmail = (name: string) => `${name}-${Date.now()}@ornek.com`;

async function loginViaForm(page: Page, email: string) {
  await page.goto("/giris");
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(PASSWORD);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/hesabim/);
}

async function addToCart(page: Page, slug: string) {
  await page.goto(`/urun/${slug}`);
  await page.getByRole("button", { name: "Sepete Ekle" }).first().click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("zenweld.cart.v1") ?? "[]")).not.toBe("[]");
}

/** Odeme formu: yeni adres, bireysel fatura, sozlesme onayi; kartta kart bilgileri. */
async function fillCheckout(page: Page, method: "card" | "transfer") {
  await page.goto("/odeme");
  await expect(page.locator("input[autocomplete=name]").first()).toBeVisible();
  // Teslimat adresi alanlari: Ad Soyad, Telefon, Il, Ilce, Acik adres.
  const address = page.locator("input[autocomplete=name]").first().locator("xpath=ancestor::div[.//textarea][1]");
  const inputs = address.locator("input");
  await inputs.nth(0).fill("Deneme Üye");
  await inputs.nth(1).fill("05551112233");
  await inputs.nth(2).fill("Konya");
  await inputs.nth(3).fill("Selçuklu");
  await address.locator("textarea").fill("Örnek Cad. No:1");
  await page.locator("input[maxlength='11']").first().fill("10000000146");
  if (method === "card") {
    await page.fill("input[autocomplete=cc-name]", "Deneme Üye");
    await page.fill("input[autocomplete=cc-number]", CARD);
    await page.fill("input[autocomplete=cc-exp]", `12/${String((new Date().getFullYear() + 2) % 100).padStart(2, "0")}`);
    await page.fill("input[autocomplete=cc-csc]", "123");
  } else {
    await page.getByText("Havale / EFT", { exact: true }).click();
  }
  await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
}

const pay = (page: Page, method: "card" | "transfer") =>
  page.locator(method === "card" ? "button:has-text('Öde')" : "button:has-text('Siparişi Tamamla')").last().click();

const CARD = withLuhn("440000000000123");

/** Magaza ayarlarindaki kargo kurali (veritabanindan). */
async function shippingFor(goods: number): Promise<number> {
  const [{ value }] = await sql<{ value: { freeShippingThreshold: number; shippingFee: number } }>(
    "SELECT value FROM settings WHERE key = 'shop'",
  );
  return goods >= value.freeShippingThreshold ? 0 : value.shippingFee;
}

const orderOf = async (code: string) =>
  (
    await sql<{ status: string; total: number; coupon_code: string | null; card_last4: string | null; email: string }>(
      "SELECT status, total::float AS total, coupon_code, card_last4, email FROM orders WHERE code = $1",
      [code],
    )
  )[0];

test("kartla sipariş sunucuda; sepette kupon sunucuda denetlenir; başka cihazda görünür; iade talebi", async ({ page, browser, problems }) => {
  const { product, offer } = await plainProductInStock();
  const email = newEmail("siparis");
  await registerMember(page.request, email, PASSWORD);
  await sql("INSERT INTO coupons (id, code, discount_type, discount_value) VALUES ('e2e-kupon', 'E2E100', 'amount', 100) ON CONFLICT DO NOTHING");

  await addToCart(page, product.slug);
  await page.goto("/sepet");
  await page.fill("#coupon-code", "yok-boyle-kod");
  await page.getByRole("button", { name: "Uygula" }).click();
  await expect(page.locator("main")).toContainText("Bu kupon kodu geçerli değil.");
  await page.fill("#coupon-code", "e2e100");
  await page.getByRole("button", { name: "Uygula" }).click();
  await expect(page.getByTestId("coupon-applied")).toContainText("E2E100 kuponu uygulandı.");

  await fillCheckout(page, "card");
  await pay(page, "card");
  await expect(page).toHaveURL(/\/hesabim\/siparislerim\/SIP-\d{4}-\d{5}\?yeni=1/, { timeout: 15_000 });
  const code = decodeURIComponent(new URL(page.url()).pathname.split("/").pop()!);
  await expect(page.locator("main")).toContainText(code);
  await expect(page.locator("main")).toContainText("Hazırlanıyor");

  expect(await orderOf(code)).toEqual({
    status: "preparing",
    total: offer.price - 100 + (await shippingFor(offer.price - 100)),
    coupon_code: "E2E100",
    card_last4: CARD.slice(-4),
    email,
  });
  // Kart numarasinin tamami hicbir yere yazilmaz; yeni adres adreslere kaydedildi.
  expect((await sql("SELECT 1 FROM addresses a JOIN users u ON u.id = a.user_id WHERE u.email = $1", [email])).length).toBe(1);
  expect((await sql("SELECT 1 FROM coupon_redemptions WHERE coupon_code = 'E2E100' AND released_at IS NULL")).length).toBeGreaterThan(0);

  // Baska cihaz: Siparislerim sunucudan.
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await loginViaForm(second, email);
    await second.goto("/hesabim/siparislerim");
    await expect(second.locator("main")).toContainText(code);
  } finally {
    await other.close();
  }

  // Teslim edildi (panel Asama 5.5'e kadar tarayicida; burada veritabanindan).
  await sql("UPDATE orders SET status = 'delivered' WHERE code = $1", [code]);
  await sql("INSERT INTO order_status_history (order_id, seq, status, at) SELECT id, 1, 'delivered', now() FROM orders WHERE code = $1", [code]);
  await page.goto(`/hesabim/siparislerim/${code}`);
  await page.getByRole("button", { name: "İade Talebi Oluştur" }).click();
  await page.getByLabel(/İade adedi/).first().selectOption("1");
  await page.getByRole("button", { name: "Talebi Gönder" }).click();
  await expect(page.locator("main")).toContainText(/İade talebiniz alındı\. Talep numaranız IAD-\d{4}-\d{4}/);
  expect(
    await sql("SELECT status, reason FROM return_requests WHERE order_code = $1", [code]),
  ).toEqual([{ status: "new", reason: "changed_mind" }]);
  await expect(page.getByRole("button", { name: "İade Talebi Oluştur" })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("fiyat değiştiyse sipariş alınmaz ve yeni tutar söylenir", async ({ page }) => {
  const { product, offer } = await plainProductInStock();
  const email = newEmail("fiyat");
  await registerMember(page.request, email, PASSWORD);
  await addToCart(page, product.slug);
  await fillCheckout(page, "transfer");
  // Musteri sayfayi actiktan sonra fiyat degisti (sayfa eski fiyati gosteriyor).
  await sql("UPDATE products SET price_ex_vat = price_ex_vat + 100 WHERE id = $1", [product.id]);
  try {
    await pay(page, "transfer");
    // Yeni fiyat sitenin kurallariyla (kampanya dahil) veritabanindan hesaplanir.
    const fresh = await catalog();
    const newPrice = expectedOffer(fresh.products.find((p) => p.id === product.id)!, fresh.warehouseStock).price;
    expect(newPrice).not.toBe(offer.price);
    const total = newPrice + (await shippingFor(newPrice));
    await expect(page.locator("main")).toContainText(`Fiyatlar güncellendi; ödenecek tutar artık ${formatPrice(total)}.`);
    await expect(page).toHaveURL(/\/odeme$/);
    expect((await sql("SELECT 1 FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = $1", [email])).length).toBe(0);
  } finally {
    await sql("UPDATE products SET price_ex_vat = price_ex_vat - 100 WHERE id = $1", [product.id]);
  }
});

test("havale: ödeme süresi dolunca Siparişlerim açılırken iptal edilir", async ({ page }) => {
  const { product } = await plainProductInStock();
  const email = newEmail("havale");
  await registerMember(page.request, email, PASSWORD);
  await addToCart(page, product.slug);
  await fillCheckout(page, "transfer");
  await pay(page, "transfer");
  await expect(page).toHaveURL(/\/hesabim\/siparislerim\/SIP-/, { timeout: 15_000 });
  await expect(page.locator("main")).toContainText("Ödeme Bekleniyor");
  const code = decodeURIComponent(new URL(page.url()).pathname.split("/").pop()!);

  await sql("UPDATE orders SET due_at = now() - interval '2 days' WHERE code = $1", [code]);
  await page.goto("/hesabim/siparislerim");
  await expect(page.locator("main")).toContainText("İptal Edildi");
  expect((await orderOf(code)).status).toBe("cancelled");
  expect(await sql("SELECT note FROM order_status_history h JOIN orders o ON o.id = h.order_id WHERE o.code = $1 AND h.status = 'cancelled'", [code])).toEqual([
    { note: "Ödeme süresi doldu" },
  ]);
});
