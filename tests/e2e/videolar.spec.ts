import { SESSION, expect, field, test } from "./yardimci";

/**
 * PANEL › VIDEOLAR (demo modu; docs/ADMIN-KULLANIM.md › Videolar, KARARLAR
 * K-125)
 *
 * Video kütüphanesi: video eklenir, düzenlenir (ürün, anasayfada göster),
 * sıralanır, silinir; aynı video ve bozuk link kaydedilmez; bölüm başlığı
 * ayrı kaydedilir. Anasayfa kütüphaneden okur. Veritabanı modundaki hali:
 * tests/e2e-db/panel-videolar.spec.ts.
 */
test.use({ storageState: SESSION.admin });

test("video kütüphanesi: ekleme, düzenleme, sıra, silme, bölüm başlığı; anasayfada ürün adı ürün sayfasına gider", async ({ page, problems }) => {
  await page.goto("/yonetim/videolar");
  await expect(page.getByRole("heading", { level: 1, name: "Videolar" })).toBeVisible();
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(5);

  // Bolum basligi
  await field(page, "Anasayfa bölüm başlığı").fill("Sahada Zenweld");
  await page.getByRole("button", { name: "Başlığı Kaydet" }).click();
  await expect(page.getByText("Bölüm başlığı kaydedildi.")).toBeVisible();

  // 1. videoya urun; 5. video anasayfadan cikarilir
  await page.getByRole("button", { name: "1. videoyu düzenle" }).click();
  await field(page, "Ürün").selectOption({ label: "ForceArc 200 MMA Elektrot Kaynak Makinesi" });
  await page.getByLabel("Ürün sayfasında göster").check();
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows.first()).toContainText("ForceArc 200 MMA Elektrot Kaynak Makinesi");
  await page.getByRole("button", { name: "5. videoyu düzenle" }).click();
  await page.getByLabel("Anasayfada göster").uncheck();
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows.nth(4).getByText("Anasayfada")).toHaveCount(0);

  // Yeni video: bozuk link ve ayni video kaydedilmez
  await page.getByRole("button", { name: "Yeni Video" }).click();
  await field(page, "YouTube linki").fill("https://vimeo.com/1");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText(/YouTube linki okunamadı/)).toBeVisible();
  await field(page, "YouTube linki").fill("https://youtu.be/9CAoUSHs0R4");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Bu YouTube videosu kütüphanede zaten var.")).toBeVisible();
  await field(page, "YouTube linki").fill("https://www.youtube.com/shorts/abcdefghijk");
  await field(page, "Başlık").fill("Yeni çekim");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(rows).toHaveCount(6);
  await expect(rows.last()).toContainText("Yeni çekim");

  // Sira ve silme
  await page.getByRole("button", { name: "6. videoyu yukarı taşı" }).click();
  await expect(rows.nth(4)).toContainText("Yeni çekim");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "5. videoyu sil" }).click();
  await expect(rows).toHaveCount(5);

  // Anasayfa: baslik; kategori sekmeleri ("Tümü" yok, ilk sekme secili): MMA (1. video) ve
  // urunsuzlerin "Genel" sekmesi (5. anasayfada degil, 1 silindi: 3 video).
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(page.getByRole("heading", { level: 2, name: "Sahada Zenweld" })).toBeVisible();
  const tabs = page.getByRole("tablist", { name: "Video kategorileri" }).getByRole("tab");
  await expect(tabs).toHaveText(["MMA (Stick) Örtülü Elektrot", "Genel"]);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Tümü" })).toHaveCount(0);
  await expect(videos.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  await expect(page.getByRole("link", { name: /Tüm videolar/ })).toHaveAttribute("href", "/videolar?kategori=mma-ortulu-elektrod-kaynak-makineleri");
  await tabs.nth(1).click();
  await expect(page.getByRole("button", { name: /^\d\. videoyu göster$/ })).toHaveCount(3 + 2);
  await expect(page.getByRole("link", { name: /Tüm videolar/ })).toHaveAttribute("href", "/videolar?kategori=genel");

  // Urun sayfasinda: "Ürün sayfasında göster" isaretli video fotograflarin yaninda; Oynat'a basinca oynatici acilir.
  await page.goto("/urun/forcearc-200-mma");
  await page.getByRole("button", { name: "1. videoyu göster" }).click();
  await page.getByRole("button", { name: "1. videoyu oynat" }).click();
  await expect(page.locator("iframe[src*='youtube-nocookie.com/embed/QtZ7JdNzFVo']")).toHaveCount(1);

  // Videolar sayfasi: anasayfadaki gibi kategori sekmeleri; secili kategori adreste; digerleri gizli.
  await page.goto("/videolar");
  await expect(page.getByRole("heading", { level: 1, name: "Videolar" })).toBeVisible();
  const libraryTabs = page.getByRole("tablist", { name: "Video kategorileri" }).getByRole("tab");
  await expect(libraryTabs).toHaveText(["MMA (Stick) Örtülü Elektrot", "Genel"]);
  await expect(libraryTabs.first()).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel");
  await expect(panel).toHaveCount(1);
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText("MMA (Stick) Örtülü Elektrot Kaynak Makineleri· 1 video");
  await expect(panel.getByRole("link", { name: "ForceArc 200 MMA Elektrot Kaynak Makinesi" })).toHaveAttribute("href", "/urun/forcearc-200-mma");
  await expect(panel.getByRole("link", { name: /^Tüm MMA \(Stick\) Örtülü Elektrot Kaynak Makineleri/ })).toHaveAttribute(
    "href",
    "/ekipmanlar/kaynak-makineleri/mma-ortulu-elektrod-kaynak-makineleri",
  );
  await libraryTabs.nth(1).click();
  await expect(page).toHaveURL(/\/videolar\?kategori=genel$/);
  await expect(page.getByRole("tabpanel").getByRole("heading", { level: 2 })).toHaveText("Genel· 4 video"); // anasayfadan cikarilan video burada da var
  // Adresle acilinca o sekme secili gelir.
  await page.goto("/videolar?kategori=genel");
  await expect(libraryTabs.nth(1)).toHaveAttribute("aria-selected", "true");
  expect(problems).toEqual([]);
});
