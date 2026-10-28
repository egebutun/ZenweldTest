# Veri Modeli — Kayıtlar, Alanlar ve İlişkiler

Bu dosya sitenin ve panelin sakladığı bütün kayıtları anlatır: hangi kayıt
türleri var, her birinin alanları, aralarındaki bağlar, hangi alanların
benzersiz olduğu ve bir kayıt silinince ne olduğu. Backend kurulurken
tabloların bu dosyaya göre açılması amaçlanır.

İlgili dosyalar:

- Kayıtların ekranlarda nasıl girildiği: [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md),
  [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md)
- Fiyat, KDV, kampanya, taksit, sipariş ve garanti hesapları:
  [IS-KURALLARI.md](IS-KURALLARI.md)
- Stok tablolarının SQL'i ve stok dosyası: [STOK.md](STOK.md)
- Backend'e geçişte yapılacaklar: [YAPILACAKLAR.md](YAPILACAKLAR.md)

**Bugün nasıl saklanıyor (Demo notu):** Bütün veri tek bir JSON nesnesi
olarak tarayıcının yerel deposunda durur (`zenweld.db.v1`). Bu nesnenin şekli
`packages/data/src/types.ts` içindeki `ZenweldDatabase` tipidir; her dizisi
bir tabloya karşılık gelir. Alan adları aşağıda koddaki gibi yazılmıştır
(`categorySlug`); tablo adları için önerilen ad parantez içindedir
(`products`).

---

## İçindekiler

1. [Genel kurallar](#1-genel-kurallar)
2. [İlişkiler](#2-ilişkiler)
3. [Katalog](#3-katalog)
4. [Bayiler, online satıcılar ve stok](#4-bayiler-online-satıcılar-ve-stok)
5. [Üyeler ve adresler](#5-üyeler-ve-adresler)
6. [Teklifler](#6-teklifler)
7. [Siparişler](#7-siparişler)
8. [Servis talepleri ve garantiler](#8-servis-talepleri-ve-garantiler)
9. [Ürün yorumları](#9-ürün-yorumları)
10. [İçerik](#10-içerik)
11. [Ayarlar](#11-ayarlar)
12. [Kayıt numaraları ve benzersiz alanlar](#12-kayıt-numaraları-ve-benzersiz-alanlar)
13. [Silme kuralları](#13-silme-kuralları)
14. [Tarayıcıda tutulanlar](#14-tarayıcıda-tutulanlar)
15. [Örnek veri ve veri sürümü](#15-örnek-veri-ve-veri-sürümü)
16. [Kullanılmayan alanlar](#16-kullanılmayan-alanlar)

---

## 1. Genel kurallar

**Kimlik (id):**

- Her kaydın metin bir kimliği vardır.
- Panelde ya da sitede yeni oluşan kayıtta kimlik `<önek>-<zaman><rastgele>`
  biçimindedir (ör. `p-mvjccq8u1zic2`). Önekler: ürün `p`, kategori `c`, grup
  `g`, seçenek tanımı `opt`, haber `n`, blog `b`, etkinlik `e`, SSS `f`,
  yorum `rv`, adres `adr`, teklif `q`, sipariş `o`, servis talebi `srv`,
  garanti `w`, belge `doc`, stok işlemi `si`, satış temsilcisi `sr`, banka
  hesabı `ba`, POS `pos`, Hakkımızda bölümü `a`, rakam kutusu `s`.
- Üye `u-<zaman>`, bayi `d-<zaman>`, online satıcı `r-<zaman>` biçimindedir.
- Örnek veride kimlikler okunabilir yazılmıştır (`p-ultimate-250-mtc`,
  `d-basak-hirdavat`, `u-admin`).
- Backend kendi kimlik düzenini (ör. UUID) kullanabilir; kimlik yalnızca
  bağlantı içindir, ekranda gösterilmez.

**Tarih ve saat:**

- Tarih-saat alanları ISO 8601 metnidir (`2026-10-09T09:15:00+03:00`).
  Sistemin oluşturduğu kayıtlar UTC yazar (`…Z`); örnek veri Türkiye saatiyle
  (+03:00) yazılmıştır.
- Yalnızca tarih olan alanlar `YYYY-AA-GG` biçimindedir: etkinlik başlangıç
  ve bitişi, garanti bitişi.
- Gün hesapları (havalenin son ödeme günü, garantinin bitişi, etkinliğin
  "yaklaşan" sayılması) bugün tarayıcının yerel saatine göre yapılır.
  Backend'de Türkiye saati (Europe/Istanbul) esas alınmalı.
- Ekranda tarih ve saat her zaman Türkiye saatiyle yazılır
  (`packages/utils/src/format.ts`); sayfayı önceden hazırlayan sunucu ile
  tarayıcı aynı günü gösterir.

**Para:**

- Bütün tutarlar Türk lirasıdır (TRY), sayı olarak tutulur.
- Her fiyat alanında KDV hariç mi dahil mi olduğu yazar (`priceExVat`,
  `unitPrice` …). Hesaplar: [IS-KURALLARI.md](IS-KURALLARI.md).

**Link (slug) ve eski linkler:**

- Sayfası olan kayıtlarda (ürün, kategori, grup, blog yazısı, haber,
  etkinlik) `slug` adresin son parçasıdır. Yalnızca küçük Latin harf, rakam
  ve tire içerir.
- Link değişince eski link kayıtta saklanır ve yeni linke yönlenir:
  - Ürün, blog, haber, etkinlik: `previousSlugs` (yalnızca son parça).
  - Kategori ve grup: `previousPaths` (tam yol; kategori adresi grubun
    linkine bağlı olduğu için).
  - Seçeneğe dönüştürülmüş eski ürün: seçeneğin `previousSlugs` alanı.
- Yeni link başka bir kaydın eski linkiyse o eski yönlendirme silinir.

**Kopya (anlık görüntü) kayıtlar:**

- Sipariş ve teklif satırları ürünün o anki adını, kodunu ve seçenek adını
  **kopya olarak** saklar. Ürün sonradan değişse ya da silinse de geçmiş
  kayıt değişmez.
- Siparişin fiyatları, adresleri, fatura bilgileri ve ödeme bilgileri
  (POS adı, komisyon oranı) de sipariş anındaki kopyadır.
- Servis talebinde makine adı (`productName`) kopyadır.

**Yayında (active):**

- `active: false` olan ürün, blog yazısı, haber, etkinlik, belge, bayi,
  online satıcı ve satış temsilcisi sitede görünmez ama silinmez.
- Blog yazısında alan eski kayıtlarda olmayabilir; yoksa yayında sayılır.

**Görseller ve dosyalar (Demo notu):**

- Görsel alanlarında ya bir adres (`https://…`, `/images/…`) ya da panelden
  yüklenmiş görselin kendisi (`data:` ile başlayan metin) durur.
- Belgelerin dosyaları ayrı tutulur (bkz. [Belgeler](#belgeler-documents)).
- Backend'de görseller ve dosyalar bir dosya deposuna yüklenmeli; kayıtta
  yalnızca adres kalmalı.

---

## 2. İlişkiler

| Kayıt | Bağlı olduğu | Alan | Not |
|---|---|---|---|
| Kategori | Grup | `section` + `group` (grubun linki) | Bugün linkle bağlı; backend'de grup kimliğiyle bağlanmalı |
| Kategori | Seçenek tanımları | `optionIds[]` | Çoka çok; yalnızca "listelensin" bağı |
| Kategori | Filtreler | `filters[]` | Filtreler kategorinin içindedir (kategoriye özel, ortak değil) |
| Ürün | Kategori | `categorySlug` (+ `section`) | Bugün linkle bağlı; backend'de kategori kimliğiyle bağlanmalı. `section` kategoriden türetilebilir |
| Ürün | Seçenek tanımları | `options.optionIds[]` | Ürün başına en fazla 3 tanım, sayfadaki sırasıyla |
| Varyant (kombinasyon) | Seçenek değerleri | `options.variants[].values` | Ürünün her seçeneğinden bir değer; değer o tanımdan olmalı |
| Ürün | Kategorisinin filtre değerleri | `filterValues` | Filtre başına bir ya da birden çok değer; yalnızca kendi kategorisinin filtreleri |
| Bayi | Online satıcı | `retailerId` | Bire bir: bir mağaza en fazla bir bayiye bağlı |
| Bayi stok satırı | Bayi, ürün, varyant | `dealerId`, `productId`, `variantId` | Ayrıntı: [STOK.md](STOK.md) |
| Satıcı stok satırı | Satıcı, ürün, varyant | `retailerId`, `productId`, `variantId` | |
| Stok işlemi | Bayi ya da satıcı | `sourceType` + `sourceId` | |
| Kod eşleştirmesi | Bayi/satıcı, ürün, varyant | `sourceId`, `productId`, `variantId` | |
| Adres | Üye | `userId` | |
| Teklif | Üye (isteğe bağlı) | `userId` | Ziyaretçi de teklif ister |
| Teklif satırı | Ürün | `productId` | Ad, kod ve seçenek kopya |
| Sipariş | Üye (zorunlu) | `userId` | Sipariş yalnızca üyeden |
| İade talebi | Sipariş, üye | `orderId`, `userId` | Satırları siparişin satırlarına sırayla (`line`) bağlı |
| Sipariş satırı | Ürün | `productId` | Ad, kod, seçenek ve fiyat kopya |
| Servis talebi | Kategori, ürün, üye (isteğe bağlı) | `categorySlug`, `productId`, `userId` | Kategori bugün linkle bağlı; backend'de kimlikle bağlanmalı |
| Garanti kaydı | Kategori, ürün | `categorySlug`, `productId` | Kategori bugün linkle bağlı; backend'de kimlikle bağlanmalı. Üyeye e-postayla eşleşir (kimlikle değil) |
| Yorum | Ürün, üye (isteğe bağlı) | `productId`, `userId` | Seçenekten bağımsız; bütün seçenekler aynı yorumları görür |
| Belge | Ürün (isteğe bağlı) | `productId` | |

---

## 3. Katalog

### Gruplar (`category_groups`)

Menüde bölümün altında sol kolondaki gruplar (ör. Kaynak Makineleri).

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `section` | bölüm | `ekipmanlar`, `guvenlik`, `aksesuarlar`, `dolgu-metalleri`. Kayıttan sonra değişmez |
| `slug` | metin | Adres: `/<bölüm>/<slug>`. Bölüm içinde benzersiz |
| `name` | metin | Zorunlu |
| `order` | sayı | Bölüm içindeki sıra |
| `description` | metin? | Kısa açıklama; boşsa kategori adlarından üretilir |
| `aboutText` | metin? | Sayfa altındaki tanıtım metni (biçimli) |
| `image` | metin? | Kart görseli |
| `seo` | SEO? | Bkz. [SEO alanları](#seo-alanları) |
| `previousPaths` | metin[]? | Eski tam yollar |
| `code` | metin? | Kategori tablosundaki numara (ör. "1.2"); bkz. [16](#16-kullanılmayan-alanlar) |

### Kategoriler (`categories`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `section` | bölüm | Grubun bölümü |
| `group` | metin | Grubun linki (`slug`) |
| `slug` | metin | Adres: `/<bölüm>/<grup>/<slug>`. **Sitede benzersiz** |
| `name` | metin | Zorunlu |
| `order` | sayı | Grup içindeki sıra |
| `description` | metin | Kısa açıklama |
| `aboutText` | metin? | Tanıtım metni (biçimli) |
| `image` | metin? | Kart görseli; yoksa kategorinin ilk ürününün fotoğrafı |
| `optionIds` | metin[]? | Bu kategoride ürüne seçenek eklenirken listelenen tanımlar |
| `filters[]` | liste? | Kategori sayfasındaki filtreler, sırasıyla (bkz. aşağıda) |
| `seo` | SEO? | |
| `previousPaths` | metin[]? | Eski tam yollar |
| `code`, `icon` | metin? | Kullanılmıyor (bkz. [16](#16-kullanılmayan-alanlar)) |

### Seçenek tanımları (`option_definitions`, `option_values`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `name` | metin | Ör. "Hortum Uzunluğu". Benzersiz (Türkçe büyük/küçük harf duyarsız) |
| `values[]` | liste | Sıralı değerler |
| `values[].id` | metin | Değerin ilk adından üretilir (`4-m`) ve **hiç değişmez**; aynısı varsa sonuna `-2`, `-3` eklenir |
| `values[].label` | metin | Ör. "4 m". Tanım içinde benzersiz; ad düzeltilebilir |

**Filtreler (`filters` → `category_filters`, `category_filter_values`):**

Filtreler kategoriye özeldir; aynı adlı filtrenin değerleri kategoriye göre
değişebilir (TIG'de Çalışma Modu: DC, AC/DC; MIG'de Standart, Puls).
KARARLAR K-76.

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | Filtrenin ilk adından üretilir (`model-serisi`) ve **hiç değişmez**; sayfa adresinde kullanılır (`?model-serisi=force`). Kategori içinde benzersiz |
| `name` | metin | Ör. "Model Serisi". Kategori içinde benzersiz (Türkçe büyük/küçük harf duyarsız) |
| `values[]` | liste | Sıralı değerler; boş olabilir (değeri olmayan filtre sitede görünmez) |
| `values[].id` | metin | Değerin ilk adından üretilir (`kompakt`) ve hiç değişmez; aynısı varsa sonuna `-2` eklenir |
| `values[].label` | metin | Ör. "Kompakt". Filtre içinde benzersiz; ad düzeltilebilir |

Kategori ↔ tanım bağı (`category_options`) kategorinin `optionIds` alanıdır.

### Ürünler (`products`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `slug` | metin | Adres: `/urun/<slug>`. Ürünler arasında benzersiz |
| `sku` | metin | Ürün kodu. Zorunlu; **tek kod havuzunda benzersiz** (bkz. [12](#12-kayıt-numaraları-ve-benzersiz-alanlar)) |
| `name` | metin | Zorunlu; markasız ("Zenweld" yazılmaz) |
| `modelCode` | metin? | Ör. "Z03.01.15" |
| `brand` | metin? | Marka (ör. "Jasic"); boşsa Zenweld. Arama motorlarına giden ürün bilgisinde kullanılır |
| `section` | bölüm | Kategorinin bölümü |
| `categorySlug` | metin | Kategorinin linki |
| `processes` | liste | Kaynak yöntemleri: `MIG`, `MAG`, `TIG`, `MMA`, `PULSE`, `PLAZMA`, `MULTI`. Ürün Seçici ve arama kullanır; panelde yok |
| `shortDescription` | metin | |
| `description` | metin | |
| `priceExVat` | sayı | **Normal** fiyat, KDV hariç (indirimsiz) |
| `vatRate` | sayı | KDV oranı (%), ör. 20 |
| `currency` | `"TRY"` | |
| `discount` | kampanya? | Bkz. aşağıda |
| `images[]` | liste | `{ url, alt }`; ilki kapak |
| `specs[]` | liste | Teknik özellik satırları `{ label, value }` |
| `inTheBox[]` | metin[] | Kutu içeriği |
| `highlights[]` | metin[] | Öne çıkan özellikler; ilk 3'ü menü kartında |
| `options` | seçenekler? | Bkz. aşağıda |
| `filterValues` | nesne? | Kategori filtrelerindeki değerleri: `{ <filtre kimliği>: [<değer kimliği>, …] }`. Bir filtrede birden çok değer olabilir; seçenekli üründe değer ürünün tamamı içindir. Kayıtta kategoride olmayan filtre ve değer silinir. Backend'de `product_filter_values` (`productId`, `filterId`, `valueId`) |
| `quotable` | evet/hayır | Teklif Al listesinde çıkar mı |
| `isNew` | evet/hayır | "Yeni" rozeti |
| `order` | sayı? | Kategori içindeki sıra; boş olan sona, eşitler ada göre |
| `manualUrl` | metin? | Kullanım kılavuzu PDF'i |
| `warrantyMonths` | sayı | Garanti süresi (ay) |
| `active` | evet/hayır | Yayında |
| `seo` | SEO? | |
| `previousSlugs` | metin[]? | Eski linkler |
| `createdAt`, `updatedAt` | tarih-saat | |

**Kampanya (`discount`):**

| Alan | Tür | Açıklama |
|---|---|---|
| `percent` | tam sayı | İndirim oranı, 1–90 |
| `startsAt` | tarih-saat? | Boşsa hemen başlar |
| `endsAt` | tarih-saat? | Boşsa süresiz; başlangıçtan sonra olmalı |

**Seçenekler (`options` → `product_options`, `product_variants`, `variant_values`):**

Bir ürün en fazla 3 seçenek kullanır (ör. Soğutma ve Torç Uzunluğu). Satılan
her kombinasyon (ör. Su Soğutmalı · 8 m) bir **varyanttır**; satılmayan
kombinasyonun varyantı yoktur (KARARLAR K-70).

| Alan | Tür | Açıklama |
|---|---|---|
| `optionIds` | metin[] | Ürünün kullandığı seçenek tanımları, sayfadaki sırasıyla (1–3) |
| `variants[].id` | metin | Varyantın ürün içindeki kimliği (stok, sepet, teklif listesi, `?secenek=` adresi). Oluşturulduğu andaki değer kimliklerinden üretilir (`su-sogutmali_8-m`; tek seçenekte değerin kimliği, `4-m`) ve sonra değişmez |
| `variants[].values` | nesne | Kombinasyon: `{ <tanım kimliği>: <değer kimliği> }`; ürünün her seçeneğinden bir değer |
| `variants[].sku` | metin | Varyantın ürün kodu; zorunlu, tek kod havuzunda benzersiz |
| `variants[].priceDeltaExVat` | sayı | Ana fiyata eklenen fark (KDV hariç); eksi olabilir, toplam eksiye düşemez |
| `variants[].specOverrides` | satırlar? | Yalnızca farklı olan teknik özellikler; aynı adlı satırın yerine geçer |
| `variants[].inTheBox` | metin[]? | Boşsa ürünün kutu içeriği |
| `variants[].image` | metin? | Ürünün görsellerinden biri; boşsa ürünün fotoğrafları |
| `variants[].previousSlugs` | metin[]? | Bu varyant önceden ayrı ürünken kullanılan linkler |

- Seçeneklerin ve değerlerin adı ve sırası tanımdan okunur; ürün yalnızca
  kendine özel olanları tutar.
- Varyantlar ekranda önce birinci seçeneğin, sonra ikincisinin tanımdaki
  değer sırasıyla dizilir.
- Kombinasyonu olmayan seçenek kaydedilmez; aynı kombinasyon bir üründe iki
  kez olamaz.
- Seçenek listesi (tanımlar) değişince varyant kimlikleri yeniden üretilir;
  sıra değişince değişmez.

**Backend'de seçenekli ürün (e-ticaret sistemlerinin ortak yapısı):**

| Tablo | Ne tutar |
|---|---|
| `products` | Ürün sayfası: ad, link, marka, kategori, açıklama, garanti. Fiyat ve stok burada değil, varyanttadır |
| `option_definitions`, `option_values` | Ortak seçenek adları ve değerleri, sırasıyla |
| `product_options` | Ürünün kullandığı tanımlar ve sayfadaki sırası (`productId`, `optionId`, `position`) |
| `product_variants` | Satılabilir her kalem: kimlik, ürün, ürün kodu (benzersiz), fiyat farkı, aktif, fotoğraf, farklı teknik değerler |
| `variant_values` | Varyantın kombinasyonu (`variantId`, `optionId`, `valueId`); varyant başına seçenek başına tek değer; aynı üründe aynı kombinasyon tek |
| `dealer_stock`, `retailer_stock` | Stok her zaman varyanta bağlanır |
| `order_items`, `quote_items` | Varyant ve o anki kopyası (kod, ad, seçenek yazısı, birim fiyat) |

- **Seçeneksiz ürün de tek varyantlı tutulmalı** (varsayılan varyant). Böylece
  sepet, sipariş ve stok her zaman varyanta bağlanır. Bugün demoda seçeneksiz
  ürünün kodu ve fiyatı ürünün kendisindedir; backend'e geçerken varsayılan
  varyanta taşınmalı.
- **SAP ile eşleşme:** SAP Business One'da standart olarak "ana ürün + varyant"
  yapısı yoktur; her satılabilir kalem ayrı bir kalemdir (ItemCode). Doğal
  eşleşme "varyantın ürün kodu = SAP kalem kodu"dur. Sitede türetilen ve SAP'ta
  olmayan kodlar için bkz. [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün seçenekleri.

### SEO alanları

Ürün, kategori, grup, blog yazısı, haber ve etkinlikte `seo` nesnesi:

| Alan | Tür | Açıklama |
|---|---|---|
| `title` | metin? | Sayfa başlığı; boşsa otomatik |
| `description` | metin? | Arama sonucu açıklaması; boşsa kısa açıklama/özet |
| `keywords` | metin[]? | Site içi arama ve `keywords` etiketi |

Bütün alanlar boşsa `seo` hiç yazılmaz. Sabit sayfaların SEO'su:
[Sayfa SEO](#sayfa-seo-page_seo).

---

## 4. Bayiler, online satıcılar ve stok

Stok tablolarının ayrıntısı, SQL'i ve dosya biçimi [STOK.md](STOK.md)'dedir.
Burada yalnızca alanlar özetlenir.

### Bayiler (`dealers`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `name` | metin | Zorunlu |
| `city` | metin | Zorunlu |
| `district`, `address` | metin | |
| `phone` | metin | |
| `whatsapp` | metin? | |
| `lat`, `lng` | sayı | Harita konumu |
| `badges` | liste | `yetkili-satici` (Yetkili Bayi), `yetkili-servis` (Yetkili Servis); en az biri |
| `workingHours` | metin | |
| `retailerId` | metin? | Bayinin online mağazası; bir mağaza en fazla bir bayiye bağlı (benzersiz) |
| `active` | evet/hayır | |
| `email` | metin? | Kullanılmıyor (bkz. [16](#16-kullanılmayan-alanlar)) |

Bayiler sitenin üyesi değildir; sitede bayi girişi yoktur.

### Online satıcılar (`retailers`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `name` | metin | Zorunlu |
| `websiteUrl` | metin | Zorunlu; satıcının ana sayfası |
| `logoText` | metin | Ürün sayfasındaki kutuda görünen yazı; boşsa adın büyük harfi |
| `isOwnStore` | evet/hayır | Zenweld'in kendi mağazası (kırmızı rozetle en başta) |
| `city` | metin? | |
| `active` | evet/hayır | |
| `logoUrl` | metin? | Kullanılmıyor (bkz. [16](#16-kullanılmayan-alanlar)) |

### Stok

| Kayıt | Tablo | Alanlar |
|---|---|---|
| Bayi stok satırı | `dealer_stock` | `dealerId`, `productId`, `variantId?`, `sku` (dosyadaki kod), `quantity`, `price?` (KDV dahil, sitede gösterilmez), `url?` (online mağazalı bayide ürün linki), `updatedAt` |
| Satıcı stok satırı | `retailer_stock` | `retailerId` + bayi satırıyla aynı alanlar |
| Stok işlemi | `stock_imports` | `id`, `sourceType` (`dealer`/`retailer`), `sourceId`, `kind` (`file`/`manual`/`revert`), `fileName?`, `createdAt`, `createdBy?` (yönetici adı), `note?`, `summary`, `previous?` (geri alma için önceki satırlar), `revertedAt?` |
| İşlem özeti | (`stock_imports` içinde) | `rows`, `matched`, `unmatched`, `invalid`, `added`, `changed`, `zeroed` |
| Kod eşleştirmesi | `sku_aliases` | `sourceId`, `code` (büyük harf, boşluksuz), `productId`, `variantId?` |

- `variantId` boşsa (dosyada ürünün ana kodu geçtiyse) satır ürünün bütün
  varyantları için geçerlidir.
- Bir kaynakta aynı ürün ve varyant için tek satır olur.
- Sitede "stokta" sayılmak için: adet > 0 ve satır, stok geçerlilik
  süresinden eski değil ([Ayarlar](#stok-ayarı)).

---

## 5. Üyeler ve adresler

### Üyeler (`users`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `role` | rol | `individual` (Bireysel), `business` (Kurumsal), `admin` (Yönetici) |
| `status` | durum | `active` (Aktif), `suspended` (Askıda). Yeni üye Aktif başlar; onay durumu yoktur |
| `email` | metin | Küçük harfle saklanır; **benzersiz** (büyük/küçük harf duyarsız) |
| `passwordHash` | metin | **Demo notu:** Basit bir demo özeti; backend'de güçlü bir şifre özeti (ör. bcrypt, argon2) kullanılmalı |
| `firstName`, `lastName`, `phone` | metin | |
| `companyName`, `taxOffice`, `taxNumber`, `sector` | metin? | Kurumsal üyede |
| `city` | metin? | |
| `newsletter` | evet/hayır | Kayıtta "haber ve kampanya e-postaları" izni |
| `createdAt` | tarih-saat | |
| `lastLoginAt` | tarih-saat? | Her girişte yazılır |

- Yönetici hesapları sitede giriş yapamaz; site hesapları panele giremez.
- En az bir aktif yönetici her zaman kalmalıdır.

### Adresler (`addresses`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `userId` | metin | Sahibi |
| `title` | metin | "Ev", "Atölye" gibi |
| `fullName`, `phone`, `city`, `district`, `line` | metin | |
| `isDefault` | evet/hayır | Üyenin tek varsayılan adresi; ödeme sayfasında seçili gelir |

- Üyenin ilk adresi varsayılan olur.
- Varsayılan adres silinirse kalan ilk adres varsayılan olur.
- Adresi yalnızca sahibi değiştirebilir.

---

## 6. Teklifler

### Teklifler (`quotes`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `code` | metin | `TKL-<yıl>-<4 hane>`; benzersiz (bkz. [12](#12-kayıt-numaraları-ve-benzersiz-alanlar)) |
| `userId` | metin? | Üye gönderdiyse |
| `status` | durum | `new` (Yeni), `reviewing` (İnceleniyor), `sent` (Teklif Gönderildi), `won` (Kazanıldı), `lost` (Kapandı) |
| `companyName` | metin | Ziyaretçi ve kurumsal üyede zorunlu, bireysel üyede boş olabilir |
| `contactName`, `email`, `phone` | metin | Zorunlu |
| `taxNumber` | metin? | |
| `city` | metin | |
| `paymentPreference` | tercih | `vadeli` (Vadeli), `cek` (Çek), `havale` (Havale/EFT), `belirsiz` (Görüşülecek) |
| `termDays` | sayı? | Vadeli ödemede: 30, 45, 60, 90 ya da 120 |
| `items[]` | satırlar | Bkz. aşağıda |
| `message` | metin? | Müşteri notu |
| `assignedTo` | metin? | Panelde atanan satış temsilcisi (serbest metin) |
| `adminNote` | metin? | İç not |
| `createdAt`, `updatedAt` | tarih-saat | |

### Teklif satırları (`quote_items`)

| Alan | Tür | Açıklama |
|---|---|---|
| `productId` | metin | |
| `productName` | metin | Kopya |
| `sku` | metin? | Teklif anındaki kod (seçenekli üründe seçeneğin kodu) |
| `variantLabel` | metin? | Kopya, ör. "Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m" |
| `quantity` | sayı | En az 1 |
| `note` | metin? | Kullanılmıyor |

---

## 7. Siparişler

Siparişi yalnızca üye verir. Durum akışı ve tutar hesapları:
[IS-KURALLARI.md](IS-KURALLARI.md).

### Siparişler (`orders`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `code` | metin | `SIP-<yıl>-<5 hane>`; benzersiz |
| `userId` | metin | Zorunlu |
| `status` | durum | `awaiting_payment` (Ödeme Bekleniyor), `preparing` (Hazırlanıyor), `shipped` (Kargoda), `delivered` (Teslim Edildi), `cancelled` (İptal) |
| `customerName`, `email`, `phone` | metin | Sipariş anındaki kopya |
| `shippingAddress` | adres | Bkz. aşağıda |
| `invoice` | fatura | Bkz. aşağıda |
| `items[]` | satırlar | Bkz. aşağıda |
| `subtotal` | sayı | Ürünler toplamı, KDV dahil |
| `vat` | sayı | `subtotal` içindeki KDV (bilgi) |
| `shipping` | sayı | Kargo ücreti, KDV dahil; ücretsizse 0 |
| `installmentFee` | sayı | Taksitli ödemede vade farkı |
| `total` | sayı | Müşterinin ödediği toplam |
| `payment` | ödeme | Bkz. aşağıda |
| `shipment` | kargo? | Kargoya verilince |
| `history[]` | olaylar | Her durum değişikliği: `{ status, at, note? }` |
| `customerNote` | metin? | Müşterinin notu |
| `adminNote` | metin? | İç not (yalnızca panelde) |
| `termsAcceptedAt` | tarih-saat | Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onayı |
| `createdAt`, `updatedAt` | tarih-saat | |

### Sipariş satırları (`order_items`)

| Alan | Tür | Açıklama |
|---|---|---|
| `productId` | metin | |
| `productName`, `sku` | metin | Kopya (seçenekli üründe seçeneğin kodu) |
| `variantLabel` | metin? | Kopya |
| `quantity` | sayı | |
| `unitPriceExVat` | sayı | Birim fiyat, KDV hariç, indirim uygulanmış |
| `vatRate` | sayı | |
| `unitPrice` | sayı | Birim fiyat, KDV dahil |

### Adres ve fatura (siparişin içinde)

- **Adres** (`shippingAddress`, `invoice.address`): `fullName`, `phone`,
  `city`, `district`, `line`.
- **Fatura** (`invoice`):
  - `type`: `individual` (bireysel) ya da `corporate` (kurumsal).
  - Bireysel: `fullName`, `tcKimlikNo` (11 hane).
  - Kurumsal: `companyName`, `taxOffice`, `taxNumber` (10 hane).
  - `address`.

### Ödeme (`payment`)

| Alan | Tür | Açıklama |
|---|---|---|
| `method` | yöntem | `card` (kart) ya da `transfer` (havale/EFT) |
| `installments` | sayı? | Kart: taksit sayısı (1 = tek çekim) |
| `cardBrand` | metin? | "Visa", "Mastercard", "Troy" |
| `cardProgram` | metin? | Bonus, World … |
| `cardLast4` | metin? | Kartın son 4 hanesi (tam kart numarası **saklanmaz**) |
| `posId`, `posName` | metin? | Çekimin yapıldığı POS (ad kopya) |
| `commissionPercent` | sayı? | Sipariş anındaki banka komisyonu (%) |
| `paidAt` | tarih-saat? | Ödemenin alındığı an |
| `dueAt` | tarih-saat? | Havalede son ödeme; geçerse sipariş iptal |

### Kargo (`shipment`)

`carrier` (firma), `trackingNumber`, `shippedAt` (ilk kargoya verilme;
takip no düzeltilince değişmez), `deliveredAt?`.

### İade talepleri (`return_requests`)

Bireysel üyenin teslim edilen siparişi için açtığı iade (cayma) talebi
(kurallar: [IS-KURALLARI.md](IS-KURALLARI.md#7-sipariş-durumları)).

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `code` | metin | `IAD-<yıl>-<4 hane>`; benzersiz |
| `orderId`, `orderCode` | metin | Sipariş ve numarası |
| `userId` | metin | Talebi açan üye |
| `customerName`, `email`, `phone` | metin | Siparişteki müşteri bilgilerinin kopyası |
| `items` | liste | `{ line, productId, productName, sku, variantLabel?, quantity }`. `line` siparişin satır sırası (0'dan); ad, kod ve seçenek sipariş anındaki kopyadır |
| `reason` | durum | `changed_mind` (Vazgeçtim), `defective` (Kusurlu ürün), `wrong_item` (Yanlış ürün gönderildi), `other` (Diğer) |
| `note` | metin? | Müşterinin açıklaması |
| `status` | durum | `new` (Yeni), `reviewing` (İnceleniyor), `approved` (Onaylandı), `rejected` (Reddedildi) |
| `adminNote` | metin? | Yalnızca panelde |
| `createdAt`, `updatedAt` | tarih | |

---

## 8. Servis talepleri ve garantiler

### Servis talepleri (`service_requests`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `code` | metin | `SRV-<yıl>-<4 hane>`; benzersiz |
| `status` | durum | `new` (Yeni), `in_progress` (İşlemde), `done` (Tamamlandı) |
| `categorySlug` | metin | Makine türü (kategori) |
| `productId` | metin | Model |
| `productName` | metin | Kopya |
| `reasons` | liste | `kurulum`, `bakim`, `onarim`, `egitim` (Kullanım/Bakım Eğitimi); en az biri |
| `complaint` | metin | Müşteri şikayeti |
| `companyName`, `address`, `city`, `district` | metin | |
| `email`, `phone` | metin | |
| `contactName`, `contactGsm` | metin | Yetkili kişi |
| `userId` | metin? | Üye giriş yapmışsa |
| `adminNote` | metin? | İç not |
| `createdAt`, `updatedAt` | tarih-saat | |

### Garanti kayıtları (`warranties`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `serialNumber` | metin | Büyük harfe çevrilip kırpılarak saklanır; **benzersiz** |
| `categorySlug` | metin | Ürün kategorisi |
| `productId` | metin | Model |
| `ownerName`, `email`, `phone` | metin | E-posta küçük harfle saklanır; Garantilerim bu e-postayla eşleşir |
| `city`, `postalCode` (5 hane), `address` | metin | |
| `sellerTaxNumber` | metin | Satıcı VKN (10 hane, şahıs firmasında 11) |
| `registeredAt` | tarih-saat | Garanti bu andan başlar (satın alma tarihi sorulmaz) |
| `expiresAt` | tarih | Kayıt + ürünün garanti süresi (+ istendiyse 12 ay); panelde elle değişebilir |
| `extended` | evet/hayır | 12 ay uzatma |

Garanti kaydında üye kimliği tutulmaz; üyeyle e-posta üzerinden eşleşir.

---

## 9. Ürün yorumları

### Yorumlar (`reviews`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `productId` | metin | Ürüne bağlı (seçeneğe değil) |
| `userId` | metin? | Üye yazdıysa |
| `authorName` | metin | Zorunlu |
| `rating` | sayı | 1–5 |
| `title` | metin? | |
| `body` | metin | Zorunlu |
| `media[]` | liste | `{ url, kind }`; `kind`: `image` ya da `video` (video en fazla 2 MB) |
| `verifiedPurchase` | evet/hayır? | "Doğrulanmış alıcı" rozeti. **Demo notu:** Bugün giriş yapmış her üyede işaretlenir; gerçekte üyenin o ürünü satın almasıyla eşleşmeli |
| `approved` | evet/hayır | Panelde onaylanınca yayında; yeni yorum onaysız gelir |
| `featured` | evet/hayır | Anasayfadaki şeritte; en fazla 10, yalnızca onaylı yorumda |
| `createdAt` | tarih-saat | |

---

## 10. İçerik

### Blog yazıları (`blog_posts`)

`id`, `slug` (adres `/blog/<slug>`; blog yazıları arasında benzersiz),
`title`, `excerpt` (özet), `body` (biçimli metin), `coverUrl`, `category`
(serbest metin; ayrı bir kategori tablosu yoktur), `author` (boşsa
"Zenweld"), `publishedAt`, `active?`, `seo?`, `previousSlugs?`.

### Haberler (`news`)

`id`, `slug` (adres `/haberler/<slug>`; benzersiz), `title`, `summary`,
`body` (biçimli), `coverUrl`, `images[]` (galeri), `publishedAt`, `active`,
`seo?`, `previousSlugs?`.

Blog ve haberde `publishedAt` yalnızca sıralama ve gösterim içindir; kayıt
yayında işaretliyse hemen görünür (zamanlanmış yayın yoktur).

### Etkinlikler (`events`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id`, `slug` | metin | Adres `/etkinlikler/<slug>`; benzersiz |
| `title` | metin | Zorunlu |
| `summary`, `description` | metin | Kısa açıklama (kart), detaylı açıklama (biçimli) |
| `startDate`, `endDate` | tarih | Bitiş başlangıçtan önce olamaz; bitişi bugün ya da sonra olan "yaklaşan" |
| `venue`, `city`, `country` | metin | Ülke sitedeki süzgeçte kullanılır |
| `logoUrl` | metin | |
| `images[]` | metin[] | Galeri |
| `websiteUrl` | metin? | |
| `active` | evet/hayır | |
| `seo`, `previousSlugs` | | |

### Sık sorulan sorular (`faqs`)

`id`, `question`, `answer`, `topic` (`genel`, `siparis` = Sipariş & Teklif,
`garanti`, `teknik`). Sıra listedeki sıradır; backend'de bir `order` alanı
eklenmeli.

### Belgeler (`documents`)

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `section` | bölüm | `msds`, `kaynak-rehberi`, `parti-sertifikalari` |
| `title` | metin | Zorunlu |
| `productId` | metin? | İsteğe bağlı ürün |
| `lotNumber` | metin? | Yalnızca parti sertifikalarında |
| `fileName`, `mimeType` | metin | |
| `size` | sayı | Bayt; en fazla 25 MB |
| `fileKey` | metin | Dosyanın yeri. **Demo notu:** tarayıcının dosya deposundaki anahtar; backend'de dosya deposundaki yol |
| `active` | evet/hayır | |
| `createdAt`, `updatedAt` | tarih-saat | |

Sıra listedeki sıradır (backend'de `order` alanı). Kabul edilen uzantılar:
pdf, doc, docx, xls, xlsx, jpg, jpeg, png, zip.

**Belge sayfaları (`document_pages`):** `section`, `title`, `subtitle`; üç
sayfa için birer kayıt.

### Hakkımızda (`about`)

Tek kayıt:

- `heroTitle` (zorunlu), `heroSubtitle`, `heroImage?`.
- `stats[]`: `{ id, value, label }` (ör. "25+", "Yıllık Tecrübe").
- `sections[]`: `{ id, title, body (biçimli), imageUrl? }`; sıra listedeki
  sıradır.
- `updatedAt`.

### Satış temsilcileri (`sales_reps`)

`id`, `name`, `region` (bölge ya da görev; sitedeki bölge düğmeleri bundan
oluşur), `phone` (en az 10 rakam; Ara ve WhatsApp), `email`, `photoUrl?`,
`order`, `active`. Ad, bölge, telefon ve e-posta zorunlu.

### Yasal metinler (`legal_pages`)

`id`, `title`, `body` (biçimli), `updatedAt`.

- 11 sabit kayıt vardır; kimlik ve adres eşlemesi
  `packages/data/src/legal.ts`'tedir (ör. `kvkk` → `/yasal/kvkk`,
  `garanti-kosullari` → `/garanti/kosullar`).
- Eklenmez, silinmez; yalnızca başlık ve metin değişir.

### Sayfa SEO (`page_seo`)

Sabit sayfaların panelden değiştirilen başlık ve açıklaması:
`pageSeo[<sayfa adresi>] = { title?, description? }` (ör. `"/sss"`).
Değiştirilmemiş sayfa kayıtta yer almaz; varsayılan metinler
`apps/zenweld-web/src/lib/page-meta.ts`'tedir.

---

## 11. Ayarlar

Tek bir `settings` kaydı; üç bölüm.

### Mağaza ayarları (`settings.shop`)

| Alan | Tür | Açıklama | Örnek değer |
|---|---|---|---|
| `freeShippingThreshold` | sayı | Bu tutar ve üzeri (KDV dahil sepet) kargo ücretsiz | 5.000 |
| `shippingFee` | sayı | Sınırın altında kargo ücreti (KDV dahil) | 250 |
| `minInstallmentAmount` | sayı | Bu tutarın altında taksit gösterilmez | 1.000 |
| `transferDueDays` | sayı | Havale ödeme süresi (gün, en az 1) | 3 |
| `carriers` | metin[] | Kargo firmaları; en az biri | Yurtiçi, Aras, MNG, PTT, Sürat, UPS |
| `bankAccounts[]` | liste | `{ id, bankName, accountHolder, iban }`; banka adı ve IBAN zorunlu | 2 hesap |
| `pos[]` | liste | Banka POS'ları; listedeki sıra önemlidir | 9 POS |

**POS (`pos[]`):**

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | |
| `bankShortName` | metin | Listede görünen kısa ad; zorunlu |
| `name` | metin | Banka adı; zorunlu |
| `program` | metin? | Kart programı: Bonus, World, Maximum, Axess, CardFinans, Paraf, Advantage, BankkartCombo. Boşsa yalnızca tek çekim |
| `merchantNo` | metin | Bankanın verdiği üye işyeri numarası |
| `posName` | metin | |
| `active` | evet/hayır | |
| `isDefault` | evet/hayır | Programı eşleşmeyen kartlar bu POS'tan tek çekim; en fazla bir POS |
| `installments[]` | liste | Müşteriye sunulan: `{ count (2, 3, 6, 9, 12), ratePercent (vade farkı), enabled }` |
| `commissions[]` | liste | Bankanın komisyonu: `{ count (1 = tek çekim, 2…12), ratePercent }` |

- POS'un API anahtarı ve şifresi bu kayıtta **yoktur**; yalnızca sunucuda
  ortam değişkeni olarak durur ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)).
- Kargo, POS ve IBAN değerleri örnektir; canlıya çıkmadan gerçekleri
  girilmeli.

### Stok ayarı (`settings.stock`)

`staleDays`: Bu kadar günden eski stok satırları sitede gösterilmez (0 =
sınır yok; 0–365). Örnek değer 3.

### Görünüm (`settings.richText`)

Biçimli metinlerin görünümü: `headingSize` (14–32, 18), `headingColor`
(#141619), `headingUppercase` (evet), `accentColor` (#b82429),
`accentWidth` (0–160, 40), `leadSize` (14–26, 18), `bodySize` (12–22, 15),
`bodyColor` (#3d4348), `strongColor` (#141619). Parantez içinde aralık ve
başlangıç değeri.

---

## 12. Kayıt numaraları ve benzersiz alanlar

**Kayıt numaraları:**

| Kayıt | Biçim | Örnek |
|---|---|---|
| Sipariş | `SIP-<yıl>-<5 hane>` | SIP-2026-00003 |
| Teklif | `TKL-<yıl>-<4 hane>` | TKL-2026-0004 |
| Servis talebi | `SRV-<yıl>-<4 hane>` | SRV-2026-0034 |
| İade talebi | `IAD-<yıl>-<4 hane>` | IAD-2026-0001 |

- Numara o yıl şimdiye kadar verilmiş en büyük numaranın bir fazlasıdır;
  her yıl 1'den başlar.
- Silinen kaydın numarası yeniden kullanılmaz; en son kayıt silinse de.
  Bunun için son verilen numaralar veritabanında ayrıca tutulur:
  `recordCounters` (ön ek → sayı, ör. `"TKL-2026-": 49`).
- Numara kayıt anında verilir; backend'de aynı anda gelen iki kayıt aynı
  numarayı almamalı (veritabanı sırası ya da kilit).

**Benzersiz olması gerekenler:**

| Ne | Kapsam | Not |
|---|---|---|
| Ürün kodu ve varyant kodları | Tek havuz | Ürün kodu, başka ürünün kodu ya da herhangi bir varyantın koduyla aynı olamaz. Boşluksuz ve büyük harfe çevrilerek karşılaştırılır. İki tabloya yayıldığı için ortak kod tablosu ya da tetikleyici gerekir |
| Ürün linki | Ürünler | |
| Kategori linki | Bütün site | |
| Grup linki | Bölüm içinde | |
| Blog, haber, etkinlik linki | Kendi türü içinde | |
| Seçenek tanımı adı | Tanımlar | Türkçe büyük/küçük harf duyarsız |
| Seçenek değeri adı | Tanım içinde | Türkçe büyük/küçük harf duyarsız |
| Ürünün varyantı | Ürün + kombinasyon | Bir kombinasyon bir üründe bir kez |
| Üye e-postası | Üyeler | Büyük/küçük harf duyarsız |
| Garanti seri numarası | Garantiler | Büyük harfe çevrilerek |
| Bayinin online mağazası | Bayiler | Bir mağaza en fazla bir bayiye |
| Stok satırı | Kaynak + ürün + varyant | |
| Kod eşleştirmesi | Kaynak + kod | |
| Sipariş, teklif, servis numarası | Kendi türü içinde | |
| Varsayılan POS | POS'lar | En fazla bir |
| Varsayılan adres | Üyenin adresleri | Tam olarak bir (adresi varsa) |

Bugün bu kuralları panel ve site kontrol ediyor; backend'de veritabanında da
sağlanmalı.

---

## 13. Silme kuralları

| Silinen | Engel | Birlikte silinen / değişen |
|---|---|---|
| Ürün | — | Bayi ve satıcı stok satırları, kod eşleştirmeleri. Belgelerdeki ürün bağı kalkar (belge kalır). Sipariş, teklif, garanti, servis ve yorum kayıtları kalır |
| Ürünün bir varyantı (kombinasyonu) | — | O varyantın stok satırları ve kod eşleştirmeleri; eski ürün linki yönlendirmesi. Ürünün seçenek listesi (tanımları) değişirse bütün varyantlı stok satırları |
| Kategori | İçinde ürün varsa silinmez | — |
| Kategori filtresi ya da filtre değeri | — (kaç üründe işaretli olduğu söylenip onay istenir) | Kategorinin ürünlerindeki o filtre ya da değer |
| Grup | İçinde kategori varsa silinmez | — |
| Seçenek tanımı | Bir üründe kullanılıyorsa silinmez | Kategorilerdeki bağı |
| Seçenek değeri | Bir üründe kullanılıyorsa silinmez | — |
| Bayi | — | Stok satırları, stok işlemleri, kod eşleştirmeleri |
| Online satıcı | — | Stok satırları, stok işlemleri, kod eşleştirmeleri; bağlı bayinin `retailerId`'si |
| Üye (panelden ya da üyenin kendisi Hesabım'dan) | Son aktif yönetici silinemez; panelde yönetici satırı silinemez | Kayıtlı adresleri. Siparişleri, teklifleri, servis talepleri, iade talepleri, garanti kayıtları ve yorumları kalır (geçmiş kayıt) |
| Teklif | — | Numarası boşta kalır |
| Garanti, yorum, SSS, temsilci, haber, blog, etkinlik | — | — |
| Belge | — | Dosyası |
| Yasal metin | Silinemez | — |
| Sipariş, servis talebi, iade talebi | Panelde silinmez | — |

---

## 14. Tarayıcıda tutulanlar

Backend gelse de bazıları tarayıcıda kalır (sepet, çerez tercihi); bazıları
sunucuya taşınmalı (veritabanı, oturum).

| Anahtar | Yer | İçerik | Backend'de |
|---|---|---|---|
| `zenweld.db.v1` | localStorage | Bütün veritabanı (`ZenweldDatabase`, `version` alanıyla) | Veritabanı |
| `zenweld.session.v1` | localStorage | Site oturumu: üyenin kimliği | Sunucu oturumu |
| `zenweld.admin.session.v1` | localStorage | Panel oturumu: yöneticinin kimliği | Sunucu oturumu |
| `zenweld.cart.v1` | localStorage | Sepet: `[{ productId, variantId?, quantity }]` (eski `selection` biçimli satırlar tek seçenekte okunur) | Tarayıcıda kalabilir; fiyat her açılışta üründen hesaplanır |
| `zenweld.quotelist.v1` | localStorage | Teklif listesi: `[{ productId, variantId?, productName, quantity }]` | Tarayıcıda kalabilir |
| `zenweld.favourites.v1` | localStorage | Favori ürün kimlikleri | Üyeye bağlanabilir |
| `zenweld.cookie-consent.v1` | localStorage | Çerez tercihi: `{ choice: "all" | "necessary", at }` | Tarayıcıda kalır |
| `zenweld.admin.range` | localStorage | Panel ana sayfasındaki dönem seçimi | Tarayıcıda kalır |
| `zenweld.welcome.seen` | sessionStorage | Karşılama penceresi bu oturumda gösterildi | Tarayıcıda kalır |
| `zenweld.files.v1` | IndexedDB (`files`) | Belgelerin dosyaları | Dosya deposu |

- Sepet ve teklif listesindeki ürün yayından kalkarsa ya da seçeneği artık
  yoksa o satır gösterilmez.
- Sepette fiyat saklanmaz; her açılışta ürünün güncel fiyatından hesaplanır.

---

## 15. Örnek veri ve veri sürümü

**Veri sürümü (`DB_VERSION`):**

- `packages/data/src/index.ts`'tedir (bugün 66).
- Tarayıcıdaki kaydın `version` alanı bu sayıyla tutmazsa veri silinir ve
  örnek veriyle yeniden kurulur.
- Örnek veri ya da kayıtların şekli her değiştiğinde artırılır. **Dikkat:**
  Artırınca demo tarayıcılarındaki panel değişiklikleri kaybolur.
- Backend'de bunun yerine veritabanı geçişleri (migration) kullanılmalı.

**Örnek veri** (`packages/data/src/seed/`):

| Kayıt | Sayı | Not |
|---|---|---|
| Ürün | 88 | 40'ı Ekipmanlar (sahibinin listeleri; fiyat temsili, Force serisi dışında içerik örnek, KARARLAR K-73, K-75). 20'si seçenekli: 17 makine ve 3 aksesuar (MB-25 ve MB-36 MIG torçları, Gaz Nozulu Seti). Ekipmanların 22'sinde sahibinin fotoğrafı var; soğutmalı makinede her kombinasyon kendi soğutma halinin fotoğrafını gösterir (K-77) |
| Grup / kategori | 11 / 45 | Ekipmanların 8 alt kategorisinde filtre var (KARARLAR K-76); ürünlere yalnızca Model Serisi eşli |
| Seçenek tanımı | 6 | Hortum Uzunluğu, Paket, Soğutma, Torç Uzunluğu, Ara Paket Uzunluğu (temsili), Tepe Güç |
| Bayi / online satıcı | 29 / 9 | |
| Stok satırı (bayi / satıcı) | ~4.060 / ~610 | Veri ilk kurulduğunda o günün tarihiyle üretilir |
| Üye | 69 | 1 yönetici, 46 bireysel, 22 kurumsal |
| Sipariş / teklif | 133 / 48 | |
| Servis talebi / garanti | 34 / 54 | |
| İade talebi | 0 | Hesabım'dan açılır |
| Yorum | 11 | |
| Blog / haber / etkinlik | 6 / 2 / 8 | |
| SSS / temsilci / yasal metin | 8 / 11 / 11 | |
| Belge | 0 | Panelden yüklenir |

- Son 90 güne yayılmış örnek üye, sipariş, teklif, servis talebi ve garanti
  kayıtları `sample-activity.seed.ts`'ten gelir; canlıya çıkmadan önce
  silinmelidir.
- Mağaza ayarları (kargo, POS, IBAN), bayiler, satıcılar, yasal metinler ve
  örnek blog yazıları örnektir; gerçekleriyle değiştirilmelidir.
- Demo hesaplarının giriş bilgileri yalnızca [README](../README.md)'dedir.

---

## 16. Kullanılmayan alanlar

Kayıtta bulunan ama bugün sitede de panelde de kullanılmayan alanlar.

**Karar (2026-10-22):** Bu alanlar ileride kullanılmak üzere bırakıldı;
silinmez. Backend'e geçerken tablolara taşınmalı (bkz.
[KARARLAR.md](KARARLAR.md)).

| Alan | Durum |
|---|---|
| `categories.code`, `category_groups.code` | Örnek veride kategori tablosundaki numara ("1.2.3"); ekranda yok |
| `categories.icon` | Hiçbir kayıtta dolu değil |
| `dealers.email` | Örnek veride dolu; sitede gösterilmiyor, panelde girilemiyor |
| `retailers.logoUrl` | Logo yerine `logoText` kullanılıyor |
| `quote_items.note` | Satır notu; ekranda yok |
| `products.processes` | Kullanılıyor (Ürün Seçici, arama) ama panelde girilemiyor; bkz. [WEBSITE-KULLANIM.md › Bilinen durumlar](WEBSITE-KULLANIM.md#25-bilinen-durumlar) |
