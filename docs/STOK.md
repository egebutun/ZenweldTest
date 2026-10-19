# Bayi ve Online Satıcı Stokları

Bayiler ve online satıcılar her gün stok listelerini (ürün kodu + adet) e-postayla
gönderir. Liste yönetim panelinden **Stok Matrisi** ekranına yüklenir; ürün
sayfalarındaki "Stoktaki Bayileri Gör" haritası ve "Ayrıca online alışveriş olarak
şurada da mevcuttur" listesi bu veriden gelir.

Zenweld'in kendi deposu bu akışın dışındadır: sitede her ürün her zaman satıştadır.

---

## 1. Akış

1. Bayi/satıcı dosyasını (`.csv` ya da `.xlsx`) gönderir.
2. Panelde **Stok Matrisi → ilgili bayi/satıcı → Dosya Yükle**.
3. Önizleme açılır:
   - okunan sütunlar,
   - eşleşen / tanınmayan / hatalı satırlar,
   - mevcut stokla fark: stoğa girecek, değişecek, stoktan çıkacak, değişmeyen.
4. Tanınmayan kodlar (bayinin kendi ürün kodu) bir ürüne **eşleştirilir**; eşleştirme
   saklanır, sonraki dosyalarda kendiliğinden tanınır.
5. **Stoğu Güncelle** → kaynağın stoğu dosyadaki listeyle değiştirilir.
6. Hatalı dosya yüklendiyse **Bu yüklemeyi geri al** ile önceki hale dönülür ya da
   düzeltilmiş dosya yeniden yüklenir. Tek satırlık düzeltmeler tablodan elle yapılır.

### Kurallar

| Kural | Açıklama |
|---|---|
| **Tam liste** | Her dosya o kaynağın tüm stoğudur. Dosyada olmayan ürün stoktan çıkar. |
| **Kısa dosya uyarısı** | Önceki listede en az 10 stoklu ürün varken yeni dosya bunun yarısından azını içeriyorsa (yarım gönderilmiş olabilir), uygulamadan önce onay istenir. |
| **Tekrarlanan kod** | Aynı ürün dosyada birden fazla kez geçerse son satır geçerlidir; önizlemede uyarı çıkar. |
| **Eksi adet** | 0 sayılır, uyarı verilir (bayi programları eksi stok gösterebilir). |
| **Hatalı satır** | Kod boş, adet okunamıyor ya da tam sayı değil → satır uygulanmaz, nedeni gösterilir. |
| **Geçerlilik süresi** | Son *N* gün içinde güncellenmemiş stok sitede gösterilmez (varsayılan 3 gün, panelden değiştirilir, 0 = sınırsız). Panelde "N gündür güncellenmedi · sitede gizli" uyarısı çıkar. |
| **Sitede gösterim** | Yalnızca "Stokta" bilgisi gösterilir. Adet ve satıcı fiyatı sitede **gösterilmez**. Online satıcı kutusu, dosyadaki ürün linkine gider (link yoksa satıcının ana sayfasına). |

---

## 2. Dosya biçimi

İlk 10 satır içinde başlık satırı aranır. Tanınan başlıklar (büyük/küçük harf ve
Türkçe karakter farkı önemsizdir):

| Sütun | Tanınan başlıklar | Zorunlu |
|---|---|---|
| Kod | SKU, Ürün Kodu, Stok Kodu, Kod, Malzeme Kodu, Model Kodu | Evet |
| Adet | Adet, Stok, Stok Adedi, Miktar, Mevcut, Stok Miktarı | Evet |
| Fiyat | Fiyat, Satış Fiyatı, KDV Dahil Fiyat (yalnızca online satıcılar) | Hayır |
| Link | Link, URL, Ürün Linki, Ürün Adresi (yalnızca online satıcılar) | Hayır |

Diğer sütunlar (ürün adı vb.) yok sayılır. Başlık bulunamazsa sütunlar şablon
sırasıyla okunur: A = kod, B = adet, C = fiyat, D = link.

- **Sayılar:** `12`, `1.234`, `1.234,50`, `12,5`, `₺ 2.450` okunur.
- **CSV:** `;`, `,` ya da sekme ayırıcı otomatik bulunur. UTF-8 değilse Türkçe Windows
  kodlaması (Excel'in eski CSV kaydı) denenir; Türkçe karakterler bozulmaz.
- **Excel:** `.xlsx` okunur (ilk sayfa). Eski `.xls` okunmaz; Excel'de `.xlsx` ya da
  `.csv` olarak kaydedilmesi istenir. En fazla 5 MB.
- **Kod eşleşmesi:** ürün SKU'su, seçenek SKU'su (3 m / 5 m torç gibi) ya da
  kaynağa özel eşleştirme tablosu. Boşluklar ve büyük/küçük harf önemsizdir.
- **Şablon:** kaynak sayfasındaki **Şablon İndir**, bizim SKU'larımızı, ürün adlarını
  ve kaynağın mevcut adetlerini içeren CSV verir; bayiye gönderilip doldurtulabilir.

Örnek (bayi):

```csv
SKU;Ürün Adı;Adet
ZW-U250MTC;Zenweld Ultimate 250 MTC;4
ZW-TRC-MB25-3;Zenweld MB-25 MIG Torcu (3 m);12
ZW-ARC200;Zenweld ARC 200;0
```

Örnek (online satıcı):

```csv
SKU;Adet;Fiyat;Link
ZW-U250MTC;6;54.890,00;https://www.satici.com/urun/ultimate-250-mtc
```

---

## 3. Kod yapısı

| Katman | Dosya | Görev |
|---|---|---|
| Saf mantık | `packages/data/src/stock.ts` | `readStockSheet` (tablo → satırlar), `matchStockRows` (kod → ürün), `diffStock` (fark), `looksTruncated`, `isInStock` / `isStockFresh`, `stockTemplateRows`. Tarayıcıya ya da veritabanına bağlı değil; backend'de aynen kullanılır. |
| Tipler | `packages/data/src/types.ts` | `StockLevel`, `StockImport`, `SkuAlias`, `StockSettings` |
| Veri işlemleri | `packages/store/src/repo/stock.ts` | Okuma (`retailersInStockFor`, `dealersWithProduct`, `sourceStatus` …) ve yazma (`applyStockImport`, `revertStockImport`, `setStockLevel`, `deleteStockLevel`, `saveSkuAlias`, `saveStockSettings`). Her fonksiyon bir API ucuna karşılık gelir (aşağıda). |
| Dosya okuma | `apps/zenweld-web/src/lib/stock-file.ts` | Tarayıcıda `.csv` / `.xlsx` → satır × hücre tablosu (`read-excel-file` 8.0.3) |
| Panel | `apps/zenweld-web/src/components/admin/stock/` | Kaynak listesi, kaynak sayfası, yükleme önizlemesi, ürün bazında görünüm |
| Örnek veri | `packages/data/src/seed/stock.seed.ts` | Her kaynak için yakın tarihli örnek liste; bir bayi ve bir satıcı bilerek 5 gün eski |

---

## 4. Backend'e geçiş

Bugün veri tarayıcının yerel deposunda (localStorage) tutuluyor. Backend kurulurken
aşağıdaki tablolar ve uçlar, mevcut fonksiyonların birebir karşılığıdır.

### Tablolar (PostgreSQL)

```sql
CREATE TABLE stock_imports (
  id           text PRIMARY KEY,
  source_type  text NOT NULL CHECK (source_type IN ('dealer', 'retailer')),
  source_id    text NOT NULL,
  kind         text NOT NULL CHECK (kind IN ('file', 'manual', 'revert')),
  file_name    text,
  file_key     text,                 -- orijinal dosya (nesne deposu), denetim için
  note         text,                 -- elle düzeltmenin açıklaması
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   text,                 -- yönetici kullanıcı id
  rows         int NOT NULL, matched int NOT NULL, unmatched int NOT NULL, invalid int NOT NULL,
  added        int NOT NULL, changed int NOT NULL, zeroed int NOT NULL,
  previous     jsonb,                -- geri alma için önceki stok (son 5 dosyada)
  reverted_at  timestamptz
);
CREATE INDEX stock_imports_source ON stock_imports (source_type, source_id, created_at DESC);

CREATE TABLE stock_levels (
  source_type  text NOT NULL CHECK (source_type IN ('dealer', 'retailer')),
  source_id    text NOT NULL,
  product_id   text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id   text NOT NULL DEFAULT '',   -- '' = ürünün tüm seçenekleri
  sku          text NOT NULL,              -- dosyadaki kod
  quantity     int  NOT NULL CHECK (quantity >= 0),
  price        numeric(12, 2),             -- yalnızca online satıcı; sitede gösterilmez
  url          text,                       -- yalnızca online satıcı
  updated_at   timestamptz NOT NULL,
  import_id    text REFERENCES stock_imports (id),
  PRIMARY KEY (source_type, source_id, product_id, variant_id)
);
-- Ürün sayfası sorgusu: bu ürünü stokta tutan kaynaklar
CREATE INDEX stock_levels_product ON stock_levels (product_id, updated_at) WHERE quantity > 0;

CREATE TABLE sku_aliases (
  source_id    text NOT NULL,
  code         text NOT NULL,              -- büyük harf, boşluksuz
  product_id   text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id   text NOT NULL DEFAULT '',
  PRIMARY KEY (source_id, code)
);

-- Ayar: site_settings.stock_stale_days int NOT NULL DEFAULT 3
```

Ürün sayfası sorgusu:

```sql
SELECT source_id, url FROM stock_levels
WHERE product_id = $1 AND source_type = 'retailer' AND quantity > 0
  AND ($2 = 0 OR updated_at > now() - make_interval(days => $2));  -- $2 = stale_days
```

### API uçları

| Uç | Karşılığı (bugün) |
|---|---|
| `GET  /api/admin/stock/sources` | `listStockSources`, `sourceStatus` |
| `GET  /api/admin/stock/:type/:id` | `stockOfSource`, `stockHistory` |
| `POST /api/admin/stock/:type/:id/preview` (dosya) | `readStockSheet` → `matchStockRows` → `diffStock`; **yazmaz** |
| `POST /api/admin/stock/:type/:id/imports` (dosya + `confirmTruncated`) | `applyStockImport` |
| `POST /api/admin/stock/imports/:importId/revert` | `revertStockImport` |
| `PATCH / DELETE /api/admin/stock/:type/:id/levels/:productId[/:variantId]` | `setStockLevel`, `deleteStockLevel` |
| `PUT / DELETE /api/admin/stock/aliases` | `saveSkuAlias`, `deleteSkuAlias` |
| `PUT  /api/admin/settings/stock` | `saveStockSettings` |
| Ürün sayfası (sunucu bileşeni ya da `GET /api/products/:id/availability`) | `retailersInStockFor`, `dealersWithProduct` |

Notlar:

- **İşlem bütünlüğü:** bir dosyanın uygulanması tek veritabanı işleminde (transaction)
  yapılır: kaynağın satırları silinir, yeni satırlar ve içe aktarma kaydı yazılır.
  Aynı kaynağa iki yükleme aynı anda gelmesin diye kaynak bazında kilit alınır.
- **Doğrulama sunucuda:** önizleme ile uygulama arasında dosya değişmiş olabilir;
  uygulama ucu dosyayı yeniden okur ve aynı fonksiyonlardan geçirir.
- **Excel sunucuda:** aynı kütüphanenin Node sürümü (`read-excel-file/node`, 8.0.3) ya
  da eşdeğeri kullanılır. Makro çalıştırılmaz; yalnızca `.csv` / `.xlsx`, en fazla 5 MB.
- **Önbellek ve hız:** stok günde bir değiştiği için ürün sayfaları önbellekte tutulur.
  - Bir yükleme uygulandığında yalnızca etkilenen ürünlerin sayfaları yenilenir
    (`diffStock` sonucundaki ürünler; Next.js'te `revalidateTag` / `revalidatePath`).
  - "Geçerlilik süresi" zamana bağlı olduğu için sayfalar ayrıca günde en az bir kez
    yenilenmelidir.
  - Sorgu indeksli ve küçüktür; performans sorunu beklenmez.
- **Otomatik e-posta (ileride):** `stok@zenweld.com` adresine gelen ekler bir e-posta
  servisinin (Postmark, SendGrid, Mailgun vb.) web kancasıyla alınır. Gönderen adresten
  kaynak bulunur ve aynı önizleme/uygulama fonksiyonlarından geçirilir.
- **Yetki:** tüm `/api/admin/stock/*` uçları yalnızca yönetici oturumuyla çalışır.
  Bugünkü panel girişi tarayıcı tarafında, gerçek güvenlik değildir.
