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
| `packages/data/src/seed/stock.seed.ts` | Bayi ve satıcıların örnek stok listeleri |
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
  name: "Yeni Model 300",         // marka yazılmaz: sayfa başlığına "| ZENWELD" eklenir
  modelCode: "Z05.03.00",
  section: "ekipmanlar",           // ekipmanlar | guvenlik | aksesuarlar | dolgu-metalleri
  categorySlug: "mig-gazalti-kaynak-makineleri", // categories.seed.ts içindeki bir slug
  processes: ["MIG", "MAG"],
  shortDescription: "…",
  description: "…",
  priceExVat: 52000,               // KDV hariç
  vatRate: 20,
  currency: "TRY",
  images: [{ url: stockPhotos.weldingSparks, alt: "…" }],
  specs: [
    { label: "Kaynak Akımı", value: "30 – 300 A" },
  ],
  inTheBox: ["1 x Ana Ünite"],
  highlights: ["…"],
  quotable: true,      // Teklif Al akışında seçilebilsin mi
  featured: false,     // Anasayfada öne çıksın mı
  isNew: true,
  warrantyMonths: 24,
  createdAt: now,
  updatedAt: now,
  active: true,
  // İsteğe bağlı; boş alanlarda otomatik değer kullanılır (panelde SEO sekmesi)
  seo: {
    title: "…",                       // sayfa başlığı (tam haliyle)
    description: "…",                 // Google açıklaması
    keywords: ["…", "…"],            // site araması + keywords etiketi
  },
}
```

`stock.seed.ts` her bayi ve satıcı için ürün listesinden **örnek stok üretir**
(`dealerStock`, `retailerStock`; online mağazası olan bayilerde ürün linkleriyle);
tarihler, veritabanının tarayıcıda oluşturulduğu ana göre ayarlanır. Ayrıca bir
şey yapmanız gerekmez. Gerçek stok koda yazılmaz; bayi ve satıcıların gönderdiği
dosyalar panelden yüklenir ([STOK.md](STOK.md)).

---

## Yeni online satıcı ekleme

`retailers.seed.ts`:

```ts
{
  id: "r-yeni-satici",
  name: "Yeni Satıcı A.Ş.",
  websiteUrl: "https://www.yenisatici.com/",
  logoText: "YENİ SATICI",        // ürün sayfasındaki kutuda görünen yazı
  isOwnStore: false,               // kendi online mağazamız mı
  city: "İstanbul",
  active: true,
}
```

Satıcı eklendikten sonra **Stok Matrisi**'nden satıcının stok dosyasını yükleyin;
aksi halde hiçbir ürün sayfasında görünmez. Satıcı bir bayinin online mağazasıysa
bayinin `retailerId` alanına yazılır; stoğu bayinin dosyasından gelir.

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
  workingHours: "…",
  retailerId: "r-yeni-satici",     // online mağazası varsa
  active: true,
}
```

---

## Metinleri değiştirme

Arayüz metinleri: `packages/i18n/src/tr.ts`.
Lorem ipsum içerikli sayfalar: ilgili `page.tsx` dosyaları.
