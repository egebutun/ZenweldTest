import { SESSION, changeDb, demoAccount, expect, readDb, test } from "./yardimci";

/**
 * IADE (CAYMA) TALEBI (docs/IS-KURALLARI.md › İade, KARARLAR K-65)
 *
 * Yonetici oturumuyla acilir, sitede bireysel uye olarak da giris yapilir;
 * site ve panel ayni tarayici verisini gorur.
 */
test.use({ storageState: SESSION.admin });

const DAY = 86_400_000;

test("bireysel üye iade talebi açar, yönetici onaylar", async ({ page, problems }) => {
  const { email, password } = demoAccount("Bireysel");
  await page.goto("/giris");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("form button[type=submit]");
  await expect(page).toHaveURL(/\/hesabim/);

  const db = await readDb(page);
  const member = db.users.find((u) => u.email === email)!;
  const order = db.orders.find((o) => o.userId === member.id && o.status === "delivered")!;
  const deliverAt = (msAgo: number) =>
    changeDb(page, (d) => {
      const o = d.orders.find((x) => x.id === order.id)!;
      const at = new Date(Date.now() - msAgo).toISOString();
      if (o.shipment) o.shipment.deliveredAt = at;
      o.history.filter((e) => e.status === "delivered").forEach((e) => (e.at = at));
    });

  // Teslimden 2 gun sonra: dugme gorunur.
  await page.goto(`/hesabim/siparislerim/${order.code}`);
  await deliverAt(2 * DAY);
  const main = page.locator("main");
  await page.getByRole("button", { name: "İade Talebi Oluştur" }).click();
  await page.getByRole("button", { name: "Talebi Gönder" }).click();
  await expect(main).toContainText("İade edilecek en az bir ürün seçin.");
  await page.getByLabel(/^İade adedi/).first().selectOption("1");
  await page.selectOption("#return-reason", "defective");
  await page.fill("#return-note", "Kutudan hasarlı çıktı.");
  await page.getByRole("button", { name: "Talebi Gönder" }).click();
  await expect(main).toContainText("İade talebiniz alındı");
  const code = (await main.innerText()).match(/IAD-\d{4}-\d{4}/)?.[0];
  expect(code).toBeTruthy();
  await expect(main).toContainText("Yeni");
  // Acik talep varken yeni talep acilmaz.
  await expect(page.getByRole("button", { name: "İade Talebi Oluştur" })).toHaveCount(0);

  // Panel: talep listede; onaylanir.
  await page.goto("/yonetim/iade-talepleri");
  await page.getByText(code!, { exact: true }).click();
  await expect(page.locator("body")).toContainText("Kutudan hasarlı çıktı.");
  await page.getByLabel("Durum").selectOption("approved");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator("body")).toContainText("Kaydedildi");

  // Musteri onayi gorur; kalan urunler icin yeniden talep acabilir.
  await page.goto(`/hesabim/siparislerim/${order.code}`);
  await expect(main).toContainText("Onaylandı");
  await expect(page.getByRole("button", { name: "İade Talebi Oluştur" })).toBeVisible();

  // 14 gun gecince dugme gorunmez.
  await deliverAt(15 * DAY);
  await expect(main).toContainText(order.code);
  await expect(page.getByRole("button", { name: "İade Talebi Oluştur" })).toHaveCount(0);

  // Kurumsal uyede dugme yok.
  await deliverAt(2 * DAY);
  await changeDb(page, (d) => {
    d.users.find((u) => u.id === member.id)!.role = "business";
  });
  await expect(main).toContainText(order.code);
  await expect(page.getByRole("button", { name: "İade Talebi Oluştur" })).toHaveCount(0);
  expect(problems).toEqual([]);
});
