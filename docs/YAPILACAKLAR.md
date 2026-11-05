# Sonraya Bırakılanlar

Kararlaştırılıp ileri bir tarihe bırakılan işler. Bir iş yapıldığında
buradan silinir.

## Sonda ayrı ayrı ele alınacak konular (KARARLAR K-106)

Sahibinin kararı (2026-11-05): Aşağıdaki konuların her biri ayrı ayrı,
derinlemesine ayar ve karar gerektirir; panelin veritabanına geçişi
bittikten sonra sahibiyle tek tek konuşulup düzenlenecek. O zamana kadar
bugünkü düzen kalır; bu konularda kendiliğinden ayar ya da tasarım
yapılmaz. Bir adımda bu konulardan biri gerekirse o adımın ihtiyacı kadarı,
ileride gelecek bağlantılara (API) açık ve genişletilebilir yapılır
(K-107; ör. 5.3'te kargo takip bağlantısı).

| Konu | Bugün | Ayrıntılı notlar |
|---|---|---|
| **Fotoğraflar** (boyut, sıkıştırma, depolama, hız) | Örnek görseller sitenin klasöründe; veritabanı modunda panelde görsel yükleme kapalı, adres girilir (K-101); iyileştirme sahibi söyleyince (K-102) | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar--backend), [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler), [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) |
| **Belgeler** (MSDS, sertifikalar, rehber) | Demo modunda dosya tarayıcıda; veritabanı modunda dosya yükleme kapalı, adres girilir (K-104) | [Belgeler](#belgeler-msds-kaynak-rehberi-parti-sertifikaları--backend) |
| **SEO** | Ürün, kategori, grup, blog, haber, etkinlik ve sabit sayfalarda SEO alanları; eski adres yönlendirmesi (tarayıcıda); site haritası | [SEO alanları](#seo-alanları-ürün-blog-haber-etkinlik-sabit-sayfalar-ve-link-yönlendirme--backend) |
| **Kargo** (ücret, firmalar, takip, entegrasyon) | Sabit ücret ve ücretsiz kargo sınırı, firma listesi, takip numarası elle girilir; firmaya takip adresi girilince müşteri ve panelde takip bağlantısı (K-105); kargo firması API'si yok | [Online satış](#online-satış--canlıya-çıkmadan-önce) 9–10 |
| **İade** | Bireysel üye 14 gün içinde talep açar; panelde durum; para iadesi elle | [İade talebi](#i̇ade-talebi--kurumsal-üyeler-ve-backend) 3–5 |
| **SAP ayarları ve stok kontrolü** | Depo stoğu deneme dosyasından 15 dakikada bir okunur; stokta olmayan ürün sepete eklenmez; bayi stoğunda geçerlilik süresi | [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap--backend), [Bayi ve satıcı stokları](#bayi-ve-satıcı-stokları--backend) |
| **SAP'a sipariş kaydı** | Veritabanı modunda aktarım sırası hazır (K-108): ödemesi kesinleşen sipariş sıraya girer, iş gönderir, başarısızsa yeniden dener, panelde durum ve **Yeniden sıraya al**; SAP yerine deneme dosyasına yazıyor | Yukarıda "Kalan kod işleri" 4, [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap--backend) |
| **API ayarları** (SAP, ödeme, e-posta, kargo bağlantıları) | Bağlantı bilgileri yalnızca sunucuda ortam değişkeni; panelde yok (güvenlik kuralı) | [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md), [Bağlantıların durumu](#bağlantıların-durumu-panelde--öneri) |
| **Banka ve ödeme ayarları** | Mağaza Ayarları'nda POS tablosu, taksitler ve havale hesapları; ödeme temsili | [Online satış](#online-satış--canlıya-çıkmadan-önce) 1, 10; [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › Kartla ödeme |
| **E-postalar** (gönderen, metinler, müşteri bildirimleri) | Alıcılar panelde (K-104); servis kurulmadı, hiçbir e-posta gitmiyor | [Üyelik, oturum ve şifre](#üyelik-oturum-ve-şifre--backend) 3, [Müşteriye e-posta bildirimleri](#müşteriye-e-posta-bildirimleri-sipariş-dışı--backend) |

## Canlıya giden yol

Son güncelleme: 2026-11-05. Her adım bitince bu bölüm güncellenir.

**Hedef:** Site ve panel sunucuda çalışır; bütün veri sunucudaki
PostgreSQL'de durur; stok SAP'tan okunur, siparişler SAP'a satış siparişi
olarak yazılır; site hızlı ve hatasız çalışır.

**Bugün:** Sitenin ortak bir veri merkezi yok; her ziyaretçinin tarayıcısı
verinin kendi kopyasını tutuyor. Panelde yapılan değişiklik yalnızca o
tarayıcıda görünür; sipariş müşterinin tarayıcısına yazılır. Geçiş bir
ayarla, parça parça yapılıyor (`DATA_SOURCE=database`, KARARLAR K-88):
biten parçalar veritabanından çalışır, ayar kapalıyken demo bugünkü gibi
çalışır.

### Yapılanlar

1. Site ve panel ekranları; iş kuralları (fiyat, KDV, taksit, kupon, stok,
   kayıt numarası) tek yerde ve testli. Sunucu da aynı kodu kullanacak.
2. Veritabanı: 64 tablo, kurulum betikleri, örnek veri yükleme, testler
   ([VERITABANI.md](VERITABANI.md)).
3. Okuma (Aşama 3, bitti): katalog, depo stoğu, mağaza ayarları, bayi ve
   satıcı stoğu, yorumlar ve içerik veritabanından okunuyor; bir kayıt
   değişince etkilenen sayfalar o anda yenilenebiliyor; veritabanı modunun
   kendi tarayıcı testleri var (`npm run test:e2e:db`) ve sayfa boyutu ile
   hız ölçüldü (aşağıda "Ölçüm").
4. Veri yükleme (`npm run db:yukle canli|deneme`, KARARLAR K-91): bugünkü
   veri canlı ya da deneme veritabanına yüklenir; satış hareketleri hiç,
   örnek yorum, kupon ve bayi stokları yalnızca denemeye. Tekrar
   çalıştırılabilir, hiçbir kaydı silmez, stoğun üzerine yazmaz.
5. SAP stok okuma işi (deneme dosyasıyla): `/api/sap/stok` ucu 15 dakikada
   bir zamanlayıcıyla çağrılır; okuma kaydı, tek işlemde yenileme, hatada
   son iyi stoğun korunması, stok değişince sayfaların o anda yenilenmesi
   (`npm run sap:stok` elle okutur). SAP yerine bugün CSV dosyası okunur.
6. Aşama 4 — Üyelik ve oturum sunucuda (KARARLAR K-94, K-95; veritabanı
   modunda): şifre argon2id ile, oturum yalnızca sunucunun okuyabildiği
   çerezde (site 30 gün, panel 8 saat); kayıt, giriş, çıkış, profil, şifre
   değiştirme, hesap silme ve şifre sıfırlama sunucuda; tek giriş hata
   mesajı, yanlış şifre sınırı; panel sayfaları yönetici oturumu olmadan
   gönderilmiyor; `npm run yonetici:olustur`.
7. Next.js 16, güvenlik başlıkları, hata sayfaları; birim, veritabanı ve
   tarayıcı testleri.

### Kalan kod işleri (önerilen sırayla)

| # | İş | Bağlı olduğu |
|---|---|---|
| 1 | **Aşama 5 — Yazma:** sipariş, teklif, form, garanti, servis, iade, yorum ve bütün panel ekranları sunucu üzerinden veritabanına yazar (sıra: 5.1 adresler ve favoriler — bitti; 5.2 siparişler ve iade talebi — bitti; 5.3 teklif, servis, garanti ve yorum formları, e-posta formlarının kaydı ve e-posta kaydı — bitti; 5.4–5.5 birleşti, panel alan alan veritabanından okur ve yazar, değişiklik kaydı ve sayfa yenileme (K-99): 1) Satış — bitti, 2) Talepler — bitti, 3) Katalog (Seçenek Tanımları, Kategoriler ve gruplar, Ürünler) — bitti, 4) Bayiler, satıcılar ve stok (4.1 Bayiler, Online Satıcılar, Satış Temsilcileri — bitti; 4.2 Stok Matrisi görüntüleme ve elle düzeltme — bitti; 4.3 dosya yükleme, eşleştirme, geri alma — bitti; K-103) — bitti, 5) İçerik ve ayarlar (5.1 Mağaza Ayarları ve E-posta Alıcıları — bitti, K-104; 5.2 içerik (Haberler, Etkinlikler, Blog, Hakkımızda, SSS) — bitti; 5.3 yasal metinler, belgeler, Sayfa SEO, Görünüm, şirket ve iletişim bilgileri ile MERSİS no, kargo takip bağlantısı — bitti, K-105) — bitti, 6) Üyeler, işlem kaydı ve e-posta kaydı ekranları, en son panel ana sayfası (6.1 Üyeler; 6.2 İşlem Kaydı ve E-posta Kaydı; 6.3 panel ana sayfası) — bitti; 5.6 örnek veri tarayıcıya gönderilmez, `db:yukle` varsayılanı `eksikler`); tutar, kupon ve stok ödeme anında sunucuda yeniden hesaplanır; kayıt anında ilgili sayfalar yenilenir. En büyük iş. Veri yükleme komutu bundan sonra yalnızca `eksikler` ile çalıştırılır (varsayılanı değişir; K-91): panelde yapılan değişikliklerin üzerine yazılmasın | — |
| 2 | **Aşama 6 — Dosya deposu:** panelden görsel ve belge yükleme hazır (K-108; sunucunun diski, `DOSYA_KLASORU`). Kalan: deponun yeri ve yedeği, istenirse S3 uyumlu depo parçası, kullanılmayan dosyaların temizliği, yorum fotoğraf ve videoları | Depo seçimi (BT) |
| 3 | **SAP stok bağlantısı:** okuma işine SAP'tan okuyan kaynağın eklenmesi (Service Layer ya da salt okunur veritabanı kullanıcısı; bugün deneme dosyası okunuyor); zamanlayıcının seçilen sunucuda kurulması. Küçük iş; bilgiler gelince sırası beklenmeden yapılır | SAP bağlantı bilgileri; canlı sunucunun kurulması |
| 4 | **SAP satış siparişi aktarımı:** aktarım sırası, iş (`/api/sap/siparis`), yeniden deneme ve panel kutusu hazır (K-108; bugün deneme dosyasına yazıyor). Kalan: siparişi SAP'a yazan aktarıcı parça (`packages/db/src/sap-orders.ts` › `SapOrderExporter`), zamanlayıcının kurulması; SAP'a aktarılmış siparişin iptali ve iadesinin SAP'a bildirilmesi | SAP sipariş API'si ve bağlantı bilgileri; cari ve KDV kararları (CANLIYA-CIKIS-SORULARI › 2) |
| 5 | **Gerçek ödeme:** sanal POS ya da ödeme kuruluşu, 3D Secure; kart bilgisi sunucumuza gelmez. Ödeme sağlayıcısı parçası hazır (`packages/db/src/payment.ts`, K-108): kuruluşun parçası eklenir, 3D Secure için ödeme iki adıma ayrılır, ödeme sayfası kart programını sunucudan alır | Ödeme kuruluşu anlaşması |
| 6 | **E-postalar:** form e-postalarının gerçekten gitmesi, müşteriye sipariş onayı ve sözleşme kopyası (yasal zorunlu), havale hatırlatma, kargo bildirimi | Resend hesabı ve `zenweld.com` DNS doğrulaması |
| 7 | **Canlıya hazırlık:** form koruması (bot ve istek sınırı), zamanlanmış işler, hata izleme, yedekten geri dönme denemesi, performans ve güvenlik testleri, deneme ortamı, örnek verinin kaldırılması | Sunucu kararı |

### Kodla çözülmeyen, şimdiden başlatılması gerekenler

Şirketteki kişilere sorulacakların kişiye göre listesi:
[CANLIYA-CIKIS-SORULARI.md](CANLIYA-CIKIS-SORULARI.md).

- **BT:**
  - Canlı sunucu: kendi sunucumuz ve alan adımız (KARARLAR K-92). Yeri
    (KVKK ile birlikte), kurulumu (HTTPS, zamanlayıcı, yedek, izleme) ve
    deneme ortamı.
  - Yönetilen PostgreSQL 18 (canlı ve deneme), yedekleme.
  - Derleme sırasında veritabanına erişim.
  - Birden fazla sunucu çalışacaksa ortak önbellek (ör. Redis); tek sunucuda gerekmez.
- **SAP ekibi:** Aşağıdaki "SAP" bölümündeki sorular.
- **Ödeme kuruluşu:** Seçim ve anlaşma (iyzico, PayTR ya da banka sanal POS'u).
- **E-posta:** Resend hesabı ve `zenweld.com` alan adına Resend'in verdiği DNS kayıtlarının eklenmesi. Bugün hiçbir e-posta gitmiyor ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 2).
- **Hukuk:** Sözleşme metinleri, KVKK, kurumsal alıcıda cayma, ETBİS kaydı, MERSİS numarası; e-Arşiv / e-Fatura entegratörü.
- **İçerik:** Gerçek ürün bilgileri ve fotoğraflar, fiyatlar, kargo ücretleri, IBAN'lar.

### Veriyi canlıya taşıma

- **Tablolar otomatik kurulur:** `npm run db:migrate` boş bir veritabanında
  bütün tabloları kurar; aynı betikler her yayına almada çalıştırılabilir
  (çalışmış betik bir daha çalışmaz). Yönetilen PostgreSQL'de özel yetki
  gerekmez; Türkçe harf karşılaştırması için ICU desteği açık olmalıdır.
- **Veri:** Tablolar kurulduktan sonra `npm run db:yukle canli` (deneme
  veritabanı için `deneme`) bugünkü veriyi yükler (KARARLAR K-91); komut
  onay için veritabanının adını sorar. `npm run db:seed` örnek üye ve
  siparişleri de yüklediği için yalnızca bilgisayarda çalışır. Panel
  veritabanına yazmaya başlayınca (Aşama 5) veri doğrudan panelden girilir;
  komut o zaman yalnızca `eksikler` ile kullanılır.

### Ölçüm (Aşama 3.7, 2026-11-04)

`node scripts/sayfa-olcumu.mjs <adres…>`. Koşullar Google'ın mobil
ölçümündeki gibi: yavaş 4G (1,6 Mbit/sn) ve 4 kat yavaşlatılmış işlemci;
her sayfa boş önbellekle 3 kez, ortanca değer. Boyutlar sıkıştırılmış
(ağdan inen) boyuttur. Ölçüm bilgisayarda yapıldı; sunucunun yanıt süresi
canlı sunucuda ayrıca ölçülmeli.

| Sayfa | Mod | Sayfanın kendisi | JavaScript | Toplam | En büyük içerik (LCP) |
|---|---|---|---|---|---|
| Anasayfa | Demo | 20 KB | 298 KB | 641 KB | 3,0 sn |
| Anasayfa | Veritabanı | 46 KB | 256 KB | 627 KB | 2,9 sn |
| Kategori (Kaynak Makineleri) | Demo | 9 KB | 275 KB | 385 KB | 1,6 sn |
| Kategori (Kaynak Makineleri) | Veritabanı | 31 KB | 275 KB | 429 KB | 1,5 sn |
| Ürün | Demo | 13 KB | 289 KB | 455 KB | 0,8 sn |
| Ürün | Veritabanı | 38 KB | 289 KB | 501 KB | 0,8 sn |
| Sepet | Demo | 8 KB | 306 KB | 488 KB | 2,4 sn |
| Sepet | Veritabanı | 30 KB | 306 KB | 525 KB | 2,4 sn |

- Veritabanı modunda her sayfa ~22–26 KB daha büyük: katalog sayfanın
  içinde geliyor (3.3'te planlandığı gibi; sayfa geçişlerinde tekrar
  inmez). Toplam indirme ve açılış süresi iki modda neredeyse aynı.
- Her sayfada ~300 KB JavaScript iniyor. Bunun ~47 KB'ı tarayıcıya giden
  örnek veri (ürünler, örnek üye ve siparişler dahil); tarayıcı veri
  tutmayı bıraktığında (Aşama 5) çıkar. Gerçek üye ve sipariş verisi
  hiçbir zaman tarayıcı paketine girmemeli. Gerisi sitenin kendisi
  (Next.js ve React, harita, arama, simgeler).
- Anasayfa ve sepette en büyük içeriğin geç görünmesinin başlıca nedeni
  görseller ve JavaScript; görsel küçültme (A5) ve canlı sunucuda
  sıkıştırma/önbellek ayarları canlıdan önce ele alınmalı. Canlı sunucuda
  aynı ölçüm tekrarlanır.

### SAP (özet)

Ayrıntı: aşağıdaki [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap--backend) bölümü.

- **Stok okuma:** SAP'ın stok görünümü (`AVAILABLE_STOCK`) 15 dakikada bir okunur. Okuma işi hazır ve bugün deneme dosyasını okuyor; SAP bilgileri gelince yalnızca bağlantı parçası yazılır (3. madde).
- **Sipariş:** Site siparişleri SAP'a satış siparişi olarak yazılır (4. madde).

## Karar bekleyen frontend işleri (özet)

Backend gerektirmeyen ama bir karara ya da bilgiye bağlı olduğu için
bekleyen site işleri. Ayrıntısı olanlar ilgili bölüme bağlanmıştır.

| İş | Neyi bekliyor | Ayrıntı |
|---|---|---|
| Çerez ayarları penceresi (analiz ve pazarlama çerezlerini ayrı açıp kapama) ve analiz kodlarının kurulması | Hangi analiz aracının kullanılacağı | [Çerezler ve yasal metinler](#çerezler-ve-yasal-metinler) 1–3, [Online satış](#online-satış--canlıya-çıkmadan-önce) 12 |
| Kategori filtrelerinin değerleri ve ürünlere eşlenmesi | Ürünlerin kesinleşmesi; Şebeke Voltajı, Amper ve Güç değerleri. Bugünkü filtreler örnek (KARARLAR K-102) | [Kategori filtreleri](#kategori-filtreleri) |
| Ürün karşılaştırma (bugün yok) | Ürünlerin kesinleşmesi; istenirse (KARARLAR K-102) | — |
| Menü düzeni, sayfalar, metinler | Sahibinin kararı; bugünkü hepsi örnek (KARARLAR K-102). Dört ana bölüm kodda sabit; yeni bölüm ya da sayfa kod işidir | — |
| Ürün Seçici'nin yeniden kurulması | Bütün ürünlerin kesinleşmesi; en son ele alınacak (KARARLAR K-69) | [Ürün Seçici ve arama](#ürün-seçici-ve-arama--en-son-yeniden-tasarlanacak) |
| "İlgili Ürünler" öneri mantığı | Bölümdeki kararlar | "Ürün önerileri" bölümü |
| Teklif Al metinleri | Müdür kararı | [Teklif Al metinleri](#teklif-al-metinleri--herkese-hitap-edecek-şekilde-güncellenecek) |
| Ayrı ürünü seçeneğe dönüştürme ekranı | Gerçek ürünler girilmeye başlanınca karar | [Ürün seçenekleri](#ürün-seçenekleri-3-m--5-m-gibi--backend) 3 |
| Satıcı bilgilerinin sitede gösterilmesi (ETBİS, unvan, MERSİS) | ETBİS kaydı ve şirket bilgileri | "Satıcı bilgileri sitede" bölümü |
| Kargo takip bağlantısı | Kargo firması ve entegrasyon kararı | [Online satış](#online-satış--canlıya-çıkmadan-önce) 9 |
| Müşterinin siparişini sitede iptal etmesi | İleride düşünülecek | "Müşterinin siparişi iptal etmesi" bölümü |
| Kurumsal üyelerde iade talebi | Kurumsal alıcılara cayma hakkının uygulanıp uygulanmayacağı sorulup öğrenilecek | "İade talebi" bölümü |
| KVKK başvuru formu (2b) | İleride düşünülecek; hesap silme için 2a (Hesabımı Sil) seçildi | "Hesap silme — açık konular" 10 |
| Erişilebilirlik (A4) | Sahibin sıralaması; zorunlu değil | "Erişilebilirlik" bölümü |
| Görsel optimizasyonu ve sayfalama (A5) | Sahibin sıralaması; zorunlu değil. Görseller sahibi söyleyince; dosya deposu, gerçek fotoğraflar ve canlıya hazırlıkta hatırlatılır (KARARLAR K-102) | "Görseller ve uzun listeler" bölümü |
| Ekipmanların eksik fotoğrafları (19 ürün ve 4 soğutma hali) ve diğer bölümlerin ürün fotoğrafları | Sahibinin bulup göndermesi | [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler) |
| Ekipmanların gerçek içeriği (açıklama, teknik özellikler, kutu içeriği, öne çıkanlar, kılavuz) | Sahibinin göndermesi (Force serisi 9 ürün geldi) | "Ürün içeriği" 2 |
| Geçici ürün kodlarının (`ZW-GECICI-…`) SAP kodlarıyla değiştirilmesi | SAP kodlarının açılması | "Ürün içeriği" 6 |
| Ekipmanların gerçek fiyatları ve seçenek fiyat farkları | Sahibinin göndermesi | "Ürün içeriği" 3 |
| Ara paket uzunluklarının gerçek değerleri | Sahibinin göndermesi | "Ürün içeriği" 4 |
| Jasic lazer kaynak ürünleri (2026-10-27 listesindeki 6 model; belki çok sonra) | Sahibinin seçenekleri ayrıntılı açıklaması | "Jasic lazer kaynak ürünleri" bölümü |
| Sitenin tasarımı | Sahibi yapacak | "Sitenin tasarımı" bölümü |

## Müşterinin siparişi iptal etmesi — ileride düşünülecek

Bugün müşteri siparişini sitede iptal edemez; iptali yönetici panelden
yapar (KARARLAR K-27'deki eski cümle 2026-10-22'de çıkarıldı). Yapılırsa
karar verilecekler:

- Hangi durumlarda iptal edilebilir (ör. yalnızca Ödeme Bekleniyor ve
  Hazırlanıyor; kargoya verilen sipariş iptal edilemez).
- Kartla ödenmiş siparişte para iadesi K-27'ye göre banka ya da ödeme
  kuruluşu üzerinden ayrıca yapılır; müşteriye bunun söylenmesi.
- Zenweld'e bildirim (e-posta) ve panelde iptal nedeninin görünmesi.

## Erişilebilirlik (A4) — önerilen, zorunlu değil

Türkiye'de özel e-ticaret siteleri için genel bir erişilebilirlik
zorunluluğu bilinmiyor; AB'ye satış yapılırsa durum değişebilir (hukukçuyla
teyit edilmeli). Yapılacaklar:

1. **"İçeriğe atla" bağlantısı:** Sayfanın en başında, Tab'a basınca
   görünen bir bağlantı; klavyeyle gezen ziyaretçi menüyü atlayıp doğrudan
   sayfa içeriğine geçer. Bugün yok.
2. **Klavye odağı her yerde görünsün:** Tab ile gezinirken seçili düğme ya
   da bağlantı belirgin bir çerçeveyle görünmeli; bütün sayfalarda
   denetlenmeli.
3. **Dokunma alanları:** Telefonda düğme ve bağlantılar en az 44 × 44 piksel
   olmalı; küçük simge düğmeler (sepetten çıkar, adet artır/azalt vb.)
   denetlenmeli.
4. **Form etiketleri alanlara bağlansın:** Birçok formda etiket alanla
   bağlı değil (Üye Ol, Teklif Al, panelde ürün formu — "Kod incelemesi
   bulguları" 9); ekran okuyucu alanın adını okuyamaz. Tarayıcı testleri
   de bu yüzden bazı alanları sırasıyla seçiyor.
5. Renk karşıtlığı tasarım aşamasında ele alınacak.

## Görseller ve uzun listeler (A5) — önerilen, zorunlu değil

1. **Görsel optimizasyonu (`next/image`):** Bugün görseller olduğu gibi
   yükleniyor (`ProductImage`, `<img loading="lazy">`). Next.js'in görsel
   bileşeni ekran boyuna uygun küçük sürüm ve WebP/AVIF üretir; sayfa daha
   hızlı açılır, görselin ölçüsü önceden bilindiği için sayfa kayması olmaz
   ("Kod incelemesi bulguları" 6).
   - Panelden yüklenen görseller bugün tarayıcıda (`data:`) durduğu için bu
     yoldan ancak dosya deposu gelince geçebilir ("Görseller ve yüklenen
     dosyalar — backend").
   - `next.config.mjs` içindeki `images.remotePatterns` ve güvenlik
     politikasındaki görsel izni birlikte güncellenmeli.
2. **Sayfalama:** Sitede ve panelde hiçbir liste sayfalanmıyor; kategori
   ürün listesi, arama sonuçları, blog, haberler, etkinlikler ve panelde
   siparişler, üyeler, teklifler, yorumlar tek sayfada. Kayıt sayısı artınca sayfa sayfa
   gösterilmeli. Sitede sayfa adresi (ör. `?sayfa=2`) arama motorları için
   canonical ve site haritasıyla birlikte düşünülmeli.

## Kategori filtreleri

Ekipmanların 8 alt kategorisinin sayfasında filtreler var; filtreler ve
ürünlerin değerleri panelden yönetilir (KARARLAR K-76, IS-KURALLARI › 19).
Ürünler belli olmadığı için bugünkü filtreler ve değerleri örnektir; ürünler
kesinleşince yeniden kurulur (KARARLAR K-102). Kalanlar:

1. **Değerlerin girilmesi:** Şebeke Voltajı, Amper ve Güç (W) filtrelerinin
   değerleri yok; ürünler kesinleşince sahibinden gelecek. Değeri olmayan
   filtre sitede görünmez.
2. **Ürünlere eşleme:** Bugün yalnızca Model Serisi eşli. Çalışma Modu,
   Fiziki Yapı, Lazer Tipi ve değeri girilecek filtreler ürünlere
   işaretlenecek (kategorinin Filtreler sekmesindeki tabloda toplu
   yapılabilir). Eşlenmemiş filtre sitede sonucu daraltmaz; bir ürüne değer
   işaretlenince o filtre değeri girilmemiş ürünleri eler, bu yüzden bir
   filtrenin eşlemesi bütün ürünlerde birlikte tamamlanmalı.
3. Diğer bölümlerin (Güvenlik, Aksesuarlar, Dolgu Metalleri) alt
   kategorilerine filtre isteniyorsa sahibinden değişkenler gelmeli; panelden
   eklenebilir.

## Satıcı bilgileri sitede (ETBİS, unvan, MERSİS)

Alt bilgide bugün adres, telefon ve e-posta var; ticari unvan, MERSİS
numarası ve ETBİS bilgisi yok. Sözleşmelerdeki MERSİS alanı da boş ("[—]").

- ETBİS kaydından sonra Bakanlığın verdiği doğrulama kodu (QR/logo) sitede
  gösterilmeli.
- Satıcının ticari unvanı ve MERSİS numarası sitede kolayca bulunabilmeli
  (alt bilgi ya da İletişim sayfası) ve Ön Bilgilendirme Formu ile Mesafeli
  Satış Sözleşmesi'ne yazılmalı.
- Hangi bilgilerin zorunlu olduğu hukuk danışmanıyla teyit edilmeli
  (bkz. [Online satış](#online-satış--canlıya-çıkmadan-önce) 4).
- Panel (yapıldı, adım 5.3, KARARLAR K-105): Unvan, ofis adresleri,
  telefonlar, e-posta, sosyal medya ve MERSİS numarası Mağaza Ayarları ›
  Şirket ve İletişim'den girilir; MERSİS sözleşmelerin Satıcı bölümüne
  yazılır. Gerçek MERSİS numarası girilmeli. Unvan ve MERSİS'in alt
  bilgide de gösterilip gösterilmeyeceği hukuk danışmanına sorulmalı
  (bugün alt bilgide adres, telefon ve e-posta var; unvan İletişim
  sayfasındaki merkez kartında).

## Ürün seçenekleri (3 m / 5 m gibi) — backend

Panel ve site hazır: Seçenek Tanımları, kategorinin Seçenekler sekmesi, ürünün
Seçenekler sekmesi (en fazla 3 seçenek, kombinasyonlar), ürün sayfası, sepet,
sipariş ve Teklif Al. Veri şimdilik tarayıcıda. Örnek veride 17 makinede var
(Soğutma, Torç Uzunluğu, Ara Paket Uzunluğu, Tepe Güç; uzunluklar temsili).
Önerilen tablo yapısı: [VERI-MODELI.md](VERI-MODELI.md) › Ürünler ›
Seçenekler (KARARLAR K-70).

1. **Tablolar:**
   - `option_definitions`: seçenek adı ("Torç Uzunluğu"); ad benzersiz.
   - `option_values`: tanım, ad ("4 m"), sıra; tanım içinde ad benzersiz.
   - `category_options`: kategori ↔ tanım; yalnızca bağlantı (bu kategorideki
     ürüne seçenek eklenirken hangi tanımlar listelenir). Kategori ya da tanım
     silinince bağlantı da silinir (CASCADE).
   - `product_options`: ürün, tanım, sıra (ürün başına en fazla 3; (ürün,
     tanım) benzersiz).
   - `product_variants`: ürün, ürün kodu, fiyat farkı (KDV hariç) ve yalnızca
     farklı olanlar: teknik özellik satırları, kutu içeriği, fotoğraf. Ürün
     silinince satırlar da silinir (CASCADE).
   - `variant_values`: varyant, tanım, değer. (varyant, tanım) benzersiz;
     aynı üründe aynı kombinasyon tek.
   - Seçeneksiz ürün de tek varyantlı tutulmalı (varsayılan varyant); bugün
     demoda kodu ve fiyatı ürünün üstünde.
2. **Kurallar (veritabanında da sağlanmalı; bugün panel kontrol ediyor):**
   - Varyantın her seçenekten tam bir değeri olur; değer o seçeneğin
     tanımından olur.
   - Üründe kullanılan değer ve tanım silinemez (RESTRICT); panel kaç üründe
     kullanıldığını yazar.
   - Ürün kodları tek havuzda benzersiz: ürün kodu ve varyant kodu başka hiçbir
     ürün ya da varyant koduyla aynı olamaz. İki tabloya yayıldığı için ortak
     bir kod tablosu (kod UNIQUE, ürün, varyant) ya da tetikleyici gerekir.
     Bayi ve satıcı stok dosyaları bu kodla eşleşir (`buildCodeIndex`).
   - Varyant üründen kaldırılınca stok satırları (`dealer_stock`,
     `retailer_stock`) ve kod eşleştirmeleri (`sku_aliases`) aynı işlemde
     (transaction) silinir (bugün: `saveProduct`). Ürünün seçenek listesi
     değişince bütün varyantlı stok satırları silinir. Stok tablolarında
     `variant_id = ''` ürünün tüm varyantları demektir ([STOK.md](STOK.md)).
3. **Eski linkler:** Ayrı bir ürün seçeneğe dönüştürülünce eski linki
   `/urun/<ürün>?secenek=<varyant>` adresine 301 ile yönlenmeli (örnek:
   `/urun/<eski ürün>` → `/urun/<ürün>?secenek=4-m`). Bunun için
   SEO bölümündeki `previous_paths` tablosuna seçenek (değer) sütunu eklenir.
   Demoda tarayıcı yönlendiriyor (`movedProductPath`). Panelde ayrı ürünü
   seçeneğe dönüştürme ekranı yok. Eklenip eklenmeyeceğine gerçek ürünler
   girilmeye başlanınca karar verilecek. Ekran yapılırsa tek adımda:
   seçeneği eski ürünün koduyla kurar, eski linki seçeneğe yönlendirir,
   stok satırlarını, kod eşleştirmelerini ve yorumları taşır, ayrı ürünü
   kaldırır. Bugün elle yapılırsa eski link 404 verir, yorumlar görünmez olur
   ve stoklar bir sonraki stok dosyasına kadar boş kalır.
4. **Sipariş ve teklif:** `order_items` ve `quote_items` o anki ürün adını,
   seçenekleri ("Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m") ve kodunu kopya
   olarak saklar; sonradan ad değişse ya da varyant silinse de geçmiş kayıt
   değişmez. Sepet ve teklif listesi ürün ve varyant kimliğini tutar.
5. **Yorumlar** ürüne bağlıdır (`reviews.product_id`); tüm varyantlar aynı
   yorumları gösterir.
6. **Sayfa adresi:** `?secenek=` sayfayı yalnızca o varyantla açar. Canonical
   adres parametresizdir; site haritasında ürün tek satırdır.
7. **SAP ve bayi kodları (stok ve sipariş tasarımında karar verilecek):**
   - SAP Business One'da her satılabilir kalem ayrı bir kalemdir; doğal eşleşme
     "varyant kodu = SAP kalem kodu"dur.
   - Bazı kombinasyonların kodu sitede türetilir (ör. SAP'taki makine kodunun
     sonuna torç uzunluğu: `-4M`, `-8M`). Bu kodların SAP'ta da açılıp
     açılmayacağına karar verilecek.
   - Bayilerin stok dosyasında yalnızca SAP kodu (torç uzunluğu belirtilmeden)
     gelirse bugün ya ürünün ana koduyla eşleşir (bütün kombinasyonlarda
     stokta görünür) ya da tanınmayan kod olarak elle tek bir kombinasyona
     eşleştirilir. Bir SAP kodunun birden çok kombinasyona (ör. Hava · 4 m ve
     Hava · 8 m) sayılması istenirse eşleştirme buna göre genişletilmeli.

## Canlı sunucu (hosting) ve Vercel temizliği

Sahibinin kararı (KARARLAR K-92, 2026-11-04): canlı site Vercel'de değil,
kendi sunucumuzda ve kendi alan adımızla yayınlanır. Demo şu an Vercel'de
(derleme sunucusu ABD'de, Washington, D.C.) ve öyle kalır.

- **Sunucunun yeri ve KVKK:** Backend geldiğinde müşteri verisi sunucuda
  tutulacak. Türk kullanıcıların kişisel verisinin yurt dışında tutulması
  KVKK kapsamında değerlendirilmeli; sunucunun yeri hukuk/BT ile belirlenir.
- **Kurulum:** Site standart bir Node.js uygulamasıdır (`npm run build` +
  `npm start`, Node.js 22). Önünde HTTPS sağlayan bir web sunucusu (ör.
  nginx), zamanlayıcı (SAP stok okuma, [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)
  › 9), yedek ve izleme. `NEXT_PUBLIC_SITE_URL` = `https://zenweld.com`
  tanımlanır; site bu alan adında kendiliğinden arama motorlarına açılır.
  Alan adı `zenweld.com` değilse `src/lib/seo.ts` içindeki
  `INDEXABLE_HOSTS` güncellenmeli.
- **Görseller:** Next'in görsel küçültmesi sunucuda çalışır (`sharp`);
  sunucuda kurulu olmalı.
- **Önbellek:** Tek sunucuda Next'in kendi önbelleği (diskte) yeterli.
  Birden fazla sunucu çalışırsa önbellek ortak bir yerde (ör. Redis)
  tutulmalı.
- **Demo Vercel'den kalkınca** Vercel'e özel parçalar kaldırılır (yaklaşık
  10 dakika):
  - `apps/zenweld-web/vercel.json`
  - `apps/zenweld-web/src/lib/seo.ts` dosyasındaki `getSiteUrl()` içinde
    `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` yedeği ve önizleme
    sürümlerinin aramaya kapatılması (`VERCEL_ENV`)
  - README, `.env.example` ve kod yorumlarındaki Vercel anlatımları

## Next.js 16

2 Kasım 2026'da Next.js 16.4.4 ve React 19.3'e geçildi (KARARLAR K-87).

- **Güvenlik taraması:** `npm audit --omit=dev` (siteye giden
  kütüphaneler) 0 açık. Tamamı 20 orta düzey uyarı, hepsi geliştirme
  araçlarında: kod denetimi (ESLint) zincirindeki `minimatch` ve
  `drizzle-kit`'in içindeki eski `esbuild`. İkisi de yalnızca
  geliştiricinin bilgisayarında çalışır, siteye ve sunucuya girmez,
  dışarıdan veri almaz. Düzeltilmiş sürümleri çıkınca `npm update` ile
  alınır.
- **Yeni önbellek (Cache Components) açılmadı:** Next 16'nın yeni önbellek
  yöntemi denendi (2026-11-04). Açılınca Next, gezinirken önceki sayfaları
  silmeyip gizli tutar: formdan çıkıp linkle geri dönünce eski yazılanlar,
  açık menüler ve pencereler olduğu gibi kalır; bu, demo modunda da siteyi
  ve paneli değiştirir. Ayrıca adreste kimlik olan bazı sayfalar ayrıca
  işaretlenmeli, e-posta rotalarındaki `runtime` ayarı kaldırılmalı ve
  tarayıcı testlerinin bir kısmı gizli sayfaları da gördüğü için
  güncellenmelidir. Bugün klasik önbellek (sayfanın belirli aralıkla
  yeniden hazırlanması) kullanılıyor; Next 16 bunu destekliyor. Yeni
  yönteme geçmek, sahibin kararıyla ayrı bir iş olarak yapılır (formların
  geri dönüşte sıfırlanması bileşen bileşen ele alınır).
- **Kapatılan kural:** 16 ile gelen `react-hooks/set-state-in-effect`
  kuralı kapalı (eslint.config.mjs). Şu bileşenler tarayıcı deposunu sayfa
  açıldıktan sonra okuyup durumu efektte yazar: sepet, favoriler, teklif
  listesi, oturum (`packages/auth`), çerez bandı, karşılama penceresi ve
  birkaç görünüm ayarı. Veri sunucuya taşınırken (Üyelik ve Yazma adımları)
  bu bileşenler `useSyncExternalStore` ya da sunucu verisiyle yeniden
  yazılır ve kural yeniden açılır.

## Güvenlik başlıkları — canlıya çıkarken

Başlıklar `apps/zenweld-web/next.config.mjs`'de; ne yaptıkları
[ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9. Barındırma ve ortam
değişkenleri › Güvenlik başlıkları'nda.

**Bilerek gevşek bırakılanlar** (bugünkü yapıda başka yolu yok; canlıya
çıkarken sıkılaştırılmalı):

1. **Alt alan adları (HSTS):** Bugün yalnızca sitenin kendi adresi her zaman
   https ile açılır. `zenweld.com`'un bütün alt alan adlarının (ör. posta,
   eski uygulamalar) https çalıştığı BT ile doğrulanırsa `includeSubDomains`
   eklenir; tarayıcıların hazır listesine (`preload`) girmek ayrı bir karardır
   ve geri alınması aylar sürer.
2. **Satır içi kod izni:** Politika satır içi kodlara izin veriyor
   (`'unsafe-inline'`), çünkü sayfalar önceden üretiliyor ve Next.js sayfa
   verisini satır içi yazıyor. Kaldırmak için her isteğe özel anahtar (nonce)
   gerekir; bu da sayfaların her istekte sunucuda üretilmesi demektir. Backend
   ve barındırma kararıyla birlikte değerlendirilmeli.
3. **Görsel adresleri:** Politika her `https` adresinden görsel yüklemeye
   izin veriyor, çünkü panelde herhangi bir görsel adresi girilebiliyor.
   Görseller kendi dosya deposuna taşınınca ("Görseller ve yüklenen
   dosyalar — backend") izin yalnızca o depoya ve gerçekten kullanılan dış
   adreslere (harita döşemeleri vb.) daraltılmalı; panelde dış görsel adresi
   girme kaldırılmalı ya da yalnızca bu adreslere izin vermeli.

**Dikkat edilecekler:**

4. **Yeni dış servisler:** Ödeme kuruluşu (3D Secure sayfası), analiz kodu,
   canlı destek gibi her yeni servisin adresi politikaya eklenmeli; yoksa
   tarayıcı engeller.
5. **Vercel araç çubuğu (yorumlar):** Vercel, önizleme adreslerinde Vercel
   hesabıyla giriş yapmış ekip üyelerine sayfanın altında küçük bir araç
   çubuğu gösterir. Bununla sayfanın bir noktasına iğne gibi yorum
   bırakılabilir ve ekip yorumlara yanıt verebilir (tasarım ve metin geri
   bildirimi için). Ziyaretçiler bu çubuğu görmez. Bugün kullanılmıyor.
   Güvenlik politikası bu çubuğu engelleyebilir; site bundan etkilenmez.
   Kullanılmak istenirse Vercel'in belgesindeki adresler (`vercel.live`
   vb.) politikaya eklenir. Vercel'den ayrılınca konu kalkar.

## Zenweld – bayi B2B uygulaması

Zenweld ile bayiler arasındaki teklif ve siparişler (bayinin Zenweld'den mal
alması) ana siteden çıkarıldı. Bunlar için ayrı bir B2B uygulaması
geliştirilecek. Bayi hesaplarını kimin açıp yöneteceği de bu uygulamayla
birlikte netleşecek.

## Blog yazıları — yayına girmeden önce

Blog yazıları arama motorlarına açık ve site haritasında. Örnek yazıların
gövdesi ve özeti hâlâ yer tutucu metin (Lorem ipsum,
`packages/data/src/seed/content.seed.ts`). Site zenweld.com'da yayına girmeden
önce bu yazılar gerçek metinlerle değiştirilmeli ya da panelden yayından
kaldırılmalı; yoksa Google bu metni Zenweld'in içeriği olarak listeler.

## Ürün içeriği — gerçek fotoğraflar ve teknik değerler

Ekipmanlar'daki 35 ürün sahibinin listesinden (2026-10-27) girildi: ad, ürün
kodu (SAP kodu), alt grup, garanti ve seçenekler gerçektir (KARARLAR K-71,
K-72). Aşağıdakiler gerçekleri gelince değiştirilmeli: panelde Ürünler ›
ürün; örnek veride `packages/data/src/seed/products.seed.ts` ("ORNEK" ve
"TEMSILI" notları) (KARARLAR K-73).

1. **Fotoğraflar:** Bkz. [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler).
2. **Ekipmanların içeriği (örnek):** Force serisi 9 üründe (ForceArc 200 /
   250 / 280, ForceMIG 125 / 185 MP / 200 / 205 DP, ForceTIG 200, ForceCut 45)
   teknik özellikler, açıklama, kutu içeriği ve öne çıkan özellikler
   sahibinin ikinci listesinden gelir (`machine-content.seed.ts`); kısa
   açıklama açıklamanın ilk cümlesidir. Bunlardan 4'ünün kısa açıklaması 160
   karakteri aşıyor (ForceMIG 125, 185 MP, 200 ve ForceCut 45); Google'da
   sonu kesilebilir, panelin SEO sekmesinden kısa bir açıklama yazılabilir
   (öneri). Diğer ekipmanlarda kısa ve uzun açıklama (seçeneklerden
   üretilen bir cümle ve lorem ipsum), teknik özellikler (yalnızca Marka,
   Ürün Kodu, Ürün Türü), kutu içeriği (ana ünite, torç, kullanım kılavuzu),
   öne çıkan özellikler (seçenekler ve garanti) ve kullanım kılavuzu
   bağlantısı (`#`, hiçbir yere gitmiyor). Amper, devrede kalma, ağırlık gibi
   teknik değerler bilerek uydurulmadı; gerçekleri girilmeli.
3. **Fiyatlar (temsili):** Ekipmanların hepsi 999.999 ₺ + KDV (KDV dahil
   1.199.998,80 ₺); seçenekler arasında fiyat farkı yok. Örnek siparişler,
   panel grafikleri, kampanyalı ürünler ve bayi stok fiyatları da bu
   fiyattan hesaplanıyor. Gerçek fiyatlar ve seçenek farkları (ör. su
   soğutma, 8 m torç) gelince girilmeli.
4. **Ara paket uzunlukları (temsili):** MIG makinelerinde 5 m ve 10 m.
   Gerçek değerler gelince Seçenek Tanımları › Ara Paket Uzunluğu ve dört
   makinenin (Ultimate 405 MTS, Ultimate 505 MTS, Evomig 405 P, Evomig 555 P)
   kombinasyonları düzeltilmeli; kodların `-AP5M`, `-AP10M` kısmı da değişir.
5. **Diğer bölümler:** Aksesuar, güvenlik ve dolgu metali ürünleri,
   kampanyalar ve örnek yorumlar hâlâ örnek veridir.
6. **Geçici kodlar:** SAP kodu verilmeyen 5 ürünün kodu geçicidir (KARARLAR
   K-75): ForceArc 250 (`ZW-GECICI-FORCEARC250`), ForceArc 280, ForceMIG 125,
   ForceMIG 185 MP, ForceMIG 205 DP. SAP kodları açılınca panelden (Ürünler ›
   ürün › Ürün Kodu) değiştirilmeli; bayi ve satıcı stok dosyaları kodla
   eşleştiği için bundan önce stok dosyalarında bu ürünler eşleşmez.

## Ürün fotoğrafları — eksikler

Ekipmanların gerçek fotoğrafları sahibinden gelir (KARARLAR K-77). Fotoğraf
`apps/zenweld-web/public/images/products/` klasörüne aşağıdaki adla yüklenir;
sonra `.webp` hali üretilir ve ürün örnek veriye bağlanır
(`packages/data/src/seed/products.seed.ts` › `MACHINE_PHOTOS`; bkz.
klasördeki `BURAYA-GORSEL-YUKLEYIN.md`). Fotoğrafı olmayan ürün ve soğutma
hali, alt kategorinin kart çizimini gösterir. Force serisinin 9 ürünü
(ForceArc 200, 250, 280; ForceMIG 125, 185 MP, 200, 205 DP; ForceTIG 200; ForceCut 45) şimdilik ortak geçici bir fotoğraf
gösterir (`force-serisi-gecici.webp`, KARARLAR K-77 eki); gerçekleri gelince
geçici fotoğraf kaldırılır.

**Çeşit:** 2 = hava ve su soğutmalı hali ayrı fotoğraf; 1 = tek fotoğraf.
Ekipmanların 40 ürününden 17'sinin fotoğrafı tam; 19 üründe hiç fotoğraf yok,
4 üründe bir soğutma hali eksik. Sahibi bu fotoğrafları bulamadı; bulununca
yüklenecek (2026-10-28):

| Kategori | Model | Çeşit | Eksik | Yüklenecek dosya adı |
|---|---|:-:|---|---|
| MMA | Ultimate 255 MMA | 1 | Fotoğraf | `ultimate-255-mma.jpg` |
| MMA | ForceArc 200 MMA | 1 | Fotoğraf | `forcearc-200-mma.jpg` |
| MMA | ForceArc 250 MMA | 1 | Fotoğraf | `forcearc-250-mma.jpg` |
| MMA | ForceArc 280 MMA | 1 | Fotoğraf | `forcearc-280-mma.jpg` |
| MMA | ForceArc 400 CEL MMA | 1 | Fotoğraf | `forcearc-400-cel-mma.jpg` |
| TIG | Ultimate 405 THP | 2 | Hava | `ultimate-405-thp-hava-sogutmali.jpg` |
| TIG | ForceTIG 200 | 1 | Fotoğraf | `forcetig-200.jpg` |
| MIG | Ultimate 505 MTS | 2 | Hava | `ultimate-505-mts-hava-sogutmali.jpg` |
| MIG | Evomig 405 P | 2 | Hava | `evomig-405-p-hava-sogutmali.jpg` |
| MIG | Evomig 555 P | 2 | Hava | `evomig-555-p-hava-sogutmali.jpg` |
| MIG | Evomig 255 P | 1 | Fotoğraf | `evomig-255-p.jpg` |
| Çok Fonksiyonlu | ForceMIG 125 | 1 | Fotoğraf | `forcemig-125.jpg` |
| Çok Fonksiyonlu | ForceMIG 185 MP | 1 | Fotoğraf | `forcemig-185-mp.jpg` |
| Çok Fonksiyonlu | ForceMIG 200 | 1 | Fotoğraf | `forcemig-200.jpg` |
| Çok Fonksiyonlu | ForceMIG 205 DP | 1 | Fotoğraf | `forcemig-205-dp.jpg` |
| Plazma | ForceCut 45 | 1 | Fotoğraf | `forcecut-45.jpg` |
| Lazer Kaynak | Y300 QCW | 1 | Fotoğraf | `y300-qcw.jpg` |
| Lazer Temizleme | Jasic LS-20000F | 1 | Fotoğraf | `jasic-ls-20000f-lazer-temizleme.jpg` |
| Lazer Temizleme | Jasic LS-30000D | 1 | Fotoğraf | `jasic-ls-30000d-lazer-temizleme.jpg` |
| Lazer Temizleme | Jasic 300 W Puls | 1 | Fotoğraf | `jasic-300-w-puls-lazer-temizleme.jpg` |
| Lazer Markalama | FC-50 | 1 | Fotoğraf | `fc-50.jpg` |
| Lazer Markalama | UV-5 | 1 | Fotoğraf | `uv-5.jpg` |
| Lazer Markalama | Jasic 30 W Fiber | 1 | Fotoğraf | `jasic-30-w-fiber-lazer-markalama.jpg` |

Jasic LS-20000F için yüklenen fotoğraf yanlış çıktı (makinenin üzerinde
"LS-15000F" yazıyordu) ve sahibinin isteğiyle silindi.

Güvenlik, Aksesuarlar ve Dolgu Metalleri'nde bugün ürün yok (örnek ürünler
silindi, KARARLAR K-78); ürün eklenince fotoğrafı panelden verilir.

## Jasic lazer kaynak ürünleri — sahibi ayrıntılı açıklayacak

Sahibinin 2026-10-27 listesinde (ilk ürün listesi Excel'i) Lazer Kaynak alt
grubundaki 15 Jasic satırı (6 model) henüz girilmedi (KARARLAR K-74): LS-15000F
(5 satır), LS-20000F (5), LS-30000D (2), ALS-40, LS-20000IV, LS-15000IV.
Sahibinin kararıyla sonra girilecek; belki çok sonra. Girerken netleşecekler:

1. **Seçenekler:** Listede "Tel sürme ünitesi (tel sürmesiz / dahili / harici
   tek tel / harici çift tel / harici üç tel / otomasyon)" ve "Torç tipi
   (SUP23T / SUP27S / SUP32T / SUP26AS)" yazıyor; satırlar bunların karışımı
   (ör. "tek tel sürmeli", "27S kafalı", "SUP26A otomasyon"). Hangi model
   hangi kombinasyonlarla satılıyor ve kodları ne?
2. "LS-20000F 25A Otomasyon Kafalı" satırındaki 25A, torç tipleri listesinde
   yok.
3. ALS-40, LS-20000IV ve LS-15000IV'ün tek satırı var ama seçenek yazısı da
   var; seçenekleri var mı?
4. Ad ve link: "Jasic LS-15000F Lazer Kaynak Makinesi" gibi (KARARLAR K-08
   eki, K-71). Lazer Temizleme'deki Jasic LS-20000F / LS-30000D ile
   karışmasın diye link `jasic-ls-20000f-lazer-kaynak` gibi olmalı.
5. **Fotoğraf:** 2026-10-28'de Lazer Temizleme'deki LS-20000F için yüklenip
   silinen fotoğrafta "LS-15000F" yazıyordu; LS-15000F lazer kaynak
   makinesinin fotoğrafı olabilir. Ürün girilirken sahibinden yeniden
   istenmeli.

## Sitenin tasarımı — sahibi yapacak

Tasarım (renk, yerleşim, yazı tipi, efektler) sahibi tarafından sonra
yapılacak; bugünkü görünüm geçicidir. Tasarım yapılırken:

1. Bütün özellikler korunmalı (davranış: WEBSITE-KULLANIM ve
   ADMIN-KULLANIM). Menü düzeni, sayfalar ve metinler de sahibinin
   isteğiyle değişebilir; bugünkü hepsi örnek (KARARLAR K-102). Değişen
   davranış belgelere ve testlere işlenir.
2. Tasarımdan sonra tarayıcı testleri (`npm run test:e2e`) ve kabul kontrol
   listesi çalıştırılmalı. Testler bazı form alanlarını ekrandaki sırasıyla
   seçiyor (Üye Ol, Teklif Al); formların yapısı değişirse testler de
   güncellenmeli.
3. Renk karşıtlığı bu aşamada ele alınacak ("Erişilebilirlik (A4)" 5).
4. Tasarım öncesi kodun yedeği GitHub'da `yedek/2026-10-22-tasarim-oncesi`
   dalında.

## Online satış — canlıya çıkmadan önce

Sitedeki sepet, ödeme ve sipariş akışı demo modunda tarayıcıda; veritabanı
modunda sipariş sunucuda kaydediliyor (Aşama 5.2), ödeme temsili. Canlı için:

1. **Ödeme kuruluşu** (iyzico, PayTR veya bankanın sanal POS'u): 3D Secure,
   kartın BIN'ine göre gerçek taksit oranları, iade/iptal. Kart bilgisi hiçbir
   zaman bizim sunucumuza gelmemeli (kuruluşun ödeme formu kullanılmalı).
   Mağaza Ayarları → Kartla Taksit'teki banka POS'ları gerçek sanal POS'larla
   eşleştirilmeli; POS'ların API anahtarları ve şifreleri yalnızca sunucuda
   saklanmalı, panelde/tarayıcıda tutulmamalı. Kuruluşun ödeme/3D Secure
   sayfasının adresi sitenin güvenlik politikasına (CSP) eklenmeli
   (`frame-src` ya da `form-action`).
2. **Fiyat ve tutarlar sunucuda yeniden hesaplanır** (veritabanı modunda
   yapıldı, Aşama 5.2): tarayıcıdan gelen tutara güvenilmez, sipariş
   numarasını sunucu verir. Ödeme kuruluşu bağlanınca çekilecek tutar bu
   hesaptan alınmalı.
3. **Hukuk metinleri**: Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi,
   İade/Cayma koşulları — şu anki metinler taslak, hukuk danışmanı yazmalı.
   Kurumsal (ticari) alıcılara cayma hakkının uygulanıp uygulanmayacağı netleşmeli.
4. **ETBİS kaydı** (Ticaret Bakanlığı e-ticaret bilgi sistemi) yapılmalı ve
   satıcının MERSİS numarası panelden (Mağaza Ayarları › Şirket ve
   İletişim) girilmeli; sözleşmelerdeki alan hazır (K-105).
5. **e-Arşiv / e-Fatura** entegrasyonu (muhasebe yazılımı veya entegratör).
6. **Müşteriye e-posta bildirimleri**: sipariş onayı + sözleşme kopyası
   (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi. (Zenweld'e
   "yeni sipariş" e-postasının kodu hazır; Resend kurulmadığı için bugün
   hiçbir e-posta gitmiyor, 7. madde.)
7. **Form e-postaları için Resend kurulumu**: sunucuda `RESEND_API_KEY` ve
   doğrulanmış gönderici adresi `SUPPORT_FROM` tanımlanmalı. Tanımlı değilse
   canlıda yalnızca e-postayla giden formlar (iletişim, bayilik, Welders Club)
   ziyaretçiye hata gösterir.
8. **Zamanlanmış iş**: süresi dolan havale siparişlerini iptal eden günlük iş
   (bugün sipariş sayfaları açılınca yapılıyor; veritabanı modunda üyenin
   siparişleri okunurken sunucuda, `packages/db/src/orders.ts` ›
   `cancelExpiredTransfers`; günlük iş aynı fonksiyonu çağırabilir).
9. **Kargo entegrasyonu** (isteğe bağlı): takip numarasından takip
   bağlantısı yapıldı (adım 5.3, K-105): her firmaya takip sayfasının adresi
   girilir, müşteri ve panel sipariş detayında bağlantı çıkar. Gerçek takip
   adresleri kargo firmalarından öğrenilip girilmeli. Kargo firması API
   verirse (sahibiyle konuşulacak, K-106):
   - Kurgu: firma kaydı (`carriers`) bağlantı türünü taşır; sunucuda firma
     başına bir bağlantı parçası yazılır; API anahtarı ve şifresi yalnızca
     sunucuda ortam değişkeni olur.
   - Yapılabilecekler: kargo etiketinin ve takip numarasının panelden
     oluşturulması, durumun (yolda, dağıtımda, teslim edildi) firmadan
     okunup siparişe (`shipments.delivered_at`) yazılması, "kargoya verildi"
     ve "teslim edildi" e-postaları ("Müşteriye e-posta bildirimleri").
   - Takip bağlantısı tek yerden üretilir (`packages/data/src/shipping.ts` ›
   `trackingLink`); API gelince yalnızca orası ve bağlantı parçası değişir.
   - Sorulacak: kargo ücreti bugün sabit (sınırın altında tek ücret);
     desi, ağırlık ya da bölgeye göre ücret istenecek mi?
10. **Gerçek kargo ücreti, vade farkı oranları ve IBAN'lar** Mağaza Ayarları'na
   girilmeli (şu an örnek değerler).
11. **Örnek satış hareketleri silinmeli**: panel grafikleri için üretilen örnek
    üye, sipariş, teklif, servis talebi ve garanti kayıtları
    (`packages/data/src/seed/sample-activity.seed.ts` ve `index.ts`'teki çağrısı).
12. **Ziyaretçi verileri** (ziyaret sayısı, ziyaretten siparişe dönüşüm, sepette
    bırakılan ürünler) için Google Analytics vb. kurulmalı; çerez onayına bağlı yüklenmeli.

## İade talebi — kurumsal üyeler ve backend

1. **Kurumsal üyeler için sor, öğren:** İade talebi düğmesi bugün yalnızca
   bireysel üyede (KARARLAR K-65). Kurumsal (ticari) alıcılara cayma
   hakkının uygulanıp uygulanmayacağı hukukçuya ve müdüre sorulup
   öğrenilmeli ("Online satış" 3'teki açık soruyla aynı konu). Uygulanacaksa
   `packages/data/src/returns.ts` › `canRequestReturn` içindeki rol kontrolü
   kaldırılır.
2. **Sunucu:** Veritabanı modunda yapıldı (Aşama 5.2, K-97): talep
   sunucuda açılıyor; süre, adet ve siparişin sahibi sunucuda denetleniyor.
   Panelde talebin durumu ve iç notu da sunucuya yazılıyor (Panel 1. alan,
   K-99).
3. **Ürünün geri gönderilmesi:** Müşteriye kargo kodu ya da gönderim adresi
   verilmesi, ürün depoya ulaşınca kontrol edilmesi süreci tanımlanmalı.
4. **Para iadesi:** Ödeme kuruluşunun iade işlemi bağlanırsa onaylanan
   talepten iade başlatılabilir ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) ›
   Kartla ödeme 7).
5. **Süreç şirketle konuşulacak (KARARLAR K-105, 2026-11-05):** Bugünkü
   düzen ayarsız kalır; şirketle konuşulup karar verilince düzenlenir.
   Konuşulacaklar:
   - Kim inceler, talep kaç günde yanıtlanır.
   - Ürün nasıl geri gelir: kargo firması ve anlaşmalı iade kodu, adres,
     kargo ücretini kim öder (cayma ile kusurlu/yanlış ürün ayrımı).
   - Ürün depoya ulaşınca kontrol; açılmış, kullanılmış ya da eksik ürün.
   - Para iadesi kaç günde, hangi yolla (kart, havale); kısmi iade.
   - Değişim (aynı ürünün yenisi) olacak mı.
   - Müşteriye hangi aşamada e-posta gider ("Müşteriye e-posta
     bildirimleri" 4).
   - Kurumsal üyeler (1. madde).
   - "İade ve Değişim" yasal metni (`/yasal/iade`) bu karara göre
     güncellenir.

## Veritabanı — bütün kayıtlar (backend)

Bugün bütün kayıtlar (ürünler, siparişler, üyeler, teklifler, ayarlar…)
ziyaretçinin tarayıcısında duruyor (`zenweld.db.v1`). Her tarayıcı kendi
kopyasını görür; panelde yapılan değişiklik müşteriye ulaşmaz.

1. Bütün kayıt türleri sunucu veritabanına (PostgreSQL, KARARLAR K-81)
   taşınmalı. Kayıt türleri, alanlar, ilişkiler ve silme kuralları:
   [VERI-MODELI.md](VERI-MODELI.md); tablolar ve kolonlar:
   [VERITABANI.md](VERITABANI.md) (liste onaylandı).
   - Aşama 1 (bitti): tablo ve kolon listesi → geçiş betikleri, yerel
     PostgreSQL, komutlar ve veritabanı testleri (`packages/db`) → örnek
     veriyi yükleme (`npm run db:seed`; yalnızca bilgisayarda, boş
     veritabanına). Site bu sırada tarayıcıda çalışmaya devam eder.
   - Canlı için ilk yükleme: `npm run db:yukle canli` (KARARLAR K-91);
     örnek üye, sipariş, teklif, servis, garanti, yorum, kupon ve bayi stok
     listeleri yüklenmez. Bayiler, satıcılar, POS ve IBAN bilgileri açılıştan
     önce gerçekleriyle değiştirilir.
   - Canlıda her gün `SELECT purge_audit_log();` çalıştırılmalı (2 yıldan
     eski değişiklik kayıtları; sunucudaki zamanlanmış iş ya da `pg_cron`).
   - BT ekibinden istenecekler: PostgreSQL 18 (olmazsa en az 16), yönetilen servis
     (AWS RDS ya da Google Cloud SQL), ICU desteği açık (Türkçe harf
     karşılaştırması); canlı ve deneme için iki veritabanı; bağlantı adresi
     (`DATABASE_URL`, yalnızca sunucuda); şifreli (SSL) bağlantı; günlük
     yedek ve en az 30 gün geriye dönüş; KVKK'ya uygun bölge (bkz. Canlı
     sunucu); görseller ve belgeler için dosya deposu (S3 ya da Cloud
     Storage).
   - Aşama 3 (sürüyor): site veriyi veritabanından okur. 3.0 Next.js 16
     (bitti, K-87) → 3.1 okuma katmanı (bitti, `packages/db/src/read.ts`)
     → 3.2 veri kaynağı ayarı (bitti, `DATA_SOURCE=database`, K-88) → 3.3
     katalog sunucudan (bitti, `apps/zenweld-web/src/lib/server/catalog.ts`)
     → 3.4 ağır veri yalnızca gereken sayfaya (bitti: ürün sayfası o ürünün
     bayi ve satıcı stoğunu, bayileri ve yorumlarını; Bayi Bul bayileri;
     anasayfa bayileri ve öne çıkan yorumları alır) → 3.5 içerik sayfaları
     (bitti, `apps/zenweld-web/src/lib/server/content.ts`: blog, haber,
     etkinlik, SSS, yasal metinler, Hakkımızda, satış temsilcileri, belge
     sayfaları, Sayfa SEO; uzun metinler yalnızca kendi sayfasına) → 3.6
     önbellek (bitti: `lib/server/refresh.ts` › `refreshSite`, kayıt türüne
     göre etkilenen sayfaları o anda yeniler; `/api/yenile` ve
     `npm run site:yenile`; veritabanına ulaşılamazsa anlaşılır hata, site
     son hazırlanmış sayfaları göstermeye devam eder) → 3.7 veritabanı
     modunda tarayıcı testleri ve ölçüm (bitti: `npm run test:e2e:db`,
     `scripts/sayfa-olcumu.mjs`; sonuçlar yukarıda "Ölçüm"). Aşama 3 bitti.
   - Veritabanı modunun bugünkü sınırları (Aşama 5'te kalkar):
     - Panelin Satış (Siparişler, İade Talepleri, Kuponlar), Talepler
       (Teklifler, Servis Talepleri, Garantiler, Yorumlar, Bayilik
       Başvuruları, Mesajlar, Welders Club), Katalog (Seçenek Tanımları,
       Kategoriler ve gruplar, Ürünler), Bayiler, Online Satıcılar, Satış
       Temsilcileri, Stok Matrisi, Mağaza Ayarları (e-posta alıcıları
       dahil), Görünüm ve İçerik (Haberler, Etkinlikler, Blog, Hakkımızda,
       SSS, Belgeler, Yasal Metinler, Sayfa SEO) ekranları veritabanından
       okur ve yazar (K-99, K-100, K-103, K-104). Üyeler, İşlem Kaydı,
       E-posta Kaydı ve panel ana sayfası da veritabanındadır (6. alan).
       Stok dosyasının kendisi saklanmaz.
     - Panelde katalog görselleri (ürün, kategori ve grup) ve satış
       temsilcisi fotoğrafı için dosya yüklenmez, görsel adresi girilir;
       dosya deposu (Aşama 6) gelince yükleme açılır (K-101).
     - Belgelerin (MSDS vb.) listesi tablodan gelir; dosya deposu (Aşama 6)
       kurulana kadar panelde dosya yüklenmez, dosyanın adresi girilir ve
       site belgeyi o adreste açar (K-104).
     - Katalog (bugün ~110 KB, sıkıştırılmış ~17 KB) sayfa çerçevesiyle her
       sayfada gelir (3.3'te planlandığı gibi). Ağır veri (bayi ve satıcı
       stoğu, yorumlar) yalnızca gereken sayfaya gider (3.4); bayi stoğu
       bugün 2.754 satır (~500 KB), ürün sayfasına yalnızca o ürünün
       stoktaki satırları gider (ör. 18 satır).
     - Next'in önbelleği tek kayıtta en fazla 2 MB tutar. Stok ve yorumlar
       ürün başına okunduğu için bu sınıra takılmaz. Katalogun kendisi
       ~1.000 üründe sınıra yaklaşır (aşılırsa önbelleğe alınmaz, her sayfa
       yenilemesinde veritabanı okunur); ürün sayısı bu düzeye gelmeden
       ürünler parça parça (ör. bölüm başına) önbelleğe alınmalı.
     - Derleme sırasında veritabanına erişilmelidir (sayfalar derlemede
       hazırlanır); canlıda derleme sunucusunun veritabanı erişimi olmalı.
       Bu bilerek böyle bırakıldı (3.6): derlemeyi veritabanından bağımsız
       yapmak, sayfaları önceden hazırlamak yerine her ziyarette yeniden
       üretmek demek; site yavaşlar. Kendi sunucumuzda (K-92) derleme
       veritabanına erişebilir.
     - Veritabanında değişiklik, sayfa açılınca en geç bir dakikada görünür;
       sayfa uzun süre açılmamışsa ilk açılışta bir kez eski hali gelir ve
       arka planda yenilenir (Next'in "önce eskiyi göster, arkada yenile"
       davranışı). Beklemeden görmek için `npm run site:yenile` (README ›
       Veritabanı). Panel veritabanına yazınca (Aşama 5) her kayıt
       `refreshSite`'ı çağıracak; değişiklik o anda görünür ve süreye bağlı
       yenileme yalnızca yedek kalır (süresi o zaman sahibine sorulur,
       K-88).
     - Birden fazla sunucu çalışacaksa önbellek ortak bir yerde (ör. Redis)
       tutulmalı; yoksa yenileme yalnızca isteği alan sunucuda olur. Tek
       sunucuda gerekmez (K-92).
   - Aşama 4 (üyelik ve oturum sunucuda) bitti. Aşama 5.1 (üyenin
     adresleri ve favorileri veritabanında, K-96) ve 5.2 (siparişler ve iade
     talepleri sunucuda; tutar, stok ve kupon sunucuda yeniden hesaplanıyor,
     K-97) ve 5.3 (teklif, servis, garanti, yorum ve e-posta formları
     sunucuda; gönderilen e-postalar `email_log`'da, K-98) bitti. Panel
     alan alan veritabanına geçiyor (K-99): 1. alan Satış bitti (Siparişler,
     İade Talepleri, Kuponlar sunucudan okur ve yazar; aynı kaydı iki
     yönetici düzenlerse sonraki kaydetmez; her değişiklik ve panel
     girişi/çıkışı `audit_log`'da). 2. alan Talepler bitti (Teklifler,
     Servis Talepleri, Garantiler, Yorumlar ile yeni Bayilik Başvuruları,
     Mesajlar ve Welders Club ekranları; onaylanan yorum sitede hemen
     görünür; form kayıtları silinmez, K-100). 3. alan Katalog bitti:
     Seçenek Tanımları, Kategoriler ve gruplar (3.1) ve Ürünler (3.2); link
     değişince eski adres yönlenir, kayıt sitede hemen görünür, görsel
     yükleme dosya deposuna kadar kapalı (K-101). 4. alanın ilk adımı (4.1)
     bitti: Bayiler, Online Satıcılar ve Satış Temsilcileri (K-103). 4.2
     bitti: Stok Matrisi'nde her görünüm yalnızca gereken stoğu okur; elle
     düzeltme ve stok geçerlilik süresi sunucuda. 4.3 bitti: dosya
     yükleme, kod eşleştirme ve son yüklemeyi geri alma sunucuda; sunucu
     dosyayı kendisi yeniden eşleştirir; önceki hal son 5 yüklemede
     saklanır (K-103). 4. alan bitti. 5. alanın ilk adımı (5.1) bitti:
     Mağaza Ayarları (Kargo ve Ödeme) sunucuda, sitede hemen geçerli; yeni
     E-posta Alıcıları sekmesi (tür başına alıcı; yazılmayan tür
     `SUPPORT_EMAIL`'e, K-104). 5.2 bitti: Haberler, Etkinlikler, Blog,
     Hakkımızda ve SSS sunucuda; kayıt sitede hemen görünür, link değişince
     eski adres yönlenir, görsel yükleme dosya deposuna kadar kapalı
     (K-101). 5.3 bitti: Yasal Metinler, Belgeler (dosya yükleme kapalı,
     adres girilir; K-104), Sayfa SEO ve Görünüm sunucuda; Mağaza
     Ayarları'nda yeni "Şirket ve İletişim" sekmesi (MERSİS no dahil) ve
     kargo firmalarına takip adresi, müşteri ve panelde takip bağlantısı
     (K-105). 5. alan bitti. Değiştirilebilir parçalar (K-108): ödeme
     sağlayıcısı, SAP sipariş aktarım sırası, dosya deposu (panelden
     dosya yükleme) bitti. 6. alan bitti: Üyeler (6.1), İşlem Kaydı ve
     E-posta Kaydı ekranları (6.2), panel ana sayfası (6.3); panelin bütün
     ekranları veritabanından okur ve yazar. Sonraki: 5.6; canlıya
     hazırlık.
   - 6. alandan kalanlar: panel ana sayfası siparişlerin, tekliflerin ve
     üyelerin tamamını tarayıcıya gönderir; kayıt sayısı büyüyünce (ör.
     binlerce sipariş) özet ve grafikler sunucuda hesaplanmalı. Üyeler,
     İşlem Kaydı dışındaki uzun listeler (Siparişler, Üyeler, Yorumlar)
     da büyüyünce sayfalanmalı ("Görseller ve uzun listeler").
   - 5.3'ten kalanlar: yorum fotoğraf ve videoları
     dosya deposu gelince (Aşama 6) depoya taşınır (o zamana kadar panelin
     Yorumlar ekranı bütün yorumları dosyalarıyla birlikte okur; yorum
     sayısı artınca ekran yavaşlar, sayfalama gerekir); formların istek
     sınırı ve bot doğrulaması canlıya hazırlıkta (K-98).
   - 3. alandan kalanlar: eski adres yönlendirmesi bugün
     de tarayıcıda yapılıyor (sunucuda 301: "SEO alanları … ve link yönlendirme" 3).
   - 2. alandan kalanlar: onaylanan bayilik başvurusundan bayi kaydı
     açılması sahibiyle birlikte tasarlanacak ("Bayilik başvurusundan bayi
     açma" bölümü, K-103); bugün bayi kaydı elle açılır. Form kayıtlarının (başvuru, mesaj, Welders Club) saklama
     süresi ve silinmesi KVKK kararıyla belirlenecek (K-100).
   - 5.2'den kalanlar: kartlı ödeme gerçek POS bağlanana kadar temsili
     (yol haritası 5); ödeme sağlayıcısı parçası hazır, kuruluş seçilince
     onun parçası eklenir ve `ODEME_SAGLAYICI` ayarlanır (K-108). Panel
     siparişleri sayfalamadan, hepsini birden okur; sipariş sayısı binleri
     bulunca liste sayfalanmalı (sunucuda süzme ve arama).
   - Siteyi ve paneli bağlarken panele eklenecek ekranlar: gönderilen
     e-postalar ve değişiklik kaydı (KARARLAR K-81). Form kayıtları
     (bayilik, iletişim, ürün destek, Welders Club) 2. alanda, e-posta
     alıcıları (tür başına) 5.1'de eklendi.
2. Okuma ve yazma tek yerde toplanmış (`packages/store/src/database.ts`); bu
   katman ve `packages/store/src/repo/` fonksiyonları sunucu API'sine
   bağlanmalı.
3. `DB_VERSION` ile tarayıcı verisini sıfırlama yerine veritabanı geçişleri
   (migration) kullanılmalı.
4. Örnek veri (`packages/data/src/seed/`) yalnızca ilk kurulumda yüklenmeli;
   örnek satış hareketleri hiç yüklenmemeli (bkz. "Online satış" 11).
5. Tarayıcıda yalnızca ziyaretçiye ait küçük veriler kalır (sepet, teklif
   listesi, çerez tercihi); hangisinin nereye taşınacağı:
   [VERI-MODELI.md](VERI-MODELI.md) › Tarayıcıda tutulanlar.

## Zenweld depo stoğu (SAP) — backend

Sahibinin kararı (KARARLAR K-82, K-84): Zenweld deposunun stoğu SAP'tan
okunur; stokta olmayan ürün sepete eklenmez. Tablolar hazır
(`warehouse_stock`, `sap_sync_runs`; [VERITABANI.md](VERITABANI.md)).

**SAP Business One'da stok nasıl okunur:**

- **Stok nerede durur:** SAP B1 stoğu kendi veritabanında (SAP HANA ya da SQL Server) kalem ve depo başına tutar. Kullanılabilir stok = depodaki − siparişe ayrılmış. SAP ekibinin hazırlayacağı görünüm (`AVAILABLE_STOCK`) bu hesabı yapıp kalem kodu ve miktarı verir.
- **Okuma yolu (iki seçenek):**
  - **Service Layer (önerilen):** SAP B1'in resmi web servisi (HTTPS, kullanıcı adı ve şifre). Siparişleri SAP'a yazmak için de bu kullanılacağı için tek bağlantı iki işi görür.
  - **Salt okunur veritabanı kullanıcısı:** Görünüme doğrudan bağlanılır. Daha basit; ama sunucudan SAP veritabanına ağ erişimi (VPN ya da güvenlik duvarı izni) gerekir.
- **Kuruldu (2026-11-04), SAP yerine deneme dosyasıyla:**
  - Okuma işi: sitenin `/api/sap/stok` ucu; zamanlayıcı 15 dakikada bir çağırır (canlı sunucunun zamanlayıcısı, KARARLAR K-92; [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9). Yarım okuma koruması (K-93).
  - Stok tablosunun tek işlemde yenilenmesi; her okumanın `sap_sync_runs`'a yazılması; aynı anda tek okuma.
  - Hata olursa son iyi stoğun korunması.
  - Stok değişince sayfaların o anda yenilenmesi.

  Ayrıntı: [VERITABANI.md](VERITABANI.md) › 14 › SAP stok okuma. Bilgiler gelince yalnızca SAP'a bağlanan küçük parça yazılır (yukarıdaki yol haritasında 3. madde).
- **Sipariş:** Service Layer üzerinden satış siparişi oluşturulur (müşteri kartı; satırlarda kalem kodu, adet, fiyat, depo). Karar gerekiyor: her web müşterisi SAP'ta ayrı cari mi, yoksa tek bir "web satış" carisi mi?
- **SAP ekibine sorulacaklar:**
  - B1 sürümü ve veritabanı türü (HANA / SQL Server).
  - Service Layer açık mı?
  - Sitenin stoğu hangi depo(lar)dan gelecek?
  - Ürün kodlarımız SAP kalem koduyla aynı mı? (K-72)
  - Görünümün kesin adı ve kolonları.
  - Test şirketi ve ağ erişimi.

1. SAP ekibinden: görünümün kesin adı (bugün `AVAILABLE_STOCK` deniyor) ve
   kolonları (kalem kodu, kullanılabilir miktar, kalem adı), bağlanma yolu
   (SAP Business One Service Layer ya da veritabanına salt okunur
   kullanıcı) ve bağlantı bilgileri (yalnızca sunucuda ortam değişkeni).
2. Zamanlayıcının canlı sunucuda kurulması ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)
   › 9 › Zamanlanmış işler). Panelde son okuma zamanı ve hatası (panel
   veritabanından okumaya geçince, Aşama 5).
3. (Veritabanı modunda yapıldı, Aşama 5.2) Sipariş anında stok sunucuda
   son kez kontrol edilir; stok bitmişse sipariş alınmaz.
4. Site siparişleri SAP'a satış siparişi olarak kaydedilecek (K-84).
   **Kuruldu (2026-11-05, K-108), SAP yerine deneme dosyasıyla:** ödemesi
   kesinleşen sipariş `sap_order_exports` sırasına girer (kartla verilince,
   havalede Ödeme Alındı denince); `/api/sap/siparis` işi gönderir; geçici
   hatada artan aralarla 8 kez dener; belge numarası, durum ve hata panelde
   sipariş detayında görünür, başarısız sipariş **Yeniden sıraya al** ile
   tekrar gönderilir; gönderilmeden iptal edilen sipariş aktarılmaz.
   Ayrıntı: [VERITABANI.md](VERITABANI.md) › 14 › SAP sipariş aktarımı.
   Kalan:
   - SAP ekibinden sipariş API'sinin (ör. `SALES_ORDER`) bilgileri gelince
     SAP'a yazan aktarıcı parça (siparişi SAP'ın biçimine çevirir; geçici
     hata ile kalıcı hatayı ayırır).
   - Zamanlayıcının canlı sunucuda kurulması (birkaç dakikada bir).
   - SAP'a aktarılmış sipariş sitede iptal edilirse ya da iade edilirse
     SAP'a bildirilmesi (bugün SAP'ta elle yapılır).
   - İstenirse panelde sırada bekleyen ve başarısız sipariş sayısı
     ([Bağlantıların durumu](#bağlantıların-durumu-panelde--öneri)).

## Kuponlar — backend

Kupon özelliği sitede ve panelde var (KARARLAR K-85,
[IS-KURALLARI.md](IS-KURALLARI.md#21-kuponlar)); bugün indirim tarayıcıda
hesaplanıyor ve kullanım tarayıcıdaki veriye yazılıyor. Canlıdan önce:

1. **Sunucuda yeniden hesap:** Sipariş anında sunucu kuponu kodla bulur,
   aynı kurallarla (`packages/data/src/coupon.ts`) indirimi ve satır
   paylarını yeniden hesaplar; tarayıcıdan gelen tutara güvenilmez.
2. **Kullanım sınırı yarışı:** Aynı anda gelen siparişler toplam ve kişi
   başı sınırı aşmamalı: sipariş, kupon kullanımı (`coupon_redemptions`) ve
   sınır kontrolü tek işlemde yapılır (kupon satırı kilitlenir).
3. **İptal:** Sipariş iptalinde (havale süresinin dolması dahil, zamanlanmış
   görevle) `released_at` aynı işlemde dolar.
4. **Değişiklik kaydı:** Kupon ekleme, düzenleme, pasife alma ve silme
   `audit_log`'a yazılır (KARARLAR K-81).
5. **Kaba deneme:** Sepette art arda yanlış kod denemesi sınırlanır (ör.
   dakikada 10).
6. **Kişiye özel kupon:** Üyenin e-postası sunucudaki oturumdan alınır;
   üye e-postasını değiştirebilecekse yeni e-posta doğrulanmadan kişiye
   özel kupon kullanılamamalı. İsteğe bağlı: Hesabım'da "Kuponlarım"
   (e-postaya tanımlı kuponlar).

## Üyelik, oturum ve şifre — backend

1. **Kimlik doğrulama ve yetki sunucuda yapılmalı.** Bugün şifre tarayıcıda
   basit bir özetle karşılaştırılıyor (`packages/auth/src/hash.ts`) ve
   oturum tarayıcıda tutuluyor. Veritabanı modunda site üyeliği sunucuda
   (Aşama 4.1–4.2): şifre argon2id ile özetlenir, oturum veritabanında
   (`sessions`) ve yalnızca sunucunun okuyabildiği çerezde tutulur. Panel
   girişi de sunucuda (4.3) ve panel sayfaları yönetici oturumu olmadan
   gönderilmiyor. Veritabanı modunda panelin bütün ekranlarının işlemleri
   sunucuda yönetici oturumuyla korunuyor (K-99; 6. alanla tamamlandı).
   `npm run db:seed` örnek hesapları eski demo özetiyle yazar;
   ilk girişte güçlü özete çevrilir.
2. **Hesap silinince kalan veriler:** "Hesap silme — açık konular" bölümü.
3. **Şifre sıfırlama e-postası — konuşulacak (KARARLAR K-105):** Bugünkü
   düzen (yalnızca veritabanı modunda; demo sitede e-posta gitmez):
   - Müşteri Şifremi Unuttum'a e-postasını yazar; hesap olsa da olmasa da
     aynı mesaj görünür.
   - Hesap varsa e-posta servisi (Resend) üzerinden müşterinin adresine
     "Zenweld şifre sıfırlama" konulu düz metin e-posta gider. Gönderen
     sunucudaki `SUPPORT_FROM` adresidir (tanımlı değilse Resend'in deneme
     adresi; canlıda `web@zenweld.com` gibi doğrulanmış bir adres
     gerekir). Metin kodda sabittir (`packages/i18n/src/tr.ts`).
   - Bağlantı 1 saat geçerli ve tek kullanımlık; aynı hesap için 15
     dakikada bir. Gönderim `email_log`'a yazılır.
   - E-posta servisi kurulmadığı için bugün hiçbir e-posta gitmez.

   Konuşulacaklar: gönderen adres ve adı (ör. "Zenweld
   <noreply@zenweld.com>"), e-postanın metni ve görünümü (logo, düz metin
   mi), metnin panelden değişip değişmeyeceği, bağlantı süresi, gönderen
   alan adının doğrulanması (SPF/DKIM; BT ile).
4. **Yöneticinin kendi şifresini panelden değiştirmesi:** Bugün yönetici
   şifresi yalnızca sunucuda `npm run yonetici:olustur` ile değişir. Panelde
   "Şifremi değiştir" eklenecek; şimdi yapılmıyor (KARARLAR K-105).

## Hesap silme — açık konular (KVKK ve yasal saklama)

Bugün üye Hesabım › Profil › **Hesabımı Sil**'den hesabını silebiliyor
(seçenek 2a, KARARLAR K-68): hesap ve adresleri siliniyor, diğer kayıtları
kalıyor (panelden silmeyle aynı). Önerilen diğer yol (2b) aşağıda 10'da. Bu kural
demoda yeterli; canlıya çıkmadan şunlar hukukçu ve mali müşavirle
netleşmeli:

1. **Yasal saklama süresi:** Sipariş ve fatura kayıtları vergi ve ticaret
   mevzuatı gereği yıllarca saklanmalı (süreler mali müşavirle
   netleşmeli). KVKK'ya göre bu süre boyunca yalnızca gereken bilgi tutulur;
   süre dolunca silinir ya da anonimleştirilir. Sitedeki "Kişisel Veri
   Saklama ve İmha Politikası" metni buna göre yazılmalı.
2. **Diğer kayıtlardaki kişisel veriler:** Teklif, servis talebi, iade
   talebi, garanti kaydı ve yorumdaki ad, e-posta ve telefon silinsin mi,
   anonimleştirilsin mi, kalsın mı?
3. **Yorumlar:** Sitede yazarın adıyla görünüyor. Hesap silinince ad
   gizlensin mi (ör. "Silinmiş üye")?
4. **Garanti:** Kayıt e-postaya ve seri numarasına bağlı; hesap silinse de
   ürünün garantisi sürer. Garanti verisi silinirse müşteri garanti hakkını
   kanıtlamakta zorlanabilir.
5. **Açık işler varken silme:** Hazırlanan ya da kargodaki sipariş, açık
   iade talebi varken de hesap silinebiliyor; müşteri bunları artık
   göremez. Silme engellensin mi, uyarı mı verilsin?
6. **Aynı e-postayla yeniden üye olma:** Bugün mümkün. Eski siparişler,
   teklifler ve iade talepleri yeni hesaba bağlanmıyor (üye kimliğine
   bağlılar); garanti kayıtları ise e-postayla eşleştiği için yeniden
   görünüyor. Hangisinin doğru olduğu kararlaştırılmalı.
7. **Bülten izni ve İYS:** Hesapla birlikte bülten izni de siliniyor; İYS
   bağlanınca ret kaydı gönderilmeli ("Bülten ve İYS").
8. **Başka yerlerdeki kopyalar:** Sunucu yedekleri, info@zenweld.com'a gelen
   form e-postaları, muhasebe ve e-arşiv yazılımı için de imha süreci
   tanımlanmalı.
9. **İz kaydı ve bildirim:** Silmenin kim tarafından ve ne zaman yapıldığı
   bugün hiçbir yerde kalmıyor; Zenweld'e de bildirim gitmiyor. KVKK
   başvurularına yanıt verebilmek için kayıt tutulmalı.
10. **KVKK başvuru formu (2b) — ileride düşünülecek:** 2a (Hesabımı Sil)
    seçildi; 2b ileride düşünülecek (sahibin kararı, 2026-10-27).
    - **Nedir:** Hesabım'da "Verilerimle ilgili başvuru" formu. Üye başvuru
      gönderir, başvuru info@zenweld.com'a gider, gereğini yönetici yapar.
    - **2a'dan farkı:** Silmenin yanında KVKK'daki diğer hakları da (verilerini
      öğrenme, düzeltme, itiraz) kapsar; neyin silinip neyin saklanacağına
      (1–8) bir insan başvuru başvuru karar verir. 2a ile birlikte
      kullanılabilir; birbirinin yerine geçmez.
    - **Dikkat:** Başvurulara en geç 30 gün içinde yanıt verilmeli. Form
      yapılana kadar başvuru yolu (e-posta ya da yazılı) KVKK Aydınlatma
      Metni'nde yazmalı.

## Müşteriye e-posta bildirimleri (sipariş dışı) — backend

Bugün müşteriye hiç e-posta gitmiyor; formlar yalnızca info@zenweld.com'a
e-posta gönderiyor. Sipariş bildirimleri "Online satış" 6'da. Ayrıca:

1. Teklif talebinin durumu panelde değişince (İnceleniyor, Teklif Gönderildi…).
2. Servis talebinin durumu değişince.
3. Garanti kaydı alındığında ve panelde bitiş tarihi değişince.
4. İade talebinin durumu panelde değişince (İnceleniyor, Onaylandı,
   Reddedildi).

Hangi bildirimlerin gönderileceği ve metinleri kararlaştırılmalı.

## Görseller ve yüklenen dosyalar — backend

Demo modunda panelden yüklenen görseller (ürün, kategori ve grup kartı,
haber, blog, etkinlik, Hakkımızda, satış temsilcisi) ve yorumlardaki
fotoğraf ve videolar veritabanının içine metin olarak (`data:` ile
başlayan) yazılıyor. **Veritabanı modunda (2026-11-05, K-108):** panelde
yüklenen görseller sunucunun dosya deposuna (`DOSYA_KLASORU`) yazılıyor;
yükleme sunucuda tür (içeriğe bakılarak) ve boyut kontrolünden geçiyor,
kayıtta yalnızca adres (`/dosya/…`) kalıyor
([IS-KURALLARI.md › 23](IS-KURALLARI.md#23-yüklenen-dosyalar)). Depo
ayarlı değilse adres giriliyor (K-101).

**Sahibin kararı (K-102):** Görsellerin hız, görünürlük ve performans için
iyileştirilmesi ve nasıl tutulacağı sahibi söyleyince ele alınır; dosya
deposu kurulurken (Aşama 6), gerçek fotoğraflar gelince ve canlıya
hazırlıkta sahibine hatırlatılır.

1. (Hazır, veritabanı modu) Dosyalar dosya deposuna yükleniyor; kayıtta
   yalnızca adres kalıyor. Deponun yeri ve yedeği BT ile kesinleşir
   (sunucunun diski ya da S3 uyumlu depo; CANLIYA-CIKIS-SORULARI › 1);
   S3 seçilirse onun parçası eklenir (`packages/db/src/file-storage.ts`).
2. (Hazır) Yükleme sunucuda tür ve boyut kontrolünden geçiyor.
3. Belgeler (MSDS, sertifikalar) için ayrı bölüm: "Belgeler — backend".
4. **Kullanılmayan dosyaların temizliği:** Kayıttan kaldırılan görselin ya
   da silinen belgenin dosyası depoda kalıyor. Hiçbir kaydın kullanmadığı
   ve belli bir süreden eski dosyaları bulup silen bir iş (önce yalnızca
   listeleyen) yazılabilir.
5. **Yorum fotoğraf ve videoları:** Müşterinin yüklediği dosyalar hâlâ
   yorumun içinde (`media`, `data:`). Depoya taşımak için herkese açık bir
   yükleme ucu gerekir (istek sınırı ve bot koruması ile; "Formlar —
   güvenlik"); sahibiyle konuşulur.
6. Demo modunda yüklenmiş (`data:`) görseller canlı veriye taşınmaz; canlı
   yüklemede görseller `/images/…` adresindedir (K-90).

## Bülten ve İYS

Alt bilgideki bülten kaydı bugün hiçbir yere gönderilmiyor ve saklanmıyor.
Üye olurken işaretlenen "haber ve kampanya e-postaları" izni yalnızca üye
kaydında duruyor (`newsletter` alanı). Hangi bülten servisinin kullanılacağı
karar bekliyor ([KARARLAR.md](KARARLAR.md) › Henüz karar verilmemiş konular).

1. Servis seçilince bülten kayıtları ve üyelerin izinleri bu servise
   gönderilmeli.
2. Ticari ileti izinleri İYS'ye (İleti Yönetim Sistemi) bildirilmeli.
3. Her e-postada abonelikten çıkma bağlantısı olmalı; çıkış İYS'ye de
   yansımalı.

## Bayi ve satıcı stokları — backend

Panel akışı hazır. Veritabanı modunda stok satırları, dosya yüklemeleri,
kod eşleştirmeleri ve geri alma veritabanında (panel 4. alan, K-103).
Ayrıntılar: [STOK.md](STOK.md) › "Backend'e geçiş".

1. `dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases` tabloları; dosya yükleme tek
   işlemde (transaction) uygulanmalı, dosya sunucuda yeniden doğrulanmalı.
2. Yüklenen orijinal dosyalar denetim için saklanmalı.
3. Ürün sayfaları önbellekte tutulmalı; yükleme uygulanınca yalnızca etkilenen
   ürünlerin sayfaları yenilenmeli, ayrıca günde en az bir kez.

## SEO alanları (ürün, blog, haber, etkinlik, sabit sayfalar) ve link yönlendirme — backend

Panelde SEO sekmesi (ürün, blog yazısı, haber, etkinlik, grup, kategori) ve
Sayfa SEO ekranı hazır. Sunucu bu sayfaların başlığını, açıklamasını ve
`keywords` etiketini demo modunda koddaki örnek veriden, veritabanı modunda
(K-88) tablolardan üretiyor (`generateMetadata`); veritabanı modunda panel
de tablolara yazıyor (Aşama 5, panel 3. ve 5. alan), değişiklik hemen
görünüyor. Eski linkten yeni linke yönlendirme iki modda da tarayıcıda
yapılıyor (`lib/page-seo-client.ts`).

1. (Hazır) Tablolar: SEO alanları her kayıtta `seo` alanında; eski linkler
   `redirects` tablosunda (tür, kayıt, eski adres; kategori için tam yol);
   sabit sayfalar `page_seo` tablosunda ([VERITABANI.md](VERITABANI.md)).
2. (Veritabanı modunda yapıldı, K-88) Sayfaların başlığı, açıklaması ve
   `keywords` etiketi tablolardan okunuyor (`lib/seo.ts` → `productSeo`,
   `blogPostSeo`, `newsSeo`, `eventSeo`, `categorySeo`, `groupSeo`); sabit
   sayfalar ve anasayfa `lib/server/page-metadata.ts` → `pageMetadataFor`
   ile `page_seo` tablosundan.
3. Eski link sunucuda **301 (kalıcı)** ile yeni linke yönlendirilmeli; Google eski
   sonucu yeni linkle değiştirir. Panelde değiştirilen yeni link sunucuda da
   bulunmalı (bugün yalnızca tarayıcı biliyor; sunucu 404 kodu döndürüyor, sayfa
   tarayıcıda açılıyor).
4. Kayıt kaydedilince o sayfa ve site haritası yenilenmeli. Site
   haritası veritabanından üretilmeli: panelde eklenen ürünler ve blog yazıları
   girmeli, linki değişen üründe yalnızca yeni link yer almalı. Veritabanı
   modunda (K-88) ürünler, gruplar, kategoriler, blog, haber ve etkinlikler
   bugün de tablolardan gelir (en geç bir dakika gecikmeyle).
5. **Kampanya başlangıç ve bitişinde ürün sayfası yenilenmeli.** Google'a
   giden fiyat (yapısal veri) sayfa üretilirken yazılır. Kampanya belirlenen
   saatte kendiliğinden başlayıp bittiği için o anda kimse kayıt yapmaz;
   sayfa ya kampanyanın başlangıç/bitiş saatinde zamanlanmış bir işle ya da
   saatte bir yenilenmeli. Yoksa Google bir sonraki yenilemeye kadar eski
   fiyatı görür. Veritabanı modunda (K-88) sayfalar 30 saniyede bir yeniden
   hazırlandığı için bu gecikme bir dakikayı geçmez.
6. **Google Search Console:** Canlıya çıkınca alan adı Search Console'a
   eklenip doğrulanmalı, site haritası (`/sitemap.xml`) bildirilmeli;
   dizine alma hataları ve eski adreslerin yönlenmesi oradan izlenir
   (sahibiyle konuşulacak, K-106).

## Belgeler (MSDS, Kaynak Rehberi, Parti Sertifikaları) — backend

Panel ve site sayfaları hazır. Demo modunda dosyalar yükleyen tarayıcıda
(`packages/store/src/files.ts`); veritabanı modunda kayıtlar `documents` ve
`document_pages` tablolarında. Dosya deposu ayarlıysa dosya depoya
yüklenir (K-108); değilse dosyanın adresi girilir (adım 5.3, K-104).

1. (Hazır) `documents` ve `document_pages` tabloları; panel veritabanına
   yazar.
2. (Hazır, 2026-11-05, K-108) Dosyalar dosya deposuna yükleniyor; site
   belgeleri `/dosya/belge/…` adresinden açıyor. Yükleme sunucuda tür
   (içeriğe bakılarak) ve boyut (25 MB) kontrolünden geçiyor. Önceden
   girilen adresler kalıyor. Silinen belgenin dosyası depoda kalıyor
   (temizlik: "Görseller ve yüklenen dosyalar — backend" 4).
3. (Hazır) Belge sayfalarının arama motoru başlığı ve açıklaması Sayfa
   SEO'dan değişir (MSDS, Ultimate Kaynak Rehberi, Parti Sertifikaları).

## Bağlantıların durumu panelde — öneri

Dış servislerin (SAP, ödeme kuruluşu, e-posta, ileride kargo) bağlantı
bilgileri yalnızca sunucuda ortam değişkenidir; panelde görünmez ve
değiştirilmez (CLAUDE.md › Güvenlik). Önerilen (sahibiyle konuşulacak,
K-106): panelde salt okunur bir "Bağlantılar" ekranı.

- Her servis için: tanımlı mı (anahtarın kendisi gösterilmeden), son
  başarılı işlem ve son hata (ör. son SAP stok okuması `sap_sync_runs`'tan,
  SAP'a aktarılmayı bekleyen ve aktarılamayan sipariş sayısı
  `sap_order_exports`'tan, son gönderilemeyen e-posta `email_log`'dan).
- Ayar değiştirilmez; değişiklik sunucunun ortam değişkenlerinden yapılır
  ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9).

## Formlar — güvenlik (backend)

Formlar info@zenweld.com'a e-posta gönderir (`app/api/bildirim`,
`/api/bayilik`, `/api/destek`; liste: ADMIN-KULLANIM.md › "Siteden panele gelenler").
Bugün gelen veri sunucuda kontrol ediliyor (alan türü, uzunluk) ve her
formda botlar için görünmez bir tuzak alanı var
(`components/common/BotTrap.tsx`). Canlıdan önce:

1. **İstek sınırı:** aynı IP adresinden dakikada birkaç form gönderilebilmeli;
   aşınca "çok fazla deneme" yanıtı. Canlı kendi sunucumuzda (K-92): sınır
   sunucunun önündeki web sunucusunda (ör. nginx) ya da uygulamada
   tutulabilir; birden fazla sunucu çalışırsa sayaç ortak bir yerde (ör.
   Redis) tutulmalı.
2. **Bot koruması:** Cloudflare Turnstile veya görünmez reCAPTCHA; doğrulama
   sunucuda yapılmalı. Tuzak alanı yalnızca formu dolduran basit botları
   durdurur, uca doğrudan istek atan betikleri durdurmaz.
3. **Kayıt tutan formlar** (teklif, servis talebi, garanti, yorum, üyelik,
   sipariş, iade): veritabanı modunda sunucuda veritabanına yazılıyor ve
   e-posta bu kayıttan gidiyor (Aşama 4, 5.2–5.3). Kalan: canlıda
   `/api/bildirim` yalnızca kaydı olmayan türleri (iletişim, Welders Club)
   ve üyelik bildirimini kabul etmeli; bugün bu uca sahte bir bildirim (ör.
   "yeni sipariş") de gönderilebilir. Sipariş e-postası ödeme kuruluşunun
   onayından sonra gönderilmeli.
4. Veritabanı modunda formlar veritabanına yazıldığı için 1 ve 2 canlıdan
   önce şarttır (KARARLAR K-98); kupon deneme ucu (`/api/siparis/kupon`) ve
   garanti sorgulama (`/api/formlar/garanti`) da istek sınırına alınmalı.

## Kod incelemesi bulguları

Ayrıntılı inceleme sohbette yapıldı; düzeltme zamanı ayrıca
kararlaştırılacak. Başlıklar:

1. Giriş/yetki yalnızca tarayıcıda (demo) — canlıdan önce sunucu tarafı
   kimlik doğrulama şart
2. Form uçlarında istek sınırı ve bot koruması yok → "Formlar — güvenlik
   (backend)"
3. Tarayıcı deposu dolunca değişiklik uygulanmıyor; yönetim paneli ve yorum
   formu uyarıyor, sitedeki diğer formlar (teklif, servis, garanti, üyelik) uyarmıyor
4. Arama dizini her sayfa açılışında kuruluyor
5. Her değişiklikte tüm veritabanı (≈545 KB) yeniden yazılıyor
6. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
7. 8 dosyada hâlâ Lorem ipsum yer tutucu metin var: anasayfa, ürün sayfası,
   Welders Club, Teklif Al formu, Adreslerim, `tr.ts` ve örnek veriler
8. Otomatik kontrol (CI) yok; iş kuralları testleri (`npm test`) ve
   tarayıcı testleri (`npm run test:e2e`) var, elle çalıştırılıyor
9. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil

## Çerezler ve yasal metinler

1. **Tanımlama Bilgisi Ayarları** penceresi şimdilik boş; analiz ve pazarlama
   çerezleri için ayrı açma/kapama seçenekleri eklenecek.
2. Google Analytics, Meta Pixel gibi kodlar eklendiğinde **yalnızca ziyaretçi
   "Tümünü Kabul Et" dediyse** yüklenmeli (`getCookieConsent()`,
   `components/layout/CookieBanner.tsx`).
3. Çerez bandındaki açıklama metni, sitede gerçekten kullanılan çerezlere göre
   güncellenmeli (şu an "reklam ve sosyal medya ortaklarıyla paylaşıyoruz" yazıyor;
   böyle bir paylaşım henüz yok).
4. 11 yasal metnin tamamı taslak; hukuk danışmanının metinleri panelden
   (İçerik › Yasal Metinler) girilmeli.
5. Servis talepleri info@zenweld.com'a gidiyor; servis ekibinin ayrı bir
   adresi olacaksa form türüne göre alıcı eklenmeli (`app/api/bildirim`).

## Teklif Al metinleri — herkese hitap edecek şekilde güncellenecek

Teklif Al artık bireysel üyelere de açık, ama bazı metinler hâlâ yalnızca
kurumsal müşterilere hitap ediyor. **Karar bekliyor (müdüre danışılacak).**
Güncellenecek yerler ve önerilen metinler:

1. **Teklif Al sayfasının açıklaması** (`packages/i18n/src/tr.ts` → `quote.subtitle`)
   - Şimdi: "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri
     sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin."
   - Öneri: "İhtiyacınız olan ürünler için size özel fiyat teklifi hazırlayalım.
     Formu doldurun, satış ekibimiz sizinle iletişime geçsin. Firmalara vadeli
     ödeme ve çek ile ödeme seçenekleri de sunuyoruz."
2. **Google'da görünen açıklama** (`lib/page-meta.ts` → `/teklif-al`; panelde
   Sayfa SEO'dan da değiştirilebilir)
   - Şimdi: 1. maddedeki cümlenin aynısı
   - Öneri: "Bireysel ve kurumsal alımlarınız için Zenweld'den fiyat teklifi alın.
     Firmalara vadeli ödeme ve çek seçenekleri." (160 karakterin altında)
3. **Ana sayfadaki kırmızı kutu** (`home.quoteBannerTitle`, `home.quoteBannerText`)
   - Şimdi: "Kurumsal alım mı yapacaksınız?" / "Vadeli ödeme ve çek ile ödeme
     seçenekleri için satış ekibimizden teklif alın."
   - Öneri: "Size özel fiyat teklifi alın" / "Tekli ya da toplu alımlarınız için
     satış ekibimizden teklif isteyin. Firmalara vadeli ödeme ve çek ile ödeme
     seçenekleri de sunuyoruz."
4. **Site aramasındaki gizli kelimeler** (`lib/search/search-client.ts`)
   - Şimdi: "kurumsal vadeli çek ödeme"
   - Öneri: "fiyat teklifi toplu alım bireysel kurumsal vadeli çek ödeme"
5. **İsteğe bağlı: formun 1. adım başlığı** (`quote.step1`)
   - Şimdi: "Firma Bilgileri" — Öneri: "İletişim Bilgileri" (bireysel üyede firma
     adı zaten isteğe bağlı)

Açık soru: vadeli ödeme ve çek bireysel müşterilere de açık mı? Formda bu iki
seçenek bugün herkese görünüyor. Yalnızca firmalar içinse formda yalnızca
kurumsal üyelere gösterilmeli; herkese açıksa metinlerdeki "Firmalara"
ifadesi çıkarılmalı.

## Bayilik başvurusundan bayi açma — sahibiyle birlikte tasarlanacak

**Sahibin kararı (2026-11-05, KARARLAR K-103):** Şimdi yapılmaz; başvuru
onaylanınca neler olacağı birlikte tasarlanıp onaylanınca kurulur. Bugün
başvuru Bayi ve Satış Ağı › Bayilik Başvuruları'nda görülür, bayi kaydı
Bayiler ekranından elle açılır. Veritabanında bağlantı alanı hazır
(`dealer_applications.dealer_id`).

Tasarımda konuşulacaklar:

1. Başvuru ekranındaki düğme ("Bayi olarak ekle" gibi) ve hangi durumda
   görüneceği (yalnızca onaylanan başvuruda mı).
2. Başvurudaki hangi bilgilerin bayi formuna aktarılacağı (firma adı,
   şehir, telefon, adres …) ve eksik olanların (harita konumu, çalışma
   saatleri, bayi türü) nasıl girileceği.
3. Bayi açılınca başvurunun durumu (ör. kendiliğinden "Onaylandı") ve
   başvurudan bayiye, bayiden başvuruya bağlantı.
4. Başvuru sahibine e-posta gidip gitmeyeceği ve metni.
5. Reddedilen başvuruda ne olacağı.

## Ürün Seçici ve arama — en son yeniden tasarlanacak

**Sahibin kararı (2026-10-27, KARARLAR K-69):** Ürün Seçici bütün ürünler
kesinleşince, en son ele alınacak. Bugün ürünlerin tamamı kesin olmadığı için
sağlıklı sonuç vermiyor; şu anki sonuçları önemli değil, ona göre ayar
yapılmaz.

Ürün Seçici, ana sayfadaki "Hangi kaynak makinesi size uygun?" bandının açtığı
testtir (`/urun-secici`). Teklif Al sayfasındaki ürün listesiyle ilgisi yoktur.

**Nasıl kurulacak (sahibin kararı, 2026-11-02, K-69 eki):**

- Sorular ve cevapları panelden yönetilir: yeni soru eklenebilir, var olan
  sorular ve cevapları düzenlenebilir (bugün sorular kodda sabit).
- Ürünler panelde cevaplara eşlenir (kategori filtrelerindeki eşleme
  tablosuna benzer bir ekran).
- Test sonucunda, verilen cevaplara eşlenmiş ürünler gelir.

O zaman karar verilecekler:

1. İlk soru seti: hangi soruların sorulacağı ve her sorunun cevapları.
2. Cevapların birleşmesi: birden çok soruda verilen cevaplara göre hangi
   ürünlerin geleceği (ör. hepsine eşlenmiş ürünler mi, en çok eşleşen
   ürünler önce mi); hiçbir ürün eşleşmezse ne gösterileceği.
3. Lazer makinelerinin (lazer kaynak, temizleme, markalama) Ürün Seçici'de
   nasıl yer alacağı; bugünkü sorular (çelik, paslanmaz, alüminyum, kesim)
   lazer makinelerine uymuyor.

**Kaynak yöntemi ve elektrik bilgisi:** Ürün Seçici bugün bu iki bilgiye
bakıyor (1. adım malzeme → ürünün kaynak yöntemleri, 3. adım elektrik →
teknik özelliklerde "3 faz"). 2026-10-28'de girilen gerçek ekipmanlara bu
bilgiler bilerek girilmedi (KARARLAR K-73); bu yüzden Ürün Seçici şu an
sonuç vermiyor. Ürün Seçici kurulurken ürünlere eklenecek. Force serisi 9
üründe bu bilgiler teknik özelliklerde yazılı ("Kaynak yöntemi", "Giriş
gerilimi"); oradan alınabilir.

Bugünkü durum: Kaynak yöntemi etiketleri (MIG, TIG, MMA…) ürün formundan, ürün kartından ve
kategori filtresinden kaldırıldı. Ürün Seçici soruları ve aramadaki yöntem
eşleşmesi hâlâ ürünlerdeki eski `processes` verisine bakıyor; panelden eklenen
yeni ürünlerde bu alan boş kalır. Ürün Seçici'nin soruları ve eşleştirme mantığı
yeniden kurulunca `processes` alanı tamamen kaldırılmalı.

Not: Bu alan silinmeden önce, aşağıdaki "Ürün önerileri" bölümündeki uyumlu
aksesuar kurallarında (MIG makinesi → MIG aksesuarları gibi) kullanılıp
kullanılamayacağı değerlendirilsin.

## Ürün grupları (Kaynak Makineleri, Lazer Makineleri …)

1. Grup ve kategori kartlarındaki görseller şimdilik çizim (illüstrasyon);
   gerçek ürün/uygulama fotoğrafları gelince panelden (Ürünler → Kategoriler →
   Kart Görseli) değiştirilmeli.
3. **Lazer Aksesuarları** (Aksesuarlar'ın ilk grubu, KARARLAR K-05 eki): 5
   kategorinin ürünleri sahibinden gelince girilecek; bugün kategoriler
   boş ("Bu kategoriye henüz ürün eklenmedi.").
2. Grup ve kategorilerin tanıtım metinleri (sayfanın altındaki "… Hakkında")
   ve SEO alanları panelden yazılmalı; şu an hepsi boş.

## Ürün önerileri — ürün sayfasındaki "İlgili Ürünler" yeniden kurgulanacak

Şu anki durum: aynı kategorideki ilk 4 ürün gösteriliyor, sıralama yok. Tek
ürünlü kategoride bölüm hiç çıkmıyor (ör. Y300 QCW Lazer Kaynak Makinesi, Pro
Kaynak Eldiveni).
Makine sayfasında aksesuar önerilmiyor
(`apps/zenweld-web/src/app/(site)/urun/[slug]/ProductPageClient.tsx`).

1. **İki ayrı satır:** "Tamamlayıcı ürünler" (birlikte alınanlar ve uyumlu
   aksesuarlar) ile "Bu kategoride çok satanlar". *Karar bekliyor: tek satır mı,
   iki satır mı.*
2. **Sepet birliktelik analizi (ML):**
   - Geçmiş siparişlerden "A alanlar B'yi de aldı" ilişkileri çıkarılır, lift
     ölçüsüyle sıralanır.
   - Belli sayıda siparişte birlikte görülmeyen çiftler gösterilmez.
   - Hesaplama sunucuda, gece çalışan bir işle yapılır; her ürün için hazır bir
     öneri listesi saklanır. *Backend gerekli.*
3. **Teklif talepleri** birliktelik analizine daha düşük ağırlıkla dahil edilsin
   mi? *Karar bekliyor.*
4. **Uyumlu aksesuarlar:**
   - Kural: MIG makinesi → MIG Aksesuarları ve MIG Telleri; TIG → TIG
     Aksesuarları, Tungsten ve TIG Telleri; MMA → MMA Aksesuarları; Plazma →
     Plazma Aksesuarları.
   - Elle eşleştirme: panelde her makineye uyumlu aksesuar listesi. Torç, kontak
     meme, sürme makarası gibi ölçüsü uymazsa iade sebebi olan parçalar için
     gerekli. Listeleri Zenweld ekibi doldurur.
   - *Karar bekliyor: başlangıçta yalnızca kural mı, kural ve elle eşleştirme
     birlikte mi.*
5. **Kategorinin çok satanları:**
   - 2-3 ürün gösterilir. *Karar bekliyor: adet mi ciro mu, son kaç gün
     (ör. 90).*
   - Satışı olmayan kategoride yeni ve öne çıkan ürünler gösterilir; bölüm hiç
     boş kalmaz.
6. **Birleştirme kuralları:**
   - Önce birlikte alınanlar, sonra uyumlu aksesuarlar.
   - Sayfadaki ürün, sepette olan ürünler ve satıştan kaldırılanlar çıkarılır.
   - Aynı ürün iki satırda görünmez; aynı kategoriden en fazla 2 ürün.
7. **Ters yön:** aksesuar sayfasında "Uyumlu makineler" olsun mu? *Karar bekliyor.*
8. **Ölçüm:** önerilerden tıklama ve sepete ekleme, makine siparişlerinde
   aksesuar ekleme oranı. Panelde grafik olarak da gösterilebilir.
9. **Demo verisi:** örnek siparişler şu an rastgele. Demoda gösterilecekse
   "MIG makinesi + torç + tel" gibi gerçekçi birliktelik kalıpları eklenmeli.
