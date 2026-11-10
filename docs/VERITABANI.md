# Veritabanı — Kayıtlar, Tablolar ve Alanlar

Bu dosya sitenin ve panelin sakladığı bütün kayıtları tek yerde anlatır: hangi
kayıt türleri var, her birinin tablosu ve kolonları, kolonların anlamı ve
kuralları, kayıtların birbirine nasıl bağlandığı, hangi alanların benzersiz
olduğu ve bir kayıt silinince ne olduğu.

**İki modda nerede durur:**

- **Veritabanı modunda** (`DATA_SOURCE=database`, KARARLAR K-88) bütün
  kayıtlar sunucudaki PostgreSQL tablolarındadır. Site, üyelik, formlar ve
  panelin bütün ekranları bu tablolardan okur ve yazar.
  Tarayıcıya örnek veri gönderilmez, tarayıcı deposuna veri yazılmaz.
- **Demo modunda** bütün veri tarayıcıda tek bir JSON nesnesidir
  (`zenweld.db.v1`). Şekli `packages/data/src/types.ts` › `ZenweldDatabase`
  tipidir; her dizisi bir tabloya karşılık gelir. Tablolardan farkları:
  [2](#2-tarayıcıdaki-veri-ile-tablolar-arasındaki-farklar).

Tabloların asıl tanımı koddadır (`packages/db/src/schema/`); bu dosya her
şema değişikliğinde aynı commit'te güncellenir. Tablo listesi ve kolonlar
`npm run test:db` ile bu dosyaya karşı denetlenir.

İlgili dosyalar:

- Sunucunun bu tablolardan nasıl okuyup yazdığı, betikler ve komutlar:
  [SUNUCU.md](SUNUCU.md)
- Fiyat, KDV, kampanya, taksit, sipariş ve garanti hesapları:
  [IS-KURALLARI.md](IS-KURALLARI.md)
- Kayıtların ekranlarda nasıl girildiği: [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md),
  [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md)
- Stok dosyasının biçimi: [STOK.md](STOK.md)

---

## İçindekiler

1. [Genel kurallar](#1-genel-kurallar)
2. [Tarayıcıdaki veri ile tablolar arasındaki farklar](#2-tarayıcıdaki-veri-ile-tablolar-arasındaki-farklar)
3. [Katalog](#3-katalog)
4. [Bayiler, online satıcılar ve stok](#4-bayiler-online-satıcılar-ve-stok)
5. [Üyeler ve oturumlar](#5-üyeler-ve-oturumlar)
6. [Teklifler](#6-teklifler)
7. [Siparişler, iadeler ve kuponlar](#7-siparişler-iadeler-ve-kuponlar)
8. [Servis talepleri, garantiler, yorumlar](#8-servis-talepleri-garantiler-yorumlar)
9. [İçerik](#9-i̇çerik)
10. [Ayarlar ve ödeme](#10-ayarlar-ve-ödeme)
11. [Formlar, e-postalar, kayıt numaraları ve değişiklik kaydı](#11-formlar-e-postalar-kayıt-numaraları-ve-değişiklik-kaydı)
12. [Tablo listesi](#12-tablo-listesi)
13. [Açık sorular](#13-açık-sorular)
14. [İlişkiler](#14-i̇lişkiler)
15. [Benzersiz alanlar](#15-benzersiz-alanlar)
16. [Silme kuralları](#16-silme-kuralları)
17. [Tarayıcıda tutulanlar](#17-tarayıcıda-tutulanlar)
18. [Örnek veri ve veri sürümü](#18-örnek-veri-ve-veri-sürümü)
19. [Kullanılmayan alanlar](#19-kullanılmayan-alanlar)

---

## 1. Genel kurallar

**Adlar:** Tablo ve kolon adları küçük harf ve alt çizgiyle yazılır
(`category_id`). Koddaki alan adı kolonun birleşik yazılışıdır
(`first_name` → `firstName`); farklı olanlar tablonun altındaki "Koddaki"
satırında ya da Açıklama sütununda yazar (`position` → `order`).

**(yeni):** Tarayıcıdaki veride (demo modu) olmayan, yalnızca tabloda
bulunan kolon ya da tablo.

**Türler:**

| Ne | Tür | Not |
|---|---|---|
| Kimlik | `text` | Tarayıcıdaki kimlikler aynen taşınır (`p-ultimate-250-mtc`) |
| Tarih ve saat | `timestamptz` | Saat dilimiyle saklanır |
| Yalnızca tarih | `date` | `YYYY-AA-GG`: etkinlik başlangıç/bitişi, garanti bitişi |
| Para | `numeric(12,2)` | Türk lirası; kuruş kayması olmaz. Hangi tutarın KDV dahil, hangisinin hariç olduğu kolon adında yazar (`_ex_vat` = KDV hariç) |
| Oran (%) | `numeric(5,2)` | KDV, komisyon, vade farkı |
| Sabit değer listesi | `text` + `CHECK` | Durum, rol, bölüm gibi. Yeni değer eklemek bir betikle yapılır |
| Ekranda hep birlikte okunan liste | `jsonb` | Teknik özellik satırları, kutu içeriği, öne çıkanlar, görsel listesi, SEO alanları, ayarlar. İçindeki alan adları uygulamadaki gibidir (`fullName`, `ratePercent`); kayıt katmanı dönüştürmeden okur |
| Kimliği ya da kuralı olan her şey | ayrı tablo | Varyantlar, ürün kodları, filtre eşlemeleri, sipariş satırları |

**Zorunlu:** "Kural" sütununda **zorunlu** yazmayan kolon boş bırakılabilir.

**Kimlik (id):**

- Panelde ya da sitede yeni oluşan kayıtta kimliği uygulama verir:
  `<önek>-<zaman><rastgele>` (ör. `p-mvjccq8u1zic2`). Önekler: ürün `p`,
  kategori `c`, grup `g`, seçenek tanımı `opt`, haber `n`, blog `b`,
  etkinlik `e`, SSS `f`, yorum `rv`, adres `adr`, teklif `q`, sipariş `o`,
  servis talebi `srv`, garanti `w`, belge `doc`, stok işlemi `si`, satış
  temsilcisi `sr`, banka hesabı `ba`, POS `pos`, Hakkımızda bölümü `a`,
  rakam kutusu `s`.
- Üye `u-<zaman>`, bayi `d-<zaman>`, online satıcı `r-<zaman>` biçimindedir.
- Örnek veride kimlikler okunabilir yazılmıştır (`p-ultimate-250-mtc`,
  `d-basak-hirdavat`, `u-admin`).
- Kimlik yalnızca bağlantı içindir, ekranda gösterilmez.

**Tarih ve saat:**

- Tarih-saat alanları ISO 8601'dir (`2026-10-09T09:15:00+03:00`). Sistemin
  oluşturduğu kayıtlar UTC yazar (`…Z`); örnek veri Türkiye saatiyle
  (+03:00) yazılmıştır.
- Gün hesapları Türkiye saatine (Europe/Istanbul) göredir: havalenin son
  ödeme günü, iade süresi, garantinin bitişi ve kayıt numarasının yılı
  (`packages/data/src/orders.ts` › `turkeyDayEnd`, `turkeyYear`; iki modda
  da aynı kod).
- Ekranda tarih ve saat her zaman Türkiye saatiyle yazılır
  (`packages/utils/src/format.ts`); sayfayı önceden hazırlayan sunucu ile
  tarayıcı aynı günü gösterir.

**Para:** Bütün tutarlar Türk lirasıdır (TRY). Hesaplar:
[IS-KURALLARI.md](IS-KURALLARI.md).

**Link (slug) ve eski linkler:**

- Sayfası olan kayıtlarda (ürün, kategori, grup, blog yazısı, haber,
  etkinlik) `slug` adresin son parçasıdır. Yalnızca küçük Latin harf, rakam
  ve tire içerir.
- Link değişince eski adres yeni linke yönlenir. Tabloda eski adresler
  `redirects`'tedir. Tarayıcıdaki veride ürün, blog, haber ve etkinlikte
  `previousSlugs` (yalnızca son parça), kategori ve grupta `previousPaths`
  (tam yol; kategori adresi grubun linkine bağlı olduğu için), seçeneğe
  dönüştürülmüş eski üründe seçeneğin `previousSlugs` alanıdır.
- Yeni link başka bir kaydın eski linkiyse o eski yönlendirme silinir.

**SEO alanları:** Ürün, kategori, grup, blog yazısı, haber ve etkinlikte
`seo` (jsonb): `title` (sayfa başlığı; boşsa otomatik), `description`
(arama sonucu açıklaması; boşsa kısa açıklama ya da özet), `keywords[]`
(site içi arama ve `keywords` etiketi). Bütün alanlar boşsa `seo` hiç
yazılmaz. Sabit sayfaların SEO'su: [`page_seo`](#page_seo--sabit-sayfaların-arama-bilgileri).

**Kopya (anlık görüntü) alanlar:** Sipariş, teklif, iade ve servis
satırlarındaki ürün adı, kodu, seçenek adı ve fiyatı o anın kopyasıdır;
ürün sonradan değişse ya da silinse de değişmez. Siparişin adresleri, fatura
bilgileri ve ödeme bilgileri (POS adı, komisyon oranı) de sipariş anındaki
kopyadır.

**Yayında (`active`):** `active` kapalı olan ürün, blog yazısı, haber,
etkinlik, belge, bayi, online satıcı ve satış temsilcisi sitede görünmez ama
silinmez. Tarayıcıdaki eski blog kayıtlarında alan olmayabilir; yoksa
yayında sayılır.

**Son değişiklik (`updated_at`):** Değiştirilebilen her tabloda
`created_at` ve `updated_at` vardır. Panel bir kaydı açarken `updated_at`'i
de alır; kaydı iki yönetici düzenlerse sonra kaydeden "sayfayı yenileyin"
uyarısı alır, kayıt değişmez (KARARLAR K-99;
[IS-KURALLARI.md › 22](IS-KURALLARI.md#22-panelde-kayıt-düzenleme)).
Tarayıcıdaki veride bu alan yalnızca veritabanı modunda panelin okuduğu
kayıtta doludur.

**Görseller ve dosyalar:**

- Görsel ve belge kolonlarında yalnızca adres durur; dosyanın kendisi
  veritabanına yazılmaz.
- Veritabanı modunda panelde yüklenen görsel ve belge sunucunun dosya
  deposuna yazılır, kolona sitedeki adresi (`/dosya/…`) girer (K-108;
  [SUNUCU.md › Dosya deposu](SUNUCU.md#dosya-deposu)). Depo ayarlı değilse
  yükleme kapalıdır ve adres girilir (`https://…` ya da `/images/…`); sunucu
  yüklenmiş dosya (`data:` adresi) içeren kaydı kabul etmez (K-101, K-104).
- Demo modunda panelden yüklenen görsel kaydın içine `data:` adresi olarak
  yazılır; belgelerin dosyaları tarayıcının dosya deposunda (IndexedDB)
  durur. Bu görseller canlı veri yüklemesiyle taşınmaz (örnek görseller
  `/images/…` adresindedir).
- Kurallar: [IS-KURALLARI.md › 23](IS-KURALLARI.md#23-yüklenen-dosyalar).

**Gizli bilgiler:** POS API anahtarı ve şifresi ile e-posta servisinin
anahtarı hiçbir tabloda tutulmaz; yalnızca sunucuda ortam değişkenidir.
Kart numarası hiç saklanmaz; siparişte yalnızca son 4 hane durur.

**Silme:** Bağlantılarda silinince ne olacağı kolonun yanında yazar; bütün
liste: [16](#16-silme-kuralları).

- **zincir:** bağlı kayıt da silinir (ör. ürün silinince stok satırları).
- **boşalır:** bağlantı kolonu boşalır, kayıt kalır (ör. ürün silinince
  siparişteki ürün bağı; satırdaki ad ve kod kopyası durur).
- **engeller:** bağlı kayıt varken silinmez (ör. içinde ürün olan kategori).

**Sürüm:** PostgreSQL 18 (KARARLAR K-81). 18'de "engeller" kuralına
takılan silme 23001 (`restrict_violation`) hata koduyla döner; 17 ve
öncesinde 23503 dönerdi. Kayıt katmanı hatayı Türkçe mesaja çevirirken
ikisini de tanır.

**Türkçe büyük/küçük harf:** "Benzersiz (harf duyarsız)" yazan kolonlar
Türkçe kurallarla karşılaştırılır (I/ı, İ/i; "Işık" = "IŞIK", "Isık"
farklı). Veritabanında Türkçe küçük harfe çevrilmiş hali üzerinden benzersiz
dizinle sağlanır (`lower(ad COLLATE "tr-x-icu")`); PostgreSQL'in ICU desteği
gerekir (AWS ve Google Cloud'un PostgreSQL servislerinde vardır).

---

## 2. Tarayıcıdaki veri ile tablolar arasındaki farklar

Demo modunda veri tarayıcıda tek bir nesnedir (`ZenweldDatabase`) ve
çoğunlukla tabloya birebir gider. Farklı olanlar:

| Tarayıcıdaki veride | Veritabanında | Neden |
|---|---|---|
| Kategori gruba linkle bağlı (`group`) | `categories.group_id` | Grubun linki değişince bağ bozulmasın |
| Ürün kategoriye linkle bağlı (`categorySlug`); servis talebi ve garanti de | `category_id` | Aynı neden |
| Üründe, kategoride ve grupta `section` | Yalnızca grupta; kategori ve ürün grubundan alır | Tek yerde dursun, çelişmesin |
| `previousSlugs`, `previousPaths` (ürün, varyant, kategori, grup, blog, haber, etkinlik) | `redirects` tablosu | Eski adresler tek tabloda; "yeni link başka kaydın eski linkiyse o yönlendirme silinir" kuralı kendiliğinden sağlanır |
| Ürün kodu ve varyant kodlarının tek havuzda benzersizliği (panel denetler) | `sku_codes` tablosu | İki tabloya yayılan kural veritabanında da sağlansın |
| Ürünün `options` nesnesi | `product_options`, `product_variants`, `product_variant_values` | Varyant kodu, stok ve sepet varyanta bağlanıyor |
| Ürünün `filterValues` nesnesi | `product_filter_values` | Filtre ya da değer silinince ürünlerdeki işaret de kalksın |
| Kategorinin `optionIds` ve `filters` listeleri | `category_option_definitions`, `category_filters`, `category_filter_values` | Aynı neden |
| Ürünün `discount` nesnesi | `products.discount_*` kolonları | Anasayfadaki kampanya listesi sorgulanabilsin |
| Siparişin `payment`, `shipment` nesneleri | `orders` kolonları, `shipments` | Havale süresi, ödeme ve kargo tarihleri sorgulanabilsin; iade gönderisi de tutulabilsin |
| Siparişin `history` listesi | `order_status_history` | Kimin değiştirdiği de yazılsın |
| `settings.shop.pos`, `settings.shop.bankAccounts`, `settings.shop.carriers` (metin listesi) | `payment_pos`, `bank_accounts`, `carriers` | Siparişler POS'a bağlanıyor; takip bağlantısı verilebilsin |
| `about` nesnesi | `about_page` (tek satır) | — |
| `recordCounters` | `record_counters` | Aynı anda gelen iki kayıt aynı numarayı almasın |
| Kuponun `productIds`, `categoryIds`, `customerEmails` listeleri | `coupon_targets`, `coupon_customers` | Silinen ürün ve kategori kupondan da çıksın; e-postayla arama yapılabilsin (K-85, K-86) |
| Favoriler ve oturum tarayıcıda | `favourites`, `sessions` | Üye başka cihazda da görsün; oturum sunucuda tutulur (K-94, K-96) |
| İletişim, bayilik, Welders Club ve ürün destek formları: isteğe bağlı `dealerApplications`, `supportMessages`, `weldersClub` listeleri (K-109; eski kayıtlarda yok, yalnızca formu gönderen tarayıcıda) | `dealer_applications`, `support_messages`, `welders_club_signups` | Sahibinin kararı (K-81); panelde bütün yöneticiler görsün (K-100) |
| `warehouseStock` (örnek depo stoğu) | `warehouse_stock`, `sap_sync_runs` | Depo stoğu SAP'tan okunur, okumaların kaydı tutulur (K-82) |
| `emailRecipients` (tarayıcıda saklanır ama kullanılmaz; e-postaları sunucu gönderir) | `email_recipients` | Alıcı forma göre panelden değişir (K-81, K-104); satırı olmayan tür `SUPPORT_EMAIL`'e gider |
| Gönderilen e-postaların ve panel değişikliklerinin kaydı yok | `email_log`, `audit_log` | Sahibinin kararı (K-81) |

Tarayıcıda kalacaklar (sepet, teklif listesi, çerez tercihi):
[17](#17-tarayıcıda-tutulanlar).

---

## 3. Katalog

### `category_groups` — gruplar

Menüde bölümün altında sol kolondaki gruplar (ör. Kaynak Makineleri).
Koddaki: `categoryGroups`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `section` | text | zorunlu; `ekipmanlar`, `guvenlik`, `aksesuarlar`, `dolgu-metalleri` | Bölüm; kayıttan sonra değişmez |
| `slug` | text | zorunlu; bölüm içinde benzersiz | Adres: `/<bölüm>/<slug>` |
| `name` | text | zorunlu | |
| `description` | text | | Grup sayfasındaki kısa açıklama; boşsa kategori adlarından üretilir |
| `about_text` | text | | Sayfa altındaki tanıtım metni (biçimli) |
| `image` | text | | Kart görseli |
| `position` | int | zorunlu | Bölüm içindeki sıra (`order`) |
| `code` | text | | Kategori tablosundaki numara ("1.2"); kullanılmıyor ([19](#19-kullanılmayan-alanlar)) |
| `seo` | jsonb | | `{ title, description, keywords[] }` |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: içinde kategori varsa silinmez.

### `categories` — kategoriler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `group_id` | text | zorunlu; → `category_groups` (engeller) | Tarayıcıdaki veride `group` (grubun linki) ve `section` |
| `slug` | text | zorunlu; bütün sitede benzersiz | Adres: `/<bölüm>/<grup>/<slug>` |
| `name` | text | zorunlu | |
| `description` | text | zorunlu | Kısa açıklama |
| `about_text` | text | | Tanıtım metni (biçimli) |
| `image` | text | | Kart görseli; yoksa kategorinin ilk ürününün fotoğrafı |
| `icon` | text | | Kullanılmıyor |
| `code` | text | | "1.2.3"; kullanılmıyor |
| `position` | int | zorunlu | Grup içindeki sıra (`order`) |
| `seo` | jsonb | | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: içinde ürün varsa silinmez.

### `category_option_definitions` — kategoride listelenen seçenek tanımları

Bu kategoride ürüne seçenek eklenirken listelenen tanımlar. Koddaki:
`categories.optionIds`.

| Kolon | Tür | Kural |
|---|---|---|
| `category_id` | text | → `categories` (zincir) |
| `option_definition_id` | text | → `option_definitions` (zincir: tanım silinince bağ kalkar) |
| `position` | int | zorunlu |

Anahtar: (`category_id`, `option_definition_id`).

### `category_filters` ve `category_filter_values` — kategori filtreleri

Kategori sayfasındaki filtreler, sırasıyla. Filtreler kategoriye özeldir;
aynı adlı filtrenin değerleri kategoriye göre değişebilir (TIG'de Çalışma
Modu: DC, AC/DC; MIG'de Standart, Puls). Koddaki: `categories.filters`
(KARARLAR K-76).

`category_filters`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `category_id` | text | → `categories` (zincir) | |
| `id` | text | zorunlu; kategori içinde benzersiz | Filtrenin ilk adından üretilir (`model-serisi`) ve hiç değişmez; sayfa adresinde kullanılır (`?model-serisi=force`) |
| `name` | text | zorunlu; kategori içinde benzersiz (harf duyarsız) | Ör. "Model Serisi" |
| `position` | int | zorunlu | |

Anahtar: (`category_id`, `id`). Değeri olmayan filtre sitede görünmez.

`category_filter_values`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `category_id`, `filter_id` | text | → `category_filters` (zincir) | |
| `id` | text | zorunlu | Değerin ilk adından üretilir (`kompakt`) ve hiç değişmez; aynısı varsa sonuna `-2` eklenir |
| `label` | text | zorunlu; filtre içinde benzersiz (harf duyarsız) | Ör. "Kompakt"; ad düzeltilebilir |
| `position` | int | zorunlu | |

Anahtar: (`category_id`, `filter_id`, `id`).

### `option_definitions` ve `option_values` — seçenek tanımları

Ortak seçenek adları ve değerleri (KARARLAR K-14). Koddaki:
`optionDefinitions`.

`option_definitions`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name` | text | zorunlu; benzersiz (harf duyarsız) | Ör. "Torç Uzunluğu" |
| `position` | int | zorunlu (yeni) | Paneldeki sıra |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

Silme: bir üründe kullanılıyorsa silinmez.

`option_values` (koddaki: `values[]`):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `option_definition_id` | text | → `option_definitions` (zincir) | |
| `id` | text | zorunlu | Değerin ilk adından üretilir (`4-m`) ve **hiç değişmez**; aynısı varsa sonuna `-2`, `-3` eklenir |
| `label` | text | zorunlu; tanım içinde benzersiz (harf duyarsız) | Ör. "4 m"; ad düzeltilebilir |
| `position` | int | zorunlu | Sitede bu sırayla görünür |

Anahtar: (`option_definition_id`, `id`). Silme: bir üründe kullanılıyorsa
silinmez.

### `products` — ürünler

Ürün sayfası: ad, link, marka, kategori, açıklama, fiyat, garanti.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `slug` | text | zorunlu; benzersiz | Adres: `/urun/<slug>` |
| `sku` | text | zorunlu; `sku_codes` ile tek havuzda benzersiz | Ürün kodu (SAP kodu, K-72) |
| `name` | text | zorunlu | Markasız ("Zenweld" yazılmaz) |
| `category_id` | text | zorunlu; → `categories` (engeller) | Tarayıcıdaki veride `categorySlug` (+ `section`) |
| `model_code` | text | | Model kodu (ör. "Z03.01.15"); bugün boş kalır (K-72) |
| `brand` | text | | Marka (ör. "Jasic"); boşsa Zenweld. Arama motorlarına giden ürün bilgisinde kullanılır |
| `short_description` | text | zorunlu (boş olabilir) | |
| `description` | text | zorunlu (boş olabilir) | |
| `price_ex_vat` | numeric(12,2) | zorunlu; ≥ 0 | KDV hariç **normal** (indirimsiz) fiyat |
| `vat_rate` | numeric(5,2) | zorunlu | KDV oranı (%), ör. 20 |
| `currency` | text | zorunlu; yalnızca `TRY` | |
| `discount_percent` | int | 1–90 | Kampanya oranı (`discount.percent`) |
| `discount_starts_at` | timestamptz | | Boşsa hemen (kayıt anında) başlar |
| `discount_ends_at` | timestamptz | başlangıçtan sonra | Boşsa süresiz |
| `images` | jsonb | zorunlu | `[{ url, alt }]`, sırayla; ilki kapak |
| `specs` | jsonb | zorunlu | Teknik özellikler `[{ label, value }]` |
| `in_the_box` | jsonb | zorunlu | Kutu içeriği (metin listesi) |
| `highlights` | jsonb | zorunlu | Öne çıkanlar (metin listesi); ilk 3'ü menü kartında |
| `processes` | text[] | | Kaynak yöntemleri: `MIG`, `MAG`, `TIG`, `MMA`, `PULSE`, `PLAZMA`, `MULTI`. Yalnızca eski Ürün Seçici ve arama kullanır, panelde girilmez; Ürün Seçici yeniden kurulunca kalkar (K-69) |
| `position` | int | | Kategori içindeki sıra (`order`); boş olan sona, eşitler ada göre |
| `manual_url` | text | | Kullanım kılavuzu (PDF) |
| `warranty_months` | int | zorunlu | Garanti süresi (ay) |
| `active` | boolean | zorunlu | Yayında |
| `seo` | jsonb | | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

- Bölüm (`section`) kategoriden gelir. Teklife açık olup olmadığı da
  bölümden çıkar (K-79).
- Seçeneksiz ürünün kodu ve fiyatı ürün satırındadır; sepet, sipariş ve
  stok satırında `variant_id` boş kalır. Seçenekli üründe her satılan
  kombinasyonun kendi kodu ve fiyat farkı vardır (aşağıda). Seçeneksiz
  ürünün de tek varyantla tutulması önerisi:
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün seçenekleri.
- **SAP ile eşleşme:** SAP Business One'da standart olarak "ana ürün +
  varyant" yapısı yoktur; her satılabilir kalem ayrı bir kalemdir
  (ItemCode). Eşleşme "varyantın ürün kodu = SAP kalem kodu"dur. Sitede
  türetilen ve SAP'ta olmayan kodlar:
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün seçenekleri.

Silme: stok satırları, kod eşleştirmeleri, varyantlar, favoriler ve
yönlendirmeleri silinir. Sipariş, teklif, iade, servis, garanti, yorum ve
belgelerdeki bağ boşalır; o kayıtlar kalır.

### Seçenekli ürün: `product_options`, `product_variants`, `product_variant_values`

Bir ürün en fazla 3 seçenek kullanır (ör. Soğutma ve Torç Uzunluğu). Satılan
her kombinasyon (ör. Su Soğutmalı · 8 m) bir **varyanttır**; satılmayan
kombinasyonun varyantı yoktur (KARARLAR K-70). Koddaki: ürünün `options`
nesnesi.

- Seçeneklerin ve değerlerin adı ve sırası tanımdan okunur; ürün yalnızca
  kendine özel olanları tutar.
- Varyantlar ekranda önce birinci seçeneğin, sonra ikincisinin tanımdaki
  değer sırasıyla dizilir.
- Kombinasyonu olmayan seçenek kaydedilmez; aynı kombinasyon bir üründe iki
  kez olamaz.
- Seçenek listesi (tanımlar) değişince varyant kimlikleri yeniden üretilir;
  sıra değişince değişmez.

`product_options` — ürünün kullandığı seçenekler (koddaki:
`options.optionIds`, sayfadaki sırasıyla):

| Kolon | Tür | Kural |
|---|---|---|
| `product_id` | text | → `products` (zincir) |
| `option_definition_id` | text | → `option_definitions` (engeller) |
| `position` | int | zorunlu; 0, 1 ya da 2 (en fazla 3 seçenek); ürün içinde benzersiz |

Anahtar: (`product_id`, `option_definition_id`).

`product_variants` — satılan kombinasyonlar (koddaki: `options.variants`):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `product_id` | text | → `products` (zincir) | |
| `id` | text | zorunlu | Ürün içindeki kimlik; oluşturulduğu andaki değer kimliklerinden üretilir (`su_8-m`; tek seçenekte değerin kimliği, `4-m`) ve sonra değişmez. Stok, sepet, teklif listesi ve `?secenek=` linki bunu kullanır |
| `combination_key` | text | zorunlu; ürün içinde benzersiz (yeni) | Değerlerin sıralı yazımı: ürünün seçenek sırasıyla `tanım=değer`, `\|` ile (`sogutma=su\|torc-uzunlugu=8-m`); bir kombinasyon bir üründe bir kez |
| `sku` | text | zorunlu; `sku_codes` ile tek havuzda benzersiz | Varyantın ürün kodu |
| `price_delta_ex_vat` | numeric(12,2) | zorunlu; eksi olabilir | Ana fiyata eklenen fark (KDV hariç); toplam eksiye düşemez |
| `spec_overrides` | jsonb | | Yalnızca farklı teknik özellikler; aynı adlı satırın yerine geçer |
| `in_the_box` | jsonb | | Boşsa ürünün kutu içeriği |
| `image` | text | | Ürünün görsellerinden biri; boşsa ürünün fotoğrafları |
| `position` | int | zorunlu (yeni) | |

Anahtar: (`product_id`, `id`). Varyant önceden ayrı bir ürünken kullanılan
linkler `redirects`'te (`variant_id` ile; koddaki
`variants[].previousSlugs`).

`product_variant_values` — kombinasyonun değerleri (koddaki:
`options.variants[].values`, `{ <tanım kimliği>: <değer kimliği> }`):

| Kolon | Tür | Kural |
|---|---|---|
| `product_id`, `variant_id` | text | → `product_variants` (zincir) |
| `option_definition_id` | text | → `product_options` (tanım üründe seçili olmalı) |
| `option_value_id` | text | → `option_values` (engeller: kullanılan değer silinmez) |

Anahtar: (`product_id`, `variant_id`, `option_definition_id`). Varyant
ürünün her seçeneğinden tam bir değer alır; değer o tanımdan olmalıdır.

### `product_filter_values` — ürünün filtre değerleri

Koddaki: `filterValues` (`{ <filtre kimliği>: [<değer kimliği>, …] }`).

| Kolon | Tür | Kural |
|---|---|---|
| `product_id` | text | → `products` (zincir) |
| `category_id`, `filter_id`, `value_id` | text | → `category_filter_values` (zincir: filtre ya da değer silinince işaret kalkar) |

Anahtar: (`product_id`, `filter_id`, `value_id`).

- Bir filtrede birden çok değer olabilir; seçenekli üründe değer ürünün
  tamamı içindir.
- Yalnızca ürünün kendi kategorisinin filtreleri; kayıtta kategoride
  olmayan filtre ve değer silinir. Ürün başka kategoriye taşınınca eski
  kategorinin değerleri silinir.

### `sku_codes` — ürün ve varyant kodlarının tek havuzu (yeni)

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `code` | text | anahtar | Boşlukları atılmış, büyük harfe çevrilmiş kod (tire kalır: `zw-trc mb25` → `ZW-TRCMB25`) |
| `product_id` | text | → `products` (zincir) | |
| `variant_id` | text | zorunlu; boş metin = ürünün kendi kodu | |

Benzersiz: (`product_id`, `variant_id`). Ürün ve varyant kodu kaydedilince
veritabanı bu tabloyu kendisi günceller (tetikleyici); aynı kod ikinci kez
girilemez ([IS-KURALLARI.md › 12](IS-KURALLARI.md#12-ürün-kodları)).

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

Bayiler sitenin üyesi değildir; sitede bayi girişi yoktur (K-03).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `city`, `district`, `address`, `phone`, `working_hours` | text | zorunlu | |
| `whatsapp` | text | | |
| `email` | text | | Kullanılmıyor ([19](#19-kullanılmayan-alanlar)) |
| `lat`, `lng` | numeric(9,6) | zorunlu | Harita konumu |
| `badges` | text[] | zorunlu; `yetkili-satici` (Yetkili Bayi), `yetkili-servis` (Yetkili Servis); en az biri | |
| `retailer_id` | text | benzersiz; → `retailers` (boşalır) | Bayinin online mağazası; bir mağaza en fazla bir bayiye bağlı |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `retailers` — online satıcılar

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `website_url`, `logo_text` | text | zorunlu | `website_url`: satıcının ana sayfası. `logo_text`: ürün sayfasındaki kutuda görünen yazı; boşsa adın büyük harfi |
| `logo_url` | text | | Kullanılmıyor; logo yerine `logo_text` |
| `is_own_store` | boolean | zorunlu | Zenweld'in kendi mağazası (kırmızı rozetle en başta) |
| `city` | text | | |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### Stok tabloları — `dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases`

Bayilerin ve online satıcıların panelden yüklenen stok listeleri. Stok
dosyasının biçimi ve kuralları: [STOK.md](STOK.md); panelin bu tabloları
nasıl okuyup yazdığı: [SUNUCU.md › Stok Matrisi](SUNUCU.md#stok-matrisi).

`dealer_stock` — bayinin ürün/varyant başına stoğu. Anahtar: (`dealer_id`,
`product_id`, `variant_id`).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `dealer_id` | text | zorunlu; → `dealers` (silinince satır da silinir) | |
| `product_id` | text | zorunlu; → `products` (silinince satır da silinir) | |
| `variant_id` | text | zorunlu; varsayılan boş metin | Boşsa satır ürünün bütün varyantları içindir (dosyada ürünün ana kodu geçti) |
| `sku` | text | zorunlu | Dosyadaki kod |
| `quantity` | integer | zorunlu; ≥ 0 | |
| `price` | numeric(12,2) | | KDV dahil; sitede gösterilmez |
| `url` | text | | Yalnızca online mağazası olan bayide: ürünün o mağazadaki sayfası |
| `updated_at` | timestamptz | zorunlu | Stok geçerlilik süresi buna bakar |
| `import_id` | text | → `stock_imports` (boşalır) | Satırı yazan yükleme |

Dizin: adedi 0'dan büyük satırlarda (`product_id`, `updated_at`); ürün
sayfası yalnızca bu satırları okur.

`retailer_stock` — bir bayiye bağlı **olmayan** online satıcının stoğu.
`dealer_id` yerine `retailer_id` (zorunlu; → `retailers`, silinince satır
da silinir); diğer kolonlar, anahtar ve dizin `dealer_stock` ile aynı.
`url` boşsa ürün online satıcı kartında görünmez. Online mağazası olan
bayinin satırları `dealer_stock`'ta durur (`url` dolu); aynı veri iki
tabloya yazılmaz.

`stock_imports` — her dosya yükleme, elle düzeltme ve geri alma. Anahtar:
`id`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `source_type` | text | zorunlu; `dealer` / `retailer` | |
| `source_id` | text | zorunlu | Bayi ya da satıcı |
| `kind` | text | zorunlu; `file` (dosya) / `manual` (elle) / `revert` (geri alma) | |
| `file_name` | text | | Yüklenen dosyanın adı |
| `file_key` | text | | Orijinal dosyanın depodaki yeri (denetim için); bugün dosya saklanmadığı için boş |
| `note` | text | | Elle düzeltmenin açıklaması |
| `created_at` | timestamptz | zorunlu | |
| `created_by` | text | | İşlemi yapan yönetici |
| `rows`, `matched`, `unmatched`, `invalid` | integer | zorunlu | Okunan, eşleşen, tanınmayan ve hatalı satır sayısı |
| `added`, `changed`, `zeroed` | integer | zorunlu | Stoğa giren, değişen ve stoktan çıkan ürün sayısı |
| `previous` | jsonb | | Geri alma için işlemden önceki stok satırları; yalnızca son 5 dosya yüklemesinde tutulur (K-103) |
| `reverted_at` | timestamptz | | Geri alındığı an |

Dizin: (`source_type`, `source_id`, `created_at` yeniden eskiye).

`sku_aliases` — bayinin kendi ürün kodu → bizim ürün/varyant. Anahtar:
(`source_id`, `code`).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `source_id` | text | zorunlu | Bayi ya da satıcı |
| `code` | text | zorunlu | Büyük harf, boşluksuz |
| `product_id` | text | zorunlu; → `products` (silinince satır da silinir) | |
| `variant_id` | text | zorunlu; varsayılan boş metin | Boşsa ürünün bütün varyantları |

- Bir kaynakta aynı ürün ve varyant için tek satır olur.
- Sitede "stokta" sayılmak için: adet > 0 ve satır, stok geçerlilik
  süresinden eski değil ([`settings` › `stock`](#settings--ayarlar)).
- Bayinin online mağazası `dealers.retailer_id`'dir (yukarıda).

Silme: bayi ya da satıcı silinince stok satırları, stok işlemleri ve kod
eşleştirmeleri de silinir.

### `warehouse_stock` ve `sap_sync_runs` — Zenweld depo stoğu (SAP) (yeni)

Sahibinin kararı (K-82, K-84): Zenweld deposunun stoğu SAP'tan okunur. SAP
ekibi model başına "kullanılabilir stok" görünümü (view) hazırlıyor (adı
`AVAILABLE_STOCK`, kesinleşmedi). Sunucu bu görünümü 15 dakikada bir okuyup
`warehouse_stock`'a yazar; site ve panel stoğu buradan okur, sayfa açılırken
SAP'a gidilmez (hız, K-83). Okuma işi:
[SUNUCU.md › SAP stok okuma](SUNUCU.md#sap-stok-okuma).

- Ürüne ve seçeneğe SAP kodu üzerinden bağlanır; kimlikle bağlı değildir.
  Eşleşme ve "stokta yok" kuralı:
  [IS-KURALLARI.md › 20](IS-KURALLARI.md#20-zenweld-depo-stoğu).
- Panelden değiştirilmez.
- Demoda örnek veridir (koddaki `warehouseStock`): her SAP kalemine örnek
  adet; ForceArc 280 MMA ve UV-5 ile Ultimate 405 MTS'nin su soğutmalı
  kalemi stoksuzdur (`packages/data/src/seed/warehouse.seed.ts`).

`warehouse_stock`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `sap_item_code` | text | anahtar | SAP kalem kodu (boşluksuz, büyük harf) |
| `item_name` | text | | SAP'taki kalem adı; eşleşmeyen kodu panelde tanımak için |
| `quantity` | numeric(14,3) | zorunlu; ≥ 0 | Kullanılabilir stok (kg ile satılanlar için ondalıklı) |
| `synced_at` | timestamptz | zorunlu | SAP'tan okunduğu an |
| `sync_run_id` | bigint | → `sap_sync_runs` (boşalır) | |

Her başarılı okumada tablo tek işlemde yenilenir: SAP görünümünde artık
olmayan kalem silinir.

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

### `sap_order_exports` — SAP'a sipariş aktarım sırası (yeni)

Sahibinin kararı (K-84, K-108): site siparişleri SAP'a satış siparişi olarak
yazılır. Ödemesi kesinleşen sipariş buraya `pending` olarak girer: kartla
verilen sipariş verildiği anda, havale siparişi panelde **Ödeme Alındı**
denince. Zamanlanmış iş siparişi SAP'a gönderir; başarısızsa artan
aralarla yeniden dener ([SUNUCU.md › SAP sipariş
aktarımı](SUNUCU.md#sap-sipariş-aktarımı)). Bu tablodan önce ödenmiş
siparişlerin (örnek veri) satırı yoktur; aktarılmazlar.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `order_id` | text | anahtar; → `orders` (silinemez) | |
| `status` | text | zorunlu; `pending`, `sent`, `failed`, `skipped` | Sırada, aktarıldı, aktarılamadı (deneme hakkı bitti), aktarılmadı (gönderilmeden iptal) |
| `attempts` | int | zorunlu; ≥ 0 | Yapılan gönderme denemesi |
| `next_attempt_at` | timestamptz | zorunlu | Sıradaki siparişin en erken gönderileceği an |
| `sap_doc_no` | text | | SAP'ın verdiği belge numarası (deneme aktarıcısında `DENEME-<sipariş no>`) |
| `last_error` | text | | Son hata; atlanan siparişte nedeni |
| `sent_at` | timestamptz | | Aktarıldığı an |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Dizin: `sap_order_exports_due` (`status`, `next_attempt_at`): işin sıradaki
siparişleri bulması için.

---

## 5. Üyeler ve oturumlar

### `users` — üyeler ve yöneticiler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `role` | text | zorunlu; `individual` (Bireysel), `business` (Kurumsal), `admin` (Yönetici) | |
| `status` | text | zorunlu; `active` (Aktif), `suspended` (Askıda) | Yeni üye Aktif başlar; onay durumu yoktur (K-34) |
| `email` | text | zorunlu; benzersiz (harf duyarsız) | Küçük harfle saklanır |
| `password_hash` | text | zorunlu | Güçlü özet (argon2id). Demo modunda tarayıcıda basit bir özet (`zw1$…`); bilgisayardaki ve denemedeki örnek hesaplarda bu eski özet ilk girişte argon2id'ye çevrilir ([SUNUCU.md › Şifre ve oturum](SUNUCU.md#şifre-ve-oturum)) |
| `first_name`, `last_name`, `phone` | text | zorunlu | |
| `company_name`, `tax_office`, `tax_number`, `sector`, `city` | text | | Kurumsal üyede firma bilgileri |
| `newsletter` | boolean | zorunlu | Kayıtta "haber ve kampanya e-postaları" izni |
| `created_at`, `updated_at` | timestamptz | zorunlu (`updated_at` yeni) | |
| `last_login_at` | timestamptz | | Her girişte yazılır |
| `password_changed_at` | timestamptz | (yeni) | Son şifre değişikliği. Şifre değişince üyenin diğer oturumları silinir |
| `failed_login_count` | int | zorunlu; varsayılan 0 (yeni) | Yanlış şifre sayacı (KARARLAR K-94) |
| `failed_login_since` | timestamptz | (yeni) | Sayılan ilk yanlış denemenin anı; 15 dakikalık pencere buradan başlar |
| `login_locked_until` | timestamptz | (yeni) | Bu ana kadar giriş yapılamaz (10 yanlış denemeden sonra 15 dakika) |

- Yönetici hesapları sitede giriş yapamaz; site hesapları panele giremez.
- En az bir aktif yönetici her zaman kalmalıdır.

Silme: adresleri, oturumları ve favorileri silinir; sipariş, teklif, servis,
iade, garanti ve yorumlardaki bağ boşalır. Son aktif yönetici silinemez.

### `addresses` — üye adresleri

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `user_id` | text | zorunlu; → `users` (zincir) | Sahibi |
| `title`, `full_name`, `phone`, `city`, `district`, `line` | text | zorunlu | `title`: "Ev", "Atölye" gibi |
| `is_default` | boolean | zorunlu; üye başına tam bir varsayılan | Ödeme sayfasında seçili gelir |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

- Üyenin ilk adresi varsayılan olur; varsayılan adres silinirse kalan ilk
  adres varsayılan olur.
- Adresi yalnızca sahibi değiştirebilir.
- Üye başına en fazla 20 adres (K-96). Veritabanı modunda adresler
  sunucudadır.

### `sessions` — oturumlar (yeni)

Demo modunda oturum tarayıcıda; veritabanı modunda site ve panel oturumu
burada ([SUNUCU.md › Şifre ve oturum](SUNUCU.md#şifre-ve-oturum)).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | Oturum belirtecinin özeti; belirtecin kendisi yalnızca tarayıcının çerezinde durur |
| `user_id` | text | zorunlu; → `users` (zincir) | |
| `scope` | text | zorunlu; `site`, `admin` | Site ve panel oturumu ayrıdır |
| `created_at`, `expires_at`, `last_seen_at` | timestamptz | zorunlu | |
| `ip` | inet | | |
| `user_agent` | text | | |

### `password_reset_tokens` — şifre sıfırlama (yeni)

Veritabanı modunda kullanılır (KARARLAR K-95): `token_hash`
bağlantıdaki anahtarın sha256 özetidir; anahtarın kendisi yalnızca
e-postadadır. Üye başına en fazla bir geçerli bağlantı durur.

| Kolon | Tür | Kural |
|---|---|---|
| `token_hash` | text | anahtar |
| `user_id` | text | zorunlu; → `users` (zincir) |
| `created_at`, `expires_at` | timestamptz | zorunlu |
| `used_at` | timestamptz | Tek kullanımlık |

### `favourites` — favoriler (yeni)

Veritabanı modunda giriş yapmış üyenin favorileri burada (KARARLAR K-96); giriş yapmamış ziyaretçinin ve demo modunun favorileri
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
| `code` | text | zorunlu; benzersiz | `TKL-<yıl>-<4 hane>` ([11](#record_counters--kayıt-numaraları)) |
| `user_id` | text | → `users` (boşalır) | Üye gönderdiyse; ziyaretçide boş |
| `status` | text | zorunlu; `new` (Yeni), `reviewing` (İnceleniyor), `sent` (Teklif Gönderildi), `won` (Kazanıldı), `lost` (Kapandı) | |
| `company_name`, `contact_name`, `email`, `phone`, `city` | text | zorunlu | Firma ziyaretçi ve kurumsal üyede zorunlu, bireysel üyede boş olabilir |
| `tax_number` | text | | |
| `payment_preference` | text | zorunlu; `vadeli` (Vadeli), `cek` (Çek), `havale` (Havale/EFT), `belirsiz` (Görüşülecek) | |
| `term_days` | int | | Vadeli ödemede gün: 30, 45, 60, 90 ya da 120 |
| `message` | text | | Müşteri notu |
| `assigned_to` | text | | Panelde atanan satış temsilcisi (serbest metin) |
| `admin_note` | text | | İç not |
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
| `sku`, `variant_label` | text | | Kopya: teklif anındaki kod (seçenekli üründe seçeneğin kodu) ve seçenek yazısı (ör. "Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m") |
| `quantity` | int | zorunlu; ≥ 1 | |
| `note` | text | | Kullanılmıyor |

Anahtar: (`quote_id`, `line`).

---

## 7. Siparişler, iadeler ve kuponlar

Siparişi yalnızca üye verir (K-21). Durum akışı ve tutar hesapları:
[IS-KURALLARI.md › 7](IS-KURALLARI.md#7-sipariş-durumları).

### `orders` — siparişler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `SIP-<yıl>-<5 hane>` |
| `user_id` | text | → `users` (boşalır) | Siparişi veren üye; üye silinse de sipariş kalır |
| `status` | text | zorunlu; `awaiting_payment` (Ödeme Bekleniyor), `preparing` (Hazırlanıyor), `shipped` (Kargoda), `delivered` (Teslim Edildi), `cancelled` (İptal) | |
| `customer_name`, `email`, `phone` | text | zorunlu | Sipariş anındaki kopya |
| `shipping_address` | jsonb | zorunlu | Kopya: `{ fullName, phone, city, district, line }` |
| `invoice` | jsonb | zorunlu | Kopya: `type` `individual` (bireysel: `fullName`, `tcKimlikNo` 11 hane) ya da `corporate` (kurumsal: `companyName`, `taxOffice`, `taxNumber` 10 hane); `address` (teslimat adresiyle aynı biçim) |
| `subtotal` | numeric(12,2) | zorunlu | Ürünler toplamı (KDV dahil, kupon öncesi) |
| `vat` | numeric(12,2) | zorunlu | Ürünlere ödenen tutarın (ürünler toplamı − kupon) içindeki KDV (bilgi; kuruşlu) |
| `shipping` | numeric(12,2) | zorunlu | Kargo (KDV dahil); ücretsizse 0 |
| `installment_fee` | numeric(12,2) | zorunlu | Taksitli ödemede vade farkı |
| `coupon_code` | text | (yeni) | Kopya: kullanılan kupon (koddaki `coupon: { couponId, code, discount }`) |
| `coupon_discount` | numeric(12,2) | zorunlu (yeni) | Kupon indirimi (KDV dahil); kupon yoksa 0 |
| `total` | numeric(12,2) | zorunlu | Müşterinin ödediği toplam: `subtotal − kupon + shipping + installmentFee` |
| `payment_method` | text | zorunlu; `card` (kart), `transfer` (havale/EFT) | |
| `installments` | int | | Kartta taksit sayısı (1 = tek çekim) |
| `card_brand`, `card_program` | text | | "Visa", "Mastercard", "Troy"; Bonus, World… |
| `card_last4` | text | 4 rakam | Kart numarası hiç saklanmaz |
| `pos_id` | text | → `payment_pos` (boşalır) | Çekimin yapıldığı POS |
| `pos_name` | text | | Kopya |
| `commission_percent` | numeric(5,2) | | Kopya: sipariş anında bankanın kestiği oran |
| `paid_at` | timestamptz | | Ödemenin alındığı an |
| `due_at` | timestamptz | | Havalede son ödeme anı; geçerse sipariş iptal |
| `customer_note`, `admin_note` | text | | Müşterinin notu; iç not (yalnızca panelde) |
| `terms_accepted_at` | timestamptz | zorunlu | Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onayı |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Koddaki `payment` nesnesi (`method`, `installments`, `cardBrand`,
`cardProgram`, `cardLast4`, `posId`, `posName`, `commissionPercent`,
`paidAt`, `dueAt`) bu kolonlara yazılır. Kargo bilgisi `shipments`'tadır.
Silme: panelde silinmez.

### `shipments` — kargo gönderileri (yeni)

Koddaki: `orders.shipment` (`carrier`, `trackingNumber`, `shippedAt`,
`deliveredAt?`). Siparişin gönderisi ve iadede müşterinin geri gönderisi.
Bugün siparişte en fazla bir gönderi vardır.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `order_id` | text | zorunlu; → `orders` | |
| `kind` | text | zorunlu; `outbound`, `return` | Gönderi ya da iade gönderisi |
| `return_request_id` | text | → `return_requests` (boşalır) | İade gönderisinde |
| `carrier_id` | text | → `carriers` (boşalır) | |
| `carrier_name` | text | zorunlu | Kopya |
| `tracking_number` | text | zorunlu | |
| `shipped_at` | timestamptz | zorunlu | İlk kargoya verilme; takip no düzeltilince değişmez |
| `delivered_at` | timestamptz | gönderiden önce olamaz | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

### `order_items` — sipariş satırları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `order_id` | text | → `orders` (zincir) | |
| `line` | int | zorunlu | Sıra; iade satırları buna bağlanır |
| `product_id` | text | → `products` (boşalır) | |
| `variant_id` | text | (yeni) | |
| `product_name`, `sku` | text | zorunlu | Kopya (seçenekli üründe seçeneğin kodu) |
| `variant_label` | text | | Kopya |
| `quantity` | int | zorunlu; ≥ 1 | |
| `unit_price_ex_vat` | numeric(12,2) | zorunlu | Birim fiyat, indirim uygulanmış, KDV hariç |
| `vat_rate` | numeric(5,2) | zorunlu | |
| `unit_price` | numeric(12,2) | zorunlu | Birim fiyat, KDV dahil |
| `coupon_discount` | numeric(12,2) | zorunlu; ≥ 0; varsayılan 0 | Kupon indiriminin bu satıra düşen payı (satırın tamamı, KDV dahil, kuruşlu); iadede ödenecek tutar bundan bulunur (yeni) |

Anahtar: (`order_id`, `line`).

### `order_status_history` — sipariş zaman çizelgesi

Koddaki: `orders.history` (her durum değişikliği: `{ status, at, note? }`).

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

Kartla ödemenin sağlayıcıdan dönen sonucu (KARARLAR K-108). Veritabanı
modunda her kartlı siparişte ödeme sağlayıcısının sonucu buraya yazılır
(`packages/db/src/payment.ts`, `orders.ts` › `placeOrder`): `kind` `sale`,
`status` `success`, `provider_ref` sağlayıcının işlem numarası, `raw`
`{ saglayici }`. Bugünkü sağlayıcı temsilidir (`provider_ref`
`TEMSILI-<sipariş kimliği>`; para çekilmez, K-97). İade ve iptal
(`refund`, `cancel`) ödeme kuruluşu bağlanınca yazılır.

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

Üyenin (bireysel ya da kurumsal) teslim edilen siparişi için açtığı iade (cayma) talebi
(kurallar: [IS-KURALLARI.md › 7](IS-KURALLARI.md#7-sipariş-durumları)).

`return_requests`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `IAD-<yıl>-<4 hane>` |
| `order_id` | text | zorunlu; → `orders` | |
| `order_code` | text | zorunlu | Kopya |
| `user_id` | text | → `users` (boşalır) | Talebi açan üye |
| `customer_name`, `email`, `phone` | text | zorunlu | Siparişteki müşteri bilgilerinin kopyası |
| `reason` | text | zorunlu; `changed_mind` (Vazgeçtim), `defective` (Kusurlu ürün), `wrong_item` (Yanlış ürün gönderildi), `other` (Diğer) | |
| `note` | text | | Müşterinin açıklaması |
| `status` | text | zorunlu; `new` (Yeni), `reviewing` (İnceleniyor), `approved` (Onaylandı), `rejected` (Reddedildi) | |
| `admin_note` | text | | Yalnızca panelde |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

`return_request_items` (koddaki: `items` › `{ line, productId, productName,
sku, variantLabel?, quantity }`):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `return_request_id` | text | → `return_requests` (zincir) | |
| `order_line` | int | zorunlu | Siparişin satır sırası (`line`, 0'dan) |
| `product_id` | text | → `products` (boşalır) | |
| `product_name`, `sku` | text | zorunlu | Kopya (sipariş anındaki) |
| `variant_label` | text | | Kopya |
| `quantity` | int | zorunlu; ≥ 1 | |

Anahtar: (`return_request_id`, `order_line`). Silme: panelde silinmez.

### `coupons`, `coupon_targets`, `coupon_customers`, `coupon_redemptions` — kuponlar (yeni)

Müşterinin sepette yazdığı indirim kodu (sahibinin isteği 2026-11-02,
KARARLAR K-85). Sitede sepette ve panelde Satış › Kuponlar'da; tarayıcıdaki
veride `coupons`, `couponRedemptions`. Kurallar:
[IS-KURALLARI.md › 21](IS-KURALLARI.md#21-kuponlar). Kuponun `productIds`
ve `categoryIds` listeleri `coupon_targets`, kişiye özel kuponun
`customerEmails` listesi `coupon_customers` satırlarına yazılır.

`coupons`:

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz (büyük/küçük harf duyarsız) | Müşterinin yazdığı kod: büyük harf; harf, rakam, tire (3–30) |
| `name` | text | | Panelde tanımak için ad ya da not |
| `discount_type` | text | zorunlu; `percent`, `amount` | Yüzde ya da sabit TL |
| `discount_value` | numeric(12,2) | zorunlu; > 0; yüzdede en fazla 100 | Yüzde (1–100) ya da TL (KDV dahil); tam sayı |
| `min_cart_total` | numeric(12,2) | | En az sepet tutarı (ürünlerin KDV dahil toplamı) |
| `starts_at`, `ends_at` | timestamptz | bitiş başlangıçtan sonra | Boşsa hemen geçerli / süresiz |
| `total_usage_limit` | int | ≥ 1 | Toplam kullanım sınırı; boşsa sınırsız |
| `per_user_limit` | int | ≥ 1 | Kişi başı kullanım sınırı; boşsa sınırsız |
| `scope` | text | zorunlu; `all`, `targets` | Bütün ürünler ya da yalnızca `coupon_targets` |
| `audience` | text | zorunlu; `all`, `customers`; varsayılan `all` | Herkes ya da yalnızca `coupon_customers`'taki e-postalar (kişiye özel, K-86) (yeni) |
| `active` | boolean | zorunlu | Pasif kupon sepette kabul edilmez |
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
| `email` | text | zorunlu; kuponda bir kez (büyük/küçük harf duyarsız) | Küçük harf. Üyeye değil e-postaya bağlıdır: kişi henüz üye olmasa da eklenir; o e-postayla giriş yapan üye kullanır |

E-postaya göre arama için dizin vardır (ileride Hesabım'da "Kuponlarım").

`coupon_redemptions` (kim, hangi siparişte, ne kadar indirim aldı; koddaki
`couponRedemptions`):

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `coupon_id` | text | zorunlu; → `coupons` (engeller) | Kullanılmış kupon silinmez, pasife alınır |
| `coupon_code` | text | zorunlu | Kopya |
| `user_id` | text | → `users` (boşalır) | Siparişi veren üye |
| `order_id` | text | zorunlu; benzersiz; → `orders` | Siparişte en fazla bir kupon |
| `discount_amount` | numeric(12,2) | zorunlu; > 0 | Uygulanan indirim (KDV dahil) |
| `created_at` | timestamptz | zorunlu | Sipariş anı |
| `released_at` | timestamptz | | Sipariş iptal edilince (havale süresinin dolması dahil) dolar; kullanım sınırlarında sayılmaz |

Kullanım sipariş kaydıyla aynı anda yazılır.

---

## 8. Servis talepleri, garantiler, yorumlar

### `service_requests` — servis talepleri

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `code` | text | zorunlu; benzersiz | `SRV-<yıl>-<4 hane>` |
| `status` | text | zorunlu; `new` (Yeni), `in_progress` (İşlemde), `done` (Tamamlandı) | |
| `category_id` | text | → `categories` (boşalır) | Makine türü; tarayıcıdaki veride `categorySlug` |
| `product_id` | text | → `products` (boşalır) | Model |
| `product_name` | text | zorunlu | Kopya |
| `reasons` | text[] | zorunlu; `kurulum`, `bakim`, `onarim`, `egitim` (Kullanım/Bakım Eğitimi); en az biri | |
| `complaint` | text | zorunlu | Müşteri şikayeti |
| `company_name`, `address`, `city`, `district`, `email`, `phone`, `contact_name`, `contact_gsm` | text | zorunlu | `contact_name`, `contact_gsm`: yetkili kişi |
| `user_id` | text | → `users` (boşalır) | Üye giriş yapmışsa |
| `admin_note` | text | | İç not |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Silme: panelde silinmez.

### `warranties` — garanti kayıtları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `serial_number` | text | zorunlu; benzersiz (büyük harfe çevrilerek) | Büyük harfe çevrilip kırpılarak saklanır |
| `category_id` | text | → `categories` (boşalır) | Ürün kategorisi; tarayıcıdaki veride `categorySlug` |
| `product_id` | text | → `products` (boşalır) | Model |
| `product_name` | text | (yeni) | Kopya; ürün silinse de model okunur |
| `owner_name`, `email`, `phone`, `city`, `postal_code`, `address` | text | zorunlu | E-posta küçük harfle saklanır; posta kodu 5 hane |
| `seller_tax_number` | text | zorunlu | Satan firmanın vergi no (10 hane, şahıs firmasında 11) |
| `registered_at` | timestamptz | zorunlu | Garanti bu andan başlar (satın alma tarihi sorulmaz) |
| `expires_at` | date | zorunlu | Kayıt + ürünün garanti süresi (+ istendiyse 12 ay); panelde elle değişebilir |
| `extended` | boolean | zorunlu | 12 ay uzatma |
| `updated_at` | timestamptz | zorunlu (yeni) | |

Garanti kaydında üye kimliği tutulmaz; üyeyle e-posta üzerinden eşleşir
(Hesabım › Garantilerim bu e-postayla bulur).

### `reviews` — ürün yorumları

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `product_id` | text | → `products` (boşalır) | Ürüne bağlı (seçeneğe değil); bütün seçenekler aynı yorumları görür (K-17) |
| `user_id` | text | → `users` (boşalır) | Üye yazdıysa |
| `author_name` | text | zorunlu | |
| `rating` | smallint | zorunlu; 1–5 | |
| `title` | text | | |
| `body` | text | zorunlu | |
| `media` | jsonb | zorunlu | `[{ url, kind: image|video }]` (video en fazla 2 MB); dosyalar dosya deposunda |
| `verified_purchase` | boolean | | "Doğrulanmış alıcı" rozeti. Bugün giriş yapmış her üyede işaretlenir; gerçekte üyenin o ürünü satın almasıyla eşleşmeli |
| `approved` | boolean | zorunlu | Yalnızca onaylılar yayında; yeni yorum onaysız gelir |
| `featured` | boolean | zorunlu | Anasayfa şeridi; en fazla 10, yalnızca onaylı yorumda |
| `created_at` | timestamptz | zorunlu | |
| `updated_at` | timestamptz | zorunlu (yeni) | |

---

## 9. İçerik

Haber, blog, etkinlik, SSS, Hakkımızda, yasal metin, belge, belge sayfası ve
Görünüm formlarının kuralları tarayıcı ve sunucuda ortaktır:
`packages/data/src/content-rules.ts`.

### `blog_posts`, `news`, `events` — blog, haberler, etkinlikler

Ortak kolonlar: `id` (anahtar), `slug` (zorunlu; kendi türü içinde
benzersiz), `title` (zorunlu), `active` (zorunlu), `seo` (jsonb),
`created_at` ve `updated_at` (zorunlu, yeni). Eski linkler `redirects`'te.

| Tablo | Adres | Diğer kolonlar |
|---|---|---|
| `blog_posts` | `/blog/<slug>` | `excerpt` (özet), `body` (biçimli), `cover_url`, `category` (serbest metin; ayrı bir kategori tablosu yoktur), `author` (boşsa "Zenweld") (text, zorunlu); `published_at` (timestamptz, zorunlu) |
| `news` | `/haberler/<slug>` | `summary`, `body` (biçimli), `cover_url` (text, zorunlu); `images` (jsonb, galeri adres listesi); `published_at` (timestamptz, zorunlu) |
| `events` | `/etkinlikler/<slug>` | `summary` (kart), `description` (detaylı, biçimli), `venue`, `city`, `country` (sitedeki süzgeçte kullanılır), `logo_url` (text, zorunlu); `start_date`, `end_date` (date, zorunlu; bitiş başlangıçtan önce olamaz; bitişi bugün ya da sonra olan "yaklaşan"); `images` (jsonb, galeri); `website_url` (text) |

Blog ve haberde `published_at` yalnızca sıralama ve gösterim içindir; kayıt
yayında işaretliyse hemen görünür (zamanlanmış yayın yoktur, K-42).

### `faqs` — sık sorulan sorular

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `question`, `answer` | text | zorunlu | |
| `topic` | text | zorunlu; `genel`, `garanti`, `siparis` (Sipariş & Teklif), `teknik` | |
| `position` | int | zorunlu (yeni) | Tarayıcıdaki veride listedeki sıra; sıra değişikliği `updated_at`'i değiştirmez |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `sales_reps` — satış temsilcileri

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name`, `region`, `phone`, `email` | text | zorunlu | `region`: bölge ya da görev; sitedeki bölge düğmeleri bundan oluşur. `phone`: en az 10 rakam; Ara ve WhatsApp |
| `photo_url` | text | | |
| `position` | int | zorunlu | `order` |
| `active` | boolean | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `legal_pages` — yasal metinler

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | Sabit kimlik; sayfanın adresi koddaki eşlemeden gelir |
| `title`, `body` | text | zorunlu | `body` biçimli |
| `updated_at` | timestamptz | zorunlu | |

- 11 sabit kayıt vardır; kimlik ve adres eşlemesi
  `packages/data/src/legal.ts`'tedir (ör. `kvkk` → `/yasal/kvkk`,
  `garanti-kosullari` → `/garanti/kosullar`).
- Eklenmez, silinmez; yalnızca başlık ve metin değişir.

### `about_page` — Hakkımızda (tek satır)

Koddaki: `about`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | smallint | anahtar; yalnızca 1 | |
| `hero_title`, `hero_subtitle` | text | zorunlu | |
| `hero_image` | text | | |
| `stats` | jsonb | zorunlu | Rakam kutuları `[{ id, value, label }]` (ör. "25+", "Yıllık Tecrübe") |
| `sections` | jsonb | zorunlu | Bölümler `[{ id, title, body (biçimli), imageUrl }]`, sırayla |
| `updated_at` | timestamptz | zorunlu | |

### `page_seo` — sabit sayfaların arama bilgileri

Sabit sayfaların panelden değiştirilen başlık ve açıklaması. Koddaki:
`pageSeo[<sayfa adresi>] = { title?, description?, updatedAt? }`.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `path` | text | anahtar | `/hakkimizda`, `/sss` |
| `title`, `description` | text | | |
| `updated_at` | timestamptz | zorunlu | |

Değiştirilmemiş sayfanın satırı yoktur; varsayılan metinler
`apps/zenweld-web/src/lib/page-meta.ts`'tedir.

### `document_pages` ve `documents` — belgeler

`document_pages` (üç belge sayfasının başlığı; sayfa başına bir kayıt):

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
| `product_id` | text | → `products` (boşalır) | İsteğe bağlı ürün |
| `lot_number` | text | | Yalnızca parti sertifikalarında |
| `file_name`, `mime_type` | text | zorunlu | |
| `size_bytes` | bigint | zorunlu | Bayt; en fazla 25 MB. Koddaki `size` |
| `file_key` | text | zorunlu | Dosyanın yeri. Veritabanı modunda adres: depoya yüklenen dosyada `/dosya/belge/…` (K-108; `size_bytes` depodaki boyut), dosya deposu ayarlı değilse panelde girilen adres (`https://…` ya da `/…`; KARARLAR K-104; `size_bytes` 0; dosya adı ve türü bu adresten çıkarılır). Demo modunda tarayıcının dosya deposundaki anahtar |
| `active` | boolean | zorunlu | |
| `position` | int | zorunlu (yeni) | Sitedeki sıra (tarayıcıdaki veride listedeki sıra) |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Kabul edilen uzantılar: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, zip.
Silme: dosyası da silinir (adresi girilen belgede yalnızca satır silinir).

---

## 10. Ayarlar ve ödeme

### `settings` — ayarlar

Tek bir ayar kaydının bölümleri; her bölüm bir satır.

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `key` | text | anahtar; `shop`, `stock`, `rich_text`, `company` | |
| `value` | jsonb | zorunlu | Aşağıda |
| `updated_at` | timestamptz | zorunlu | |
| `updated_by` | text | → `users` (boşalır) (yeni) | |

**`shop` — mağaza ayarları** (koddaki `settings.shop`; POS, havale
hesapları ve kargo firmaları ayrı tablolarda, aşağıda):

| Alan | Açıklama | Örnek değer |
|---|---|---|
| `freeShippingThreshold` | Bu tutar ve üzeri (KDV dahil sepet) kargo ücretsiz | 5.000 |
| `shippingFee` | Sınırın altında kargo ücreti (KDV dahil) | 250 |
| `minInstallmentAmount` | Bu tutarın altında taksit gösterilmez | 1.000 |
| `transferDueDays` | Havale ödeme süresi (gün, en az 1) | 3 |

- Kayıt kuralları tarayıcı ve sunucuda ortaktır
  (`packages/data/src/settings-rules.ts` › `parseShopSettings`): tutarlar 0
  ya da artı; `transferDueDays` tam sayı, en az 1; her listede en fazla 50
  kayıt; aynı kargo firması (büyük/küçük harf fark etmez) bir kez; IBAN
  büyük harf; takip adresi boş ya da `https://` ile başlar, `{takip}`
  içerir, boşluk içermez.
- Kargo, POS ve IBAN değerleri örnektir; canlıya çıkmadan gerçekleri
  girilmeli.

**`company` — şirket ve iletişim** (koddaki `settings.company`; Mağaza
Ayarları › Şirket ve İletişim, KARARLAR K-105; geçiş betiği
`0009_ayar-sirket-bilgileri`):

| Alan | Açıklama | Örnek değer |
|---|---|---|
| `legalName` | Ticari unvan; zorunlu | Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş. |
| `mersisNo` | MERSİS no: 16 rakam ya da boş (sözleşmede "[—]") | boş |
| `phone` | Ana telefon (alt bilgi, sözleşmeler); zorunlu | +90 212 549 61 86 |
| `email` | Sitede görünen e-posta; geçerli adres, küçük harf | info@zenweld.com |
| `offices[]` | `{ id, city, addressLines[], phones[] }`; en az bir, en fazla 10; ilki merkez (alt bilgi ve sözleşmedeki adres) | İstanbul, İzmir |
| `social` | `instagram`, `youtube`, `linkedin`, `tiktok`: `https://` adresi ya da boş (gösterilmez) | 4 hesap |

- Satır yoksa (eski veri) site başlangıç değerlerini kullanır
  (`defaultSettings.company`).
- Kurallar tarayıcı ve sunucuda ortak (`settings-rules.ts` ›
  `parseCompanySettings`): metinler kırpılır, MERSİS boşlukları atılır, boş
  adres ve telefon satırları atlanır; ofiste şehir ve en az bir adres
  satırı zorunlu, en fazla 5 satır ve 5 telefon.

**`stock` — stok ayarı** (koddaki `settings.stock`): `staleDays`: bu kadar
günden eski stok satırları sitede gösterilmez (0 = sınır yok; 0–365).
Örnek değer 3.

**`rich_text` — Görünüm** (koddaki `settings.richText`): biçimli metinlerin
görünümü: `headingSize` (14–32, 18), `headingColor` (#141619),
`headingUppercase` (evet), `accentColor` (#b82429), `accentWidth` (0–160,
40), `leadSize` (14–26, 18), `bodySize` (12–22, 15), `bodyColor`
(#3d4348), `strongColor` (#141619). Parantez içinde aralık ve başlangıç
değeri. Renkler `#RRGGBB` biçimindedir.

### `payment_pos` — banka sanal POS'ları

Koddaki: `settings.shop.pos` (örnek veride 9 POS).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `bank_short_name`, `name`, `pos_name` | text | zorunlu | Listede görünen kısa ad; banka adı; POS adı |
| `program` | text | | Kart programı: Bonus, World, Maximum, Axess, CardFinans, Paraf, Advantage, BankkartCombo. Boşsa yalnızca tek çekim |
| `merchant_no` | text | zorunlu | Bankanın verdiği üye işyeri numarası. API anahtarı ve şifre burada **yok**, yalnızca sunucuda ortam değişkeni ([SUNUCU.md](SUNUCU.md)) |
| `active` | boolean | zorunlu | |
| `is_default` | boolean | zorunlu; en fazla bir POS | Programı eşleşmeyen kartlar buradan tek çekim |
| `position` | int | zorunlu | Listedeki sıra önemlidir: aynı programda üstteki geçerli |
| `installments` | jsonb | zorunlu | Müşteriye sunulan taksitler `[{ count (2, 3, 6, 9, 12), ratePercent (vade farkı), enabled }]` |
| `commissions` | jsonb | zorunlu | Bankanın kestiği oranlar `[{ count (1 = tek çekim, 2…12), ratePercent }]` |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) | |

### `carriers` — kargo firmaları (yeni)

Koddaki: `settings.shop.carriers` (`{ name, trackingUrl? }`; en az biri;
örnek veride Yurtiçi, Aras, MNG, PTT, Sürat, UPS, takip adresleri boş).
Panelde Mağaza Ayarları › Kargo ve Ödeme'den girilir (K-105).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | text | anahtar | |
| `name` | text | zorunlu; benzersiz | |
| `tracking_url` | text | | Takip sayfasının adresi; `{takip}` yerine takip numarası yazılır. Boşsa bağlantı verilmez |
| `active` | boolean | zorunlu | |
| `position` | int | zorunlu | |
| `created_at`, `updated_at` | timestamptz | zorunlu | |

Gönderinin takip bağlantısı (`packages/data/src/shipping.ts` ›
`trackingLink`): gönderideki firma adıyla listedeki firma bulunur
(büyük/küçük harf fark etmez), `{takip}` yerine boşlukları atılmış takip
numarası yazılır. Firmanın API'si ileride bağlanırsa bağlantı bilgisi bu
kayda eklenir; anahtar ve şifre yalnızca sunucuda ortam değişkeni olur.

### `bank_accounts` — havale hesapları

Koddaki: `settings.shop.bankAccounts` (`{ id, bankName, accountHolder,
iban }`; örnek veride 2 hesap).

| Kolon | Tür | Kural |
|---|---|---|
| `id` | text | anahtar |
| `bank_name`, `account_holder`, `iban` | text | zorunlu |
| `position` | int | zorunlu (yeni) |
| `created_at`, `updated_at` | timestamptz | zorunlu (yeni) |

Panelde banka adı ve IBAN zorunludur; hesap sahibi boş kalabilir (boş metin).

---

## 11. Formlar, e-postalar, kayıt numaraları ve değişiklik kaydı

### E-posta formlarının kayıtları (yeni)

Sahibinin kararı (K-81): iletişim formu, ürün destek sorusu, bayilik
başvurusu ve Welders Club katılımı e-postayla birlikte kayıt olarak da
saklanır.

- **Veritabanı modunda** kayıt bu tablolara yazılır; e-posta gitmese de
  kayıt alınır, gidip gitmediği `email_log`'dadır
  ([SUNUCU.md › Formlar](SUNUCU.md#formlar)).
- **Demo modunda** kayıt, e-posta gidince tarayıcıdaki verinin isteğe bağlı
  listelerine yazılır (`dealerApplications`, `supportMessages`,
  `weldersClub`; K-109) ve yalnızca formu gönderen tarayıcıda görünür.
  Alanlar tablolarla aynıdır.
- Panelde Bayilik Başvuruları, Mesajlar ve Welders Club ekranlarında
  görünür; kayıtlar panelden silinmez (K-100). Panelin kullandığı kayıt
  türleri `packages/db/src/admin-requests.ts`'tedir
  (`DealerApplicationRecord`, `SupportMessageRecord`, `WeldersClubRecord`).
- Bülten kaydı bunlara girmez; bülten servisi kararını bekliyor
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Bülten ve İYS).

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

Sahibinin kararı (K-81, K-104): Zenweld'e giden e-postaların alıcıları
e-posta türü başına tutulur; başlangıçta hepsi info@zenweld.com'dur.
Panelde Mağaza Ayarları › E-posta Alıcıları sekmesinden değişir (panel 5.1).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `type` | text | anahtar | E-posta türü (aşağıda; koddaki `EMAIL_RECIPIENT_TYPES`) |
| `recipients` | text[] | zorunlu; en az bir geçerli adres | Alıcı adresleri: 1–10 geçerli adres, küçük harf, tekrarsız |
| `updated_at` | timestamptz | zorunlu | |
| `updated_by` | text | → `users` (boşalır) | |

- Bir türün satırı yoksa e-posta sunucudaki varsayılan adrese
  (`SUPPORT_EMAIL`, yoksa info@zenweld.com) gider. Alıcısı boşaltılan
  türün satırı silinir.
- Demo modunda liste tarayıcıda (`emailRecipients[]`) saklanır ama
  e-postaları sunucu gönderdiği için kullanılmaz; e-postalar varsayılan
  adrese gider. Eski tarayıcı kayıtlarında liste yoktur.

**E-posta türleri** (Zenweld'e giden e-postalar;
[IS-KURALLARI.md › 18](IS-KURALLARI.md#18-form-e-postaları)):

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
sayfası için gönderildiği tutulur. Panelde Ayarlar › E-posta Kaydı'nda
listelenir; demo modunda kayıt tutulmaz (K-109).

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

Koddaki: `recordCounters` (ön ek → sayı, ör. `"TKL-2026-": 49`).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `prefix` | text | anahtar | `TKL-2026-` |
| `last_number` | int | zorunlu | Son verilen numara |

**Numara biçimleri** (yıl Türkiye saatine göre):

| Kayıt | Biçim | Örnek |
|---|---|---|
| Sipariş | `SIP-<yıl>-<5 hane>` | SIP-2026-00003 |
| Teklif | `TKL-<yıl>-<4 hane>` | TKL-2026-0004 |
| Servis talebi | `SRV-<yıl>-<4 hane>` | SRV-2026-0034 |
| İade talebi | `IAD-<yıl>-<4 hane>` | IAD-2026-0001 |

- Numara o yıl şimdiye kadar verilmiş en büyük numaranın bir fazlasıdır;
  her yıl 1'den başlar.
- Silinen kaydın numarası yeniden verilmez, en son kayıt silinse de
  (K-64; [IS-KURALLARI.md › 17](IS-KURALLARI.md#17-kayıt-numaraları)).
- Numara kayıt anında, tek bir işlemde artırılıp okunur; aynı anda gelen
  iki kayıt aynı numarayı alamaz.
- Sipariş ve iade talebi numarasını veren sunucu sayaç yoksa ya
  da tablodaki en büyük numaranın gerisindeyse o numaradan devam eder
  (örnek veriyle yüklenen siparişlerde sayaç boştur).

### `audit_log` — panel değişiklik kaydı (yeni)

Sahibinin kararı (K-81): panelde yapılan her değişiklik kaydedilir. Panelde
Ayarlar › İşlem Kaydı'nda listelenir; demo modunda kayıt tutulmaz (K-109).

| Kolon | Tür | Kural | Açıklama |
|---|---|---|---|
| `id` | bigint | anahtar; sırayla artar | |
| `at` | timestamptz | zorunlu | |
| `actor_user_id` | text | bağlantısız | İşlemi yapan yönetici; kayıt değiştirilemediği için yönetici silinse de kimlik kalır |
| `actor_name` | text | zorunlu | Kopya; yönetici silinse de okunur |
| `action` | text | zorunlu; `create`, `update`, `delete`, `login`, `logout` | Panele giriş ve çıkışlar da yazılır |
| `entity_type` | text | zorunlu | Tablo adı (`products`, `orders`…); giriş/çıkışta `users`; panelden dosya yüklemede `files` (`entity_id` depodaki anahtar, `entity_label` dosyanın yüklenirkenki adı) |
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
| Zenweld depo stoğu ve sipariş aktarımı (SAP) | `warehouse_stock`, `sap_sync_runs`, `sap_order_exports` | 3 |
| Üyeler | `users`, `addresses`, `sessions`, `password_reset_tokens`, `favourites` | 5 |
| Teklif | `quotes`, `quote_items` | 2 |
| Sipariş, kargo ve iade | `orders`, `order_items`, `order_status_history`, `payment_transactions`, `shipments`, `return_requests`, `return_request_items` | 7 |
| Kuponlar | `coupons`, `coupon_targets`, `coupon_customers`, `coupon_redemptions` | 4 |
| Servis, garanti, yorum | `service_requests`, `warranties`, `reviews` | 3 |
| İçerik | `blog_posts`, `news`, `events`, `faqs`, `sales_reps`, `legal_pages`, `about_page`, `page_seo`, `document_pages`, `documents` | 10 |
| Ayarlar, ödeme ve kargo | `settings`, `payment_pos`, `bank_accounts`, `carriers` | 4 |
| Formlar | `dealer_applications`, `support_messages`, `welders_club_signups` | 3 |
| Sistem | `email_recipients`, `email_log`, `record_counters`, `audit_log` | 4 |
| **Toplam** | | **65** |

---

## 13. Açık sorular

1. **Kişisel verilerin saklama süresi (KVKK):** Sipariş faturasındaki T.C.
   kimlik no, form kayıtları, gönderilen e-postaların kaydı ve silinen
   üyenin geçmiş kayıtları ne kadar tutulacak? Sahibi avukata soracak
   ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Hesap silme). Cevaba göre bu
   dosyaya saklama süreleri ve kendiliğinden silme eklenir.
2. **SAP stok görünümü (SAP ekibi):** Adı `AVAILABLE_STOCK` olacak
   (kesinleşmedi), 15 dakikada bir okunacak (K-84). Kolonları (kalem kodu,
   kullanılabilir miktar, kalem adı) ve sunucunun bağlanma yolu (SAP
   Business One Service Layer ya da veritabanına salt okunur kullanıcı)
   bekleniyor. Cevaba göre `warehouse_stock`'a kolon eklenebilir.
3. **Site siparişlerinin SAP'a aktarılması:** Aktarım sırası
   (`sap_order_exports`) ve SAP belge numarası kolonu hazır (K-84, K-108).
   SAP'ın sipariş API'sinin (ör. `SALES_ORDER`) bilgileri gelince siparişi
   SAP'a yazan parça eklenir; gerekirse siparişe yeni kolonlar eklenir.

---

## 14. İlişkiler

Koddaki alan adlarıyla; tablodaki bağlar her tablonun "Kural" sütununda
yazar.

| Kayıt | Bağlı olduğu | Alan | Not |
|---|---|---|---|
| Kategori | Grup | `section` + `group` (grubun linki) | Tabloda grup kimliğiyle (`group_id`) |
| Kategori | Seçenek tanımları | `optionIds[]` | Çoka çok; yalnızca "listelensin" bağı |
| Kategori | Filtreler | `filters[]` | Filtreler kategorinin içindedir (kategoriye özel, ortak değil) |
| Ürün | Kategori | `categorySlug` (+ `section`) | Tabloda kategori kimliğiyle (`category_id`); bölüm kategoriden gelir |
| Ürün | Seçenek tanımları | `options.optionIds[]` | Ürün başına en fazla 3 tanım, sayfadaki sırasıyla |
| Varyant (kombinasyon) | Seçenek değerleri | `options.variants[].values` | Ürünün her seçeneğinden bir değer; değer o tanımdan olmalı |
| Ürün | Kategorisinin filtre değerleri | `filterValues` | Filtre başına bir ya da birden çok değer; yalnızca kendi kategorisinin filtreleri |
| Bayi | Online satıcı | `retailerId` | Bire bir: bir mağaza en fazla bir bayiye bağlı |
| Bayi stok satırı | Bayi, ürün, varyant | `dealerId`, `productId`, `variantId` | [Stok tabloları](#stok-tabloları--dealer_stock-retailer_stock-stock_imports-sku_aliases) |
| Satıcı stok satırı | Satıcı, ürün, varyant | `retailerId`, `productId`, `variantId` | |
| Stok işlemi | Bayi ya da satıcı | `sourceType` + `sourceId` | |
| Kod eşleştirmesi | Bayi/satıcı, ürün, varyant | `sourceId`, `productId`, `variantId` | |
| Depo stoğu | Ürün ya da varyant | `sapItemCode` | Kimlikle değil SAP koduyla eşleşir |
| Adres | Üye | `userId` | |
| Teklif | Üye (isteğe bağlı) | `userId` | Ziyaretçi de teklif ister |
| Teklif satırı | Ürün | `productId` | Ad, kod ve seçenek kopya |
| Sipariş | Üye (zorunlu) | `userId` | Sipariş yalnızca üyeden |
| İade talebi | Sipariş, üye | `orderId`, `userId` | Satırları siparişin satırlarına sırayla (`line`) bağlı |
| Sipariş satırı | Ürün | `productId` | Ad, kod, seçenek ve fiyat kopya |
| Sipariş | Kupon (isteğe bağlı) | `coupon.couponId` | Kod ve indirim kopya |
| Kupon | Ürünler, kategoriler | `productIds[]`, `categoryIds[]` | Kapsam "seçilenler" ise; kategori kimlikle bağlı |
| Kişiye özel kupon | Üye (e-postayla) | `customerEmails[]` | Kimlikle değil e-postayla eşleşir; kişi henüz üye olmayabilir |
| Kupon kullanımı | Kupon, sipariş, üye | `couponId`, `orderId`, `userId` | Siparişte en fazla bir |
| Servis talebi | Kategori, ürün, üye (isteğe bağlı) | `categorySlug`, `productId`, `userId` | Tabloda kategori kimliğiyle |
| Garanti kaydı | Kategori, ürün | `categorySlug`, `productId` | Tabloda kategori kimliğiyle. Üyeye e-postayla eşleşir (kimlikle değil) |
| Yorum | Ürün, üye (isteğe bağlı) | `productId`, `userId` | Seçenekten bağımsız; bütün seçenekler aynı yorumları görür |
| Belge | Ürün (isteğe bağlı) | `productId` | |
| Form kayıtları | Üye, ürün, bayi (isteğe bağlı) | `userId`, `productId`, `dealerId` | Başvurudan bayi açılınca `dealerId` |

---

## 15. Benzersiz alanlar

| Ne | Kapsam | Not |
|---|---|---|
| Ürün kodu ve varyant kodları | Tek havuz | Ürün kodu, başka ürünün kodu ya da herhangi bir varyantın koduyla aynı olamaz. Boşluksuz ve büyük harfe çevrilerek karşılaştırılır. Veritabanında `sku_codes` ve tetikleyiciyle |
| Ürün linki | Ürünler | |
| Kategori linki | Bütün site | |
| Grup linki | Bölüm içinde | |
| Blog, haber, etkinlik linki | Kendi türü içinde | |
| Seçenek tanımı adı | Tanımlar | Türkçe büyük/küçük harf duyarsız |
| Seçenek değeri adı | Tanım içinde | Türkçe büyük/küçük harf duyarsız |
| Filtre adı / filtre değeri adı | Kategori içinde / filtre içinde | Türkçe büyük/küçük harf duyarsız |
| Ürünün varyantı | Ürün + kombinasyon | Bir kombinasyon bir üründe bir kez |
| Üye e-postası | Üyeler | Büyük/küçük harf duyarsız |
| Garanti seri numarası | Garantiler | Büyük harfe çevrilerek |
| Bayinin online mağazası | Bayiler | Bir mağaza en fazla bir bayiye |
| Stok satırı | Kaynak + ürün + varyant | |
| Kod eşleştirmesi | Kaynak + kod | |
| Kupon kodu | Kuponlar | Büyük harfe çevrilerek |
| Siparişin kupon kullanımı | Siparişler | Siparişte en fazla bir kupon |
| Sipariş, teklif, servis, iade numarası | Kendi türü içinde | |
| Varsayılan POS | POS'lar | En fazla bir |
| Varsayılan adres | Üyenin adresleri | Tam olarak bir (adresi varsa) |

Demo modunda bu kuralları panel ve site denetler; veritabanında ayrıca
tabloların benzersiz dizinleri ve kurallarıyla sağlanır (her tablonun
"Kural" sütunu).

---

## 16. Silme kuralları

| Silinen | Engel | Birlikte silinen / değişen |
|---|---|---|
| Ürün | — | Bayi ve satıcı stok satırları, kod eşleştirmeleri, varyantlar, favoriler, yönlendirmeler, kuponların kapsamındaki ürün. Belgelerdeki ürün bağı kalkar (belge kalır). Sipariş, teklif, iade, garanti, servis ve yorum kayıtları kalır (bağ boşalır) |
| Ürünün bir varyantı (kombinasyonu) | — | O varyantın stok satırları ve kod eşleştirmeleri; eski ürün linki yönlendirmesi. Ürünün seçenek listesi (tanımları) değişirse bütün varyantlı stok satırları |
| Kategori | İçinde ürün varsa silinmez | Kuponların kapsamındaki kategori |
| Kupon | Siparişte kullanıldıysa silinmez (pasife alınır) | — |
| Kategori filtresi ya da filtre değeri | — (kaç üründe işaretli olduğu söylenip onay istenir) | Kategorinin ürünlerindeki o filtre ya da değer |
| Grup | İçinde kategori varsa silinmez | — |
| Seçenek tanımı | Bir üründe kullanılıyorsa silinmez | Kategorilerdeki bağı |
| Seçenek değeri | Bir üründe kullanılıyorsa silinmez | — |
| Bayi | — | Stok satırları, stok işlemleri, kod eşleştirmeleri |
| Online satıcı | — | Stok satırları, stok işlemleri, kod eşleştirmeleri; bağlı bayinin `retailer_id`'si boşalır |
| Üye (panelden ya da üyenin kendisi Hesabım'dan) | Son aktif yönetici silinemez; panelde yönetici satırı silinemez | Kayıtlı adresleri, oturumları ve favorileri. Siparişleri, teklifleri, servis talepleri, iade talepleri, garanti kayıtları ve yorumları kalır (geçmiş kayıt; bağ boşalır) |
| Teklif | — | Satırları; numarası boşta kalır (yeniden verilmez) |
| Garanti, yorum, SSS, temsilci, haber, blog, etkinlik | — | Blog, haber ve etkinliğin yönlendirmeleri |
| Belge | — | Dosyası (adresi girilen belgede yalnızca kayıt) |
| Yasal metin | Silinemez | — |
| Sipariş, servis talebi, iade talebi | Panelde silinmez | — |
| Bayilik başvurusu, mesaj, Welders Club katılımı | Panelde silinmez (K-100) | — |
| İşlem kaydı (`audit_log`) | Elle silinmez | 2 yıldan eskisi her gün kendiliğinden silinir |

---

## 17. Tarayıcıda tutulanlar

| Anahtar | Yer | İçerik | Veritabanı modunda |
|---|---|---|---|
| `zenweld.db.v1` | localStorage | Bütün veri (`ZenweldDatabase`, `version` alanıyla) | Yazılmaz; demodan kalan silinir |
| `zenweld.session.v1` | localStorage | Site oturumu: üyenin kimliği | Sunucu oturumu (`sessions`, çerez) |
| `zenweld.admin.session.v1` | localStorage | Panel oturumu: yöneticinin kimliği | Sunucu oturumu (`sessions`, çerez) |
| `zenweld.cart.v1` | localStorage | Sepet: `[{ productId, variantId?, quantity }]` (eski `selection` biçimli satırlar tek seçenekte okunur) | Tarayıcıda kalır; fiyat her açılışta üründen hesaplanır |
| `zenweld.cart.coupon.v1` | localStorage | Sepete uygulanan kupon kodu (büyük harf); sipariş verilince silinir | Tarayıcıda kalır; indirim sunucuda yeniden hesaplanır |
| `zenweld.quotelist.v1` | localStorage | Teklif listesi: `[{ productId, variantId?, productName, quantity }]` | Tarayıcıda kalır |
| `zenweld.favourites.v1` | localStorage | Favori ürün kimlikleri (giriş yapmamış ziyaretçi ve demo modu) | Giriş yapmış üyenin favorileri `favourites` tablosunda; girişte bu liste hesaba eklenir ve boşaltılır (K-96) |
| `zenweld.cookie-consent.v1` | localStorage | Çerez tercihi: `{ choice: "all" | "necessary", at }` | Tarayıcıda kalır |
| `zw_panel_aralik` | çerez (`/yonetim`) | Panel ana sayfasındaki dönem seçimi (`today`, `7`, `30`, `90`) | Sunucu da okur: özet sunucuda hesaplanır |
| `zenweld.welcome.seen` | sessionStorage | Karşılama penceresi bu oturumda gösterildi | Tarayıcıda kalır |
| `zenweld.files.v1` | IndexedDB (`files`) | Belgelerin dosyaları (demo modu) | Dosya deposu |

- Sepet ve teklif listesindeki ürün yayından kalkarsa ya da seçeneği artık
  yoksa o satır gösterilmez.
- Sepette fiyat saklanmaz; her açılışta ürünün güncel fiyatından hesaplanır.

---

## 18. Örnek veri ve veri sürümü

**Veri sürümü (`DB_VERSION`, yalnızca demo modu):**

- `packages/data/src/index.ts`'tedir (bugün 76).
- Tarayıcıdaki kaydın `version` alanı bu sayıyla tutmazsa veri silinir ve
  örnek veriyle yeniden kurulur.
- Örnek veri ya da kayıtların şekli her değiştiğinde artırılır. **Dikkat:**
  Artırınca demo tarayıcılarındaki panel değişiklikleri kaybolur.
- Veritabanı modunda veri sürümü kullanılmaz; tablo değişiklikleri geçiş
  betikleriyle yapılır, veri silinmez ([SUNUCU.md](SUNUCU.md) › Geçiş
  betikleri).
- Aynı örnek veri `npm run db:seed` ile bilgisayardaki PostgreSQL'e de
  yüklenir; canlıya ve denemeye `npm run db:yukle` ne yüklendiğini seçer
  (K-91; [SUNUCU.md › Veri yükleme](SUNUCU.md#veri-yükleme)).

**Örnek veri** (`packages/data/src/seed/`):

| Kayıt | Sayı | Not |
|---|---|---|
| Ürün | 40 | Hepsi Ekipmanlar'da (sahibinin listeleri; fiyat temsili, Force serisi dışında içerik örnek, KARARLAR K-73, K-75). Güvenlik, Aksesuarlar ve Dolgu Metalleri'ndeki 48 örnek ürün sahibinin isteğiyle silindi; bu bölümlerin kategorileri boş (KARARLAR K-78). 17'si seçenekli (makineler). Ekipmanların 21'inde sahibinin fotoğrafı var, Force serisinin 9'unda geçici ortak fotoğraf; soğutmalı makinede her kombinasyon kendi soğutma halinin fotoğrafını gösterir (K-77) |
| Grup / kategori | 12 / 50 | Aksesuarlar'daki Lazer Aksesuarları grubunun 5 kategorisinde henüz ürün yok (KARARLAR K-05 eki). Ekipmanların 8 alt kategorisinde filtre var (KARARLAR K-76); ürünlere yalnızca Model Serisi eşli |
| Seçenek tanımı | 4 | Soğutma, Torç Uzunluğu, Ara Paket Uzunluğu (temsili), Tepe Güç |
| Bayi / online satıcı | 29 / 9 | |
| Stok satırı (bayi / satıcı) | ~2.750 / ~415 | Veri ilk kurulduğunda o günün tarihiyle üretilir |
| Zenweld depo stoğu (SAP kalemi) | 50 | 3'ü stoksuz ([4](#warehouse_stock-ve-sap_sync_runs--zenweld-depo-stoğu-sap-yeni)) |
| Üye | 69 | 1 yönetici, 46 bireysel, 22 kurumsal |
| Sipariş / teklif | 133 / 48 | |
| Servis talebi / garanti | 34 / 54 | |
| İade talebi | 0 | Hesabım'dan açılır |
| Kupon / kupon kullanımı | 4 / 0 | HOSGELDIN5 (%5, bütün ürünler, kişi başı 1), LAZER25000 (25.000 ₺, Lazer Kaynak Makineleri, en az 500.000 ₺, 20 kullanım, 60 gün), YAZ10 (%10, süresi dolmuş), OZEL15 (%15, kişiye özel: bir örnek kurumsal üyenin ve henüz üye olmayan bir kişinin e-postası, kişi başı 1, 30 gün); tarihler kurulum anına göre |
| Yorum | 11 | 10'u onaylı, 1'i onay bekliyor; hepsi ekipmanlarda |
| Blog / haber / etkinlik | 6 / 2 / 8 | |
| SSS / temsilci / yasal metin | 8 / 11 / 11 | |
| Belge | 0 | Panelden yüklenir |
| Mağaza ayarları | — | 9 POS, 2 havale hesabı, 6 kargo firması; kargo ücretsiz sınırı 5.000 ₺, kargo 250 ₺, stok geçerlilik süresi 3 gün |

- Son 90 güne yayılmış örnek üye, sipariş, teklif, servis talebi ve garanti
  kayıtları `sample-activity.seed.ts`'ten gelir (panel grafikleri için);
  canlıya ve denemeye yüklenmez (`db:yukle`, K-91).
- Mağaza ayarları (kargo, POS, IBAN), bayiler, satıcılar, yasal metinler ve
  örnek blog yazıları örnektir; gerçekleriyle değiştirilmelidir.
- Demo hesaplarının giriş bilgileri yalnızca [README](../README.md)'dedir.

---

## 19. Kullanılmayan alanlar

Kayıtta ve tabloda bulunan ama bugün sitede de panelde de kullanılmayan
alanlar.

**Karar (2026-10-22, KARARLAR K-60):** Bu alanlar ileride kullanılmak üzere
bırakıldı; silinmez.

| Alan | Durum |
|---|---|
| `categories.code`, `category_groups.code` | Örnek veride kategori tablosundaki numara ("1.2.3"); ekranda yok |
| `categories.icon` | Hiçbir kayıtta dolu değil |
| `dealers.email` | Örnek veride dolu; sitede gösterilmiyor, panelde girilemiyor |
| `retailers.logo_url` | Logo yerine `logo_text` kullanılıyor |
| `quote_items.note` | Satır notu; ekranda yok |
| `products.processes` | Kullanılıyor (Ürün Seçici, arama) ama panelde girilemiyor; bkz. [WEBSITE-KULLANIM.md › Bilinen durumlar](WEBSITE-KULLANIM.md#25-bilinen-durumlar) |
