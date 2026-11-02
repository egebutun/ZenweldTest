import type { Coupon } from "@zenweld/data";
import { withLuhn } from "../unit/ornek";
import { SESSION, changeDb, demoAccount, expect, readDb, test } from "./yardimci";
import type { Page } from "@playwright/test";

/**
 * KUPONLAR (docs/IS-KURALLARI.md › 21, KARARLAR K-85)
 *
 * Kuponlar test icinde kurulur (ornek veriden bagimsiz). Panelde kupon
 * olusturulur; sepette kod uygulanir; siparise yazilir; kisi basi sinir
 * dolunca ayni uye tekrar kullanamaz; sonradan gecersiz kalan kuponla
 * odemeye gecilmez.
 */

const SLUG = "ultimate-255-mma";
const card = withLuhn("440000000000123");
const expiry = `12/${String((new Date().getFullYear() + 2) % 100).padStart(2, "0")}`;
const TEST_TC = "10000000146";

function testCoupon(overrides: Partial<Coupon>): Coupon {
  const at = new Date().toISOString();
  return {
    id: `cpn-e2e-${overrides.code ?? "x"}`,
    code: "E2E",
    discountType: "percent",
    discountValue: 10,
    scope: "all",
    productIds: [],
    categoryIds: [],
    audience: "all",
    customerEmails: [],
    active: true,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

async function addCoupon(page: Page, coupon: Coupon): Promise<void> {
  await changeDb(page, (db) => {
    db.coupons = [coupon, ...db.coupons.filter((c) => c.code !== coupon.code)];
  });
}

/** Urunu sepete koyup sepete gider. */
async function cartWithProduct(page: Page): Promise<void> {
  await page.goto(`/urun/${SLUG}`);
  await page.locator("main").getByRole("button", { name: "Sepete Ekle" }).first().click();
  await page.goto("/sepet");
}

async function applyCoupon(page: Page, code: string): Promise<void> {
  await page.getByLabel("Kupon kodu").fill(code);
  await page.getByRole("button", { name: "Uygula" }).click();
}

test.describe("panel", () => {
  test.use({ storageState: SESSION.admin });

  test("yönetici kupon oluşturur; listede geçerli görünür", async ({ page, problems }) => {
    await page.goto("/yonetim/kuponlar/yeni");
    await page.getByLabel("Kupon Kodu").fill("panel-e2e");
    await page.getByLabel("İndirim Oranı (%)").fill("15");
    await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
    await expect(page).toHaveURL(/\/yonetim\/kuponlar\/cpn/);
    await expect(page.locator("h1")).toHaveText("PANEL-E2E");

    await page.goto("/yonetim/kuponlar");
    const row = page.locator("tr", { hasText: "PANEL-E2E" });
    await expect(row).toContainText("%15");
    await expect(row).toContainText("Geçerli");
    expect(problems).toEqual([]);
  });

  test("hatalı kupon kaydedilmez", async ({ page, problems }) => {
    await page.goto("/yonetim/kuponlar/yeni");
    await page.getByLabel("Kupon Kodu").fill("AB");
    await page.getByLabel("İndirim Oranı (%)").fill("10");
    await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
    await expect(page.locator("main, body").first()).toContainText("3–30 karakter");
    await expect(page).toHaveURL(/\/yonetim\/kuponlar\/yeni/);
    expect(problems).toEqual([]);
  });

  test("yönetici kişiye özel kupon oluşturur", async ({ page, problems }) => {
    await page.goto("/yonetim/kuponlar/yeni");
    await page.getByLabel("Kupon Kodu").fill("OZEL-E2E");
    await page.getByLabel("İndirim Oranı (%)").fill("10");
    await page.getByRole("button", { name: /Kimler Kullanabilir/ }).click();
    await page.getByLabel("Yalnızca belirli kişiler (kişiye özel)").check();
    await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
    await expect(page.locator("body")).toContainText("Kişiye özel kupon için en az bir e-posta adresi eklenmelidir.");

    const input = page.getByLabel("E-posta adresi");
    await input.fill("yanlis-adres");
    await page.getByRole("button", { name: "Ekle", exact: true }).click();
    await expect(page.locator("body")).toContainText("Geçerli bir e-posta adresi yazın.");
    await input.fill("Usta@OrnekAtolye.com");
    await input.press("Enter");
    await expect(page.getByTestId("coupon-emails")).toContainText("usta@ornekatolye.com");
    await expect(page.getByTestId("coupon-emails")).toContainText("henüz üye değil");
    await page.getByRole("button", { name: "Kuponu Oluştur" }).click();
    await expect(page).toHaveURL(/\/yonetim\/kuponlar\/cpn/);

    await page.goto("/yonetim/kuponlar");
    await expect(page.locator("tr", { hasText: "OZEL-E2E" })).toContainText("kişiye özel (1 e-posta)");
    expect(problems).toEqual([]);
  });
});

test("sepette kupon uygulanır; geçersiz kodun nedeni yazar", async ({ page, problems }) => {
  await page.goto("/");
  await addCoupon(page, testCoupon({ code: "SEPET10" }));
  await addCoupon(page, testCoupon({ code: "BUYUK", minCartTotal: 99_000_000 }));
  await cartWithProduct(page);

  await applyCoupon(page, "yok-boyle-kod");
  await expect(page.locator("main")).toContainText("Bu kupon kodu geçerli değil.");
  await applyCoupon(page, "buyuk");
  await expect(page.locator("main")).toContainText("ve üzeri sepetlerde geçerlidir");

  // Küçük harfle yazılsa da kabul edilir.
  await applyCoupon(page, "sepet10");
  await expect(page.getByTestId("coupon-applied")).toContainText("SEPET10 kuponu uygulandı.");
  await expect(page.getByTestId("coupon-row")).toContainText("Kupon (SEPET10)");

  await page.getByRole("button", { name: "Kuponu kaldır" }).click();
  await expect(page.getByTestId("coupon-row")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("sonradan geçersiz kalan kuponla ödemeye geçilmez", async ({ page, problems }) => {
  await page.goto("/");
  await addCoupon(page, testCoupon({ code: "PASIF10" }));
  await cartWithProduct(page);
  await applyCoupon(page, "PASIF10");
  await expect(page.getByTestId("coupon-row")).toBeVisible();

  await changeDb(page, (db) => {
    db.coupons.find((c) => c.code === "PASIF10")!.active = false;
  });
  await expect(page.getByTestId("coupon-applied")).toContainText("Bu kupon kodu geçerli değil.");
  await expect(page.getByRole("button", { name: "Ödemeye Geç" })).toBeDisabled();
  await expect(page.getByTestId("coupon-row")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test.describe("üye", () => {
  test.use({ storageState: SESSION.member });

  test("kuponlu sipariş: indirim siparişe yazılır, kişi başı hak dolar", async ({ page, problems }) => {
    await page.goto("/");
    await addCoupon(page, testCoupon({ code: "TEKSEFER", perUserLimit: 1 }));
    await cartWithProduct(page);
    await applyCoupon(page, "TEKSEFER");
    await expect(page.getByTestId("coupon-row")).toBeVisible();

    await page.goto("/odeme");
    const main = page.locator("main");
    await expect(page.getByTestId("coupon-row")).toContainText("Kupon (TEKSEFER)");
    const tc = page.locator("input[maxlength='11']").first();
    if (await tc.count()) await tc.fill(TEST_TC);
    await page.fill("input[autocomplete=cc-name]", "Deneme Kişi");
    await page.fill("input[autocomplete=cc-number]", card);
    await page.fill("input[autocomplete=cc-exp]", expiry);
    await page.fill("input[autocomplete=cc-csc]", "123");
    await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
    await page.locator("button:has-text('Öde')").last().click();

    await expect(page).toHaveURL(/\/hesabim\/siparislerim\/SIP-\d{4}-\d{5}/, { timeout: 15_000 });
    await expect(main).toContainText("Kupon (TEKSEFER)");

    const db = await readDb(page);
    const order = db.orders.find((o) => o.coupon?.code === "TEKSEFER")!;
    expect(order.coupon!.discount).toBe(Math.round(order.subtotal * 0.1));
    expect(order.total).toBe(order.subtotal - order.coupon!.discount + order.shipping + order.installmentFee);
    expect(order.items.reduce((s, i) => s + (i.couponDiscount ?? 0), 0)).toBe(order.coupon!.discount);
    expect(db.couponRedemptions.filter((r) => r.orderId === order.id)).toHaveLength(1);

    // Aynı üye kuponu ikinci kez kullanamaz.
    await cartWithProduct(page);
    await applyCoupon(page, "TEKSEFER");
    await expect(page.locator("main")).toContainText("Bu kuponu kullanım hakkınız dolmuş.");
    expect(problems).toEqual([]);
  });

  test("kişiye özel kupon yalnızca tanımlı e-postadaki üyeye uygulanır", async ({ page, problems }) => {
    const email = demoAccount("Bireysel").email;
    await page.goto("/");
    await addCoupon(page, testCoupon({ code: "BASKASINA", audience: "customers", customerEmails: ["baska@firma.com"] }));
    await addCoupon(page, testCoupon({ code: "SANAOZEL", audience: "customers", customerEmails: [email.toUpperCase()] }));
    await cartWithProduct(page);

    await applyCoupon(page, "BASKASINA");
    await expect(page.locator("main")).toContainText("Bu kupon hesabınıza tanımlı değil.");
    await applyCoupon(page, "sanaozel");
    await expect(page.getByTestId("coupon-row")).toContainText("Kupon (SANAOZEL)");
    expect(problems).toEqual([]);
  });
});
