# ZENWELD — Kurumsal Site ve Online Mağaza

Zenweld kaynak makineleri ve ekipmanları için hazırlanmış **frontend demo** projesi.
Backend yoktur; tüm veriler tarayıcıda (localStorage) tutulur. Sunucuda yalnızca
form e-postalarını gönderen üç küçük uç vardır (`app/api`).

> ⚠️ **Bu bir demo/sunum çalışmasıdır.** Üyelik ve yönetim paneli özellikleri
> gerçek bir sunucu tarafı kimlik doğrulaması olmadan çalışır. Canlıya çıkmadan
> önce [Canlıya Çıkış](#canlıya-çıkış-notları) bölümünü okuyun.

## Yayındaki adresler

| Site | Adres |
|---|---|
| Ana Zenweld sitesi | https://zenweld-test-zenweld-web.vercel.app |
| Zenweld yönetim paneli | https://zenweld-test-zenweld-web.vercel.app/yonetim |

---

## Belgeler

Sitenin ve panelin bütün özellikleri, kuralları ve kararları `docs/`
klasöründedir. Başlangıç noktası:
[docs/00-BASLA-BURADAN.md](docs/00-BASLA-BURADAN.md). Bu projede çalışan Claude
oturumları için kurallar: [CLAUDE.md](CLAUDE.md).

---

## İçindekiler

- [Belgeler](#belgeler)
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

# İsteğe bağlı: e-posta ve site adresi ayarları (boşken de çalışır)
cp apps/zenweld-web/.env.example apps/zenweld-web/.env.local

# Ana Zenweld sitesi → http://localhost:3000
# Zenweld yönetim paneli de bu uygulamanın içinde → http://localhost:3000/yonetim
npm run dev:web
```

Yönetim paneli sitenin içindedir (`/yonetim`); ayrı bir adresi veya ayrı bir
Vercel projesi yoktur. Panelin kendi giriş ekranı ve sitedeki müşteri
oturumundan ayrı kendi oturumu vardır.

Diğer komutlar:

```bash
npm run build       # ana sitenin üretim derlemesi (kod denetimini de çalıştırır)
npm run typecheck   # TypeScript kontrolü
npm run lint        # kod denetimi (ESLint)
npm test            # iş kuralları testleri (fiyat, kampanya, taksit, stok, garanti…)
npm run test:e2e    # tarayıcı testleri (önce npm run build; sunucuyu kendisi açar)
```

---

## Demo Hesaplar

| Rol | E-posta | Şifre | Neler görebilir |
|---|---|---|---|
| **Yönetici** | `admin@zenweld.com` | `admin123` | Yalnızca Zenweld yönetim paneli (ana site `/yonetim`) |
| **Bireysel** | `bireysel@demo.com` | `demo123` | Ana site: online alışveriş, sipariş takibi, teklif talepleri, favoriler, garanti kayıtları |
| **Kurumsal** | `kurumsal@demo.com` | `demo123` | Bireysel ile aynı; ödemede kurumsal fatura önceden seçili gelir |

Tarayıcı testleri (`npm run test:e2e`) giriş bilgilerini bu tablodan okur;
bilgiler başka dosyada tutulmaz. Tablonun biçimi değişirse
`tests/e2e/yardimci.ts` › `demoAccount` da güncellenmelidir.

**Test kartı (ödeme ekranı):** `4111 1111 1111 1111`. Son kullanma tarihi
gelecekte bir ay (örnek `12/30`), CVC herhangi 3 hane, kart üzerindeki isim
herhangi bir ad olabilir. Ödeme demo modundadır, para çekilmez; gerçek kart
bilgisi girmeyin.

Ana site yalnızca bireysel ve kurumsal üyeleri kabul eder. Bayiler ana sitenin
müşterisi değildir; bayi olmak isteyenler **Bayilik Başvurusu** formunu doldurur.

---

## Site

### `apps/zenweld-web` — Ana Zenweld Sitesi (port 3000)

Marka sitesi ve **online mağazadır**. Ziyaretçi ürünü şu yollardan alır:

1. **Sepete Ekle** → üye girişiyle sitede satın alır (aşağıda *Online mağaza*)
2. **Stoktaki Bayileri Gör** → haritada o ürünü **stokta tutan** en yakın bayiyi bulur
3. **Ayrıca online alışveriş olarak şurada da mevcuttur** → o üründe **stoğu olan**
   online satıcılara yönlendirilir
4. **Teklif Al** sayfası (`/teklif-al`) → vadeli ödeme / çek isteyen kurumsal
   müşteriler için satış ekibi iletişime geçer. Ürün sayfasında teklif düğmesi
   yoktur; ürünler Teklif Al sayfasındaki listeden seçilir.

### Online mağaza

- Her ürün her zaman satıştadır (Zenweld deposunda stok tükenmez); bayi ve online
  satıcı stokları ürün sayfasında ayrıca gösterilir.
- **Sepet** tarayıcıda tutulur; fiyat her zaman ürünün güncel (kampanyalı) fiyatıdır.
  Sepet tutarı **5.000 ₺** ve üzerindeyse kargo ücretsiz (Mağaza Ayarları'ndan değişir).
- **Ödeme** (`/odeme`) yalnızca üyelere açıktır: teslimat adresi, fatura bilgisi
  (bireysel: T.C. kimlik no · kurumsal: unvan, vergi dairesi, VKN), ödeme yöntemi ve
  Ön Bilgilendirme Formu + Mesafeli Satış Sözleşmesi onayı.
- **Kartla ödeme + taksit**: kart numarası girilince kart programı ve taksit
  tablosu (tek çekim, 2–12 taksit, vade farkı) çıkar. *Demo: para çekilmez;*
  gerçek ödeme kuruluşu (iyzico / PayTR / banka sanal POS) backend ile bağlanacak.
- **Havale / EFT**: sipariş "Ödeme Bekleniyor" olarak açılır, IBAN'lar gösterilir;
  yönetici "Ödeme Alındı" deyince hazırlanmaya geçer. Süre dolarsa iptal edilir.
- **Sipariş takibi**: Hesabım › Siparişlerim — durum çizelgesi
  (Ödeme Bekleniyor → Hazırlanıyor → Kargoya Verildi → Teslim Edildi), kargo firması
  ve takip numarası, sözleşmelerin siparişe özel kopyası.

---

## Öne Çıkan Özellikler

### Ürüne özel online satıcı listesi

Her ürünün her bayideki ve online satıcıdaki stoğu ayrı tutulur. Ürün sayfasında
**yalnızca stokta olan online satıcılar** (kart, ürünün o sitedeki sayfasına gider)
ve "Stoktaki Bayileri Gör" haritasında yalnızca stokta olan bayiler görünür. Online
mağazası olan bayi her ikisinde de görünür. Adet ve fiyat sitede gösterilmez.
Hiçbir online satıcıda yoksa "en yakın bayiden temin edebilirsiniz" mesajı çıkar.

Stok, bayi ve satıcıların gönderdiği CSV/XLSX dosyalarıyla panelden güncellenir:
`/yonetim/stok`. Ayrıntılar: [docs/STOK.md](docs/STOK.md).

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
Haversine mesafesine göre sıralama, şehir ve Yetkili Servis filtreleri, yol
tarifi ve WhatsApp bağlantıları. Ürün sayfasındaki **Stoktaki Bayileri Gör**
penceresinde yalnızca o ürünü stokta tutan bayiler listelenir.

### Üyelik ve roller

| Rol | Yetkiler |
|---|---|
| Bireysel ve Kurumsal | Ana site: online alışveriş, sipariş takibi, teklif talebi ve geçmişi, garanti kayıtları, adresler. İki tür aynı şeyleri yapar; kurumsal üyede kayıtta firma ünvanı zorunludur ve ödemede kurumsal fatura önceden seçili gelir. |
| Yönetici | Zenweld yönetim panelinin tamamı (ana site `/yonetim`); sitede giriş yapamaz |

Favoriler, garanti kaydı ve Teklif Al üye olmadan da kullanılabilir. Ana sitede
bayi hesabı açılmaz; bayi olmak isteyenler **Bayilik Başvurusu** formunu
doldurur.

### Yönetim paneli (yalnızca Türkçe)

`/yonetim` — ana sayfada ciro, sipariş, teklif, üye, servis ve garanti
grafikleri; menüde:

- **Satış:** Siparişler (havale onayı, kargo takip no, teslim, iptal), Teklifler,
  İade Talepleri, Mağaza Ayarları (kargo, POS ve taksitler, havale hesapları)
- **Ürünler:** Ürünler (seçenekler ve SEO dahil), Kategoriler, Seçenek
  Tanımları, Stok Matrisi (bayi ve satıcıların CSV/XLSX stok dosyaları), Yorumlar
- **Bayi ve Satış Ağı:** Bayiler, Online Satıcılar, Satış Temsilcileri
- **Müşteriler ve Servis:** Üyeler (rol değiştirme, askıya alma ve
  aktifleştirme, CSV dışa aktarma), Servis Talepleri, Garantiler
- **İçerik:** Haberler, Etkinlikler, Blog, Hakkımızda, Sık Sorulan Sorular,
  Belgeler (MSDS, kaynak rehberi, parti sertifikaları), Yasal Metinler, Sayfa SEO
- **Ayarlar:** Görünüm

Ekran ekran anlatım: [docs/ADMIN-KULLANIM.md](docs/ADMIN-KULLANIM.md).

### Dil

Site ve yönetim paneli yalnızca Türkçedir. Adreslerde dil ön eki yoktur
(`/urun/...`, `/ekipmanlar/...`).

---

## Proje Yapısı

```
ZenweldTest/
├── package.json                    npm workspaces kökü
├── eslint.config.mjs               Kod denetimi ayarları
├── vitest.config.mts               İş kuralları testlerinin ayarları
├── playwright.config.ts            Tarayıcı testlerinin ayarları
├── tests/
│   ├── unit/                       İş kuralları testleri (npm test)
│   └── e2e/                        Tarayıcı testleri (npm run test:e2e)
│
├── packages/
│   ├── data/                       Paylaşılan veri modeli ve başlangıç verisi
│   │   └── src/
│   │       ├── index.ts            DB_VERSION (veri sürümü) ve dışa açılanlar
│   │       ├── types.ts            Product, Dealer, Retailer, DealerStock, RetailerStock, User…
│   │       ├── checkout.ts · discount.ts · variants.ts · stock.ts   Ortak hesaplar
│   │       ├── catalog.ts · legal.ts · highlights.ts
│   │       └── seed/
│   │           ├── products.seed.ts    60 örnek ürün (3'ü seçenekli)
│   │           ├── options.seed.ts     Seçenek tanımları (Hortum Uzunluğu, Paket)
│   │           ├── categories.seed.ts  Bölüm / grup / kategori ağacı
│   │           ├── dealers.seed.ts     29 bayi (TR koordinatlı)
│   │           ├── retailers.seed.ts   Online satıcılar (Başak Hırdavat vb.)
│   │           ├── stock.seed.ts       Bayi ve satıcıların örnek stok listeleri
│   │           ├── users.seed.ts       Demo hesaplar
│   │           ├── orders.seed.ts      Örnek siparişler
│   │           ├── sample-activity.seed.ts  90 günlük örnek satış hareketi (canlıda kaldırılır)
│   │           ├── content.seed.ts     Blog, SSS, teklif, garanti
│   │           ├── events.seed.ts · company.seed.ts · reviews.seed.ts
│   │           ├── documents.seed.ts · legal.seed.ts · settings.seed.ts
│   │           └── images.ts           Unsplash görsel havuzu (blog, haber, etkinlik…)
│   │
│   ├── store/                      Backend yerine geçen veri katmanı
│   │   └── src/
│   │       ├── database.ts         localStorage motoru + abonelik
│   │       ├── repo/               Veri işlemleri, konuya göre (ürün, stok, bayi, içerik…)
│   │       ├── hooks.ts            useDatabase() — değişiklikler anında yansır
│   │       ├── files.ts            Belge dosyaları (IndexedDB)
│   │       └── export-import.ts    CSV indirme
│   │
│   ├── auth/                       Demo kimlik doğrulama
│   │   └── src/ auth-context.tsx · roles.ts · hash.ts
│   │
│   ├── i18n/                       tr.ts — sitenin arayüz metinleri (düğme, başlık, uyarı…)
│   │
│   ├── utils/                      Biçimlendirme, link (slug) üretimi, görsel küçültme
│   │
│   └── ui/                         Ortak tasarım sistemi
│       └── src/ theme.css · components/ (Button, Modal, Badge, Field…)
│
└── apps/
    └── zenweld-web/                ANA SİTE (port 3000)
        ├── next.config.mjs             Güvenlik başlıkları (CSP …), görsel izinleri
        ├── .env.example                Ortam değişkenleri örneği
        └── src/
            ├── app/(site)/                     Sitenin sayfaları (adreste görünmez)
            │   ├── page.tsx                    Anasayfa
            │   ├── ekipmanlar|guvenlik|aksesuarlar|dolgu-metalleri/
            │   │   ├── page.tsx                Bölüm: grupların resimli kartları
            │   │   ├── [grup]/page.tsx         Grup: kategori kartları
            │   │   └── [grup]/[kategori]/      Kategori: ürün listesi
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
            │   ├── servis-talebi/              Servis talep formu (Destek ve Garanti menüsü)
            │   ├── sepet/ · odeme/             Sepet ve ödeme (yalnızca üyeler)
            │   ├── hesabim/siparislerim/[code] Sipariş detayı ve kargo takibi
            │   ├── yasal/                      Politikalar & Yasal sayfaları (metinler panelden
            │   │                               düzenlenir; adresler packages/data/src/legal.ts)
            │   │   (Adresler menüye bağlı değildir; menü değişse de adres değişmez.)
            ├── app/yonetim/                    ZENWELD YÖNETİM PANELİ
            │   └── siparisler · teklifler · iade-talepleri · magaza · urunler · kategoriler · secenekler
            │      · stok · yorumlar · bayiler · saticilar · satis-temsilcileri · uyeler
            │      · servis-talepleri · garantiler · haberler · etkinlikler · blog
            │      · hakkimizda · sss · belgeler · yasal-metinler · sayfa-seo · gorunum
            ├── app/api/                        bildirim · bayilik · destek (form e-postaları)
            ├── components/
            │   ├── layout/    Header · MegaMenu · MobileDrawer · Footer · CookieBanner
            │   ├── search/    SearchOverlay
            │   ├── product/   ProductCard · OnlineRetailers · ProductDetailParts
            │   ├── shop/      OrderSummary · CardPayment · BankAccounts · OrderParts
            │   │              · LegalDocument (ön bilgilendirme / mesafeli satış)
            │   ├── dealers/   DealerFinder · DealerMap
            │   ├── account/   AccountShell
            │   ├── admin/     AdminShell · content-form (haber/blog/etkinlik ortak) · ProductForm + product/ (sekmeler)
            │   └── common/    PageShell · JsonLd
            └── lib/
                ├── search/    search-client · tr-normalize · synonyms · use-search
                ├── page-meta.ts      Sabit sayfaların arama başlıkları (tek tablo)
                ├── section-routes.tsx Ürün bölümü/grup/kategori sayfalarının ortak kodu
                ├── catalog.ts        Katalog seviyeleri (bölüm › grup › kategori) ve konum satırı
                ├── i18n-client.tsx · seo.ts · geo.ts · menu.ts
                ├── quote-list.tsx · favourites.tsx · cart.tsx
                └── server/mail.ts    Resend ile e-posta gönderimi (yalnızca sunucuda)
```

---

## Veriler Nerede Saklanıyor?

Backend olmadığı için:

1. Uygulama açıldığında `packages/data` içindeki **başlangıç verisi** tarayıcının
   `localStorage`'ına yüklenir.
2. Yönetim panelinde yapılan her değişiklik ve sitede verilen sipariş, teklif,
   yorum gibi kayıtlar `localStorage`'a yazılır; sayfalar anında güncellenir.
3. Değişiklikler **yalnızca o tarayıcıda** görünür. Başka bilgisayarda görünmez.
4. Panelden yüklenen belge dosyaları (MSDS, sertifikalar…) tarayıcının ayrı
   dosya deposunda (IndexedDB) durur.

Backend gelene kadar panelde yapılan değişiklikler yalnızca o tarayıcıda kalır;
kalıcı veri için başlangıç (seed) dosyaları güncellenir.

**Veri sürümü (`DB_VERSION`):** `packages/data/src/index.ts`'tedir. Başlangıç
verisi ya da kayıtların yapısı değişince bir artırılır; artırılmazsa
tarayıcılarda eski veri kalır. Artırılınca tarayıcılardaki veri silinir ve
başlangıç verisiyle yeniden kurulur, yani panelde yapılmış değişiklikler de
gider.

Bütün kayıt türleri ve alanları: [docs/VERI-MODELI.md](docs/VERI-MODELI.md).

---

## Günlük Stok Güncelleme Akışı

1. `admin@zenweld.com` ile giriş → `Yönetim Paneli → Stok Matrisi`
2. Dosyayı gönderen bayiyi/satıcıyı seçin → **Dosya Yükle (CSV / XLSX)**
3. Önizlemeyi kontrol edin (tanınmayan kodları eşleştirin) → **Stoğu Güncelle**

Her dosya kaynağın tam listesidir; hatalı yükleme geri alınabilir. Son 3 gün
(panelden değiştirilir) içinde güncellenmeyen stok sitede gösterilmez.

```csv
SKU;Ürün Adı;Adet;Fiyat;Link
ZW30100000024-3M;Ultimate 250 MTC MIG Gazaltı Kaynak Makinesi (3 m);4;1.185.000,00;https://www.satici.com/urun/ultimate-250-mtc
ZW30100000072;ForceArc 200 MMA Elektrod Kaynak Makinesi;12;1.150.000,00;https://www.satici.com/urun/forcearc-200-mma
```

Link sütunu yalnızca online satıcılarda ve online mağazası olan bayilerde okunur.

Dosya biçimi, kurallar ve backend'e geçiş (tablolar, API): [docs/STOK.md](docs/STOK.md).

---

## Görseller

- **Ürünler:** Ekipmanların fotoğrafları sahibinden gelir
  (`apps/zenweld-web/public/images/products/<ürün linki>.webp`; soğutmalı
  üründe `-hava-sogutmali` / `-su-sogutmali` ekli). Fotoğrafı henüz olmayan
  ekipman, alt kategorisinin kart çizimini gösterir; eksikler
  [docs/YAPILACAKLAR.md](docs/YAPILACAKLAR.md) › Ürün fotoğrafları. Diğer
  bölümlerdeki 48 ürün genel bir Zenweld fotoğrafını kullanır
  (`zenweld-urun.webp`). Her ürünün fotoğrafı panelden de değiştirilebilir.
- **Blog, haber, etkinlik, Hakkımızda, Welders Club:** Unsplash bağlantıları
  (`packages/data/src/seed/images.ts`). Bunlar **gerçek Zenweld fotoğrafları
  değildir**, genel kaynak/sanayi fotoğraflarıdır.
- **Kategori ve grup kartları:** `apps/zenweld-web/public/images/categories/`.

`ProductImage` bileşeni, bir görsel yüklenemezse otomatik olarak **markalı SVG
placeholder**'a düşer — sitede hiçbir zaman kırık görsel görünmez.

Gerçek ürün fotoğraflarını eklemek için: `Yönetim Paneli → Ürünler → Düzenle →
Görseller` sekmesinden URL girin veya dosya yükleyin. Yüklenen görsel panelde
otomatik olarak küçültülür (en fazla 1,5 MB, gerekirse WebP); boyutla uğraşmanız
gerekmez.

---

## Canlıya Çıkış Notları

Bu proje bir sunum demosu olarak hazırlandı. Gerçek kullanıma almadan önce:

1. **Kimlik doğrulama sunucuya taşınmalı.** Şu an şifre karşılaştırması tarayıcıda
   yapılıyor ve `/yonetim` paneli tarayıcı tarafında korunuyor — bu gerçek bir
   güvenlik değildir. Supabase Auth, Auth0 veya kendi backend'iniz kullanılmalı.
2. **Veri gerçek bir veritabanına taşınmalı.** `packages/store/src/database.ts`
   içindeki okuma/yazma fonksiyonları değiştirilerek tüm uygulama aynı kalacak
   şekilde Supabase/Firebase/PostgreSQL'e bağlanabilir.
3. **Ürün içeriği ve fiyatlar girilmeli.** Ekipmanlar'daki ürünlerin adı, kodu,
   alt grubu, garantisi ve seçenekleri gerçektir; Force serisi 9 ürün dışında
   açıklama, teknik özellikler ve kutu içeriği örnektir; fotoğraflar örnektir,
   fiyatlar temsilidir (999.999 ₺ + KDV), 5 ürünün kodu geçicidir
   (`ZW-GECICI-…`).
   Aksesuar kalemleri de örnektir (`products.seed.ts` içinde `ORNEK`,
   `TEMSILI`, `DOGRULANMALI` notları). Ayrıntı:
   [docs/YAPILACAKLAR.md](docs/YAPILACAKLAR.md) › Ürün içeriği.
4. **Yasal metinler** (KVKK, gizlilik, iade, sözleşmeler…) şu an başlıkları
   hazır **taslaklardır**; hukuk danışmanının metinleriyle değiştirilmelidir.
5. **Örnek satış hareketleri silinmeli:** Panel grafikleri için üretilen örnek
   üye, sipariş, teklif, servis ve garanti kayıtları
   (`packages/data/src/seed/sample-activity.seed.ts`).
6. **Gerçek değerler girilmeli:** Kargo ücreti, banka POS'ları ve vade farkı
   oranları, IBAN'lar (Mağaza Ayarları'ndaki değerler örnektir).
7. **Ödeme kuruluşu bağlanmalı** (iyzico, PayTR ya da bankanın sanal POS'u);
   POS anahtarları yalnızca sunucuda tutulur.
8. **E-posta servisi tanımlanmalı:** Vercel'de `RESEND_API_KEY` ve
   `SUPPORT_FROM` (bkz. *Form e-postaları*).

Tam liste ve backend notları: [docs/YAPILACAKLAR.md](docs/YAPILACAKLAR.md).

---

## SEO

Sitede aşağıdakiler hazırdır:

- **Sayfa başlıkları ve açıklamaları** — ürün, kategori, blog ve içerik sayfalarının
  her biri kendi başlığını ve açıklamasını üretir
- **Dört seviyeli katalog** — Bölüm (`/ekipmanlar`, grup kartları) › Grup
  (`/ekipmanlar/kaynak-makineleri`, kategori kartları) › Kategori
  (`/ekipmanlar/kaynak-makineleri/mig-gazalti-...`, ürünler) › Ürün
  (`/urun/ultimate-250-mtc`). Katalog adresi menüdeki yolu izler; ürün adresi
  kısa ve kalıcıdır, ürün başka kategoriye taşınsa da değişmez. Her seviyede
  görünür konum satırı ve `BreadcrumbList` yapısal verisi var. Kart görselleri
  `public/images/categories/` klasöründedir (kategori/grup kaydındaki `image`);
  görseli olmayan kartta ilk ürünün fotoğrafı gösterilir. Gruplar ve
  kategoriler panelden yönetilir (Ürünler → Kategoriler): ad, sıra, kart görseli,
  sayfanın altındaki tanıtım metni ve SEO alanları.
- **`/sitemap.xml`** — aramada görünmesi istenen bütün sayfalar: ürün, bölüm,
  grup, kategori, blog, haber, etkinlik, kurumsal ve destek sayfaları. `packages/data`
  içindeki veriden otomatik üretilir. Son değişiklik tarihi yalnızca gerçek tarihi
  bilinen sayfalarda yazılır (ürün, blog, haber)
- **`/robots.txt`** — site haritasını bildirir (site aramaya açıkken); bkz. aşağıdaki *Arama motorlarına açık / kapalı*
- **`canonical`** — her sayfa kendi adresini asıl adres olarak bildirir
- **Open Graph / Twitter Card** — WhatsApp, LinkedIn ve X'te paylaşınca başlık,
  açıklama ve görselle düzgün önizleme çıkar
- **Yapısal veri (schema.org JSON-LD)** — `Product` (fiyat, SKU, stok durumu, marka,
  teknik özellikler), `BreadcrumbList`, `Organization`

### Site adresi

Adres sırasıyla `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik değişkeni →
`localhost` olarak çözülür. Vercel'de alan adını projeye bağlamanız yeterlidir;
başka bir sunucuda `NEXT_PUBLIC_SITE_URL` tanımlanır. Bu adres aynı zamanda
sitenin aramaya açılıp açılmayacağını belirler (aşağıya bakın).

### Form e-postaları

Sitedeki formlar (iletişim, bayilik, teklif, servis, garanti, yorum, üyelik,
sipariş, iade talebi, Welders Club, ürün destek sorusu) **info@zenweld.com**'a Resend
üzerinden e-posta gönderir (`apps/zenweld-web/src/lib/server/mail.ts`,
`app/api/bildirim`). Vercel'de tanımlanacak değişkenler:

| Değişken | Açıklama |
|---|---|
| `RESEND_API_KEY` | resend.com anahtarı; yoksa e-posta gönderilmez |
| `SUPPORT_EMAIL` | (isteğe bağlı) alıcı, varsayılan info@zenweld.com |
| `SUPPORT_FROM` | (isteğe bağlı) doğrulanmış gönderici adresi |

Anahtar yoksa demo adresinde formlar başarılı görünür; canlıda yalnızca
e-postayla giden formlar ziyaretçiye hata gösterir.

### Arama motorlarına açık / kapalı

Site **varsayılan olarak arama motorlarına kapalıdır.** Yalnızca gerçek alan
adında (`zenweld.com` veya `www.zenweld.com`) yayındayken açılır; bunun için
ayrıca bir ayar yapmak gerekmez. Demo `vercel.app` adresi, Vercel önizleme
sürümleri ve `localhost` her zaman kapalıdır. Liste `apps/zenweld-web/src/lib/seo.ts`
içindeki `INDEXABLE_HOSTS`'tadır; gerçek alan adı farklıysa (örn. `zenweld.com.tr`)
oraya eklenmelidir.

Kapalıyken her sayfaya `<meta name="robots" content="noindex, nofollow">`
eklenir ve site haritası `robots.txt`'de bildirilmez.

`robots.txt` gizli sayfaları **engellemez**, bilerek: Google sayfayı tarayamazsa
`noindex` etiketini de göremez ve adresi başka kaynaktan bulursa yine
indeksleyebilir. Bu yüzden yalnızca `/api/` kapalıdır.

Site açıkken de her zaman `noindex` olan sayfalar: yönetim paneli (etiket +
`X-Robots-Tag` başlığı), giriş, kayıt, şifremi unuttum, hesabım, arama, çıkış,
sepet, ödeme ve yasal metinler (taslak oldukları için). Bu sayfalar site
haritasına da girmez.

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
MiniSearch · Leaflet + OpenStreetMap · lucide-react · ESLint · Vitest · Playwright · npm workspaces
