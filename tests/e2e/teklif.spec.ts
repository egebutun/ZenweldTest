import type { Page } from "@playwright/test";
import { SESSION, TEST_PHOTO, addTestOptions, changeDb, expect, readDb, test } from "./yardimci";

/**
 * TEKLIF AL VE KAYIT NUMARASI (docs/IS-KURALLARI.md › 8 ve 17, KARARLAR K-64, K-79)
 *
 * Yonetici oturumuyla acilir: site ziyaretci olarak kullanilir (site
 * uyeligi yok), panel ayni tarayici verisini gorur.
 */
test.use({ storageState: SESSION.admin });

/** 1. adimi doldurup 2. adima (Urunler) gecer. */
async function toProducts(page: Page): Promise<void> {
  const inputs = page.locator("main input");
  await inputs.nth(0).fill("Deneme Firma");
  await inputs.nth(1).fill("Deneme Kişi");
  await inputs.nth(3).fill("deneme@ornek.com");
  await inputs.nth(4).fill("05551112233");
  await page.getByRole("button", { name: "İleri" }).click();
}

/** Teklif Al urun listesinden grup, tur ve model secer. */
async function pickModel(page: Page, group: RegExp, category: RegExp, model: string): Promise<void> {
  await page.getByRole("tab", { name: group }).click();
  await page.getByRole("button", { name: category }).click();
  await page.getByRole("button", { name: model }).click();
}

async function sendQuote(page: Page): Promise<string> {
  await page.goto("/teklif-al");
  await toProducts(page);
  await pickModel(page, /^Kaynak Makineleri/, /^MMA/, "Ultimate 255 MMA Elektrod Kaynak Makinesi");
  await page.getByRole("button", { name: "Teklif Listesine Ekle" }).click();
  await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "Teklif Talebini Gönder" }).click();
  await expect(page.locator("main")).toContainText("Teklif talebiniz alındı");
  const code = (await page.locator("main").innerText()).match(/TKL-\d{4}-\d{4}/)?.[0];
  expect(code).toBeTruthy();
  return code!;
}

test("teklif gönderilir; en son teklif silinse de numarası yeniden verilmez", async ({ page, problems }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const first = await sendQuote(page);

  await page.goto("/yonetim/teklifler");
  await page.getByText(first, { exact: true }).first().click();
  await page.getByRole("button", { name: "Sil" }).first().click();
  await expect(page.getByText(first, { exact: true })).toHaveCount(0);

  const second = await sendQuote(page);
  const number = (code: string) => Number(code.split("-").at(-1));
  expect(number(second)).toBe(number(first) + 1);
  expect(problems).toEqual([]);
});

test("ürün eklenmeden teklif gönderilmez", async ({ page }) => {
  await page.goto("/teklif-al");
  await toProducts(page);
  await expect(page.locator("main")).toContainText("Teklif listeniz boş. Yukarıdan model seçip listeye ekleyin.");
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "Teklif Talebini Gönder" }).click();
  await expect(page.locator("main")).toContainText("Teklif listeniz boş");
  await expect(page.locator("main")).not.toContainText("Teklif talebiniz alındı");
});

test("seçenekli modelde seçenek seçilir; fotoğraf ve kod seçime göre değişir", async ({ page, problems }) => {
  // Urunlerin gercek secenekleri degil, deneme secenekleri (yardimci.ts).
  const slug = "ultimate-255-mma";
  await page.goto("/teklif-al");
  await addTestOptions(page, slug);
  const name = (await readDb(page)).products.find((p) => p.slug === slug)!.name;
  await toProducts(page);
  await pickModel(page, /^Kaynak Makineleri/, /^MMA/, name);

  const panel = page.getByRole("region", { name: "Seçilen model" });
  const photo = panel.locator("img").first();
  await expect(panel).toContainText("ZW-E2E-H3");
  await expect(photo).toHaveAttribute("src", TEST_PHOTO.hava);

  // Su · 3 m satilmiyor: Su secilince Su · 4 m'ye gecilir.
  await panel.getByRole("button", { name: "Su Soğutmalı", exact: true }).click();
  await expect(panel).toContainText("ZW-E2E-S4");
  await expect(photo).toHaveAttribute("src", TEST_PHOTO.su);

  await panel.getByRole("button", { name: "Artır" }).click();
  await panel.getByRole("button", { name: "Teklif Listesine Ekle" }).click();
  await expect(panel).toContainText("Teklif listenize eklendi.");

  const line = page.locator("main li", { hasText: "ZW-E2E-S4" });
  await expect(line).toContainText("Deneme Soğutma: Su Soğutmalı · Deneme Uzunluk: 4 m");
  await expect(line.getByRole("spinbutton")).toHaveValue("2");
  await expect(line.locator("img")).toHaveAttribute("src", TEST_PHOTO.su);
  await expect(page.getByRole("button", { name: name })).toContainText("Listede");
  expect(problems).toEqual([]);
});

test("Teklif Al ürün listesinde Ekipmanlar'daki yayındaki ürünlerin hepsi var, başka bölümün ürünü yok", async ({ page, problems }) => {
  // KARARLAR K-79: bir ekipman Aksesuarlar'a tasininca listeden cikar.
  await page.goto("/teklif-al");
  await changeDb(page, (d) => {
    d.products.find((p) => p.slug === "ultimate-255-mma")!.section = "aksesuarlar";
  });
  const db = await readDb(page);
  const moved = db.products.find((p) => p.slug === "ultimate-255-mma")!;
  const equipment = db.products.filter((p) => p.active && p.section === "ekipmanlar");
  await toProducts(page);

  // Gruplardaki model sayilarinin toplami = Ekipmanlar'daki yayindaki urunler.
  const counts = await page.getByRole("tab").allInnerTexts();
  const total = counts.reduce((n, text) => n + Number(text.match(/(\d+) model/)?.[1] ?? 0), 0);
  expect(total).toBe(equipment.length);

  await page.getByRole("tab", { name: /^Kaynak Makineleri/ }).click();
  await page.getByRole("button", { name: /^MMA/ }).click();
  await expect(page.getByRole("button", { name: moved.name })).toHaveCount(0);
  for (const p of equipment.filter((e) => e.categorySlug === moved.categorySlug)) {
    await expect(page.getByRole("button", { name: p.name })).toBeVisible();
  }
  expect(problems).toEqual([]);
});
