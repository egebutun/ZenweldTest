# ZENWELD — Kurumsal Katalog Sitesi

Zenweld kaynak makineleri ve ekipmanları için hazırlanmış **frontend demo** projesi.
Backend yoktur; tüm veriler tarayıcıda (localStorage) tutulur.

> ⚠️ **Bu bir demo/sunum çalışmasıdır.** Üyelik ve yönetim paneli özellikleri
> gerçek bir sunucu tarafı kimlik doğrulaması olmadan çalışır. Canlıya çıkmadan
> önce [Canlıya Çıkış](#canlıya-çıkış-notları) bölümünü okuyun.

## Yayındaki adresler

| Site | Adres |
|---|---|
| Ana Zenweld sitesi | https://zenweld-test-zenweld-web.vercel.app |
| Zenweld yönetim paneli | https://zenweld-test-zenweld-web.vercel.app/yonetim |

---

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Demo Hesaplar](#demo-hesaplar)
- [Site](#site)
- [Öne Çıkan Özellikler](#öne-çıkan-özellikler)
- [Proje Yapısı](#proje-yapısı)
- [Veriler Nerede Saklanıyor?](#veriler-nerede-saklanıyor)
- [Günlük Stok Güncelleme Akışı](#günlük-stok-güncelleme-akışı)
- [Görseller](#görseller)
- [Canlıya Çıkış Notları](#canlıya-çıkış-notları)

---

## Hızlı Başlangıç

```bash
# Gereksinim: Node.js 20+ (proje Node 22 ile geliştirildi)
npm install

# Ana Zenweld sitesi → http://localhost:3000
# Zenweld yönetim paneli de bu uygulamanın içinde → http://localhost:3000/yonetim
npm run dev:web
```

Yönetim paneli sitenin içindedir (`/yonetim`); ayrı bir adresi veya ayrı bir
Vercel projesi yoktur. Panelin kendi giriş ekranı ve sitedeki müşteri
oturumundan ayrı kendi oturumu vardır.

Diğer komutlar:

```bash
npm run build       # ana sitenin üretim derlemesi
npm run typecheck   # TypeScript kontrolü
```

---

## Demo Hesaplar

Giriş sayfasındaki kartlara tıklayarak formu otomatik doldurabilirsiniz.

| Rol | E-posta | Şifre | Neler görebilir |
|---|---|---|---|
| **Yönetici** | `admin@zenweld.com` | `admin123` | Yalnızca Zenweld yönetim paneli (ana site `/yonetim`) |
| **Bireysel** | `bireysel@demo.com` | `demo123` | Ana site: favoriler, garanti kayıtları |
| **Kurumsal** | `kurumsal@demo.com` | `demo123` | Ana site: teklif talepleri, vadeli/çek ödeme |

Ana site yalnızca bireysel ve kurumsal üyeleri kabul eder. Bayiler ana sitenin
müşterisi değildir; bayi olmak isteyenler **Bayilik Başvurusu** formunu doldurur.

---

## Site

### `apps/zenweld-web` — Ana Zenweld Sitesi (port 3000)

Marka/katalog sitesidir, **sepet yoktur**. Ziyaretçi ürünü şu üç yoldan alır:

1. **Nereden Alabilirim** → haritada en yakın bayiyi bulur, yerinde satın alır
2. **Ayrıca online alışveriş olarak şurada da mevcuttur** → o üründe **stoğu olan**
   online satıcılara yönlendirilir
3. **Teklif Al** → vadeli ödeme / çek isteyen kurumsal müşteriler için satış ekibi
   iletişime geçer

---

## Öne Çıkan Özellikler

### Ürüne özel online satıcı listesi

Her ürünün her satıcıdaki stok durumu ayrı tutulur. Bir ürün 7 sitede stokta
olurken diğeri 2 sitede olabilir; ürün sayfasında **yalnızca stokta olan satıcılar**
görünür. Hiçbirinde yoksa "en yakın bayiden temin edebilirsiniz" mesajı çıkar.

Stok yönetim panelinden güncellenir: `/yonetim/stok` → ürün × satıcı matrisi
(tek tek, toplu veya CSV).

### Arama

Gerçek Elasticsearch sunucu gerektirdiği için tarayıcıda çalışan **MiniSearch**
kullanıldı — Elasticsearch ile aynı **BM25** skorlamasını uygular. Üzerine eklenenler:

- Yazım hatası toleransı: *"kanak makinesi"* → **Kaynak Makinesi**
- Ön-ek eşleşmesi: *"pla"* → **Plazma Kesme**
- Türkçe karakter normalizasyonu: *"ortulu"* ≈ *"örtülü"*
- Eşanlamlı sözlüğü: `mig↔gazaltı`, `tig↔argon`, `mma↔örtülü elektrot`, `plazma↔kesme`…
- Alan ağırlıklandırma: ürün adı ×4, SKU ×3, kategori ×2, açıklama ×1
- `⌘K` / `Ctrl+K` ile anlık arama paneli

`apps/zenweld-web/src/lib/search/search-client.ts` içindeki `search()` imzası
korunarak gövdesi gerçek bir Elasticsearch/Typesense/Algolia çağrısıyla
değiştirilebilir.

### Bayi bulucu

Leaflet + OpenStreetMap (API anahtarı gerekmez). Tarayıcı konum izniyle
Haversine mesafesine göre sıralama, şehir filtresi, "sadece bu ürünün stokta
olduğu bayiler" filtresi, yol tarifi ve WhatsApp bağlantıları.

### Üyelik ve roller

| Rol | Yetkiler |
|---|---|
| Bireysel | Ana site: favoriler, garanti kaydı |
| Kurumsal | Ana site: teklif talebi (vadeli / çek), teklif geçmişi |
| Yönetici | Zenweld yönetim panelinin tamamı (ana site `/yonetim`) |

Ana sitede bayi hesabı açılmaz; bayi olmak isteyenler **Bayilik Başvurusu**
formunu doldurur.

### Yönetim paneli (yalnızca Türkçe)

`/yonetim` — ürün CRUD (görsel yükleme dahil), stok matrisi + CSV içe aktarma,
online satıcı ve bayi yönetimi, üye yönetimi (rol değiştirme, onaylama, askıya
alma, CSV dışa aktarma), teklif ve sipariş takibi, JSON yedekleme.

### Çift dil (TR / EN)

Tüm arayüz Türkçe ve İngilizce. URL'ler dil ön ekiyle çalışır: `/tr/...` ve `/en/...`.
Ürün adları, açıklamaları ve teknik özellikleri iki dilde tutulur.
**Yönetim paneli yalnızca Türkçedir.**

---

## Proje Yapısı

```
ZenweldTest/
├── package.json                    npm workspaces kökü
│
├── packages/
│   ├── data/                       Paylaşılan veri modeli ve başlangıç verisi
│   │   └── src/
│   │       ├── types.ts            Product, Dealer, Retailer, RetailerStock, User…
│   │       └── seed/
│   │           ├── products.seed.ts    12 gerçek Zenweld modeli + 15 aksesuar
│   │           ├── categories.seed.ts  Bölüm / grup / kategori ağacı
│   │           ├── dealers.seed.ts     30 bayi (TR koordinatlı)
│   │           ├── retailers.seed.ts   Online satıcılar (Başak Hırdavat vb.)
│   │           ├── stock.seed.ts       Ürün × satıcı stok matrisi
│   │           ├── users.seed.ts       Demo hesaplar
│   │           ├── content.seed.ts     Blog, SSS, teklif, sipariş, garanti
│   │           └── images.ts           Unsplash görsel havuzu
│   │
│   ├── store/                      Backend yerine geçen veri katmanı
│   │   └── src/
│   │       ├── database.ts         localStorage motoru + abonelik
│   │       ├── repository.ts       Sorgu ve güncelleme fonksiyonları
│   │       ├── hooks.ts            useDatabase() — değişiklikler anında yansır
│   │       └── export-import.ts    JSON/CSV dışa-içe aktarma
│   │
│   ├── auth/                       Demo kimlik doğrulama
│   │   └── src/ auth-context.tsx · guards.tsx · roles.ts · hash.ts
│   │
│   ├── i18n/                       TR/EN sözlükleri ve dil yapılandırması
│   │
│   └── ui/                         Ortak tasarım sistemi
│       └── src/ theme.css · components/ (Button, Modal, Badge, Field…)
│
└── apps/
    └── zenweld-web/                ANA SİTE (port 3000)
        └── src/
            ├── app/[locale]/
            │   ├── page.tsx                    Anasayfa
            │   ├── ekipmanlar|guvenlik|aksesuarlar|dolgu-metalleri/
            │   │   ├── page.tsx                Bölüm listeleme
            │   │   └── [kategori]/page.tsx     Kategori listeleme
            │   ├── urun/[slug]/page.tsx        ÜRÜN DETAY
            │   ├── arama/page.tsx
            │   ├── yetkili-bayi-ve-servis-agi/ Bayi bulucu (harita)
            │   ├── teklif-al/page.tsx          4 adımlı teklif formu
            │   ├── giris | kayit | cikis | sifremi-unuttum/
            │   ├── hesabim/                    Müşteri hesabı (bireysel / kurumsal)
            │   │   └── profil · tekliflerim · siparislerim · favorilerim
            │   │      · garantilerim · adreslerim
            │   ├── garanti/                    Garanti seçimi · kayit · sorgulama · kosullar
            │   ├── bayilik-basvurusu/          Bayimiz Olun formu
            │   ├── hakkimizda · satis-temsilcilerimiz · iletisim
            │   ├── haberler · etkinlikler · blog · welders-club
            │   ├── sss · urun-secici · kaynak-rehberi · msds · parti-sertifikalari
            │   ├── yasal/                      kvkk · gizlilik · kullanim-kosullari · iade
            │   │   (Adresler menüye bağlı değildir; menü değişse de adres değişmez.)
            │   ├── (../yonetim/ — [locale] dışında) ZENWELD YÖNETİM PANELİ (yalnızca TR)
            │   │   └── urunler · stok · siparisler · teklifler · bayiler · saticilar
            │   │      · uyeler · garantiler · etkinlikler · haberler · blog · yorumlar
            │   │      · gorunum · veri
            ├── components/
            │   ├── layout/    Header · MegaMenu · Footer · DemoRibbon
            │   ├── search/    SearchOverlay
            │   ├── product/   ProductCard · OnlineRetailers · ProductDetailParts
            │   ├── dealers/   DealerFinder · DealerMap
            │   ├── account/   AccountShell
            │   ├── admin/     AdminShell · ProductForm
            │   └── common/    LocaleLink · ProductImage · PageShell
            └── lib/
                ├── search/    search-client · tr-normalize · synonyms · use-search
                ├── i18n-client.tsx · format.ts · geo.ts · menu.ts
                └── quote-list.tsx · favourites.tsx
```

---

## Veriler Nerede Saklanıyor?

Backend olmadığı için:

1. Uygulama açıldığında `packages/data` içindeki **başlangıç verisi** tarayıcının
   `localStorage`'ına yüklenir.
2. Yönetim panelinde yapılan her değişiklik
   `localStorage`'a yazılır ve sayfalar anında güncellenir.
3. Değişiklikler **yalnızca o tarayıcıda** görünür. Başka bilgisayarda görünmez.

Değişiklikleri kalıcı hale getirmek için: `/yonetim/veri` → **JSON Dışa Aktar**
→ indirilen dosyayı yedekleyin veya seed dosyalarına aktarın.
Aynı sayfadan **JSON İçe Aktar** ve **Başlangıca Dön** işlemleri de yapılabilir.

---

## Günlük Stok Güncelleme Akışı

1. `admin@zenweld.com` ile giriş → `Yönetim Paneli → Stok Matrisi`
2. Satıcıyı seçip tek tek işaretleyin, ya da "Tümünü işaretle / temizle" kullanın
3. Bayiden Excel geldiyse `sku;stok;adet;fiyat` biçiminde CSV olarak yükleyin

CSV örneği:

```csv
sku;stok;adet;fiyat
ZW-U250MTC;1;4;49800
ZW-ARC200;var;12;11880
ZW-MC40CNC;0;0;
```

---

## Görseller

Projede Unsplash görsel bağlantıları kullanılmıştır
(`packages/data/src/seed/images.ts`). Bunlar **gerçek Zenweld ürün fotoğrafları
değildir**, genel kaynak/sanayi fotoğraflarıdır.

`ProductImage` bileşeni, bir görsel yüklenemezse otomatik olarak **markalı SVG
placeholder**'a düşer — sitede hiçbir zaman kırık görsel görünmez.

Gerçek ürün fotoğraflarını eklemek için: `Yönetim Paneli → Ürünler → Düzenle →
Görseller` sekmesinden URL girin veya dosya yükleyin (tarayıcı deposu sınırlı
olduğu için 1.5 MB altında olmalıdır).

---

## Canlıya Çıkış Notları

Bu proje bir sunum demosu olarak hazırlandı. Gerçek kullanıma almadan önce:

1. **Kimlik doğrulama sunucuya taşınmalı.** Şu an şifre karşılaştırması tarayıcıda
   yapılıyor ve `/yonetim` paneli tarayıcı tarafında korunuyor — bu gerçek bir
   güvenlik değildir. Supabase Auth, Auth0 veya kendi backend'iniz kullanılmalı.
2. **Veri gerçek bir veritabanına taşınmalı.** `packages/store/src/database.ts`
   içindeki okuma/yazma fonksiyonları değiştirilerek tüm uygulama aynı kalacak
   şekilde Supabase/Firebase/PostgreSQL'e bağlanabilir.
3. **Ürün teknik verileri doğrulanmalı.** Amper, devrede kalma oranı ve ağırlık
   gibi değerler internet kaynaklarından derlendi; `products.seed.ts` içinde
   `DOĞRULANMALI` notu bulunur. Resmî katalogla karşılaştırılmalıdır.
4. **Yasal metinler** (KVKK, gizlilik, iade, garanti koşulları) şu an lorem ipsum'dur.

---

## SEO

Sitede aşağıdakiler hazırdır:

- **Sayfa başlıkları ve açıklamaları** — ürün, kategori, blog ve içerik sayfalarının
  her biri kendi başlığını ve açıklamasını üretir (TR/EN ayrı)
- **`/sitemap.xml`** — ürün, kategori ve blog sayfaları `packages/data` içindeki
  veriden otomatik üretilir; yeni ürün eklendiğinde kendiliğinden güncellenir
- **`/robots.txt`** — yönetim paneli, hesap ve API sayfaları taramaya kapalı
- **Dile göre adresler** — İngilizce sayfalar İngilizce adres kullanır:
  `/tr/urun/arc-200` ↔ `/en/products/arc-200`,
  `/tr/ekipmanlar/lazer-temizleme` ↔ `/en/equipment/laser-cleaning`.
  Kategori, blog ve haberlerde slug da çevrilir (`slugEn` alanı; bkz.
  `packages/data/src/slugs.ts`). Ürün ve etkinlik slug'ları iki dilde aynıdır.
  Çeviri tablosu `packages/i18n/src/pathnames.ts` dosyasındadır; uygulamanın iç
  rota ağacı Türkçe kalır, `middleware.ts` İngilizce adresi iç rotaya bağlar.
  Bileşenlerde her zaman Türkçe yol yazılır, çeviriyi `useHref()` yapar.
- **`hreflang` + `canonical`** — her dil kendi adres yazımıyla işaretlenir
- **Open Graph / Twitter Card** — WhatsApp, LinkedIn ve X'te paylaşınca başlık,
  açıklama ve görselle düzgün önizleme çıkar
- **Yapısal veri (schema.org JSON-LD)** — `Product` (fiyat, SKU, stok durumu, marka,
  teknik özellikler), `BreadcrumbList`, `Organization`

### Site adresi

Adres sırasıyla `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik değişkeni →
`localhost` olarak çözülür. Kendi alan adınıza geçince `NEXT_PUBLIC_SITE_URL`
tanımlamanız yeterlidir.

### Demoyu aramaya kapatmak

Vercel'de `NEXT_PUBLIC_NOINDEX=1` tanımlarsanız tüm
sayfalara `<meta name="robots" content="noindex, nofollow">` eklenir ve site
haritası `robots.txt`'den kaldırılır. Demo bir `vercel.app` adresindeyken bu önerilir.
Değişken derleme sırasında okunur; ekledikten sonra **Redeploy** gerekir.

`robots.txt` bu modda taramayı **engellemez**, bilerek: Google sayfayı tarayamazsa
`noindex` etiketini de göremez ve adresi başka kaynaktan bulursa yine indeksleyebilir.
`robots.txt` yalnızca yönetim panelini (`/yonetim`), hesap ve API sayfalarını kapatır.
Yönetim paneli değişkenden bağımsız olarak her zaman `noindex`'tir (etiket,
`X-Robots-Tag` başlığı ve `robots.txt`).

---

## Marka varlıkları

| Varlık | Yer |
|---|---|
| Logo (kırmızı / beyaz) | `apps/zenweld-web/public/images/brand/` |
| Kare marka işareti | `assets/brand-mark.svg` |
| Favicon ve uygulama ikonları | `apps/zenweld-web/src/app/` (favicon.ico, icon.png, apple-icon.png) |
| Android ikonları | `apps/zenweld-web/public/icons/` (icon-192.png, icon-512.png) |
| Web app manifest | `apps/zenweld-web/src/app/manifest.ts` |

### Platform kapsamı

| Platform | Hangi dosya |
|---|---|
| Tüm tarayıcı sekmeleri (Android, iOS, masaüstü) | `favicon.ico` + `icon.png` |
| Android — ana ekrana ekle, uygulama geçiş ekranı, splash | `manifest.ts` + `icons/icon-192.png`, `icon-512.png` |
| iOS — ana ekrana ekle | `apple-icon.png` |
| Android Chrome tarayıcı çubuğu rengi | `viewport.themeColor` (layout.tsx) |

**Marka rengi:** `#B82429` — `packages/ui/src/theme.css` içindeki `--color-zw-red-600`.
Tüm buton, vurgu ve rozet renkleri bu tondan türetilir.

**İkonları yeniden üretmek:** `assets/brand-mark.svg` dosyasını değiştirip
`node scripts/generate-icons.mjs` çalıştırın; favicon.ico (16/32/48 px),
icon.png ve apple-icon.png yeniden oluşturulur.

---

## Teknoloji

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
MiniSearch · Leaflet + OpenStreetMap · lucide-react · npm workspaces
