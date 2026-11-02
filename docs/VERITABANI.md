# Veritabanı — PostgreSQL Tabloları ve Kolonları

Bu dosya sitenin ve panelin sunucu veritabanını tablo tablo anlatır: her
tablonun kolonları, türleri, hangi kolonun zorunlu ya da benzersiz olduğu,
tabloların birbirine nasıl bağlandığı ve bir kayıt silinince ne olduğu.

**Durum (2026-11-02):** Liste sahibince onaylandı; tablolar henüz
kurulmadı, site ve panel bugün verileri tarayıcıda tutuyor. Geçiş betikleri
(SQL) bu dosyaya göre yazılacak (KARARLAR K-81). Betikler yazıldıktan sonra
tabloların asıl tanımı koddadır (`packages/db`); bu dosya aynı commit'te
güncel tutulur.

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
| Ekranda hep birlikte okunan liste | `jsonb` | Teknik özellik satırları, kutu içeriği, öne çıkanlar, görsel listesi, SEO alanları, ayarlar |
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

**Türkçe büyük/küçük harf:** "Benzersiz (harf duyarsız)" yazan kolonlar
Türkçe kurallarla karşılaştırılır (İ/i, I/ı). Bunun için veritabanında
Türkçe, büyük/küçük harf duyarsız bir karşılaştırma tanımı (ICU `tr`)
kullanılır.

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
| İletişim, bayilik, Welders Club, ürün destek formları yalnızca e-posta | `form_submissions` | Sahibinin kararı (K-81) |
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
| `combination_key` | text | zorunlu; ürün içinde benzersiz (yeni) | Değerlerin sıralı yazımı; bir kombinasyon bir üründe bir kez |
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
| `code` | text | anahtar | Boşlukları atılmış, büyük harfe çevrilmiş kod |
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

---

## 5. Üyeler ve oturumlar

### `users` — üyeler ve yöneticiler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `role` | text | zorunlu; `individual`, `business`, `admin` | Bireysel, kurumsal, yönetici |
| `status` | text | zorunlu; `active`, `suspended` | |
| `email` | text | zorunlu; benzersiz (harf duyarsız) | |
| `password_hash` | text | zorunlu | Güçlü özet (argon2id). Bugünkü demo özetleri taşınmaz; demo hesaplar yeniden özetlenir |
| `first_name`, `last_name`, `phone` | text | zorunlu | |
| `company_name`, `tax_office`, `tax_number`, `sector`, `city` | text | | Kurumsal bilgiler |
| `newsletter` | boolean | zorunlu | Haber ve kampanya e-postası izni |
| `created_at`, `updated_at` | timestamptz | zorunlu (`updated_at` yeni) | |
| `last_login_at` | timestamptz | | |
| `password_changed_at` | timestamptz | (yeni) | Şifre değişince diğer oturumlar kapanır |

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

Bugün oturum tarayıcıda tutuluyor; sunucuya taşınır.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | Oturum belirtecinin özeti; belirtecin kendisi yalnızca tarayıcının çerezinde durur |
| `user_id` | text | zorunlu; → `users` (zincir) | |
| `scope` | text | zorunlu; `site`, `admin` | Site ve panel oturumu ayrıdır |
| `created_at`, `expires_at`, `last_seen_at` | timestamptz | zorunlu | |
| `ip` | inet | | |
| `user_agent` | text | | |

### `password_reset_tokens` — şifre sıfırlama (yeni)

| Kolon | Tür | Kural |
|---|---|---|
| `token_hash` | text | anahtar |
| `user_id` | text | zorunlu; → `users` (zincir) |
| `created_at`, `expires_at` | timestamptz | zorunlu |
| `used_at` | timestamptz | Tek kullanımlık |

### `favourites` — favoriler (yeni)

Bugün tarayıcıda (`zenweld.favourites.v1`).

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
| `shipping_address` | jsonb | zorunlu | Kopya: `{ full_name, phone, city, district, line }` |
| `invoice` | jsonb | zorunlu | Kopya: tür, ad ya da firma, T.C. kimlik no ya da vergi bilgisi, adres |
| `subtotal` | numeric(12,2) | zorunlu | Ürünler toplamı (KDV dahil) |
| `vat` | numeric(12,2) | zorunlu | İçindeki KDV |
| `shipping` | numeric(12,2) | zorunlu | Kargo (KDV dahil) |
| `installment_fee` | numeric(12,2) | zorunlu | Vade farkı |
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
| `carrier`, `tracking_number` | text | | Kargo |
| `shipped_at`, `delivered_at` | timestamptz | | |
| `customer_note`, `admin_note` | text | | |
| `terms_accepted_at` | timestamptz | zorunlu | Ön bilgilendirme ve sözleşme onayı |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Silme: panelde silinmez.

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

Banka POS'u bağlanınca kesinleşecek; bugün ödeme demo.

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
| `sections` | jsonb | zorunlu | Bölümler `[{ id, title, body, image_url }]` |
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
  havale süresi (gün), kargo firmaları.
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
| `installments` | jsonb | zorunlu | Müşteriye sunulan taksitler `[{ count, rate_percent, enabled }]` |
| `commissions` | jsonb | zorunlu | Bankanın kestiği oranlar `[{ count, rate_percent }]` |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `bank_accounts` — havale hesapları

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `bank_name`, `account_holder`, `iban` | text | zorunlu |
| `position` | int | zorunlu (yeni) |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

---

## 11. Formlar, e-postalar, kayıt numaraları ve değişiklik kaydı

### `form_submissions` — yalnızca e-postaya giden formlar (yeni)

Sahibinin kararı (K-81): bugün yalnızca info@zenweld.com'a e-posta olarak
giden formlar veritabanında da saklanır. E-posta yine gider; kayıt, e-posta
gitmese de alınır.

| `type` | Form |
|---|---|
| `bayilik` | Bayilik Başvurusu |
| `iletisim` | İletişim |
| `urun-destek` | Ürün sayfasındaki destek sorusu |
| `welders-club` | Welders Club katılım |

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `type` | text | zorunlu; yukarıdaki dört değer | |
| `status` | text | zorunlu; `new`, `read`, `done` | Panelde takip |
| `name` | text | | Ad soyad ya da yetkili kişi |
| `email`, `phone`, `city`, `company_name`, `subject` | text | | Formda varsa |
| `message` | text | | Mesaj, soru ya da not |
| `product_id` | text | → `products` (boşalır) | Ürün destek sorusunda |
| `user_id` | text | → `users` (boşalır) | Giriş yapmışsa |
| `data` | jsonb | zorunlu | Forma özgü diğer alanlar (bayilikte vergi dairesi/no, faaliyet alanı, sektördeki yıl, çalıştığı markalar, showroom, servis kabiliyeti; ürün sorusunda ürün kodu ve sayfa adresi) |
| `admin_note` | text | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

E-postanın gidip gitmediği `email_log`'dadır. Bülten kaydı bu tabloya
girmez; bülten servisi kararını bekliyor (YAPILACAKLAR › Bülten ve İYS).
Panelde bu kayıtları gösterecek ekran siteyi veritabanına bağlarken
eklenecek.

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

Müşteriye gidecek e-postalar (sipariş onayı, şifre sıfırlama…) kurulunca
türleri bu listeye eklenir.

### `email_log` — gönderilen e-postalar (yeni)

Sahibinin kararı (K-81): gönderilen her e-postanın sitenin hangi özelliği ve
sayfası için gönderildiği tutulur.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `type` | text | zorunlu | E-posta türü (yukarıdaki liste): hangi özellik için gönderildiği |
| `source_path` | text | | Formun gönderildiği sayfa (`/welders-club`, `/urun/ultimate-250-mtc`) |
| `entity_type`, `entity_id` | text | | Bağlı kayıt (ör. `quotes` + teklifin kimliği, `form_submissions` + kaydın kimliği) |
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
(IS-KURALLARI › Kayıt numaraları).

### `audit_log` — panel değişiklik kaydı (yeni)

Sahibinin kararı (K-81): panelde yapılan her değişiklik kaydedilir.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `at` | timestamptz | zorunlu | |
| `actor_user_id` | text | → `users` (boşalır) | İşlemi yapan yönetici |
| `actor_name` | text | zorunlu | Kopya; yönetici silinse de okunur |
| `action` | text | zorunlu; `create`, `update`, `delete`, `login`, `logout` | Panele giriş ve çıkışlar da yazılır |
| `entity_type` | text | zorunlu | Tablo adı (`products`, `orders`…); giriş/çıkışta `users` |
| `entity_id` | text | zorunlu | Girişte yöneticinin kendi kimliği |
| `entity_label` | text | | Okunur ad (ürün adı, sipariş no) |
| `changes` | jsonb | | Değişen alanlar: `{ alan: [eski, yeni] }`; silmede kaydın son hali |
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
| Üyeler | `users`, `addresses`, `sessions`, `password_reset_tokens`, `favourites` | 5 |
| Teklif | `quotes`, `quote_items` | 2 |
| Sipariş ve iade | `orders`, `order_items`, `order_status_history`, `payment_transactions`, `return_requests`, `return_request_items` | 6 |
| Servis, garanti, yorum | `service_requests`, `warranties`, `reviews` | 3 |
| İçerik | `blog_posts`, `news`, `events`, `faqs`, `sales_reps`, `legal_pages`, `about_page`, `page_seo`, `document_pages`, `documents` | 10 |
| Ayarlar ve ödeme | `settings`, `payment_pos`, `bank_accounts` | 3 |
| Sistem | `form_submissions`, `email_recipients`, `email_log`, `record_counters`, `audit_log` | 5 |
| **Toplam** | | **54** |

---

## 13. Açık sorular

1. **Kişisel verilerin saklama süresi (KVKK):** Sipariş faturasındaki T.C.
   kimlik no, form kayıtları, gönderilen e-postaların kaydı ve silinen
   üyenin geçmiş kayıtları ne kadar tutulacak? Sahibi avukata soracak
   (YAPILACAKLAR › Hesap silme). Cevaba göre bu dosyaya saklama süreleri ve
   kendiliğinden silme eklenir.
