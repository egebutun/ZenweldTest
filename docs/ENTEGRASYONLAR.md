# Entegrasyonlar — Dış Servisler ve Ayarlar

Bu dosya sitenin dışarıdaki servislerle ve kütüphanelerle bağlantısını
anlatır: bugün ne bağlı, nasıl çalışıyor, hangi ayarı istiyor, demo ile
gerçek sistem arasında ne fark var ve canlıya çıkmadan neyin bağlanması
gerekiyor.

İlgili dosyalar:

- Hangi formun hangi e-postayı gönderdiği: [IS-KURALLARI.md](IS-KURALLARI.md#18-form-e-postaları)
- Kartla ödeme ve taksit kuralları: [IS-KURALLARI.md](IS-KURALLARI.md#5-kartla-ödeme-taksit-ve-banka-komisyonu)
- Canlıya çıkmadan yapılacakların tam listesi: [YAPILACAKLAR.md](YAPILACAKLAR.md)
- Kurulum ve çalıştırma: [README](../README.md)

**Güvenlik kuralı:** Bütün anahtarlar ve şifreler (e-posta servisi, ödeme
kuruluşu, POS) yalnızca **sunucuda ortam değişkeni** olarak tutulur. Panelde,
veritabanında, tarayıcıda ya da depoda (GitHub) **asla** durmaz.

---

## İçindekiler

1. [Özet](#1-özet)
2. [E-posta (Resend)](#2-e-posta-resend)
3. [Kartla ödeme](#3-kartla-ödeme)
4. [Havale / EFT](#4-havale--eft)
5. [Haritalar](#5-haritalar)
6. [Telefon, WhatsApp, e-posta ve sosyal medya bağlantıları](#6-telefon-whatsapp-e-posta-ve-sosyal-medya-bağlantıları)
7. [Görseller ve dosyalar](#7-görseller-ve-dosyalar)
8. [Kullanılan kütüphaneler](#8-kullanılan-kütüphaneler)
9. [Barındırma ve ortam değişkenleri](#9-barındırma-ve-ortam-değişkenleri)
10. [Henüz bağlanmayanlar](#10-henüz-bağlanmayanlar)

---

## 1. Özet

| Konu | Bugün | Canlı için |
|---|---|---|
| Form e-postaları | **Bağlı** (Resend) | Anahtar ve doğrulanmış gönderici tanımlanmalı |
| Kartla ödeme | Demo (para çekilmez) | Ödeme kuruluşu / banka sanal POS bağlanmalı |
| Havale / EFT | Elle onay (panelde "Ödeme Alındı") | Aynı kalabilir; istenirse banka hareketi entegrasyonu |
| Bayi haritası | **Bağlı** (Leaflet + OpenStreetMap) | Trafik artarsa ticari harita sağlayıcısı değerlendirilmeli |
| Ofis haritası ve yol tarifi | **Bağlı** (Google Haritalar gömme ve bağlantı; anahtar gerekmez) | — |
| Telefon, WhatsApp, e-posta | **Bağlı** (bağlantılar) | — |
| Sosyal medya | **Bağlı** (bağlantılar ve paylaşım önizlemesi) | — |
| Veritabanı | Tarayıcı deposu (demo) | Sunucu veritabanı ([VERI-MODELI.md](VERI-MODELI.md)) |
| Dosya deposu | Tarayıcı (demo) | Nesne deposu (görseller ve belgeler) |
| Bülten, şifre sıfırlama, müşteriye e-posta, analitik, e-Fatura, kargo | Yok | Bkz. [10](#10-henüz-bağlanmayanlar) |

---

## 2. E-posta (Resend)

**Ne yapar:** Sitedeki formlar gönderilince Zenweld'e
(`info@zenweld.com`) e-posta gider. Formlar ve içerikleri:
[IS-KURALLARI.md › Form e-postaları](IS-KURALLARI.md#18-form-e-postaları).

**Nasıl çalışır:**

- E-posta yalnızca **sunucudan** gönderilir; tarayıcı servise doğrudan
  bağlanmaz. Formlar sitenin kendi uçlarına gönderir:
  - `POST /api/bildirim` — iletişim, teklif, servis, garanti, yorum, üye,
    sipariş, Welders Club (`type` alanıyla).
  - `POST /api/bayilik` — bayilik başvurusu.
  - `POST /api/destek` — ürün sayfasındaki destek sorusu.
- Sunucu e-postayı Resend'in API'sine (`https://api.resend.com/emails`)
  gönderir.
- E-posta HTML'dir: başlık, alan tablosu ve varsa uzun metin. Formdan gelen
  her metin HTML'e zararsız hale getirilerek yazılır.
- **Yanıtla** denince yanıt formu doldurana gider (geçerli e-posta varsa).

**Ayarlar (ortam değişkenleri):**

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `RESEND_API_KEY` | Evet | resend.com'dan alınan anahtar. Yoksa e-posta gönderilmez |
| `SUPPORT_EMAIL` | Hayır | Alıcı; varsayılan `info@zenweld.com` |
| `SUPPORT_FROM` | Canlıda evet | Resend'de doğrulanmış gönderici adresi (ör. `Zenweld Web <web@zenweld.com>`). Yoksa Resend'in deneme adresi (`onboarding@resend.dev`) kullanılır; bu adres gerçek kullanım için uygun değildir |

**Uçların yanıtı:** `{ ok, delivered, demo }`

- `delivered`: e-posta gerçekten gitti mi.
- `demo`: site gerçek alan adında değil (demo adresi, önizleme, yerel
  bilgisayar).
- Anahtar yoksa ya da servis hata verirse `delivered: false` döner, istek
  hata vermez.

**Ziyaretçi ne görür:**

- **Kaydı panelde olan formlar** (sipariş, teklif, servis, garanti, yorum,
  üyelik) e-postanın sonucunu beklemez; kayıt her durumda yapılır.
- **Yalnızca e-postayla giden formlar** (iletişim, bayilik, Welders Club,
  ürün destek sorusu):
  - E-posta gittiyse başarılı.
  - Demo adresinde e-posta servisi tanımlı değilse yine başarılı görünür.
  - Canlıda e-posta gitmediyse ziyaretçiye hata gösterilir; tekrar
    deneyebilir. Ürün destek sorusunda ziyaretçiye doğrudan yazabileceği
    adres gösterilir.

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
  - Kayıt tutan formlar önce sunucuda veritabanına yazılmalı, e-posta bu
    kayıttan gönderilmeli; sipariş e-postası ödeme kuruluşunun onayından sonra
    gitmeli. Bugün tarayıcı kaydı kendisi oluşturup e-posta ucuna haber
    veriyor.

Kod: `apps/zenweld-web/src/lib/server/mail.ts`,
`apps/zenweld-web/src/app/api/`, `apps/zenweld-web/src/lib/notify.ts`,
`apps/zenweld-web/src/components/common/BotTrap.tsx`.

---

## 3. Kartla ödeme

**Bugün (Demo):**

- Ödeme sayfasında kart bilgisi yalnızca **biçim** olarak kontrol edilir
  (Luhn, son kullanma, CVC); hiçbir yere gönderilmez.
- Kartın programı (Bonus, World …) kartın ilk 6 hanesinden sabit bir kuralla
  seçilir.
- 1,5 saniyelik "3D Secure doğrulanıyor…" beklemesinden sonra ödeme alınmış
  sayılır; **para çekilmez.**
- Siparişe yalnızca marka, program, son 4 hane, taksit sayısı, POS adı ve
  komisyon oranı yazılır.
- Banka POS'ları, taksit ve komisyon oranları panelde Mağaza Ayarları ›
  Kartla Taksit'te tanımlıdır; değerler **örnektir.**

**Canlı için gerekenler:**

1. **Ödeme kuruluşu seçimi:** iyzico, PayTR ya da bankaların sanal POS'ları
   (birden çok banka POS'u kullanılabilir; panel buna göre kuruldu).
2. **Kart bilgisi Zenweld sunucusuna gelmemeli:** Kuruluşun ödeme formu ya da
   3D Secure sayfası kullanılmalı.
3. **Kart programı ve taksitler:** Kartın programı kuruluşun kart (BIN)
   sorgusundan alınmalı; demodaki sabit kural kaldırılmalı
   (`apps/zenweld-web/src/lib/payment.ts` › `cardProgram`).
4. **POS eşleştirmesi:** Paneldeki her POS gerçek bir sanal POS'a
   bağlanmalı. Mağaza no panelde kalabilir; **API anahtarı, şifre ve
   benzeri gizli bilgiler yalnızca sunucuda** ortam değişkeni olarak durmalı
   (ör. POS kimliğine göre adlandırılmış değişkenler). Bugün böyle bir
   değişken yoktur.
5. **Tutarlar sunucuda yeniden hesaplanmalı:** Tarayıcıdan gelen tutara
   güvenilmez; ürün fiyatı, kampanya, kargo ve vade farkı sunucuda
   [IS-KURALLARI.md](IS-KURALLARI.md)'deki kurallarla hesaplanmalı. Sipariş
   numarası sunucuda verilmeli.
6. **Ödeme sonucu:** Kuruluşun dönüş (callback) adresi siparişi
   kesinleştirmeli; başarısız ödemede sipariş oluşmamalı.
7. **İade ve iptal:** Bugün panel iade yapmaz ("İadeyi ödeme kuruluşu /
   banka üzerinden ayrıca yapmanız gerekir"). Kuruluşun iade API'si
   bağlanabilir.
8. **Komisyon:** Paneldeki tahmini komisyon yerine istenirse kuruluşun
   bildirdiği gerçek kesinti yazılabilir.
9. **Güvenlik politikası:** Kuruluşun ödeme ya da 3D Secure sayfasının adresi
   sitenin güvenlik politikasına eklenmeli: sayfa çerçeve içinde açılıyorsa
   `frame-src`'ye, siteden form ile gönderiliyorsa `form-action`'a. Eklenmezse
   tarayıcı ödeme sayfasını engeller (bkz. [9](#9-barındırma-ve-ortam-değişkenleri)
   › Güvenlik başlıkları).

Kod: `apps/zenweld-web/src/app/(site)/odeme/page.tsx`,
`apps/zenweld-web/src/components/shop/CardPayment.tsx`,
`apps/zenweld-web/src/lib/payment.ts`, `packages/data/src/checkout.ts`.

---

## 4. Havale / EFT

- Banka entegrasyonu yoktur. Müşteri siparişten sonra Mağaza Ayarları'ndaki
  hesaplardan birine ödeme yapar ve açıklamaya sipariş numarasını yazar.
- Ödeme hesaba geçince panelde **Ödeme Alındı** denir.
- Süresi dolan siparişi iptal eden işlem bugün sayfa açılınca çalışır;
  canlıda **günlük zamanlanmış görev** olmalı
  ([IS-KURALLARI.md › Havale](IS-KURALLARI.md#6-havale--eft)).
- İstenirse ileride bankanın hesap hareketleri servisiyle otomatik eşleştirme
  yapılabilir (sipariş numarası açıklamadan okunarak).

---

## 5. Haritalar

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
- Ofis adresleri ve telefonları kodda durur
  (`apps/zenweld-web/src/lib/contact.ts`); panelden değişmez.

Kod: `apps/zenweld-web/src/components/dealers/DealerMap.tsx`,
`apps/zenweld-web/src/components/dealers/DealerFinder.tsx`,
`apps/zenweld-web/src/lib/contact.ts`.

---

## 6. Telefon, WhatsApp, e-posta ve sosyal medya bağlantıları

Bunlar servis değil, bağlantıdır; anahtar gerekmez.

| Bağlantı | Nerede | Biçim |
|---|---|---|
| Telefon | Bayiler, satış temsilcileri, İletişim | `tel:+90…` (boşluksuz) |
| WhatsApp | Bayiler (WhatsApp numarası varsa), satış temsilcileri | `https://wa.me/<ülke kodu dahil rakamlar>` |
| E-posta | Satış temsilcileri, İletişim | `mailto:` |
| Instagram, YouTube, LinkedIn | Alt bilgi | `lib/contact.ts` içindeki adresler |

**Paylaşım önizlemesi:** WhatsApp, LinkedIn ve X'te paylaşılan sayfada
başlık, açıklama ve görsel çıkar (Open Graph ve Twitter Card etiketleri).
Görselin tam adresi site adresinden üretilir; bu yüzden
[`NEXT_PUBLIC_SITE_URL`](#9-barındırma-ve-ortam-değişkenleri) doğru olmalı,
yoksa önizleme boş çıkar.

---

## 7. Görseller ve dosyalar

**Örnek ürün ve içerik fotoğrafları:**

- **Ürünler:** Örnek verideki 60 ürünün hepsi depodaki tek bir Zenweld ürün
  fotoğrafını kullanır
  (`apps/zenweld-web/public/images/products/zenweld-urun.webp`). Her ürünün
  kendi fotoğrafı panelden eklenmeli.
- **Blog, haber, etkinlik, Hakkımızda ve Welders Club görselleri**
  **Unsplash**'ten gelir (`https://images.unsplash.com/…`,
  `packages/data/src/seed/images.ts`). Gerçek fotoğraflarla değiştirilmeli.
- Tarayıcının hangi adreslerden görsel yükleyebileceğini güvenlik politikası
  belirler; bugün her `https` adresine açıktır (bkz.
  [9](#9-barındırma-ve-ortam-değişkenleri) › Güvenlik başlıkları).
- `next.config.mjs` içindeki `images.remotePatterns` ayrıca yalnızca
  `images.unsplash.com`'a açıktır. Bu ayar Next.js'in görsel küçültme
  ucu (`/_next/image`) içindir; site bugün bu ucu kullanmıyor. Kullanılmaya
  başlanırsa yeni görsel sunucuları buraya da eklenmeli.
- Görsel yüklenemezse markalı Zenweld yer tutucusu gösterilir.

**Kategori, grup ve etkinlik logoları:** Depoda durur
(`apps/zenweld-web/public/images/`).

- Derleme öncesinde `scripts/prepare-images.mjs` çalışır ve etkinlik
  logolarının çevresindeki boş beyaz kenarı kırpar (`sharp` kütüphanesiyle).
  Köşeleri renkli (markanın kendi zemini olan) logolara dokunmaz.
  `sharp` bulunamazsa derleme durmaz, adım atlanır.

**Panelden yüklenen görseller (Demo notu):**

- Tarayıcıda küçültülür (en fazla 1,5 MB, gerekirse WebP) ve
  veritabanının içine metin (`data:`) olarak yazılır.
- Gerçek sistemde bir **nesne deposuna** (ör. S3 uyumlu depo) yüklenmeli;
  kayıtta yalnızca adres kalmalı.

**Belgeler (MSDS, Kaynak Rehberi, Parti Sertifikaları) — Demo notu:**

- Dosyanın kendisi tarayıcının dosya deposunda (IndexedDB,
  `zenweld.files.v1`) durur; yalnızca yükleyen tarayıcıda görünür.
- Gerçek sistemde nesne deposuna yüklenmeli; yükleme sunucuda tür ve boyut
  (25 MB) kontrolünden geçmeli ([YAPILACAKLAR.md](YAPILACAKLAR.md) ›
  Belgeler).

**Yorum fotoğraf ve videoları (Demo notu):** Tarayıcı deposunda durur
(video en fazla 2 MB); gerçek sistemde nesne deposuna taşınmalı.

**Stok dosyaları:** Panelde tarayıcıda okunur (en fazla 5 MB; CSV ya da
XLSX). Backend'de orijinal dosya denetim için saklanmalı ([STOK.md](STOK.md)).

---

## 8. Kullanılan kütüphaneler

Dışarıya bağlanmayan, sitenin içinde çalışan başlıca kütüphaneler:

| Kütüphane | Ne için |
|---|---|
| Next.js 15, React 19 | Site ve panel |
| Tailwind CSS 4 | Biçim |
| lucide-react | Simgeler |
| Leaflet | Bayi haritası |
| MiniSearch | Site içi arama (tarayıcıda; Türkçe karakter sadeleştirme ve eş anlamlılarla) |
| read-excel-file | Stok dosyası (.xlsx) okuma; CSV kendi okuyucumuzla |
| @fontsource (Inter, Barlow Condensed) | Yazı tipleri sitenin kendi sunucusundan gelir; Google Fonts'a istek gitmez |
| sharp | Derleme öncesi logo kırpma |
| ESLint (eslint-config-next) | Kod denetimi; yalnızca geliştirirken ve derlemede çalışır, siteye girmez |

Sürümler: `apps/zenweld-web/package.json`, kök `package.json`.

---

## 9. Barındırma ve ortam değişkenleri

**Bugün:** Demo Vercel'de yayında. Proje standart bir Next.js projesidir;
her Node.js sunucusunda `npm run build` + `npm start` ile çalışır.

- Node.js: 22 (`.nvmrc`); en az 20 (`package.json` › `engines`).
- Barındırma kararı (KVKK ve sunucu yeri) ve Vercel dışına geçişte
  kaldırılacak parçalar: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Canlı sunucu.

**Ortam değişkenleri:** Örnek dosya `apps/zenweld-web/.env.example`'dır.
Bilgisayarda aynı klasöre `.env.local` adıyla kopyalanıp doldurulur
(`.env.local` GitHub'a gönderilmez); Vercel'de Project Settings ›
Environment Variables'a girilir. **Kural:** Koda yeni bir değişken
eklendiğinde ya da biri kaldırıldığında bu tablo ve `.env.example` birlikte
güncellenir (`.env.example`'a gerçek değer yazılmaz).

| Değişken | Kim tanımlar | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yönetici | Sitenin adresi (ör. `https://zenweld.com`). Canonical adresler, site haritası, paylaşım önizlemesi ve **arama motorlarına açıklık** buna göre belirlenir |
| `RESEND_API_KEY` | Yönetici (gizli) | E-posta servisi anahtarı |
| `SUPPORT_EMAIL` | Yönetici | Form e-postalarının alıcısı; varsayılan `info@zenweld.com` |
| `SUPPORT_FROM` | Yönetici | Doğrulanmış gönderici adresi |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Yönetici (isteğe bağlı) | Panel ileride ayrı bir adrese (ör. `admin.zenweld.com`) taşınırsa ana sitenin adresi; paneldeki "Sayfayı gör" bağlantıları bunu kullanır. Bugün gerekmez |
| `NEXT_PUBLIC_BUILD_TIME` | Otomatik (derleme) | Derleme anı; sunucu çıktısı ile tarayıcının ilk çiziminin aynı anı kullanması için |
| `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` | Otomatik (Vercel) | Site adresi tanımlı değilse yedek; önizleme sürümleri her zaman aramaya kapalı |

**Site adresi sırası:** `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik
değişkenleri → `http://localhost:3000`.

**Arama motorlarına açıklık:** Site yalnızca `zenweld.com` ve
`www.zenweld.com` adreslerinde aramaya açıktır. Gerçek alan adı farklıysa
`apps/zenweld-web/src/lib/seo.ts` › `INDEXABLE_HOSTS` listesine eklenmeli
([IS-KURALLARI.md](IS-KURALLARI.md#13-linkler-yönlendirme-ve-arama-motorları)).

**Panel:** Sitenin içinde `/yonetim` adresinde çalışır; ayrı bir proje ya da
alan adı yoktur. Arama motorlarına her zaman kapalıdır (sayfa etiketi ve
`X-Robots-Tag` başlığı).

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

**Kural:** Siteye yeni bir dış servis eklendiğinde (analiz kodu, video, sohbet
aracı, ödeme sayfası, başka bir harita) adresi `next.config.mjs` içindeki
politikaya da yazılmalıdır; yazılmazsa tarayıcı servisi engeller ve konsolda
"Content Security Policy" uyarısı çıkar.

---

## 10. Henüz bağlanmayanlar

Canlıya çıkmadan ya da ileride bağlanması gereken servisler. Ayrıntılı iş
listesi [YAPILACAKLAR.md](YAPILACAKLAR.md)'dedir.

| Konu | Bugün | Gereken |
|---|---|---|
| **Veritabanı ve sunucu API'si** | Bütün veri tarayıcıda | Sunucu veritabanı ([VERI-MODELI.md](VERI-MODELI.md)); kimlik doğrulama ve yetki kontrolü sunucuda |
| **Dosya deposu** | Görseller veritabanında, belgeler tarayıcıda | Nesne deposu |
| **Ödeme kuruluşu** | Demo | Bkz. [3](#3-kartla-ödeme) |
| **Müşteriye e-posta** | Yok | Sipariş onayı ve sözleşme kopyası (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi |
| **Şifremi Unuttum** | Ekran var, e-posta gitmez | Şifre sıfırlama bağlantısı e-postası |
| **Bülten** | Kayıt kutusu var, hiçbir yere gitmez | Bülten servisi seçilip bağlanmalı |
| **Analitik** (ziyaret, dönüşüm, sepette bırakılan) | Yok | Google Analytics vb.; çerez onayına bağlı yüklenmeli ve adresleri güvenlik politikasına (CSP) eklenmeli. Çerez ayarları penceresine analiz/pazarlama kategorileri eklenmeli |
| **e-Arşiv / e-Fatura** | Yok | Muhasebe yazılımı ya da entegratör |
| **Kargo** | Takip numarası elle girilir | İsteğe bağlı: takip bağlantısı, etiket oluşturma |
| **ETBİS ve MERSİS** | Yok | Ticaret Bakanlığı kaydı; numaralar sözleşmelere |
| **Zamanlanmış görevler** | Sayfa açılınca çalışıyor | Havale süresi dolan siparişleri iptal; kampanya başlangıç/bitişinde ürün sayfasını yenileme |
| **Bayi B2B uygulaması** | Yok | Ayrı uygulama ([YAPILACAKLAR.md](YAPILACAKLAR.md)) |
| **Doğrulanmış alıcı** | Giriş yapmış her üye | Yorum, üyenin o ürünü satın almasıyla eşleşmeli |
