# ZENWELD — Kurumsal Katalog Sitesi + Bayi E-Ticaret Mağazası

Zenweld kaynak makineleri ve ekipmanları için hazırlanmış **frontend demo** projesi.
Backend yoktur; tüm veriler tarayıcıda (localStorage) tutulur.

> ⚠️ **Bu bir demo/sunum çalışmasıdır.** Üyelik ve yönetim paneli özellikleri
> gerçek bir sunucu tarafı kimlik doğrulaması olmadan çalışır. Canlıya çıkmadan
> önce [Canlıya Çıkış](#canlıya-çıkış-notları) bölümünü okuyun.

## Yayındaki adresler

| Site | Adres |
|---|---|
| Ana Zenweld sitesi | https://zenweld-test-zenweld-web.vercel.app |
| ZENWELD-BAYİ-A mağazası | https://zenweld-test-bayi-shop.vercel.app |

İki site birbirine Vercel ortam değişkenleriyle bağlıdır:
`NEXT_PUBLIC_BAYI_SHOP_URL` (ana sitede) ve `NEXT_PUBLIC_ZENWELD_URL` (bayi mağazasında).
Bu değişkenler derleme sırasında koda gömülür; değiştirdikten sonra yeniden deploy gerekir.

---

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Demo Hesaplar](#demo-hesaplar)
- [İki Site](#i̇ki-site)
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
npm run dev:web

# Bayi mağazası (ZENWELD-BAYİ-A) → http://localhost:3001
npm run dev:bayi
```

İki siteyi **aynı anda** çalıştırmak, ürün sayfasındaki "Ayrıca online alışveriş
olarak şurada da mevcuttur" bölümünden bayi mağazasına geçişi denemek için gerekir.

Diğer komutlar:

```bash
npm run build       # iki uygulamanın da üretim derlemesi
npm run typecheck   # TypeScript kontrolü
```

---

## Demo Hesaplar

Giriş sayfasındaki kartlara tıklayarak formu otomatik doldurabilirsiniz.

| Rol | E-posta | Şifre | Neler görebilir |
|---|---|---|---|
| **Yönetici** | `admin@zenweld.com` | `admin123` | Yönetim paneli (`/tr/admin`) |
| **Bireysel** | `bireysel@demo.com` | `demo123` | Favoriler, garanti kayıtları, siparişler |
| **Kurumsal** | `kurumsal@demo.com` | `demo123` | Teklif talepleri, vadeli/çek ödeme |
| **Bayi** | `bayi@zenweld-bayi-a.com` | `bayi123` | Stok bildirimi, bayi siparişleri |
| **Bayi 2** | `bayi@basakhirdavat.com` | `bayi123` | Başak Hırdavat bayi hesabı |

---

## İki Site

### 1. `apps/zenweld-web` — Ana Zenweld Sitesi (port 3000)

Marka/katalog sitesidir, **sepet yoktur**. Ziyaretçi ürünü şu üç yoldan alır:

1. **Nereden Alabilirim** → haritada en yakın bayiyi bulur, yerinde satın alır
2. **Ayrıca online alışveriş olarak şurada da mevcuttur** → o üründe **stoğu olan**
   online satıcılara yönlendirilir
3. **Teklif Al** → vadeli ödeme / çek isteyen kurumsal müşteriler için satış ekibi
   iletişime geçer

### 2. `apps/bayi-shop` — ZENWELD-BAYİ-A (port 3001)

E-ticaret sitesi olmayan bayiler için **beyaz etiket mağaza şablonu**. Sepet,
mock ödeme akışı ve sipariş takibi vardır. Yeni bir bayi için yalnızca
`apps/bayi-shop/src/lib/store-config.ts` dosyasındaki değerleri değiştirmek yeterlidir.

---

## Öne Çıkan Özellikler

### Ürüne özel online satıcı listesi

Her ürünün her satıcıdaki stok durumu ayrı tutulur. Bir ürün 7 sitede stokta
olurken diğeri 2 sitede olabilir; ürün sayfasında **yalnızca stokta olan satıcılar**
görünür. Hiçbirinde yoksa "en yakın bayiden temin edebilirsiniz" mesajı çıkar.

Stok iki yerden güncellenir:
- **Yönetici:** `/tr/admin/stok` → ürün × satıcı matrisi (tek tek, toplu veya CSV)
- **Bayi:** `/tr/hesabim/stok-bildirimi` → bayi kendi stoğunu işaretler

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
| Bireysel | Favoriler, garanti kaydı, sipariş takibi |
| Kurumsal | Teklif talebi (vadeli / çek), teklif geçmişi |
| Bayi | Stok bildirimi, bayi fiyat listesi, sipariş |
| Yönetici | Yönetim panelinin tamamı |

Bayi kayıtları `pending` (onay bekliyor) durumunda açılır; yönetici
`/tr/admin/uyeler` sayfasından onaylar.

### Yönetim paneli (yalnızca Türkçe)

`/tr/admin` — ürün CRUD (görsel yükleme dahil), stok matrisi + CSV içe aktarma,
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
    ├── zenweld-web/                ANA SİTE (port 3000)
    │   └── src/
    │       ├── app/[locale]/
    │       │   ├── page.tsx                    Anasayfa
    │       │   ├── ekipmanlar|guvenlik|aksesuarlar|dolgu-metalleri/
    │       │   │   ├── page.tsx                Bölüm listeleme
    │       │   │   └── [kategori]/page.tsx     Kategori listeleme
    │       │   ├── urun/[slug]/page.tsx        ÜRÜN DETAY
    │       │   ├── arama/page.tsx
    │       │   ├── nereden-alabilirim/page.tsx Bayi bulucu (harita)
    │       │   ├── teklif-al/page.tsx          4 adımlı teklif formu
    │       │   ├── giris | kayit | cikis | sifremi-unuttum/
    │       │   ├── hesabim/                    Rol bazlı hesap paneli
    │       │   │   └── profil · tekliflerim · siparislerim · favorilerim
    │       │   │      · garantilerim · adreslerim · stok-bildirimi
    │       │   ├── kesfet/                     KEŞFET menüsü
    │       │   │   └── hakkimizda · welders-club · garanti-sorgula
    │       │   │      · garanti-kayit · blog · msds · parti-sertifikalari
    │       │   │      · urun-secici · rehber
    │       │   ├── destek/                     sss · iletisim · servis-agi
    │       │   ├── kurumsal/                   kvkk · gizlilik · iade …
    │       │   └── admin/                      YÖNETİM PANELİ
    │       │       └── urunler · stok · saticilar · bayiler · uyeler
    │       │          · teklifler · siparisler · veri
    │       ├── components/
    │       │   ├── layout/    Header · MegaMenu · Footer · DemoRibbon
    │       │   ├── search/    SearchOverlay
    │       │   ├── product/   ProductCard · OnlineRetailers · ProductDetailParts
    │       │   ├── dealers/   DealerFinder · DealerMap
    │       │   ├── account/   AccountShell
    │       │   ├── admin/     AdminShell · ProductForm
    │       │   └── common/    LocaleLink · ProductImage · PageShell
    │       └── lib/
    │           ├── search/    search-client · tr-normalize · synonyms · use-search
    │           ├── i18n-client.tsx · format.ts · geo.ts · menu.ts
    │           └── quote-list.tsx · favourites.tsx
    │
    └── bayi-shop/                  BAYİ MAĞAZASI (port 3001)
        └── src/
            ├── app/[locale]/
            │   ├── page.tsx · magaza · urun/[slug]
            │   ├── sepet · odeme · siparis-tamam
            │   ├── giris · kayit · hesabim
            │   └── hakkimizda · iletisim · kargo-iade
            ├── components/ ShopHeader · ShopFooter · ShopProductCard
            └── lib/ cart.tsx · store-config.ts
```

---

## Veriler Nerede Saklanıyor?

Backend olmadığı için:

1. Uygulama açıldığında `packages/data` içindeki **başlangıç verisi** tarayıcının
   `localStorage`'ına yüklenir.
2. Admin panelinde veya bayi stok bildiriminde yapılan her değişiklik
   `localStorage`'a yazılır ve sayfalar anında güncellenir.
3. Değişiklikler **yalnızca o tarayıcıda** görünür. Başka bilgisayarda görünmez.

Değişiklikleri kalıcı hale getirmek için: `/tr/admin/veri` → **JSON Dışa Aktar**
→ indirilen dosyayı yedekleyin veya seed dosyalarına aktarın.
Aynı sayfadan **JSON İçe Aktar** ve **Başlangıca Dön** işlemleri de yapılabilir.

> İki site farklı portlarda çalıştığı için ayrı `localStorage` alanları kullanır.
> Ana sitedeki admin değişiklikleri bayi mağazasına otomatik yansımaz; iki site de
> aynı başlangıç verisinden beslenir.

---

## Günlük Stok Güncelleme Akışı

**Seçenek A — Bayi kendi girer (önerilen):**
1. Bayi `bayi@zenweld-bayi-a.com` ile giriş yapar
2. `Hesabım → Stok Bildirimi` sayfasında ürünleri işaretler veya CSV yükler
3. İşaretlenen ürünler ana sitedeki ürün sayfalarında o bayinin logosuyla görünür

**Seçenek B — Yönetici girer:**
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
   yapılıyor ve `/tr/admin` adresi tarayıcı tarafında korunuyor — bu gerçek bir
   güvenlik değildir. Supabase Auth, Auth0 veya kendi backend'iniz kullanılmalı.
2. **Veri gerçek bir veritabanına taşınmalı.** `packages/store/src/database.ts`
   içindeki okuma/yazma fonksiyonları değiştirilerek tüm uygulama aynı kalacak
   şekilde Supabase/Firebase/PostgreSQL'e bağlanabilir.
3. **Ödeme entegrasyonu.** Bayi mağazasındaki ödeme akışı tamamen mock'tur.
4. **Ürün teknik verileri doğrulanmalı.** Amper, devrede kalma oranı ve ağırlık
   gibi değerler internet kaynaklarından derlendi; `products.seed.ts` içinde
   `DOĞRULANMALI` notu bulunur. Resmî katalogla karşılaştırılmalıdır.
5. **Yasal metinler** (KVKK, gizlilik, iade, garanti şartları) şu an lorem ipsum'dur.

---

## SEO

Her iki sitede de aşağıdakiler hazırdır:

- **Sayfa başlıkları ve açıklamaları** — ürün, kategori, blog ve içerik sayfalarının
  her biri kendi başlığını ve açıklamasını üretir (TR/EN ayrı)
- **`/sitemap.xml`** — ürün, kategori ve blog sayfaları `packages/data` içindeki
  veriden otomatik üretilir; yeni ürün eklendiğinde kendiliğinden güncellenir
- **`/robots.txt`** — yönetim paneli, hesap, sepet ve ödeme sayfaları taramaya kapalı
- **Dile göre adresler** — İngilizce sayfalar İngilizce adres kullanır:
  `/tr/urun/arc-200` ↔ `/en/products/arc-200`,
  `/tr/ekipmanlar/mig-gmaw` ↔ `/en/equipment/mig-gmaw`.
  Çeviri tablosu `packages/i18n/src/pathnames.ts` dosyasındadır; uygulamanın iç
  rota ağacı Türkçe kalır, `middleware.ts` İngilizce adresi iç rotaya bağlar.
  Bileşenlerde her zaman Türkçe yol yazılır, çeviriyi `useHref()` yapar.
- **`hreflang` + `canonical`** — her dil kendi adres yazımıyla işaretlenir
- **Open Graph / Twitter Card** — WhatsApp, LinkedIn ve X'te paylaşınca başlık,
  açıklama ve görselle düzgün önizleme çıkar
- **Yapısal veri (schema.org JSON-LD)** — `Product` (fiyat, SKU, stok durumu, marka,
  teknik özellikler), `BreadcrumbList`, `Organization`; bayi mağazasında ayrıca
  `Store` ve kargo bilgisi içeren `Offer`

### Site adresi

Adres sırasıyla `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik değişkeni →
`localhost` olarak çözülür. Kendi alan adınıza geçince `NEXT_PUBLIC_SITE_URL`
tanımlamanız yeterlidir.

### Demoyu aramaya kapatmak

Vercel'de `NEXT_PUBLIC_NOINDEX=1` tanımlarsanız `robots.txt` her şeyi engeller ve
tüm sayfalara `noindex` eklenir. Demo bir `vercel.app` adresindeyken bu önerilir.

---

## Marka varlıkları

| Varlık | Yer |
|---|---|
| Logo (kırmızı / beyaz) | `apps/*/public/images/brand/` |
| Kare marka işareti | `assets/brand-mark.svg` |
| Favicon ve uygulama ikonları | `apps/*/src/app/` (favicon.ico, icon.png, apple-icon.png) |

**Marka rengi:** `#B82429` — `packages/ui/src/theme.css` içindeki `--color-zw-red-600`.
Tüm buton, vurgu ve rozet renkleri bu tondan türetilir.

**İkonları yeniden üretmek:** `assets/brand-mark.svg` dosyasını değiştirip
`node scripts/generate-icons.mjs` çalıştırın; favicon.ico (16/32/48 px),
icon.png ve apple-icon.png her iki uygulama için yeniden oluşturulur.

---

## Teknoloji

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
MiniSearch · Leaflet + OpenStreetMap · lucide-react · npm workspaces
