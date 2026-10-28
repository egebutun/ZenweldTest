import { SESSION, expect, readDb, test } from "./yardimci";

/**
 * KATEGORI FILTRELERI (docs/IS-KURALLARI.md › 19, KABUL-KONTROL-LISTESI › 4 ve 17)
 *
 * Ornek veride MIG'de Model Serisi esli (Ultimate 6, Evomig 3); Çalışma
 * Modu ve Fiziki Yapı eslenmemis. Yonetici tabloda Evomig 405 P'ye
 * Kompakt isaretler; sitede Kompakt secilince yalnizca o urun kalir.
 */
test.use({ storageState: SESSION.admin });

const MIG = "/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri";

test("kategori filtresi seçilir, adrese yazılır; panelden eşlenen değer sitede çalışır", async ({ page, problems }) => {
  await page.goto(MIG);
  const filters = page.locator("aside");
  const count = filters.getByText(/^\d+ ürün$/);
  await expect(count).toHaveText("9 ürün");

  // Model Serisi esli: Evomig secilince 3 urun kalir, secim adrese yazilir.
  await filters.getByLabel("Evomig").check();
  await expect(count).toHaveText("3 ürün");
  await expect(page).toHaveURL(/\?model-serisi=evomig$/);

  // Eslenmemis filtre sonucu daraltmaz.
  await filters.getByLabel("Puls").check();
  await expect(count).toHaveText("3 ürün");
  await expect(page).toHaveURL(/calisma-modu=puls/);

  // Panel: kategorinin Filtreler sekmesindeki tabloda Kompakt isaretlenir.
  const db = await readDb(page);
  const category = db.categories.find((c) => c.slug === "mig-gazalti-kaynak-makineleri")!;
  await page.goto(`/yonetim/kategoriler/${category.id}`);
  await page.getByRole("button", { name: /^Filtreler/ }).click();
  await page.getByLabel("Evomig 405 P MIG Gazaltı Kaynak Makinesi: Fiziki Yapı Kompakt").check();
  await page.getByRole("button", { name: "Değişiklikleri Kaydet" }).click();
  await expect(page.getByText("Kategori kaydedildi.")).toBeVisible();

  // Site: adresle acilan secim; artik esli olan Fiziki Yapı sonucu daraltir.
  await page.goto(`${MIG}?fiziki-yapi=kompakt`);
  await expect(filters.getByLabel("Kompakt")).toBeChecked();
  await expect(count).toHaveText("1 ürün");
  await expect(page.locator("main")).toContainText("Evomig 405 P MIG Gazaltı Kaynak Makinesi");

  // Bos sonuc ve temizleme.
  await page.goto(`${MIG}?fiziki-yapi=kompakt&model-serisi=ultimate`);
  await expect(page.getByText("Seçtiğiniz filtrelere uyan ürün yok.")).toBeVisible();
  await page.getByRole("button", { name: "Filtreleri Temizle" }).last().click();
  await expect(count).toHaveText("9 ürün");
  await expect(page).toHaveURL(new RegExp(`${MIG}$`));
  expect(problems).toEqual([]);
});
