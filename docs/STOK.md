# Bayi ve Online Satıcı Stokları

Bayilerin ve online satıcıların stok listeleri (ürün kodu, adet, fiyat, link) yönetim
panelinden **Stok Matrisi** ekranına yüklenir; ürün sayfalarındaki "Stoktaki
Bayileri Gör" haritası ve "Ayrıca online alışveriş olarak şurada da mevcuttur"
listesi bu veriden gelir.

Zenweld'in kendi deposu bu akışın dışındadır; onun stoğu SAP'tan gelir
([IS-KURALLARI.md › 20](IS-KURALLARI.md#20-zenweld-depo-stoğu)).

| Kaynak | Dosyadaki sütunlar | Sitede nerede |
|---|---|---|
| **Bayi** | Kod, Adet, Fiyat | Ürün sayfası → **Stoktaki Bayileri Gör** (yalnızca o ürünü stokta tutan bayiler) |
| **Online mağazası olan bayi** | Kod, Adet, Fiyat, Link | Haritada **ve** online satıcı kartında (linki olan ürünlerde) |
| **Online satıcı** | Kod, Adet, Fiyat, Link | Ürün sayfası → online satıcı kartı (linki olan ürünlerde); kart ürünün o sitedeki sayfasına gider |

**Online mağazası olan bayi:** Yönetim panelinde **Bayiler** formundaki "Bağlı olduğu
online mağaza" alanında seçilen bayidir; mağazanın **Online Satıcılar**'da kaydı
olmalıdır (kart adı ve logo yazısı oradan gelir). Her bayinin en fazla bir online
mağazası olur, her mağaza da yalnızca bir bayiye bağlanır. Bu bayi **tek dosya** gönderir:
stoktaki ürünler haritada, linki olanlar ayrıca online satıcı kartında görünür.
Mağazanın ayrıca stok dosyası olmaz; Stok Matrisi'nde ayrı satır olarak görünmez.

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
| **Sitede gösterim** | Adet ve fiyat sitede **gösterilmez**; fiyat yalnızca panelde durur. Bayi haritasında yalnızca stoğu olan bayiler listelenir. Online satıcı kartı dosyadaki ürün linkine gider. |
| **Link yoksa** | Linki boş olan ürün online satıcı kartında **görünmez** (ürün sayfasına yönlendirilemez). Önizlemede ve kaynak sayfasında "N ürünün linki yok" uyarısı çıkar. Online mağazası olan bayide ürün haritada görünmeye devam eder. |

---

## 2. Dosya biçimi

İlk 10 satır içinde başlık satırı aranır. Tanınan başlıklar (büyük/küçük harf ve
Türkçe karakter farkı önemsizdir):

| Sütun | Tanınan başlıklar | Zorunlu |
|---|---|---|
| Kod | SKU, Ürün Kodu, Stok Kodu, Kod, Malzeme Kodu, Model Kodu | Evet |
| Adet | Adet, Stok, Stok Adedi, Miktar, Mevcut, Stok Miktarı | Evet |
| Fiyat | Fiyat, Satış Fiyatı, KDV Dahil Fiyat | Hayır |
| Link | Link, URL, Ürün Linki, Ürün Adresi (yalnızca online satıcılar ve online mağazası olan bayiler; diğer bayilerde okunmaz) | Hayır; ama yoksa online kartta görünmez |

Diğer sütunlar (ürün adı vb.) yok sayılır. Başlık bulunamazsa dosya uygulanmaz;
sütun sırası tahmin edilmez (şablonda 2. sütun ürün adıdır, tahmin adet yerine adı
okurdu).

- **Sayılar:** `12`, `1.234`, `1.234,50`, `12,5`, `₺ 2.450` okunur.
- **CSV:** `;`, `,` ya da sekme ayırıcı otomatik bulunur. UTF-8 değilse Türkçe Windows
  kodlaması (Excel'in eski CSV kaydı) denenir; Türkçe karakterler bozulmaz.
- **Excel:** `.xlsx` okunur (ilk sayfa). Eski `.xls` okunmaz; Excel'de `.xlsx` ya da
  `.csv` olarak kaydedilmesi istenir. `.txt` uzantılı CSV de olur. En fazla 5 MB
  (veritabanı modunda ayrıca en fazla 20.000 satır).
- **Kod eşleşmesi:** ürün SKU'su, kombinasyon (varyant) SKU'su (3 m / 5 m torç,
  Su Soğutmalı · 8 m makine gibi) ya da kaynağa özel eşleştirme tablosu.
  Boşluklar ve büyük/küçük harf önemsizdir. Ürünün ana koduyla gelen satır
  ürünün bütün kombinasyonları için sayılır.
- **Şablon:** kaynak sayfasındaki **Şablon İndir**, bizim SKU'larımızı (seçenekli
  üründe her kombinasyon ayrı satırda, ör. "Ultimate 405 THP (Su Soğutmalı · 8 m)"), ürün adlarını
  ve kaynağın mevcut adet, fiyat (ve link) değerlerini içeren CSV verir; bayiye
  gönderilip doldurtulabilir.

Örnek (bayi):

```csv
SKU;Ürün Adı;Adet;Fiyat
ZW30100000012-8M;Ultimate 405 THP TIG Argon Kaynak Makinesi (Su Soğutmalı · 8 m);2;1.180.000,00
ZW30100000024-3M;Ultimate 250 MTC MIG Gazaltı Kaynak Makinesi (3 m);4;1.050.000,00
ZW30100000072;ForceArc 200 MMA Elektrod Kaynak Makinesi;0;
```

Örnek (online satıcı ya da online mağazası olan bayi):

```csv
SKU;Adet;Fiyat;Link
ZW30100000024-3M;6;1.185.000,00;https://www.satici.com/urun/ultimate-250-mtc
```

---

## 3. Nerede ne var

- Stok kuralları (stokta sayılma, seçenekli ürün, sitede gösterim):
  [IS-KURALLARI.md › 11](IS-KURALLARI.md#11-bayi-ve-online-satıcı-stoğu).
- Tablolar ve kolonlar:
  [VERITABANI.md › Stok tabloları](VERITABANI.md#stok-tabloları--dealer_stock-retailer_stock-stock_imports-sku_aliases).
- Panelin stokları nasıl okuyup yazdığı (dosya, geri alma, kod eşleştirme)
  ve kodun yeri: [SUNUCU.md › Stok Matrisi](SUNUCU.md#stok-matrisi).
- Panel ekranı: [ADMIN-KULLANIM.md › Stok Matrisi](ADMIN-KULLANIM.md#10-stok-matrisi).
