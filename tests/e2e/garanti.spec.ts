import { changeDb, expect, readDb, test } from "./yardimci";

/**
 * GARANTI SORGULAMA (docs/IS-KURALLARI.md › 10)
 *
 * Bitis gunu dahil garanti gecerlidir; ertesi gun "Süresi Doldu".
 */
test("garanti bitiş günü dahil geçerli, ertesi gün süresi dolmuş", async ({ page, problems }) => {
  await page.goto("/garanti/sorgulama");
  const { warranties } = await readDb(page);
  const serial = warranties[0].serialNumber;
  // Tarih tarayicinin yerel saatine gore (Turkiye).
  const [today, yesterday] = await page.evaluate(() => {
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const now = new Date();
    return [key(now), key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))];
  });

  const check = async (expiresAt: string) => {
    await changeDb(page, (db) => {
      db.warranties[0].expiresAt = expiresAt;
    });
    await page.getByPlaceholder("ZW250-2026-000000").fill(serial);
    await page.getByRole("button", { name: "Sorgula", exact: true }).click();
    await expect(page.locator("main")).toContainText(serial);
  };

  await check(today);
  await expect(page.getByText("Süresi Doldu")).toHaveCount(0);

  await check(yesterday);
  await expect(page.getByText("Süresi Doldu")).toBeVisible();
  expect(problems).toEqual([]);
});
