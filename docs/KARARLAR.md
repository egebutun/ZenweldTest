# Kararlar — Ne Karar Verildi ve Neden

Site ve panel için sahibiyle alınmış kararlar ve nedenleri. Amaç: aynı
konular baştan tartışılmasın; yeni bir geliştirme oturumu (Claude dahil)
bu kararları "hata" sanıp "düzeltmeye" kalkmasın.

- Bir karar değişecekse **önce sahibine sorulur**.
- Değişen kararın eski hali kısaca kalır ve "**Değişti → K-xx**" diye
  işaretlenir.
- K numaraları değişmez; koddaki ve diğer belgelerdeki notlar bu
  numaralara bakar. Yeni karar sıradaki numarayı alır (bugün son numara
  K-110).
- Burada yalnızca karar ve nedeni yazar. Nasıl çalıştığı:
  [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md),
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md),
  [IS-KURALLARI.md](IS-KURALLARI.md), [VERITABANI.md](VERITABANI.md),
  [SUNUCU.md](SUNUCU.md), [STOK.md](STOK.md).
- Henüz karar verilmemiş konular:
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › 3 ve 4.

---

## İçindekiler

1. [Genel](#1-genel) — K-01–K-04, K-83, K-102
2. [Katalog ve ürün](#2-katalog-ve-ürün) — K-05–K-12, K-69, K-71–K-78
3. [Ürün seçenekleri](#3-ürün-seçenekleri) — K-13–K-19, K-70
4. [Satış, ödeme ve teklif](#4-satış-ödeme-ve-teklif) — K-21–K-27, K-64, K-65, K-79, K-80, K-85, K-86, K-97
5. [Stok ve SAP; bayiler ve online satıcılar](#5-stok-ve-sap-bayiler-ve-online-satıcılar) — K-20, K-28–K-33, K-82, K-84, K-93
6. [Üyelik ve hesap](#6-üyelik-ve-hesap) — K-34–K-37, K-68, K-94–K-96
7. [Garanti ve servis](#7-garanti-ve-servis) — K-38–K-41
8. [İçerik](#8-i̇çerik) — K-42–K-47, K-114, K-115
9. [Formlar, yasal metinler ve e-posta](#9-formlar-yasal-metinler-ve-e-posta) — K-48–K-51, K-98, K-100, K-104
10. [Arama motorları ve adresler](#10-arama-motorları-ve-adresler) — K-52–K-56
11. [Panel](#11-panel) — K-57–K-61, K-99, K-101, K-103, K-105, K-109
12. [Sunucu ve veritabanı](#12-sunucu-ve-veritabanı) — K-81, K-87, K-88, K-90–K-92, K-108
13. [Çalışma şekli ve belgeler](#13-çalışma-şekli-ve-belgeler) — K-62, K-63, K-66, K-67, K-89, K-106, K-107, K-110

---

## 1. Genel

### K-01 · Site ve panel yalnızca Türkçe
- İngilizce tamamen kaldırıldı: adreslerde dil öneki ve dil seçici yok,
  verilerde İngilizce alan yok. Eski `/tr/...` ve `/en/...` adresleri 404
  verir.
- Bilerek kalanlar: anasayfadaki **"HOT SALE"** ifadesi (sahibinin
  tercihi) ve arayüz metinlerinin durduğu `packages/i18n` klasörünün adı
  (içinde yalnızca Türkçe metin var).

### K-02 · Sitede "demo" yazısı yok
- Sitede ve panelde sitenin demo olduğunu gösteren hiçbir yazı yoktur.
  Belgelerdeki "Demo notu" işaretleri yalnızca geliştiriciler içindir.
- Ürün tanıtımı anlamındaki "demo" bu kararın dışındadır: fuar
  etkinliklerindeki "Uygulamalı Demo Gösterileri" ve "canlı demolar",
  satış temsilcisi unvanı "Demo ve Satış Sonrası Hizmetler Uzmanı".
  Tarayıcı testleri bu ifadelere izin verir (`tests/e2e/tarama.spec.ts`).

### K-03 · Bayiler sitenin müşterisi değildir
- Bayiler sitede giriş yapmaz, hesap açmaz; Üye Ol sayfası bayileri
  Bayilik Başvurusu'na yönlendirir.
- Ayrı bayi e-ticaret sitesi ve mağaza paneli kaldırıldı. Zenweld ile
  bayiler arasındaki teklif ve siparişler ileride **ayrı bir B2B
  uygulamasında** yapılır.
- Paneldeki Siparişler, Teklifler ve Üyeler yalnızca ana sitenin
  kayıtlarıdır.
- **Neden:** Ana site son müşteriye ve kurumsal alıcıya satar; bayi
  ilişkisi ayrı bir iş akışıdır.

### K-04 · Panel sitenin içinde, ayrı oturumla
- Panel ayrı bir proje değil, sitenin içinde `/yonetim` adresindedir.
- Kendi giriş ekranı ve siteden ayrı oturumu vardır. Sitede panele
  bağlantı yoktur; yönetici hesabı sitede giriş yapamaz.
- **Neden:** Tek proje, tek adres; bakımı kolay.

### K-83 · Her zaman en hızlı ve en uygun yol
- Teknik seçimlerde sitenin hızı önceliklidir. Örnekler:
  - Dış sistemler (SAP, bayi dosyaları) sayfa açılırken sorgulanmaz; veri
    önceden kendi veritabanımıza alınır.
  - Sayfalar sunucuda hazırlanıp önbellekte tutulur; yalnızca değişen
    sayfalar yenilenir.
  - Sık yapılan sorgular için veritabanında dizin bulunur; görseller
    küçültülmüş (webp) gelir.
- **Neden:** Sahibinin isteği: her zaman en uygun ve sitenin hızlı olacağı
  yol seçilsin.

### K-102 · Bugünkü içerik örnektir; görseller ve ürüne bağlı ayarlar sonra
- Sitedeki ürünler ve ayrıntıları, menü düzeni, sayfalar, bütün metinler
  ve tasarım örnektir. Hepsi değişebilir; yeni menü ve sayfa eklenebilir.
  Geliştirme içerikten bağımsız altyapıyla (veritabanı, panel, kurallar)
  sürer.
- Görsellerin hız, arama motorlarında görünürlük ve performans için
  iyileştirilmesi ve nasıl saklanacağı sahibi söyleyince ele alınır.
  Sahibine şu anlarda hatırlatılır: dosya deposu kurulurken, gerçek
  fotoğraflar gelince, canlıya hazırlıkta.
- Ürüne bağlı ayarlar (kategori filtreleri ve değerleri, Ürün Seçici,
  istenirse ürün karşılaştırma) ürünler kesinleşince kurulur. Bugünkü
  filtreler örnektir (K-76); Ürün Seçici en sona kalır (K-69); ürün
  karşılaştırma bugün yoktur.
- **Neden:** Sahibinin kararı; gerçek içerik ve tasarım sonra gelecek.

---

## 2. Katalog ve ürün

### K-05 · Kategori ağacı
- Kategoriler Zenweld'in onaylı ağacına göredir: 4 bölüm (Ekipmanlar,
  Güvenlik, Aksesuarlar, Dolgu Metalleri), 12 grup, 50 kategori.
  Kategoride ürün olmak zorunda değildir.
- Aksesuarlar'ın ilk grubu **Lazer Aksesuarları**'dır (sonradan eklendi):
  Lazer Kaynak Kafaları, Lazer Temizleme Kafaları, Lazer Tel Sürme
  Üniteleri, Lazer Sarf Malzemeleri, Lazer Yedek Parçaları. Açıklamaları
  sahibinin notlarından yazıldı; henüz ürünleri ve kategori numaraları
  yok.

### K-06 · Dört seviyeli katalog, kartlarla
- Bölüm sayfası (`/ekipmanlar`) grupları, grup sayfası
  (`/ekipmanlar/kaynak-makineleri`) kategorileri **resimli kartlarla**
  gösterir; ürünler yalnızca kategori sayfasında listelenir.
- `?grup=...` biçimindeki adresler kaldırıldı (404).
- Kategori sayfasında aynı gruptaki diğer kategorilerin şeridi yoktur.
- **Neden:**
  - Parametreli adresin SEO değeri düşük; temiz adresli grup sayfaları
    "kaynak makinesi" gibi genel aramaları hedefler.
  - Her alt kategorinin kendi filtreleri var (MMA ile TIG makinesinin
    filtreleri farklı); kardeş kategori şeridi buna uymaz.

### K-07 · Ürün adresi kategoriden bağımsız
- Katalog adresleri menüyü izler (`/bölüm/grup/kategori`); ürün adresi
  `/urun/<ürün>`'dür.
- **Neden:** Kısa ve kalıcıdır; ürünün kategorisi değişse de adresi
  değişmez.

### K-08 · Ürün adında "Zenweld" yok
- Ürün adına "Zenweld" yazılmaz.
- Başka markanın ürününde marka adı adda kalır (ör. "Jasic LS-20000F Lazer
  Temizleme Makinesi").
- Ürünün markası panelde **Marka** alanına yazılır (boşsa Zenweld); arama
  motorlarına giden ürün bilgisinde bu marka kullanılır.
- **Neden:** Sayfa başlığına "| ZENWELD" kendiliğinden eklenir; adda da
  olursa iki kez yazar. Başka markanın ürününü insanlar markasıyla arar.

### K-09 · Kaynak yöntemi etiketleri kaldırıldı
- MIG/TIG/MMA gibi yöntem etiketleri ürün formundan, ürün kartlarından ve
  kategori filtresinden kaldırıldı.
- Bilerek kalan: Ürün Seçici ve arama bu veriyi (`processes`) hâlâ
  kullanır; Ürün Seçici yeniden kurulurken silinir. Bu yüzden panelden
  eklenen ürün Ürün Seçici'de çıkmaz.
- **Neden:** Ürünler menüde zaten bu sınıflara göre ayrılıyor.

### K-10 · Ürünlerde "öne çıkan" işareti yok
- Ürünlerde "öne çıkan" alanı yoktur (panelden ve veriden kaldırıldı).
- Anasayfadaki indirimli ürünler bölümüne ürünler kampanyaya göre
  kendiliğinden girer.

### K-11 · Ürünlerin kategori içindeki sırası
- Her ürüne panelden **Sıra** numarası verilir; kategori sayfasındaki
  "Önerilen" sıralama bunu kullanır.

### K-12 · Kategori silme ve tanıtım metni
- İçinde ürün olan kategori ve içinde kategori olan grup silinemez.
- Kategori ve grubun uzun tanıtım metni sayfanın **altında** durur.
- **Neden:** Ürünler kategorisiz kalmasın; ürünler üstte görünsün.

### K-69 · Ürün Seçici en sona bırakıldı
- Ürün Seçici'nin soruları, cevapları ve süzme mantığı bütün ürünler
  kesinleştikten sonra, en son kurulur.
- O zamana kadar Ürün Seçici'nin sonuçlarının doğru olması beklenmez;
  ürün eklenirken ya da denenirken sonuçlarına göre ayar yapılmaz.
- Kurulurken:
  - Sorular ve cevapları panelden yönetilir: yeni soru eklenebilir, var
    olan sorular ve cevapları düzenlenebilir.
  - Ürünler panelde cevaplara eşlenir.
  - Test sonunda verilen cevaplara eşlenmiş ürünler gelir.
- **Neden:** Sorular ve eşleştirme ancak bütün ürünler belli olunca doğru
  kurulabilir.
- Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün Seçici ve arama.

### K-71 · Ürün adı model ve türü içerir; sayfa başlığında kategori yok
- Ekipman ürünlerinin adı "model + ürün türü"dür. Tür, Türkiye'de aranan
  adıyla yazılır:
  - "… TIG Argon Kaynak Makinesi", "… MIG Gazaltı Kaynak Makinesi",
    "… MMA Elektrod Kaynak Makinesi";
  - "… Çok Fonksiyonlu Kaynak Makinesi", "… Plazma Kesme Makinesi";
  - "… Lazer Kaynak / Temizleme / Markalama Makinesi".
- Kartta, ürün sayfasında, sepette ve siparişte aynı ad görünür.
- Ürün sayfasının otomatik başlığı "<Ürün adı> | ZENWELD"dir; kategori
  adı eklenmez.
- Ürün linki kısadır, model adından oluşur (ör. `/urun/ultimate-405-thp`).
- **Neden:**
  - Google başlığın yaklaşık ilk 60 karakterini gösterir; kategori adı
    eklenince başlık kesiliyor ve "Kaynak Makinesi / Makineleri" tekrar
    ediyordu.
  - Ad hem model aramalarını ("405 THP") hem genel aramaları ("tig kaynak
    makinesi", "argon kaynak makinesi") karşılar.
  - Marka Google'da site adı olarak ve başlığın sonunda görünür.

### K-72 · Ürün kodu SAP kodudur; seçenek ve sayfa kodları
- Ürün kodu (SKU), şirketin SAP Business One sistemindeki kalem kodudur.
  Ayrı model kodu kullanılmaz (panelde Model Kodu alanı boş kalır).
- Seçeneğin SAP'ta kendi kodu varsa o kullanılır (ör. Y300 QCW 600 W /
  1000 W). Yoksa SAP kodunun sonuna seçenek eklenir: torç uzunluğu
  `-4M`, ara paket uzunluğu `-AP10M` (ör. `ZW30100000027-3M-AP5M`).
- Seçenekli ürünün sayfa kodu:
  - ürün **tek** SAP kalemiyse (yalnızca torç uzunluğu seçenekli) SAP
    kodu;
  - **birden çok** SAP kalemiyse (soğutmaya ya da güce göre) SAP'ta
    olmayan model kodu `ZW-<MODEL>` (ör. `ZW-ULTIMATE-405-THP`).
- **Neden:**
  - Kodun SAP'takiyle aynı olması eşleştirmeyi kolaylaştırır; e-ticarette
    yaygın yöntem budur.
  - Birden çok SAP kalemini kapsayan sayfanın kodu bir SAP kodu olsaydı,
    bayi dosyasında o kodla gelen stok ürünün bütün seçeneklerinde (ör.
    su soğutmalılarda da) görünürdü.
- Açık konu: üretilen kodların SAP'ta açılıp açılmayacağı
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün seçenekleri 3).

### K-73 · Ekipmanlarda temsili fiyat ve örnek içerik
- Gerçek bilgiler gelene kadar:
  - Ekipmanların fiyatı **999.999 ₺ + KDV**'dir (temsili); seçenekler
    arasında fiyat farkı yoktur.
  - MIG makinelerinin ara paket uzunlukları (5 m, 10 m) temsilidir.
  - Açıklama, teknik özellikler, kutu içeriği, öne çıkan özellikler ve
    kullanım kılavuzu bağlantısı örnektir.
  - Kaynak yöntemi ve elektrik bilgisi girilmez (Ürün Seçici en son, K-69).
- Fotoğraf maddesi **Değişti → K-77**: eskiden bütün ürünler ortak bir
  fotoğraf gösteriyordu; artık fotoğraflar sahibinden gelir.
- **Neden:** Sahibinin kararı; gerçek bilgiler sonra gönderilecek.
- Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün içeriği.

### K-74 · Jasic lazer kaynak ürünleri sonra eklenecek
- Lazer Kaynak'ta şimdilik yalnızca Y300 QCW vardır.
- Sahibinin ilk ürün listesindeki Jasic lazer kaynak makineleri, sahibi
  seçeneklerini ayrıntılı açıklayınca (belki çok sonra) eklenir.
- Lazer Temizleme ve Lazer Markalama'daki Jasic ürünleri girildi.
- Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Jasic lazer kaynak
  ürünleri.

### K-75 · SAP kodu verilmemiş ürüne geçici kod; ForceMIG serisi Çok Fonksiyonlu'da
- Sahibinin SAP kodunu veremediği ürün geçici kod alır:
  `ZW-GECICI-<MODEL>` (ör. `ZW-GECICI-FORCEARC250`). SAP kodu gelince
  panelden değiştirilir. Gerçek SAP kodlarıyla karışmasın diye rastgele
  sayı yerine bu biçim seçildi.
- ForceMIG serisi (125, 185 MP, 200, 205 DP), sahibinin ikinci listesine
  göre **Çok Fonksiyonlu Kaynak Makineleri**'ndedir (ForceMIG 200 ilk
  listede MIG'deydi, taşındı). Adları K-71'e göre "… Çok Fonksiyonlu
  Kaynak Makinesi"dir.
- Ürünler model adıyla eşleştirildi; listedeki "JASIC alt model kodu"
  sütunu kullanılmaz (sahibine göre yanlışlıkla kalmış).
- Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün içeriği.

### K-76 · Ekipman alt kategorilerinde filtreler; filtreler kategoriye özel
- Ekipmanların alt kategori sayfalarında filtre vardır. Değişkenler
  sahibinin listesinden (sıra sayfadaki sıradır):

  | Alt kategori | Filtreler |
  |---|---|
  | MMA, Plazma | Model Serisi · Şebeke Voltajı · Amper |
  | TIG | Model Serisi · Şebeke Voltajı · Amper · Çalışma Modu (DC, AC/DC) |
  | MIG, Çok Fonksiyonlu | Model Serisi · Şebeke Voltajı · Amper · Çalışma Modu (Standart, Puls) · Fiziki Yapı (Portatif, Kompakt, Çantalı) |
  | Lazer Kaynak | Model Serisi · Şebeke Voltajı · Fiziki Yapı (Portatif, Kompakt, Çantalı) |
  | Lazer Temizleme | Fiziki Yapı (Portatif, Kompakt) · Lazer Tipi (Fiber, Puls) · Güç (W) |
  | Lazer Markalama | Fiziki Yapı (Masa Tipi, Portatif) · Lazer Tipi (UV, Fiber) · Güç (W) |

- Model Serisi'nin değerleri her kategoride orada bulunan serilerdir
  (Ultimate, Evomig, Force, Multicut, Y300). Şebeke Voltajı, Amper ve Güç
  (W) değerleri ürünler kesinleşince girilir.
- Çok Fonksiyonlu'nun filtreleri MIG'inkiyle aynıdır (sahibinin
  listesinde bu ürünler MIG grubundaydı).
- Yazım: listedeki "Harici Çantalı" ile "Çantalı" aynıdır, "Çantalı"
  yazılır. Yazım Türkçedir: Compact → Kompakt, Std → Standart.
- Y300'ün gücü (600 W / 1000 W) filtrede yoktur; ürünün seçeneği olarak
  kalır.
- Filtreler kategoriye özeldir (Seçenek Tanımları gibi ortak değildir):
  aynı adlı filtrenin değerleri kategoriye göre değişir (Çalışma Modu
  TIG'de DC / AC/DC, MIG'de Standart / Puls). Filtreler ve ürünlerin
  değerleri panelden yönetilir.
- Şimdilik yalnızca Model Serisi ürünlere eşlendi (ürün adının ilk
  kelimesinden). Sahibinin listesinde olmayan beş Force ürünü (ForceArc
  250, 280; ForceMIG 125, 185 MP, 205 DP) de Force sayıldı. Diğer
  filtreler değerler kesinleşince eşlenir.
- Hiçbir ürüne eşlenmemiş filtre sitede seçilebilir ama sonucu daraltmaz
  (sahibinin isteği: "ne seçilirse seçilsin tam sonuç gelsin").
- **Neden:** Sahibinin kararı; MMA, TIG ve lazer makinelerinde müşterinin
  baktığı özellikler farklıdır (bkz. K-06).
- Ayrıntı: [IS-KURALLARI.md](IS-KURALLARI.md) › 19,
  [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md) › Katalog,
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md) › Kategori formu › Filtreler,
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › Kategori filtreleri.

### K-77 · Ekipman fotoğrafları sahibinden; soğutmaya göre değişir
- Ekipmanlardaki eski fotoğraflar yanlış sayılır; sahibinin gönderdiği
  fotoğraflar kullanılır.
- Fotoğrafı olmayan ürün ve soğutma hali, eksikler tamamlanana kadar
  ürünün alt kategorisinin kart çizimini gösterir. Eksik fotoğraflar
  sahibi bulunca yüklenir.
- Hava ve su soğutma seçeneği olan üründe Hava ya da Su seçilince o halin
  fotoğrafı görünür. Ürün kartında gerçek fotoğraf çizimden önce gelir.
- Fotoğrafın adı ürünün linkidir: `<link>.jpg`; soğutmalı üründe
  `<link>-hava-sogutmali.jpg` ve `<link>-su-sogutmali.jpg`.
- Adında soğutma yazmayan fotoğrafların hangi hale ait olduğu fotoğrafa
  bakılarak belirlendi ve sahibince doğrulandı; `ultimate-320-mtc`
  fotoğrafı Ultimate 320 MTC iPanel'indir.
- Sahibinin isteğiyle silinenler: sitede karşılığı olmayan
  `ultimate-400-cel`, üzerinde "LS-15000F" yazan Jasic LS-20000F
  fotoğrafı ve Force ürünlerinin geçici Jasic TIG200 fotoğrafı.
- ForceArc 200, ForceTIG 200, ForceMIG 200 ve ForceCut 45'in gerçek
  fotoğrafı sahibinden geldi. Force serisinin kalan 5 ürünü (ForceArc 250,
  280; ForceMIG 125, 185 MP, 205 DP), gerçek fotoğrafları gelene kadar
  sahibinin verdiği geçici ortak fotoğrafı (Jasic ARC280 görseli,
  `force-serisi-gecici.webp`) gösterir. ForceArc 400 CEL bu listede
  yoktur; çizim gösterir.
- Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün fotoğrafları.

### K-78 · Güvenlik, Aksesuarlar ve Dolgu Metalleri'ndeki örnek ürünler silindi
- Bu üç bölümdeki 48 ürünün hepsi örnekti; sahibinin isteğiyle silindi.
  Bölümler, gruplar, kategoriler ve menüler kalır; kategoriler gerçek
  ürünler girilene kadar boştur.
- Yalnızca bu ürünler için konmuş seçenek tanımları (Hortum Uzunluğu,
  Paket) ve genel ürün fotoğrafı (`zenweld-urun.webp`) da kaldırıldı.
- Örnek sipariş, teklif, stok ve yorumlar ekipmanlara göre yeniden
  kuruldu. Kampanya örneklerinde %25 ve üzeri "Flaş İndirim" örneği
  ForceArc 200 MMA'dır; en az 10 onaylı yorum vardır.

---

## 3. Ürün seçenekleri

### K-13 · Seçenekli ürün tek sayfadır
- Aynı ürünün uzunluk, paket gibi farkları ayrı ürün değil, **tek ürün
  sayfasında seçenek** olur (ör. bir torcun 3 m / 4 m / 5 m halleri).
- Bu yapı bütün ürünlere uygulanabilir; belli kategorilere özel değildir.

### K-14 · Seçenek tanımları ortaktır, kategori yalnızca seçer
- Seçenek adları ve değerleri tek yerde (Seçenek Tanımları) durur.
- Kategoriler yalnızca hangi tanımların listeleneceğini işaretler; ürün
  tanıma kimlikle bağlıdır.
- **Neden:** Ürün başka kategoriye taşınınca seçenekleri bozulmaz; bir
  değerin adı tek yerde düzeltilir; WooCommerce, Magento gibi sistemlerin
  kullandığı yapı.

### K-15 · Ürün başına tek seçenek adı — Değişti → K-70
- Eski karar: bir üründe yalnızca bir seçenek adı olurdu (ör. yalnızca
  "Hortum Uzunluğu"); kombinasyon (uzunluk × renk gibi) yoktu.
- Neden değişti: gerçek ürünlerde soğutma, torç uzunluğu ve ara paket
  uzunluğu birlikte seçiliyor; sahibinin kararıyla K-70 geldi.

### K-16 · Kategoride seçenek işareti kaldırma engellenmez
- Bir tanımın kategorideki işareti, o kategoride kullanan ürün olsa da
  kaldırılabilir. Panel kaç üründe kullanıldığını yazar ve onay ister.
- Tanımın **silinmesi** ise engellidir (veri kaybettirir).
- **Neden:** İşaret yalnızca "yeni üründe listelensin mi" demektir; veri
  kaybettirmez. Engellemek, ürün başka kategoriye taşındığında da
  tutarsızlık yaratırdı.

### K-17 · Yorumlar ortak, bayi ve satıcılar seçime göre
- Yorumlar ürüne bağlıdır; seçenek değişince değişmez.
- Stoktaki bayiler ve online satıcılar seçilen seçeneğe göre değişir;
  stok dosyaları ürün koduyla eşleşir.

### K-18 · Ürün ve seçenek kodları tek havuzda benzersiz
- Her seçeneğin kendi ürün kodu zorunludur; ürün ve seçenek kodları
  birbirinden farklı olmalıdır.
- **Neden:** Bayi ve satıcı stok dosyaları ürünü bu kodla bulur; aynı kod
  iki yerde olursa stok yanlış ürüne yazılır.

### K-19 · Sipariş ve teklifte anlık kopya
- Sipariş ve teklif satırı o anki ürün adını, seçenek adını, kodunu
  (siparişte fiyatını da) kopya olarak saklar.
- **Neden:** Ürün sonradan değişse ya da silinse de geçmiş kayıt ve yasal
  belgeler değişmemeli.

### K-70 · Bir üründe birden çok seçenek; her kombinasyon ayrı varyant
- Bir ürün en fazla 3 seçenek kullanır (ör. Soğutma: Hava / Su ve Torç
  Uzunluğu: 4 m / 8 m). Sınırı geliştirici önerdi, sahibi onayladı:
  seçenek sayısı arttıkça kombinasyon ve kod sayısı katlanarak büyür.
- Satılan her kombinasyon (ör. Su Soğutmalı · 8 m) bir varyanttır: kendi
  ürün kodu (zorunlu, K-18), fiyat farkı, fotoğrafı, farklı teknik
  değerleri ve kutu içeriği olur. Satılmayan kombinasyonun varyantı
  yoktur; sitede seçilemez.
- Sayfada her seçenek ayrı satırdır. Bir değer seçilince diğer seçim
  korunur; o kombinasyon yoksa o değeri içeren ilk kombinasyona geçilir.
- Panelde kombinasyonlar işaretlenen değerlerden kendiliğinden oluşur.
- **Neden:** Sahibinin kararı; e-ticaret sistemlerinin (Shopify,
  WooCommerce, Magento) ortak yapısı.
- Veritabanında tutulma biçimi: [VERITABANI.md](VERITABANI.md) › 3 ›
  Seçenekli ürün.

---

## 4. Satış, ödeme ve teklif

### K-21 · Online sipariş yalnızca üyelerden
- Misafir alışverişi yoktur; sipariş için giriş gerekir.
- Bireysel ve kurumsal üye online satın alabilir; Teklif Al da ayrıca
  kalır.

### K-22 · Ödeme yöntemleri ve kargo
- Kart (taksitli) ve havale/EFT.
- Ücretsiz kargo sınırı 5.000 ₺ (panelden değişir).

### K-23 · Taksit ve komisyon banka bazında
- Her banka POS'unun kendi taksitleri ve komisyonu vardır.
- Kart, programı eşleşen bankanın taksitleriyle çekilir; eşleşmeyen kart
  varsayılan POS'tan tek çekim ödenir.
- POS'ların gizli bilgileri yalnızca sunucuda tutulur; gerçek üye işyeri
  numaraları örnek veriye yazılmadı.

### K-24 · Havale süresi günün sonunda dolar
- Son ödeme günü 23:59'a kadar ödeme kabul edilir (sipariş saatine göre
  değil).
- **Neden:** Müşteriye "son ödeme: <gün>" yazıyor; aynı gün akşam ödeyenin
  siparişi iptal olmamalı.

### K-25 · Teklif Al kurumsal müşteriler için
- Teklif Al yalnızca kurumsal müşteriler içindir; vadeli ödeme ve çekle
  ödeme buradan istenir.
- Formun soruları yalnızca firmanın verebileceği bilgileri isteyecek;
  bireysel müşteri formu dolduramaz (sorular düzenlenecek:
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › Teklif Al formu).
- Her iki hesap türünde Hesabım'da Tekliflerim ve Siparişlerim vardır.
- Sağ üstteki kullanıcı menüsünde Tekliflerim **yoktur**.

### K-26 · Ürün sayfasında teklif düğmesi yok
- Ürün sayfasında "Teklif Al" ya da "teklife ekle" düğmesi **yoktur ve
  olmayacaktır** (kesin karar). Ürünler yalnızca Teklif Al sayfasındaki
  ürün listesinden eklenir (K-80).
- Mobil menüde de Teklif Al bağlantısı yoktur (masaüstüyle aynı). Teklif
  Al'a anasayfadaki bantlardan gelinir.
- Boş teklif listesinde ürün sayfasına yönlendiren yazı yoktur: "Teklif
  listeniz boş. Yukarıdan model seçip listeye ekleyin."

### K-27 · Müşteriye otomatik iade yok
- Sipariş iptalinde para iadesi panelden yapılmaz; banka ya da ödeme
  kuruluşu üzerinden ayrıca yapılır.
- Müşterinin siparişi sitede kendisinin iptal etmesi bu kararın konusu
  değildir (eskiden içindeydi, çıkarıldı). Bugün sitede iptal düğmesi
  yoktur; ileride düşünülecek
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Müşterinin siparişi iptal etmesi).

### K-64 · Kayıt numarası hiçbir zaman tekrar verilmez
- Sipariş, teklif ve servis talebi numaraları tekrar etmez; en son kayıt
  silinse de numarası bir sonraki kayda verilmez.
- **Neden:** Müşterinin elindeki e-postada yazan numara başka bir kayda
  verilmesin. (Testler, en son teklif silinince numarasının yeniden
  verildiğini ortaya çıkarmıştı; belge değil kod düzeltildi.)

### K-65 · İade talebi bütün üyelerde, teslimden itibaren 14 gün
- Bireysel ve kurumsal her üye, teslim edilen siparişi için Hesabım ›
  Siparişlerim'den iade (cayma) talebi açar. Süre teslim gününden itibaren
  14 gündür (son gün 23:59'a kadar).
- Panelde Satış grubunda **İade Talepleri** ekranı vardır. Para iadesi
  K-27'ye göre banka ya da ödeme kuruluşu üzerinden ayrıca yapılır.
- İade ve Değişim sayfasının başında, başlığın hemen altında koyu yazıyla
  Siparişlerim'e yönlendiren sabit yazı hep durur; panelden değişmez.
  Altındaki metin panelden yönetilir; hukukçuyla birlikte yazılacak.

### K-79 · Teklif yalnızca Ekipmanlar için
- Teklif yalnızca Ekipmanlar'daki ürünler için istenir. Teklif Al
  listesinde Ekipmanlar'daki **yayındaki ürünlerin hepsi** çıkar;
  Güvenlik, Aksesuarlar ve Dolgu Metalleri'ndeki ürünler çıkmaz.
- Panelde ürün bazında "Teklife açık" işareti yoktur; ürünün teklife
  girip girmediğini bölümü belirler.
- Tarayıcıda saklanan teklif listesindeki bir ürün Ekipmanlar dışına
  taşınırsa listede görünmez ve teklife eklenmez.

### K-80 · Teklif Al'da ürün grup ve türe göre, seçenekler modelden sonra seçilir
- Teklif Al ürün listesi tek bir uzun açılır liste değildir: ürünler
  Ekipmanlar'ın gruplarına (Lazer Makineleri, Kaynak Makineleri) ve
  bunların alt kategorilerine ayrılmış, fotoğraflı listelenir. Bu liste
  anasayfadaki Ürün Seçici testinden (K-69) ayrıdır.
- Seçenekli üründe kişi önce modeli seçer; seçenekler altında açılır.
  Seçime göre fotoğraf ve ürün kodu ürün sayfasındaki gibi değişir.
- **Neden:** Bütün kombinasyonların yazı olarak alt alta dizildiği liste
  okunmuyordu.
- Ayrıntı: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md) › Teklif Al.

### K-85 · Kupon başka indirimle birleşir, kargoya uygulanmaz
- Kupon, kampanya (indirimli fiyat) gibi başka indirimlerle birlikte
  kullanılabilir; kampanyalı fiyatın üstüne uygulanır.
- Kupon kargo ücretine uygulanmaz.
- Kupon ekranları sitede (sepet) ve panelde (Satış › Kuponlar) vardır.
- Sahibinin onayladığı ayrıntılar:
  - Siparişte tek kupon kullanılır.
  - Yüzdelik kupon uyan ürünlerin toplamına uygulanır. TL kupon siparişte
    bir kez düşülür ve uyan ürünlerin toplamını geçemez. İndirim tam
    liraya yuvarlanır.
  - Kupon belirli ürün ya da kategoriler içinse yalnızca onlara
    uygulanır; sepette uyan ürün yoksa kabul edilmez.
  - En az sepet tutarı bütün sepetin ürün toplamına bakar (kargo ve kupon
    hariç).
  - Ücretsiz kargo sınırı kupon düşüldükten sonraki tutara bakar.
  - Vade farkı kupon düşüldükten sonraki toplamdan hesaplanır.
  - Kupon KDV matrahını düşürür; KDV indirimli tutardan hesaplanır.
  - Kupon, sipariş verilince kullanılmış sayılır (havale dahil). Sipariş
    iptal olursa kullanım geri sayılır; iade (cayma) geri saymaz. İade
    edilen ürün için ödenecek tutar, o ürüne düşen kupon payı çıkarılarak
    bulunur.
  - Kodda büyük/küçük harf fark etmez. Kupon sepette girilir; kişi başı
    sınır ve süre sipariş anında yeniden denetlenir. Teklifte kupon
    yoktur.
- Kurallar ve örnekler: [IS-KURALLARI.md](IS-KURALLARI.md) › Kuponlar.

### K-86 · Kişiye özel kupon
- Kupon belirli kişilere özel olabilir. Örnek: ürün tanıtımına
  gidildiğinde müşteriye "sana özel bu kuponu kullanabilirsin" denir.
- Kişiye özel kupon **e-posta adreslerine** tanımlanır. Kişi o gün henüz
  üye olmasa da e-postası eklenir; aynı e-postayla üye olup giriş yapınca
  kuponu kullanır.
- Başka e-postayla giriş yapan üye kuponu kullanamaz: "Bu kupon
  hesabınıza tanımlı değil…".
- Sepette ziyaretçiye uygulanır; e-posta ödeme adımında, giriş yapan
  üyeye göre denetlenir (sipariş yalnızca üyeden, K-21).
- **Neden:** Sahibinin isteği; satış ekibinin yüz yüze verdiği indirim
  yalnızca o kişide kalsın.

### K-97 · Siparişler sunucuda: fiyat değişirse, kart ödemesi, iade, havale süresi
- Veritabanı modunda:
  - **Fiyat değişirse:** Sunucu tutarı yeniden hesaplar. Müşterinin ödeme
    sayfasında gördüğü tutar tutmazsa sipariş alınmaz; "Fiyatlar
    güncellendi" denir ve yeni tutar gösterilir.
  - **Kartlı ödeme:** Gerçek POS bağlanana kadar temsilidir; sipariş
    ödenmiş sayılır ve "Hazırlanıyor" olarak kaydedilir. Canlıya gerçek
    ödeme bağlanmadan çıkılmaz ([YAPILACAKLAR.md](YAPILACAKLAR.md) ›
    Canlıya giden yol).
  - **İade talebi** sipariş detayında olduğu için siparişlerle birlikte
    sunucudadır.
  - **Süresi dolan havale:** Siparişler okunurken sunucuda iptal edilir ve
    kupon hakkı geri verilir; canlıda bunu ayrıca günlük zamanlanmış bir
    iş yapar.
- **Neden:** Müşteri onaylamadığı bir tutarı ödemesin; ödeme kuruluşu
  henüz seçilmedi; tarayıcıdaki iade formu sunucudaki siparişi bulamazdı.

---

## 5. Stok ve SAP; bayiler ve online satıcılar

### K-20 · Zenweld'de her ürün her zaman stokta — Değişti → K-82
- Eski karar: Zenweld deposu için stok sınırı yoktu; yayındaki her ürün
  sepete eklenebiliyordu.
- Neden değişti: sahibinin bilgisi; Zenweld deposunda her üründe stok
  olmayabilir, depo stoğu SAP'tan okunur.

### K-28 · Stok panelden dosyayla yüklenir
- Bayiler ve satıcılar stoklarını ürün kodu + adet (+ fiyat, link) olarak
  gönderir; dosya (CSV/XLSX) panelden yüklenir. E-postayla otomatik alma
  şimdilik yok.
- Her dosya o kaynağın **tam listesidir**; dosyada olmayan ürün stoktan
  çıkar.
- Sitede adet değil, yalnızca "stokta olan" bayi ve satıcılar görünür.
- Stok geçerlilik süresi 3 gündür; panelden değişir.
- Satıcının fiyatı ve linki dosyadan gelir; **fiyat sitede gösterilmez.**
- Veritabanı modunda stok satırları `dealer_stock` ve `retailer_stock`
  tablolarındadır.
- **Neden:** Bayiler günlük liste gönderiyor; tam liste kuralı stoktan
  çıkan ürünü de yakalar; süre sınırı bayat veriyi gizler.

### K-29 · Bayi ve online satıcının sitede görünüşü
- Bayiler yalnızca ürün sayfasındaki "Stoktaki Bayileri Gör" haritasında
  görünür; yalnızca stoğu olanlar.
- Online satıcı kartı ürünün satıcının sitesindeki sayfasına gider;
  kartta "STOKTA" yazmaz.
- Stok tablosunda fiyat ve link ayrı sütunlardır; bayiler link göndermez
  (online mağazası olan hariç).

### K-30 · Bir bayinin en fazla bir online mağazası
- Online mağazası olan bayi, Online Satıcılar'daki kaydına bağlanır; bir
  mağaza en fazla bir bayiye bağlıdır.
- Bu bayi tek dosya gönderir; ürünleri hem haritada hem online satıcı
  kartında görünür.

### K-31 · "Ürün Bazında" stok sekmesi kaldı
- Stok Matrisi'ndeki "Ürün Bazında" sekmesi kaldırılmadı.
- **Neden:** "Bu ürün hangi bayide var?" sorusunu tek ekranda cevaplar;
  diğer sekmeden aynı cevap için her bayi tek tek açılmalıdır. Panel ana
  sayfasındaki "stokta olmayan ürünler" listesi de bu sekmeye bağlanır.

### K-32 · Başlıksız stok dosyası uygulanmaz
- Dosyada "Kod" ve "Adet" başlıklı satır bulunamazsa dosya uygulanmaz
  (sütun sırası tahmin edilmez).
- **Neden:** Başlık silinince ürün adındaki sayı adet sanılıp sessizce
  uygulanıyordu.

### K-33 · Bayi türü; "Showroom" etiketi yok
- Bayi türü Yetkili Bayi, Yetkili Servis ya da ikisi birden olabilir;
  panelden girilir.
- "Showroom" etiketi kullanılmaz (Bayilik Başvurusu'ndaki "Showroom var
  mı?" sorusu kalır).

### K-82 · Zenweld depo stoğu SAP'tan; stokta olmayan ürün sepete eklenmez
- Zenweld deposunun stoğu SAP'tan okunur. SAP ekibi ürün başına
  "kullanılabilir stok" görünümü (view) hazırlar; sunucu bunu düzenli
  aralıklarla okuyup kendi veritabanına yazar. Görünüm sayfa açılırken
  sorgulanmaz (K-83).
- Bayi ve online satıcı stokları ayrıca gösterilmeye devam eder.
- Panelde Ürünler listesinde depo stoğu görünür.
- Depoda stoğu olmayan ürünün sayfasında ve ürün kartında **STOKTA YOK**
  yazar; ürün sepete eklenemez.
- Görünümün adı ve okuma sıklığı K-84'te. Kolonları ve bağlantı yolu SAP
  ekibinden gelecek ([VERITABANI.md](VERITABANI.md) › Açık sorular).

### K-84 · SAP: stok 15 dakikada bir okunur; site siparişleri SAP'a satış siparişi olarak girilir
- SAP stok görünümünün adı `AVAILABLE_STOCK` olacak (kesinleşmedi;
  farklı çıkarsa değiştirilir). Sunucu görünümü **15 dakikada bir** okur.
- SAP'ta torç ve ara paket uzunluğuna göre ayrı stok kalemi yoktur; bu
  seçenekler makinenin SAP kaleminin stoğunu gösterir
  ([IS-KURALLARI.md](IS-KURALLARI.md) › Zenweld depo stoğu).
- Site siparişleri SAP'a **satış siparişi** olarak kaydedilir (SAP'ın
  sipariş API'siyle, ör. `SALES_ORDER`). SAP belge numarası ve aktarım
  durumu panelde sipariş detayında görünür (K-108).
- Açık konu: görünümün kolonları, bağlantı bilgileri ve sipariş API'sinin
  ayrıntıları SAP ekibinden gelecek
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Şirketten öğrenilecekler › SAP
  danışmanı).

### K-93 · SAP stok okumasında yarım okuma koruması
- Önceki okumada en az 10 kalem stoktayken yeni okumada stoktaki kalem
  sayısı bunun yarısının altına düşerse okuma uygulanmaz; son stok kalır,
  hata okuma kaydına yazılır.
- Okuma doğruysa elle zorla uygulanır (`npm run sap:stok zorla`).
- **Neden:** Yarım gelen ya da bozuk bir okuma bütün ürünleri bir anda
  STOKTA YOK yapmasın. Bayi dosyalarında aynı durum uyarı verir; otomatik
  işte uyarıyı görecek kimse olmadığı için okuma reddedilir.

---

## 6. Üyelik ve hesap

### K-34 · Yeni üye onay beklemez
- Üye olan kişi hemen siteyi kullanır; panelden onay gerekmez.
- "Onay Bekliyor" üyelik durumu yoktur; durumlar Aktif ve Askıda.

### K-35 · Yönetici kendini kilitleyemez
- Yönetici kendi rolünü değiştiremez ve kendini askıya alamaz.
- Son aktif yöneticinin rolü düşürülemez, askıya alınamaz, silinemez.
- **Neden:** Tek yönetici kilitlenirse panele kimse giremez.

### K-36 · Üye silinince adresleri de silinir
- Üyenin kayıtlı adresleri onunla birlikte silinir.
- Siparişleri, teklifleri, servis talepleri ve yorumları geçmiş kayıt
  olarak kalır.

### K-37 · Hesabım kolaylıkları
- Hesabım menüsünde özet sayfasına dönmek için **Genel Bakış** vardır.
- Garantilerim'de yeni garanti kaydı, Adreslerim'de yeni adres eklenir;
  ödeme ekranında kayıtlı adres seçilir ya da yeni adres eklenir.
- Ürün sayfasında favori kalbi **Sepete Ekle düğmesinin yanındadır.**

### K-68 · Üye hesabını kendisi siler; KVKK başvuru formu ileride düşünülecek
- Hesabım › Profil'de **Hesabımı Sil** vardır (seçenek 2a): üye
  şifresiyle onaylayıp hesabını hemen siler (panelden silmeyle aynı
  kural).
- Önerilen diğer yol (seçenek 2b), Hesabım'da "Verilerimle ilgili
  başvuru" formudur (talep e-postayla Zenweld'e gider, işlemi yönetici
  yapar). Bugün yoktur; **ileride düşünülecek**.
- Silinen hesabın diğer kayıtlarındaki kişisel verilerle ilgili açık
  konular: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Hesap silme — açık
  konular (2b için madde 10).

### K-94 · Üyelik: oturum süresi, şifre, giriş mesajı ve deneme sınırı
- Veritabanı modunda (üyelik sunucuda):
  - **Oturum süresi:** Sitede 30 gün; her ziyarette uzar. Panelde
    girişten 8 saat sonra biter; uzamaz.
  - **Şifre:** Yeni şifre en az 8 karakter. Var olan şifreler etkilenmez.
  - **Giriş hata mesajı:** Tek mesaj: "E-posta ya da şifre hatalı."
    ("Hesap bulunamadı" / "şifre hatalı" ayrımı bir e-postanın üye olup
    olmadığını ele veriyordu.)
  - **Yanlış şifre sınırı:** Bir hesaba 15 dakikada 10 yanlış denemeden
    sonra o hesaba 15 dakika giriş yapılamaz: "Çok fazla deneme yapıldı.
    15 dakika sonra tekrar deneyin."
- **Neden:** Güncel güvenlik önerileri; müşteri sık sık giriş yapmak
  zorunda kalmasın, panel ise iş günü sonunda kapansın.

### K-95 · Şifre sıfırlama bağlantısı
- "Şifremi unuttum"da hesap olsa da olmasa da aynı mesaj gösterilir.
- Hesap varsa e-postayla tek kullanımlık bir bağlantı gider; bağlantı
  **1 saat** geçerlidir.
- Aynı hesap için **15 dakikada en fazla bir** bağlantı üretilir; yeni
  bağlantı eskisini geçersiz kılar.
- Yeni şifre belirlenince üyenin bütün oturumları kapanır; üye giriş
  sayfasına gider.
- **Neden:** Bağlantı ele geçse de kısa süre ve tek kullanım zararı
  sınırlar; sık istek e-posta kutusunu doldurmasın.

### K-96 · Favoriler ve adresler üyenin hesabında
- Veritabanı modunda:
  - Giriş yapmış üyenin adresleri ve favorileri hesabında tutulur; her
    cihazda aynı liste görünür.
  - Giriş yapmadan eklenen favoriler tarayıcıda durur. Üye giriş yapınca
    bunlar hesaptaki favorilere eklenir ve tarayıcıdan silinir.
  - Çıkışta favoriler hesapta kalır; sitede kalpler boş görünür.
  - Üye başına en fazla **20 adres** ve **500 favori**.
- **Neden:** Üye favorisini telefonda da bilgisayarda da görsün; sınırlar
  tek bir hesabın sınırsız kayıtla veritabanını şişirmesini önler.

---

## 7. Garanti ve servis

### K-38 · Garanti kayıt formu
- Alanlar: Ad Soyad, e-posta, telefon, şehir, posta kodu, adres, ürün
  kategorisi, model, seri numarası, satıcı VKN ve "12 ay ücretsiz garanti
  uzatması istiyorum" (boş gelir).
- Satın alma tarihi sorulmaz; garanti kayıt tarihinden başlar.

### K-39 · Aynı seri numarası iki kez kaydedilemez
- "Bu seri numarası daha önce kaydedilmiş." uyarısıyla kayıt engellenir.

### K-40 · "+12 ay" ve 29 Şubat
- Panelde "+12 ay" mevcut bitiş tarihine 12 ay ekler, kaldırılınca 12 ay
  çıkarır; elle girilmiş tarih korunur.
- Bitiş 29 Şubat ise açıp kapatınca tarih bir gün kayar (1 Mart). Bu
  **bilerek düzeltilmedi.**
- **Neden:** Çok nadir (dört yılda bir gün) ve tarih elle
  düzeltilebiliyor; "ay sonuna sabitleme" de kaymayı tamamen gidermiyor,
  ek bir alan gerektiriyor.

### K-41 · Servis talebi formu
- Destek ve Garanti › Servis Talebi.
- Alanlar: makine türü (Kaynak ve Lazer makineleri altındaki
  kategoriler), model, talep nedeni (Kurulum, Bakım, Onarım,
  Kullanım/Bakım Eğitimi), 400 karakterlik şikayet, iletişim bilgileri ve
  zorunlu gizlilik onayı.
- Talepler panelde Servis Talepleri'ne düşer.

---

## 8. İçerik

### K-42 · Yayın kaydedildiği anda başlar
- Haber, blog ve etkinlik "Yayında" işaretliyse kaydedildiği anda
  görünür. İleri tarihli (zamanlanmış) yayın yoktur ve istenmiyor.
- Yayın tarihi yalnızca sıralama ve gösterim içindir.

### K-43 · Haberler blog düzeninde, manşet yok
- Haberler sayfasında manşet yok; bütün haberler aynı boyutta kartlarla.
  Haberdeki "öne çıkan / manşet" alanı kaldırıldı.
- Haber görselleri kırpılmaz (afiş ve grup fotoğraflarındaki yazı ve
  kişiler kesilmesin).

### K-44 · Etkinliklerde "öne çıkan" yok
- Etkinlikteki "Öne çıkan" seçeneği kaldırıldı.
- **Neden:** Sitede hiçbir etkisi yoktu.

### K-45 · Panelden yönetilen içerik
- Sık sorulan sorular, 11 yasal metin, Hakkımızda, satış temsilcileri,
  belge sayfaları (MSDS, Kaynak Rehberi, Parti Sertifikaları), kategori
  ve gruplar panelden yönetilir.
- Anasayfanın kayan tanıtım alanı panelden yönetilir (Anasayfa Tanıtım):
  sayfaların sırası, yazıları, maddeleri, etiketleri, görünümü, görseli,
  düğmeleri ve yayın tarihi.
- Yasal metinlerin adresi ve sırası sabittir.

### K-46 · Kaldırılan içerikler
- "%100 Yerli Üretim" ifadesi her yerden ve "Geri Çağırma" sayfası
  kaldırıldı.

### K-47 · Anasayfa düzeni
- Sıra: kayan tanıtım alanı (Zenweld, Force Serisi, Jasic Lazer), güven
  şeridi, kategori kartları, Force Serisi ve Jasic Lazer Ürünleri
  şeritleri, Kampanyalı Ürünler, Ürün Seçici bandı, Bayi ve Servis
  haritası, Neden Zenweld?, Müşterilerimiz Ne Diyor?, kurumsal teklif ve
  bayilik kartları, Sık Sorulan Sorular ve Blog.
- Kategoriye göre ürün listesi yerine kategori sayfalarına giden kartlar
  vardır.
- Güven şeridindeki yazılar sabittir; bayilere, mağaza ayarlarına ya da
  şirket bilgilerine bağlı değildir. Değişmesi için kodda düzenlenir.
- Kurumsal sayfanın başlığı ve metni, Neden Zenweld? metinleri ve güven
  şeridine eklenecek bilgiler sahibinden gelecek.
- Tam sıra: [WEBSITE-KULLANIM.md › Anasayfa](WEBSITE-KULLANIM.md#3-anasayfa).

### K-114 · Force serisinin tanıtım sayfası
- Üst menüde ilk başlık **FORCE**'tur; menüsü yoktur, doğrudan Force
  sayfasını (`/force`) açar. Anasayfa tanıtım alanındaki "Force Serisini
  İncele" de buraya gelir.
- Sayfada dört makine tanıtılır: ForceMIG 200, ForceTIG 200, ForceArc 200,
  ForceCut 45. Fotoğraflar sahibinden; sloganları ve kısa açıklamaları
  sahibinin onayıyla şimdilik kodda yazılıdır. Panelden yönetim ve yeni
  fotoğraf/video sonra eklenir.
- Sayfa sade ve hafiftir: makineler ve kaynak ustası kaydırınca yerinden
  oynamaz; kıvılcım, yanıp sönen çizgi, sayaç, sıra numarası ve "Kaydırın"
  yazısı yoktur. Aşağı inildikçe yalnızca yumuşak belirme vardır.
- Teknik tabloda ziyaretçi modelleri işaretler; tablo yalnızca seçtiklerini
  yan yana gösterir (Model Serisi "Force" olan yayındaki ürünler arasından;
  açılışta tanıtılan dört makine seçili, aynı anda en fazla 4). Her
  kolonun altında fiyat, Sepete Ekle ve favori kalbi. Fiyat, stok ve teknik
  özellikler ürün kayıtlarından gelir.
- Kapanışta Yetkili Bayi Bul düğmesi yoktur: başlığın altında Destek ve
  Garanti, onun altında Force bayileri haritası (K-115).

### K-115 · Force bayileri
- Panelde Bayiler'de bir bayi **Force Bayi** olarak işaretlenebilir.
- İşaret yalnızca Force sayfasının en altındaki Türkiye haritası içindir:
  haritada Force Bayi işaretli ve aktif bayiler görünür. İşaret sitenin
  başka hiçbir yerinde etiket ya da rozet olarak gösterilmez.
- Örnek veride bütün bayiler Force Bayi işaretlidir.

---

## 9. Formlar, yasal metinler ve e-posta

### K-48 · Onay kutuları
- Onay kutuları **boş gelir.**
- Kutu yalnızca gerçekten gereken yerdedir:
  - üye olurken Kullanım Koşulları (zorunlu) ve kampanya e-postası izni
    (isteğe bağlı);
  - ödemede Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi
    (zorunlu);
  - servis talebinde gizlilik onayı (zorunlu);
  - alt bilgideki bülten kaydında pazarlama izni (kayıt için
    işaretlenmeli).
- Kişisel veri alan formlarda KVKK için **bilgilendirme notu** vardır
  ("Kişisel verileriniz KVKK Aydınlatma Metni kapsamında işlenir."); açık
  rıza kutusu yoktur. Bayilik ve Teklif Al'daki rıza kutuları bu yüzden
  kaldırıldı.
- Formlardaki yasal bağlantılar **yeni sekmede** açılır; form kaybolmaz.
- **Neden:** Başka bir hukuki sebep varken açık rıza istemek KVKK
  açısından yanıltıcı sayılabilir. Kesin metin için hukukçuya
  danışılmalı.

### K-49 · Çerez bandı
- İlk ziyarette "Tümünü Kabul Et", "Tümünü Reddet" ve "Tanımlama Bilgisi
  Ayarları" çıkar; seçim tarayıcıda hatırlanır.
- Ayarlar penceresi şimdilik boştur.
- **Neden:** Bugün analiz/reklam çerezi yok, ama eklendiği an zorunlu
  olacak.

### K-50 · Form e-postaları info@zenweld.com'a
- Sitedeki formlar `info@zenweld.com`'a e-posta gönderir. Veritabanı
  modunda form türü başına başka alıcı yazılabilir (K-104); yazılmayan
  tür yine buraya gider.
- **Alt bilgideki bülten kaydı info@'a gitmez** (bülten servisi seçilince
  bağlanacak).

### K-51 · Yasal metinler taslaktır
- 11 yasal metnin bugünkü içeriği taslaktır ve aramaya kapalıdır.
- Canlıdan önce hukuk danışmanı yazmalıdır.

### K-98 · Formlar sunucuda: e-posta formlarının kaydı ve spam koruması
- Veritabanı modunda yalnızca e-postaya giden formlar da (iletişim,
  bayilik başvurusu, ürün destek sorusu) kendi tablolarına
  yazılır; gönderilen her e-posta `email_log`'a kaydedilir (K-81'in
  uygulanışı).
- Spam koruması olarak şimdilik görünmez bot tuzağı yeterlidir. İstek
  sınırı ve bot doğrulaması (Turnstile) canlıya hazırlıkta eklenir;
  canlıdan önce şarttır.
- **Neden:** Tablolar hazırdı; istek sınırı için paylaşılan sayaç ve
  sunucu kararı gerekiyor.

### K-100 · Form kayıtları panelde: yer ve silme
- Sitedeki formlardan gelen kayıtlar için iki ekran vardır:
  - **Bayilik Başvuruları** sol menüde "Bayi ve Satış Ağı" grubunda,
    Bayiler'in yanında;
  - **Mesajlar** (iletişim formu ve ürün destek soruları) "Müşteriler ve
    Servis" grubunda.
- Bu kayıtlar (başvuru, mesaj) panelden silinmez. Silme, KVKK saklama
  süresi kararıyla birlikte ele alınır.
- **Neden:** Bayilik başvurusu Bayiler'in yanında kolay bulunur. Kişisel
  veri içeren kayıtların ne kadar saklanacağı henüz belli değil;
  yanlışlıkla silinmesin.

### K-104 · E-posta alıcıları Mağaza Ayarları'nda ayrı sekme; belgelerde dosya yükleme depoyla
- **E-posta alıcıları:** Zenweld'e giden e-postaların (sipariş, iade,
  teklif, servis, garanti, yorum, üyelik, iletişim, ürün destek, bayilik)
  alıcıları panelde Mağaza Ayarları › **E-posta
  Alıcıları** sekmesinde, form türü başına yazılır. Alıcısı yazılmayan
  tür varsayılan adrese (`SUPPORT_EMAIL`, yoksa info@zenweld.com) gider.
  Veritabanı modunda geçerlidir.
- **Belgeler (MSDS vb.):** Veritabanı modunda dosya deposu ayarlı değilse
  Belgeler ekranında dosya yüklenmez, yalnızca dosyanın adresi girilir
  (K-101 ile aynı mantık). Dosya deposu ayarlıysa dosya yüklenir (K-108).
- **Neden:** Sahibinin kararı. Alıcılar mağazanın işleyişine ait bir
  ayardır. Dosyanın kendisi veritabanına konmaz; depo gelince taşınması
  gerekmesin.

---

## 10. Arama motorları ve adresler

### K-52 · Site yalnızca zenweld.com'da aramaya açık
- Site yalnızca `zenweld.com` ve `www.zenweld.com` adreslerinde arama
  motorlarına açıktır. Demo adresi, önizlemeler ve yerel bilgisayar her
  zaman kapalıdır. Ayar gerekmez.
- **Neden:** Bir ayar unutulsa bile demo aramaya düşmesin.

### K-53 · robots.txt gizli sayfaları engellemez
- `robots.txt` yalnızca `/api/` adresini kapatır. Panel, hesap gibi
  sayfalar "noindex" etiketiyle kapalıdır ama taramaları engellenmez.
- **Neden:** Google sayfayı tarayamazsa "noindex" etiketini de göremez ve
  adresi başka yerden bulursa yine dizine alabilir. Panel adresi de böylece
  `robots.txt`'de ilan edilmemiş olur.

### K-54 · Blog site haritasında
- Blog yazıları site haritasına girer.
- **Neden:** SEO için önemli; sonradan unutulmasın.
- Dikkat: örnek blog yazılarının metni yer tutucudur; canlıdan önce
  değiştirilmeli ya da yayından kaldırılmalı.

### K-55 · SEO alanları
- Ürün, kategori, grup, blog, haber ve etkinlikte SEO sekmesi vardır:
  link, sayfa başlığı, açıklama, anahtar kelimeler, Google önizlemesi.
- Sabit sayfalarda (Sayfa SEO ekranı) yalnızca başlık ve açıklama
  değişir; **link değişmez**, anahtar kelime alanı yoktur.
- Linki değişen kaydın eski linki yeni linke yönlenir.
- **Neden:** Sabit sayfaların adresleri menüye ve sayfalar arası
  bağlantılara bağlı; değişirse bağlantılar kırılır.

### K-56 · Sade adresler
- `/kesfet` öneki kaldırıldı; sayfalar üst seviyededir (`/sss`, `/blog`,
  `/garanti` …).
- Yasal sayfalar `/yasal/...` altındadır.

---

## 11. Panel

### K-57 · "Veri Yönetimi" kaldırıldı
- Paneldeki Veri Yönetimi ekranı kaldırıldı; örnek veriler kalır.
- **Neden:** Backend geliştirmesine geçilecekti.

### K-58 · Her silme onay ister
- Panelde her silme işleminden önce onay sorulur.

### K-59 · Zorunlu alanlar gerçekten zorunlu
- Bayi adı ve şehri, online satıcının adı ve site adresi boş
  kaydedilemez.
- Servis talebinde Kaydet'ten sonra "Kaydedildi" yazar.
- Görünüm ekranının açıklaması, ayarların etkilediği bütün metinleri
  sayar.

### K-60 · Kullanılmayan alanlar kalır
- Kategori/grup numarası (`code`), kategori simgesi (`icon`), bayi
  e-postası, satıcı logo adresi ve teklif satırı notu bugün kullanılmıyor
  ama **silinmez**; ileride kullanılmak üzere veritabanında da durur
  ([VERITABANI.md](VERITABANI.md#19-kullanılmayan-alanlar)).

### K-61 · Ürün → kategori bağı veritabanında kimlikle
- Demo verisinde ürün, servis talebi ve garanti kategoriye; kategori
  gruba **linkle** bağlıdır. Panel bunu doğru yönettiği için sorun yoktur.
- Veritabanında bu bağlar kimlikledir (`category_id`).

### K-99 · Panel veritabanına alan alan geçti; aynı kaydı iki kişi düzenlerse
- Panel veritabanına alan alan geçti; her alanda o alanın ekranları hem
  okur hem yazar. Sıra: Satış; Talepler; Katalog; Bayiler, satıcılar ve
  stok; İçerik ve ayarlar; Üyeler, İşlem Kaydı ve E-posta Kaydı; en son
  panel ana sayfası.
- İki yönetici aynı kaydı aynı anda düzenlerse: kayıt, yönetici ekranı
  açtıktan sonra değişmişse (başka yönetici, müşteri ya da sistem)
  kaydedilmez; "Bu kayıt siz açtıktan sonra değişti; sayfayı yenileyin."
  yazar. Bütün ekranlarda geçerlidir.
- Panelde yapılan her değişiklik ve panele giriş/çıkış, değişiklikle aynı
  işlemde `audit_log`'a yazılır (K-81'in uygulanışı).
- **Neden:** Her alan bitince o ekranlar gerçekten veritabanıyla çalıştı
  ve denenebildi; okuma ve yazma ayrı adımlarda yapılsaydı ekranlar arada
  yarım kalırdı. Son kaydeden öncekinin değişikliğini sessizce silmesin.

### K-101 · Veritabanı modunda görsel, dosya deposu yoksa adresle girilir
- Veritabanı modunda dosya deposu ayarlı değilse panelin görsel
  alanlarına dosya yüklenmez: görsel adresi (tam adres ya da sitedeki
  `/images/…` yolu) girilir; kayıtlı görseller görünmeye devam eder.
- Dosya deposu ayarlıysa görsel depoya yüklenir (K-108).
- Sunucu, yüklenmiş dosya (`data:` adresi) içeren kaydı reddeder.
- Demo modunda yükleme değişmez.
- **Neden:** Yüklenen dosya kaydın içine yazılırsa veritabanı ve site
  sayfaları büyür; dosya deposu gelince bu görseller yeniden taşınmak
  zorunda kalır.

### K-103 · Stok geçmişi, Satış Temsilcileri ve başvurudan bayi açma
- **Stok geçmişi:** Veritabanı modunda bayi ve satıcıların stok
  geçmişinin (dosya yükleme, elle düzeltme, geri alma) bütün kayıtları
  saklanır; demodaki "kaynak başına son 60 kayıt" sınırı yoktur.
  - Geri alma için stokun önceki hali yalnızca son 5 dosya yüklemesinde
    tutulur; ekranda son 30 işlem görünür.
  - Bayi ya da satıcı silinince geçmişi de silinir (silme işlem kaydında
    kalır).
- **Satış Temsilcileri** panelde "Bayi ve Satış Ağı" menüsünde durduğu
  için bayilerle aynı adımda veritabanına geçti.
- **Bayilik başvurusundan bayi açma** şimdi yapılmaz. Başvuru onaylanınca
  neler olacağı sahibiyle birlikte tasarlanacak
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Bayilik başvurusundan bayi
  açma).
- **Neden:** Sahibinin kararı. Geçmiş kayıtları küçüktür ve kişisel veri
  içermez; tarayıcı deposundaki sınır veritabanında gerekmez.
  Temsilciler bayi ağıyla aynı menüde yönetilir.

### K-105 · Şirket bilgileri panelden; iade süreci ve şifre sıfırlama e-postası konuşulacak
- Panelden değişir (Mağaza Ayarları):
  - **Şirket ve iletişim bilgileri:** unvan, ofis adresleri, telefonlar,
    e-posta ve sosyal medya bağlantıları (eskiden kodda sabitti);
  - **MERSİS numarası:** sözleşmelerin Satıcı bölümüne yazılır (boşsa
    "[—]");
  - **Kargo takip bağlantısı:** her kargo firmasına takip adresi.
- Yöneticinin kendi şifresini panelden değiştirmesi şimdi yapılmaz
  (YAPILACAKLAR'da).
- İade (cayma) süreci ve şifre sıfırlama e-postasının ayarları şirketle
  konuşulup karar verilecek; o zamana kadar bugünkü düzen değişmez
  (YAPILACAKLAR'da).
- **Neden:** Sahibinin kararı.

### K-109 · Demo modunda panel ekranları gizlenmez; form kayıtları tarayıcıda tutulur
- İşlem Kaydı ve E-posta Kaydı demo modunda da Ayarlar menüsündedir.
  Kayıt yalnızca veritabanı modunda tutulduğu için demoda tablo boştur ve
  kaydın veritabanına bağlanınca tutulacağını yazar ("demo" kelimesi
  geçmez; K-02).
- İletişim formu, ürün destek sorusu ve bayilik başvurusu demo modunda
  e-postayla birlikte tarayıcıya da kaydedilir; Mesajlar ve Bayilik
  Başvuruları ekranlarında aynı tarayıcıda görünür. Durum ve not çalışır
  (K-100'deki silinmeme kuralı aynen geçerli). Veritabanı modunda bu kayıtlar yalnızca sunucudadır.
- **Neden:** Sahibi yayındaki (demo) sitede bu ekranları göremedi ve
  yapılan işin görünmesini istedi. Demoda boş ya da gizli ekran, ekranın
  hiç yapılmadığı izlenimini veriyor.

---

## 12. Sunucu ve veritabanı

### K-81 · Sunucu veritabanı PostgreSQL; formlar ve panel değişiklikleri de saklanır
- Sunucu veritabanı **PostgreSQL 18**'dir (en uzun destek süresi; BT 18
  veremezse en az 16).
- Sunucuyu (AWS, Google Cloud gibi) BT ekibi sağlar. Geliştirme yerel bir
  PostgreSQL ile yapılır; tabloları kuran betikler depoda durur ve her
  ortamda aynı çalışır.
- Formlar kendi tablolarında saklanır: bayilik başvuruları
  (`dealer_applications`), iletişim ve ürün destek mesajları
  (`support_messages`). Sahibinin isteğiyle kupon (`coupons`, `coupon_targets`,
  `coupon_redemptions`) ve kargo (`carriers`, `shipments`) tabloları da
  eklendi.
- Panelde yapılan her değişiklik kaydedilir: kim, ne zaman, hangi
  kayıtta, eski ve yeni değer. Panele giriş ve çıkışlar da yazılır.
  Kayıtlar 2 yıl saklanır.
- Gönderilen her e-postanın sitenin hangi özelliği (İletişim, Servis
  Talebi…) ve sayfası için gönderildiği kaydedilir. E-posta alıcıları
  türe göre tutulur (K-104).
- Kişisel verilerin saklama süresi avukata sorulacak
  ([VERITABANI.md](VERITABANI.md) › Açık sorular).
- Ayrıntı: tablolar ve kolonlar [VERITABANI.md](VERITABANI.md).

### K-87 · Next.js 16'ya geçildi
- Site veriyi veritabanından okumaya başlamadan önce Next.js 16'ya
  geçildi (önce canlı sunucu kararına bağlanmıştı; sahibi öne aldı).
- Derleme Turbopack ile yapılır. Kod denetimi derlemeden önce çalışır
  (16'da derleme bunu kendisi çalıştırmıyor).
- 16'nın getirdiği "efekt içinde setState" kuralı kapalıdır: sepet,
  favoriler, teklif listesi, oturum ve çerez tercihi tarayıcı deposundan
  bilerek sayfa açıldıktan sonra okunur; bu bileşenler yeniden yazılınca
  kural açılır ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Next.js 16).
- **Neden:** Sayfaların önbellek düzeni 16'nın yöntemiyle bir kez
  kurulsun; açık kalan güvenlik uyarıları kapansın.

### K-88 · Veri kaynağı ayrı bir ayarla seçilir; değişiklik en geç bir dakikada görünür
- Sitenin veriyi veritabanından mı yoksa tarayıcıdan mı okuyacağı ayrı
  bir ayarla seçilir: `DATA_SOURCE=database`. Bağlantı adresi
  (`DATABASE_URL`) tanımlı diye kendiliğinden veritabanına geçilmez;
  ayar yoksa site demo modunda çalışır.
- Veritabanı modunda panel bir kaydı değiştirince etkilenen sayfalar o
  anda yenilenir (`refreshSite`; elle `npm run site:yenile`).
- Ayrıca okunan veri ve sayfa 30'ar saniye önbellekte tutulur; böylece
  her değişiklik en geç bir dakikada görünür (yedek).
- **Neden:** Geçiş boyunca demo çalışmaya devam etsin; geliştirici
  bilgisayarında panel ile site birbirinden kopmasın.
- Ayrıntı: [SUNUCU.md](SUNUCU.md) › 6.

### K-90 · Bugünkü veri, yüklenecek veri sayılır; gerçekler zamanla gelir
- Verilerin gerçek olup olmadığına bakılmadan sistemin tamamı kurulur.
- Sitede bugün bulunan katalog, içerik, ayarlar, bayi ağı ve benzeri
  veriler sahibinin şimdilik verdiği veri sayılır; gerçek değerleri
  sahibi zamanla tek tek verir. Sitedeki sabit yazılar
  (`packages/i18n/src/tr.ts`) da değişebilir.
- Bu yüzden veri yükleme komutu bugünkü verinin tamamını yükler; örnek
  satış hareketleri (panel grafikleri için üretilen üye, sipariş, teklif,
  servis ve garanti kayıtları) yüklenmez (K-91).

### K-91 · Canlıya ve denemeye ne yüklenir
- Veri yükleme komutu (`npm run db:yukle`) iki hedefle çalışır:
  - **Canlı:** katalog, içerik, mağaza ayarları, bayiler, satıcılar ve
    depo stoğu.
  - **Deneme:** bunlara ek olarak örnek yorumlar, kuponlar ve bayi/satıcı
    stok listeleri (site dolu görünsün, her şey denenebilsin).
  - **Hiçbir yere:** demo hesaplar ve örnek üyeler, adresler, siparişler,
    teklifler, iadeler, servis talepleri, garantiler.
- Komut hiçbir kaydı silmez ve tekrar çalıştırılabilir.
  - Varsayılan olarak yalnızca eksik kayıtları ekler; paneldeki
    değişikliklere dokunmaz.
  - `guncelle` yazılırsa farklı olan kayıtları bugünkü veriyle değiştirir
    (paneldeki değişiklikler kaybolur).
  - Depo ve bayi stoğunun üzerine hiç yazmaz.
- **Neden:**
  - Demo hesapların şifreleri README'de (GitHub'da) yazılı; canlıda panele
    herkes girebilirdi.
  - Örnek satış kayıtları panel rakamlarını bozar, ileride SAP'a gerçek
    sipariş olarak gidebilir; uydurma garanti seri numaraları sorguda
    "kayıtlı" görünür.
  - Örnek yorumlar gerçek müşteri yorumu değildir; canlıda yayınlamak
    yanıltıcıdır. Örnek kuponlar canlıda gerçekten indirim verir. Örnek
    bayi stokları uydurmadır; gerçek listeler bayilerden dosyayla gelir.

### K-92 · Canlı site kendi sunucumuzda, kendi alan adımızla
- Canlı site Vercel'de yayınlanmaz; kendi sunucumuzda ve kendi alan
  adımızla çalışır. Bugünkü demo Vercel'de kalır.
- Site sunucuda standart Node.js uygulaması olarak çalışır
  (`npm run build` + `npm start`). Sunucunun yeri (KVKK) ve kurulumu
  (HTTPS, yedek, izleme) BT ile belirlenir.
- Zamanlanmış işler (ör. SAP stok okuma) sunucunun kendi zamanlayıcısıyla
  çalışır.
- Tek sunucuda Next'in kendi önbelleği yeterlidir; birden fazla sunucu
  çalışırsa önbellek ortak bir yerde (ör. Redis) tutulmalıdır.
- Vercel'e özel parçalar (`vercel.json`, adresin Vercel değişkenlerinden
  bulunması) demo Vercel'den kalkınca kaldırılır.

### K-108 · Dış bağlantılar değiştirilebilir parça olarak kurulur: ödeme, SAP sipariş, dosya deposu
- K-107'nin uygulanışı. Esnek olmayan üç dış bağlantı, şirketten cevap
  beklemeden ve bugünkü davranış bozulmadan değiştirilebilir parçaya
  ayrıldı:
  1. **Kartla ödeme:** Kartın programını bulan ve tahsilatı yapan ödeme
     sağlayıcısı parçası (`packages/db/src/payment.ts`). Bugünkü temsili
     ödeme ilk sağlayıcıdır; kuruluş seçilince onun parçası eklenir ve
     sunucudaki `ODEME_SAGLAYICI` ayarıyla seçilir. Her kartlı siparişte
     sağlayıcının sonucu `payment_transactions`'a yazılır.
  2. **SAP'a sipariş aktarımı:** Ödemesi kesinleşen sipariş aktarım
     sırasına (`sap_order_exports`) girer; zamanlanmış iş gönderir,
     başarısızsa yeniden dener; panelde durum ve hata görünür. SAP'a
     yazan parça bilgiler gelince eklenir; o zamana kadar siparişi
     dosyaya yazan deneme parçası çalışır (`SAP_SIPARIS_DOSYASI`).
  3. **Dosya deposu (fotoğraf ve belgeler):** Sunucuda tek bir dosya
     deposu parçası; ilk hali sunucunun diski (`DOSYA_KLASORU`). BT başka
     bir depo seçerse o eklenir. Depo ayarlıysa veritabanı modunda panelde
     görsel ve belge yüklenir; ayarlı değilse K-101 ve K-104'teki gibi
     adres girilir.
- **Neden:** Sahibinin kararı. Teknik konularda şirketten gelecek
  cevaplar ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Şirketten
  öğrenilecekler) yalnızca bağlantı parçasını değiştirsin, sitenin geri
  kalanını değil.

---

## 13. Çalışma şekli ve belgeler

### K-62 · Belgeler
- Siteyi tanımlayan belgeler deponun `docs/` klasöründe, düz Markdown
  olarak tutulur (Obsidian kullanılmaz; standart bağlantılar).
- Demo hesapların giriş bilgileri ve test kartı **yalnızca README'de**
  yazar; başka dosyaya eklenmez.
- STOK.md ayrı kalır (bayilere gönderilecek dosya biçimini de anlatır).
- Her kod değişikliğinde ilgili belge de güncellenir (bkz. `CLAUDE.md`).
- **Neden:** Siteyi devralan kişi ya da yeni bir geliştirme oturumu,
  tasarım dışındaki bütün özellikleri bu dosyalardan kurabilsin.

### K-63 · Çalışma şekli
- Yanıtlar Türkçe; işler madde madde ve onayla ilerler.
- Büyük değişiklikten önce açıklama yapılıp onay alınır; istenmeyen şey
  yapılmaz; silmeden önce söylenir; gereksiz kod bırakılmaz.
- Geliştirme tek dalda yürür (`claude/tender-knuth-9it4y3`).

### K-66 · Otomatik kod biçimlendirici (Prettier) kullanılmaz
- Kod denetimi (ESLint) kuruludur; Prettier kurulmaz.
- **Neden:** İlk kurulumda 189 dosyanın yalnızca yazım düzenini
  değiştirecekti; kodun düzeni zaten tutarlı.

### K-67 · GitHub'da otomatik kontrol (CI) şimdilik yok
- Tip kontrolü, kod denetimi, testler ve derleme her gönderimde GitHub'da
  kendiliğinden çalışmaz; geliştirici elle çalıştırır (CLAUDE.md ›
  Doğrulama).
- İleride kurulabilir ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Kod
  incelemesi bulguları 3).

### K-89 · `next dev`'in yazdığı AGENTS.md depoya girmez
- Next.js 16'nın geliştirme sunucusu (`npm run dev:web`) her çalıştığında
  `apps/zenweld-web/AGENTS.md` dosyasını kendiliğinden yazar (yapay zekâ
  araçlarına Next.js notu). Bu dosya Git'te görmezden gelinir
  (`.gitignore`); depoya eklenmez.
- **Neden:** Projenin çalışma kuralları `CLAUDE.md` ve `docs/`'ta; aracın
  ürettiği dosya her geliştirici bilgisayarında değişiklik olarak
  görünmesin.

### K-106 · Derin ayar gerektiren konular en sonda ayrı ayrı ele alınır
- Fotoğraflar, belgeler, SEO, kargo, iade, SAP ayarları ve stok kontrolü,
  SAP'a sipariş kaydı, API ayarları, banka ve ödeme ayarları ile
  e-postalar, panelin veritabanına geçişinden sonra sahibiyle ayrı ayrı,
  derinlemesine konuşulup düzenlenir.
- O zamana kadar bugünkü düzen kalır; bu konularda kendiliğinden ayar ya
  da tasarım yapılmaz.
- Liste: [YAPILACAKLAR.md](YAPILACAKLAR.md) › Sonda ayrı ayrı ele
  alınacak konular.
- **Neden:** Sahibinin kararı; her biri ayrı ayrı derin ayar gerektiren
  konular.

### K-107 · Sonraya kalan konularda o adımda gereken kadarı, genişletilebilir yapılır
- K-106'daki konulardan biri bir adımda gerekirse o adımın ihtiyacı kadarı
  yapılır; ileride gelebilecek bağlantıya (kargo firmasının API'si, SAP,
  ödeme kuruluşu…) açık, genişletilebilir kurulur. Derin ayarlar yine en
  sonda sahibiyle konuşulur (K-106).
- Örnek, kargo takibi: her kargo firmasına takip sayfasının adresi
  girilir (`{takip}` yerine takip numarası); müşteri ve panel sipariş
  detayında bağlantı çıkar. Bağlantı tek yerden üretilir
  (`packages/data/src/shipping.ts`); firma API verirse firma kaydına
  bağlantı türü, sunucuya o firmanın bağlantı parçası eklenir.
- **Neden:** Sahibinin kararı: "kargo firması bana bir API verecekse
  esnek olsun, geliştirilebilir olsun"; diğer konular da aynı şekilde.

### K-110 · Her özellik iki modda da denenir
- Bir özellik hem demo modunda hem veritabanı modunda denenir.
- Yalnızca bir modda görünen ekran, sekme ya da düğme varsa bu sahibine
  söylenir; sessizce gizlenmez.
- Kural CLAUDE.md › Teknik kurallar › Doğrulama'dadır; iki modun
  farkları README › Demo ve veritabanı modu'nda.
- **Neden:** Sahibi, yapıldığı söylenen İşlem Kaydı ve E-posta Kaydı
  ekranlarını yayındaki (demo) sitede göremedi; ekranlar demo modunda
  kendisine söylenmeden gizlenmişti (K-109). Sahibi kuralın CLAUDE.md'ye
  eklenmesini onayladı.
