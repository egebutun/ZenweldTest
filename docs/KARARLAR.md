# Kararlar — Ne Karar Verildi ve Neden

Bu dosya site ve panel için alınmış kararları, gerekçeleriyle birlikte
listeler. Amaç, devralan kişinin aynı tartışmaları baştan açmaması ve yeni
bir geliştirme oturumunun (Claude dahil) bu kararları "hata" sanıp
"düzeltmeye" kalkmamasıdır.

**Kural:** Buradaki bir karar değiştirilecekse önce site sahibine sorulur.
Karar değişirse bu dosyada güncellenir; eski hali "Değişti" notuyla bırakılır.

Kararların tarihi ilk alındığı gündür. Ayrıntılı davranış ilgili dosyada
yazar: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md),
[ADMIN-KULLANIM.md](ADMIN-KULLANIM.md), [VERI-MODELI.md](VERI-MODELI.md),
[IS-KURALLARI.md](IS-KURALLARI.md), [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md),
[STOK.md](STOK.md).

---

## İçindekiler

1. [Genel](#1-genel)
2. [Katalog ve ürün](#2-katalog-ve-ürün)
3. [Ürün seçenekleri](#3-ürün-seçenekleri)
4. [Satış, ödeme ve teklif](#4-satış-ödeme-ve-teklif)
5. [Bayiler, online satıcılar ve stok](#5-bayiler-online-satıcılar-ve-stok)
6. [Üyelik ve hesap](#6-üyelik-ve-hesap)
7. [Garanti ve servis](#7-garanti-ve-servis)
8. [İçerik](#8-içerik)
9. [Formlar, yasal metinler ve e-posta](#9-formlar-yasal-metinler-ve-e-posta)
10. [Arama motorları ve adresler](#10-arama-motorları-ve-adresler)
11. [Panel](#11-panel)
12. [Belgeler ve çalışma şekli](#12-belgeler-ve-çalışma-şekli)
13. [Henüz karar verilmemiş konular](#13-henüz-karar-verilmemiş-konular)

---

## 1. Genel

### K-01 · Site ve panel yalnızca Türkçe
- **Tarih:** 2026-10-18
- **Karar:** İngilizce tamamen kaldırıldı: adreslerde dil öneki yok
  (`/urun/...`), dil seçici yok, verilerde İngilizce alan yok. Eski `/tr/...`
  ve `/en/...` adresleri 404 verir.
- **Bilerek bırakılanlar:**
  - Anasayfadaki **"HOT SALE"** ifadesi İngilizce kalır (site sahibinin
    tercihi).
  - Arayüz metinlerinin durduğu `packages/i18n` klasörünün adı eski kaldı;
    içinde yalnızca Türkçe metinler var.

### K-02 · Sitede "demo" ibaresi yok
- **Tarih:** 2026-10-18
- **Karar:** Sitede ve panelde sitenin demo olduğunu gösteren hiçbir yazı
  yoktur.
- **Not:** Belgelerdeki "Demo notu" işaretleri yalnızca geliştiriciler
  içindir.
- **Ürün tanıtımı anlamında "demo" kalır (2026-10-22):** Fuar
  etkinliklerindeki "Uygulamalı Demo Gösterileri" ve "canlı demolar",
  satış temsilcisi unvanı "Demo ve Satış Sonrası Hizmetler Uzmanı" bu
  kararın kapsamında değildir. Tarayıcı testleri bu ifadelere izin verir
  (`tests/e2e/tarama.spec.ts`).

### K-03 · Bayiler sitenin müşterisi değildir
- **Tarih:** 2026-10-05 (bayi mağaza sitesinin kaldırılması 2026-10-09)
- **Karar:**
  - Bayiler sitede giriş yapmaz, hesap açmaz; üye olma sayfasında bayiler
    Bayilik Başvurusu'na yönlendirilir.
  - Ayrı bayi e-ticaret sitesi ve mağaza paneli kaldırıldı.
  - Zenweld ile bayiler arasındaki teklif ve siparişler ileride **ayrı bir
    B2B uygulamasında** yapılacak.
  - Paneldeki Siparişler, Teklifler ve Üyeler yalnızca ana sitenin
    kayıtlarıdır.
- **Neden:** Ana site son müşteriye ve kurumsal alıcıya satar; bayi
  ilişkisi ayrı bir iş akışıdır.

### K-04 · Panel sitenin içinde, ayrı oturumla
- **Tarih:** 2026-10-05
- **Karar:** Panel ayrı bir proje değil, sitenin içinde `/yonetim`
  adresindedir. Kendi giriş ekranı ve siteden ayrı oturumu vardır; sitede
  panele bağlantı yoktur. Yönetici hesabı sitede giriş yapamaz.
- **Neden:** Tek proje, tek adres; bakım kolaylığı.

---

## 2. Katalog ve ürün

### K-05 · Kategori ağacı
- **Tarih:** 2026-10-02
- **Karar:** Kategoriler Zenweld'in onaylı kategori ağacına göredir: 4 bölüm
  (Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri), 11 grup, 45
  kategori. Kategoride ürün olmak zorunda değildir.

### K-06 · Dört seviyeli katalog, kartlarla
- **Tarih:** 2026-10-18
- **Karar:**
  - Bölüm sayfası (`/ekipmanlar`) grupları, grup sayfası
    (`/ekipmanlar/kaynak-makineleri`) kategorileri **resimli kartlarla**
    gösterir; ürünler yalnızca kategori sayfasında listelenir.
  - `?grup=...` biçimindeki adresler kaldırıldı (404).
  - Kategori sayfasında aynı gruptaki diğer kategorilerin şeridi gösterilmez.
- **Neden:**
  - Parametreli adresin SEO değeri düşük; temiz adresli grup sayfaları
    "kaynak makinesi" gibi genel aramaları hedefler.
  - Her alt kategorinin ileride kendi filtreleri olacak (MMA ile TIG
    makinesinin filtreleri farklı); kardeş kategori şeridi buna uymaz.

### K-07 · Ürün adresi kategoriden bağımsız
- **Tarih:** 2026-10-20
- **Karar:** Katalog adresleri menüyü izler (`/bölüm/grup/kategori`), ürün
  adresi ise `/urun/<ürün>` olarak kalır.
- **Neden:** Kısa ve kalıcıdır; ürünün kategorisi değişse de adresi
  değişmez.

### K-08 · Ürün adında marka yok
- **Tarih:** 2026-10-20 (ek: 2026-10-28)
- **Karar:** Ürün adına "Zenweld" yazılmaz.
- **Neden:** Sayfa başlığına "| ZENWELD" kendiliğinden eklenir; adda da
  olursa başlıkta iki kez yazar.
- **Ek (2026-10-28):** Başka markanın ürününde marka adı adda kalır (ör.
  "Jasic LS-20000F Lazer Temizleme Makinesi"); insanlar markayla arıyor.
  Ürünün markası panelde **Marka** alanına yazılır (boşsa Zenweld); arama
  motorlarına giden ürün bilgisinde bu marka kullanılır.

### K-71 · Ürün adı model ve türü içerir; sayfa başlığında kategori yok
- **Tarih:** 2026-10-28
- **Karar:**
  - Ekipmanlar ürünlerinin adı "model + ürün türü"dür; tür, Türkiye'de
    aranan adıyla yazılır: "… TIG Argon Kaynak Makinesi", "… MIG Gazaltı
    Kaynak Makinesi", "… MMA Elektrod Kaynak Makinesi", "… Çok Fonksiyonlu
    Kaynak Makinesi", "… Plazma Kesme Makinesi", "… Lazer Kaynak /
    Temizleme / Markalama Makinesi".
  - Kartta, ürün sayfasında, sepette ve siparişte aynı ad görünür.
  - Ürün sayfasının otomatik başlığı "<Ürün adı> | ZENWELD"dir; kategori
    adı eklenmez (bütün ürünlerde).
  - Ürün linki kısadır, model adından oluşur (ör. `/urun/ultimate-405-thp`).
- **Neden:** Google başlığın yaklaşık ilk 60 karakterini gösterir; kategori
  adı eklenince başlık kesiliyor ve "Kaynak Makinesi / Makineleri" tekrar
  ediyordu. Ad hem model aramalarını ("405 THP") hem genel aramaları ("tig
  kaynak makinesi", "argon kaynak makinesi") karşılar. Marka Google'da site
  adı olarak ve başlığın sonunda görünür.

### K-09 · Kaynak yöntemi etiketleri kaldırıldı
- **Tarih:** 2026-10-12
- **Karar:** MIG/TIG/MMA gibi yöntem etiketleri ürün formundan, ürün
  kartlarından ve kategori filtresinden kaldırıldı.
- **Neden:** Ürünler menüde zaten bu sınıflara göre ayrılıyor.
- **Bilerek bırakılan:** Ürün Seçici ve arama bu veriyi hâlâ kullanıyor;
  veri (`processes`) Ürün Seçici yeniden tasarlanana kadar kalır, o işle
  birlikte silinir. Bu yüzden panelden eklenen ürün Ürün Seçici'de çıkmaz.

### K-10 · Ürünlerde "öne çıkan" işareti yok
- **Tarih:** 2026-09-29 (panelden), 2026-10-22 (veriden)
- **Karar:** Ürünlerde "öne çıkan" alanı yoktur. Anasayfadaki indirimli
  ürünler bölümüne ürünler kampanyaya göre kendiliğinden girer.

### K-11 · Ürünlerin kategori içindeki sırası
- **Tarih:** 2026-10-21
- **Karar:** Her ürüne panelden **Sıra** numarası verilir; kategori
  sayfasındaki "Önerilen" sıralama bunu kullanır.

### K-12 · Kategori silme ve tanıtım metni
- **Tarih:** 2026-10-20
- **Karar:**
  - İçinde ürün olan kategori ve içinde kategori olan grup silinemez.
  - Kategori ve grubun uzun tanıtım metni sayfanın **altında** durur.
- **Neden:** Ürünler kategorisiz kalmasın; ürünler üstte görünsün.

### K-69 · Ürün Seçici en sona bırakıldı
- **Tarih:** 2026-10-27
- **Karar:** Ürün Seçici'nin soruları, seçenekleri ve süzme mantığı bütün
  ürünler kesinleştikten sonra, en son düşünülecek. O zamana kadar Ürün
  Seçici'nin verdiği sonuçların doğru olması beklenmez; ürün eklenirken ya
  da test edilirken sonuçlarına göre ayar yapılmaz.
- **Neden:** Ürünlerin tamamı henüz kesin değil; sorular ve eşleştirme ancak
  bütün ürünler belli olunca doğru kurulabilir.
- **Ayrıntı:** [YAPILACAKLAR.md](YAPILACAKLAR.md) › Ürün Seçici ve arama.

---

## 3. Ürün seçenekleri

### K-13 · Seçenekli ürün tek sayfadır
- **Tarih:** 2026-10-21
- **Karar:** Aynı ürünün uzunluk, paket gibi farkları ayrı ürün değil,
  **tek ürün sayfasında seçenek** olur (ör. MB-25 MIG Torcu 3 m / 4 m /
  5 m). Bu yapı bütün ürünlere uygulanabilir, belli kategorilere özel
  değildir.

### K-14 · Seçenek tanımları ortaktır, kategori yalnızca seçer
- **Tarih:** 2026-10-21
- **Karar:** Seçenek adları ve değerleri tek yerde (Seçenek Tanımları)
  durur. Kategoriler yalnızca hangi tanımların listeleneceğini işaretler;
  ürün tanıma kimlikle bağlıdır.
- **Neden:** Ürün başka kategoriye taşınınca seçenekleri bozulmaz; bir
  değerin adı tek yerde düzeltilir; WooCommerce, Magento gibi sistemlerin
  kullandığı yapı.

### K-15 · Ürün başına tek seçenek adı — Değişti (2026-10-28, yerine K-70)
- **Tarih:** 2026-10-21
- **Karar (eski):** Bir üründe yalnızca bir seçenek adı olur (ör. yalnızca
  "Hortum Uzunluğu"); kombinasyon (uzunluk × renk gibi) yoktur.
- **Değişti:** Gerçek ürünlerde soğutma, torç uzunluğu ve ara paket uzunluğu
  birlikte seçildiği için sahibinin kararıyla kaldırıldı; yerine K-70.

### K-70 · Bir üründe birden çok seçenek; her kombinasyon ayrı varyant
- **Tarih:** 2026-10-28
- **Karar:**
  - Bir ürün en fazla 3 seçenek kullanır (ör. Soğutma: Hava / Su ve Torç
    Uzunluğu: 4 m / 8 m).
  - Satılan her kombinasyon (ör. Su Soğutmalı · 8 m) bir varyanttır: kendi
    ürün kodu (zorunlu, K-18), fiyat farkı, fotoğrafı, farklı teknik değerleri
    ve kutu içeriği olur. Satılmayan kombinasyonun varyantı yoktur; sitede
    seçilemez.
  - Sayfada her seçenek ayrı satırdır; bir değer seçilince diğer seçim
    korunur, o kombinasyon yoksa o değeri içeren ilk kombinasyona geçilir.
  - Panelde kombinasyonlar işaretlenen değerlerden kendiliğinden oluşur.
- **Neden:** Sahibinin kararı; e-ticaret sistemlerinin (Shopify, WooCommerce,
  Magento) ortak yapısı. Veritabanında tutulma biçimi:
  [VERI-MODELI.md](VERI-MODELI.md) › Ürünler › Seçenekler.

### K-16 · Kategoride seçenek işareti kaldırma engellenmez
- **Tarih:** 2026-10-21
- **Karar:** Bir tanımın kategorideki işareti, o kategoride kullanan ürün
  olsa da kaldırılabilir. Panel kaç üründe kullanıldığını yazar ve onay
  ister.
- **Neden:** İşaret yalnızca "yeni üründe listelensin mi" demektir; veri
  kaybettirmez. Engellemek, ürün başka kategoriye taşındığında da
  tutarsızlık yaratırdı. Tanımın **silinmesi** ise veri kaybettireceği için
  engellidir.

### K-17 · Yorumlar ortak, bayi ve satıcılar seçime göre
- **Tarih:** 2026-10-21
- **Karar:**
  - Yorumlar ürüne bağlıdır; seçenek değişince değişmez.
  - Stoktaki bayiler ve online satıcılar seçilen seçeneğe göre değişir;
    stok dosyaları ürün koduyla eşleşir.

### K-18 · Ürün ve seçenek kodları tek havuzda benzersiz
- **Tarih:** 2026-10-21
- **Karar:** Her seçeneğin kendi ürün kodu zorunludur; ürün ve seçenek
  kodları birbirinden farklı olmalıdır.
- **Neden:** Bayi ve satıcı stok dosyaları ürünü bu kodla bulur; aynı kod iki
  yerde olursa stok yanlış ürüne yazılır.

### K-19 · Sipariş ve teklifte anlık kopya
- **Karar:** Sipariş ve teklif satırı o anki ürün adını, seçenek adını,
  kodunu (siparişte fiyatını da) kopya olarak saklar.
- **Neden:** Ürün sonradan değişse ya da silinse de geçmiş kayıt ve yasal
  belgeler değişmemeli.

---

## 4. Satış, ödeme ve teklif

### K-20 · Zenweld'de her ürün her zaman stokta
- **Tarih:** 2026-10-11
- **Karar:** Zenweld deposu için stok sınırı yoktur; yayındaki her ürün
  sepete eklenebilir. Bayilerde ve online satıcılarda stok varsa ayrıca
  gösterilir.
- **Neden:** Site sahibinin bilgisi: Zenweld'de stoksuz kalma durumu yok.

### K-21 · Online sipariş yalnızca üyelerden
- **Tarih:** 2026-10-11
- **Karar:** Misafir alışverişi yoktur; sipariş için giriş gerekir.
  Bireysel ve kurumsal üye online satın alabilir; Teklif Al da ayrıca
  kalır.

### K-22 · Ödeme yöntemleri ve kargo
- **Tarih:** 2026-10-11
- **Karar:** Kart (taksitli) ve havale/EFT. Ücretsiz kargo sınırı 5.000 ₺
  (panelden değişir).

### K-23 · Taksit ve komisyon banka bazında
- **Tarih:** 2026-10-20
- **Karar:** Her banka POS'unun kendi taksitleri ve komisyonu vardır; kart,
  programı eşleşen bankanın taksitleriyle çekilir, eşleşmeyen kart
  varsayılan POS'tan tek çekim ödenir.
- **Not:** POS'ların gizli bilgileri yalnızca sunucuda tutulur; gerçek üye
  işyeri numaraları örnek veriye yazılmadı.

### K-24 · Havale süresi günün sonunda dolar
- **Tarih:** 2026-10-20
- **Karar:** Son ödeme günü 23:59'a kadar ödeme kabul edilir (sipariş
  saatine göre değil).
- **Neden:** Müşteriye "son ödeme: <gün>" yazıyor; aynı gün akşam ödeyenin
  siparişi iptal olmamalı.

### K-25 · Teklifi bireysel üye de isteyebilir
- **Tarih:** 2026-10-18
- **Karar:**
  - Teklif Al herkese açıktır; bireysel üye de teklif ister (bireysel üyede
    firma ünvanı isteğe bağlı).
  - Her iki hesap türünde Hesabım'da Tekliflerim ve Siparişlerim vardır.
  - Sağ üstteki kullanıcı menüsünde Tekliflerim **yoktur**.

### K-26 · Ürün sayfasında teklif düğmesi yok
- **Tarih:** 2026-10-18 (ürün sayfasındaki teklif yazısı kaldırıldı),
  2026-10-19 (mobil menüden kaldırıldı), 2026-10-22 (kesin karar)
- **Karar:**
  - Ürün sayfasında "Teklif Al" ya da "teklife ekle" düğmesi **yoktur ve
    olmayacaktır.** Ürünler yalnızca Teklif Al sayfasındaki listeden seçilir.
  - Mobil menüde Teklif Al bağlantısı yoktur (masaüstüyle aynı). Teklif Al'a
    anasayfadaki bantlardan gelinir.
- **Açık iş:** Teklif listesi boşken "Ürün sayfalarından ürün
  ekleyebilirsiniz" yazıyor; Teklif Al metinleriyle birlikte değişecek
  (bkz. [13](#13-henüz-karar-verilmemiş-konular)).

### K-27 · Müşteriye otomatik iade yok
- **Karar:** Sipariş iptalinde para iadesi panelden yapılmaz; banka ya da
  ödeme kuruluşu üzerinden ayrıca yapılır.
- **Not (2026-10-22):** "Müşteri siparişini sitede iptal edemez" bu karardan
  çıkarıldı; müşterinin siparişi kendisinin iptal etmesi ileride
  düşünülecek ([YAPILACAKLAR.md](YAPILACAKLAR.md)). Bugün sitede iptal
  düğmesi yoktur.

### K-65 · İade talebi yalnızca bireysel üyede, teslimden itibaren 14 gün
- **Tarih:** 2026-10-22
- **Karar:**
  - Bireysel üye, teslim edilen siparişi için Hesabım › Siparişlerim'den iade
    (cayma) talebi açar; süre teslim gününden itibaren 14 gündür (son gün
    23:59'a kadar).
  - Kurumsal üyede bu düğme şimdilik yoktur; kurumsal alıcılara uygulanıp
    uygulanmayacağı sorulup öğrenilecek ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
  - Panelde Satış grubunda **İade Talepleri** ekranı vardır. Para iadesi
    K-27'ye göre banka ya da ödeme kuruluşu üzerinden ayrıca yapılır.

### K-64 · Kayıt numarası hiçbir zaman tekrar verilmez
- **Tarih:** 2026-10-22
- **Karar:** Sipariş, teklif ve servis talebi numaraları tekrar etmez; en
  son kayıt silinse de numarası bir sonraki kayda verilmez.
- **Neden:** Müşterinin elindeki e-postada yazan numara başka bir kayda
  verilmesin. Testler, en son teklif silinince numarasının yeniden
  verildiğini ortaya çıkardı; belgeyi değil kodu düzeltme kararı alındı.

---

## 5. Bayiler, online satıcılar ve stok

### K-28 · Stok panelden dosyayla yüklenir
- **Tarih:** 2026-10-19
- **Karar:**
  1. Bayiler ve satıcılar stoklarını ürün kodu + adet (+ fiyat, link) olarak
     gönderir; dosya (CSV/XLSX) panelden yüklenir. E-postayla otomatik alma
     şimdilik yok.
  2. Her dosya o kaynağın **tam listesidir**; dosyada olmayan ürün stoktan
     çıkar.
  3. Sitede adet değil, yalnızca "stokta olan" bayi ve satıcılar görünür.
  4. Stok geçerlilik süresi 3 gün; panelden değişir.
  5. Satıcının fiyatı ve linki dosyadan gelir; **fiyat sitede gösterilmez.**
  6. Yapı backend'e (dealer_stock, retailer_stock tabloları) hazırdır.
- **Neden:** Bayiler günlük liste gönderiyor; tam liste kuralı stoktan
  çıkan ürünü de yakalar; süre sınırı bayat veriyi gizler.

### K-29 · Bayi ve online satıcının sitede görünüşü
- **Tarih:** 2026-10-19
- **Karar:**
  - Bayiler yalnızca ürün sayfasındaki "Stoktaki Bayileri Gör" haritasında
    görünür; yalnızca stoğu olanlar.
  - Online satıcı kartı ürünün satıcının sitesindeki sayfasına gider;
    kartta "STOKTA" yazmaz.
  - Stok tablosunda fiyat ve link ayrı sütunlardır; bayiler link göndermez
    (online mağazası olan hariç).

### K-30 · Bir bayinin en fazla bir online mağazası
- **Tarih:** 2026-10-20
- **Karar:** Online mağazası olan bayi, Online Satıcılar'daki kaydına
  bağlanır; bir mağaza en fazla bir bayiye bağlıdır. Bu bayi tek dosya
  gönderir; ürünleri hem haritada hem online satıcı kartında görünür.

### K-31 · "Ürün Bazında" stok sekmesi kaldı
- **Tarih:** 2026-10-21
- **Karar:** Stok Matrisi'ndeki "Ürün Bazında" sekmesi kaldırılmadı.
- **Neden:** "Bu ürün hangi bayide var?" sorusunu tek ekranda cevaplar;
  diğer sekmeden aynı cevap için her bayi tek tek açılmalıdır. Panel ana
  sayfasındaki "stokta olmayan ürünler" listesi de bu sekmeye bağlanır.

### K-32 · Başlıksız stok dosyası uygulanmaz
- **Tarih:** 2026-10-21
- **Karar:** Dosyada "Kod" ve "Adet" başlıklı satır bulunamazsa dosya
  uygulanmaz (sütun sırası tahmin edilmez).
- **Neden:** Başlık silinince ürün adındaki sayı adet sanılıp sessizce
  uygulanıyordu.

### K-33 · Bayi türü; "Showroom" etiketi yok
- **Tarih:** 2026-10-18
- **Karar:** Bayi türü Yetkili Bayi, Yetkili Servis ya da ikisi birden
  olabilir ve panelden girilir. "Showroom" etiketi kullanılmaz (Bayilik
  Başvurusu'ndaki "Showroom var mı?" sorusu kalır).

---

## 6. Üyelik ve hesap

### K-34 · Yeni üye onay beklemez
- **Tarih:** 2026-10-22
- **Karar:** Üye olan kişi hemen siteyi kullanır; panelden onay gerekmez.
  "Onay Bekliyor" üyelik durumu yoktur; durumlar Aktif ve Askıda.

### K-35 · Yönetici kendini kilitleyemez
- **Tarih:** 2026-10-21
- **Karar:** Yönetici kendi rolünü değiştiremez ve kendini askıya alamaz.
  Son aktif yöneticinin rolü düşürülemez, askıya alınamaz, silinemez.
- **Neden:** Tek yönetici kilitlenirse panele kimse giremez.

### K-36 · Üye silinince adresleri de silinir
- **Tarih:** 2026-10-22
- **Karar:** Üyenin kayıtlı adresleri onunla birlikte silinir; siparişleri,
  teklifleri, servis talepleri ve yorumları geçmiş kayıt olarak kalır.

### K-37 · Hesabım kolaylıkları
- **Tarih:** 2026-10-20
- **Karar:**
  - Hesabım menüsünde özet sayfasına dönmek için **Genel Bakış** vardır.
  - Garantilerim'de yeni garanti kaydı, Adreslerim'de yeni adres eklenir;
    ödeme ekranında kayıtlı adres seçilir ya da yeni adres eklenir.
  - Ürün sayfasında favori kalbi **Sepete Ekle düğmesinin yanındadır.**

### K-68 · Üye hesabını kendisi siler; KVKK başvuru formu ileride düşünülecek
- **Tarih:** 2026-10-22 (2b için: 2026-10-27)
- **Karar:** Hesabım › Profil'de **Hesabımı Sil** vardır (seçenek 2a): üye
  şifresiyle onaylayıp hesabını hemen siler (panelden silmeyle aynı kural).
  Önerilen diğer yol (seçenek 2b), Hesabım'da "Verilerimle ilgili başvuru"
  formu (talep e-postayla Zenweld'e gider, işlemi yönetici yapar), bugün
  yoktur; **ileride düşünülecek** ([YAPILACAKLAR.md](YAPILACAKLAR.md) ›
  Hesap silme — açık konular 10).
- **Not:** Silinen hesabın diğer kayıtlarındaki kişisel verilerle ilgili açık
  konular [YAPILACAKLAR.md](YAPILACAKLAR.md) › Hesap silme — açık konular.

---

## 7. Garanti ve servis

### K-38 · Garanti kayıt formu
- **Tarih:** 2026-10-18
- **Karar:** Alanlar: Ad Soyad, e-posta, telefon, şehir, posta kodu, adres,
  ürün kategorisi, model, seri numarası, satıcı VKN ve "12 ay ücretsiz
  garanti uzatması istiyorum" (boş gelir). Satın alma tarihi sorulmaz;
  garanti kayıt tarihinden başlar.

### K-39 · Aynı seri numarası iki kez kaydedilemez
- **Tarih:** 2026-10-21
- **Karar:** "Bu seri numarası daha önce kaydedilmiş." uyarısıyla kayıt
  engellenir.

### K-40 · "+12 ay" ve 29 Şubat
- **Tarih:** 2026-10-21
- **Karar:**
  - Panelde "+12 ay" mevcut bitiş tarihine 12 ay ekler, kaldırılınca 12 ay
    çıkarır; elle girilmiş tarih korunur.
  - Bitiş 29 Şubat ise açıp kapatınca tarih bir gün kayar (1 Mart). Bu
    **bilerek düzeltilmedi.**
- **Neden:** Çok nadir (dört yılda bir gün), tarih elle düzeltilebiliyor;
  "ay sonuna sabitleme" de kaymayı tamamen gidermiyor, ek bir alan
  gerektiriyor.

### K-41 · Servis talebi formu
- **Tarih:** 2026-10-18
- **Karar:** Destek ve Garanti › Servis Talebi; makine türü (Kaynak ve Lazer
  makineleri altındaki kategoriler), model, talep nedeni (Kurulum, Bakım,
  Onarım, Kullanım/Bakım Eğitimi), 400 karakterlik şikayet, iletişim
  bilgileri ve zorunlu gizlilik onayı. Talepler panelde Servis
  Talepleri'ne düşer.

---

## 8. İçerik

### K-42 · Yayın kaydedildiği anda başlar
- **Tarih:** 2026-10-22
- **Karar:** Haber, blog ve etkinlik "Yayında" işaretliyse kaydedildiği
  anda görünür; ileri tarihli/zamanlanmış yayın yoktur ve istenmiyor. Yayın
  tarihi yalnızca sıralama ve gösterim içindir.

### K-43 · Haberler blog düzeninde, manşet yok
- **Tarih:** 2026-10-20
- **Karar:** Haberler sayfasında manşet yok; bütün haberler aynı boyutta
  kartlarla. Haberdeki "öne çıkan / manşet" alanı kaldırıldı. Haber
  görselleri kırpılmaz (afiş ve grup fotoğraflarındaki yazı ve kişiler
  kesilmesin).

### K-44 · Etkinliklerde "öne çıkan" yok
- **Tarih:** 2026-10-22
- **Karar:** Etkinlikteki "Öne çıkan" seçeneği kaldırıldı.
- **Neden:** Sitede hiçbir etkisi yoktu.

### K-45 · Panelden yönetilen içerik
- **Tarih:** 2026-10-18 – 2026-10-20
- **Karar:** Sık sorulan sorular, 11 yasal metin, Hakkımızda, satış
  temsilcileri, belge sayfaları (MSDS, Kaynak Rehberi, Parti
  Sertifikaları), kategori ve gruplar panelden yönetilir. Yasal metinlerin
  adresi ve sırası sabittir.

### K-46 · Kaldırılan içerikler
- **Tarih:** 2026-10-08
- **Karar:** "%100 Yerli Üretim" ifadesi her yerden ve "Geri Çağırma"
  sayfası kaldırıldı.

### K-47 · Anasayfa düzeni
- **Tarih:** 2026-10-20
- **Karar:** Yeni Gelenler'in altındaki sıra: Bayi ve Servis haritası,
  Neden Zenweld?, Müşterilerimiz Ne Diyor?, Sık Sorulan Sorular, Teklif Al
  bandı (sade, Ürün Seçici'den farklı tasarım), Bayilik bandı, Bloğumuzdan.
  Tam sıra: [WEBSITE-KULLANIM.md › Anasayfa](WEBSITE-KULLANIM.md#3-anasayfa).

---

## 9. Formlar, yasal metinler ve e-posta

### K-48 · Onay kutuları
- **Tarih:** 2026-10-18
- **Karar:**
  - Onay kutuları **boş gelir.**
  - Kutu yalnızca gerçekten gereken yerdedir: üye olurken Kullanım
    Koşulları (zorunlu), ödemede Ön Bilgilendirme Formu ve Mesafeli Satış
    Sözleşmesi (zorunlu), servis talebinde gizlilik onayı (zorunlu),
    üye olurken kampanya e-postası izni (isteğe bağlı), alt bilgideki
    bülten kaydında pazarlama izni (kayıt için işaretlenmeli).
  - Kişisel veri alan formlarda KVKK için **bilgilendirme notu** vardır
    ("Kişisel verileriniz KVKK Aydınlatma Metni kapsamında işlenir."); açık
    rıza kutusu yoktur. Bayilik ve Teklif Al'daki rıza kutuları bu yüzden
    kaldırıldı.
  - Formlardaki yasal bağlantılar **yeni sekmede** açılır; form kaybolmaz.
- **Neden:** Başka bir hukuki sebep varken açık rıza istemek KVKK açısından
  yanıltıcı sayılabilir. Kesin metin için hukukçuya danışılmalı.

### K-49 · Çerez bandı
- **Tarih:** 2026-10-18
- **Karar:** İlk ziyarette "Tümünü Kabul Et", "Tümünü Reddet" ve "Tanımlama
  Bilgisi Ayarları" çıkar; seçim tarayıcıda hatırlanır. Ayarlar penceresi
  şimdilik boştur.
- **Neden:** Bugün analiz/reklam çerezi yok, ama eklendiği an zorunlu
  olacak.

### K-50 · Form e-postaları info@zenweld.com'a
- **Tarih:** 2026-10-21
- **Karar:** Sitedeki formlar `info@zenweld.com`'a e-posta gönderir.
  **Alt bilgideki bülten kaydı info@'a gitmez** (bülten servisi seçilince
  bağlanacak).

### K-51 · Yasal metinler taslaktır
- **Karar:** 11 yasal metnin bugünkü içeriği taslaktır ve aramaya
  kapalıdır; canlıdan önce hukuk danışmanı yazmalıdır.

---

## 10. Arama motorları ve adresler

### K-52 · Site yalnızca zenweld.com'da aramaya açık
- **Tarih:** 2026-10-09
- **Karar:** Site yalnızca `zenweld.com` ve `www.zenweld.com` adreslerinde
  arama motorlarına açıktır; demo adresi, önizlemeler ve yerel bilgisayar
  her zaman kapalıdır. Ayar gerekmez.
- **Neden:** Bir ayar unutulsa bile demo aramaya düşmesin.

### K-53 · robots.txt gizli sayfaları engellemez
- **Tarih:** 2026-10-09
- **Karar:** `robots.txt` yalnızca `/api/` adresini kapatır. Panel, hesap
  gibi sayfalar "noindex" etiketiyle kapalıdır ama taramaları engellenmez.
- **Neden:** Google sayfayı tarayamazsa "noindex" etiketini de göremez ve
  adresi başka yerden bulursa yine dizine alabilir. Panel adresi de böylece
  `robots.txt`'de ilan edilmemiş olur.

### K-54 · Blog site haritasında
- **Tarih:** 2026-10-20
- **Karar:** Blog yazıları site haritasına girer.
- **Neden:** SEO için önemli; sonradan unutulmasın.
- **Dikkat:** Örnek blog yazılarının metni yer tutucudur; canlıdan önce
  değiştirilmeli ya da yayından kaldırılmalı.

### K-55 · SEO alanları
- **Tarih:** 2026-10-20
- **Karar:**
  - Ürün, kategori, grup, blog, haber ve etkinlikte SEO sekmesi: link,
    sayfa başlığı, açıklama, anahtar kelimeler, Google önizlemesi.
  - Sabit sayfalarda (Sayfa SEO ekranı) yalnızca başlık ve açıklama
    değişir; **link değişmez**, anahtar kelime alanı yoktur.
  - Linki değişen kaydın eski linki yeni linke yönlenir.
- **Neden:** Sabit sayfaların adresleri menüye ve sayfalar arası
  bağlantılara bağlı; değişirse bağlantılar kırılır.

### K-56 · Sade adresler
- **Tarih:** 2026-10-08
- **Karar:** `/kesfet` öneki kaldırıldı; sayfalar üst seviyededir (`/sss`,
  `/blog`, `/garanti` …). Yasal sayfalar `/yasal/...` altındadır.

---

## 11. Panel

### K-57 · "Veri Yönetimi" kaldırıldı
- **Tarih:** 2026-10-18
- **Karar:** Paneldeki Veri Yönetimi ekranı kaldırıldı; örnek veriler
  kalır.
- **Neden:** Backend geliştirmesine geçilecek.

### K-58 · Her silme onay ister
- **Tarih:** 2026-10-22
- **Karar:** Panelde her silme işleminden önce onay sorulur.

### K-59 · Zorunlu alanlar gerçekten zorunlu
- **Tarih:** 2026-10-22
- **Karar:** Bayi adı ve şehri, online satıcının adı ve site adresi boş
  kaydedilemez. Servis talebinde Kaydet'ten sonra "Kaydedildi" yazar.
  Görünüm ekranının açıklaması ayarların etkilediği bütün metinleri sayar.

### K-60 · Kullanılmayan alanlar kalır
- **Tarih:** 2026-10-22
- **Karar:** Kategori/grup numarası (`code`), kategori simgesi (`icon`),
  bayi e-postası, satıcı logo adresi ve teklif satırı notu bugün
  kullanılmıyor ama **silinmez**; ileride kullanılmak üzere backend'e
  taşınır ([VERI-MODELI.md](VERI-MODELI.md#16-kullanılmayan-alanlar)).

### K-61 · Ürün → kategori bağı backend'de kimlikle
- **Tarih:** 2026-10-22
- **Karar (backend için not):** Ürün, servis talebi ve garanti kategoriye;
  kategori gruba bugün **linkle** bağlı. Panel bunu doğru yönettiği için
  sorun yok; backend'de kimlikle bağlanmalı.

---

## 12. Belgeler ve çalışma şekli

### K-62 · Belgeler
- **Tarih:** 2026-10-22
- **Karar:**
  - Siteyi tanımlayan belgeler deponun `docs/` klasöründe, düz Markdown
    olarak tutulur (Obsidian kullanılmaz; standart bağlantılar).
  - Demo hesapların giriş bilgileri ve test kartı **yalnızca README'de**
    yazar; başka dosyaya eklenmez.
  - STOK.md ayrı kalır (bayilere gönderilecek dosya biçimini de anlatır).
  - Her kod değişikliğinde ilgili belge de güncellenir (bkz. `CLAUDE.md`).
- **Neden:** Siteyi devralan kişi ya da yeni bir geliştirme oturumu, tasarım
  dışındaki bütün özellikleri bu dosyalardan kurabilsin.

### K-63 · Çalışma şekli
- **Karar:** Yanıtlar Türkçe; işler madde madde ve onayla ilerler; büyük
  değişiklikten önce açıklama yapılıp onay alınır; istenmeyen şey yapılmaz;
  silmeden önce söylenir; gereksiz kod bırakılmaz. Geliştirme tek dalda
  yürür (`claude/tender-knuth-9it4y3`).

### K-66 · Otomatik kod biçimlendirici (Prettier) kullanılmaz
- **Tarih:** 2026-10-22
- **Karar:** Kod denetimi (ESLint) kuruludur; Prettier kurulmaz.
- **Neden:** İlk kurulumda 189 dosyanın yalnızca yazım düzenini
  değiştirecekti; kodun düzeni zaten tutarlı.

### K-67 · GitHub'da otomatik kontrol (CI) şimdilik yok
- **Tarih:** 2026-10-22
- **Karar:** Tip kontrolü, kod denetimi, testler ve derleme her gönderimde
  GitHub'da kendiliğinden çalıştırılmaz; geliştirici elle çalıştırır
  (CLAUDE.md › Doğrulama). İleride kurulabilir
  ([YAPILACAKLAR.md](YAPILACAKLAR.md) › Kod incelemesi bulguları 8).

---

## 13. Henüz karar verilmemiş konular

Konuşulmuş ama kararı bekleyen ya da sonraya bırakılmış işler. Ayrıntılar
[YAPILACAKLAR.md](YAPILACAKLAR.md)'dedir.

| Konu | Durum |
|---|---|
| **Teklif Al metinleri** | Sayfadaki metinler kurumsal müşteriye hitap ediyor; herkese hitap edecek şekilde yeniden yazılacak. Müdür kararı bekleniyor |
| **Ürün Seçici ve arama** | Bütün ürünler kesinleşince, en son yeniden tasarlanacak (K-69); eski yöntem verisi o zaman silinecek |
| **İlgili ürünler** | Öneri mantığı (sepet birlikteliği, aynı kategoride çok satanlar, makineye uygun aksesuarlar) sonra kurulacak |
| **Kategori filtreleri** | Ürün listesi ve teknik özellikler kesinleşince her alt kategoriye kendi filtreleri |
| **Çerez ayarları ve analitik** | Analiz aracı seçilince ayarlar penceresi doldurulacak |
| **Barındırma yeri** | KVKK açısından sunucunun yeri BT ve hukukla birlikte seçilecek |
| **Açık rıza ve yurt dışı aktarım** | Sunucu yeri belli olunca hukukçuyla netleşecek |
| **Ödeme kuruluşu** | iyzico, PayTR ya da banka sanal POS'ları |
| **Kurumsal alıcıda cayma hakkı** | Hukukçuyla netleşecek |
| **Bülten servisi** | Seçilip bağlanacak (İYS kaydıyla) |
| **Ayrı ürünü seçeneğe dönüştürme ekranı** | Gerçek ürünler girilmeye başlanınca karar verilecek (2026-10-22) |
| **Next.js 16'ya geçiş** | Ertelendi (2026-10-22); canlı sunucu kararıyla birlikte planlı yapılacak. Kalan 2 güvenlik bulgusunun riski düşük |
| **Bayi B2B uygulaması** | Ayrı proje; bayi hesaplarını kimin yöneteceği o zaman netleşecek |
