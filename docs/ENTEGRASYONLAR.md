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
| Veritabanı | Tarayıcı deposu (demo). PostgreSQL tabloları hazır; site ayarla (`DATA_SOURCE=database`) katalogu tablolardan okuyabiliyor; panelin Satış ve Talepler ekranları veritabanında (K-99), diğer ekranlar henüz tarayıcıda | Sunucu veritabanı PostgreSQL ([VERITABANI.md](VERITABANI.md)); sunucuyu BT ekibi sağlar |
| Dosya deposu | Tarayıcı (demo) | Nesne deposu (görseller ve belgeler) |
| Bülten, şifre sıfırlama, müşteriye e-posta, analitik, e-Fatura, kargo | Yok | Bkz. [10](#10-henüz-bağlanmayanlar) |

---

## 2. E-posta (Resend)

**Ne yapar:** Sitedeki formlar gönderilince Zenweld'e
(`info@zenweld.com`) e-posta gider. Formlar ve içerikleri:
[IS-KURALLARI.md › Form e-postaları](IS-KURALLARI.md#18-form-e-postaları).
Veritabanı modunda müşteriye de bir e-posta gider: şifre sıfırlama
bağlantısı (düz metin, "Zenweld şifre sıfırlama"; KARARLAR K-95). Bu
e-postanın gitmemesi ziyaretçiye gösterilmez (hesabın olup olmadığı belli
olmasın); sunucu kaydına "Şifre sıfırlama e-postası gönderilemedi" yazılır,
bağlantı yazılmaz.

**Bugün:** Kurulu değil; `RESEND_API_KEY` hiçbir yerde tanımlı olmadığı
için **hiçbir e-posta gitmiyor**. Demo adresinde form yine "gönderildi"
der. E-postanın gelmesi için: Resend hesabı açılır, `zenweld.com` alan
adına Resend'in verdiği DNS kayıtları eklenir (gönderici adresinin
doğrulanması), anahtar ve gönderici adresi sunucuya ortam değişkeni
olarak girilir.

**Nasıl çalışır:**

- E-posta yalnızca **sunucudan** gönderilir; tarayıcı servise doğrudan
  bağlanmaz. Formlar sitenin kendi uçlarına gönderir:
  - `POST /api/bildirim` — iletişim, teklif, servis, garanti, yorum, üye,
    sipariş, iade talebi, Welders Club (`type` alanıyla).
  - Veritabanı modunda sipariş, iade talebi, teklif, servis talebi, garanti
    kaydı ve yorumun bildirimini, kaydı yapan sunucu kendisi gönderir
    (`/api/siparis`, `/api/formlar`; Aşama 5.2–5.3); tarayıcı `/api/bildirim`'e
    bu türleri göndermez. Şablonlar tek yerde:
    `apps/zenweld-web/src/lib/server/notify.ts`.
  - **E-posta kaydı** (veritabanı modu, KARARLAR K-81): gönderilen ya da
    gönderilemeyen her e-posta `email_log` tablosuna yazılır: tür, formun
    sayfası, bağlı kayıt, alıcı, konu, sonuç ve Resend'in verdiği numara.
    E-postanın metni saklanmaz.
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
  üyelik, iade talebi) e-postanın sonucunu beklemez; kayıt her durumda
  yapılır.
- **Yalnızca e-postayla giden formlar** (iletişim, bayilik, Welders Club,
  ürün destek sorusu; veritabanı modunda bunlar da kaydedilir ve e-posta
  gitmese de başarılı görünür, Aşama 5.3):
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
    gitmeli. Veritabanı modunda bütün kayıtlı formlar böyle (Aşama
    5.2–5.3); demo modunda tarayıcı kaydı kendisi oluşturup e-posta ucuna
    haber veriyor.
  - Sepet kuponunu deneyen uç (`/api/siparis/kupon`) ve garanti sorgulama
    (`/api/formlar/garanti`) da istek sınırına alınmalı (kod ve seri numarası
    denemesini zorlaştırmak için). Formlar veritabanına yazıldığı için
    (Aşama 5.3) istek sınırı ve bot koruması canlıdan önce şarttır; o zamana
    kadar yalnızca görünmez bot tuzağı vardır (KARARLAR K-98).

Kod: `apps/zenweld-web/src/lib/server/mail.ts`,
`apps/zenweld-web/src/app/api/`, `apps/zenweld-web/src/lib/notify.ts`,
`apps/zenweld-web/src/components/common/BotTrap.tsx`.

---

## 3. Kartla ödeme

**Bugün (Demo):**

- Ödeme sayfasında kart bilgisi yalnızca **biçim** olarak kontrol edilir
  (Luhn, son kullanma, CVC); hiçbir yere gönderilmez. Veritabanı modunda
  sunucuya yalnızca kartın ilk 6 ve son 4 hanesi gider (kart programı ve
  taksit sunucuda bulunur; Aşama 5.2).
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
   (`packages/data/src/payment.ts` › `cardProgram`).
4. **POS eşleştirmesi:** Paneldeki her POS gerçek bir sanal POS'a
   bağlanmalı. Mağaza no panelde kalabilir; **API anahtarı, şifre ve
   benzeri gizli bilgiler yalnızca sunucuda** ortam değişkeni olarak durmalı
   (ör. POS kimliğine göre adlandırılmış değişkenler). Bugün böyle bir
   değişken yoktur.
5. **Tutarlar sunucuda yeniden hesaplanır:** Veritabanı modunda yapıldı
   (Aşama 5.2): ürün fiyatı, kampanya, kupon, kargo ve vade farkı sunucuda
   [IS-KURALLARI.md](IS-KURALLARI.md)'deki kurallarla hesaplanır, sipariş
   numarasını sunucu verir (`packages/db/src/orders.ts`). Ödeme kuruluşu
   bağlanınca çekilecek tutar bu hesaptan alınmalı; işlemler
   `payment_transactions`'a yazılmalı.
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
- Süresi dolan siparişi iptal eden işlem bugün sayfa açılınca çalışır
  (veritabanı modunda üyenin siparişleri sunucudan okunurken; Aşama 5.2);
  canlıda ayrıca **günlük zamanlanmış görev** olmalı
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
| Drizzle ORM, pg | Veritabanı tabloları ve bağlantısı (`packages/db`); `npm run db:*` komutları, veritabanı testleri ve veritabanı modundaki site (`DATA_SOURCE=database`) kullanır |
| drizzle-kit, tsx | Geçiş betiklerini üretme, tablo görüntüleyici (`npm run db:studio`) ve komutları çalıştırma; yalnızca geliştirirken çalışır, siteye girmez |

Sürümler: `apps/zenweld-web/package.json`, kök `package.json`.

---

## 9. Barındırma ve ortam değişkenleri

**Bugün:** Demo Vercel'de yayında. **Canlı:** kendi sunucumuz ve kendi alan
adımız (KARARLAR K-92). Proje standart bir Next.js projesidir; her Node.js
sunucusunda `npm run build` + `npm start` ile çalışır.

- Node.js: 22 (`.nvmrc`); en az 20 (`package.json` › `engines`).
- Sunucunun yeri (KVKK), kurulumu ve demo Vercel'den kalkınca kaldırılacak
  parçalar: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Canlı sunucu.

**Ortam değişkenleri:** Örnek dosya `apps/zenweld-web/.env.example`'dır.
Bilgisayarda aynı klasöre `.env.local` adıyla kopyalanıp doldurulur
(`.env.local` GitHub'a gönderilmez); sunucuda ortam değişkeni olarak
tanımlanır (demoda Vercel › Project Settings › Environment Variables). **Kural:** Koda yeni bir değişken
eklendiğinde ya da biri kaldırıldığında bu tablo ve `.env.example` birlikte
güncellenir (`.env.example`'a gerçek değer yazılmaz).

| Değişken | Kim tanımlar | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yönetici | Sitenin adresi (ör. `https://zenweld.com`). Canonical adresler, site haritası, paylaşım önizlemesi ve **arama motorlarına açıklık** buna göre belirlenir |
| `RESEND_API_KEY` | Yönetici (gizli) | E-posta servisi anahtarı |
| `SUPPORT_EMAIL` | Yönetici | Form e-postalarının alıcısı; varsayılan `info@zenweld.com` |
| `SUPPORT_FROM` | Yönetici | Doğrulanmış gönderici adresi |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Yönetici (isteğe bağlı) | Panel ileride ayrı bir adrese (ör. `admin.zenweld.com`) taşınırsa ana sitenin adresi; paneldeki "Sayfayı gör" bağlantıları bunu kullanır. Bugün gerekmez |
| `DATABASE_URL` | Yönetici (gizli) | Veritabanı (PostgreSQL) bağlantı adresi. `npm run db:*` komutları ([VERITABANI.md](VERITABANI.md)) ve `DATA_SOURCE=database` ise site kullanır |
| `DATA_SOURCE` | Yönetici | Sitenin veri kaynağı (KARARLAR K-88). Boşsa site bugünkü gibi tarayıcıdaki veriyle çalışır. `database` ise ürünler, kategoriler, seçenekler, Zenweld depo stoğu ve mağaza ayarları (her sayfada) ile bayiler, bayi ve satıcı stokları ve yorumlar (yalnızca ürün sayfası, Bayi Bul ve anasayfa) ve içerik (blog, haber, etkinlik, SSS, yasal metinler, Hakkımızda, satış temsilcileri, belgeler, Sayfa SEO) veritabanından okunur; değişiklik en geç bir dakikada sitede görünür. Sitenin üyeliği (kayıt, giriş, oturum) de sunucudadır (Aşama 4.2). Derlemede de okunur: değiştirince yeniden derlenir, derleme sırasında veritabanına erişilebilmelidir |
| `REVALIDATE_SECRET` | Yönetici (gizli) | Siteyi beklemeden yenileme anahtarı (Aşama 3.6). Tanımlıysa `/api/yenile` ucu açılır; `npm run site:yenile` aynı anahtarla siteyi o anda yeniler. Boşsa uç kapalıdır. SAP stok okuma işi (ve ileride panel) siteyi kendi içinden yeniler, bu anahtara ihtiyaç duymaz |
| `CRON_SECRET` | Yönetici (gizli) | Zamanlanmış işlerin anahtarı. Tanımlıysa SAP stok okuma ucu (`/api/sap/stok`) açılır; zamanlayıcı ve `npm run sap:stok` bu anahtarla çağırır. Boşsa uç kapalıdır |
| `SAP_STOK_DOSYASI` | Yönetici / geliştirici | SAP bağlanana kadar depo stoğunun okunacağı deneme dosyası (CSV; örnek `packages/db/deneme/sap-stok.csv`). Göreli yol sitenin klasörüne (`apps/zenweld-web`) göredir. Boşsa ve SAP bağlantısı da yoksa okuma işi çalışmaz |
| `NEXT_DIST_DIR` | Otomatik (test) | Derleme klasörü; boşsa `.next`. Yalnızca veritabanı modunun testleri (`npm run test:e2e:db`) `.next-db` kullanır, demo derlemesi bozulmaz |
| `SITE_URL` | Geliştirici | Yalnızca `npm run site:yenile` ve `npm run sap:stok`: sitenin adresi; boşsa `NEXT_PUBLIC_SITE_URL`, o da boşsa `http://localhost:3000` |
| `TEST_DATABASE_URL` | Geliştirici | Yalnızca veritabanı testleri (`npm run test:db`); her çalıştırmada silinip baştan kurulur, `DATABASE_URL` ile aynı olamaz |
| `NEXT_PUBLIC_BUILD_TIME` | Otomatik (derleme) | Derleme anı; sunucu çıktısı ile tarayıcının ilk çiziminin aynı anı kullanması için |
| `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` | Otomatik (yalnızca demo, Vercel) | Site adresi tanımlı değilse yedek; önizleme sürümleri her zaman aramaya kapalı. Canlıda yoktur (K-92) |

**Site adresi sırası:** `NEXT_PUBLIC_SITE_URL` → Vercel'in otomatik
değişkenleri → `http://localhost:3000`.

**Zamanlanmış işler:** Bugün tek iş var: SAP depo stoğu okuma, 15 dakikada
bir (KARARLAR K-84). İş sitenin `/api/sap/stok` ucudur (POST,
`Authorization: Bearer <CRON_SECRET>`; ayrıntı [VERITABANI.md](VERITABANI.md)
› 14 › SAP stok okuma). Canlı sunucunun zamanlayıcısına (cron) bir satır
eklenir (K-92):

`*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://zenweld.com/api/sap/stok`

Sunucu şirket ağına (VPN) bağlıysa SAP internete açılmadan okunur. Uç
başarılı okumada 200, okunamayan ya da yarım okumada 502 (son stok kalır),
kaynak tanımlı değilse 503 döner; zamanlayıcının kaydında başarısız
görünür.

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
| **Veritabanı ve sunucu API'si** | Veri tarayıcıda; PostgreSQL tabloları hazır. Veritabanı modunda (K-88) katalog, içerik ve stok tablolardan okunuyor; üyelik, adresler, favoriler, siparişler ve iade talepleri sunucuda (Aşama 4, 5.1, 5.2) | Siteyi ve paneli veritabanına bağlama ([VERITABANI.md](VERITABANI.md)); kimlik doğrulama ve yetki kontrolü sunucuda |
| **SAP Business One (depo stoğu)** | Okuma işi hazır, SAP yerine deneme dosyasını okuyor (`/api/sap/stok`, `SAP_STOK_DOSYASI`; [9](#9-barındırma-ve-ortam-değişkenleri) › Zamanlanmış işler) | SAP ekibinin hazırladığı "kullanılabilir stok" görünümünü (`AVAILABLE_STOCK`, ad kesinleşmedi) okuyan bağlantı parçası (KARARLAR K-82, K-84). Bağlantı yolu (Service Layer ya da veritabanına salt okunur kullanıcı) ve görünümün kolonları SAP ekibinden gelecek; bağlantı bilgileri yalnızca sunucuda ortam değişkeni olur. Zamanlayıcının seçilen sunucuda kurulması |
| **SAP Business One (satış siparişi)** | Yok | Site siparişleri SAP'a satış siparişi olarak kaydedilecek (KARARLAR K-84); SAP'ın sipariş API'si (ör. `SALES_ORDER`) ve bağlantı bilgileri SAP ekibinden gelecek ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Zenweld depo stoğu (SAP)) |
| **Dosya deposu** | Görseller veritabanında, belgeler tarayıcıda. Veritabanı modunda panelde görsel yüklenmez, adres girilir (bugün kategori ve grup görselleri; KARARLAR K-101) | Nesne deposu |
| **Ödeme kuruluşu** | Demo | Bkz. [3](#3-kartla-ödeme) |
| **Müşteriye e-posta** | Yok | Sipariş onayı ve sözleşme kopyası (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi |
| **Şifremi Unuttum** | Veritabanı modunda bağlantı üretiliyor ve Resend'e veriliyor (K-95) | Resend kurulumu (yukarıdaki 2) |
| **Bülten** | Kayıt kutusu var, hiçbir yere gitmez | Bülten servisi seçilip bağlanmalı |
| **Analitik** (ziyaret, dönüşüm, sepette bırakılan) | Yok | Google Analytics vb.; çerez onayına bağlı yüklenmeli ve adresleri güvenlik politikasına (CSP) eklenmeli. Çerez ayarları penceresine analiz/pazarlama kategorileri eklenmeli |
| **e-Arşiv / e-Fatura** | Yok | Muhasebe yazılımı ya da entegratör |
| **Kargo** | Takip numarası elle girilir | İsteğe bağlı: takip bağlantısı (tablo hazır: `carriers.tracking_url`), etiket oluşturma, kargo firmasından teslim bilgisi |
| **ETBİS ve MERSİS** | Yok | Ticaret Bakanlığı kaydı; numaralar sözleşmelere |
| **Zamanlanmış görevler** | Sayfa açılınca çalışıyor | Havale süresi dolan siparişleri iptal; kampanya başlangıç/bitişinde ürün sayfasını yenileme |
| **Bayi B2B uygulaması** | Yok | Ayrı uygulama ([YAPILACAKLAR.md](YAPILACAKLAR.md)) |
| **Doğrulanmış alıcı** | Giriş yapmış her üye | Yorum, üyenin o ürünü satın almasıyla eşleşmeli |
