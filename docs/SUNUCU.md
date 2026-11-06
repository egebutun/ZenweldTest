# Sunucu — Nasıl Çalışır, Neye Bağlanır

Bu dosya sitenin sunucu tarafını anlatır: dış servisler (e-posta, ödeme,
SAP, harita, dosya deposu) ve hangi ayarları istedikleri, sunucunun
veritabanından nasıl okuyup yazdığı, panelin işlemleri, zamanlanmış işler,
betikler ve komutlar.

- **Demo modunda** sunucu yalnızca e-postaları gönderir (`/api/bildirim`,
  `/api/bayilik`, `/api/destek`); bütün veri tarayıcıdadır.
- **Veritabanı modunda** (`DATA_SOURCE=database`, KARARLAR K-88) site,
  üyelik, siparişler, formlar ve panelin bütün işlemleri sunucudan,
  veritabanından yapılır. İki modun farkları:
  [README](../README.md) › Demo ve veritabanı modu.

**Güvenlik kuralı:** Bütün anahtarlar ve şifreler (e-posta servisi, ödeme
kuruluşu, POS, SAP, dosya deposu) yalnızca **sunucuda ortam değişkeni**
olarak tutulur. Panelde, veritabanında, tarayıcıda ya da depoda (GitHub)
**asla** durmaz.

İlgili dosyalar:

- Tablolar ve kolonlar: [VERITABANI.md](VERITABANI.md)
- Hesap kuralları (fiyat, taksit, stok, kupon, form e-postaları):
  [IS-KURALLARI.md](IS-KURALLARI.md)
- Kurulum ve çalıştırma: [README](../README.md)
- Canlıya çıkmadan yapılacaklar: [YAPILACAKLAR.md](YAPILACAKLAR.md)

---

## İçindekiler

1. [Özet: dış bağlantılar](#1-özet-dış-bağlantılar)
2. [Ortam değişkenleri](#2-ortam-değişkenleri)
3. [Barındırma, zamanlanmış işler ve güvenlik başlıkları](#3-barındırma-zamanlanmış-işler-ve-güvenlik-başlıkları)
4. [Kod, geçiş betikleri ve komutlar](#4-kod-geçiş-betikleri-ve-komutlar)
5. [Örnek veri ve veri yükleme](#5-örnek-veri-ve-veri-yükleme)
6. [Okuma ve önbellek](#6-okuma-ve-önbellek)
7. [Üyelik](#7-üyelik)
8. [Siparişler ve ödeme](#8-siparişler-ve-ödeme)
9. [Formlar ve e-posta](#9-formlar-ve-e-posta)
10. [Panel](#10-panel)
11. [SAP](#11-sap)
12. [Görseller ve dosyalar](#12-görseller-ve-dosyalar)
13. [Haritalar ve bağlantılar](#13-haritalar-ve-bağlantılar)
14. [Kullanılan kütüphaneler](#14-kullanılan-kütüphaneler)
15. [Henüz bağlanmayanlar](#15-henüz-bağlanmayanlar)

---

## 1. Özet: dış bağlantılar

| Konu | Bugün | Canlı için |
|---|---|---|
| Veritabanı | PostgreSQL tabloları ve veritabanı modunun bütün kodu hazır; yayındaki site demo modunda | Canlı veritabanı (PostgreSQL 18) ve sunucu; BT ekibi sağlar (K-92) |
| E-posta (Resend) | Kodu hazır; anahtar tanımlı olmadığı için **bugün hiçbir e-posta gitmiyor** | Resend hesabı, `zenweld.com` DNS doğrulaması, anahtar ve gönderici adresi |
| Kartla ödeme | Temsili (para çekilmez); ödeme sağlayıcısı parçası hazır (K-108) | Ödeme kuruluşu ya da banka sanal POS'u |
| Havale / EFT | Elle onay (panelde "Ödeme Alındı") | Aynı kalabilir; istenirse banka hareketi entegrasyonu |
| SAP depo stoğu | Okuma işi hazır; SAP yerine deneme dosyasını okuyor | SAP bağlantısı ve zamanlayıcı |
| SAP'a sipariş | Aktarım sırası hazır; SAP yerine deneme dosyasına yazıyor | SAP sipariş API'si ve zamanlayıcı |
| Dosya deposu | Demo modunda tarayıcı; veritabanı modunda sunucunun diski (`DOSYA_KLASORU`; K-108) | Deponun yeri ve yedeği (BT); istenirse nesne deposu |
| Bayi haritası | **Bağlı** (Leaflet + OpenStreetMap) | Trafik artarsa ticari harita sağlayıcısı değerlendirilmeli |
| Ofis haritası ve yol tarifi | **Bağlı** (Google Haritalar gömme ve bağlantı; anahtar gerekmez) | — |
| Telefon, WhatsApp, e-posta, sosyal medya | **Bağlı** (bağlantılar ve paylaşım önizlemesi) | — |
| Bülten, müşteriye e-posta, analitik, e-Fatura, kargo API'si | Yok | [15](#15-henüz-bağlanmayanlar) |

---

## 2. Ortam değişkenleri

Örnek dosya `apps/zenweld-web/.env.example`'dır. Bilgisayarda aynı klasöre
`.env.local` adıyla kopyalanıp doldurulur (`.env.local` GitHub'a
gönderilmez); sunucuda ortam değişkeni olarak tanımlanır (demoda Vercel ›
Project Settings › Environment Variables). **Kural:** Koda yeni bir değişken
eklendiğinde ya da biri kaldırıldığında bu tablo ve `.env.example` birlikte
güncellenir (`.env.example`'a gerçek değer yazılmaz).

| Değişken | Kim tanımlar | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yönetici | Sitenin adresi (ör. `https://zenweld.com`). Canonical adresler, site haritası, paylaşım önizlemesi, şifre sıfırlama bağlantısı ve **arama motorlarına açıklık** buna göre belirlenir |
| `RESEND_API_KEY` | Yönetici (gizli) | E-posta servisi anahtarı; yoksa e-posta gönderilmez |
| `SUPPORT_EMAIL` | Yönetici | Zenweld'e giden e-postaların varsayılan alıcısı; yoksa `info@zenweld.com`. Veritabanı modunda tür başına panelden değişir; alıcısı yazılmayan tür buraya gider (K-104) |
| `SUPPORT_FROM` | Yönetici (canlıda zorunlu) | Resend'de doğrulanmış gönderici adresi (ör. `Zenweld Web <web@zenweld.com>`). Yoksa Resend'in deneme adresi (`onboarding@resend.dev`) kullanılır; gerçek kullanım için uygun değildir |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Yönetici (isteğe bağlı) | Panel ileride ayrı bir adrese (ör. `admin.zenweld.com`) taşınırsa ana sitenin adresi; paneldeki "Sayfayı gör" bağlantıları bunu kullanır. Bugün gerekmez |
| `DATABASE_URL` | Yönetici (gizli) | Veritabanı (PostgreSQL) bağlantı adresi. `npm run db:*` komutları ve `DATA_SOURCE=database` ise site kullanır |
| `DATA_SOURCE` | Yönetici | Sitenin veri kaynağı (KARARLAR K-88). Boşsa demo modu (veri tarayıcıda). `database` ise veritabanı modu: site, üyelik, siparişler, formlar ve panel veritabanından okur ve yazar ([6](#6-okuma-ve-önbellek)). Derlemede de okunur: değiştirince yeniden derlenir, derleme sırasında veritabanına erişilebilmelidir. Ayar tarayıcı paketine de yazılır (`NEXT_PUBLIC_DATA_SOURCE`, elle tanımlanmaz) |
| `REVALIDATE_SECRET` | Yönetici (gizli) | Siteyi beklemeden yenileme anahtarı. Tanımlıysa `/api/yenile` ucu açılır; `npm run site:yenile` aynı anahtarla siteyi o anda yeniler. Boşsa uç kapalıdır. Panel ve SAP stok okuma işi siteyi kendi içinden yeniler, bu anahtara ihtiyaç duymaz |
| `CRON_SECRET` | Yönetici (gizli) | Zamanlanmış işlerin anahtarı. Tanımlıysa SAP stok okuma (`/api/sap/stok`) ve SAP sipariş aktarımı (`/api/sap/siparis`) uçları açılır; zamanlayıcı, `npm run sap:stok` ve `npm run sap:siparis` bu anahtarla çağırır. Boşsa uçlar kapalıdır |
| `ODEME_SAGLAYICI` | Yönetici | Kartla ödemenin sağlayıcısı (K-108). Boşsa `temsili` (para çekilmez, sipariş ödenmiş sayılır; K-97). Ödeme kuruluşu bağlanınca onun adı yazılır (ör. `iyzico`); bilinmeyen ad yazılırsa sipariş alınmaz ve sunucu hata verir. Kuruluşun anahtarları ayrı değişkenlerde, yalnızca sunucuda durur |
| `DOSYA_KLASORU` | Yönetici | Panelde yüklenen görsel ve belgelerin yazıldığı klasör (dosya deposu, K-108). Göreli yol sitenin klasörüne (`apps/zenweld-web`) göredir; sunucunun yedeğine eklenmeli. Boşsa veritabanı modunda panelde dosya yüklenmez, adres girilir |
| `SAP_STOK_DOSYASI` | Yönetici / geliştirici | SAP bağlanana kadar depo stoğunun okunacağı deneme dosyası (CSV; örnek `packages/db/deneme/sap-stok.csv`). Göreli yol sitenin klasörüne göredir. Boşsa ve SAP bağlantısı da yoksa okuma işi çalışmaz |
| `SAP_SIPARIS_DOSYASI` | Yönetici / geliştirici | SAP bağlanana kadar SAP'a aktarılan siparişlerin yazılacağı deneme dosyası (her satıra bir sipariş, JSON; K-108). Göreli yol sitenin klasörüne göredir. Boşsa ve SAP bağlantısı da yoksa aktarım işi çalışmaz, siparişler sırada bekler |
| `NEXT_DIST_DIR` | Otomatik (test) | Derleme klasörü; boşsa `.next`. Yalnızca veritabanı modunun testleri (`npm run test:e2e:db`) `.next-db` kullanır, demo derlemesi bozulmaz |
| `SITE_URL` | Geliştirici | Yalnızca `npm run site:yenile`, `npm run sap:stok` ve `npm run sap:siparis`: sitenin adresi; boşsa `NEXT_PUBLIC_SITE_URL`, o da boşsa `http://localhost:3000` |
| `TEST_DATABASE_URL` | Geliştirici | Yalnızca veritabanı testleri (`npm run test:db`, `test:e2e:db`); her çalıştırmada silinip baştan kurulur, `DATABASE_URL` ile aynı olamaz |
| `NEXT_PUBLIC_BUILD_TIME` | Otomatik (derleme) | Derleme anı; sunucu çıktısı ile tarayıcının ilk çiziminin aynı anı kullanması için |
| `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` | Otomatik (yalnızca demo, Vercel) | Site adresi tanımlı değilse yedek; önizleme sürümleri her zaman aramaya kapalı. Canlıda yoktur (K-92) |

**Site adresi sırası:** `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik
değişkenleri → `http://localhost:3000`.

---

## 3. Barındırma, zamanlanmış işler ve güvenlik başlıkları

**Barındırma:** Bugün demo Vercel'de yayında. Canlı: kendi sunucumuz ve
kendi alan adımız (KARARLAR K-92). Proje standart bir Next.js projesidir;
her Node.js sunucusunda `npm run build` + `npm start` ile çalışır.

- Node.js: 22 (`.nvmrc`); en az 20 (`package.json` › `engines`).
- Sunucunun yeri (KVKK), kurulumu ve demo Vercel'den kalkınca kaldırılacak
  parçalar: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Canlı sunucu.
- **Panel** sitenin içinde `/yonetim` adresinde çalışır; ayrı bir proje ya
  da alan adı yoktur. Arama motorlarına her zaman kapalıdır (sayfa etiketi
  ve `X-Robots-Tag` başlığı).
- **Arama motorlarına açıklık:** Site yalnızca `zenweld.com` ve
  `www.zenweld.com` adreslerinde aramaya açıktır. Gerçek alan adı farklıysa
  `apps/zenweld-web/src/lib/seo.ts` › `INDEXABLE_HOSTS` listesine eklenmeli
  ([IS-KURALLARI.md › 13](IS-KURALLARI.md#13-linkler-yönlendirme-ve-arama-motorları)).

**Zamanlanmış işler:** İki iş var; ikisi de sitenin ucudur (POST,
`Authorization: Bearer <CRON_SECRET>`). Canlı sunucunun zamanlayıcısına
(cron) birer satır eklenir (K-92). Sunucu şirket ağına (VPN) bağlıysa SAP
internete açılmadan okunur ve yazılır.

1. **SAP depo stoğu okuma**, 15 dakikada bir (KARARLAR K-84;
   [SAP stok okuma](#sap-stok-okuma)):

   `*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://zenweld.com/api/sap/stok`

   Uç başarılı okumada 200, okunamayan ya da yarım okumada 502 (son stok
   kalır), kaynak tanımlı değilse 503 döner; zamanlayıcının kaydında
   başarısız görünür.
2. **SAP'a sipariş aktarımı**, birkaç dakikada bir (KARARLAR K-108;
   [SAP sipariş aktarımı](#sap-sipariş-aktarımı)). Sıklığı SAP ekibiyle
   kesinleşir ([YAPILACAKLAR.md › Şirketten öğrenilecekler](YAPILACAKLAR.md#3-şirketten-öğrenilecekler-kişiye-göre) › SAP danışmanı):

   `*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://zenweld.com/api/sap/siparis`

   Uç 200 ile gönderilen, yeniden denenecek, başarısız ve atlanan
   siparişlerin numaralarını döndürür; aktarıcı tanımlı değilse 503.
   Gönderilemeyen sipariş işi durdurmaz, kendi sırasında yeniden denenir;
   deneme hakkı biten sipariş panelde görünür.

Henüz zamanlanmamış işler: süresi dolan havaleleri iptal (bugün sayfa
açılınca çalışır), işlem kaydının 2 yıldan eskisini silme
(`purge_audit_log()`), kampanya başlangıç/bitişinde ürün sayfasını yenileme
([15](#15-henüz-bağlanmayanlar)).

**Güvenlik başlıkları:** Her yanıta eklenir (`apps/zenweld-web/next.config.mjs`).

| Başlık | Ne yapar |
|---|---|
| `Content-Security-Policy` | Sayfanın hangi adreslerden kod, görsel, çerçeve yükleyebileceğini ve formun nereye gönderilebileceğini belirler |
| `Strict-Transport-Security` | Tarayıcı siteye bir yıl boyunca yalnızca https ile bağlanır. Alt alan adlarını kapsamaz |
| `X-Frame-Options: DENY` | Site başka bir sitenin içinde (çerçevede) açılamaz |
| `X-Content-Type-Options: nosniff` | Tarayıcı dosya türünü tahmin etmez |
| `Referrer-Policy` | Dış sitelere yalnızca alan adı gider, sayfa yolu gitmez |
| `Permissions-Policy` | Kamera, mikrofon, ödeme ve USB kapalı; konum yalnızca sitenin kendisine açık (bayi ağı sayfasındaki **Konumumu Kullan**) |

Güvenlik politikasının (CSP) bugün izin verdiği dış adresler:

- **Görseller:** her `https` adresi (panelden herhangi bir görsel adresi
  girilebildiği için; harita döşemeleri ve Unsplash dahil), ayrıca
  tarayıcıda tutulan yüklenmiş görseller (`data:`, `blob:`).
- **Çerçeve:** `maps.google.com` ve `www.google.com` (iletişim sayfasındaki
  harita).
- **Kod, bağlantı (istek), yazı tipi:** yalnızca sitenin kendisi. E-posta
  servisine sunucu bağlandığı için tarayıcıya izin gerekmez.

**Kural:** Siteye yeni bir dış servis eklendiğinde (analiz kodu, video,
sohbet aracı, ödeme sayfası, başka bir harita) adresi `next.config.mjs`
içindeki politikaya da yazılmalıdır; yazılmazsa tarayıcı servisi engeller ve
konsolda "Content Security Policy" uyarısı çıkar.

---

## 4. Kod, geçiş betikleri ve komutlar

**Kod:** `packages/db`

| Yer | İçerik |
|---|---|
| `src/schema/` | Tabloların tanımı (Drizzle ORM), konuya göre dosyalar: `catalog`, `network` (bayi, satıcı, stok), `users`, `sales` (teklif, sipariş, kargo gönderisi, iade), `coupons`, `sap` (depo stoğu), `support` (servis, garanti, yorum), `content`, `settings` (ayarlar, POS, banka, kargo firmaları), `forms` (bayilik, destek mesajları, Welders Club), `system` (e-postalar, numaralar, değişiklik kaydı) |
| `migrations/` | Geçiş betikleri (aşağıda) |
| `src/client.ts` | Bağlantı (`DATABASE_URL`) |
| `src/migrate.ts` | Betikleri çalıştırma ve sıfırlama |
| `src/seed.ts` | Örnek veriyi tablolara çevirme ve yazma (`npm run db:seed`) |
| `src/load.ts` | Bugünkü veriyi canlı ya da deneme veritabanına yükleme (`npm run db:yukle`) |
| `src/read.ts` | Okuma katmanı: tablolardaki kayıtları sitenin kayıt yapısına çevirir ([6](#6-okuma-ve-önbellek)) |
| `src/orders.ts`, `src/payment.ts` | Siparişler ve ödeme sağlayıcısı ([8](#8-siparişler-ve-ödeme)) |
| `src/forms.ts` | Formlar ve e-posta kaydı ([9](#9-formlar-ve-e-posta)) |
| `src/admin-*.ts`, `src/audit.ts`, `src/panel.ts`, `src/links.ts` | Panelin okuma ve yazma işlemleri ([10](#10-panel)) |
| `src/sap-stock.ts`, `src/sap-orders.ts` | SAP stok okuma ve sipariş aktarımı ([11](#11-sap)) |
| `src/file-storage.ts` | Dosya deposu ([12](#12-görseller-ve-dosyalar)) |
| `src/codes.ts` | Kayıt numarası (`nextRecordCode`; sipariş, iade, teklif, servis) |
| `packages/auth/src/server/` | Şifre özeti, oturumlar, hesap verisi (yalnızca sunucu, `@zenweld/auth/server`; [7](#7-üyelik)) |
| `packages/auth/scripts/create-admin.ts` | Yönetici hesabı açma (`npm run yonetici:olustur`) |
| `deneme/sap-stok.csv` | SAP yerine okunan örnek stok dosyası (50 kalem, 3'ü stoksuz) |

### Geçiş betikleri

`packages/db/migrations/`. Sırayla ve bir kez çalışır; hangilerinin
çalıştığı veritabanında tutulur (`drizzle.__drizzle_migrations`). Aynı
betikler bilgisayarda, testte, deneme ve canlı sunucuda aynı sonucu verir.
Çalışmış bir betik değiştirilmez; şema değişince `npm run db:generate` yeni
betik üretir ve [VERITABANI.md](VERITABANI.md) aynı commit'te güncellenir.

| Betik | İçerik |
|---|---|
| `0000_kurulum.sql` | Tabloları kuran betik; şemadan üretilir |
| `0001_kurallar.sql` | Tablo tanımıyla ifade edilemeyen kurallar; elle yazılır (aşağıda) |
| `0002_kaldirilanlar.sql`, `0003_stok-kargo-kupon-formlar.sql` | 2026-11-02 eklemeleri: `form_submissions` ve siparişteki kargo kolonları kaldırıldı; SAP depo stoğu, kargo, kupon ve form tabloları eklendi. Kaldırma ve ekleme ayrı betiktedir (betik üretici, aynı betikte "ad mı değişti" diye sorar) |
| `0004_kupon-satir-payi.sql` | Sipariş satırına kupon payı (`order_items.coupon_discount`) |
| `0005_kisiye-ozel-kupon.sql` | Kişiye özel kupon: `coupons.audience` ve `coupon_customers` |
| `0006_giris-deneme-siniri.sql` | Yanlış şifre sınırı: `users.failed_login_count`, `failed_login_since`, `login_locked_until` (K-94) |
| `0007_e-posta-turu-sifre-sifirlama.sql` | `email_log.type` müşteriye giden şifre sıfırlama e-postasını da kabul eder (`sifre-sifirlama`) |
| `0008_welders-club-pasif.sql` | `welders_club_signups`'a `left_at` (pasife alınma) ve `updated_at` (panelde aynı kayıt koruması; K-100) |
| `0009_ayar-sirket-bilgileri.sql` | `settings.key` `company` değerini de kabul eder (Şirket ve İletişim, K-105) |
| `0010_sap-siparis-aktarimi.sql` | `sap_order_exports`: SAP'a sipariş aktarım sırası (K-108) |

**Veritabanındaki kurallar** (`0001_kurallar.sql`):

| Ad | Ne yapar |
|---|---|
| `products_sku`, `product_variants_sku` (tetikleyici) | Ürün ve varyant kodunu `sku_codes`'a yazar; kod kullanılıyorsa kaydı reddeder ("Ürün kodu başka bir üründe ya da seçenekte kullanılıyor") |
| `zw_normalize_sku()` | Kodu karşılaştırma biçimine çevirir (boşluksuz, büyük harf) |
| `*_redirects` (tetikleyici), `zw_delete_redirects` | Ürün, kategori, grup, blog, haber ya da etkinlik silinince eski linklerini siler; varyant silinince ona yönlenen eski ürün linkini siler |
| `product_filter_values_category`, `products_category_moved` (tetikleyici) | Ürüne yalnızca kendi kategorisinin filtre değeri işaretlenir; ürün başka kategoriye taşınınca eski değerler silinir |
| `audit_log_guard`, `audit_log_no_truncate` (tetikleyici) | Değişiklik kaydı değiştirilemez ve silinemez |
| `purge_audit_log()` | 2 yıldan eski değişiklik kayıtlarını siler; silinen sayıyı döndürür. Canlıda her gün çalıştırılmalı ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Veriyi canlıya taşıma) |
| `next_record_number(önek)` | Kayıt numarasını tek işlemde artırıp döndürür (`next_record_number('TKL-2026-')` → 50) |

**Kayıt katmanının sağladıkları** (veritabanında değil, sunucu kodunda):
üyenin tam bir varsayılan adresi olması (`packages/auth/src/server/account-data.ts`),
son aktif yöneticinin silinememesi, anasayfa yorum şeridinde en fazla 10
yorum, eski link yeni bir kaydın linki olunca yönlendirmenin silinmesi,
varyantın ürünün her seçeneğinden tam bir değer alması.

**Komutlar** (kurulum: [README](../README.md) › Veritabanı):

| Komut | Ne yapar |
|---|---|
| `npm run db:migrate` | Henüz çalışmamış betikleri çalıştırır |
| `npm run db:reset` | Bilgisayardaki veritabanını silip tabloları baştan kurar; yalnızca `localhost` adresinde çalışır |
| `npm run db:seed` | Sitenin örnek verisini boş veritabanına yükler; yalnızca `localhost` adresinde çalışır ([5](#5-örnek-veri-ve-veri-yükleme)) |
| `npm run db:yukle <canli\|deneme> [guncelle]` | Bugünkü veriyi canlı ya da deneme veritabanına yükler; varsayılan yalnızca eksik kayıtları ekler; bilgisayar dışındaki veritabanında onay ister ([Veri yükleme](#veri-yükleme)) |
| `npm run db:generate` | Şema değişince yeni geçiş betiği üretir |
| `npm run db:studio` | Tabloları tarayıcıda gösterir (Drizzle Studio); veriler bilgisayardaki veritabanından gelir |
| `npm run test:db` | Veritabanı testleri (`tests/db`); test veritabanını her seferinde baştan kurar. Tablo listesinin ve kolonların VERITABANI.md ile aynı olduğunu da dener: belgeye yazılmayan bir tablo ya da kolon eklenirse test düşer |
| `npm run test:e2e:db` | Sitenin veritabanı modunda tarayıcı testleri (`tests/e2e-db`, `scripts/e2e-db.mts`): test veritabanını baştan kurup örnek veriyi yükler, siteyi `.next-db`'ye derler, testleri çalıştırır |
| `npm run yonetici:olustur` | Panel için yönetici hesabı açar ya da var olan yöneticinin şifresini değiştirir ([7](#7-üyelik)) |
| `npm run site:yenile [tür]` | Çalışan siteyi beklemeden yeniler (`REVALIDATE_SECRET`; türler: katalog, depo-stogu, stok, bayiler, yorumlar, icerik) |
| `npm run sap:stok [zorla]` | SAP depo stoğunu beklemeden bir kez okutur (sitenin `/api/sap/stok` ucunu çağırır). `zorla`: yarım okuma korumasına takılan okumayı uygular |
| `npm run sap:siparis` | Sıradaki siparişleri beklemeden SAP'a gönderir (sitenin `/api/sap/siparis` ucunu çağırır) |

---

## 5. Örnek veri ve veri yükleme

### Örnek veri (`npm run db:seed`)

`src/seed.ts`. Sitenin demo modunda tarayıcıda kurduğu örnek verinin
tamamı (`packages/data` › `createSeedDatabase`; ürünler, kategoriler,
bayiler ve stokları, üyeler, siparişler, teklifler, kuponlar, içerik,
ayarlar) tablolara yazılır. Ne yazıldığı tablo tablo ekrana basılır.

- Yalnızca **boş** veritabanına yüklenir (`products` boş değilse durur:
  önce `npm run db:reset`) ve yalnızca bilgisayarda (`localhost`) çalışır.
  Örnek üye ve siparişler içerdiği için canlı ya da deneme sunucusuna
  yüklenmez; onlar için `npm run db:yukle`.
- Tek işlemde yazılır; bir satır kurala takılırsa hiçbir şey yazılmaz.
- Eşleme [VERITABANI.md › 2](VERITABANI.md#2-tarayıcıdaki-veri-ile-tablolar-arasındaki-farklar)'ye göredir. Ayrıca:
  - Silinmiş bir ürüne ya da üyeye bağlı kopya kayıtlarda (teklif ve
    sipariş satırı, yorum, servis, garanti) bağ boş kalır; ad ve kod
    kopyası durur.
  - Kargo firmalarının kimliği adından üretilir (`Yurtiçi Kargo` →
    `yurtici-kargo`); siparişin kargo bilgisi `shipments`'a gider.
  - Zenweld depo stoğu tek bir başarılı SAP okuması (`sap_sync_runs`)
    olarak yazılır.
  - Örnek üyelerin şifre özeti demodaki basit özettir (`zw1$…`); ilk
    girişte güçlü özete (argon2id) çevrilir ([Şifre ve oturum](#şifre-ve-oturum)).
- Test (`tests/db/ornek-veri.test.ts`): yükleme hatasız, tablolardaki satır
  sayıları veriyle aynı; başlıca bağlar (ürün → kategori → grup, varyant
  değerleri, sipariş ve kargo, kupon kapsamı, depo stoğu).

### Veri yükleme

`npm run db:yukle`, `src/load.ts`; KARARLAR K-90, K-91. Sitenin bugünkü
verisi (`packages/data` › `createSeedDatabase`) canlı ya da deneme
veritabanına yazılır. Tablolar önce `npm run db:migrate` ile kurulur;
kurulmamışsa komut bunu söyler. Bağlantı `DATABASE_URL`'dir.

| Kayıtlar | `canli` | `deneme` |
|---|---|---|
| Katalog (gruplar, kategoriler, seçenekler, filtreler, ürünler, eski linkler), içerik (blog, haber, etkinlik, SSS, yasal metinler, Hakkımızda, Sayfa SEO, belge sayfaları, satış temsilcileri), mağaza ayarları (POS, havale hesapları, kargo firmaları, ayarlar), bayiler, satıcılar, Zenweld depo stoğu | Yüklenir | Yüklenir |
| Örnek yorumlar, kuponlar (kapsam ve kişiye özel e-postalarıyla), bayi ve satıcı stok listeleri ve yükleme geçmişi | — | Yüklenir |
| Demo hesaplar ve örnek üyeler, adresler, teklifler, siparişler, iadeler, kupon kullanımları, servis talepleri, garantiler, kayıt numarası sayaçları | — | — |

- **Eşleme:** `db:seed` ile aynı (`seedTables`). Yorumlar üyeye bağlanmaz
  (üyeler yüklenmez). Depo stoğu bir SAP okuması sayılmaz:
  `sap_sync_runs`'a satır yazılmaz, `sync_run_id` boş kalır.
- **Tekrar çalıştırılabilir:** Kayıt birincil anahtarıyla eşleşir.
  Varsayılan olarak yalnızca olmayan kayıt eklenir; kimliği ya da benzersiz
  bir alanı (kod, ad, link) var olan satır atlanır ("zaten var"). Panel
  veritabanına yazdığı için paneldeki değişikliklerin üzerine
  yazılmasın diye varsayılan budur.
- **Hiçbir kayıt silinmez:** Veriden çıkarılmış ya da veritabanına başka
  yoldan eklenmiş kayıt (üye, sipariş, panelden eklenen içerik) olduğu gibi
  kalır. Ürün başka kategoriye taşınırsa eski kategorinin filtre değerlerini
  veritabanının kendi kuralı siler (`products_category_moved`).
- **`guncelle`:** Olan kayıt veriden farklıysa güncellenir, aynıysa
  yazılmaz ("değişmeyen"). Panelde yapılan değişiklikler kaybolur; komut
  bunu ekrana yazar. Veride bulunmayan bir "son değişiklik" kolonu
  (`updated_at`) güncellenen satırda o anın zamanını alır. Eski yazım
  `eksikler` artık kabul edilmez (varsayılan zaten odur).
- **Stok üzerine yazılmaz:** Depo stoğu, bayi ve satıcı stokları, yükleme
  geçmişi ve kod eşlemeleri her iki şekilde de yalnızca eksikse eklenir;
  depo stoğunu SAP okuma işi, bayi stoğunu bayinin dosyası günceller.
- **Tek işlem:** Bir satır kurala takılırsa (ör. aynı ürün kodu
  veritabanında başka bir üründe) hiçbir şey yazılmaz; hata ekrana basılır.
- **Onay:** Adres `localhost` değilse veritabanının adı yazılarak onay
  verilir; terminal dışından (otomatik) çalıştırılırsa durur.
- Ne yapıldığı tablo tablo basılır (eklenen, güncellenen, değişmeyen).
  Deneme verisindeki kuponların tarihleri yükleme anına göre verildiği
  için her yüklemede güncellenir. Site değişikliği en geç bir dakikada
  gösterir; hemen görmek için `npm run site:yenile`.
- Test (`tests/db/yukleme.test.ts`): canlı yüklemede veritabanı okununca
  bugünkü veriyle (satış hareketleri, örnek yorum, kupon ve bayi stoğu
  hariç) birebir aynı; deneme yüklemesi; tekrar çalıştırınca değişiklik
  olmaması; güncelleme ve ekleme, silmeme; `eksikler`; stoğun üzerine
  yazılmaması; çakışmada anlaşılır hata.

---

## 6. Okuma ve önbellek

**Okuma katmanı (`src/read.ts`):** Tablolardaki kayıtları sitenin
kullandığı kayıt yapısına (`packages/data` › `types.ts`) çevirir; örnek
veriyi yazan `seed.ts`'in tersidir. Site ve panel böylece kendi kurallarını
(`packages/data`, `packages/store`) değiştirmeden veritabanındaki veriyle
çalışır.

- Her kayıt türü ayrı fonksiyonla okunur: katalog (gruplar, kategoriler,
  seçenekler, ürünler), bayiler, satıcılar, stok, depo stoğu, ayarlar,
  üyeler, teklifler, siparişler, iadeler, kuponlar, servis/garanti/yorum,
  içerik, kayıt numaraları. Site sayfaları yalnızca gerekenleri okur;
  `readDatabase` hepsini birleştirir (panel ve test için).
- Boş kolon alana yazılmaz; tarih-saatler ISO metin (UTC) olarak döner.
- Silinmiş ürüne ya da üyeye bağlı kopya kayıtlarda (sipariş ve teklif
  satırı, yorum, servis, garanti) kimlik boş metin (`""`) olur; ad ve kod
  kopyası durur.
- Kayıt verisinin bilerek farklı tutulduğu iki yer: eski blog yazısında
  "yayında" alanı yoksa yayında sayılır; kupon kullanımının kimliği
  veritabanında sıra numarasıdır.
- Sorgular sırayla çalışır (işlem içinde tek bağlantı kullanılır).
- Sitenin sayfaya özel okumaları: `readProductStock` (bir ürünün adedi
  0'dan büyük bayi ve satıcı stok satırları; `dealer_stock_product` ve
  `retailer_stock_product` dizinlerini kullanır) ve `readPublishedReviews`
  (onaylı yorumlar: bir ürünün ya da anasayfada öne çıkanlar; onay
  bekleyen siteye gitmez).
- `readOrders`, `readReturnRequests`, `readCoupons`, `readQuotes`,
  `readServiceRequests`, `readWarranties` isteğe bağlı bir koşulla yalnızca
  ilgili kayıtları okur (ör. bir üyenin siparişleri, bir kuponun
  kullanımları).
- Test (`tests/db/okuma.test.ts`): örnek veri yazılıp geri okununca, kayıt
  türü başına birebir aynı çıkar (gidiş-dönüş); katalog ve mağaza ayarları
  tek başına da okunur; ürün stoğu yalnızca o ürünün stoktaki satırlarını,
  yorumlar yalnızca onaylıları döndürür.

**Sitede kullanımı** (`apps/zenweld-web/src/lib/server/catalog.ts`):

- Katalog, depo stoğu ve mağaza ayarları her sayfaya; bayiler, bayi ve
  satıcı stoğu ve yorumlar yalnızca gereken sayfaya (ürün sayfası, Bayi
  Bul, anasayfa) gider. Pasif bayi ve satıcılar ile satıcıların fiyatı
  tarayıcıya gönderilmez. Sayfanın başlığı, yapısal verisi, site haritası
  ve derlemede hazırlanan sayfa listesi de katalogdan üretilir.
- İçerik (`readContent`; `apps/zenweld-web/src/lib/server/content.ts`):
  blog, haber, etkinlik, SSS, yasal metinler, Hakkımızda, satış
  temsilcileri, belge sayfaları ve `page_seo`. Her sayfada kullanılan
  kısım (alt bilgideki yasal linkler, aramadaki blog/haber/etkinlik, SSS,
  sayfa başlıkları) sayfa çerçevesiyle gider; yasal metnin ve blog
  yazısının gövdesi, Hakkımızda, temsilciler, belgeler ve sipariş
  sözleşmeleri yalnızca kendi sayfasına. Yayından kaldırılan kayıtlar ve
  pasif temsilciler tarayıcıya gitmez. Sabit sayfaların başlığı
  `lib/server/page-metadata.ts` ile `page_seo`'dan okunur.
- Teklif, garanti ve servis kayıtları sitede önbelleksiz okunur.

**Önbellek ve yenileme (K-88):** Okunan veri 30 saniye önbellekte tutulur ve
sayfalar 30 saniyede bir yeniden hazırlanır (değişiklik en geç bir dakikada
görünür). Tek önbellek kaydı en fazla 2 MB tutar; bugün katalogun tamamı
~110 KB. Okunan her veri bir önbellek etiketiyle saklanır
(`lib/server/tags.ts`: katalog, depo-stogu, stok, bayiler, yorumlar,
icerik). Bir kayıt değişince `lib/server/refresh.ts` › `refreshSite` ilgili
etiketi geçersiz kılar; o veriyi kullanan sayfalar bir sonraki ziyarette
veritabanından yeniden hazırlanır. Panelin kayıtları ve SAP stok okuma işi
bunu kendi içinden çağırır; dışarıdan `/api/yenile` ucu ve
`npm run site:yenile` (`REVALIDATE_SECRET`). Veritabanına ulaşılamazsa hata
mesajı hangi okumanın başarısız olduğunu söyler; yayındaki sayfalar son
hazırlanmış haliyle gösterilmeye devam eder.

**Tarayıcıdaki kopya:** Veritabanı modunda tarayıcının veri
kopyası (`packages/store/src/database.ts`) boş başlar; bütün kayıtlar
sunucudan gelir. Kopya tarayıcı deposuna (`zenweld.db.v1`) yazılmaz, aynı
adreste daha önce çalışmış demodan kalan kopya silinir. Ayar derlemede
tarayıcı paketine de yazılır (`NEXT_PUBLIC_DATA_SOURCE`, `next.config.mjs`);
örnek veri (`packages/data/src/seed/`) pakete girmez. `@zenweld/data` paketi
yan etkisiz işaretlidir (`"sideEffects": false`): kullanılmayan örnek veri
dosyaları derlemede atılır.

---

## 7. Üyelik

### Şifre ve oturum

`packages/auth/src/server`; KARARLAR K-94.

- **Şifre özeti:** argon2id (`@node-rs/argon2`; 19 MB bellek, 2 tur, 1 iş
  parçacığı). Özet tuzu ve ayarları içinde taşır. Eski demo özeti
  (`zw1$…`) de doğrulanır; doğruysa yeni özet döner ve kaydedilir (ilk
  girişte güçlü özete geçilir). Yeni şifre en az 8 karakter
  (`packages/auth/src/rules.ts`).
- **Oturum:** 32 rastgele baytlık anahtar tarayıcıya yalnızca sunucunun
  okuyabildiği çerezle verilir; `sessions.id` anahtarın sha256 özetidir
  (veritabanı okunsa da oturum çalınmaz). Site oturumu (`site`) yalnızca
  bireysel ve kurumsal üyeye, panel oturumu (`admin`) yalnızca yöneticiye
  açılır; askıdaki ya da rolü değişen üyenin oturumu geçersizdir
  (`readSession` her istekte rol ve durumu denetler).
- **Süre:** Site 30 gün; kullanıldıkça uzar (en fazla saatte bir yazılır).
  Panel girişten 8 saat sonra biter, uzamaz.
- **Kapatma:** Çıkışta oturum silinir; şifre değişince üyenin diğer
  oturumları silinir; yeni girişte üyenin süresi dolmuş oturumları
  temizlenir.
- **Site üyeliği:** Veritabanı modunda sitenin kayıt, giriş,
  çıkış, profil, şifre değiştirme ve hesap silme işlemleri
  `apps/zenweld-web/src/app/api/uyelik/[islem]/route.ts` ucundan,
  `packages/auth/src/server/accounts.ts` kurallarıyla yapılır; tarayıcı
  tarafı `AuthProvider`'ın sunucu modudur. Oturum çerezi `zw_oturum`:
  HttpOnly, SameSite=Lax, gerçek alan adında Secure; sayfa her açılışta
  `/api/uyelik/ben` ile üyeyi okur. Başka siteden gelen istek (Origin
  farklı) reddedilir. Girişte üye satırı kilitlenir: aynı anda gelen yanlış
  denemeler de doğru sayılır (`failed_login_*`, `login_locked_until`).
  Tarayıcıya giden üye kaydında şifre özeti boştur.
- **Panel girişi:** Veritabanı modunda panelin girişi ve çıkışı
  `apps/zenweld-web/src/app/api/yonetim/oturum/[islem]/route.ts` ucundan
  (`ben`, `giris`, `cikis`); oturum çerezi `zw_panel` (sitenin çerezinden
  ayrı). Panel düzeni (`app/yonetim/(panel)/layout.tsx`) her istekte
  oturumu sunucuda okur; geçerli yönetici oturumu yoksa sayfa gönderilmez,
  giriş ekranına yönlendirilir. Çerez ve istek denetimi iki uçta ortak:
  `lib/server/session-cookie.ts`.
- **Şifre sıfırlama (K-95; `packages/auth/src/server/password-reset.ts`):**
  `POST /api/uyelik/sifre-unuttum` hesap olsa da olmasa da aynı yanıtı
  verir; hesap aktif bir üyeyse 32 baytlık anahtar üretilir, özeti
  `password_reset_tokens`'a yazılır (üyenin eski bağlantıları silinir) ve
  bağlantı (`<NEXT_PUBLIC_SITE_URL>/sifre-sifirla?anahtar=…`; adres isteğin
  Host başlığından alınmaz) üyeye e-postayla gider ("Zenweld şifre
  sıfırlama", düz metin). Aynı üye için 15 dakikada bir. E-postanın
  gitmemesi ziyaretçiye gösterilmez (hesabın olup olmadığı belli olmasın);
  sunucu kaydına "Şifre sıfırlama e-postası gönderilemedi" yazılır,
  bağlantı yazılmaz. `POST /api/uyelik/sifre-sifirla` anahtarı ve yeni
  şifreyi alır: 1 saat içinde ve kullanılmamışsa şifre değişir, bağlantı
  kullanılmış olur, üyenin bütün oturumları silinir, yanlış şifre sayacı
  sıfırlanır. Demo modunda e-posta gitmez.
- **`npm run yonetici:olustur`:** `DATABASE_URL`'deki veritabanında e-posta,
  ad, soyad, telefon ve şifre (ekrana yazılmaz, iki kez) sorup yönetici
  hesabı açar. Canlıya hiç hesap yüklenmediği için (K-91) ilk yönetici
  bununla açılır. E-posta bir yöneticiye aitse şifresini değiştirir ve açık
  oturumlarını kapatır; bir üyeye aitse hesap açmaz. Terminal dışından
  çalışmaz.
- Test: `tests/db/oturum.test.ts` (özet, eski özetin çevrilmesi, oturumun
  türü ve rolü, süreler, askı, çıkış ve diğer oturumların kapanması; kayıt,
  giriş, deneme sınırı, profil, şifre değiştirme, hesap silme, şifre
  sıfırlama); `tests/unit/uyelik.test.ts` (şifre kuralı, deneme sınırı);
  `tests/e2e-db/uyelik.spec.ts` (tarayıcıda: kayıt, çerez, çıkış, giriş,
  tek mesaj, deneme sınırı, diğer cihazın oturumu, profil, hesap silme,
  eski özetin çevrilmesi, başka siteden istek, şifre sıfırlama);
  `tests/e2e-db/panel.spec.ts` (oturumsuz panelin gönderilmemesi, 8 saatlik
  oturum, üyenin panele girememesi, çıkış, askı, süre dolması, deneme
  sınırı).

### Üyenin adresleri ve favorileri

KARARLAR K-96; `packages/auth/src/server/account-data.ts`.

- Veritabanı modunda giriş yapmış üye adreslerini ve favorilerini
  `/api/uyelik/[islem]` ucundan okur ve değiştirir; üye oturum çerezinden
  bulunur, istekte üye kimliği gönderilmez.
  - Okuma (GET): `adresler`, `favoriler`.
  - Değiştirme (POST): `adres-kaydet` (kimlik varsa düzenleme),
    `adres-sil`, `adres-varsayilan`, `favori-ekle` (`{ ids }`),
    `favori-cikar` (`{ id }`). Her yanıt listenin son halini döndürür.
- **Adres:** Yalnızca üyenin kendi adresi değişir; başkasınınki "Adres
  bulunamadı." İlk adres varsayılan olur; varsayılan silinince kalan ilk
  eklenen varsayılan olur; varsayılan yapılınca diğerleri kalkar. Liste
  varsayılan önce, sonra eklenme sırasıyla gelir. En fazla 20 adres.
- Ekleme, silme, varsayılan değişikliği ve favori ekleme tek işlemdedir ve
  önce üyenin `users` satırını kilitler: aynı üyeden aynı anda gelen iki
  istek (ör. iki sekme) sırayla çalışır; iki varsayılan adres oluşmaz,
  sınır aşılmaz.
- **Favori:** Aynı ürün iki kez eklenmez; olmayan ürün atlanır. Girişte
  tarayıcıdaki liste tek istekle eklenir (sığan kadarı); tek ürün
  eklenirken sınır doluysa hata döner. En fazla 500 favori. Ürün ya da üye
  silinince favori de silinir.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/addresses.ts` (Adreslerim ve
  ödeme) ve `apps/zenweld-web/src/lib/favourites.tsx`; demo modunda ikisi
  de tarayıcıdaki veriyi kullanır.
- Test: `tests/db/hesap-verisi.test.ts` (varsayılan kuralları, yalnızca
  sahibin değiştirmesi, zorunlu alanlar, 20 adres, aynı anda gelen
  istekler; favori ekleme, tekrar, çıkarma, ürün silinince gitmesi, 500
  sınırı ve girişteki birleştirme); `tests/e2e-db/hesap-verisi.spec.ts`
  (tarayıcıda: adres ekleme, varsayılan, silme, başka cihaz; misafir
  favorilerinin girişte hesaba geçmesi, başka cihaz, çıkışta boş kalpler).

---

## 8. Siparişler ve ödeme

### Siparişler

KARARLAR K-97; `src/orders.ts`.

- Veritabanı modunda site siparişi `apps/zenweld-web/src/app/api/siparis/[islem]/route.ts`
  ucundan verir ve okur; üye oturum çerezinden bulunur.
  - `POST /api/siparis/kupon` `{code, lines}`: sepete yazılan kuponun
    sonucu (`checkCartCoupon`). Ziyaretçi de çağırır; fiyatlar sayfanın
    önbellekteki katalogundan, kupon ve kullanımları veritabanından okunur.
    Tarayıcıya kuponun kendisi değil, yalnızca sonucu (`CouponView`) gider.
  - `POST /api/siparis/ver`: sipariş (`placeOrder`). Tarayıcı ürün, seçenek,
    adet, kupon kodu, adres, fatura, ödeme yöntemi, taksit sayısı, kartın
    ilk 6 ve son 4 hanesi ve gördüğü tutarı (`expectedTotal`) gönderir.
  - `GET /api/siparis/liste`: üyenin siparişleri ve iade talepleri
    (`memberOrders`); önce süresi dolan havaleler iptal edilir
    (`cancelExpiredTransfers`).
  - `POST /api/siparis/iade`: iade talebi (`createReturnRequest`).
- **Hesap:** Fiyat, kupon, kargo ve vade farkı sepetle aynı kurallardan
  (`packages/data` › `cart.ts`, `checkout.ts`, `coupon.ts`), veritabanındaki
  güncel katalog, depo stoğu ve mağaza ayarlarıyla (`readPricingData`;
  önbelleksiz) yeniden hesaplanır. Tutar `expectedTotal`'la tutmazsa,
  ürün satıştan kalktıysa, stoğu bittiyse ya da kupon uygulanamıyorsa
  sipariş yazılmaz.
- **Yazılanlar (tek işlem):** `orders`, `order_items` (seçenek kimliği
  `variant_id` dahil), `order_status_history` (ilk durum), kupon varsa
  `coupon_redemptions`; numara `record_counters` üzerinden
  (`nextRecordCode`). Kartlı siparişte kartın programını ve tahsilatı ödeme
  sağlayıcısı yapar (aşağıda): `paid_at` sağlayıcının verdiği ödeme anıdır
  (temsili sağlayıcıda sipariş anı), sonuç `payment_transactions`'a yazılır
  ve sipariş SAP aktarım sırasına girer (`sap_order_exports`, K-108);
  sağlayıcı reddederse (402) sipariş yazılmaz ve sipariş numarası
  harcanmaz. Havalede `due_at` = sipariş anı + mağaza ayarındaki gün.
- **Kilitler:** Kuponlu siparişte kupon satırı (`coupons`, FOR UPDATE)
  kilitlenir; aynı kuponla aynı anda gelen siparişler sırayla sayılır, sınır
  aşılmaz. İade talebinde sipariş satırı kilitlenir. Havale iptalinde
  süresi dolan siparişler kilitlenir.
- **Havale süresi:** Son ödeme gününün sonu Türkiye saatine göredir
  (`packages/data/src/orders.ts`). Süresi dolan sipariş `cancelled` olur,
  geçmişe "Ödeme süresi doldu" notuyla yazılır, `coupon_redemptions.released_at`
  dolar.
- Bildirim e-postası (`info@zenweld.com`) kayıttan sonra sunucudan gider
  (`apps/zenweld-web/src/lib/server/notify.ts`); yanıt onu beklemez.
- Panelin Siparişler, İade Talepleri ve Kuponlar ekranları: [Panel › Satış](#satış).
- Test: `tests/db/siparis.test.ts` (kartlı sipariş ve tutarlar, numaranın
  en büyük numaradan devam etmesi, fiyat değişince, stoksuz, satıştan kalkan
  ürün, eksik ve hatalı bilgi, taksit, POS yokluğu; havale ve süre dolunca
  iptal, kupon hakkının geri verilmesi; sepet kuponu ve kişiye özel kupon;
  iade talebi kuralları; aynı anda gelen siparişlerde kupon sınırı);
  `tests/e2e-db/siparis.spec.ts` (tarayıcıda: sepette kupon, kartla sipariş,
  başka cihaz, iade talebi; fiyat değişince; havale süresi dolunca iptal).

### Kartla ödeme

Kurallar (taksit, komisyon, kart programı):
[IS-KURALLARI.md › 5](IS-KURALLARI.md#5-kartla-ödeme-taksit-ve-banka-komisyonu).

**Bugün (para çekilmez):**

- Ödeme sayfasında kart bilgisi yalnızca **biçim** olarak kontrol edilir
  (Luhn, son kullanma, CVC); hiçbir yere gönderilmez. Veritabanı modunda
  sunucuya yalnızca kartın ilk 6 ve son 4 hanesi gider (kart programı ve
  taksit sunucuda bulunur).
- Kartın programı (Bonus, World …) kartın ilk 6 hanesinden sabit bir kuralla
  seçilir.
- 1,5 saniyelik "3D Secure doğrulanıyor…" beklemesinden sonra ödeme alınmış
  sayılır; **para çekilmez.**
- Siparişe yalnızca marka, program, son 4 hane, taksit sayısı, POS adı ve
  komisyon oranı yazılır.
- **Ödeme sağlayıcısı parçası (veritabanı modu, KARARLAR K-108):** Sunucuda
  kartın programını bulan ve tahsilatı yapan kısım ayrı, değiştirilebilir
  bir parçadır (`packages/db/src/payment.ts` › `PaymentProvider`). Hangisinin
  kullanılacağını sunucudaki `ODEME_SAGLAYICI` ayarı seçer
  (`apps/zenweld-web/src/lib/server/payment.ts`); bugün tek sağlayıcı
  `temsili`dir: para çekilmez, sipariş ödenmiş sayılır (K-97). Her kartlı
  siparişte sağlayıcının sonucu `payment_transactions`'a yazılır (satış,
  başarılı, sağlayıcının işlem numarası). Sağlayıcı tahsilatı reddederse
  sipariş alınmaz ve sağlayıcının verdiği neden müşteriye gösterilir.
- Banka POS'ları, taksit ve komisyon oranları panelde Mağaza Ayarları ›
  Kargo ve Ödeme'de tanımlıdır; değerler **örnektir.**

**Canlı için gerekenler:**

1. **Ödeme kuruluşu seçimi:** iyzico, PayTR ya da bankaların sanal POS'ları
   (birden çok banka POS'u kullanılabilir; panel buna göre kuruldu).
2. **Kart bilgisi Zenweld sunucusuna gelmemeli:** Kuruluşun ödeme formu ya da
   3D Secure sayfası kullanılmalı.
3. **Kart programı ve taksitler:** Kartın programı kuruluşun kart (BIN)
   sorgusundan alınmalı: sunucuda yeni sağlayıcının `cardProgram`'ı bunu
   yapar. Ödeme sayfası taksitleri bugün tarayıcıda demodaki sabit kuralla
   (`packages/data/src/payment.ts` › `cardProgram`) hesaplıyor; sunucuya
   kartın programını soran bir uç eklenmeli.
4. **POS eşleştirmesi:** Paneldeki her POS gerçek bir sanal POS'a
   bağlanmalı. Mağaza no panelde kalabilir; **API anahtarı, şifre ve
   benzeri gizli bilgiler yalnızca sunucuda** ortam değişkeni olarak durmalı
   (ör. POS kimliğine göre adlandırılmış değişkenler). Bugün böyle bir
   değişken yoktur.
5. **Tutarlar sunucuda yeniden hesaplanır:** Veritabanı modunda yapıldı:
   ürün fiyatı, kampanya, kupon, kargo ve vade farkı sunucuda
   [IS-KURALLARI.md](IS-KURALLARI.md)'deki kurallarla hesaplanır, sipariş
   numarasını sunucu verir (`packages/db/src/orders.ts`). Sağlayıcıya
   çekilecek tutar bu hesaptan gider; sonuç `payment_transactions`'a
   yazılır (K-108).
6. **Ödeme sonucu (3D Secure):** Gerçek kuruluşta müşteri kuruluşun
   sayfasına gidip döner. Sipariş önce "ödeme bekleniyor" olarak kaydedilir;
   kuruluşun dönüş (callback) adresi ödemeyi kuruluşa doğrulatıp siparişi
   kesinleştirir. Bunun için sağlayıcının `pay`'i iki adıma ayrılır.
   Başarısız ödemede sipariş oluşmaz (bugün de öyle).
7. **İade ve iptal:** Bugün panel iade yapmaz ("İadeyi ödeme kuruluşu /
   banka üzerinden ayrıca yapmanız gerekir"). Kuruluşun iade API'si
   bağlanabilir.
8. **Komisyon:** Paneldeki tahmini komisyon yerine istenirse kuruluşun
   bildirdiği gerçek kesinti yazılabilir.
9. **Güvenlik politikası:** Kuruluşun ödeme ya da 3D Secure sayfasının adresi
   sitenin güvenlik politikasına eklenmeli: sayfa çerçeve içinde açılıyorsa
   `frame-src`'ye, siteden form ile gönderiliyorsa `form-action`'a. Eklenmezse
   tarayıcı ödeme sayfasını engeller ([3](#3-barındırma-zamanlanmış-işler-ve-güvenlik-başlıkları)).

Kod: `apps/zenweld-web/src/app/(site)/odeme/page.tsx`,
`apps/zenweld-web/src/components/shop/CardPayment.tsx`,
`apps/zenweld-web/src/lib/payment.ts`, `packages/data/src/checkout.ts`;
sunucu: `packages/db/src/payment.ts`, `packages/db/src/orders.ts`,
`apps/zenweld-web/src/lib/server/payment.ts`.

### Havale / EFT

- Banka entegrasyonu yoktur. Müşteri siparişten sonra Mağaza Ayarları'ndaki
  hesaplardan birine ödeme yapar ve açıklamaya sipariş numarasını yazar.
- Ödeme hesaba geçince panelde **Ödeme Alındı** denir.
- Süresi dolan siparişi iptal eden işlem bugün sayfa açılınca çalışır
  (veritabanı modunda siparişler sunucudan okunurken); canlıda ayrıca
  **günlük zamanlanmış görev** olmalı
  ([IS-KURALLARI.md › 6](IS-KURALLARI.md#6-havale--eft)).
- İstenirse ileride bankanın hesap hareketleri servisiyle otomatik eşleştirme
  yapılabilir (sipariş numarası açıklamadan okunarak).

---

## 9. Formlar ve e-posta

### Formlar

KARARLAR K-81; `src/forms.ts`.

- Veritabanı modunda site formları `apps/zenweld-web/src/app/api/formlar/[tur]/route.ts`
  ucundan kaydeder ve okur; giriş yapmışsa üye oturum çerezinden bulunur.
  - `POST /api/formlar/teklif`: `quotes` + `quote_items` (`createQuote`);
    ürün adı, kodu ve seçenek adı katalogdan; numara `TKL-<yıl>-<4 hane>`.
  - `POST /api/formlar/servis`: `service_requests` (`createServiceRequest`);
    model adı katalogdan; numara `SRV-<yıl>-<4 hane>`.
  - `POST /api/formlar/garanti`: `warranties` (`registerWarranty`); aynı
    seri numarası (büyük harfe çevrilerek) ikinci kez yazılmaz; bitiş
    Türkiye gününe göre.
  - `POST /api/formlar/yorum`: `reviews` (`createReview`); onaysız. Fotoğraf
    ve videolar dosya deposuna taşınana kadar `media`'da veri olarak
    (`data:` adresi) durur.
  - `GET /api/formlar/garanti?seri=…`: garanti sorgulama (`findWarranty`);
    yalnızca sorgulama kartındaki alanlar döner.
  - `GET /api/formlar/teklifler`, `GET /api/formlar/garantiler`: üyenin
    teklifleri (`user_id`) ve garantileri (e-posta).
- E-posta formları da kendi tablolarına yazılır: `/api/bayilik` →
  `dealer_applications`, `/api/destek` → `support_messages`
  (`urun-destek`; ürün koduna göre `product_id`), `/api/bildirim` iletişim →
  `support_messages` (`iletisim`), Welders Club → `welders_club_signups`.
  Yanıtta `saved: true` döner; e-posta gitmese de form ulaşmış sayılır.
  Demo modunda bu kayıtları tarayıcı yazar (K-109).
- Bot tuzağı doluysa kayıt yapılmaz; `email_log`'a `skipped` yazılır.
- Panelin Teklifler, Servis Talepleri, Garantiler, Yorumlar, Bayilik
  Başvuruları, Mesajlar ve Welders Club ekranları: [Panel › Talepler](#talepler).
- Test: `tests/db/formlar.test.ts` (teklif kuralları ve katalogdan alınan
  ürün bilgisi, servis talebi, garanti kaydı, tekrar eden seri no, Türkiye
  gününe göre bitiş, sorgulama, yorum, e-postaya giden formların kaydı,
  e-posta kaydı ve türleri); `tests/e2e-db/formlar.spec.ts` (tarayıcıda:
  ziyaretçi ve üye teklifi, Tekliflerim, servis, garanti, sorgulama,
  Garantilerim, yorum, iletişim, Welders Club, bot tuzağı).

### E-posta (Resend)

**Ne yapar:** Sitedeki formlar gönderilince Zenweld'e (`info@zenweld.com`)
e-posta gider. Formlar ve içerikleri:
[IS-KURALLARI.md › 18](IS-KURALLARI.md#18-form-e-postaları). Veritabanı
modunda müşteriye de bir e-posta gider: şifre sıfırlama bağlantısı
([Şifre ve oturum](#şifre-ve-oturum)).

**Bugün:** Kurulu değil; `RESEND_API_KEY` hiçbir yerde tanımlı olmadığı
için **hiçbir e-posta gitmiyor**. Demo adresinde form yine "gönderildi"
der. E-postanın gelmesi için: Resend hesabı açılır, `zenweld.com` alan
adına Resend'in verdiği DNS kayıtları eklenir (gönderici adresinin
doğrulanması), anahtar ve gönderici adresi sunucuya ortam değişkeni olarak
girilir ([2](#2-ortam-değişkenleri)).

**Nasıl çalışır:**

- E-posta yalnızca **sunucudan** gönderilir; tarayıcı servise doğrudan
  bağlanmaz. Formlar sitenin kendi uçlarına gönderir:
  - `POST /api/bildirim` — iletişim, teklif, servis, garanti, yorum, üye,
    sipariş, iade talebi, Welders Club (`type` alanıyla).
  - `POST /api/bayilik` — bayilik başvurusu.
  - `POST /api/destek` — ürün sayfasındaki destek sorusu.
  - Veritabanı modunda sipariş, iade talebi, teklif, servis talebi, garanti
    kaydı ve yorumun bildirimini, kaydı yapan sunucu kendisi gönderir
    (`/api/siparis`, `/api/formlar`); tarayıcı `/api/bildirim`'e
    bu türleri göndermez. Şablonlar tek yerde:
    `apps/zenweld-web/src/lib/server/notify.ts`.
- Sunucu e-postayı Resend'in API'sine (`https://api.resend.com/emails`)
  gönderir.
- **Alıcı** (`apps/zenweld-web/src/lib/server/mail.ts` › `recipientsFor`):
  veritabanı modunda her e-postada türün `email_recipients` satırı okunur
  (`emailRecipientsFor`); satır yoksa ya da okunamazsa `SUPPORT_EMAIL`.
  `email_log.recipients` gerçek alıcılardır.
- **E-posta kaydı** (veritabanı modu, KARARLAR K-81): sunucunun gönderdiği
  her e-posta `email_log`'a yazılır (`logEmail`): tür, sayfa (`Referer`'dan,
  aynı siteden geliyorsa), bağlı kayıt, alıcı, yanıt adresi, konu, sonuç
  (`sent`; servis hatasında `failed`; anahtar yoksa ya da bot tuzağında
  `skipped`), servisin verdiği numara ve hata. Metin yazılmaz. Kayıt
  yazılamazsa e-posta yine gider.
- E-posta HTML'dir: başlık, alan tablosu ve varsa uzun metin. Formdan gelen
  her metin HTML'e zararsız hale getirilerek yazılır.
- **Yanıtla** denince yanıt formu doldurana gider (geçerli e-posta varsa).

**Uçların yanıtı:** `{ ok, delivered, demo }`

- `delivered`: e-posta gerçekten gitti mi.
- `demo`: site gerçek alan adında değil (demo adresi, önizleme, yerel
  bilgisayar).
- Anahtar yoksa ya da servis hata verirse `delivered: false` döner, istek
  hata vermez.

**Ziyaretçi ne görür:**

- **Kaydı panelde olan formlar** (sipariş, teklif, servis, garanti, yorum,
  üyelik, iade talebi) e-postanın sonucunu beklemez; kayıt her durumda
  yapılır.
- **E-posta formları** (iletişim, bayilik, Welders Club, ürün destek
  sorusu):
  - E-posta gittiyse başarılı.
  - Veritabanı modunda kayıt yapıldıysa e-posta gitmese de başarılı.
  - Demo adresinde e-posta servisi tanımlı değilse yine başarılı görünür.
  - Canlıda e-posta gitmediyse ve kayıt da yoksa ziyaretçiye hata
    gösterilir; tekrar deneyebilir. Ürün destek sorusunda ziyaretçiye
    doğrudan yazabileceği adres gösterilir.

**Koruma:**

- Her formda görünmez bir **bot tuzağı** alanı (`website`) vardır. Doluysa
  e-posta gönderilmez ama bota başarılı gibi yanıt verilir.
- Yalnızca tanımlı alanlar kabul edilir; her alan en fazla 5.000 karakter,
  konu 200 karakter.
- Canlıdan önce ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Formlar — güvenlik):
  - Aynı adresten gelen form sayısına sınır (istek sınırı); sayaç paylaşılan
    bir depoda tutulmalı.
  - Bot koruması (Cloudflare Turnstile ya da görünmez reCAPTCHA), doğrulama
    sunucuda.
  - Kayıt tutan formlar sunucuda veritabanına yazılır ve e-posta bu
    kayıttan gider (veritabanı modunda böyle; demo modunda
    tarayıcı kaydı kendisi oluşturup e-posta ucuna haber veriyor). Sipariş
    e-postası ödeme kuruluşunun onayından sonra gitmeli.
  - Sepet kuponunu deneyen uç (`/api/siparis/kupon`) ve garanti sorgulama
    (`/api/formlar/garanti`) da istek sınırına alınmalı (kod ve seri numarası
    denemesini zorlaştırmak için). Formlar veritabanına yazıldığı için
    istek sınırı ve bot koruması canlıdan önce şarttır; o zamana kadar
    yalnızca görünmez bot tuzağı vardır (KARARLAR K-98).

Kod: `apps/zenweld-web/src/lib/server/mail.ts`,
`apps/zenweld-web/src/app/api/`, `apps/zenweld-web/src/lib/notify.ts`,
`apps/zenweld-web/src/components/common/BotTrap.tsx`.

---

## 10. Panel

Veritabanı modunda panelin bütün ekranları veritabanından okur ve yazar
(KARARLAR K-99). Demo modunda aynı işlemler tarayıcıdaki veriye
yazılır. Kuralların yöneticinin gördüğü hali:
[IS-KURALLARI.md › 22](IS-KURALLARI.md#22-panelde-kayıt-düzenleme).

### Ortak akış

- **Okuma:** Panelin her sayfası verisini kendi sunucu bileşeninde okur
  (`app/yonetim/(panel)/siparisler/page.tsx` vb.); sayfa her açılışta ve
  her kayıttan sonra (`router.refresh`) yeniden okunur. Önce geçerli
  yönetici oturumu denetlenir.
- **Yazma:** `POST /api/yonetim/<alan>/<işlem>`. Yalnızca geçerli panel
  oturumu olan yönetici yazar (yoksa 401); başka siteden gelen istek
  reddedilir (403). Her işlem tek işlemdir (transaction). Ortak kurallar:
  `src/panel.ts`; ortak uç akışı: `apps/zenweld-web/src/lib/server/admin.ts`
  (`runPanelAction`); tarayıcı: `apps/zenweld-web/src/lib/admin-panel.ts`.
- **Aynı kaydı iki kişi düzenlerse:** İstek, ekranın gördüğü `updated_at`'i
  taşır. Kayıt satırı kilitlenir (FOR UPDATE); `updated_at` değişmişse
  kaydedilmez, 409 "Bu kayıt siz açtıktan sonra değişti; sayfayı
  yenileyin." Aynı anda gelen ikinci istek birincinin bitmesini bekler ve
  reddedilir. Başarılı yazma yeni `updated_at`'i döndürür; ekran sayfa
  yenilenmeden aynı kaydı yeniden kaydederse onu gönderir (yöneticinin
  kendi kaydı reddedilmez).
- **İşlem kaydı (`audit_log`):** Her değişiklik aynı işlemde yazılır
  (`writeAudit`, `src/audit.ts`): yönetici kimliği, adı ve IP adresi, işlem,
  tablo, kayıt kimliği, okunur ad (sipariş no, iade no, kupon kodu) ve
  `changes`. Güncellemede yalnızca değişen alanlar (`{ alan: [eski, yeni] }`;
  `changedFields`), oluşturmada kaydın ilk hali, silmede son hali.
  Değişiklik yoksa hiçbir şey yazılmaz. Panel girişi ve çıkışı da yazılır
  (`login`/`logout`, `users`, okunur ad yöneticinin e-postası). Sistemin
  yaptığı iptal (süresi dolan havale) yazılmaz.
- **Sıra okları** `position`'ı 1, 2, 3… yapar; `updated_at` değişmez (sıra
  kaydın içeriği sayılmaz). Değişen her satır işlem kaydına yazılır.
- **Site önbelleği:** Başarılı işlemden sonra `refreshSite` ilgili etiketle
  çağrılır (her alanda aşağıda).
- **Görsel:** Tarayıcıda tutulan dosya (`data:` adresi) içeren kayıt
  reddedilir. Dosya deposu ayarlıysa panel görseli önce depoya yükler,
  kayda `/dosya/gorsel/…` adresi gelir (K-108); değilse adres girilir
  (K-101).

### Satış

1. alan; `src/admin-sales.ts`.

- **Okuma:**
  - `readOrdersPage`: sipariş listesi; adresteki süzgeçle (durum, arama,
    sayfa) yalnızca bir sayfa (50) okunur, ayrıca toplam ve durum sayıları
    (`count`, `GROUP BY status`). Önce süresi dolan havaleler iptal edilir
    (bir işlem içinde).
  - `readOrdersPanel`: sipariş detayı (o sipariş, SAP aktarım durumu
    `sap_order_exports`, mağaza ayarları); önce süresi dolan havaleler
    iptal edilir.
  - `readReturnsPage`: iade taleplerinin bir sayfası, toplam ve yeni talep
    sayısı.
  - Ortak parçalar `src/panel-lists.ts`: `searchLike` aramayı
    `translate(lower(alan), 'ı' + U+0307, 'i') LIKE '%…%'` ile yapar
    (I / İ / ı / i aynı harf; veritabanının yerel ayarına bağlı değil;
    IS-KURALLARI › 24), `countRows` sayar. Sayfa hesabı
    `@zenweld/utils` › `paging.ts` (demo moduyla ortak). `readOrders` ve
    `readReturnRequests` sayfa için `limit`/`offset` alır; ürün, geçmiş ve
    gönderi satırları yalnızca o sayfanın kayıtları için okunur.
  - `readCouponsPanel`: kuponlar ve kullanımları; düzenlemede yalnızca o
    kupon, kullanıldığı siparişler ve üyeler (`readPanelMembers`: yönetici
    hariç, şifre özeti boş). Kupon formunun ürün ve kategorileri sitenin
    önbellekteki katalogundan.
- **Yazma:** `POST /api/yonetim/satis/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/satis/[islem]/route.ts`):
  `odeme-alindi`, `kargo`, `teslim`, `iptal`, `siparis-notu`,
  `sap-yeniden` (başarısız SAP aktarımını yeniden sıraya alır),
  `iade-talebi`, `kupon` (oluşturma ve düzenleme), `kupon-durum`,
  `kupon-sil`.
- **Siparişte yazılanlar:** Durum değişince `order_status_history`'ye yeni
  satır, `changed_by` = yönetici. Ödeme alındı: `paid_at` ve SAP aktarım
  sırası (`sap_order_exports`); süresi dolmuşsa onaylanmaz, "Ödeme süresi
  doldu" notuyla iptal edilir. Kargo: `shipments` (giden gönderi; firma
  `carriers`'tan adla bulunur, listeden çıkarılmış kayıtlı firma korunur;
  takip no düzeltilince `shipped_at` değişmez). Teslim:
  `shipments.delivered_at`. İptal: kupon kullanımı geri verilir
  (`coupon_redemptions.released_at`).
- **Kupon:** Biçim ve kurallar demo moduyla aynı (`packages/data` ›
  `normalizeCouponDraft`, `validateCoupon`); `coupon_targets` ve
  `coupon_customers` baştan yazılır; seçilen ürün ve kategoriler var
  olmalı; kod tekrarı denetlenir (kupon kayıtları aynı anda iki aynı kodu
  yazmasın diye sırayla yapılır). Kullanılmış kupon silinmez.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-sales.ts`
  (`useSalesActions`).
- Test: `tests/db/panel-satis.test.ts` (ödeme, kargo, takip no düzeltme,
  teslim, geçmişte yönetici, işlem kaydı; süresi dolan havale, iptal ve
  kupon hakkı, iç not; okurken iptal; iade talebi; kupon oluşturma, biçim,
  kod tekrarı, olmayan ürün, hatalı alan, düzenleme, aktif/pasif, silme,
  kullanılmış kupon; aynı anda iki yönetici); `tests/e2e-db/panel-satis.spec.ts`
  (tarayıcıda: oturumsuz ve başka siteden istek, kargoya verme ve teslim,
  "kayıt değişti" uyarısı, iade talebi, kupon oluşturma, kod tekrarı,
  pasife alma, silme, giriş ve çıkış kaydı).

### Talepler

2. alan; KARARLAR K-100; `src/admin-requests.ts`.

- **Okuma:** `readQuotesPanel`, `readServicePanel`, `readWarrantiesPanel`
  (garantiler son değişiklik anıyla, üyeler), `readReviewsPanel` (bütün
  yorumlar, onay bekleyenler dahil, son değişiklik anıyla),
  `readDealerApplications`, `readSupportMessages`, `readWeldersClub`.
  Ürün ve kategori adları sitenin önbellekteki katalogundan.
- **Yazma:** `POST /api/yonetim/talepler/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/talepler/[islem]/route.ts`):
  `teklif` (durum, atanan temsilci ya da iç not; istekte olmayan alan
  değişmez), `teklif-sil` (satırlarıyla), `servis`, `garanti` (bitiş tarihi
  ya da uzatılmış garanti; +12 ay kayıttaki güncel tarihten), `garanti-sil`,
  `yorum-onay` (kaldırılan yorumun `featured`'ı da kalkar), `yorum-anasayfa`,
  `yorum-sil`, `basvuru`, `mesaj`, `welders-club` (`left_at` doldurulur ya da
  boşaltılır).
- **Anasayfa yorum sınırı:** İşaretleme sırayla yapılır (kilit); onaylı,
  `featured` ve ürünü yayında yorumlar sayılır, 10'a ulaşınca reddedilir.
- **Site önbelleği:** Yorum işlemleri başarılı olunca `refreshSite(["yorumlar"])`
  çağrılır; ürün sayfası ve anasayfa şeridi hemen yenilenir. Teklif,
  garanti ve servis kayıtları sitede önbelleksiz okunduğu için yenileme
  gerekmez.
- **Silinmeyen kayıtlar:** `dealer_applications`, `support_messages`,
  `welders_club_signups` için silme işlemi yoktur (K-100).
- **İşlem kaydı:** Yorum silinirken fotoğraf ve videolar `changes`'e
  yazılmaz, yalnızca sayıları ("2 dosya").
- Test: `tests/db/panel-talepler.test.ts` (teklifin alan alan kaydı ve
  kendi kaydının ardından yeni anla ikinci kayıt, silme; servis; garanti
  tarihi, geçersiz tarih, +12 ay, silme; yorum onayı, onaysız yorumun
  anasayfaya alınmaması, anasayfa sınırı, silme; başvuru ve mesaj durumu;
  Welders Club pasif/aktif); `tests/e2e-db/panel-talepler.spec.ts`
  (tarayıcıda: menüdeki ekranlar, teklif durumu ve hemen ardından not,
  onaylanan yorumun ürün sayfasında hemen görünmesi, sitedeki bayilik
  başvurusu ve ürün sorusunun panelde görünmesi, Welders Club, oturumsuz
  istek).

### Katalog

3. alan; KARARLAR K-101; `src/admin-catalog.ts`.

- **Okuma:** `readCatalogPanel` katalogu önbelleksiz okur (panel her zaman
  güncel kaydı görür): gruplar, kategoriler ve seçenek tanımları son
  değişiklik anıyla, ürünler. Seçenek Tanımları, Kategoriler (liste,
  kategori ve grup formları) ve Ürünler (liste, ürün formu) sayfaları bunu
  kendi sunucu bileşeninde okur; Ürünler listesi Zenweld depo stoğunu da
  (`readWarehouseStock`) okur.
- **Yazma:** `POST /api/yonetim/katalog/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/katalog/[islem]/route.ts`):
  `secenek` (oluşturma ve düzenleme), `secenek-sil`, `kategori` (oluşturma
  ve düzenleme), `kategori-sil`, `kategori-sira`, `grup` (oluşturma ve
  düzenleme), `grup-sil`, `grup-sira`, `urun` (oluşturma ve düzenleme),
  `urun-yayin`, `urun-sil`. Başarılı her işlemden sonra
  `refreshSite(["katalog"])`; ürün işlemlerinde `stok` ve `yorumlar` da
  (kaldırılan kombinasyonun stok satırları silinir; anasayfa yorum şeridi
  yalnızca yayındaki ürünlerin yorumlarını gösterir).
- **Kurallar demo moduyla aynı** (`packages/data` › `catalog-rules.ts`,
  `filters.ts`): tanım adı tekil, değer adları tanımda tekil; üründe
  kullanılan değer (`product_variant_values`) kaldırılamaz, tanım
  (`product_options`) silinemez. Kategori linki sitede, grup linki
  bölümünde tekil; ürünü olan kategori ve kategorisi olan grup silinemez.
  Tekillik denetimi gerektiren kayıtlar (tanım, kategori, grup) sırayla
  yapılır (`pg_advisory_xact_lock`). Ad ya da değerler yer değiştirirken
  tekil indekse takılmamak için önce geçici adlar yazılır.
- **Link değişince:** Kayıtlar kimlikle bağlı olduğu için yalnızca
  `redirects`'e eski adres yazılır; kategori grubu değişince de. Grubun
  linki değişince gruptaki her kategorinin eski adresi de yazılır. Yeni
  adres başka bir kaydın eski adresiyse o satır silinir. Silinen kategori
  ve grubun satırları da silinir.
- **Filtreler:** Kayıtlı halle yeni hal karşılaştırılır; yalnızca
  kaldırılan filtre ve değerler silinir (`product_filter_values` bağlantı
  kuralıyla ürünlerden de kalkar), diğerleri güncellenir. Değeri kalkan
  ürünlerin `updated_at`'i değişir. Eşleme tablosundan gelen ürünler
  kilitlenir ve her birinin `updated_at`'i denetlenir; değişen ürünün
  değerleri yazılır, işlem kaydına ayrı satır düşer. Değerlerin sırası
  karşılaştırmada önemsizdir.
- **Seçenek tanımı silinince** onu listeleyen kategorilerin `updated_at`'i
  değişir (açık kategori formu silinen tanımı geri yazamaz).
- **Ürün kaydı:** Kurallar `packages/data` › `catalog-rules.ts`
  (`productCodeError`, `optionsError`, `tidyOptions`) ve `discount.ts`
  (`validateDiscount`). Ürün kayıtları sırayla yapılır (kilit): kod
  (`sku_codes`) ve link tekilliği önce denetlenir. Düzenlemede ürünün
  kombinasyonları ve seçenekleri silinip yeniden yazılır; böylece ürün ve
  kombinasyon kodları yer değiştirebilir (tetikleyici kod havuzunu
  günceller). Kombinasyonun silinmesi onun eski ayrı ürün linklerini de
  sildiği için kalan kombinasyonlarınki kayıtlı halden geri yazılır. Link
  değişince `/urun/<eski>` yeni adrese yönlenir. Filtre değerleri ürünün
  (yeni) kategorisinin filtrelerine göre baştan yazılır. Kaldırılan
  kombinasyonların (seçenek listesi değiştiyse hepsinin) `dealer_stock`,
  `retailer_stock` ve `sku_aliases` satırları silinir; `variant_id` boş
  olanlar kalır. Yeni ürün kategorisinin sonuna eklenir (Sıra boşsa).
  Değişiklik yoksa hiçbir şey yazılmaz.
- **Ürün silme:** Bağlı satırlar tablo kurallarıyla temizlenir
  (`ON DELETE CASCADE` / `SET NULL`, yönlendirme tetikleyicisi). İşlem
  kaydına ürünün son hali yazılır.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-catalog.ts`
  (`useCatalogActions`).
- Test: `tests/db/panel-katalog.test.ts` (tanım oluşturma, ad tekrarı,
  kullanılan değer, adların yer değiştirmesi, eski ekran; kullanılan tanımın
  silinmemesi, silinen tanımın kategorilerden kalkması; yeni kategori, link
  tekrarı, yüklenmiş görsel, olmayan grup ve tanım; link ve grup
  değişince yönlendirme, kaldırılan filtre değeri, eşleme tablosu ve eski
  ürün; değişmeyen ürünün kayıt anının korunması; silme engelleri, sıra;
  grup linki değişince kategorilerin yönlendirmesi, bölümün değişmemesi,
  grup silme ve sıra; yeni ürün, kod ve link tekrarı, yüklenmiş görsel,
  olmayan kategori, hatalı kampanya ve fiyat; link değişince yönlendirme,
  ürün ve kombinasyon kodlarının yer değiştirmesi, kaldırılan kombinasyonun
  stoğu, eski ekran, değişmeyen kayıt; seçenek listesi ve kategori
  değişince stok ve filtre değerleri; yayından kaldırma, silme ve bağlı
  kayıtlar); `tests/e2e-db/panel-katalog.spec.ts` (tarayıcıda: seçenek
  tanımı ekleme, hemen ardından düzenleme ve silme; kategori linki
  değişince sitede eski adresin yönlenmesi ve yeni adın görünmesi, görsel
  yükleme; grup ekleme ve silme, silme engeli, kategori silme; ürün
  oluşturma, hemen ardından fiyat ve link değişikliği, sitede yeni fiyat ve
  eski linkin yönlenmesi, yayından kaldırma, silme; oturumsuz istek).

### Bayi ağı

4. alan; KARARLAR K-103; `src/admin-network.ts`.

- **Okuma:** `readDealersPanel` (bayiler son değişiklik anıyla, mağaza
  seçimi için satıcılar), `readRetailersPanel` (satıcılar son değişiklik
  anıyla, bayiler, ayarlar ve "N ürün sayfasında" sayısı için yalnızca
  sitede görünebilecek stok satırları: adedi olan ve linkli; bayide yalnızca
  online mağazası olanlar), `readSalesRepsPanel` (pasifler dahil, sırasıyla).
- **Yazma:** `POST /api/yonetim/bayi-agi/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/bayi-agi/[islem]/route.ts`):
  `bayi`, `bayi-sil`, `satici`, `satici-sil`, `temsilci`, `temsilci-durum`,
  `temsilci-sira`, `temsilci-sil`. Bayi ve satıcı işlemlerinden sonra
  `refreshSite(["bayiler", "stok"])`, temsilci işlemlerinden sonra
  `refreshSite(["icerik"])`.
- **Kurallar demo moduyla aynı** (`packages/data` › `network-rules.ts`):
  bayi adı, şehri ve türü zorunlu; satıcı adı ve site adresi zorunlu;
  temsilcide telefon en az 10 rakam, e-posta geçerli. Bayi kayıtları sırayla
  yapılır (kilit); `dealers.retailer_id` tekilliği önce denetlenir.
- **Silme:** Bayi ya da satıcı silinince stok satırları tablo kuralıyla,
  `stock_imports` (kaynağın geçmişi) ve `sku_aliases` (kaynağın kod
  eşleştirmeleri) sunucuda silinir. Satıcı silinince bağlı bayinin
  `retailer_id`'si boşalır ve `updated_at`'i değişir. Silinen bayinin
  `dealer_applications.dealer_id`'si tablo kuralıyla boşalır. İşlem kaydına
  kaydın son hali ve silinen stok satırı sayısı yazılır.
- **Temsilci:** Yeni temsilci listenin sonuna eklenir.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-network.ts`
  (`useNetworkActions`).
- Test: `tests/db/panel-bayi-agi.test.ts` (bayi kuralları, mağaza
  tekilliği, olmayan mağaza, eski ekran, değişmeyen kayıt; bayi silinince
  stok, geçmiş, eşleştirme ve başvuru bağlantısı; satıcı ekleme ve
  düzenleme, ekranın okuduğu stok satırları ve ayar; satıcı silinince
  bağlı bayi; temsilci kuralları, yüklenmiş fotoğraf, sitede göster/gizle,
  sıra, silme); `tests/e2e-db/panel-bayi-agi.spec.ts` (tarayıcıda: bayi
  ekleme, Bayi Bul'da hemen görünmesi, ad değişikliği, silme; satıcı ekleme
  ve silme; temsilci fotoğrafı, sitede görünme ve gizlenme, silme;
  oturumsuz istek).

### Stok Matrisi

4. alan; KARARLAR K-103; `src/admin-stock.ts`. Stok dosyasının biçimi ve
eşleşme kuralları: [STOK.md](STOK.md).

- **Okuma:** `readStockPanel(db, görünüm)` — sayfanın sunucu bileşeni
  adresten görünümü seçer (`?kaynak=dealer:<id>`, `?sekme=urun`, liste).
  Her görünümde bayiler, satıcılar, ayarlar (stok ayarının `updated_at`'iyle),
  ürünler ve seçenek tanımları; ayrıca:
  - liste: kaynak başına `count(*)`, adedi 0'dan büyük satır sayısı ve
    `max(updated_at)` (satırların kendisi gönderilmez);
  - kaynak sayfası: o kaynağın satırları, son 30 `stock_imports` kaydı
    (geri alma kopyası `previous` gönderilmez, yalnızca var olduğu) ve
    `sku_aliases`'ı;
  - Ürün Bazında: aktif bayilerin ve bir bayiye bağlı olmayan aktif
    satıcıların adedi 0'dan büyük satırları.
- **Yazma:** `POST /api/yonetim/stok/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/stok/[islem]/route.ts`): `satir`
  (elle düzeltme ya da satır ekleme), `satir-sil`, `ayar`, `dosya` (dosya
  uygulama), `geri-al` (son yüklemeyi geri alma), `eslestir` (kod
  eşleştirme). İşlem kaydında `entity_type` = `dealer_stock` /
  `retailer_stock`, `entity_id` = `<kaynak>/<ürün>|<seçenek>`; ayarda
  `settings` / `stock`; dosya ve geri almada `stock_imports` / kayıt no;
  eşleştirmede `sku_aliases` / `<kaynak>/<kod>`. Başarılı işlemden sonra
  `refreshSite(["stok"])`; ayarda `refreshSite(["katalog", "stok"])`.
- **Elle düzeltme:** Demo ile aynı (`packages/store` › `setStockLevel`,
  `deleteStockLevel`): adet tam sayı ve 0 ya da artı, fiyat 0 ya da artı
  (iki ondalık), link `http(s)://` ile başlar ya da boş. Yeni satırın kodu
  seçeneğin ya da ürünün kodudur. Her düzeltme `stock_imports`'a `manual`
  kaydı (not, özet, yönetici adı) yazar; değişiklik yoksa hiçbir şey
  yazılmaz. Bir bayiye bağlı online satıcı ayrı kaynak değildir; satırı
  bayinin listesindedir.
- **Ayar:** `settings` (`stock`) → `{ staleDays }`, 0–365.
- **Dosya (`dosya`):** Dosyayı tarayıcı okur (CSV/XLSX) ve önizler; sunucuya
  okunan tablo gider (satır × hücre; en fazla 20.000 satır, satırda 100
  hücre, hücre metin/sayı/boş). Sunucu tabloyu aynı kurallarla
  (`packages/data` › `readStockSheet`, `matchStockRows`, `diffStock`,
  `looksTruncated`) veritabanındaki ürün ve seçenek kodları ve kaynağın
  `sku_aliases`'ıyla yeniden eşleştirir. Dosyanın kendisi bugün saklanmaz
  (dosya deposuna yazılması sonraya).
  - Kaynak başına kilit (`pg_advisory_xact_lock`, `stock:<tür>:<id>`): aynı
    kaynağa iki dosya aynı anda uygulanmaz.
  - Eski ekran denetimi kaynak başınadır: tarayıcı önizlemenin dayandığı
    stoğun anahtarını gönderir (`stockVersion`: son `stock_imports` kaydı,
    satır sayısı, en yeni satırın `updated_at`'i); sunucu aynı anahtarı
    tablodan hesaplar, farklıysa 409.
  - Başlık yok, eşleşen ürün yok ya da `looksTruncated` ve onay yoksa 400
    (ekrandaki metinlerle).
  - Uygulama: `stock_imports`'a `file` kaydı (dosya adı, özet, yönetici
    adı, `previous` = önceki satırlar), kaynağın satırları silinip
    dosyadakiler yazılır (`import_id` = kayıt). Ardından son 5 dosya
    yüklemesi dışındakilerin `previous`'ı boşaltılır; kayıtlar silinmez
    (K-103).
- **Geri alma (`geri-al`):** Yalnızca kaynağın en son kaydı olan, geri
  alınmamış, `previous`'ı saklı `file` kaydı; değilse 409. Satırlar
  `previous`'tan ilk `updated_at`'leriyle geri yazılır (`import_id` boş),
  kayda `reverted_at` yazılır, `revert` kaydı ("<dosya> yüklemesi geri
  alındı") eklenir.
- **Kod eşleştirme (`eslestir`):** Kod boşluksuz ve büyük harfe çevrilir;
  ürün ve seçenek var olmalı (yoksa 404). `sku_aliases`'a yazılır ya da
  güncellenir; değişmediyse yazılmaz. Stok satırlarına dokunmaz.
  Eşleştirmeyi silen ekran bugün yok.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-stock.ts`
  (`useStockActions`).
- **Kodun yeri** (demo ve veritabanı modu ortak):
  - Kurallar: `packages/data/src/stock.ts` — `readStockSheet` (tablo →
    satırlar), `matchStockRows` (kod → ürün), `diffStock` (fark),
    `looksTruncated`, `isInStock` / `isStockFresh`, `stockTemplateRows`.
    Tarayıcıya ya da veritabanına bağlı değildir; sunucu da aynısını
    kullanır.
  - Tipler: `packages/data/src/types.ts` — `DealerStock`, `RetailerStock`
    (ortak alanlar `StockRow`), `StockImport`, `SkuAlias`, `StockSettings`;
    bayinin online mağazası `Dealer.retailerId`.
  - Demo modunda okuma ve yazma: `packages/store/src/repo/stock.ts`
    (okuma: `listStockSources`, `stockOfSource`, `stockHistory`,
    `retailersInStockFor`, `dealersWithProduct`, `sourceStatus`,
    `onlineProductCount`; yazma: `applyStockImport`, `revertStockImport`,
    `setStockLevel`, `deleteStockLevel`, `saveSkuAlias`, `deleteSkuAlias`,
    `saveStockSettings`).
  - Dosya okuma (tarayıcıda): `apps/zenweld-web/src/lib/stock-file.ts`
    (`.csv` / `.xlsx` / `.txt` → satır × hücre tablosu; `read-excel-file`
    8.0.3; en fazla 5 MB; makro çalıştırılmaz). Excel sunucuda okunmaz.
  - Panel ekranları: `apps/zenweld-web/src/components/admin/stock/`.
  - Ürün sayfası (veritabanı modu): sunucu o ürünün stoktaki satırlarını
    okur (`readProductStock`, [6](#6-okuma-ve-önbellek)); satıcının fiyatı
    gönderilmez.
  - Örnek veri: `packages/data/src/seed/stock.seed.ts` — her kaynak için
    yakın tarihli liste (online mağazalı bayilerde linkli); bir bayi ve bir
    satıcı bilerek 5 gün eski.
- Test: `tests/db/panel-stok.test.ts` (görünümlerin okuduğu satırlar ve
  özet sayılar, geri alma kopyasının gönderilmemesi; satır ekleme,
  düzeltme, eski ekran, değişmeyen kayıt, geçersiz değer, bayiye bağlı
  satıcı, olmayan seçenek, geçmiş notları; satır silme; stok ayarı; dosya:
  sunucunun kendi eşleştirmesi, tam liste, önceki halin kaydı, işlem
  kaydı, aynı önizlemeyle ikinci uygulama, başlıksız, eşleşmeyen, eski
  ekran, geçersiz kaynak ve tablo, 20.000 satır sınırı, çok kısa dosya
  onaysız ve onaylı, son 5 kopya; geri alma: yalnızca son yükleme, ilk
  satır anları, geri alma kaydı, ikinci kez geri alma, kopyası olmayan ve
  bulunmayan kayıt; kod eşleştirme: biçim, değişmeyen, güncelleme,
  olmayan ürün/seçenek, sonraki dosyada tanınma);
  `tests/e2e-db/panel-stok.spec.ts` (tarayıcıda: listede özet sayılar,
  adet düzeltme ve hemen ardından geri alma, satır ekleme ve silme, stok
  geçerlilik süresi, Ürün Bazında, oturumsuz istek);
  `tests/e2e-db/panel-stok-dosya.spec.ts` (tarayıcıda: dosya önizleme,
  tanınmayan kodu eşleştirme, uygulama, geri alma ve stoğun ilk haline
  dönmesi; oturumsuz istek).

### Mağaza Ayarları

5. alan; KARARLAR K-104, K-105; `src/admin-settings.ts`.

- **Okuma:** `readShopPanel(db)`: ayarlar (`readSettings`; mağaza ve
  şirket ayarlarının `settings('shop'|'company').updated_at`'iyle; şirket
  satırı yoksa başlangıç değerleri) ve `email_recipients`.
- **Yazma:** `POST /api/yonetim/ayarlar/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/ayarlar/[islem]/route.ts`):
  `magaza` (Kargo ve Ödeme sekmesi), `eposta-alicilari`, `sirket` (Şirket
  ve İletişim sekmesi), `gorunum` (aşağıda › Sayfalar ve Görünüm).
- **Kargo ve Ödeme:** Tek kayıt gibi kaydedilir; eski ekran denetimi
  `settings('shop').updated_at`'iyle (her kayıtta güncellenir), aynı anda
  iki kayıt `pg_advisory_xact_lock('settings:shop')` ile sıraya girer.
  Kurallar tarayıcıyla ortak (`packages/data` › `settings-rules.ts` ›
  `parseShopSettings`): tutarlar 0 ya da artı, ödeme süresi en az 1 tam
  gün, en az bir kargo firması, hesapta banka adı ve IBAN, POS'ta etiket
  ve ad, bilinen kart programı, taksit 2/3/6/9/12 (firma oranında ayrıca
  tek çekim), oranlar 0 ya da artı, tek varsayılan POS; her listede en
  fazla 50 kayıt. Değişmeyen hiçbir şey yazılmaz.
  - `settings('shop')`: kargo sınırı ve ücreti, taksit alt sınırı, ödeme
    süresi.
  - `payment_pos`, `bank_accounts`: kimliğe göre; değişen satır yazılır,
    listeden çıkan silinir (`orders.pos_id` boşalır, sipariş `pos_name` ve
    komisyon kopyasını tutar). Varsayılan POS değişirken önce eskisinin
    işareti kalkar (`payment_pos_one_default`).
  - `carriers`: ada göre; kalan firmanın kimliği korunur, sırası ve
    `tracking_url`'i ekrandaki gibi yazılır (K-105); yeni ad eklenir, çıkan
    silinir (`shipments.carrier_id` boşalır, `carrier_name` kopyası kalır).
  - `audit_log`: `settings` / `shop`; değişen alanlar (listelerde eski ve
    yeni liste). Ardından `refreshSite(["katalog"])` (ayarlar katalogla
    birlikte önbellektedir).
- **Şirket ve İletişim (K-105):** `settings('company')` tek satır; yoksa
  eklenir. Eski ekran denetimi satırın `updated_at`'iyle (satır yokken
  ekranın gördüğü an boş olmalı), sıra
  `pg_advisory_xact_lock('settings:company')` ile. Kurallar tarayıcıyla
  ortak (`parseCompanySettings`). Ofisler ve sosyal medya alan sırasından
  bağımsız karşılaştırılır; değişmeyen kayıt yazılmaz. `audit_log`:
  `settings` / `company`. Ardından `refreshSite(["katalog"])` (alt bilgi,
  İletişim, sözleşmeler ayarları katalogla birlikte okur).
- **E-posta Alıcıları:** `email_recipients`; tür başına en fazla 10 adres
  (küçük harf, tekrarsız; `parseRecipients`). Eski ekran denetimi listenin
  hali üzerinden (`recipientsVersion`: satır sayısı ve en son
  `updated_at`), sıra `pg_advisory_xact_lock('email_recipients')` ile.
  Alıcısı boşalan türün satırı silinir. `audit_log`: `email_recipients` /
  `<tür>`, `{ recipients: [eski, yeni] }`. Önbelleğe girmez.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-settings.ts`
  (`useSettingsActions`).
- Test: `tests/db/panel-ayarlar.test.ts` (okuma; kaydetme: varsayılan
  POS'un silinen ve kalan POS'a geçmesi, hesap ekleme/çıkarma, kargo
  firmalarının ad eşleşmesi, takip adresinin korunması, girilmesi,
  silinmesi ve kuralı, işlem kaydı; eski ekran, değişmeyen kayıt, kural
  ihlalleri; e-posta alıcıları: türlerin şemayla aynı olması, ekleme,
  değiştirme, boşaltma, e-postada okunma, eski ekran, geçersiz adres ve
  tür; şirket ve iletişim: satır yokken başlangıç değerleri, ilk kayıt,
  değişiklik, ofis sırası, eski ekran, değişmeyen kayıt, kural ihlali);
  `tests/unit/magaza-ayarlari.test.ts` (kurallar, takip bağlantısı);
  `tests/e2e-db/panel-ayarlar.spec.ts` (tarayıcıda: kargo ücretinin sitede
  hemen geçerli olması ve geri alınması, Welders Club alıcısının e-posta
  kaydına yazılması, oturumsuz istek); `tests/e2e-db/panel-sirket.spec.ts`
  (MERSİS no sözleşmede ve telefon alt bilgide hemen görünür; kargo takip
  adresi girilince müşteri ve panel sipariş detayında bağlantı; oturumsuz
  istek).

### İçerik

5. alan; KARARLAR K-101; `src/admin-content.ts`.

- **Okuma:** `readContentPanel(db)`: blog, haber, etkinlik ve SSS
  (`updated_at`'leriyle) ve Hakkımızda. Haber, etkinlik ve blog
  sayfalarının (liste, yeni, düzenleme) ve SSS ile Hakkımızda'nın sunucu
  bileşeni okur (`apps/zenweld-web/src/components/admin/ContentPanelData.tsx`).
- **Yazma:** `POST /api/yonetim/icerik/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/icerik/[islem]/route.ts`):
  `haber`, `haber-yayin`, `haber-sil`, `etkinlik`, `etkinlik-yayin`,
  `etkinlik-sil`, `blog`, `blog-yayin`, `blog-sil`, `sss`, `sss-sil`,
  `sss-sira`, `hakkimizda`. `audit_log`: `news`, `events`, `blog_posts`,
  `faqs`, `about_page`. Başarılı işlemden sonra `refreshSite(["icerik"])`.
- **Haber, etkinlik, blog:** Kurallar tarayıcıyla ortak
  (`packages/data` › `content-rules.ts`): başlık zorunlu; link boşsa
  başlıktan (`slugify`), boş kalırsa kaydedilmez; aynı link aynı türde iki
  kayda verilmez (`pg_advisory_xact_lock('<tür>:slug')`); etkinlikte
  bitiş başlangıçtan önce olamaz, tarihler `YYYY-AA-GG`; blogda yazar
  boşsa "Zenweld". Link değişince `redirects`'e eski adres yazılır
  (`src/links.ts` › `movePath`; yeni adres başka kaydın eski adresiyse o
  yönlendirme kalkar); kayıt silinince yönlendirmelerini veritabanı siler
  (`zw_delete_redirects`). Değişmeyen kayıt yazılmaz (SEO alanları aynı
  biçimde karşılaştırılır).
- **SSS:** Yeni soru listenin sonuna (`max(position) + 1`); konu `genel`,
  `siparis`, `garanti`, `teknik`; sıra okları yalnızca `position`'ı
  değiştirir, `updated_at`'e dokunmaz (`pg_advisory_xact_lock('faqs')`).
- **Hakkımızda:** Tek satır (`about_page`, id 1); yoksa eklenir. Değeri
  boş rakam kutusu yazılmaz; bölüm kimlikleri tekrarsız. JSON alanları
  (`stats`, `sections`) formdaki alan sırasıyla karşılaştırılır.
- Ortak link ve SEO kuralları katalogla aynı dosyada: `src/links.ts`
  (`parseSeo`, `validSlug`, `movePath`, `releasePath`).
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-content.ts`
  (`useContentActions`).
- Test: `tests/db/panel-icerik.test.ts` (okuma; haber ekleme, link
  çakışması, boş link, başlıksız; link değişince yönlendirme ve eski
  adresin başka kayda verilmesi, eski ekran, değişmeyen kayıt; yüklenmiş
  görsel, yayından kaldırma, silme ve yönlendirmenin kalkması; etkinlik
  tarih kuralları ve boş site adresi; blog yazarı ve yönlendirme; SSS
  ekleme, düzeltme, eski ekran, konu, silme, sıra; Hakkımızda: eski ekran,
  başlıksız, yüklenmiş görsel, boş rakam kutusu, değişmeyen kayıt);
  `tests/e2e-db/panel-icerik.spec.ts` (tarayıcıda: haber ekleme ve sitede
  görünmesi, görsel yükleme, link değişince eski adresin yönlenmesi,
  silme; SSS ekleme, sitede görünme, sıra, silme; Hakkımızda kaydı ve
  hemen ardından geri alma; oturumsuz istek).

### Sayfalar ve Görünüm

Yasal Metinler, Belgeler, Sayfa SEO ve Görünüm; 5. alan; KARARLAR K-104;
`src/admin-pages.ts`, `src/admin-settings.ts`.

- **Okuma:** `readPagesPanel(db)`: yasal metinler, belge sayfaları,
  belgeler ve `page_seo` (`updated_at`'leriyle); Belgeler sayfası ürün
  seçimi için ürünleri de okur. Yasal Metinler (liste ve düzenleme),
  Belgeler ve Sayfa SEO'nun sunucu bileşeni okur
  (`apps/zenweld-web/src/components/admin/PagesPanelData.tsx`).
  `readAppearancePanel(db)`: ayarlar, `rich_text` satırının
  `updated_at`'iyle (Görünüm sayfası).
- **Yazma:** `POST /api/yonetim/icerik/<işlem>`: `yasal-metin`,
  `sayfa-seo`, `belge-sayfasi`, `belge`, `belge-yayin`, `belge-sil`,
  `belge-sira`; ardından `refreshSite(["icerik"])`.
  `POST /api/yonetim/ayarlar/gorunum`; ardından `refreshSite(["katalog"])`
  (ayarlar katalogla birlikte önbellektedir). `audit_log`: `legal_pages`,
  `page_seo`, `document_pages`, `documents`, `settings` / `rich_text`.
- **Yasal metin:** Yalnızca var olan satır güncellenir (liste sabit);
  başlık ve metin zorunlu (`content-rules.ts` › `legalDraftError`).
- **Sayfa SEO:** Yalnızca Sayfa SEO ekranındaki (aramaya açık) sabit
  sayfalar kaydedilir; liste sitenin sayfa tablosundan gelir
  (`apps/zenweld-web/src/lib/page-meta.ts` › `isIndexablePage`, uç verir).
  Satırı olmayan sayfada ekranın gördüğü an boş olmalı; iki alan da boşsa
  satır silinir. Başlık en çok 200, açıklama 500 karakter. Sıra
  `pg_advisory_xact_lock('page_seo:<yol>')` ile.
- **Belge sayfası:** Satırı yoksa eklenir; başlık zorunlu.
- **Belgeler:** Dosya deposu ayarlıysa panel dosyayı önce depoya yükler;
  `adminSaveDocument` adres depodaki bir dosyanınsa (`/dosya/belge/…`)
  boyutu depodan okur (`storedSize`); dosya yoksa kaydetmez. Depo ayarlı
  değilse adres girilir (K-104): adres `file_key`'e yazılır; `file_name` ve
  `mime_type` adresin son parçasından (`documentFileFromAddress`),
  `size_bytes` 0. Yeni belgede adres zorunlu; düzenlemede boşsa dosya
  alanları değişmez; bölüm değişmez. Seçilen ürün `products`'ta olmalı;
  `lot_number` yalnızca `parti-sertifikalari`'nda yazılır. Yeni belge
  `max(position) + 1`; sıra okları yalnızca aynı bölümdeki belgeler
  arasında `position`'ı değiştirir, `updated_at`'e dokunmaz
  (`pg_advisory_xact_lock('documents')`).
- **Görünüm:** `settings` / `rich_text`; yalnızca bilinen dokuz alan
  yazılır; renkler `#RRGGBB`, puntolar Görünüm ekranının aralığında
  (`content-rules.ts` › `richTextStyleError`). Değişmeyen kayıt yazılmaz.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-pages.ts`
  (`usePagesActions`), `admin-settings.ts` (`saveRichText`).
- Test: `tests/db/panel-sayfalar.test.ts` (okuma; yasal metin: zorunlu
  alanlar, eski ekran, değişmeyen kayıt, olmayan metin; sayfa SEO: ekleme,
  değiştirme, boşalınca silinme, listede olmayan sayfa, silinmiş satıra
  eski ekran; belge sayfası; belge: adresle ekleme, yanlış adres, `data:`
  adresi, olmayan ürün, parti numarası, düzenleme, bölümün değişmemesi,
  yayından kaldırma, silme, eski ekran, bölüm içinde sıra, depodaki boyut;
  Görünüm: renk, punto, alan türleri, fazla alan, eski ekran);
  `tests/unit/icerik-ve-belgeler.test.ts` (kurallar);
  `tests/e2e-db/panel-sayfalar.spec.ts` (tarayıcıda: yasal metin ve sitede
  görünmesi, sayfa başlığı ve varsayılana dönme, depoya yüklenen belge,
  sitede görünme ve açılma, yayından kaldırma, silme; belge sayfası
  açıklaması; Görünüm; oturumsuz istek).

### Üyeler

6. alan; KARARLAR K-35, K-36; `src/admin-members.ts`.

- **Okuma:** `readMembersPanel`: `users`'ın bütün satırları (yöneticiler
  dahil), en yeni kayıt önce; `password_hash` boş gönderilir, `updated_at`
  ekranın gördüğü son değişiklik anıdır.
- **Yazma:** `POST /api/yonetim/uyeler/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/uyeler/[islem]/route.ts`): `uye`
  (`role`, `status`), `uye-sil`.
- **Kurallar:** Yönetici kendi rolünü ve durumunu değiştiremez (400). Son
  aktif yöneticinin rolü düşürülemez, askıya alınamaz (409). Yöneticiyle
  ilgili değişiklikler sırayla yapılır: satır kilidinden önce
  `pg_advisory_xact_lock(hashtext('users:admins'))` alınır; iki yönetici
  aynı anda birbirini askıya alamaz. Yönetici hesabı silinmez (400).
- **Silme:** `users` satırı silinir; `addresses`, `sessions`,
  `favourites`, `password_reset_tokens` tablo kurallarıyla silinir;
  `orders`, `quotes`, `service_requests`, `return_requests`, `warranties`,
  `reviews`'daki `user_id` boşalır. `audit_log`'a üyenin son hali yazılır
  (şifre özeti yazılmaz).
- Rol ya da durum değişince oturum bir sonraki istekte geçersiz olur.
- Test: `tests/db/panel-uyeler.test.ts` (okuma, rol ve durum, değişmeyen
  kayıt, eski ekran, kendi hesabı, son yönetici, silme ve kalan kayıtlar,
  aynı anda iki yönetici); `tests/e2e-db/panel-uyeler.spec.ts` (rol, askıya
  alma ve sitede giriş, aktifleştirme, silme, kendi satırı, oturumsuz
  istek).

### İşlem Kaydı ve E-posta Kaydı

6. alan; KARARLAR K-81, K-98; `src/admin-logs.ts`. Demo modunda bu
ekranlar boştur (K-109).

- Yalnızca okur: `readAuditLog` (`audit_log`), `auditLogFacets` (kayıtta
  geçen türler ve yöneticiler; yöneticinin son kayıttaki adı),
  `readEmailLog` (`email_log`). Sunucu sayfaları
  (`app/yonetim/(panel)/islem-kaydi/page.tsx`, `e-posta-kaydi/page.tsx`)
  süzgeçleri adresten okur (`tur`, `yonetici`, `islem`, `durum`,
  `baslangic`, `bitis`, `ara`, `once`); geçerli panel oturumu yoksa sayfa
  gönderilmez.
- En yeni önce (`id` azalan), sayfa başına 50; bir fazlası okunup "daha
  eski var mı" bulunur. Sonraki sayfa: `id < once`.
- Tarih süzgeci Türkiye günüdür (UTC+3): başlangıç gününün 00:00'ından
  bitiş gününün ertesi 00:00'ına kadar. Geçersiz tarih yok sayılır.
- Metin araması `ILIKE` ile; `%` ve `_` harfiyen aranır. İşlem kaydında
  kaydın adı, numarası ve yöneticinin adında; e-posta kaydında alıcılar,
  yanıt adresi, konu ve kayıt numarasında.
- Dizinler: `audit_log_at`, `audit_log_entity`, `email_log_type`.
- Test: `tests/db/panel-kayitlar.test.ts` (sıra, süzgeçler, Türkiye günü,
  `%`/`_`, sayfalama, süzgeç seçenekleri);
  `tests/e2e-db/panel-kayitlar.spec.ts` (menü, girişin kayıtta görünmesi,
  süzgeç adreste, e-posta kaydı satırı, oturumsuz açılmama).

### Panel ana sayfası

6. alan; `src/admin-dashboard.ts`.

- `readDashboardPanel`: önce süresi dolan havale siparişleri iptal edilir
  (`cancelExpiredTransfers`), sonra ana sayfanın verisi okunur: katalog
  (ürün, kategori, grup), online satış stoğu (`readRetailersPanel`:
  satıcılar, bağlı bayiler, sitede görünebilecek stok satırları, ayarlar),
  `orders`, `quotes`, `users` (şifre özeti boş; adresler gönderilmez),
  `service_requests`, `warranties`, haber ve etkinlikler. Bu kayıtlar
  tarayıcıya gitmez.
- Sunucu sayfası (`app/yonetim/(panel)/page.tsx`) dönemi `zw_panel_aralik`
  çerezinden okur (yoksa 30 gün) ve özeti, grafikleri, listeleri sunucuda
  hesaplar: `dashboardSummary` (`apps/zenweld-web/src/lib/admin-stats.ts`).
  Demo modunda aynı fonksiyon tarayıcıda çalışır. Günler Türkiye saatiyle
  başlar (sunucu UTC'de çalışsa da). Tarayıcıya yalnızca sonuç gider:
  sayılar, grafik noktaları, stoğu olmayan ilk 12 ürünün adı, son 5 teklif
  (kod, firma ya da yetkili, tarih) ve son 5 sipariş (kod, müşteri adı,
  tutar).
- Dönem değişince tarayıcı çerezi yazar ve sayfayı sunucuda yeniden
  hesaplatır (`router.refresh`).
- Test: `tests/unit/panel-ozeti.test.ts` (Türkiye günü, sonuçta e-posta,
  telefon, adres olmaması); `tests/db/panel-ana-sayfa.test.ts` (okunan
  veri, süresi dolan havale, şifre özeti);
  `tests/e2e-db/panel-ana-sayfa.spec.ts` (genel durum kutularının
  veritabanı sayıları, yeni teklifin sayılması, dönem değişince sunucunun
  yeniden hesaplaması, sayfada sipariş ve üye listesinin olmaması);
  demo modunda `tests/e2e/panel-ana-sayfa.spec.ts` (dönem seçimi).

---

## 11. SAP

Sahibinin kararları: K-82 (depo stoğu SAP'tan), K-84 (15 dakikada bir;
siparişler SAP'a satış siparişi), K-93 (yarım okuma koruması), K-108
(değiştirilebilir parçalar). Tablolar:
[VERITABANI.md › 4](VERITABANI.md#4-bayiler-online-satıcılar-ve-stok).

### SAP stok okuma

`src/sap-stock.ts`. Zenweld depo stoğunu kaynaktan okuyup
`warehouse_stock`'a yazar. Kurallar (kodun sadeleşmesi, aynı kalemin
toplanması, eksi miktar, geçersiz okuma):
[IS-KURALLARI.md › 20](IS-KURALLARI.md#20-zenweld-depo-stoğu).

- Her çalışmada `sap_sync_runs`'a bir satır yazılır (`running`). Okuma
  başarılıysa `success` ve kalem sayısı; değilse `failed` ve hata metni.
  30 dakikadan uzun `running` kalan okuma bir sonraki çalışmada
  "Yarıda kaldı" diye kapatılır.
- Başarılı okuma `warehouse_stock`'u tek işlemde yeniler: okumada olmayan
  kalem silinir, olan eklenir ya da güncellenir; bütün satırların
  `synced_at`'i ve `sync_run_id`'si bu okumadır. Başarısız okumada tabloya
  dokunulmaz (son iyi stok kalır).
- Aynı anda iki okuma uygulanmaz: yazma, veritabanı kilidi
  (`pg_try_advisory_xact_lock(82084)`) alınarak yapılır; kilit başkasındaysa
  okuma "Başka bir stok okuması sürüyor" hatasıyla biter.
- Yarım okuma koruması (KARARLAR K-93): stoktaki kalem sayısı öncekinin
  yarısının altına düşerse okuma `failed` olur ve uygulanmaz; `force`
  (uçta `{"zorla": true}`, `npm run sap:stok zorla`) ile uygulanır.
- **Kaynak:** Bugün deneme dosyası (`SAP_STOK_DOSYASI`; başlık satırı
  `kod;ad;miktar`, ayraç noktalı virgül, virgül ya da sekme; Excel'in CSV'si
  okunur). SAP bağlantı bilgileri gelince SAP'tan okuyan kaynak eklenir:
  SAP ekibinin hazırladığı "kullanılabilir stok" görünümü (`AVAILABLE_STOCK`,
  ad kesinleşmedi), Service Layer ya da veritabanına salt okunur kullanıcı
  ile; okuma kuralları ve yazma değişmez. Kaynak tanımlı değilse iş
  çalışmaz.
- **Çalıştırma:** Sitenin `/api/sap/stok` ucu (POST; yalnızca
  `CRON_SECRET` anahtarıyla, veritabanı modunda). Sunucunun zamanlayıcısı
  15 dakikada bir çağırır ([3](#3-barındırma-zamanlanmış-işler-ve-güvenlik-başlıkları));
  `npm run sap:stok` elle bir kez çağırır. Stok değiştiyse (eklenen, çıkan
  ya da miktarı değişen kalem) depo stoğunu kullanan sayfalar o anda
  yenilenir (`refreshSite(["depo-stogu"])`); değişmediyse yenilenmez.
- Test: `tests/db/sap-stok.test.ts` (okuma kaydı, tek işlemde yenileme,
  hatada son stoğun kalması, kilit, yarıda kalan okuma, yarım okuma
  koruması, deneme dosyası); `tests/e2e-db` (uç: anahtar, stok 0 gelince
  sayfanın hemen STOKTA YOK olması, hatalı ve yarım okuma, zorla).

### SAP sipariş aktarımı

`src/sap-orders.ts`. Ödemesi kesinleşen siparişi SAP'a gönderir
(`sap_order_exports`).

- **Sıraya girme:** Kartla verilen sipariş, siparişle aynı işlemde
  (`orders.ts` › `placeOrder`); havale siparişi panelde **Ödeme Alındı**
  denince, aynı işlemde (`admin-sales.ts` › `adminMarkOrderPaid`). Sipariş
  sıraya bir kez girer.
- **Gönderme:** Her çalışmada zamanı gelmiş (`pending`, `next_attempt_at`
  geçmiş) en fazla 20 sipariş, en eskisinden başlayarak, her biri ayrı
  işlemde gönderilir. Satır `FOR UPDATE SKIP LOCKED` ile alınır: aynı anda
  iki çalışma aynı siparişi göndermez.
- **Aktarıcı:** Siparişi SAP'a yazan parça (`SapOrderExporter`). Siparişin
  bütün bilgisini alır (`SapOrderPayload`: sipariş no ve tarihleri, müşteri,
  fatura ve teslimat adresi, satırlar (kod, ad, seçenek, adet, KDV hariç
  birim fiyat, KDV oranı, kupon payı), kargo, vade farkı, kupon, toplam,
  ödeme) ve SAP'ın istediği biçime kendisi çevirir. Bugün tek aktarıcı
  deneme dosyasıdır (`SAP_SIPARIS_DOSYASI`): her siparişi dosyaya bir satır
  JSON olarak ekler, belge numarası `DENEME-<sipariş no>`. SAP bilgileri
  gelince SAP'a yazan aktarıcı eklenir (`orderExporterFromEnv`); sıra,
  yeniden deneme ve panel değişmez. Gönderme sonucu yazılamazsa (sunucu o
  anda kapanırsa) sipariş yeniden gönderilebilir; SAP'a yazan aktarıcı
  siparişi sipariş numarasıyla yazar ve aynı numara SAP'ta varsa yeni
  sipariş açmaz, var olanın belge numarasını döndürür. Aktarıcı tanımlı
  değilse iş çalışmaz, siparişler sırada bekler.
- **Sonuç:** Başarılıysa `sent`, belge numarası ve an yazılır. Geçici
  hatada deneme sayısı artar, sıradaki deneme 5, 10, 20, 40… dakika sonra
  (en fazla 6 saat); 8. denemede de olmazsa `failed`. Aktarıcı hatanın
  geçici olmadığını söylerse (ör. SAP'ta cari yok) ilk denemede `failed`.
  Gönderilmeden iptal edilen sipariş gönderilmez, `skipped` olur.
- **Panel:** Sipariş detayında **SAP Aktarımı** kutusu (yalnızca veritabanı
  modunda, sırada olan siparişte). `failed` sipariş **Yeniden sıraya al**
  ile `pending`'e döner (deneme sayısı sıfır, hemen); değişiklik kaydına
  (`audit_log`) yazılır (`admin-sales.ts` › `adminRequeueSapOrder`).
- **Çalıştırma:** Sitenin `/api/sap/siparis` ucu (POST; yalnızca
  `CRON_SECRET` anahtarıyla, veritabanı modunda). Sunucunun zamanlayıcısı
  birkaç dakikada bir çağırır ([3](#3-barındırma-zamanlanmış-işler-ve-güvenlik-başlıkları));
  `npm run sap:siparis` elle bir kez çağırır. Uç gönderilen, yeniden
  denenecek, başarısız ve atlanan siparişlerin numaralarını döndürür.
- Test: `tests/db/sap-siparis.test.ts` (gönderme ve aktarıcıya giden
  bilgi, zamanı gelmeyen sipariş, artan aralarla deneme ve başarısız,
  geçici olmayan hata, iptal edilen sipariş, panelden yeniden sıraya alma,
  aynı anda iki çalışma, deneme dosyası); `tests/db/siparis.test.ts` ve
  `panel-satis.test.ts` (sıraya girme); `tests/e2e-db/sap-siparis.spec.ts`
  (panel kutusu, uç, yeniden sıraya alma).

---

## 12. Görseller ve dosyalar

**Örnek ürün ve içerik fotoğrafları:**

- **Ürünler:** Ekipmanların fotoğrafları sahibinden gelir ve depodadır
  (`apps/zenweld-web/public/images/products/`); fotoğrafı henüz olmayan
  ekipman alt kategorisinin kart çizimini, Force serisinin 9 ürünü ortak
  geçici bir fotoğrafı gösterir (KARARLAR K-77). Güvenlik, Aksesuarlar ve
  Dolgu Metalleri'nde bugün ürün yok; eklenen ürünün fotoğrafı panelden
  verilir.
- **Blog, haber, etkinlik, Hakkımızda ve Welders Club görselleri**
  **Unsplash**'ten gelir (`https://images.unsplash.com/…`,
  `packages/data/src/seed/images.ts`). Gerçek fotoğraflarla değiştirilmeli.
- Tarayıcının hangi adreslerden görsel yükleyebileceğini güvenlik politikası
  belirler; bugün her `https` adresine açıktır ([3](#3-barındırma-zamanlanmış-işler-ve-güvenlik-başlıkları)).
- `next.config.mjs` içindeki `images.remotePatterns` ayrıca yalnızca
  `images.unsplash.com`'a açıktır. Bu ayar Next.js'in görsel küçültme
  ucu (`/_next/image`) içindir; site bugün bu ucu kullanmıyor. Kullanılmaya
  başlanırsa yeni görsel sunucuları buraya da eklenmeli.
- Görsel yüklenemezse markalı Zenweld yer tutucusu gösterilir.

**Kategori, grup ve etkinlik logoları:** Depoda durur
(`apps/zenweld-web/public/images/`). Derleme öncesinde
`scripts/prepare-images.mjs` çalışır ve etkinlik logolarının çevresindeki
boş beyaz kenarı kırpar (`sharp` kütüphanesiyle). Köşeleri renkli (markanın
kendi zemini olan) logolara dokunmaz. `sharp` bulunamazsa derleme durmaz,
adım atlanır.

**Panelden yüklenen görseller:** Tarayıcıda küçültülür (en fazla 1,5 MB,
gerekirse WebP). Demo modunda kaydın içine metin (`data:`) olarak yazılır;
veritabanı modunda dosya deposuna yüklenir, kayıtta yalnızca adresi
(`/dosya/gorsel/…`) kalır.

**Belgeler (MSDS, Kaynak Rehberi, Parti Sertifikaları):** Demo modunda
dosyanın kendisi tarayıcının dosya deposunda (IndexedDB, `zenweld.files.v1`)
durur; yalnızca yükleyen tarayıcıda görünür. Veritabanı modunda dosya
deposuna yüklenir; yükleme sunucuda tür (içeriğe bakılarak) ve boyut
(25 MB) kontrolünden geçer
([IS-KURALLARI.md › 23](IS-KURALLARI.md#23-yüklenen-dosyalar)).

**Yorum fotoğraf ve videoları:** Kaydın içinde (`data:`) durur (video en
fazla 2 MB); dosya deposuna taşınması sonraya.

**Stok dosyaları:** Panelde tarayıcıda okunur (en fazla 5 MB; CSV ya da
XLSX). Orijinal dosya bugün saklanmaz; denetim için dosya deposuna
yazılması sonraya ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Bayi ve satıcı
stokları).

### Dosya deposu

`packages/db/src/file-storage.ts`; KARARLAR K-108. Panelde yüklenen görsel
ve belgeler veritabanına değil dosya deposuna yazılır. Kurallar (türler,
boyut, adres): [IS-KURALLARI.md › 23](IS-KURALLARI.md#23-yüklenen-dosyalar).

- **Depo parçası:** `FileStorage` (`put`, `get`, `size`). Hangisinin
  kullanılacağını sunucunun ayarı seçer (`fileStorageFromEnv`); bugün tek
  depo sunucunun diskidir (`diskStorage`, `DOSYA_KLASORU`). Dosya önce
  geçici adla yazılıp yerine konur (yarım dosya sunulmaz). Anahtar biçimi
  denetlenir; klasörün dışına çıkan yol okunmaz, yazılmaz. BT S3 uyumlu bir
  nesne deposu ya da ağ diski seçerse aynı arayüzle onun parçası eklenir;
  panel, yükleme ucu ve sunma adresi değişmez. Deponun anahtar ve şifreleri
  yalnızca sunucuda ortam değişkeni olur. `DOSYA_KLASORU` tanımlı değilse
  panelde dosya yüklenmez, adres girilir.
- **Yükleme:** `POST /api/yonetim/dosya?tur=gorsel|belge` (çok parçalı
  form, `dosya`): yalnızca veritabanı modunda ve geçerli panel oturumuyla
  (401), aynı siteden (403); depo ayarlı değilse 503. Tür dosyanın
  içeriğinden bulunur; kabul edilmeyen tür 400, büyük dosya 413. Yükleme
  `audit_log`'a (`files`) yazılır; yanıt `{ ok, address, fileName, size }`.
  Adres kayda panelin kendi kaydetme isteğinde yazılır.
- **Sunma:** `GET /dosya/<anahtar>` (`apps/zenweld-web/src/app/dosya/[...yol]/route.ts`):
  depodaki dosya türüyle gönderilir; bir yıl önbellekte tutulabilir
  (`immutable`). Geçersiz anahtar, ayarsız depo ya da olmayan dosya 404.
- **Panel:** Panel kabuğu depo ayarlıysa yüklemeyi açar
  (`components/admin/PanelFeatures.tsx`); görsel tarayıcıda küçültülüp
  yüklenir (`lib/admin-files.ts`).
- **Yedek:** Disk deposunda dosyalar yalnızca bu klasördedir; veritabanı
  yedeğine girmez. Klasör sunucunun yedeğine eklenmeli. Birden fazla sunucu
  çalışacaksa klasör ortak olmalı (ağ diski) ya da nesne deposuna
  geçilmeli.
- Kayıttan kaldırılan görselin ya da silinen belgenin dosyası depoda kalır
  (temizlik sonraya, [YAPILACAKLAR.md](YAPILACAKLAR.md)).
- Test: `tests/unit/yuklenen-dosyalar.test.ts` (türler, boyut, adres,
  disk deposu), `tests/db/panel-sayfalar.test.ts` (belgenin depodaki
  boyutu), `tests/e2e-db/dosya-yukleme.spec.ts` (uç, sunma),
  `panel-katalog.spec.ts` (ürün görseli), `panel-sayfalar.spec.ts` (belge).

---

## 13. Haritalar ve bağlantılar

**Bayi ve servis haritası** (Yetkili Bayi ve Servis Ağı sayfası ve ürün
sayfasındaki "Stoktaki Bayileri Gör"):

- **Leaflet** kütüphanesi ve **OpenStreetMap** harita döşemeleri
  (`https://{s}.tile.openstreetmap.org/…`). Anahtar gerekmez; haritada
  OpenStreetMap atfı yazar.
- Bayilerin konumu paneldeki enlem/boylamdan gelir.
- Her bayide **Yol tarifi** Google Haritalar'da açılır
  (`https://www.google.com/maps/dir/?api=1&destination=<enlem>,<boylam>`).
- **Not:** OpenStreetMap'in genel döşeme sunucusu yoğun ticari kullanım için
  önerilmez. Ziyaretçi sayısı artarsa ticari bir döşeme sağlayıcısına
  geçilmesi değerlendirilmeli; yalnızca döşeme adresi değişir.

**Ofis haritası** (İletişim sayfası):

- Google Haritalar **gömme** (iframe) ile gösterilir; adres metninden
  oluşturulur, anahtar gerekmez. Harita sayfa kaydırılınca yüklenir.
- **Yol Tarifi Al** Google Haritalar'da açılır.
- Ofis adresleri ve telefonları panelden girilir (Mağaza Ayarları › Şirket
  ve İletişim, K-105); yardımcılar `apps/zenweld-web/src/lib/contact.ts`.

Kod: `apps/zenweld-web/src/components/dealers/DealerMap.tsx`,
`apps/zenweld-web/src/components/dealers/DealerFinder.tsx`,
`apps/zenweld-web/src/lib/contact.ts`.

**Telefon, WhatsApp, e-posta ve sosyal medya:** Bunlar servis değil,
bağlantıdır; anahtar gerekmez.

| Bağlantı | Nerede | Biçim |
|---|---|---|
| Telefon | Bayiler, satış temsilcileri, İletişim | `tel:+90…` (boşluksuz) |
| WhatsApp | Bayiler (WhatsApp numarası varsa), satış temsilcileri | `https://wa.me/<ülke kodu dahil rakamlar>` |
| E-posta | Satış temsilcileri, İletişim | `mailto:` |
| Instagram, YouTube, LinkedIn, TikTok | Alt bilgi | Panelde Mağaza Ayarları › Şirket ve İletişim'de girilen adresler (K-105); boş olan gösterilmez |
| Kargo takip | Müşterinin ve panelin sipariş detayı | Firmanın takip adresi, `{takip}` yerine takip numarası (K-105) |

**Paylaşım önizlemesi:** WhatsApp, LinkedIn ve X'te paylaşılan sayfada
başlık, açıklama ve görsel çıkar (Open Graph ve Twitter Card etiketleri).
Görselin tam adresi site adresinden üretilir; bu yüzden
`NEXT_PUBLIC_SITE_URL` doğru olmalı, yoksa önizleme boş çıkar.

---

## 14. Kullanılan kütüphaneler

Dışarıya bağlanmayan, sitenin içinde çalışan başlıca kütüphaneler:

| Kütüphane | Ne için |
|---|---|
| Next.js 16, React 19 | Site ve panel |
| Tailwind CSS 4 | Biçim |
| lucide-react | Simgeler |
| Leaflet | Bayi haritası |
| MiniSearch | Site içi arama (tarayıcıda; Türkçe karakter sadeleştirme ve eş anlamlılarla) |
| read-excel-file | Stok dosyası (.xlsx) okuma; CSV kendi okuyucumuzla |
| @fontsource (Inter, Barlow Condensed) | Yazı tipleri sitenin kendi sunucusundan gelir; Google Fonts'a istek gitmez |
| sharp | Derleme öncesi logo kırpma |
| ESLint (eslint-config-next) | Kod denetimi; yalnızca geliştirirken ve derlemeden önce çalışır (`npm run build` önce bunu çalıştırır), siteye girmez |
| Vitest | İş kuralları testleri; yalnızca geliştirirken çalışır, siteye girmez |
| Playwright | Tarayıcı testleri; yalnızca geliştirirken çalışır, siteye girmez |
| @node-rs/argon2 | Şifre özeti (argon2id); yalnızca sunucuda (`packages/auth/src/server`) |
| Drizzle ORM, pg | Veritabanı tabloları ve bağlantısı (`packages/db`); `npm run db:*` komutları, veritabanı testleri ve veritabanı modundaki site kullanır |
| drizzle-kit, tsx | Geçiş betiklerini üretme, tablo görüntüleyici (`npm run db:studio`) ve komutları çalıştırma; yalnızca geliştirirken çalışır, siteye girmez |

Sürümler: `apps/zenweld-web/package.json`, kök `package.json`.

---

## 15. Henüz bağlanmayanlar

Canlıya çıkmadan ya da ileride bağlanması gereken servisler. Ayrıntılı iş
listesi [YAPILACAKLAR.md](YAPILACAKLAR.md)'dedir.

| Konu | Bugün | Gereken |
|---|---|---|
| **Canlı sunucu ve veritabanı** | Veritabanı modu hazır, yayındaki site demo modunda | Sunucunun ve PostgreSQL'in kurulması, tabloların (`db:migrate`) ve verinin (`db:yukle canli`) yüklenmesi, ilk yönetici (`yonetici:olustur`) |
| **SAP Business One (depo stoğu)** | Okuma işi hazır, SAP yerine deneme dosyasını okuyor (`/api/sap/stok`, `SAP_STOK_DOSYASI`) | SAP ekibinin hazırladığı "kullanılabilir stok" görünümünü (`AVAILABLE_STOCK`, ad kesinleşmedi) okuyan bağlantı parçası (KARARLAR K-82, K-84). Bağlantı yolu (Service Layer ya da veritabanına salt okunur kullanıcı) ve görünümün kolonları SAP ekibinden gelecek; bağlantı bilgileri yalnızca sunucuda ortam değişkeni olur. Zamanlayıcının seçilen sunucuda kurulması |
| **SAP Business One (satış siparişi)** | Aktarım sırası ve iş hazır, SAP yerine deneme dosyasına yazıyor (`/api/sap/siparis`, `SAP_SIPARIS_DOSYASI`, `sap_order_exports`; K-108). Panelde sipariş detayında SAP Aktarımı kutusu | Siparişi SAP'a satış siparişi olarak yazan aktarıcı parça (KARARLAR K-84; `packages/db/src/sap-orders.ts` › `SapOrderExporter`). SAP'ın sipariş API'si (ör. `SALES_ORDER`), cari, KDV, kargo, kupon ve vade farkının SAP'ta nasıl yazılacağı ve bağlantı bilgileri SAP ekibinden gelecek ([YAPILACAKLAR.md › Şirketten öğrenilecekler](YAPILACAKLAR.md#3-şirketten-öğrenilecekler-kişiye-göre) › SAP danışmanı); bilgiler yalnızca sunucuda ortam değişkeni olur. Zamanlayıcının seçilen sunucuda kurulması. SAP'a geçmiş siparişin iptali ve iadesi ayrıca konuşulur |
| **Dosya deposu** | Demo modunda görseller kaydın içinde, belgeler tarayıcıda. Veritabanı modunda dosya deposu parçası hazır (K-108): `DOSYA_KLASORU` ayarlıysa panelde görsel ve belge sunucunun diskine yüklenir, `/dosya/…` adresinden sunulur; ayarlı değilse adres girilir (K-101, K-104) | Deponun yeri ve yedeği BT ile kesinleşir (sunucunun diski ya da S3 uyumlu nesne deposu). Nesne deposu seçilirse onun parçası eklenir (`packages/db/src/file-storage.ts` › `FileStorage`). Kullanılmayan dosyaların temizliği |
| **Ödeme kuruluşu** | Temsili (para çekilmez) | [Kartla ödeme](#kartla-ödeme) › Canlı için gerekenler |
| **E-posta servisi** | Kodu hazır; anahtar yok, hiçbir e-posta gitmiyor | Resend kurulumu ([9](#9-formlar-ve-e-posta)); şifre sıfırlama e-postası da buna bağlı |
| **Müşteriye e-posta** | Yalnızca şifre sıfırlama (veritabanı modu) | Sipariş onayı ve sözleşme kopyası (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi |
| **Bülten** | Kayıt kutusu var, hiçbir yere gitmez | Bülten servisi seçilip bağlanmalı |
| **Analitik** (ziyaret, dönüşüm, sepette bırakılan) | Yok | Google Analytics vb.; çerez onayına bağlı yüklenmeli ve adresleri güvenlik politikasına (CSP) eklenmeli. Çerez ayarları penceresine analiz/pazarlama kategorileri eklenmeli |
| **e-Arşiv / e-Fatura** | Yok | Muhasebe yazılımı ya da entegratör |
| **Kargo** | Takip numarası elle girilir; firmaya takip sayfasının adresi girilince müşteri ve panelde takip bağlantısı (`carriers.tracking_url`, KARARLAR K-105) | İsteğe bağlı, firma API verirse: etiket oluşturma, durum ve teslim bilgisinin firmadan okunması; firma başına sunucuda bağlantı parçası, anahtar ortam değişkeninde ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Online satış 8) |
| **ETBİS ve MERSİS** | MERSİS no panelden girilir, sözleşmelere yazılır (K-105); ETBİS yok | Ticaret Bakanlığı kaydı; gerçek MERSİS no |
| **Zamanlanmış görevler** | SAP işleri uçta hazır; havale iptali sayfa açılınca çalışıyor | Zamanlayıcının kurulması; havale süresi dolan siparişleri iptal; işlem kaydının 2 yıldan eskisini silme (`purge_audit_log()`); kampanya başlangıç/bitişinde ürün sayfasını yenileme |
| **Bayi B2B uygulaması** | Yok | Ayrı uygulama ([YAPILACAKLAR.md](YAPILACAKLAR.md)) |
| **Doğrulanmış alıcı** | Giriş yapmış her üye | Yorum, üyenin o ürünü satın almasıyla eşleşmeli |
