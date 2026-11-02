import type { Page } from "@playwright/test";
import { SESSION, changeDb, expect, readDb, test } from "./yardimci";

/**
 * TEKLIF AL VE KAYIT NUMARASI (docs/IS-KURALLARI.md › 8 ve 17, KARARLAR K-64)
 *
 * Yonetici oturumuyla acilir: site ziyaretci olarak kullanilir (site
 * uyeligi yok), panel ayni tarayici verisini gorur.
 */
test.use({ storageState: SESSION.admin });

async function fillContact(page: Page): Promise<void> {
  const inputs = page.locator("main input");
  await inputs.nth(0).fill("Deneme Firma");
  await inputs.nth(1).fill("Deneme Kişi");
  await inputs.nth(3).fill("deneme@ornek.com");
  await inputs.nth(4).fill("05551112233");
}

async function sendQuote(page: Page): Promise<string> {
  await page.goto("/teklif-al");
  await fillContact(page);
  await page.getByRole("button", { name: "İleri" }).click();
  const products = page.locator("main select").first();
  await products.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Ekle", exact: true }).click();
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
  await fillContact(page);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "İleri" }).click();
  await page.getByRole("button", { name: "Teklif Talebini Gönder" }).click();
  await expect(page.locator("main")).toContainText("Teklif listeniz boş");
  await expect(page.locator("main")).not.toContainText("Teklif talebiniz alındı");
});

test("listede Ekipmanlar'daki yayındaki ürünlerin hepsi var, başka bölümün ürünü yok", async ({ page, problems }) => {
  // KARARLAR K-79: bir ekipman Aksesuarlar'a tasininca listeden cikar.
  await page.goto("/teklif-al");
  await changeDb(page, (d) => {
    d.products.find((p) => p.slug === "ultimate-255-mma")!.section = "aksesuarlar";
  });
  const db = await readDb(page);
  const moved = db.products.find((p) => p.slug === "ultimate-255-mma")!;
  const equipment = db.products.filter((p) => p.active && p.section === "ekipmanlar");

  await fillContact(page);
  await page.getByRole("button", { name: "İleri" }).click();
  const choices = await page.locator("main select").first().locator("option").allInnerTexts();
  const listed = (name: string) => choices.some((c) => c.startsWith(`${name} (`) || c.startsWith(`${name} — `));
  expect(listed(moved.name)).toBe(false);
  for (const p of equipment) expect(listed(p.name), p.name).toBe(true);
  expect(problems).toEqual([]);
});
