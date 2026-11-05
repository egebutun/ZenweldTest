# Veritabanı — PostgreSQL Tabloları ve Kolonları

Bu dosya sitenin ve panelin sunucu veritabanını tablo tablo anlatır: her
tablonun kolonları, türleri, hangi kolonun zorunlu ya da benzersiz olduğu,
tabloların birbirine nasıl bağlandığı ve bir kayıt silinince ne olduğu.

**Durum (2026-11-04):** Liste sahibince onaylandı (KARARLAR K-81). Tablolar
kodda (`packages/db/src/schema/`) ve geçiş betiklerinde hazır; bilgisayardaki
PostgreSQL'de kuruluyor ve testleri geçiyor. Site ayarla
(`DATA_SOURCE=database`, K-88) katalogu (ürünler, kategoriler, seçenekler,
depo stoğu, mağaza ayarları) tablolardan okuyabiliyor; panel ve diğer
kayıtlar henüz tarayıcıda.
Tabloların asıl tanımı koddadır; bu dosya her şema değişikliğinde aynı
commit'te güncellenir. Kod ve komutlar: [14](#14-kod-betikler-ve-komutlar).

İlgili dosyalar:

- Alanların anlamı, sitede ve panelde nasıl kullanıldığı:
  [VERI-MODELI.md](VERI-MODELI.md). Bu dosya onun veritabanındaki karşılığıdır.
- Stok tablolarının SQL'i ve stok sorguları: [STOK.md](STOK.md) › Backend'e
  geçiş.
- Hesap kuralları (fiyat, KDV, taksit, numara): [IS-KURALLARI.md](IS-KURALLARI.md).

---

## İçindekiler

1. [Genel kurallar](#1-genel-kurallar)
2. [Bugünkü veriden farklar](#2-bugünkü-veriden-farklar)
3. [Katalog](#3-katalog)
4. [Bayiler, online satıcılar ve stok](#4-bayiler-online-satıcılar-ve-stok)
5. [Üyeler ve oturumlar](#5-üyeler-ve-oturumlar)
6. [Teklifler](#6-teklifler)
7. [Siparişler ve iadeler](#7-siparişler-ve-iadeler)
8. [Servis talepleri, garantiler, yorumlar](#8-servis-talepleri-garantiler-yorumlar)
9. [İçerik](#9-içerik)
10. [Ayarlar ve ödeme](#10-ayarlar-ve-ödeme)
11. [Formlar, e-postalar, kayıt numaraları ve değişiklik kaydı](#11-formlar-e-postalar-kayıt-numaraları-ve-değişiklik-kaydı)
12. [Tablo listesi](#12-tablo-listesi)
13. [Açık sorular](#13-açık-sorular)
14. [Kod, betikler ve komutlar](#14-kod-betikler-ve-komutlar)

---

## 1. Genel kurallar

**Adlar:** Tablo ve kolon adları küçük harf ve alt çizgiyle yazılır
(`category_id`). Koddaki alanın karşılığı her tabloda "Koddaki" sütununda
yazar (`categorySlug`).

**Türler:**

| Ne | Tür | Not |
|---|---|---|
| Kimlik | `text` | Bugünkü kimlikler aynen taşınır (`p-ultimate-250-mtc`). Yeni kaydın kimliğini bugünkü gibi uygulama verir (`<önek>-<zaman><rastgele>`) |
| Tarih ve saat | `timestamptz` | Saat dilimiyle saklanır. Gün hesapları ve ekrandaki tarih Türkiye saatine (Europe/Istanbul) göredir |
| Yalnızca tarih | `date` | Etkinlik başlangıç/bitişi, garanti bitişi |
| Para | `numeric(12,2)` | Türk lirası; kuruş kayması olmaz. Hangi tutarın KDV dahil, hangisinin hariç olduğu kolon adında yazar (`_ex_vat` = KDV hariç) |
| Oran (%) | `numeric(5,2)` | KDV, komisyon, vade farkı |
| Sabit değer listesi | `text` + `CHECK` | Durum, rol, bölüm gibi. Yeni değer eklemek bir betikle yapılır |
| Ekranda hep birlikte okunan liste | `jsonb` | Teknik özellik satırları, kutu içeriği, öne çıkanlar, görsel listesi, SEO alanları, ayarlar. İçindeki alan adları uygulamadaki gibidir (`fullName`, `ratePercent`); kayıt katmanı dönüştürmeden okur |
| Kimliği ya da kuralı olan her şey | ayrı tablo | Varyantlar, ürün kodları, filtre eşlemeleri, sipariş satırları |

**Zorunlu:** "Kural" sütununda **zorunlu** yazmayan kolon boş bırakılabilir.

**Zaman damgaları:** Değiştirilebilen her tabloda `created_at` (oluşturulma)
ve `updated_at` (son değişiklik) vardır. Bugünkü veride olmayanlar
"(yeni)" diye işaretlidir.

**Silme:** Bağlantılarda silinince ne olacağı [VERI-MODELI.md › Silme
kuralları](VERI-MODELI.md#13-silme-kuralları)'na göredir:

- **zincir:** bağlı kayıt da silinir (ör. ürün silinince stok satırları).
- **boşalır:** bağlantı kolonu boşalır, kayıt kalır (ör. ürün silinince
  siparişteki ürün bağı; satırdaki ad ve kod kopyası durur).
- **engeller:** bağlı kayıt varken silinmez (ör. içinde ürün olan kategori).

**Kopya alanlar:** Sipariş, teklif, iade ve servis satırlarındaki ürün adı,
kodu, seçenek adı ve fiyatı o anın kopyasıdır; ürün değişse ya da silinse de
değişmez.

**Sürüm:** PostgreSQL 18 (KARARLAR K-81). Not: 18'de "engeller" kuralına
takılan silme 23001 (`restrict_violation`) hata koduyla döner; 17 ve
öncesinde 23503 dönerdi. Kayıt katmanı hatayı Türkçe mesaja çevirirken
ikisini de tanımalıdır.

**Türkçe büyük/küçük harf:** "Benzersiz (harf duyarsız)" yazan kolonlar
Türkçe kurallarla karşılaştırılır (I/ı, İ/i; "Işık" = "IŞIK", "Isık"
farklı). Veritabanında Türkçe küçük harfe çevrilmiş hali üzerinden benzersiz
dizinle sağlanır (`lower(ad COLLATE "tr-x-icu")`); PostgreSQL'in ICU desteği
gerekir (AWS ve Google Cloud'un PostgreSQL servislerinde vardır).

**Dosyalar:** Görsel ve belge kolonlarında yalnızca adres ya da dosya
deposundaki yol durur; dosyanın kendisi veritabanına yazılmaz (bugün panelden
yüklenen görseller kaydın içinde duruyor; geçişte dosya deposuna taşınacak).

**Gizli bilgiler:** POS API anahtarı ve şifresi ile e-posta servisinin
anahtarı hiçbir tabloda tutulmaz; yalnızca sunucuda ortam değişkenidir.
Kart numarası hiç saklanmaz; siparişte yalnızca son 4 hane durur.

---

## 2. Bugünkü veriden farklar

Bugünkü veri (`packages/data/src/types.ts › ZenweldDatabase`) çoğunlukla
tabloya birebir gider. Farklı olanlar:

| Bugün | Veritabanında | Neden |
|---|---|---|
| Kategori gruba linkle bağlı (`group`) | `categories.group_id` | Grubun linki değişince bağ bozulmasın |
| Ürün kategoriye linkle bağlı (`categorySlug`); servis talebi ve garanti de | `category_id` | Aynı neden |
| Üründe, kategoride ve grupta `section` | Yalnızca grupta; kategori ve ürün grubundan alır | Tek yerde dursun, çelişmesin |
| `previousSlugs`, `previousPaths` (ürün, varyant, kategori, grup, blog, haber, etkinlik) | `redirects` tablosu | Eski adresler tek tabloda; "yeni link başka kaydın eski linkiyse o yönlendirme silinir" kuralı kendiliğinden sağlanır |
| Ürün kodu ve varyant kodlarının tek havuzda benzersizliği (bugün panel kontrol ediyor) | `sku_codes` tablosu | İki tabloya yayılan kural veritabanında da sağlansın |
| Ürünün `options` nesnesi | `product_options`, `product_variants`, `product_variant_values` | Varyant kodu, stok ve sepet varyanta bağlanıyor |
| Ürünün `filterValues` nesnesi | `product_filter_values` | Filtre ya da değer silinince ürünlerdeki işaret de kalksın |
| Kategorinin `optionIds` ve `filters` listeleri | `category_option_definitions`, `category_filters`, `category_filter_values` | Aynı neden |
| Ürünün `discount` nesnesi | `products.discount_*` kolonları | Anasayfadaki kampanya listesi sorgulanabilsin |
| Siparişin `payment`, `shipment` nesneleri | `orders` kolonları | Havale süresi, ödeme ve kargo tarihleri sorgulanabilsin |
| Siparişin `history` listesi | `order_status_history` | Kimin değiştirdiği de yazılsın |
| `settings.shop.pos`, `settings.shop.bankAccounts` | `payment_pos`, `bank_accounts` | Siparişler POS'a bağlanıyor |
| `about` nesnesi | `about_page` (tek satır) | — |
| `recordCounters` | `record_counters` | Aynı anda gelen iki kayıt aynı numarayı almasın |
| Favoriler tarayıcıda | `favourites` | Üye başka cihazda da görsün |
| Oturum tarayıcıda | `sessions` | Oturum sunucuda tutulmalı (YAPILACAKLAR › Üyelik) |
| İletişim, bayilik, Welders Club, ürün destek formları yalnızca e-posta | `dealer_applications`, `support_messages`, `welders_club_signups` | Sahibinin kararı (K-81) |
| Zenweld deposunda her ürün stokta sayılıyor (K-20) | `warehouse_stock`, `sap_sync_runs` | Depo stoğu SAP'tan okunur (K-82) |
| Siparişin kargo bilgisi (`shipment`) siparişin içinde; kargo firmaları ayarlarda metin listesi | `shipments`, `carriers` | İade gönderisi de tutulabilsin; takip bağlantısı verilebilsin |
| Kuponun `productIds`, `categoryIds`, `customerEmails` listeleri | `coupon_targets`, `coupon_customers` | Silinen ürün ve kategori kupondan da çıksın; e-postayla arama yapılabilsin (K-85, K-86) |
| Bütün form e-postaları tek adrese gidiyor (`SUPPORT_EMAIL`, varsayılan info@zenweld.com) | `email_recipients` | Alıcı ileride forma göre değişebilir (K-81) |
| Gönderilen e-postaların kaydı yok | `email_log` | Hangi sayfa ve özellik için gönderildiği tutulur (K-81) |
| Panel değişikliklerinin kaydı yok | `audit_log` | Sahibinin kararı (K-81) |

Tarayıcıda kalacaklar (sepet, teklif listesi, çerez tercihi):
[VERI-MODELI.md › Tarayıcıda tutulanlar](VERI-MODELI.md#14-tarayıcıda-tutulanlar).

---

## 3. Katalog

### `category_groups` — gruplar

Koddaki: `categoryGroups`.

| Kolon | Tür | Kural | Açıklama (koddaki alan) |
|---|---|---|---|
| `id` | text | anahtar | |
| `section` | text | zorunlu; `ekipmanlar`, `guvenlik`, `aksesuarlar`, `dolgu-metalleri` | Bölüm |
| `slug` | text | zorunlu; bölüm içinde benzersiz | Link |
| `name` | text | zorunlu | |
| `description` | text | | Grup sayfasındaki kısa açıklama |
| `about_text` | text | | Sayfa altındaki tanıtım (`aboutText`) |
| `image` | text | | Kart görseli |
| `position` | int | zorunlu | Sıra (`order`) |
| `code` | text | | Kategori tablosundaki numara ("1.2"); kullanılmıyor |
| `seo` | jsonb | | `{ title, description, keywords[] }` |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: içinde kategori varsa silinmez.

### `categories` — kategoriler

| Kolon | Tür | Kural | Açıklama (koddaki alan) |
|---|---|---|---|
| `id` | text | anahtar | |
| `group_id` | text | zorunlu; → `category_groups` (engeller) | `group` (bugün grubun linki) |
| `slug` | text | zorunlu; bütün sitede benzersiz | |
| `name` | text | zorunlu | |
| `description` | text | zorunlu | |
| `about_text` | text | | `aboutText` |
| `image` | text | | Kart görseli |
| `icon` | text | | Kullanılmıyor |
| `code` | text | | "1.2.3"; kullanılmıyor |
| `position` | int | zorunlu | `order` |
| `seo` | jsonb | | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: içinde ürün varsa silinmez.

### `category_option_definitions` — kategoride listelenen seçenek tanımları

Koddaki: `categories.optionIds`.

| Kolon | Tür | Kural |
|---|---|---|
| `category_id` | text | → `categories` (zincir) |
| `option_definition_id` | text | → `option_definitions` (zincir: tanım silinince bağ kalkar) |
| `position` | int | zorunlu |

Anahtar: (`category_id`, `option_definition_id`).

### `category_filters` ve `category_filter_values` — kategori filtreleri

Koddaki: `categories.filters` (KARARLAR K-76).

`category_filters`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `category_id` | text | → `categories` (zincir) | |
| `id` | text | zorunlu | Filtre kimliği; ilk addan üretilir, değişmez, adreste kullanılır (`model-serisi`) |
| `name` | text | zorunlu; kategori içinde benzersiz (harf duyarsız) | |
| `position` | int | zorunlu | |

Anahtar: (`category_id`, `id`).

`category_filter_values`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `category_id`, `filter_id` | text | → `category_filters` (zincir) | |
| `id` | text | zorunlu | Değer kimliği; değişmez |
| `label` | text | zorunlu; filtre içinde benzersiz (harf duyarsız) | |
| `position` | int | zorunlu | |

Anahtar: (`category_id`, `filter_id`, `id`).

### `option_definitions` ve `option_values` — seçenek tanımları

Koddaki: `optionDefinitions`.

`option_definitions`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name` | text | zorunlu; benzersiz (harf duyarsız) | "Soğutma" |
| `position` | int | zorunlu (yeni) | Paneldeki sıra |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: bir üründe kullanılıyorsa silinmez.

`option_values`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `option_definition_id` | text | → `option_definitions` (zincir) | |
| `id` | text | zorunlu | Değer kimliği (`4-m`); değişmez |
| `label` | text | zorunlu; tanım içinde benzersiz (harf duyarsız) | "4 m" |
| `position` | int | zorunlu | Sitede bu sırayla görünür |

Anahtar: (`option_definition_id`, `id`). Silme: bir üründe kullanılıyorsa
silinmez.

### `products` — ürünler

| Kolon | Tür | Kural | Açıklama (koddaki alan) |
|---|---|---|---|
| `id` | text | anahtar | |
| `slug` | text | zorunlu; benzersiz | |
| `sku` | text | zorunlu; `sku_codes` ile tek havuzda benzersiz | Ürün kodu (SAP kodu, K-72) |
| `name` | text | zorunlu | |
| `category_id` | text | zorunlu; → `categories` (engeller) | `categorySlug` |
| `model_code` | text | | `modelCode`; boş kalır (K-72) |
| `brand` | text | | Boşsa Zenweld |
| `short_description` | text | zorunlu (boş olabilir) | |
| `description` | text | zorunlu (boş olabilir) | |
| `price_ex_vat` | numeric(12,2) | zorunlu; ≥ 0 | KDV hariç **normal** fiyat |
| `vat_rate` | numeric(5,2) | zorunlu | KDV oranı (%) |
| `currency` | text | zorunlu; yalnızca `TRY` | |
| `discount_percent` | int | 1–90 | Kampanya oranı (`discount.percent`) |
| `discount_starts_at` | timestamptz | | Boş: kayıt anında başlar |
| `discount_ends_at` | timestamptz | başlangıçtan sonra | Boş: süresiz |
| `images` | jsonb | zorunlu | `[{ url, alt }]`, sırayla |
| `specs` | jsonb | zorunlu | Teknik özellikler `[{ label, value }]` |
| `in_the_box` | jsonb | zorunlu | Kutu içeriği (metin listesi) |
| `highlights` | jsonb | zorunlu | Öne çıkanlar (metin listesi) |
| `processes` | text[] | | Kaynak yöntemleri; yalnızca eski Ürün Seçici ve arama kullanır, Ürün Seçici yeniden kurulunca kalkar (K-69) |
| `is_new` | boolean | zorunlu | "Yeni" rozeti |
| `position` | int | | Kategori içindeki sıra (`order`) |
| `manual_url` | text | | Kullanım kılavuzu |
| `warranty_months` | int | zorunlu | |
| `active` | boolean | zorunlu | Yayında |
| `seo` | jsonb | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Bölüm (`section`) kategoriden gelir. Teklife açık olup olmadığı da bölümden
çıkar (K-79).

Silme: stok satırları, kod eşleştirmeleri, varyantlar, favoriler ve
yönlendirmeleri silinir. Sipariş, teklif, iade, servis, garanti, yorum ve
belgelerdeki bağ boşalır; o kayıtlar kalır.

### `product_options` — ürünün kullandığı seçenekler

Koddaki: `options.optionIds`.

| Kolon | Tür | Kural |
|---|---|---|
| `product_id` | text | → `products` (zincir) |
| `option_definition_id` | text | → `option_definitions` (engeller) |
| `position` | int | zorunlu; 0, 1 ya da 2 (en fazla 3 seçenek); ürün içinde benzersiz |

Anahtar: (`product_id`, `option_definition_id`).

### `product_variants` — satılan kombinasyonlar

Koddaki: `options.variants`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `product_id` | text | → `products` (zincir) | |
| `id` | text | zorunlu | Ürün içindeki kimlik (`su_8-m`); değişmez. Stok, sepet ve `?secenek=` linki bunu kullanır |
| `combination_key` | text | zorunlu; ürün içinde benzersiz (yeni) | Değerlerin sıralı yazımı: ürünün seçenek sırasıyla `tanım=değer`, `\|` ile (`sogutma=su\|torc=8-m`); bir kombinasyon bir üründe bir kez |
| `sku` | text | zorunlu; `sku_codes` ile tek havuzda benzersiz | |
| `price_delta_ex_vat` | numeric(12,2) | zorunlu; eksi olabilir | Fiyat farkı |
| `spec_overrides` | jsonb | | Yalnızca farklı teknik özellikler |
| `in_the_box` | jsonb | | Boşsa ürününki |
| `image` | text | | Boşsa ürünün fotoğrafları |
| `position` | int | zorunlu (yeni) | |

Anahtar: (`product_id`, `id`).

### `product_variant_values` — kombinasyonun değerleri

Koddaki: `options.variants[].values`.

| Kolon | Tür | Kural |
|---|---|---|
| `product_id`, `variant_id` | text | → `product_variants` (zincir) |
| `option_definition_id` | text | → `product_options` (tanım üründe seçili olmalı) |
| `option_value_id` | text | → `option_values` (engeller: kullanılan değer silinmez) |

Anahtar: (`product_id`, `variant_id`, `option_definition_id`). Varyant
ürünün her seçeneğinden tam bir değer alır.

### `product_filter_values` — ürünün filtre değerleri

Koddaki: `filterValues`.

| Kolon | Tür | Kural |
|---|---|---|
| `product_id` | text | → `products` (zincir) |
| `category_id`, `filter_id`, `value_id` | text | → `category_filter_values` (zincir: filtre ya da değer silinince işaret kalkar) |

Anahtar: (`product_id`, `filter_id`, `value_id`). Yalnızca ürünün kendi
kategorisinin filtreleri; ürün başka kategoriye taşınınca eski kategorinin
değerleri silinir.

### `sku_codes` — ürün ve varyant kodlarının tek havuzu (yeni)

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `code` | text | anahtar | Boşlukları atılmış, büyük harfe çevrilmiş kod (tire kalır: `zw-trc mb25` → `ZW-TRCMB25`) |
| `product_id` | text | → `products` (zincir) | |
| `variant_id` | text | zorunlu; boş metin = ürünün kendi kodu | |

Benzersiz: (`product_id`, `variant_id`). Ürün ve varyant kodu kaydedilince
veritabanı bu tabloyu kendisi günceller (tetikleyici); aynı kod ikinci kez
girilemez (IS-KURALLARI › Ürün kodları).

### `redirects` — eski linkler (yeni)

Koddaki: ürün, varyant, blog, haber ve etkinlikteki `previousSlugs`;
kategori ve gruptaki `previousPaths`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `old_path` | text | anahtar | Eski adres (`/urun/eski-link`, `/ekipmanlar/eski-grup/eski-kategori`) |
| `target_type` | text | zorunlu; `product`, `category`, `group`, `blog`, `news`, `event` | |
| `target_id` | text | zorunlu | |
| `variant_id` | text | | Seçeneğe dönüştürülmüş eski ürün: o seçenekle açılır |
| `created_at` | timestamptz | zorunlu | |

Eski adres yeni bir kaydın linki olunca satır silinir; hedef kayıt
silinince satırları da silinir.

---

## 4. Bayiler, online satıcılar ve stok

### `dealers` — bayiler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `city`, `district`, `address`, `phone`, `working_hours` | text | zorunlu | |
| `whatsapp` | text | | |
| `email` | text | | Kullanılmıyor |
| `lat`, `lng` | numeric(9,6) | zorunlu | Harita konumu |
| `badges` | text[] | zorunlu; `yetkili-satici`, `yetkili-servis` | |
| `retailer_id` | text | benzersiz; → `retailers` (boşalır) | Bayinin online mağazası (bire bir) |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `retailers` — online satıcılar

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `website_url`, `logo_text` | text | zorunlu | |
| `logo_url` | text | | Kullanılmıyor |
| `is_own_store` | boolean | zorunlu | Zenweld'in kendi mağazası |
| `city` | text | | |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### Stok tabloları

`dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases`: kolonlar,
anahtarlar ve sorgular [STOK.md › Backend'e geçiş](STOK.md#4-backende-geçiş)'te
SQL olarak yazılı; aynen kullanılır. Özet:

| Tablo | Ne tutar | Anahtar |
|---|---|---|
| `dealer_stock` | Bayinin ürün/varyant başına adedi, fiyatı (sitede gösterilmez), linki, güncellenme zamanı | (`dealer_id`, `product_id`, `variant_id`) |
| `retailer_stock` | Bayiye bağlı olmayan online satıcının aynı bilgileri | (`retailer_id`, `product_id`, `variant_id`) |
| `stock_imports` | Her dosya yükleme, elle düzeltme ve geri alma; özet sayılar, geri alma için önceki satırlar, orijinal dosyanın yolu | `id` |
| `sku_aliases` | Bayinin kendi ürün kodu → bizim ürün/varyant | (`source_id`, `code`) |

Silme: bayi ya da satıcı silinince stok satırları, stok işlemleri ve kod
eşleştirmeleri de silinir.

### `warehouse_stock` ve `sap_sync_runs` — Zenweld depo stoğu (SAP) (yeni)

Sahibinin kararı (K-82, K-84): Zenweld deposunun stoğu SAP'tan okunur. SAP
ekibi model başına "kullanılabilir stok" görünümü (view) hazırlıyor (adı
`AVAILABLE_STOCK`, kesinleşmedi). Sunucu bu görünümü 15 dakikada bir okuyup
`warehouse_stock`'a yazar; site ve panel
stoğu buradan okur, sayfa açılırken SAP'a gidilmez (hız, K-83). Ürün ve
seçenek kodlarıyla eşleşmesi ve "stokta yok" kuralı: [IS-KURALLARI.md ›
Zenweld depo stoğu](IS-KURALLARI.md#20-zenweld-depo-stoğu).

`warehouse_stock`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `sap_item_code` | text | anahtar | SAP kalem kodu (boşluksuz, büyük harf) |
| `item_name` | text | | SAP'taki kalem adı; eşleşmeyen kodu panelde tanımak için |
| `quantity` | numeric(14,3) | zorunlu; ≥ 0 | Kullanılabilir stok (kg ile satılanlar için ondalıklı) |
| `synced_at` | timestamptz | zorunlu | SAP'tan okunduğu an |
| `sync_run_id` | bigint | → `sap_sync_runs` (boşalır) | |

Her başarılı okumada tablo tek işlemde yenilenir: SAP görünümünde artık
olmayan kalem silinir. Okuma işi: [14](#14-kod-betikler-ve-komutlar) ›
SAP stok okuma.

`sap_sync_runs`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `kind` | text | zorunlu; `stock` | Ne okundu |
| `started_at` | timestamptz | zorunlu | |
| `finished_at` | timestamptz | | |
| `status` | text | zorunlu; `running`, `success`, `failed` | |
| `rows_read` | int | | Okunup yazılan kalem sayısı (aynı kalemin satırları birleşmiş) |
| `error` | text | | Başarısızsa hata |

Okuma başarısız olursa son başarılı stok kullanılmaya devam eder; panel son
başarılı okumanın zamanını gösterir.

---

## 5. Üyeler ve oturumlar

### `users` — üyeler ve yöneticiler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `role` | text | zorunlu; `individual`, `business`, `admin` | Bireysel, kurumsal, yönetici |
| `status` | text | zorunlu; `active`, `suspended` | |
| `email` | text | zorunlu; benzersiz (harf duyarsız) | |
| `password_hash` | text | zorunlu | Güçlü özet (argon2id). Eski demo özeti (`zw1$…`, yalnızca bilgisayardaki ve denemedeki örnek hesaplar) ilk girişte argon2id'ye çevrilir ([14](#14-kod-betikler-ve-komutlar) › Şifre ve oturum) |
| `first_name`, `last_name`, `phone` | text | zorunlu | |
| `company_name`, `tax_office`, `tax_number`, `sector`, `city` | text | | Kurumsal bilgiler |
| `newsletter` | boolean | zorunlu | Haber ve kampanya e-postası izni |
| `created_at`, `updated_at` | timestamptz | zorunlu (`updated_at` yeni) | |
| `last_login_at` | timestamptz | | |
| `password_changed_at` | timestamptz | (yeni) | Son şifre değişikliği. Şifre değişince üyenin diğer oturumları silinir |
| `failed_login_count` | int | zorunlu; varsayılan 0 (yeni) | Yanlış şifre sayacı (KARARLAR K-94) |
| `failed_login_since` | timestamptz | (yeni) | Sayılan ilk yanlış denemenin anı; 15 dakikalık pencere buradan başlar |
| `login_locked_until` | timestamptz | (yeni) | Bu ana kadar giriş yapılamaz (10 yanlış denemeden sonra 15 dakika) |

Silme: adresleri, oturumları ve favorileri silinir; sipariş, teklif, servis,
iade, garanti ve yorumlardaki bağ boşalır. Son aktif yönetici silinemez.

### `addresses` — üye adresleri

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `user_id` | text | zorunlu; → `users` (zincir) |
| `title`, `full_name`, `phone`, `city`, `district`, `line` | text | zorunlu |
| `is_default` | boolean | zorunlu; üye başına tam bir varsayılan |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

### `sessions` — oturumlar (yeni)

Demo modunda oturum tarayıcıda; veritabanı modunda site ve panel oturumu
burada ([14](#14-kod-betikler-ve-komutlar) › Şifre ve oturum).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | Oturum belirtecinin özeti; belirtecin kendisi yalnızca tarayıcının çerezinde durur |
| `user_id` | text | zorunlu; → `users` (zincir) | |
| `scope` | text | zorunlu; `site`, `admin` | Site ve panel oturumu ayrıdır |
| `created_at`, `expires_at`, `last_seen_at` | timestamptz | zorunlu | |
| `ip` | inet | | |
| `user_agent` | text | | |

### `password_reset_tokens` — şifre sıfırlama (yeni)

Veritabanı modunda kullanılır (Aşama 4.4, KARARLAR K-95):
`token_hash` bağlantıdaki anahtarın sha256 özetidir; anahtarın kendisi
yalnızca e-postadadır. Üye başına en fazla bir geçerli bağlantı durur.

| Kolon | Tür | Kural |
|---|---|---|
| `token_hash` | text | anahtar |
| `user_id` | text | zorunlu; → `users` (zincir) |
| `created_at`, `expires_at` | timestamptz | zorunlu |
| `used_at` | timestamptz | Tek kullanımlık |

### `favourites` — favoriler (yeni)

Veritabanı modunda giriş yapmış üyenin favorileri burada (Aşama 5.1,
KARARLAR K-96); giriş yapmamış ziyaretçinin ve demo modunun favorileri
tarayıcıda (`zenweld.favourites.v1`).

| Kolon | Tür | Kural |
|---|---|---|
| `user_id` | text | → `users` (zincir) |
| `product_id` | text | → `products` (zincir) |
| `created_at` | timestamptz | zorunlu |

Anahtar: (`user_id`, `product_id`).

---

## 6. Teklifler

### `quotes` — teklifler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `TKL-<yıl>-<4 hane>` |
| `user_id` | text | → `users` (boşalır) | Ziyaretçide boş |
| `status` | text | zorunlu; `new`, `reviewing`, `sent`, `won`, `lost` | |
| `company_name`, `contact_name`, `email`, `phone`, `city` | text | zorunlu (firma bireysel üyede boş olabilir) | |
| `tax_number` | text | | |
| `payment_preference` | text | zorunlu; `vadeli`, `cek`, `havale`, `belirsiz` | |
| `term_days` | int | | Vadeli ödemede gün |
| `message` | text | | |
| `assigned_to` | text | | Panelde atanan kişi |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Silme: satırları da silinir; numarası yeniden verilmez.

### `quote_items` — teklif satırları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `quote_id` | text | → `quotes` (zincir) | |
| `line` | int | zorunlu | Satırın sırası |
| `product_id` | text | → `products` (boşalır) | |
| `variant_id` | text | (yeni) | Seçilen kombinasyon |
| `product_name` | text | zorunlu | Kopya |
| `sku`, `variant_label` | text | | Kopya |
| `quantity` | int | zorunlu; ≥ 1 | |
| `note` | text | | Kullanılmıyor |

Anahtar: (`quote_id`, `line`).

---

## 7. Siparişler ve iadeler

### `orders` — siparişler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `SIP-<yıl>-<5 hane>` |
| `user_id` | text | → `users` (boşalır) | Sipariş yalnızca üyeden; üye silinse de sipariş kalır |
| `status` | text | zorunlu; `awaiting_payment`, `preparing`, `shipped`, `delivered`, `cancelled` | |
| `customer_name`, `email`, `phone` | text | zorunlu | Kopya |
| `shipping_address` | jsonb | zorunlu | Kopya: `{ fullName, phone, city, district, line }` |
| `invoice` | jsonb | zorunlu | Kopya: tür, ad ya da firma, T.C. kimlik no ya da vergi bilgisi, adres |
| `subtotal` | numeric(12,2) | zorunlu | Ürünler toplamı (KDV dahil, kupon öncesi) |
| `vat` | numeric(12,2) | zorunlu | Ürünlere ödenen tutarın (ürünler toplamı − kupon) içindeki KDV |
| `shipping` | numeric(12,2) | zorunlu | Kargo (KDV dahil) |
| `installment_fee` | numeric(12,2) | zorunlu | Vade farkı |
| `coupon_code` | text | (yeni) | Kopya: kullanılan kupon |
| `coupon_discount` | numeric(12,2) | zorunlu (yeni) | Kupon indirimi (KDV dahil); kupon yoksa 0 |
| `total` | numeric(12,2) | zorunlu | Ödenen toplam |
| `payment_method` | text | zorunlu; `card`, `transfer` | |
| `installments` | int | | Kartta taksit sayısı |
| `card_brand`, `card_program` | text | | |
| `card_last4` | text | 4 rakam | Kart numarası hiç saklanmaz |
| `pos_id` | text | → `payment_pos` (boşalır) | |
| `pos_name` | text | | Kopya |
| `commission_percent` | numeric(5,2) | | Kopya: bankanın kestiği oran |
| `paid_at` | timestamptz | | |
| `due_at` | timestamptz | | Havalede son ödeme anı |
| `customer_note`, `admin_note` | text | | |
| `terms_accepted_at` | timestamptz | zorunlu | Ön bilgilendirme ve sözleşme onayı |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Kargo bilgisi `shipments`'tadır. Silme: panelde silinmez.

### `shipments` — kargo gönderileri (yeni)

Koddaki: `orders.shipment`. Siparişin gönderisi ve iadede müşterinin geri
gönderisi. Bugün siparişte en fazla bir gönderi vardır.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `order_id` | text | zorunlu; → `orders` | |
| `kind` | text | zorunlu; `outbound`, `return` | Gönderi ya da iade gönderisi |
| `return_request_id` | text | → `return_requests` (boşalır) | İade gönderisinde |
| `carrier_id` | text | → `carriers` (boşalır) | |
| `carrier_name` | text | zorunlu | Kopya |
| `tracking_number` | text | zorunlu | |
| `shipped_at` | timestamptz | zorunlu | |
| `delivered_at` | timestamptz | gönderiden önce olamaz | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

### `order_items` — sipariş satırları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `order_id` | text | → `orders` (zincir) | |
| `line` | int | zorunlu | Sıra; iade satırları buna bağlanır |
| `product_id` | text | → `products` (boşalır) | |
| `variant_id` | text | (yeni) | |
| `product_name`, `sku` | text | zorunlu | Kopya |
| `variant_label` | text | | Kopya |
| `quantity` | int | zorunlu; ≥ 1 | |
| `unit_price_ex_vat` | numeric(12,2) | zorunlu | İndirim uygulanmış, KDV hariç |
| `vat_rate` | numeric(5,2) | zorunlu | |
| `unit_price` | numeric(12,2) | zorunlu | KDV dahil |
| `coupon_discount` | numeric(12,2) | zorunlu; ≥ 0; varsayılan 0 | Kupon indiriminin bu satıra düşen payı (satırın tamamı, KDV dahil); iadede ödenecek tutar bundan bulunur (yeni) |

Anahtar: (`order_id`, `line`).

### `order_status_history` — sipariş zaman çizelgesi

Koddaki: `orders.history`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `order_id` | text | → `orders` (zincir) | |
| `seq` | int | zorunlu | Sıra |
| `status` | text | zorunlu | |
| `at` | timestamptz | zorunlu | |
| `note` | text | | |
| `changed_by` | text | → `users` (boşalır) (yeni) | Yönetici ya da sistem (boş) |

Anahtar: (`order_id`, `seq`).

### `payment_transactions` — banka POS işlemleri (yeni)

Banka POS'u bağlanınca kesinleşecek; bugün ödeme demo. Veritabanı modunda
verilen siparişte de (Aşama 5.2) bu tabloya henüz satır yazılmaz; kartlı
ödeme gerçek POS bağlanana kadar temsilidir (KARARLAR K-97).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `order_id` | text | zorunlu; → `orders` | |
| `pos_id` | text | → `payment_pos` (boşalır) | |
| `kind` | text | zorunlu; `sale`, `refund`, `cancel` | |
| `amount` | numeric(12,2) | zorunlu | |
| `installments` | int | | |
| `status` | text | zorunlu; `pending`, `success`, `failed` | |
| `provider_ref` | text | | Bankanın işlem numarası |
| `error_code`, `error_message` | text | | |
| `raw` | jsonb | | Bankanın yanıtı (kart bilgisi çıkarılmış) |
| `created_at` | timestamptz | zorunlu | |

### `return_requests` ve `return_request_items` — iade talepleri

`return_requests`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `IAD-<yıl>-<4 hane>` |
| `order_id` | text | zorunlu; → `orders` | |
| `order_code` | text | zorunlu | Kopya |
| `user_id` | text | → `users` (boşalır) | |
| `customer_name`, `email`, `phone` | text | zorunlu | |
| `reason` | text | zorunlu; `changed_mind`, `defective`, `wrong_item`, `other` | |
| `note` | text | | |
| `status` | text | zorunlu; `new`, `reviewing`, `approved`, `rejected` | |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

`return_request_items`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `return_request_id` | text | → `return_requests` (zincir) | |
| `order_line` | int | zorunlu | Siparişin satır sırası (`line`) |
| `product_id` | text | → `products` (boşalır) | |
| `product_name`, `sku` | text | zorunlu | Kopya |
| `variant_label` | text | | Kopya |
| `quantity` | int | zorunlu; ≥ 1 | |

Anahtar: (`return_request_id`, `order_line`). Silme: panelde silinmez.

### `coupons`, `coupon_targets`, `coupon_redemptions` — kuponlar (yeni)

Sahibinin isteği (2026-11-02, KARARLAR K-85). Sitede (sepet) ve panelde
(Satış › Kuponlar) kupon özelliği var; bugün tarayıcıdaki veride
(`coupons`, `couponRedemptions`; [VERI-MODELI.md](VERI-MODELI.md)).
Kurallar: [IS-KURALLARI.md › Kuponlar](IS-KURALLARI.md#21-kuponlar).
Kuponun `productIds` ve `categoryIds` listeleri `coupon_targets`,
kişiye özel kuponun `customerEmails` listesi `coupon_customers` satırlarına
yazılır.

`coupons`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz (büyük/küçük harf duyarsız) | Müşterinin yazdığı kod |
| `name` | text | | Panelde tanımak için ad ya da not |
| `discount_type` | text | zorunlu; `percent`, `amount` | Yüzde ya da sabit TL |
| `discount_value` | numeric(12,2) | zorunlu; > 0; yüzdede en fazla 100 | |
| `min_cart_total` | numeric(12,2) | | En az sepet tutarı (KDV dahil) |
| `starts_at`, `ends_at` | timestamptz | bitiş başlangıçtan sonra | Boşsa sınırsız |
| `total_usage_limit` | int | ≥ 1 | Toplam kullanım sınırı; boşsa sınırsız |
| `per_user_limit` | int | ≥ 1 | Kişi başı kullanım sınırı; boşsa sınırsız |
| `scope` | text | zorunlu; `all`, `targets` | Bütün ürünler ya da yalnızca `coupon_targets` |
| `audience` | text | zorunlu; `all`, `customers`; varsayılan `all` | Herkes ya da yalnızca `coupon_customers`'taki e-postalar (kişiye özel, K-86) (yeni) |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

`coupon_targets` (kupon belirli ürün ya da kategorilere özelse):

| Kolon | Tür | Kural |
|---|---|---|
| `id` | bigint | anahtar; sırayla artar |
| `coupon_id` | text | zorunlu; → `coupons` (zincir) |
| `product_id` | text | → `products` (zincir) |
| `category_id` | text | → `categories` (zincir) |

Her satırda ya ürün ya kategori dolu olur; aynı ürün ya da kategori bir
kuponda bir kez.

`coupon_customers` (kişiye özel kuponun e-posta adresleri, K-86; yeni):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `coupon_id` | text | zorunlu; → `coupons` (zincir) | |
| `email` | text | zorunlu; kuponda bir kez (büyük/küçük harf duyarsız) | Üyeye değil e-postaya bağlıdır: kişi henüz üye olmasa da eklenir; o e-postayla giriş yapan üye kullanır |

E-postaya göre arama için dizin vardır (ileride Hesabım'da "Kuponlarım").

`coupon_redemptions` (kim, hangi siparişte, ne kadar indirim aldı):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `coupon_id` | text | zorunlu; → `coupons` (engeller) | Kullanılmış kupon silinmez, pasife alınır |
| `coupon_code` | text | zorunlu | Kopya |
| `user_id` | text | → `users` (boşalır) | |
| `order_id` | text | zorunlu; benzersiz; → `orders` | Siparişte en fazla bir kupon |
| `discount_amount` | numeric(12,2) | zorunlu; > 0 | Uygulanan indirim (KDV dahil) |
| `created_at` | timestamptz | zorunlu | |
| `released_at` | timestamptz | | Sipariş iptal edilince dolar; kullanım sınırlarında sayılmaz |

---

## 8. Servis talepleri, garantiler, yorumlar

### `service_requests` — servis talepleri

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `SRV-<yıl>-<4 hane>` |
| `status` | text | zorunlu; `new`, `in_progress`, `done` | |
| `category_id` | text | → `categories` (boşalır) | `categorySlug` |
| `product_id` | text | → `products` (boşalır) | |
| `product_name` | text | zorunlu | Kopya |
| `reasons` | text[] | zorunlu; `kurulum`, `bakim`, `onarim`, `egitim` | |
| `complaint` | text | zorunlu | |
| `company_name`, `address`, `city`, `district`, `email`, `phone`, `contact_name`, `contact_gsm` | text | zorunlu | |
| `user_id` | text | → `users` (boşalır) | Giriş yapmışsa |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Silme: panelde silinmez.

### `warranties` — garanti kayıtları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `serial_number` | text | zorunlu; benzersiz (büyük harfe çevrilerek) | |
| `category_id` | text | → `categories` (boşalır) | |
| `product_id` | text | → `products` (boşalır) | |
| `product_name` | text | (yeni) | Kopya; ürün silinse de model okunur |
| `owner_name`, `email`, `phone`, `city`, `postal_code`, `address` | text | zorunlu | Üyeye e-postayla eşleşir |
| `seller_tax_number` | text | zorunlu | Satan firmanın vergi no |
| `registered_at` | timestamptz | zorunlu | |
| `expires_at` | date | zorunlu | |
| `extended` | boolean | zorunlu | |
| `updated_at` | timestamptz | zorunlu (yeni) | |

### `reviews` — ürün yorumları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `product_id` | text | → `products` (boşalır) | |
| `user_id` | text | → `users` (boşalır) | |
| `author_name` | text | zorunlu | |
| `rating` | smallint | zorunlu; 1–5 | |
| `title` | text | | |
| `body` | text | zorunlu | |
| `media` | jsonb | zorunlu | `[{ url, kind: image|video }]`; dosyalar dosya deposunda |
| `verified_purchase` | boolean | | Doğrulanmış alıcı |
| `approved` | boolean | zorunlu | Yalnızca onaylılar yayında |
| `featured` | boolean | zorunlu | Anasayfa şeridi (en fazla 10) |
| `created_at` | timestamptz | zorunlu | |
| `updated_at` | timestamptz | zorunlu (yeni) | |

---

## 9. İçerik

### `blog_posts`, `news`, `events` — blog, haberler, etkinlikler

Ortak kolonlar: `id` (anahtar), `slug` (zorunlu; kendi türü içinde
benzersiz), `title` (zorunlu), `active` (zorunlu), `seo` (jsonb),
`created_at` ve `updated_at` (zorunlu, yeni). Eski linkler `redirects`'te.

| Tablo | Diğer kolonlar |
|---|---|
| `blog_posts` | `excerpt`, `body`, `cover_url`, `category`, `author` (text, zorunlu); `published_at` (timestamptz, zorunlu) |
| `news` | `summary`, `body`, `cover_url` (text, zorunlu); `images` (jsonb, adres listesi); `published_at` (timestamptz, zorunlu) |
| `events` | `summary`, `description`, `venue`, `city`, `country`, `logo_url` (text, zorunlu); `start_date`, `end_date` (date, zorunlu; bitiş başlangıçtan önce olamaz); `images` (jsonb); `website_url` (text) |

### `faqs` — sık sorulan sorular

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `question`, `answer` | text | zorunlu |
| `topic` | text | zorunlu; `genel`, `garanti`, `siparis`, `teknik` |
| `position` | int | zorunlu (yeni; bugün listedeki sıra) |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

### `sales_reps` — satış temsilcileri

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `name`, `region`, `phone`, `email` | text | zorunlu |
| `photo_url` | text | |
| `position` | int | zorunlu (`order`) |
| `active` | boolean | zorunlu |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

### `legal_pages` — yasal metinler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | Sabit kimlik; sayfanın adresi koddaki eşlemeden gelir |
| `title`, `body` | text | zorunlu | |
| `updated_at` | timestamptz | zorunlu | |

Silme: silinemez.

### `about_page` — Hakkımızda (tek satır)

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | smallint | anahtar; yalnızca 1 | |
| `hero_title`, `hero_subtitle` | text | zorunlu | |
| `hero_image` | text | | |
| `stats` | jsonb | zorunlu | Rakam kutuları `[{ id, value, label }]` |
| `sections` | jsonb | zorunlu | Bölümler `[{ id, title, body, imageUrl }]` |
| `updated_at` | timestamptz | zorunlu | |

### `page_seo` — sabit sayfaların arama bilgileri

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `path` | text | anahtar | `/hakkimizda` |
| `title`, `description` | text | | |
| `updated_at` | timestamptz | zorunlu | |

### `document_pages` ve `documents` — belgeler

`document_pages` (belge sayfalarının başlığı):

| Kolon | Tür | Kural |
|---|---|---|
| `section` | text | anahtar; `msds`, `kaynak-rehberi`, `parti-sertifikalari` |
| `title`, `subtitle` | text | zorunlu |
| `updated_at` | timestamptz | zorunlu (yeni) |

`documents`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `section` | text | zorunlu; yukarıdaki üç değer | |
| `title` | text | zorunlu | |
| `product_id` | text | → `products` (boşalır) | |
| `lot_number` | text | | Parti sertifikalarında |
| `file_name`, `mime_type` | text | zorunlu | |
| `size_bytes` | bigint | zorunlu | |
| `file_key` | text | zorunlu | Dosya deposundaki yol |
| `active` | boolean | zorunlu | |
| `position` | int | zorunlu (yeni) | Sitedeki sıra |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Silme: dosyası da silinir.

---

## 10. Ayarlar ve ödeme

### `settings` — ayarlar

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `key` | text | anahtar; `shop`, `stock`, `rich_text` | |
| `value` | jsonb | zorunlu | Aşağıda |
| `updated_at` | timestamptz | zorunlu | |
| `updated_by` | text | → `users` (boşalır) (yeni) | |

- `shop`: kargo bedava eşiği, kargo ücreti, taksit için en düşük tutar,
  havale süresi (gün). Kargo firmaları `carriers`'tadır.
- `stock`: stok kaydının sitede geçerli sayıldığı gün sayısı.
- `rich_text`: biçimli metinlerin görünümü (Görünüm sayfası).

### `payment_pos` — banka sanal POS'ları

Koddaki: `settings.shop.pos`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `bank_short_name`, `name`, `pos_name` | text | zorunlu | |
| `program` | text | | Kart programı (Bonus, World…); boşsa program yok |
| `merchant_no` | text | zorunlu | Üye işyeri numarası. API anahtarı ve şifre burada **yok**, yalnızca sunucuda ortam değişkeni |
| `active` | boolean | zorunlu | |
| `is_default` | boolean | zorunlu; en fazla bir POS | Programı eşleşmeyen kartlar buradan tek çekim |
| `position` | int | zorunlu | Aynı programda üstteki geçerli |
| `installments` | jsonb | zorunlu | Müşteriye sunulan taksitler `[{ count, ratePercent, enabled }]` |
| `commissions` | jsonb | zorunlu | Bankanın kestiği oranlar `[{ count, ratePercent }]` |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `carriers` — kargo firmaları (yeni)

Koddaki: `settings.shop.carriers` (bugün yalnızca adlar).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name` | text | zorunlu; benzersiz | |
| `tracking_url` | text | | Takip sayfası; `{takip}` yerine takip numarası yazılır. Boşsa bağlantı verilmez |
| `active` | boolean | zorunlu | |
| `position` | int | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

### `bank_accounts` — havale hesapları

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `bank_name`, `account_holder`, `iban` | text | zorunlu |
| `position` | int | zorunlu (yeni) |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

---

## 11. Formlar, e-postalar, kayıt numaraları ve değişiklik kaydı

### Yalnızca e-postaya giden formlar (yeni)

Sahibinin kararı (K-81): bugün yalnızca info@zenweld.com'a e-posta olarak
giden formlar veritabanında da saklanır. E-posta yine gider; kayıt, e-posta
gitmese de alınır; gidip gitmediği `email_log`'dadır. Veritabanı modunda
site bu tablolara yazıyor (Aşama 5.3; aşağıda [14](#14-kod-betikler-ve-komutlar)
› Formlar). Panelde Bayilik Başvuruları, Mesajlar ve Welders Club ekranlarında
görünür (aşağıda [14](#14-kod-betikler-ve-komutlar) › Panel › Talepler); kayıtlar panelden
silinmez (K-100). Bülten kaydı bunlara girmez; bülten
servisi kararını bekliyor (YAPILACAKLAR › Bülten ve İYS).

`dealer_applications` — Bayilik Başvurusu:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `status` | text | zorunlu; `new`, `reviewing`, `approved`, `rejected` | |
| `company_name` | text | zorunlu | Firma ünvanı |
| `tax_info` | text | | "Vergi dairesi / no" (formda tek alan) |
| `city`, `sector`, `brands` | text | | Şehir, faaliyet alanı, çalıştığı markalar |
| `years_in_sector` | text | `0-2`, `3-5`, `6-10`, `10+` | |
| `has_showroom`, `has_service` | boolean | | Showroom / teknik servis var mı |
| `contact_name`, `phone` | text | | |
| `email` | text | zorunlu | |
| `message` | text | | Not |
| `user_id` | text | → `users` (boşalır) | Giriş yapmışsa |
| `dealer_id` | text | → `dealers` (boşalır) | Başvuru onaylanıp bayi kaydı açılınca |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

`support_messages` — İletişim formu ve ürün sayfasındaki destek sorusu:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `type` | text | zorunlu; `iletisim`, `urun-destek` | |
| `status` | text | zorunlu; `new`, `read`, `answered` | |
| `name`, `email`, `phone` | text | | |
| `subject` | text | | İletişim formunda konu |
| `message` | text | zorunlu | |
| `product_id` | text | → `products` (boşalır) | Ürün sorusunda |
| `product_name`, `product_sku` | text | | Kopya |
| `page_url` | text | | Formun gönderildiği sayfa |
| `user_id` | text | → `users` (boşalır) | |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

`welders_club_signups` — Welders Club katılım:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `email` | text | zorunlu | |
| `city` | text | | |
| `user_id` | text | → `users` (boşalır) | |
| `left_at` | timestamptz | | Kulüpten ayrılmak isteyen panelde pasife alınınca o an; boşsa aktif (K-100; 0008) |
| `created_at` | timestamptz | zorunlu | |
| `updated_at` | timestamptz | zorunlu | Son değişiklik (0008) |

### `email_recipients` — e-postaların alıcıları (yeni)

Sahibinin kararı (K-81): bugün bütün form e-postaları info@zenweld.com'a
gider; ileride forma göre farklı adreslere gidebilir. Alıcılar e-posta türü
başına tutulur; başlangıçta hepsi info@zenweld.com'dur.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `type` | text | anahtar | E-posta türü (aşağıda) |
| `recipients` | text[] | zorunlu; en az bir geçerli adres | Alıcı adresleri |
| `updated_at` | timestamptz | zorunlu | |
| `updated_by` | text | → `users` (boşalır) | |

Bir türün satırı yoksa e-posta sunucudaki varsayılan adrese
(`SUPPORT_EMAIL`, yoksa info@zenweld.com) gider. Alıcıları değiştirecek
panel ekranı siteyi veritabanına bağlarken eklenecek.

**E-posta türleri** (bugün Zenweld'e giden e-postalar; IS-KURALLARI › Form
e-postaları):

| `type` | Sitedeki özellik |
|---|---|
| `iletisim` | İletişim formu |
| `bayilik` | Bayilik Başvurusu |
| `welders-club` | Welders Club katılım |
| `urun-destek` | Ürün sayfasındaki destek sorusu |
| `teklif` | Teklif Al |
| `servis` | Servis Talebi |
| `garanti` | Garanti Kaydı |
| `yorum` | Ürün değerlendirmesi |
| `uye` | Üye Ol |
| `siparis` | Ödeme (sipariş) |
| `iade` | İade talebi |

**Müşteriye giden e-postalar** yalnızca `email_log`'da tutulur (alıcısı
müşteridir; `email_recipients`'ta yoktur):

| `type` | Sitedeki özellik |
|---|---|
| `sifre-sifirlama` | Şifremi Unuttum (K-95) |

Sipariş onayı gibi yeni müşteri e-postaları kurulunca türleri bu listeye
eklenir.

### `email_log` — gönderilen e-postalar (yeni)

Sahibinin kararı (K-81): gönderilen her e-postanın sitenin hangi özelliği ve
sayfası için gönderildiği tutulur.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `type` | text | zorunlu | E-posta türü (yukarıdaki liste): hangi özellik için gönderildiği |
| `source_path` | text | | Formun gönderildiği sayfa (`/welders-club`, `/urun/ultimate-250-mtc`) |
| `entity_type`, `entity_id` | text | | Bağlı kayıt (ör. `quotes` + teklifin kimliği, `dealer_applications` + başvurunun kimliği) |
| `recipients` | text[] | zorunlu | Gönderildiği adresler |
| `reply_to` | text | | Yanıtla denince gidilecek adres (formu dolduran) |
| `subject` | text | zorunlu | Konu satırı |
| `status` | text | zorunlu; `sent`, `failed`, `skipped` | `skipped`: e-posta servisinin anahtarı tanımlı değil ya da bot tuzağı |
| `provider_message_id` | text | | E-posta servisinin verdiği numara |
| `error` | text | | Hata mesajı |
| `created_at` | timestamptz | zorunlu | |

E-postanın metni saklanmaz (kişisel veri; içerik zaten bağlı kayıtta
duruyor). Aranır: türe, bağlı kayda ve tarihe göre.

### `record_counters` — kayıt numaraları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `prefix` | text | anahtar | `TKL-2026-` |
| `last_number` | int | zorunlu | Son verilen numara |

Numara tek bir işlemde artırılıp okunur; aynı anda gelen iki kayıt aynı
numarayı alamaz. Silinen kaydın numarası yeniden verilmez
(IS-KURALLARI › Kayıt numaraları). Sipariş ve iade talebi numarasını veren
sunucu (Aşama 5.2) sayaç yoksa ya da tablodaki en büyük numaranın
gerisindeyse o numaradan devam eder (örnek veriyle yüklenen siparişlerde
sayaç boştur).

### `audit_log` — panel değişiklik kaydı (yeni)

Sahibinin kararı (K-81): panelde yapılan her değişiklik kaydedilir.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `at` | timestamptz | zorunlu | |
| `actor_user_id` | text | bağlantısız | İşlemi yapan yönetici; kayıt değiştirilemediği için yönetici silinse de kimlik kalır |
| `actor_name` | text | zorunlu | Kopya; yönetici silinse de okunur |
| `action` | text | zorunlu; `create`, `update`, `delete`, `login`, `logout` | Panele giriş ve çıkışlar da yazılır |
| `entity_type` | text | zorunlu | Tablo adı (`products`, `orders`…); giriş/çıkışta `users` |
| `entity_id` | text | zorunlu | Girişte yöneticinin kendi kimliği |
| `entity_label` | text | | Okunur ad (ürün adı, sipariş no) |
| `changes` | jsonb | | Değişen alanlar: `{ alan: [eski, yeni] }`; oluşturmada kaydın ilk hali, silmede son hali |
| `ip` | inet | | |

- Kayıt, değişiklikle aynı işlemde yazılır; değişiklik yapılıp kaydı
  düşmemesi olamaz.
- Kayıtlar sonradan değiştirilemez ve elle silinemez (yalnızca eklenir).
- **2 yıl** saklanır; daha eski kayıtlar her gün kendiliğinden silinir
  (sahibinin kararı, K-81).
- Şifre özeti ve oturum bilgisi `changes`'e yazılmaz.
- Aranır: kayda göre (`entity_type`, `entity_id`) ve tarihe göre.

---

## 12. Tablo listesi

| Bölüm | Tablolar | Sayı |
|---|---|---|
| Katalog | `category_groups`, `categories`, `category_option_definitions`, `category_filters`, `category_filter_values`, `option_definitions`, `option_values`, `products`, `product_options`, `product_variants`, `product_variant_values`, `product_filter_values`, `sku_codes`, `redirects` | 14 |
| Bayi ve stok | `dealers`, `retailers`, `dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases` | 6 |
| Zenweld depo stoğu (SAP) | `warehouse_stock`, `sap_sync_runs` | 2 |
| Üyeler | `users`, `addresses`, `sessions`, `password_reset_tokens`, `favourites` | 5 |
| Teklif | `quotes`, `quote_items` | 2 |
| Sipariş, kargo ve iade | `orders`, `order_items`, `order_status_history`, `payment_transactions`, `shipments`, `return_requests`, `return_request_items` | 7 |
| Kuponlar | `coupons`, `coupon_targets`, `coupon_customers`, `coupon_redemptions` | 4 |
| Servis, garanti, yorum | `service_requests`, `warranties`, `reviews` | 3 |
| İçerik | `blog_posts`, `news`, `events`, `faqs`, `sales_reps`, `legal_pages`, `about_page`, `page_seo`, `document_pages`, `documents` | 10 |
| Ayarlar, ödeme ve kargo | `settings`, `payment_pos`, `bank_accounts`, `carriers` | 4 |
| Formlar | `dealer_applications`, `support_messages`, `welders_club_signups` | 3 |
| Sistem | `email_recipients`, `email_log`, `record_counters`, `audit_log` | 4 |
| **Toplam** | | **64** |

---

## 13. Açık sorular

1. **Kişisel verilerin saklama süresi (KVKK):** Sipariş faturasındaki T.C.
   kimlik no, form kayıtları, gönderilen e-postaların kaydı ve silinen
   üyenin geçmiş kayıtları ne kadar tutulacak? Sahibi avukata soracak
   (YAPILACAKLAR › Hesap silme). Cevaba göre bu dosyaya saklama süreleri ve
   kendiliğinden silme eklenir.
2. **SAP stok görünümü (SAP ekibi):** Adı `AVAILABLE_STOCK` olacak
   (kesinleşmedi), 15 dakikada bir okunacak (K-84). Kolonları (kalem kodu,
   kullanılabilir miktar, kalem adı) ve sunucunun bağlanma yolu (SAP
   Business One Service Layer ya da veritabanına salt okunur kullanıcı)
   bekleniyor. Cevaba göre `warehouse_stock`'a kolon eklenebilir.
3. **Site siparişlerinin SAP'a aktarılması:** Aktarılacak (K-84). SAP'ın
   sipariş API'sinin (ör. `SALES_ORDER`) bilgileri gelince siparişe SAP
   belge numarası ve aktarım durumu kolonları eklenir.

---

## 14. Kod, betikler ve komutlar

**Kod:** `packages/db`

| Yer | İçerik |
|---|---|
| `src/schema/` | Tabloların tanımı (Drizzle ORM), konuya göre dosyalar: `catalog`, `network` (bayi, satıcı, stok), `users`, `sales` (teklif, sipariş, kargo gönderisi, iade), `coupons`, `sap` (depo stoğu), `support` (servis, garanti, yorum), `content`, `settings` (ayarlar, POS, banka, kargo firmaları), `forms` (bayilik, destek mesajları, Welders Club), `system` (e-postalar, numaralar, değişiklik kaydı) |
| `migrations/0000_kurulum.sql` | Tabloları kuran betik; şemadan üretilir (`npm run db:generate`) |
| `migrations/0001_kurallar.sql` | Tablo tanımıyla ifade edilemeyen kurallar; elle yazılır (aşağıda) |
| `migrations/0002_kaldirilanlar.sql`, `0003_stok-kargo-kupon-formlar.sql` | 2026-11-02 eklemeleri: `form_submissions` ve siparişteki kargo kolonları kaldırıldı; SAP depo stoğu, kargo, kupon ve form tabloları eklendi. Kaldırma ve ekleme ayrı betiktedir (betik üretici, aynı betikte "ad mı değişti" diye sorar) |
| `migrations/0004_kupon-satir-payi.sql` | Sipariş satırına kupon payı (`order_items.coupon_discount`) |
| `migrations/0005_kisiye-ozel-kupon.sql` | Kişiye özel kupon: `coupons.audience` ve `coupon_customers` |
| `migrations/0006_giris-deneme-siniri.sql` | Yanlış şifre sınırı: `users.failed_login_count`, `failed_login_since`, `login_locked_until` (K-94) |
| `migrations/0007_e-posta-turu-sifre-sifirlama.sql` | `email_log.type` müşteriye giden şifre sıfırlama e-postasını da kabul eder (`sifre-sifirlama`; Aşama 5.3) |
| `migrations/0008_welders-club-pasif.sql` | `welders_club_signups`'a `left_at` (pasife alınma) ve `updated_at` (panelde aynı kayıt koruması; K-100) |
| `src/client.ts` | Bağlantı (`DATABASE_URL`) |
| `src/migrate.ts` | Betikleri çalıştırma ve sıfırlama |
| `src/seed.ts` | Örnek veriyi tablolara çevirme ve yazma (`npm run db:seed`) |
| `src/load.ts` | Bugünkü veriyi canlı ya da deneme veritabanına yükleme (`npm run db:yukle`; aşağıda) |
| `src/sap-stock.ts` | SAP depo stoğu okuma işi ve deneme kaynağı (aşağıda) |
| `src/orders.ts` | Siparişler sunucuda: kupon denetimi, sipariş, süresi dolan havale, iade talebi (aşağıda) |
| `src/forms.ts` | Formlar sunucuda: teklif, servis talebi, garanti kaydı ve sorgulama, ürün yorumu, e-postaya giden formların kaydı, e-posta kaydı (aşağıda) |
| `src/codes.ts` | Kayıt numarası (`nextRecordCode`; sipariş, iade, teklif, servis) |
| `packages/auth/src/server/` | Şifre özeti ve oturumlar (aşağıda; yalnızca sunucu, `@zenweld/auth/server`) |
| `packages/auth/scripts/create-admin.ts` | Yönetici hesabı açma (`npm run yonetici:olustur`) |
| `deneme/sap-stok.csv` | SAP yerine okunan örnek stok dosyası (50 kalem, 3'ü stoksuz) |
| `src/read.ts` | Okuma katmanı: tablolardaki kayıtları sitenin kullandığı kayıt yapısına çevirir (aşağıda) |

**Geçiş betikleri:** Sırayla ve bir kez çalışır; hangilerinin çalıştığı
veritabanında tutulur (`drizzle.__drizzle_migrations`). Aynı betikler
bilgisayarda, testte, deneme ve canlı sunucuda aynı sonucu verir. Çalışmış
bir betik değiştirilmez; şema değişince yeni betik üretilir.

**Veritabanındaki kurallar** (`0001_kurallar.sql`):

| Ad | Ne yapar |
|---|---|
| `products_sku`, `product_variants_sku` (tetikleyici) | Ürün ve varyant kodunu `sku_codes`'a yazar; kod kullanılıyorsa kaydı reddeder ("Ürün kodu başka bir üründe ya da seçenekte kullanılıyor") |
| `zw_normalize_sku()` | Kodu karşılaştırma biçimine çevirir (boşluksuz, büyük harf) |
| `*_redirects` (tetikleyici) | Ürün, kategori, grup, blog, haber ya da etkinlik silinince eski linklerini siler; varyant silinince ona yönlenen eski ürün linkini siler |
| `product_filter_values_category`, `products_category_moved` (tetikleyici) | Ürüne yalnızca kendi kategorisinin filtre değeri işaretlenir; ürün başka kategoriye taşınınca eski değerler silinir |
| `audit_log_guard`, `audit_log_no_truncate` (tetikleyici) | Değişiklik kaydı değiştirilemez ve silinemez |
| `purge_audit_log()` | 2 yıldan eski değişiklik kayıtlarını siler; silinen sayıyı döndürür. Canlıda her gün çalıştırılmalı (YAPILACAKLAR › Veritabanı) |
| `next_record_number(önek)` | Kayıt numarasını tek işlemde artırıp döndürür (`next_record_number('TKL-2026-')` → 50) |

**Kayıt katmanının sağlayacakları** (veritabanında değil; site ve panel
bağlanırken): üyenin tam bir varsayılan adresi olması (Aşama 5.1:
`packages/auth/src/server/account-data.ts`), son aktif
yöneticinin silinememesi, anasayfa yorum şeridinde en fazla 10 yorum, eski
link yeni bir kaydın linki olunca yönlendirmenin silinmesi, varyantın
ürünün her seçeneğinden tam bir değer alması.

**Komutlar** (kurulum: [README](../README.md) › Veritabanı):

| Komut | Ne yapar |
|---|---|
| `npm run db:migrate` | Henüz çalışmamış betikleri çalıştırır |
| `npm run db:reset` | Bilgisayardaki veritabanını silip tabloları baştan kurar; yalnızca `localhost` adresinde çalışır |
| `npm run db:seed` | Sitenin örnek verisini boş veritabanına yükler (aşağıda); yalnızca `localhost` adresinde çalışır |
| `npm run db:yukle <canli\|deneme> [eksikler]` | Bugünkü veriyi canlı ya da deneme veritabanına yükler (aşağıda); bilgisayar dışındaki veritabanında onay ister |
| `npm run db:generate` | Şema değişince yeni geçiş betiği üretir |
| `npm run test:db` | Veritabanı testleri (`tests/db`); test veritabanını her seferinde baştan kurar |
| `npm run test:e2e:db` | Sitenin veritabanı modunda tarayıcı testleri (`tests/e2e-db`, `scripts/e2e-db.mts`): test veritabanını baştan kurup örnek veriyi yükler, siteyi `.next-db`'ye derler, testleri çalıştırır |
| `npm run db:studio` | Tabloları tarayıcıda gösterir (Drizzle Studio); veriler bilgisayardaki veritabanından gelir |
| `npm run yonetici:olustur` | Panel için yönetici hesabı açar ya da var olan yöneticinin şifresini değiştirir (aşağıda) |
| `npm run sap:stok [zorla]` | SAP depo stoğunu beklemeden bir kez okutur (sitenin `/api/sap/stok` ucunu çağırır; aşağıda). `zorla`: yarım okuma korumasına takılan okumayı uygular |

Testler tablo listesinin ve kolonların bu dosyayla aynı olduğunu da
dener: belgeye yazılmayan bir tablo ya da kolon eklenirse test düşer.

**Örnek veri (`npm run db:seed`, `src/seed.ts`):** Sitenin bugün
tarayıcıda kurduğu örnek verinin tamamı (`packages/data` ›
`createSeedDatabase`; ürünler, kategoriler, bayiler ve stokları, üyeler,
siparişler, teklifler, kuponlar, içerik, ayarlar) tablolara yazılır. Ne
yazıldığı tablo tablo ekrana basılır.

- Yalnızca **boş** veritabanına yüklenir (`products` boş değilse durur:
  önce `npm run db:reset`) ve yalnızca bilgisayarda (`localhost`) çalışır.
  Örnek üye ve siparişler içerdiği için canlı ya da deneme sunucusuna
  yüklenmez; onlar için `npm run db:yukle` (aşağıda).
- Tek işlemde yazılır; bir satır kurala takılırsa hiçbir şey yazılmaz.
- Eşleme "Bugünkü veriden farklar" tablosuna göredir. Ayrıca:
  - Silinmiş bir ürüne ya da üyeye bağlı kopya kayıtlarda (teklif ve
    sipariş satırı, yorum, servis, garanti) bağ boş kalır; ad ve kod
    kopyası durur.
  - Kargo firmalarının kimliği adından üretilir (`Yurtiçi Kargo` →
    `yurtici-kargo`); siparişin kargo bilgisi `shipments`'a gider.
  - Zenweld depo stoğu tek bir başarılı SAP okuması (`sap_sync_runs`)
    olarak yazılır.
  - Örnek üyelerin şifre özeti bugünkü basit özettir; sunucuda giriş
    yazılınca güçlü özete (argon2id) geçilecek (YAPILACAKLAR › Üyelik).
- Testler (`tests/db/ornek-veri.test.ts`) yüklemenin hatasız olduğunu,
  tablolardaki satır sayılarının veriyle aynı olduğunu ve başlıca bağları
  (ürün → kategori → grup, varyant değerleri, sipariş ve kargo, kupon
  kapsamı, depo stoğu) dener.

**Veri yükleme (`npm run db:yukle`, `src/load.ts`; KARARLAR K-90, K-91):**
Sitenin bugünkü verisi (`packages/data` › `createSeedDatabase`) canlı ya da
deneme veritabanına yazılır. Tablolar önce `npm run db:migrate` ile kurulur;
kurulmamışsa komut bunu söyler. Bağlantı `DATABASE_URL`'dir.

| Kayıtlar | `canli` | `deneme` |
|---|---|---|
| Katalog (gruplar, kategoriler, seçenekler, filtreler, ürünler, eski linkler), içerik (blog, haber, etkinlik, SSS, yasal metinler, Hakkımızda, Sayfa SEO, belge sayfaları, satış temsilcileri), mağaza ayarları (POS, havale hesapları, kargo firmaları, ayarlar), bayiler, satıcılar, Zenweld depo stoğu | Yüklenir | Yüklenir |
| Örnek yorumlar, kuponlar (kapsam ve kişiye özel e-postalarıyla), bayi ve satıcı stok listeleri ve yükleme geçmişi | — | Yüklenir |
| Demo hesaplar ve örnek üyeler, adresler, teklifler, siparişler, iadeler, kupon kullanımları, servis talepleri, garantiler, kayıt numarası sayaçları | — | — |

- **Eşleme:** `db:seed` ile aynı (`seedTables`). Yorumlar üyeye bağlanmaz
  (üyeler yüklenmez). Depo stoğu bir SAP okuması sayılmaz:
  `sap_sync_runs`'a satır yazılmaz, `sync_run_id` boş kalır.
- **Tekrar çalıştırılabilir:** Kayıt birincil anahtarıyla eşleşir. Olmayan
  eklenir; olan veriden farklıysa güncellenir, aynıysa yazılmaz. Veride
  bulunmayan bir "son değişiklik" kolonu (`updated_at`) güncellenen satırda
  o anın zamanını alır.
- **Hiçbir kayıt silinmez:** Veriden çıkarılmış ya da veritabanına başka
  yoldan eklenmiş kayıt (üye, sipariş, panelden eklenen içerik) olduğu gibi
  kalır. Ürün başka kategoriye taşınırsa eski kategorinin filtre değerlerini
  veritabanının kendi kuralı siler (`products_category_moved`).
- **`eksikler`:** Yalnızca olmayan kayıt eklenir; kimliği ya da benzersiz bir
  alanı (kod, ad, link) var olan satır atlanır. Panel veritabanına yazmaya
  başlayınca (Aşama 5) paneldeki değişikliklerin üzerine yazılmasın diye bu
  kullanılır.
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

**SAP stok okuma (`src/sap-stock.ts`; KARARLAR K-82, K-84):** Zenweld depo
stoğunu kaynaktan okuyup `warehouse_stock`'a yazar. Kurallar (kodun
sadeleşmesi, aynı kalemin toplanması, eksi miktar, geçersiz okuma):
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
  okunur). SAP bağlantı bilgileri gelince SAP'tan okuyan kaynak eklenir;
  okuma kuralları ve yazma değişmez. Kaynak tanımlı değilse iş çalışmaz.
- **Çalıştırma:** Sitenin `/api/sap/stok` ucu (POST; yalnızca
  `CRON_SECRET` anahtarıyla, veritabanı modunda). Sunucunun zamanlayıcısı
  15 dakikada bir çağırır ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9 › Zamanlanmış
  işler); `npm run sap:stok` elle bir kez çağırır. Stok değiştiyse
  (eklenen, çıkan ya da miktarı değişen kalem) depo stoğunu kullanan
  sayfalar o anda yenilenir (`refreshSite(["depo-stogu"])`); değişmediyse
  yenilenmez.
- Test: `tests/db/sap-stok.test.ts` (okuma kaydı, tek işlemde yenileme,
  hatada son stoğun kalması, kilit, yarıda kalan okuma, yarım okuma
  koruması, deneme dosyası); `tests/e2e-db` (uç: anahtar, stok 0 gelince
  sayfanın hemen STOKTA YOK olması, hatalı ve yarım okuma, zorla).

**Şifre ve oturum (`packages/auth/src/server`; KARARLAR K-94):**

- **Şifre özeti:** argon2id (`@node-rs/argon2`; 19 MB bellek, 2 tur, 1 iş
  parçacığı). Özet tuzu ve ayarları içinde taşır. Eski demo özeti
  (`zw1$…`) de doğrulanır; doğruysa yeni özet döner ve kaydedilir (ilk
  girişte güçlü özete geçilir). Yeni şifre en az 8 karakter
  (`packages/auth/src/rules.ts`).
- **Oturum:** 32 rastgele baytlık anahtar tarayıcıya yalnızca sunucunun
  okuyabildiği çerezle verilir; `sessions.id` anahtarın sha256 özetidir
  (veritabanı okunsa da oturum çalınmaz). Site oturumu (`site`) yalnızca
  bireysel ve kurumsal üyeye, panel oturumu (`admin`) yalnızca yöneticiye
  açılır; askıdaki ya da rolü değişen üyenin oturumu geçersizdir.
- **Süre:** Site 30 gün; kullanıldıkça uzar (en fazla saatte bir yazılır).
  Panel girişten 8 saat sonra biter, uzamaz.
- **Kapatma:** Çıkışta oturum silinir; şifre değişince üyenin diğer
  oturumları silinir; yeni girişte üyenin süresi dolmuş oturumları
  temizlenir.
- **Site üyeliği (Aşama 4.2):** Veritabanı modunda sitenin kayıt, giriş,
  çıkış, profil, şifre değiştirme ve hesap silme işlemleri
  `apps/zenweld-web/src/app/api/uyelik/[islem]/route.ts` ucundan,
  `packages/auth/src/server/accounts.ts` kurallarıyla yapılır; tarayıcı
  tarafı `AuthProvider`'ın sunucu modudur. Oturum çerezi `zw_oturum`:
  HttpOnly, SameSite=Lax, gerçek alan adında Secure; sayfa her açılışta
  `/api/uyelik/ben` ile üyeyi okur. Başka siteden gelen istek (Origin
  farklı) reddedilir. Girişte üye satırı kilitlenir: aynı anda gelen yanlış
  denemeler de doğru sayılır (`failed_login_*`, `login_locked_until`).
  Tarayıcıya giden üye kaydında şifre özeti boştur.
- **Panel girişi (Aşama 4.3):** Veritabanı modunda panelin girişi ve çıkışı
  `apps/zenweld-web/src/app/api/yonetim/oturum/[islem]/route.ts` ucundan
  (`ben`, `giris`, `cikis`); oturum çerezi `zw_panel` (sitenin çerezinden
  ayrı). Panel düzeni (`app/yonetim/(panel)/layout.tsx`) her istekte
  oturumu sunucuda okur; geçerli yönetici oturumu yoksa sayfa gönderilmez,
  giriş ekranına yönlendirilir. Çerez ve istek denetimi iki uçta ortak:
  `lib/server/session-cookie.ts`.
- **Şifre sıfırlama (Aşama 4.4, K-95; `packages/auth/src/server/password-reset.ts`):**
  `POST /api/uyelik/sifre-unuttum` hesap olsa da olmasa da aynı yanıtı
  verir; hesap aktif bir üyeyse 32 baytlık anahtar üretilir, özeti
  `password_reset_tokens`'a yazılır (üyenin eski bağlantıları silinir) ve
  bağlantı (`<NEXT_PUBLIC_SITE_URL>/sifre-sifirla?anahtar=…`; adres isteğin
  Host başlığından alınmaz) üyeye e-postayla gider. Aynı üye için 15
  dakikada bir. `POST /api/uyelik/sifre-sifirla` anahtarı ve yeni şifreyi
  alır: 1 saat içinde ve kullanılmamışsa şifre değişir, bağlantı kullanılmış
  olur, üyenin bütün oturumları silinir, yanlış şifre sayacı sıfırlanır.
- **`npm run yonetici:olustur`:** `DATABASE_URL`'deki veritabanında e-posta,
  ad, soyad, telefon ve şifre (ekrana yazılmaz, iki kez) sorup yönetici
  hesabı açar. Canlıya hiç hesap yüklenmediği için (K-91) ilk yönetici
  bununla açılır. E-posta bir yöneticiye aitse şifresini değiştirir ve açık
  oturumlarını kapatır; bir üyeye aitse hesap açmaz. Terminal dışından
  çalışmaz.
- Test: `tests/db/oturum.test.ts` (özet, eski özetin çevrilmesi, oturumun
  türü ve rolü, süreler, askı, çıkış ve diğer oturumların kapanması; kayıt,
  giriş, deneme sınırı, profil, şifre değiştirme, hesap silme, şifre
  sıfırlama);
  `tests/unit/uyelik.test.ts` (şifre kuralı, deneme sınırı);
  `tests/e2e-db/uyelik.spec.ts` (tarayıcıda: kayıt, çerez, çıkış, giriş,
  tek mesaj, deneme sınırı, diğer cihazın oturumu, profil, hesap silme,
  eski özetin çevrilmesi, başka siteden istek, şifre sıfırlama);
  `tests/e2e-db/panel.spec.ts`
  (oturumsuz panelin gönderilmemesi, 8 saatlik oturum, üyenin panele
  girememesi, çıkış, askı, süre dolması, deneme sınırı).

**Üyenin adresleri ve favorileri (Aşama 5.1, KARARLAR K-96;
`packages/auth/src/server/account-data.ts`):**

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
  istekler; favori ekleme, tekrar,
  çıkarma, ürün silinince gitmesi, 500 sınırı ve girişteki birleştirme);
  `tests/e2e-db/hesap-verisi.spec.ts` (tarayıcıda: adres ekleme, varsayılan,
  silme, başka cihaz; misafir favorilerinin girişte hesaba geçmesi, başka
  cihaz, çıkışta boş kalpler).

**Siparişler (Aşama 5.2, KARARLAR K-97; `src/orders.ts`):**

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
  (`nextRecordCode`). Kartlı siparişte `paid_at` sipariş anıdır (temsili
  ödeme); havalede `due_at` = sipariş anı + mağaza ayarındaki gün.
- **Kilitler:** Kuponlu siparişte kupon satırı (`coupons`, FOR UPDATE)
  kilitlenir; aynı kuponla aynı anda gelen siparişler sırayla sayılır, sınır
  aşılmaz. İade talebinde sipariş satırı kilitlenir. Havale iptalinde
  süresi dolan siparişler kilitlenir.
- **Havale süresi:** Son ödeme gününün sonu Türkiye saatine göredir
  (`packages/data/src/orders.ts`). Süresi dolan sipariş `cancelled` olur,
  geçmişe "Ödeme süresi doldu" notuyla yazılır, `coupon_redemptions.released_at`
  dolar.
- **Okuma:** `readOrders`, `readReturnRequests`, `readCoupons` (ve Aşama 5.3'te
  `readQuotes`, `readServiceRequests`, `readWarranties`) isteğe bağlı
  bir koşulla yalnızca ilgili kayıtları okur (ör. bir üyenin siparişleri,
  bir kuponun kullanımları).
- Bildirim e-postası (`info@zenweld.com`) kayıttan sonra sunucudan gider
  (`apps/zenweld-web/src/lib/server/notify.ts`); yanıt onu beklemez.
- Panelin Siparişler, İade Talepleri ve Kuponlar ekranları veritabanıyla
  çalışır (aşağıda "Panel › Satış").
- Test: `tests/db/siparis.test.ts` (kartlı sipariş ve tutarlar, numaranın
  en büyük numaradan devam etmesi, fiyat değişince, stoksuz, satıştan kalkan
  ürün, eksik ve hatalı bilgi, taksit, POS yokluğu; havale ve süre dolunca
  iptal, kupon hakkının geri verilmesi; sepet kuponu ve kişiye özel kupon;
  iade talebi kuralları; aynı anda gelen siparişlerde kupon sınırı);
  `tests/e2e-db/siparis.spec.ts` (tarayıcıda: sepette kupon, kartla sipariş,
  başka cihaz, iade talebi; fiyat değişince; havale süresi dolunca iptal).

**Formlar (Aşama 5.3, KARARLAR K-81; `src/forms.ts`):**

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
    ve videolar dosya deposu gelene kadar (Aşama 6) `media`'da veri olarak
    (`data:` adresi) durur.
  - `GET /api/formlar/garanti?seri=…`: garanti sorgulama (`findWarranty`);
    yalnızca sorgulama kartındaki alanlar döner.
  - `GET /api/formlar/teklifler`, `GET /api/formlar/garantiler`: üyenin
    teklifleri (`user_id`) ve garantileri (e-posta).
- Yalnızca e-postaya giden formlar da kendi tablolarına yazılır:
  `/api/bayilik` → `dealer_applications`, `/api/destek` → `support_messages`
  (`urun-destek`; ürün koduna göre `product_id`), `/api/bildirim` iletişim →
  `support_messages` (`iletisim`), Welders Club → `welders_club_signups`.
  Yanıtta `saved: true` döner; e-posta gitmese de form ulaşmış sayılır.
- **E-posta kaydı:** sunucunun gönderdiği her e-posta (`lib/server/mail.ts`)
  `email_log`'a yazılır (`logEmail`): tür, sayfa (`Referer`'dan, aynı
  siteden geliyorsa), bağlı kayıt, alıcı, yanıt adresi, konu, sonuç
  (`sent`; servis hatasında `failed`; anahtar yoksa ya da bot tuzağında
  `skipped`), servisin verdiği numara ve hata. Metin yazılmaz. Kayıt
  yazılamazsa e-posta yine gider.
- Bot tuzağı doluysa kayıt yapılmaz; `email_log`'a `skipped` yazılır.
- Panelin Teklifler, Servis Talepleri, Garantiler, Yorumlar, Bayilik
  Başvuruları, Mesajlar ve Welders Club ekranları veritabanıyla çalışır
  (aşağıda "Panel › Talepler").
- Test: `tests/db/formlar.test.ts` (teklif kuralları ve katalogdan alınan
  ürün bilgisi, servis talebi, garanti kaydı, tekrar eden seri no, Türkiye
  gününe göre bitiş, sorgulama, yorum, e-postaya giden formların kaydı,
  e-posta kaydı ve türleri); `tests/e2e-db/formlar.spec.ts` (tarayıcıda:
  ziyaretçi ve üye teklifi, Tekliflerim, servis, garanti, sorgulama,
  Garantilerim, yorum, iletişim, Welders Club, bot tuzağı).

**Panel › Satış (Aşama 5, 1. alan; KARARLAR K-99; `src/admin-sales.ts`, `src/audit.ts`):**

- **Okuma:** Panelin her sayfası verisini kendi sunucu bileşeninde okur
  (`app/yonetim/(panel)/siparisler/page.tsx` vb.); sayfa her açılışta ve
  her kayıttan sonra (`router.refresh`) yeniden okunur. Önce geçerli
  yönetici oturumu denetlenir.
  - `readOrdersPanel`: siparişler (detayda yalnızca o sipariş) ve mağaza
    ayarları; önce süresi dolan havaleler iptal edilir (bir işlem içinde).
  - `readReturnsPanel`: iade talepleri.
  - `readCouponsPanel`: kuponlar ve kullanımları; düzenlemede yalnızca o
    kupon, kullanıldığı siparişler ve üyeler (`readPanelMembers`: yönetici
    hariç, şifre özeti boş). Kupon formunun ürün ve kategorileri sitenin
    önbellekteki katalogundan.
- **Yazma:** `POST /api/yonetim/satis/<işlem>`
  (`apps/zenweld-web/src/app/api/yonetim/satis/[islem]/route.ts`):
  `odeme-alindi`, `kargo`, `teslim`, `iptal`, `siparis-notu`,
  `iade-talebi`, `kupon` (oluşturma ve düzenleme), `kupon-durum`,
  `kupon-sil`. Yalnızca geçerli panel oturumu olan yönetici yazar
  (yoksa 401); başka siteden gelen istek reddedilir (403). Her işlem tek
  işlemdir (transaction).
- **Aynı kaydı iki kişi düzenlerse:** İstek, ekranın gördüğü `updated_at`'i
  taşır. Kayıt satırı kilitlenir (FOR UPDATE); `updated_at` değişmişse
  kaydedilmez, 409 "Bu kayıt siz açtıktan sonra değişti; sayfayı
  yenileyin." Aynı anda gelen ikinci istek birincinin bitmesini bekler ve
  reddedilir. Başarılı yazma yeni `updated_at`'i döndürür; ekran sayfa
  yenilenmeden aynı kaydı yeniden kaydederse onu gönderir (yöneticinin
  kendi kaydı reddedilmez). Ortak kurallar: `src/panel.ts`; ortak uç akışı:
  `apps/zenweld-web/src/lib/server/admin.ts` (`runPanelAction`); tarayıcı:
  `apps/zenweld-web/src/lib/admin-panel.ts`.
- **Siparişte yazılanlar:** Durum değişince `order_status_history`'ye yeni
  satır, `changed_by` = yönetici. Ödeme alındı: `paid_at`; süresi dolmuşsa
  onaylanmaz, "Ödeme süresi doldu" notuyla iptal edilir. Kargo: `shipments`
  (giden gönderi; firma `carriers`'tan adla bulunur, listeden çıkarılmış
  kayıtlı firma korunur; takip no düzeltilince `shipped_at` değişmez).
  Teslim: `shipments.delivered_at`. İptal: kupon kullanımı geri verilir
  (`coupon_redemptions.released_at`).
- **Kupon:** Biçim ve kurallar demo moduyla aynı (`packages/data` ›
  `normalizeCouponDraft`, `validateCoupon`); `coupon_targets` ve
  `coupon_customers` baştan yazılır; seçilen ürün ve kategoriler var
  olmalı; kod tekrarı denetlenir (kupon kayıtları aynı anda iki aynı kodu
  yazmasın diye sırayla yapılır). Kullanılmış kupon silinmez.
- **İşlem kaydı (`audit_log`):** Her değişiklik aynı işlemde yazılır
  (`writeAudit`): yönetici kimliği, adı ve IP adresi, işlem, tablo, kayıt
  kimliği, okunur ad (sipariş no, iade no, kupon kodu) ve `changes`.
  Güncellemede yalnızca değişen alanlar (`{ alan: [eski, yeni] }`;
  `changedFields`), oluşturmada kaydın ilk hali, silmede son hali.
  Değişiklik yoksa hiçbir şey yazılmaz. Panel girişi ve çıkışı da yazılır
  (`login`/`logout`, `users`, okunur ad yöneticinin e-postası). Sistemin
  yaptığı iptal (süresi dolan havale) yazılmaz.
- Tarayıcı tarafı: `apps/zenweld-web/src/lib/admin-sales.ts`
  (`useSalesActions`); demo modunda aynı işlemler tarayıcıdaki veriye
  yazılır.
- Test: `tests/db/panel-satis.test.ts` (ödeme, kargo, takip no düzeltme,
  teslim, geçmişte yönetici, işlem kaydı; süresi dolan havale, iptal ve
  kupon hakkı, iç not; okurken iptal; iade talebi; kupon oluşturma, biçim,
  kod tekrarı, olmayan ürün, hatalı alan, düzenleme, aktif/pasif, silme,
  kullanılmış kupon; aynı anda iki yönetici); `tests/e2e-db/panel-satis.spec.ts`
  (tarayıcıda: oturumsuz ve başka siteden istek, kargoya verme ve teslim,
  "kayıt değişti" uyarısı, iade talebi, kupon oluşturma, kod tekrarı,
  pasife alma, silme, giriş ve çıkış kaydı).

**Panel › Talepler (Aşama 5, 2. alan; KARARLAR K-99, K-100; `src/admin-requests.ts`):**

- **Okuma** (her sayfa kendi sunucu bileşeninde; yönetici oturumu
  denetlenir): `readQuotesPanel`, `readServicePanel`, `readWarrantiesPanel`
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
  boşaltılır). Kurallar Satış ile aynı: oturum, kilit, `updated_at`
  denetimi, `audit_log`.
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
  (tarayıcıda: menüdeki yeni ekranlar, teklif durumu ve hemen ardından not,
  onaylanan yorumun ürün sayfasında hemen görünmesi, sitedeki bayilik
  başvurusu ve ürün sorusunun panelde görünmesi, Welders Club, oturumsuz
  istek).

**Okuma katmanı (`src/read.ts`):** Tablolardaki kayıtları sitenin bugün
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
- **Sitede kullanımı:** `apps/zenweld-web/src/lib/server/catalog.ts`.
  Veritabanı modunda (`DATA_SOURCE=database`, KARARLAR K-88) katalog, depo
  stoğu ve mağaza ayarları her sayfaya; bayiler, bayi ve satıcı stoğu ve
  yorumlar yalnızca gereken sayfaya (ürün sayfası, Bayi Bul, anasayfa)
  gider. Okunan veri 30 saniye önbellekte tutulur ve sayfalar 30 saniyede
  bir yeniden hazırlanır (değişiklik en geç bir dakikada görünür). Pasif
  bayi ve satıcılar ile satıcıların fiyatı tarayıcıya gönderilmez. Sayfanın
  başlığı, yapısal verisi, site haritası ve derlemede hazırlanan sayfa
  listesi de katalogdan üretilir. Tek önbellek kaydı en fazla 2 MB tutar;
  bugün katalogun tamamı ~110 KB.
- İçerik (`readContent`; `apps/zenweld-web/src/lib/server/content.ts`):
  blog, haber, etkinlik, SSS, yasal metinler, Hakkımızda, satış
  temsilcileri, belge sayfaları ve `page_seo`. Her sayfada kullanılan
  kısım (alt bilgideki yasal linkler, aramadaki blog/haber/etkinlik, SSS,
  sayfa başlıkları) sayfa çerçevesiyle gider; yasal metnin ve blog
  yazısının gövdesi, Hakkımızda, temsilciler, belgeler ve sipariş
  sözleşmeleri yalnızca kendi sayfasına. Yayından kaldırılan kayıtlar ve
  pasif temsilciler tarayıcıya gitmez. Sabit sayfaların başlığı
  `lib/server/page-metadata.ts` ile `page_seo`'dan okunur.
- **Yenileme:** Okunan her veri bir önbellek etiketiyle saklanır
  (`lib/server/tags.ts`: katalog, depo-stogu, stok, bayiler, yorumlar,
  icerik). Bir kayıt değişince `lib/server/refresh.ts` › `refreshSite`
  ilgili etiketi geçersiz kılar; o veriyi kullanan sayfalar bir sonraki
  ziyarette veritabanından yeniden hazırlanır. Bugün `/api/yenile` ucu ve
  `npm run site:yenile` kullanır (`REVALIDATE_SECRET`); ileride panel
  kaydı ve SAP stok okuma işi. Veritabanına ulaşılamazsa hata mesajı
  hangi okumanın başarısız olduğunu söyler; yayındaki sayfalar son
  hazırlanmış haliyle gösterilmeye devam eder.
- Test (`tests/db/okuma.test.ts`): örnek veri yazılıp geri okununca, kayıt
  türü başına birebir aynı çıkar (gidiş-dönüş); katalog ve mağaza ayarları
  tek başına da okunur; ürün stoğu yalnızca o ürünün stoktaki satırlarını,
  yorumlar yalnızca onaylıları döndürür.
