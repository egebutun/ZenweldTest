import type { Page } from "@playwright/test";
import { closeDatabase, expect, registerMember, sql, test } from "./yardimci";

/**
 * UYENIN ADRESLERI VE FAVORILERI VERITABANINDA (Asama 5.1; KARARLAR K-96)
 *
 * Giris yapmis uyenin adresleri ve favorileri sunucudadir; baska cihazda da
 * gorunur. Misafirin favorileri tarayicida durur ve giriste hesaba eklenir.
 * (Odeme sayfasinin kayitli adresi sunucudan almasi veritabani.spec.ts'deki
 * satin alma testinde denenir.)
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const PASSWORD = "uzun-sifre-1";
const CATEGORY = "/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri";
const STORAGE_KEY = "zenweld.favourites.v1";
const newEmail = (name: string) => `${name}-${Date.now()}@ornek.com`;

async function loginViaForm(page: Page, email: string) {
  await page.goto("/giris");
  // Yalnizca sayfanin formu: alt bilgideki bulten kutusu da e-posta alanidir.
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(PASSWORD);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/hesabim/);
}

const heading = (page: Page, title: string) => page.getByRole("heading", { name: title, exact: true });
/** Adres karti: basligin iki ust kutusu. */
const card = (page: Page, title: string) => heading(page, title).locator("xpath=../..");

async function addAddress(page: Page, title: string, city: string) {
  await page.getByRole("button", { name: "Yeni Adres Ekle" }).click();
  const form = page.locator("main form");
  const fields = form.locator("input, textarea");
  // Sira: Ad Soyad, Telefon, Sehir, Ilce, Acik adres, Adres basligi
  await fields.nth(0).fill("Deneme Üye");
  await fields.nth(1).fill("05551112233");
  await fields.nth(2).fill(city);
  await fields.nth(3).fill("Merkez");
  await fields.nth(4).fill("Örnek Cad. No:1");
  await fields.nth(5).fill(title);
  await form.getByRole("button", { name: "Kaydet" }).click();
  await expect(heading(page, title)).toBeVisible();
}

const addressesOf = (email: string) =>
  sql<{ title: string; is_default: boolean }>(
    `SELECT a.title, a.is_default FROM addresses a JOIN users u ON u.id = a.user_id
      WHERE u.email = $1 ORDER BY a.created_at`,
    [email],
  );

const favouriteCount = async (email: string) =>
  (
    await sql<{ n: number }>(
      "SELECT count(*)::int AS n FROM favourites f JOIN users u ON u.id = f.user_id WHERE u.email = $1",
      [email],
    )
  )[0].n;

test("adresler sunucuda: eklenir, varsayılan değişir, silinir; başka cihazda aynı liste", async ({ page, browser, problems }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const email = newEmail("adres");
  await registerMember(page.request, email, PASSWORD);

  await page.goto("/hesabim/adreslerim");
  await expect(page.locator("main")).toContainText("Kayıtlı adres yok");
  await addAddress(page, "Ev", "Konya");
  await addAddress(page, "İş", "Ankara");
  expect(await addressesOf(email)).toEqual([
    { title: "Ev", is_default: true },
    { title: "İş", is_default: false },
  ]);

  await card(page, "İş").getByRole("button", { name: "Varsayılan yap" }).click();
  await expect(card(page, "Ev").getByRole("button", { name: "Varsayılan yap" })).toBeVisible();
  await card(page, "Ev").getByRole("button", { name: "Sil" }).click();
  await expect(heading(page, "Ev")).toHaveCount(0);
  expect(await addressesOf(email)).toEqual([{ title: "İş", is_default: true }]);

  // Ayni hesap baska tarayicida: ayni adresler.
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await loginViaForm(second, email);
    await second.goto("/hesabim/adreslerim");
    await expect(heading(second, "İş")).toBeVisible();
    await expect(card(second, "İş")).toContainText("Ankara");
    await expect(heading(second, "Ev")).toHaveCount(0);
  } finally {
    await other.close();
  }
  expect(problems).toEqual([]);
});

test("favoriler: misafirinkiler girişte hesaba eklenir; her cihazda aynı; çıkışta kalpler boş", async ({ page, browser }) => {
  const email = newEmail("favori");
  await registerMember(page.request, email, PASSWORD);
  await page.request.post("/api/uyelik/cikis", { data: {} });

  // Misafir iki urunu favoriye ekler: tarayicida durur.
  await page.goto(CATEGORY);
  const hearts = page.getByRole("button", { name: "Favori", exact: true });
  await hearts.nth(0).click();
  await hearts.nth(1).click();
  const stored = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length as number, STORAGE_KEY);
  await expect.poll(stored).toBe(2);

  // Giriste hesaba eklenir, tarayicidan silinir.
  await loginViaForm(page, email);
  await expect.poll(() => favouriteCount(email)).toBe(2);
  await expect.poll(stored).toBe(0);
  await page.goto("/hesabim/favorilerim");
  await expect(page.getByRole("button", { name: "Favori", exact: true })).toHaveCount(2);

  // Baska tarayicida ayni liste; orada cikarilan favori hesaptan da gider.
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await loginViaForm(second, email);
    await second.goto("/hesabim/favorilerim");
    const cards = second.getByRole("button", { name: "Favori", exact: true });
    await expect(cards).toHaveCount(2);
    await cards.first().click();
    await expect(cards).toHaveCount(1);
  } finally {
    await other.close();
  }
  await expect.poll(() => favouriteCount(email)).toBe(1);
  await page.reload();
  await expect(page.getByRole("button", { name: "Favori", exact: true })).toHaveCount(1);

  // Cikista kalpler bos; favori hesapta kalir.
  await page.goto("/cikis");
  await expect(page).toHaveURL(/\/$/);
  await page.goto(CATEGORY);
  await expect(page.getByRole("button", { name: "Favori", exact: true }).first()).toBeVisible();
  await expect(page.locator("main svg.fill-zw-red-600")).toHaveCount(0);
  expect(await favouriteCount(email)).toBe(1);
});
