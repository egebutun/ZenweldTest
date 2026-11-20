import type { Page } from "@playwright/test";
import { changeDb, expect, readDb, test } from "./yardimci";

/**
 * ANASAYFA (demo modu; docs/WEBSITE-KULLANIM.md › 3, KARARLAR K-47)
 *
 * Tanitim alaninin uc sayfasi, sabit guven seridi, kategori kartlari, Force /
 * Jasic seritleri ve bolum sirasi. Veritabani modundaki hali:
 * tests/e2e-db/anasayfa.spec.ts.
 */
test.use({ viewport: { width: 1440, height: 900 } });

const section = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });

test("tanıtım alanı: üç sayfa; sekme ve oklar değiştirir; fare dışarıdayken kendiliğinden döner", async ({ page, problems }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zenweld Kaynak Makineleri ve Plazma Kesme Sistemleri");

  const hero = page.locator('section[aria-roledescription="carousel"]');
  const slides = hero.locator('[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(3);
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(0).getByRole("link", { name: /Ürünleri Keşfet/ })).toHaveAttribute("href", "/ekipmanlar");

  // Genis ekranda kirmizi ust baslik (sekme adi) gorunmez; ayni ad alttaki sekmede yazar.
  await expect(slides.nth(0).getByText("Zenweld", { exact: true })).toBeHidden();

  await hero.getByRole("button", { name: "Force Serisi" }).click();
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "true");
  await expect(slides.nth(1).getByRole("link", { name: /Force Serisini İncele/ })).toHaveAttribute("href", "/force");
  await expect(slides.nth(1).getByText("ForceMIG", { exact: true })).toHaveCount(0);

  await hero.getByRole("button", { name: "Sonraki" }).click();
  await expect(slides.nth(2)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(2).getByRole("link", { name: /Lazer Makinelerini İncele/ })).toHaveAttribute(
    "href",
    "/ekipmanlar/lazer-makineleri",
  );
  await hero.getByRole("button", { name: "Sonraki" }).click();
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");

  // Fare tanitim alanindan cikinca 7 saniye sonra sonraki sayfa gelir.
  await page.mouse.move(700, 890);
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false", { timeout: 10_000 });
  expect(problems).toEqual([]);
});

test("telefonda tanıtım alanının kırmızı üst başlığı (sekme adı) görünür; sekmelerde yazı yok", async ({ page, problems }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const slide = page.locator('[aria-roledescription="slide"]').first();
  await expect(slide.getByText("Zenweld", { exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});

/** Guven seridinin sabit yazilari (deger + aciklama, aralarinda bosluk yok). */
const TRUST = [
  "29+Yetkili bayi ve servis noktası",
  "25Şehirde satış ve servis",
  "+12 ayOnline kayıtla ücretsiz garanti uzatma",
  "12 taksitKredi kartına taksit",
  "₺5.000Üzeri siparişlerde ücretsiz kargo",
  "14 günİade hakkı",
  "Havale & Kredi Kartı & Vadeli & ÇekÖdeme seçenekleri",
  "2 ofisİstanbul · İzmir",
];

test("güven şeridi sabit yazıdır; bayi ve mağaza ayarı değişse de aynı kalır", async ({ page, problems }) => {
  await page.goto("/");
  const trust = page.getByRole("region", { name: "Neden güvenle alışveriş" }).locator("ul").first();
  for (const text of TRUST) await expect(trust).toContainText(text);
  await expect(trust).not.toContainText("Bireysel");
  await expect(trust).not.toContainText("Kurumsal");

  await changeDb(page, (db) => {
    db.dealers = db.dealers.slice(0, 3);
    db.settings.shop.freeShippingThreshold = 7500;
    db.settings.company.offices = db.settings.company.offices.slice(0, 1);
  });
  for (const text of TRUST) await expect(trust).toContainText(text);
  expect(problems).toEqual([]);
});

test("bölüm sırası, kategori kartları, Force ve Jasic şeritleri", async ({ page, problems }) => {
  await page.goto("/");
  const db = await readDb(page);

  // Bolum sirasi (KARARLAR K-47); seritler veri gelince cizilir
  await expect(page.getByRole("heading", { level: 2, name: "Kampanyalı Ürünler" })).toBeVisible();
  const titles = await page.locator("main h2").allTextContents();
  const order = [
    "Ne arıyorsunuz?",
    "Force Serisi",
    "Jasic Lazer Ürünleri",
    "Kampanyalı Ürünler",
    "Hangi kaynak makinesi size uygun?",
    "Size En Yakın Zenweld Bayi ve Yetkili Servisini Bulun",
    "Gerçek İşler, Gerçek Kaynak",
  ];
  const at = order.map((title) => titles.indexOf(title));
  expect(at.every((i) => i >= 0), titles.join(" | ")).toBe(true);
  expect(at).toEqual([...at].sort((a, b) => a - b));
  expect(titles).toContain("Blog");

  // Ekipmanlar'in kategorileri ve diger uc bolum; kartlarda sira numarasi yok
  const cards = section(page, "Ne arıyorsunuz?");
  await expect(cards.getByText("01", { exact: true })).toHaveCount(0);
  const equipment = db.categories.filter((c) => c.section === "ekipmanlar");
  for (const c of equipment) {
    await expect(cards.getByRole("link", { name: new RegExp(c.name.replace(/[()]/g, "\\$&")) })).toHaveAttribute(
      "href",
      `/ekipmanlar/${c.group}/${c.slug}`,
    );
  }
  for (const [name, href] of [["Güvenlik", "/guvenlik"], ["Aksesuarlar", "/aksesuarlar"], ["Dolgu Metalleri", "/dolgu-metalleri"]]) {
    await expect(cards.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", href);
  }

  const active = db.products.filter((p) => p.active);
  const force = active.filter((p) => p.filterValues?.["model-serisi"]?.includes("force"));
  const jasic = active.filter((p) => p.brand === "Jasic");
  expect(force.length).toBeGreaterThan(0);
  expect(jasic.length).toBeGreaterThan(0);
  for (const p of force) await expect(section(page, "Force Serisi")).toContainText(p.name);
  for (const p of jasic) await expect(section(page, "Jasic Lazer Ürünleri")).toContainText(p.name);

  expect(problems).toEqual([]);
});

test("bayi haritası yakınlaşırken sayfadan çıkılınca hata vermez", async ({ page, problems }) => {
  for (let i = 0; i < 3; i++) {
    await page.goto("/");
    // Harita acilinca bayileri cercevelemek icin yakinlasir; Leaflet bu sirada leaflet-zoom-anim ekler.
    await page.locator(".leaflet-zoom-anim").waitFor({ state: "attached" });
    await page.locator("header nav").getByRole("link", { name: "FORCE" }).click();
    await expect(page).toHaveURL(/\/force$/);
    // Leaflet yakinlasmayi 250 ms sonra bitirmeye calisir; harita kaldirildiysa hata vermemeli.
    await page.waitForTimeout(400);
  }
  expect(problems).toEqual([]);
});

test("videolar: bayi bulucunun altında; açılışta oynatıcı yüklenmez, Oynat'a basınca çerezsiz YouTube açılır; oklar ve noktalar (K-125)", async ({
  page,
  problems,
}) => {
  await page.goto("/");
  const videos = page.getByRole("region", { name: "Videolar" });
  await expect(section(page, "Gerçek İşler, Gerçek Kaynak")).toBeVisible();
  // 5 nokta; yandaki kartlar da tiklaninca ortaya gelir.
  await expect(page.getByRole("button", { name: /^\d\. videoyu göster$/ })).toHaveCount(5 + 4);
  await expect(page.locator("iframe")).toHaveCount(0);

  // Ortadaki kart 1. video; sonraki ok 2. videoyu ortaya alir.
  await expect(videos.getByRole("button", { name: "1. videoyu oynat" })).toBeVisible();
  await page.getByRole("button", { name: "Sonraki video" }).click();
  await expect(videos.getByRole("button", { name: "2. videoyu oynat" })).toBeVisible();
  await page.getByRole("button", { name: "Önceki video" }).click();

  await videos.getByRole("button", { name: "1. videoyu oynat" }).click();
  const player = videos.locator("iframe");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/QtZ7JdNzFVo\?autoplay=1/);

  // Baska videoya gecilince oynatici kapanir.
  await page.getByRole("button", { name: "Sonraki video" }).click();
  await expect(videos.locator("iframe")).toHaveCount(0);
  expect(problems).toEqual([]);
});
