# Zenweld Sitesi — Buradan Başlayın

Bu klasördeki dosyalar Zenweld kurumsal sitesini, online mağazasını ve yönetim
panelini **işlev olarak** tarif eder: hangi sayfa ve ekranda ne olduğu, hangi
kuralların geçerli olduğu, bir işlem yapılınca ne olduğu.

İki okuyucu için yazıldı:

- **Siteyi devralan kişi:** Sitede ve panelde hangi özelliklerin olduğunu,
  nasıl kullanıldığını ve neden öyle yapıldığını buradan öğrenir.
- **Siteyi yeniden kuracak bir yazılım projesi** (örneğin yeni bir Claude Code
  projesi): Bu dosyalarla, tasarım dışında bugünkü bütün özellikleri aynı
  kurallarla kurabilir.

Tasarım (renk, yerleşim, yazı tipi) bu dosyaların konusu değildir. Ekranda
**ne olduğu ve nasıl davrandığı** anlatılır, nasıl göründüğü anlatılmaz.

---

## Proje kısaca

Zenweld, kaynak makineleri ve kaynak ekipmanları üreten bir Türk markasıdır.
Site dört işi birlikte yapar:

1. **Ürün kataloğu.** Dört bölüm vardır: Ekipmanlar, Güvenlik, Aksesuarlar ve
   Dolgu Metalleri. Katalog dört seviyelidir: bölüm › grup › kategori › ürün
   (örnek: Ekipmanlar › Kaynak Makineleri › MIG/MAG Gazaltı Kaynak Makineleri ›
   ürün).
2. **Online mağaza.** Üyeler sepete ekleyip kartla (taksitli) ya da havale/EFT
   ile satın alır ve siparişini Hesabım'dan izler.
3. **Satış ağına yönlendirme.** Ürün sayfasında, o ürünü **stokta tutan**
   bayiler haritada ve stoğu olan online satıcılar kart olarak gösterilir.
   Kurumsal alımlar için **Teklif Al** formu vardır.
4. **Destek ve içerik.** Garanti kaydı ve sorgulama, servis talebi, sık sorulan
   sorular, belgeler (MSDS, kaynak rehberi, parti sertifikaları), blog,
   haberler, etkinlikler, Welders Club ve kurumsal sayfalar.

Diğer temel bilgiler:

- **Yönetim paneli** sitenin içindedir (`/yonetim`). Kendi giriş ekranı ve
  oturumu vardır; site üyeliğinden ayrıdır.
- **Dil:** Site ve panel yalnızca Türkçedir.
- **Bugünkü durum:** Proje bir **demo**dur; sunucu tarafında veritabanı yoktur.
  - Veriler tarayıcıda (localStorage) tutulur ve yalnızca o tarayıcıda görünür.
  - Form e-postaları gerçekten gönderilir (e-posta servisinin anahtarı
    tanımlıysa).
  - Ödeme demo modundadır; karttan para çekilmez.
  - Gerçek sisteme geçişte yapılacaklar
    [YAPILACAKLAR.md](YAPILACAKLAR.md)'de, teknik kurulum ve demo hesapları
    [README.md](../README.md)'dedir.

---

## Kimler kullanır

| Kim | Ne yapar |
|---|---|
| **Ziyaretçi** (üye değil) | Kataloğu gezer, sepete ekler, bayi haritasını kullanır, Teklif Al ve diğer formları doldurur. Ödeme için üye olması gerekir. |
| **Bireysel üye** | Ziyaretçinin yapabildiklerine ek olarak sipariş verir; Hesabım'da siparişlerini, tekliflerini, favorilerini, garanti kayıtlarını, adreslerini ve profilini görür. |
| **Kurumsal üye** | Bireysel üyeyle aynı yetkilere sahiptir. Fark kayıtta firma bilgilerinin istenmesi ve ödemede faturanın varsayılan olarak kurumsal gelmesidir. |
| **Yönetici** | Yalnızca yönetim panelini kullanır: ürünler, siparişler, teklifler, stok, bayiler, içerik ve ayarlar. |
| **Bayi** | Sitenin üyesi değildir, siteye giriş yapmaz. Bayi olmak isteyen **Bayilik Başvurusu** formunu doldurur. Bayilerin stok listelerini yönetici panelden yükler. |
| **Online satıcı** | Zenweld ürünlerini kendi sitesinde satan mağaza. Siteye giriş yapmaz; stok listesini yönetici panelden yükler. |
| **Zenweld ekibi** (info@zenweld.com) | Sitedeki formlardan gelen e-postaları alır. |

---

## Dosyalar ve okuma sırası

| Sıra | Dosya | İçerik |
|---|---|---|
| 1 | **00-BASLA-BURADAN.md** (bu dosya) | Genel bakış, sözlük, okuma sırası |
| 2 | [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md) | Sitenin her sayfası ve özelliği |
| 3 | [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md) | Yönetim panelinin her ekranı |
| 4 | [VERI-MODELI.md](VERI-MODELI.md) | Saklanan bütün kayıtlar, alanları, birbirleriyle bağlantıları ve silme kuralları |
| 5 | [IS-KURALLARI.md](IS-KURALLARI.md) | Hesaplar ve kurallar: fiyat, KDV, kampanya, taksit, stok, ürün kodları, linkler, durum akışları, e-postalar |
| 6 | [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) | Dış sistemler: ödeme, e-posta, harita, barındırma, çerez onayı; gerekli ayarların adları |
| 7 | [STOK.md](STOK.md) | Bayi ve satıcı stok dosyalarının biçimi, eşleşme kuralları, backend'e geçiş |
| 8 | [KARARLAR.md](KARARLAR.md) | Alınan kararlar ve nedenleri |
| 9 | [KABUL-KONTROL-LISTESI.md](KABUL-KONTROL-LISTESI.md) | Bir özelliğin doğru çalıştığını doğrulamak için madde madde test listesi |
| 10 | [YAPILACAKLAR.md](YAPILACAKLAR.md) | Sonraya bırakılan işler ve backend'e geçiş notları |
| — | [README.md](../README.md) (proje kökünde) | Teknik başlangıç: kurulum, çalıştırma, demo hesaplar, proje yapısı |
| — | [CLAUDE.md](../CLAUDE.md) (proje kökünde) | Bu projede çalışan Claude oturumları için çalışma kuralları |

Diğer dosyalar bir konuyu ayrıntılı anlatırken tekrar etmek yerine birbirine
bağlantı verir. Örneğin kampanya fiyatının nasıl hesaplandığı yalnızca
IS-KURALLARI'nda yazar.

---

## Sözlük

| Terim | Anlamı |
|---|---|
| **Bölüm** | Kataloğun en üst seviyesi: Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri. Sabittir, panelden eklenmez. |
| **Grup** | Bölümün altındaki ürün ailesi (ör. Kaynak Makineleri). Panelden yönetilir. |
| **Kategori** | Grubun altındaki ürün listesi (ör. MIG Torçları). Ürün tek bir kategoriye bağlıdır. |
| **Ürün kodu (SKU)** | Ürünün ve her seçeneğinin benzersiz kodu. Bayi ve satıcı stok dosyaları bu kodla eşleşir. |
| **Seçenek tanımı** | Ürün seçeneklerinin ortak adı ve değerleri. Örnek: "Hortum Uzunluğu" tanımının değerleri 3 m, 4 m, 5 m, 10 m'dir. Bir tanım birden çok kategoride kullanılabilir. |
| **Değer** | Seçenek tanımının bir seçeneği (ör. "5 m"). |
| **Seçenek (varyant)** | Bir değerin bir üründeki karşılığı: kendi ürün kodu, fiyat farkı ve isteğe bağlı farklı bilgileri vardır. Tek ürün sayfası, örneğin 3 m / 4 m / 5 m seçenekleriyle satılır. |
| **Kampanya** | Üründe süreli ya da süresiz indirim oranı. Seçenekli üründe tüm seçeneklere aynı oran uygulanır. |
| **Bayi** | Fiziksel satış noktası; haritada görünür. Yetkili servis de olabilir. |
| **Online satıcı** | Zenweld ürünlerini kendi sitesinde satan mağaza. Ürün sayfasında kart olarak görünür; kart, ürünün o mağazadaki sayfasına gider. |
| **Online mağazası olan bayi** | Hem fiziksel bayi hem online satıcı olan kaynak. Tek stok dosyası gönderir. |
| **Kaynak (stok kaynağı)** | Stok dosyası gönderen bayi ya da online satıcı. |
| **Stok dosyası** | Kaynağın ürün kodu ve adet listesi (CSV/XLSX). Her yükleme kaynağın tam listesi sayılır. |
| **Kod eşleştirmesi** | Bayinin kendi ürün kodunu bizim ürünümüze bağlayan kayıt. Sonraki dosyalarda kod kendiliğinden tanınır. |
| **Sipariş** | Sitede ödemesi yapılan (ya da havale beklenen) satın alma. Durumu panelden ilerletilir. |
| **Teklif** | Kurumsal alım için gönderilen talep (vadeli, çek, havale ya da görüşelim). Satış ekibi panelden takip eder. |
| **Garanti kaydı** | Müşterinin aldığı makineyi seri numarasıyla kaydetmesi. Garanti bitiş tarihi sorgulanabilir. |
| **Servis talebi** | Arızalı ürün için gönderilen talep. Panelden takip edilir. |
| **Bayilik başvurusu** | Bayi olmak isteyen firmanın formu. E-postayla Zenweld'e gider. |
| **Welders Club** | Kaynakçılar için topluluk sayfası. Katılım formu e-postayla Zenweld'e gider. |
| **Belgeler** | MSDS (güvenlik bilgi formları), Kaynak Rehberi ve Parti Sertifikaları sayfalarındaki indirilebilir dosyalar. Panelden yönetilir. |
| **Sayfa SEO** | Sabit sayfaların (Hakkımızda, İletişim vb.) Google'da görünen başlık ve açıklaması. Panelden düzenlenir. |
| **Yasal metinler** | KVKK, gizlilik, çerez, iade, mesafeli satış sözleşmesi gibi metinler. Panelden düzenlenir. |
| **Görünüm** | Sitedeki uzun metinlerin (blog, haber, etkinlik, Hakkımızda, yasal metinler, kategori ve grup tanıtım metinleri) punto ve renk ayarı. Panelden değişir. |
| **Eski link yönlendirmesi** | Linki değişen sayfanın (ürün, kategori, blog vb.) eski adresi yeni adrese gider. Seçeneğe dönüştürülen eski ürünün linki de o seçenekle açılır. |

---

## Yeni bir projede siteyi bu dosyalarla kurmak

Bu bölüm, siteyi yeniden kuracak yazılım projesine (ör. Claude Code) verilecek
talimattır.

1. **Okuma:** Dosyaları yukarıdaki sırayla okuyun. Önce VERI-MODELI ve
   IS-KURALLARI'nı anlamadan ekran yapmaya başlamayın; ekranlar bu kurallara
   dayanır.
2. **Tasarım bağlayıcı değildir:** Renk, yerleşim ve yazı tipi serbesttir.
   Ancak bu dosyalarda yazan **her alan, kural, uyarı ve davranış** aynen
   kurulmalıdır.
3. **Kararlar değiştirilmez:** [KARARLAR.md](KARARLAR.md)'deki kararlar bilerek
   alınmıştır. Daha iyi görünen bir yol olsa bile, yeni sahibine sorulmadan
   değiştirilmez.
4. **Adım adım kurulur:** Özellikler parça parça kurulur. Her parça bitince
   [KABUL-KONTROL-LISTESI.md](KABUL-KONTROL-LISTESI.md)'deki ilgili maddeler
   denenir.
5. **Demo ile canlı ayrımına dikkat:** Dosyalarda "Demo notu" ile işaretli
   yerler bugünkü demonun sınırlarıdır (ör. verinin tarayıcıda durması).
   Yeni kurulum gerçek bir backend ile yapılacaksa
   [YAPILACAKLAR.md](YAPILACAKLAR.md) ve [VERI-MODELI.md](VERI-MODELI.md)'deki
   backend notları esas alınır.
6. **Örnek içerik gerçek değildir:** Lorem ipsum metinler, "doğrulanmalı"
   diye işaretli ürün teknik bilgileri, demo bayi ve satıcılar örnektir.
   Yapı olarak kurulur, içerik olarak kopyalanmaz.

---

## Bu dosyalar nasıl güncel tutulur

Sitede ya da panelde bir özellik eklendiğinde, değiştiğinde ya da
kaldırıldığında ilgili dosya **aynı değişiklikle birlikte** güncellenir. Bu
kural, projede çalışan Claude oturumları için [CLAUDE.md](../CLAUDE.md)'de de
yazılıdır.

Son genel güncelleme: 22 Ekim 2026.
