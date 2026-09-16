# Veri Ekleme ve Düzenleme Rehberi

Veriler iki yerden yönetilebilir:

1. **Yönetim panelinden** (geçici — yalnızca o tarayıcıda) → `docs/ADMIN-KULLANIM.md`
2. **Seed dosyalarından** (kalıcı — herkeste görünür) → bu doküman

---

## Seed dosyaları

| Dosya | İçerik |
|---|---|
| `packages/data/src/seed/products.seed.ts` | Ürünler |
| `packages/data/src/seed/categories.seed.ts` | Bölüm / grup / kategori ağacı |
| `packages/data/src/seed/dealers.seed.ts` | Fiziksel bayiler |
| `packages/data/src/seed/retailers.seed.ts` | Online satıcılar |
| `packages/data/src/seed/stock.seed.ts` | Ürün × satıcı stok matrisi |
| `packages/data/src/seed/users.seed.ts` | Demo hesaplar |
| `packages/data/src/seed/content.seed.ts` | Blog, SSS, teklif, sipariş, garanti |
| `packages/data/src/seed/images.ts` | Görsel havuzu |

Seed dosyasını değiştirdikten sonra `packages/data/src/index.ts` içindeki
`DB_VERSION` değerini **bir artırın**. Aksi halde tarayıcıdaki eski veri
kullanılmaya devam eder.

---

## Yeni ürün ekleme

`products.seed.ts` içindeki `products` dizisine yeni bir nesne ekleyin:

```ts
{
  id: "p-yeni-model",              // benzersiz
  slug: "yeni-model",              // /urun/yeni-model
  sku: "ZW-YENI",
  name: "Zenweld Yeni Model 300",
  modelCode: "Z05.03.00",
  section: "ekipmanlar",           // ekipmanlar | guvenlik | aksesuarlar | dolgu-metalleri
  categorySlug: "mig-gmaw",        // categories.seed.ts içindeki bir slug
  processes: ["MIG", "MAG"],
  shortDescription: { tr: "…", en: "…" },
  description: { tr: "…", en: "…" },
  priceExVat: 52000,               // KDV hariç
  vatRate: 20,
  currency: "TRY",
  images: [{ url: stockPhotos.weldingSparks, alt: { tr: "…", en: "…" } }],
  specs: [
    { label: { tr: "Kaynak Akımı", en: "Welding Current" },
      value: { tr: "30 – 300 A", en: "30 – 300 A" } },
  ],
  inTheBox: [{ tr: "1 x Ana Ünite", en: "1 x Power Source" }],
  highlights: [{ tr: "…", en: "…" }],
  inStock: true,
  quotable: true,      // Teklif Al akışında seçilebilsin mi
  featured: false,     // Anasayfada öne çıksın mı
  isNew: true,
  warrantyMonths: 24,
  createdAt: now,
  updatedAt: now,
  active: true,
}
```

`stock.seed.ts` stok kayıtlarını ürün listesinden **otomatik üretir**, ayrıca bir
şey yapmanız gerekmez. Belirli bir ürün–satıcı eşleşmesini elle sabitlemek
isterseniz dosyanın sonuna ekleyebilirsiniz:

```ts
retailerStock.push({
  productId: "p-yeni-model",
  retailerId: "r-basak-hirdavat",
  inStock: true,
  quantity: 5,
  price: 62400,
  productUrl: "https://www.basakhirdavat.com/urun/yeni-model",
  updatedAt: STAMP,
});
```

---

## Yeni online satıcı ekleme

`retailers.seed.ts`:

```ts
{
  id: "r-yeni-satici",
  name: "Yeni Satıcı A.Ş.",
  websiteUrl: "https://www.yenisatici.com/",
  logoText: "YENİ SATICI",        // ürün sayfasındaki kutuda görünen yazı
  isOwnStore: false,               // bizim bayi mağazamız mı
  city: "İstanbul",
  active: true,
}
```

Satıcı eklendikten sonra stok matrisinden hangi ürünlerde stokta olduğunu
işaretleyin; aksi halde hiçbir ürün sayfasında görünmez.

---

## Yeni bayi ekleme

`dealers.seed.ts`:

```ts
{
  id: "d-yeni-bayi",
  name: "Yeni Bayi Kaynak",
  city: "İzmir",
  district: "Bornova",
  address: "…",
  phone: "+90 232 000 00 00",
  whatsapp: "+90 5xx xxx xx xx",   // opsiyonel
  lat: 38.4696,                    // Google Maps'ten kopyalayın
  lng: 27.2168,
  badges: ["yetkili-satici", "yetkili-servis"],
  workingHours: { tr: "…", en: "…" },
  retailerId: "r-yeni-satici",     // online mağazası varsa
  active: true,
}
```

---

## Yeni bir bayi mağazası (ikinci kopya) oluşturma

1. `apps/bayi-shop` klasörünü kopyalayın (örn. `apps/bayi-shop-b`)
2. `package.json` içindeki `name` ve port numarasını değiştirin
3. `src/lib/store-config.ts` içindeki `retailerId`, `dealerId`, ad, telefon,
   adres bilgilerini güncelleyin
4. Kök `package.json` içine yeni bir `dev:` komutu ekleyin

---

## Metinleri değiştirme

Arayüz metinleri: `packages/i18n/src/dictionaries.ts` (TR ve EN birlikte).
Lorem ipsum içerikli sayfalar: ilgili `page.tsx` dosyaları ve
`apps/zenweld-web/src/components/common/PageShell.tsx` içindeki `LOREM` sabiti.
