import { SESSION, expect, readDb, test } from "./yardimci";

/**
 * BELGELER (MSDS) — panelden yukleme, sitede gosterme, acma ve indirme
 * (docs/ADMIN-KULLANIM.md › Belgeler, KABUL-KONTROL-LISTESI › 13)
 *
 * Dosyalar test sirasinda uretilir; depoda ornek dosya tutulmaz.
 */
test.use({ storageState: SESSION.admin });

const file = (name: string, mimeType: string, buffer: Buffer) => ({ name, mimeType, buffer });
const pdf = (name: string) =>
  file(name, "application/pdf", Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"));
const docx = file(
  "Kaynak-Rehberi.docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  Buffer.from("deneme"),
);

test("MSDS belgesi yüklenir, sitede görünür, açılır ve indirilir", async ({ page, problems }) => {
  const modal = page.locator(".fixed.inset-0").last();
  const openAdd = () => page.getByRole("button", { name: "Belge Ekle" }).click();
  const save = () => modal.getByRole("button", { name: "Kaydet" }).click();

  await page.goto("/yonetim/belgeler");
  await openAdd();
  await modal.locator("input[type=file]").setInputFiles(file("zararli.exe", "application/octet-stream", Buffer.from("x")));
  await save();
  await expect(modal).toContainText("Bu dosya türü yüklenemez (.exe)");
  await modal
    .locator("input[type=file]")
    .setInputFiles(file("cok-buyuk.pdf", "application/pdf", Buffer.alloc(26 * 1024 * 1024)));
  await save();
  await expect(modal).toContainText("25 MB'tan büyük");

  // Baslik dosya adindan gelir; urune baglanir.
  await modal.locator("input[type=file]").setInputFiles(pdf("ZW-SG2-MSDS.pdf"));
  const title = modal.locator("input:not([type=file]):not([type=checkbox])").first();
  await expect(title).toHaveValue("ZW-SG2-MSDS");
  await title.fill("SG2 Gazaltı Teli MSDS");
  const sg2 = (await readDb(page)).products.find((p) => /SG2/.test(p.name))!;
  await modal.locator("select").selectOption(sg2.id);
  await save();
  await expect(page.locator("body")).toContainText("MSDS (1)");

  // Ikinci belge: Word, yayinda.
  await openAdd();
  await modal.locator("input[type=file]").setInputFiles(docx);
  await save();
  await expect(page.locator("body")).toContainText("MSDS (2)");

  await page.goto("/msds");
  const main = page.locator("main");
  await expect(main).toContainText("SG2 Gazaltı Teli MSDS");
  await expect(main).toContainText(sg2.sku);
  await expect(main).toContainText("PDF");

  const [tab] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Görüntüle" }).click()]);
  await expect.poll(() => tab.url()).toMatch(/^blob:/);
  await tab.close();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("li", { hasText: "Kaynak-Rehberi" }).getByRole("button", { name: "İndir" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("Kaynak-Rehberi.docx");

  // Panelden silinen belge sitede gorunmez.
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/yonetim/belgeler");
  await page.locator("tr", { hasText: "Kaynak-Rehberi" }).getByTitle("Sil").click();
  await expect(page.locator("body")).toContainText("MSDS (1)");
  await page.goto("/msds");
  await expect(main).not.toContainText("Kaynak-Rehberi");
  expect(problems).toEqual([]);
});
