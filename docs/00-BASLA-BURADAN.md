# Zenweld Sitesi — Buradan Başlayın

Bu klasördeki dosyalar Zenweld kurumsal sitesini, online mağazasını ve yönetim
panelini **işlev olarak** anlatır: hangi sayfa ve ekranda ne olduğu, hangi
kuralların geçerli olduğu, bir işlem yapılınca ne olduğu. Tasarım (renk,
yerleşim, yazı tipi) anlatılmaz.

Her bilgi tek bir dosyada yazar; diğerleri ona bağlantı verir (örneğin
kampanya fiyatının hesabı yalnızca IS-KURALLARI'nda yazar).

---

## Neyi nerede bulurum?

| Soru | Dosya |
|---|---|
| Sitede bir sayfa ya da özellik nasıl çalışır? | [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md) |
| Panelde bir ekran nasıl kullanılır? | [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md) |
| Fiyat, KDV, kampanya, taksit, kupon, stok, kod, link nasıl hesaplanır? | [IS-KURALLARI.md](IS-KURALLARI.md) |
| Hangi bilgi hangi tabloda ve kolonda saklanır? | [VERITABANI.md](VERITABANI.md) |
| Sunucu nasıl çalışır; ödeme, e-posta, SAP, dosya deposu, ortam değişkenleri? | [SUNUCU.md](SUNUCU.md) |
| Bayi ve satıcı stok dosyası nasıl hazırlanır ve yüklenir? | [STOK.md](STOK.md) (bayilere de gönderilebilir) |
| Bir şey neden böyle yapıldı? | [KARARLAR.md](KARARLAR.md) |
| Bir özellik doğru çalışıyor mu, nasıl denenir? | [KABUL-KONTROL-LISTESI.md](KABUL-KONTROL-LISTESI.md) |
| Ne kaldı, kimi bekliyor; şirketten ne öğrenilecek? | [YAPILACAKLAR.md](YAPILACAKLAR.md) |
| Kurulum, komutlar, demo hesaplar, iki modun farkları | [README.md](../README.md) (proje kökünde) |
| Claude oturumlarının çalışma kuralları | [CLAUDE.md](../CLAUDE.md) (proje kökünde) |

İlk kez okuyan için sıra: bu dosya → WEBSITE-KULLANIM → ADMIN-KULLANIM →
IS-KURALLARI → VERITABANI → SUNUCU → KARARLAR → YAPILACAKLAR.

---

## Proje kısaca

Zenweld, kaynak makineleri ve kaynak ekipmanları üreten bir Türk markasıdır.
Site dört işi birlikte yapar:

1. **Ürün kataloğu.** Dört bölüm: Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu
   Metalleri. Katalog dört seviyelidir: bölüm › grup › kategori › ürün
   (ör. Ekipmanlar › Kaynak Makineleri › MIG/MAG Gazaltı Kaynak Makineleri ›
   ürün).
2. **Online mağaza.** Üyeler sepete ekleyip kartla (taksitli) ya da
   havale/EFT ile satın alır, siparişini Hesabım'dan izler.
3. **Satış ağına yönlendirme.** Ürün sayfasında o ürünü **stokta tutan**
   bayiler haritada, stoğu olan online satıcılar kart olarak görünür.
   Ekipmanlar için **Teklif Al** formu vardır.
4. **Destek ve içerik.** Garanti kaydı ve sorgulama, servis talebi, sık
   sorulan sorular, belgeler (MSDS, kaynak rehberi, parti sertifikaları),
   blog, haberler, etkinlikler, Welders Club ve kurumsal sayfalar.

- **Yönetim paneli** sitenin içindedir (`/yonetim`); kendi giriş ekranı ve
  oturumu vardır, site üyeliğinden ayrıdır.
- **Dil:** Site ve panel yalnızca Türkçedir.
- **Bugünkü durum:** Site iki modda çalışır; ekranlar ve kurallar ikisinde
  aynıdır. **Demo modunda** (yayındaki adres) veriler tarayıcıda durur;
  **veritabanı modunda** bütün veri ve işlemler sunucudadır. Veritabanı
  modunun kodu hazırdır; canlı sunucu kurulunca site bu modda yayına alınır.
  Farklar: [README.md](../README.md) › Demo ve veritabanı modu. Ödeme
  kuruluşu henüz bağlanmadı (karttan para çekilmez), e-posta servisi henüz
  kurulmadı.

---

## Kimler kullanır

| Kim | Ne yapar |
|---|---|
| **Ziyaretçi** (üye değil) | Kataloğu gezer, sepete ekler, bayi haritasını kullanır, Teklif Al ve diğer formları doldurur. Ödeme için üye olması gerekir. |
| **Bireysel üye** | Ziyaretçinin yapabildiklerine ek olarak sipariş verir; Hesabım'da siparişlerini, tekliflerini, favorilerini, garanti kayıtlarını, adreslerini ve profilini görür; teslim edilen sipariş için iade talebi açar. |
| **Kurumsal üye** | Bireysel üyeyle aynıdır; kayıtta firma bilgileri istenir, ödemede fatura kurumsal gelir. |
| **Yönetici** | Yalnızca yönetim panelini kullanır: ürünler, siparişler, teklifler, stok, bayiler, içerik ve ayarlar. Sitede giriş yapamaz. |
| **Bayi** | Sitenin üyesi değildir, siteye giriş yapmaz. Bayi olmak isteyen **Bayilik Başvurusu** formunu doldurur. Stok listesini yönetici panelden yükler. |
| **Online satıcı** | Zenweld ürünlerini kendi sitesinde satan mağaza. Siteye giriş yapmaz; stok listesini yönetici panelden yükler. |
| **Zenweld ekibi** | Formlardan gelen e-postaları alır (varsayılan info@zenweld.com; alıcılar panelden). |

---

## Sözlük

| Terim | Anlamı |
|---|---|
| **Bölüm** | Kataloğun en üst seviyesi: Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri. Sabittir, panelden eklenmez. |
| **Grup** | Bölümün altındaki ürün ailesi (ör. Kaynak Makineleri). Panelden yönetilir. |
| **Kategori** | Grubun altındaki ürün listesi (ör. MIG/MAG Gazaltı Kaynak Makineleri). Ürün tek bir kategoriye bağlıdır. |
| **Ürün kodu (SKU)** | Ürünün ve her kombinasyonunun benzersiz kodu; SAP kalem koduyla aynıdır. Bayi ve satıcı stok dosyaları bu kodla eşleşir. |
| **Seçenek tanımı** | Ürün seçeneklerinin ortak adı ve değerleri. Örnek: "Torç Uzunluğu" tanımının değerleri 3 m, 4 m, 5 m, 8 m. Bir tanım birden çok kategoride kullanılabilir. |
| **Değer** | Seçenek tanımının bir seçeneği (ör. "5 m"). |
| **Varyant (kombinasyon)** | Ürünün satılan bir hali; her seçenekten bir değer (ör. Su Soğutmalı · 8 m). Kendi ürün kodu, fiyat farkı ve isteğe bağlı farklı bilgileri (fotoğraf, teknik değer, kutu içeriği) vardır. Bir ürün en fazla 3 seçenek kullanır. |
| **Kampanya** | Üründe süreli ya da süresiz indirim oranı. Seçenekli üründe bütün kombinasyonlara aynı oran uygulanır. |
| **Kupon** | Müşterinin sepette yazdığı indirim kodu (yüzde ya da sabit TL). Kampanyalı fiyatın üstüne uygulanır, kargoya uygulanmaz. Herkese açık ya da kişiye özel (belirli e-posta adreslerine) olabilir. |
| **Zenweld depo stoğu** | Zenweld deposunun stoğu; SAP'tan okunur. Stokta olmayan ürün sepete eklenmez ("STOKTA YOK"). |
| **Bayi** | Fiziksel satış noktası; haritada görünür. Yetkili servis de olabilir. |
| **Online satıcı** | Zenweld ürünlerini kendi sitesinde satan mağaza. Ürün sayfasında kart olarak görünür; kart ürünün o mağazadaki sayfasına gider. |
| **Online mağazası olan bayi** | Hem fiziksel bayi hem online satıcı olan kaynak. Tek stok dosyası gönderir. |
| **Kaynak (stok kaynağı)** | Stok dosyası gönderen bayi ya da online satıcı. |
| **Stok dosyası** | Kaynağın ürün kodu ve adet listesi (CSV/XLSX). Her yükleme kaynağın tam listesi sayılır. |
| **Kod eşleştirmesi** | Bayinin kendi ürün kodunu bizim ürünümüze bağlayan kayıt. Sonraki dosyalarda kod kendiliğinden tanınır. |
| **Sipariş** | Sitede ödemesi yapılan (ya da havale beklenen) satın alma. Durumu panelden ilerletilir. |
| **Teklif** | Ekipmanlar için fiyat teklifi talebi (ödeme tercihi: vadeli, çek, havale ya da görüşelim). Kurumsal müşteriler içindir; satış ekibi panelden takip eder. |
| **Garanti kaydı** | Müşterinin aldığı makineyi seri numarasıyla kaydetmesi. Garanti bitiş tarihi sorgulanabilir. |
| **Servis talebi** | Kurulum, bakım, onarım ya da eğitim için gönderilen talep. Panelden takip edilir. |
| **İade talebi** | Üyenin (bireysel ya da kurumsal) teslim edilen siparişindeki ürünleri geri göndermek için teslimden itibaren 14 gün içinde Hesabım'dan açtığı talep (cayma). Panelde İade Talepleri'nden takip edilir. |
| **Bayilik başvurusu** | Bayi olmak isteyen firmanın formu. Zenweld'e e-postayla gider; panelde Bayilik Başvuruları'nda görünür. |
| **Welders Club** | Kaynakçılar için topluluk sayfası. Katılım formu Zenweld'e e-postayla gider; panelde Welders Club ekranında görünür. |
| **Belgeler** | MSDS (güvenlik bilgi formları), Kaynak Rehberi ve Parti Sertifikaları sayfalarındaki dosyalar. Panelden yönetilir. |
| **Sayfa SEO** | Sabit sayfaların (Hakkımızda, İletişim vb.) Google'da görünen başlık ve açıklaması. Panelden düzenlenir. |
| **Yasal metinler** | KVKK, gizlilik, çerez, iade, mesafeli satış sözleşmesi gibi 11 metin. Panelden düzenlenir; bugün taslaktır. |
| **Görünüm** | Sitedeki uzun metinlerin (blog, haber, etkinlik, Hakkımızda, yasal metinler, kategori ve grup tanıtım metinleri) punto ve renk ayarı. Panelden değişir. |
| **Eski link yönlendirmesi** | Linki değişen sayfanın (ürün, kategori, blog vb.) eski adresi yeni adrese gider. Seçeneğe dönüştürülen eski ürünün linki de o seçenekle açılır. |
| **İşlem kaydı** | Veritabanı modunda paneldeki her değişikliğin kaydı (kim, ne zaman, eski ve yeni değer). Panelde Ayarlar › İşlem Kaydı. |
| **Demo notu** | Belgelerde bugünkü demonun bir sınırını gösteren işaret (ör. verinin tarayıcıda durması). Yalnızca geliştiriciler içindir; sitede görünmez. |

---

## Yeni bir projede siteyi bu dosyalarla kurmak

Siteyi yeniden kuracak bir yazılım projesine (ör. Claude Code) verilecek
talimat:

1. **Okuma:** Önce VERITABANI ve IS-KURALLARI'nı okuyun; ekranlar bu
   kurallara dayanır.
2. **Tasarım bağlayıcı değildir:** Renk, yerleşim ve yazı tipi serbesttir.
   Ama dosyalarda yazan **her alan, kural, uyarı ve davranış** aynen kurulur.
3. **Kararlar değiştirilmez:** [KARARLAR.md](KARARLAR.md)'deki kararlar
   bilerek alınmıştır; sahibine sorulmadan değiştirilmez.
4. **Adım adım kurulur:** Her parça bitince
   [KABUL-KONTROL-LISTESI.md](KABUL-KONTROL-LISTESI.md)'deki ilgili maddeler
   denenir.
5. **Demo ile canlı ayrımı:** "Demo notu" işaretli yerler bugünkü demonun
   sınırlarıdır. Gerçek kurulum veritabanı modunu esas alır
   ([SUNUCU.md](SUNUCU.md), [YAPILACAKLAR.md](YAPILACAKLAR.md)).
6. **Örnek içerik gerçek değildir:** Lorem ipsum metinler, temsili fiyatlar,
   "doğrulanmalı" diye işaretli teknik bilgiler, demo bayi ve satıcılar
   örnektir. Yapı olarak kurulur, içerik olarak kopyalanmaz.

---

## Bu dosyalar nasıl güncel tutulur

Sitede ya da panelde bir özellik eklendiğinde, değiştiğinde ya da
kaldırıldığında ilgili dosya **aynı değişiklikle birlikte** güncellenir;
hangi değişikliğin hangi dosyaya yazılacağı [CLAUDE.md](../CLAUDE.md) ›
Belgeleri güncel tutma'dadır. Belgeler hafızadan değil koda bakılarak
yazılır; belge ile kod uyuşmazsa sahibine söylenir.
