# Yapılacaklar — Ne Kaldı, Kimi Bekliyor

Bu dosyada yalnızca **kalan** işler durur. Bir iş yapıldığında buradan
silinir; yapılanın nasıl çalıştığı ilgili belgededir (site
[WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md), panel
[ADMIN-KULLANIM.md](ADMIN-KULLANIM.md), kurallar
[IS-KURALLARI.md](IS-KURALLARI.md), veri [VERITABANI.md](VERITABANI.md),
sunucu [SUNUCU.md](SUNUCU.md), nedenler [KARARLAR.md](KARARLAR.md)).

Nasıl okunur: önce [1](#1-canlıya-giden-yol)'deki tablo (canlıya çıkmak
için kalan her şey ve kimi beklediği). Ayrıntılar konu konu aşağıdadır.

---

## İçindekiler

1. [Canlıya giden yol](#1-canlıya-giden-yol)
2. [Sonda ayrı ayrı ele alınacak konular (sahibiyle)](#2-sonda-ayrı-ayrı-ele-alınacak-konular-sahibiyle)
3. [Şirketten öğrenilecekler (kişiye göre)](#3-şirketten-öğrenilecekler-kişiye-göre)
4. [Karar ya da bilgi bekleyen site işleri](#4-karar-ya-da-bilgi-bekleyen-site-işleri)
5. Ayrıntılar, konu konu:
   - **Altyapı:** [Canlı sunucu](#canlı-sunucu-ve-vercel-temizliği) ·
     [Veriyi canlıya taşıma](#veriyi-canlıya-taşıma) ·
     [Veritabanı](#veritabanı--kalanlar) · [Ölçüm](#ölçüm-hız) ·
     [Güvenlik başlıkları](#güvenlik-başlıkları--canlıya-çıkarken) ·
     [Formlar — güvenlik](#formlar--güvenlik) · [Next.js 16](#nextjs-16) ·
     [Kod incelemesi bulguları](#kod-incelemesi-bulguları)
   - **Satış:** [Online satış](#online-satış--canlıya-çıkmadan-önce) ·
     [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap) ·
     [Kuponlar](#kuponlar) · [İade talebi](#i̇ade-talebi) ·
     [Müşterinin siparişi iptal etmesi](#müşterinin-siparişi-iptal-etmesi--ileride-düşünülecek) ·
     [Müşteriye e-posta bildirimleri](#müşteriye-e-posta-bildirimleri-sipariş-dışı) ·
     [E-posta ve posta kutusu](#e-posta-ve-posta-kutusu--panel--e-posta) ·
     [Bayi ve satıcı stokları](#bayi-ve-satıcı-stokları) ·
     [Bağlantıların durumu panelde](#bağlantıların-durumu-panelde--öneri)
   - **Üyelik ve yasal:** [Üyelik, oturum ve şifre](#üyelik-oturum-ve-şifre) ·
     [Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama) ·
     [Bülten ve İYS](#bülten-ve-i̇ys) ·
     [Çerezler ve yasal metinler](#çerezler-ve-yasal-metinler) ·
     [Satıcı bilgileri sitede](#satıcı-bilgileri-sitede-etbi̇s-unvan-mersi̇s)
   - **Ürünler ve içerik:** [Gerçek fotoğraflar — tam liste](#gerçek-fotoğraflar--tam-liste) ·
     [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) ·
     [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler) ·
     [Jasic lazer kaynak](#jasic-lazer-kaynak-ürünleri--sahibi-ayrıntılı-açıklayacak) ·
     [Ürün seçenekleri](#ürün-seçenekleri-3-m--5-m-gibi) ·
     [Kategori filtreleri](#kategori-filtreleri) ·
     [Ürün grupları](#ürün-grupları-kaynak-makineleri-lazer-makineleri-) ·
     [Blog yazıları](#blog-yazıları--yayına-girmeden-önce) ·
     [Teklif Al formu](#teklif-al-formu--sorular-düzenlenecek) ·
     [Force sayfası](#force-sayfası--panelden-yönetim-fotoğraf-ve-videolar) ·
     [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) ·
     [Video kütüphanesi](#video-kütüphanesi--kalan-adımlar) ·
     [SEO ve link yönlendirme](#seo-alanları-ve-link-yönlendirme) ·
     [SEO — anahtar kelime çalışması](#seo--anahtar-kelime-çalışmasından-kalan-işler)
   - **İleride:** [Ürün Seçici](#ürün-seçici-ve-arama--en-son-yeniden-tasarlanacak) ·
     [Ürün önerileri](#ürün-önerileri--ürün-sayfasındaki-i̇lgili-ürünler-yeniden-kurgulanacak) ·
     [Bayilik başvurusundan bayi açma](#bayilik-başvurusundan-bayi-açma--sahibiyle-birlikte-tasarlanacak) ·
     [Zenweld – bayi B2B](#zenweld--bayi-b2b-uygulaması) ·
     [Sitenin tasarımı](#sitenin-tasarımı--sahibi-yapacak) ·
     [Anasayfa](#anasayfa--sahibinden-gelecekler-ve-sonraki-işler) ·
     [Erişilebilirlik](#erişilebilirlik--önerilen-zorunlu-değil) ·
     [Görsel optimizasyonu](#görsel-optimizasyonu--önerilen-zorunlu-değil)

---

## 1. Canlıya giden yol

Son güncelleme: 2026-11-19.

**Hedef:** Site ve panel kendi sunucumuzda çalışır (K-92); bütün veri
sunucudaki PostgreSQL'de durur; stok SAP'tan okunur, siparişler SAP'a satış
siparişi olarak yazılır; site hızlı ve hatasız çalışır.

**Bugün:** Yayındaki site demo modundadır: her ziyaretçinin tarayıcısı
verinin kendi kopyasını tutar; panelde yapılan değişiklik yalnızca o
tarayıcıda görünür. Veritabanı modunun kodu hazırdır (`DATA_SOURCE=database`,
KARARLAR K-88): sitenin ve panelin bütün okuma ve yazmaları
sunucudan, veritabanından yapılır; üyelik ve oturum sunucudadır; ödeme
sağlayıcısı, SAP sipariş aktarımı ve dosya deposu değiştirilebilir parça
olarak hazırdır (K-108). Nasıl çalıştıkları: [SUNUCU.md](SUNUCU.md). Canlı
sunucu ve veritabanı kurulunca site bu modda yayına alınır. İki modun
farkları: [README](../README.md) › Demo ve veritabanı modu.

**Kalanlar** (önerilen sırayla):

| # | İş | Kimi bekliyor | Ayrıntı |
|---|---|---|---|
| 1 | **Canlı sunucu ve veritabanı:** sunucu, HTTPS, PostgreSQL 18 (canlı ve deneme), yedek, izleme, deneme ortamı; tabloların kurulması ve verinin yüklenmesi (`db:migrate`, `db:yukle canli`), ilk yönetici (`yonetici:olustur`); `www` ve `http` adreslerinin `https://zenweld.com`'a 301'i ve canlıya geçiş günü SEO adımları ([SEO.md](SEO.md) › 16 › 10) | BT | [Canlı sunucu](#canlı-sunucu-ve-vercel-temizliği), [Veriyi canlıya taşıma](#veriyi-canlıya-taşıma) |
| 2 | **E-posta servisi ve posta kutusu:** Resend hesabı, `zenweld.com` DNS doğrulaması, anahtar (gönderici varsayılanı info@zenweld.com; panelden türe göre değişir). Gelen yanıtlar için info@zenweld.com'un posta sağlayıcısı ve bağlantı bilgileri; zamanlayıcı. Bugün hiçbir e-posta gitmiyor ([SUNUCU.md](SUNUCU.md) › 9) | BT | [Online satış](#online-satış--canlıya-çıkmadan-önce) 6, [E-posta ve posta kutusu](#e-posta-ve-posta-kutusu--panel--e-posta) |
| 3 | **Müşteriye e-postalar:** sipariş onayı ve sözleşme kopyası (yasal zorunlu), havale hatırlatma, kargo bildirimi; teklif, servis, garanti ve iade durum bildirimleri | Sahibi (hangi e-postalar ve metinleri), sonra kod | [Online satış](#online-satış--canlıya-çıkmadan-önce) 5, [Müşteriye e-posta bildirimleri](#müşteriye-e-posta-bildirimleri-sipariş-dışı) |
| 4 | **Gerçek ödeme:** sanal POS ya da ödeme kuruluşu, 3D Secure; kart bilgisi sunucumuza gelmez. Ödeme sağlayıcısı parçası hazır (`packages/db/src/payment.ts`, K-108): kuruluşun parçası eklenir, 3D Secure için ödeme iki adıma ayrılır, ödeme sayfası kart programını sunucudan alır | Ödeme kuruluşu anlaşması | [Online satış](#online-satış--canlıya-çıkmadan-önce) 1, [SUNUCU.md](SUNUCU.md) › Kartla ödeme |
| 5 | **SAP stok bağlantısı:** okuma işine SAP'tan okuyan kaynağın eklenmesi (bugün deneme dosyası okunuyor); zamanlayıcının kurulması. Küçük iş; bilgiler gelince sırası beklenmeden yapılır | SAP ekibi; canlı sunucu | [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap) |
| 6 | **SAP satış siparişi aktarımı:** siparişi SAP'a yazan aktarıcı parça (`packages/db/src/sap-orders.ts` › `SapOrderExporter`; sıra, iş, yeniden deneme ve panel kutusu hazır, bugün deneme dosyasına yazıyor), zamanlayıcının kurulması; SAP'a aktarılmış siparişin iptali ve iadesinin SAP'a bildirilmesi | SAP sipariş API'si; cari ve KDV kararları | [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap), [Şirketten öğrenilecekler](#3-şirketten-öğrenilecekler-kişiye-göre) › SAP |
| 7 | **Form güvenliği:** istek sınırı ve bot koruması (canlıdan önce şart, K-98) | Kod; bot koruması seçimi | [Formlar — güvenlik](#formlar--güvenlik) |
| 8 | **Dosya deposu (depo kararı):** panelden görsel ve belge yükleme hazır (sunucunun diski, `DOSYA_KLASORU`; K-108). Kalan: görsel ve videoların canlıda nerede duracağı (sunucunun diski ya da nesne deposu ve CDN; videolar için öneri Cloudflare R2 + CDN) ve yedeği, kullanılmayan dosyaların temizliği, web sunucusunun istek sınırı, Unsplash yerine gerçek fotoğrafların yüklenmesi (Unsplash fotoğrafları kaldırıldı) | Sahibi ve BT (depo seçimi) | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) |
| 9 | **Hukuk ve muhasebe:** yasal metinler (bugün taslak), ETBİS kaydı, gerçek MERSİS no, kurumsal alıcının iade hakkının metinlere işlenmesi, KVKK saklama süreleri; e-Arşiv / e-Fatura | Hukuk danışmanı, mali müşavir | [Online satış](#online-satış--canlıya-çıkmadan-önce) 2–4, [Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama) |
| 10 | **Gerçek içerik ve değerler:** ürün bilgileri, fotoğraflar, fiyatlar; kargo ücreti, POS'lar ve vade farkları, IBAN'lar; blog yazıları | Sahibi | [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler), [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler), [Online satış](#online-satış--canlıya-çıkmadan-önce) 9, [Blog yazıları](#blog-yazıları--yayına-girmeden-önce) |
| 11 | **Canlıya hazırlık (kod):** zamanlanmış işler (havale iptali, işlem kaydı temizliği, kampanya yenilemesi), hata izleme, yedekten geri dönme denemesi, performans ve güvenlik testleri, ölçümün canlıda tekrarı, örnek verinin koddan kaldırılması (canlıya zaten yüklenmez, K-91) | Sunucu kararı | [Online satış](#online-satış--canlıya-çıkmadan-önce) 7, [SEO ve link yönlendirme](#seo-alanları-ve-link-yönlendirme), [Ölçüm](#ölçüm-hız) |

Kime ne sorulacağı: [3](#3-şirketten-öğrenilecekler-kişiye-göre).

---

## 2. Sonda ayrı ayrı ele alınacak konular (sahibiyle)

Sahibinin kararı (2026-11-05, KARARLAR K-106): Aşağıdaki konuların her biri
ayrı ayrı, derinlemesine ayar ve karar gerektirir; panelin veritabanına
geçişi bittikten sonra (bitti) sahibiyle tek tek konuşulup düzenlenecek. O
zamana kadar bugünkü düzen kalır; bu konularda kendiliğinden ayar ya da
tasarım yapılmaz. Bir adımda bu konulardan biri gerekirse o adımın ihtiyacı
kadarı, ileride gelecek bağlantılara (API) açık ve genişletilebilir yapılır
(K-107; ör. kargo takip bağlantısı, K-105).

| Konu | Bugün | Ayrıntılı notlar |
|---|---|---|
| **Fotoğraflar** (boyut, sıkıştırma, depolama, hız) | Örnek görseller sitenin klasöründe; veritabanı modunda panelde görsel dosya deposu ayarlıysa yüklenir, değilse adres girilir (K-101, K-108); iyileştirme sahibi söyleyince (K-102) | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar), [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler), [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) |
| **Belgeler** (MSDS, sertifikalar, rehber) | Demo modunda dosya tarayıcıda; veritabanı modunda dosya deposu ayarlıysa yüklenir, değilse adres girilir (K-104, K-108) | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) |
| **SEO** | Ürün, kategori, grup, blog, haber, etkinlik ve sabit sayfalarda SEO alanları; eski linkler veritabanı modunda sunucuda 301 (K-120), demo modunda tarayıcıda; eski zenweld.com'un 85 adresi 301 (K-121); site haritası, yapısal veri (K-123), sayfalama (K-124) | [SEO ve link yönlendirme](#seo-alanları-ve-link-yönlendirme), [SEO — anahtar kelime çalışması](#seo--anahtar-kelime-çalışmasından-kalan-işler) |
| **Kargo** (ücret, firmalar, takip, entegrasyon) | Sabit ücret ve ücretsiz kargo sınırı, firma listesi, takip numarası elle girilir; firmaya takip adresi girilince müşteri ve panelde takip bağlantısı (K-105); kargo firması API'si yok | [Online satış](#online-satış--canlıya-çıkmadan-önce) 8–9 |
| **İade** | Üye (bireysel ya da kurumsal) 14 gün içinde talep açar; panelde durum; para iadesi elle | [İade talebi](#i̇ade-talebi) 2–4 |
| **SAP ayarları ve stok kontrolü** | Depo stoğu deneme dosyasından 15 dakikada bir okunur; stokta olmayan ürün sepete eklenmez; bayi stoğunda geçerlilik süresi | [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap), [Bayi ve satıcı stokları](#bayi-ve-satıcı-stokları) |
| **SAP'a sipariş kaydı** | Veritabanı modunda aktarım sırası hazır (K-108): ödemesi kesinleşen sipariş sıraya girer, iş gönderir, başarısızsa yeniden dener, panelde durum ve **Yeniden sıraya al**; SAP yerine deneme dosyasına yazıyor | [1](#1-canlıya-giden-yol) › 6, [Zenweld depo stoğu (SAP)](#zenweld-depo-stoğu-sap) |
| **API ayarları** (SAP, ödeme, e-posta, kargo bağlantıları) | Bağlantı bilgileri yalnızca sunucuda ortam değişkeni; panelde yok (güvenlik kuralı) | [SUNUCU.md](SUNUCU.md), [Bağlantıların durumu](#bağlantıların-durumu-panelde--öneri) |
| **Banka ve ödeme ayarları** | Mağaza Ayarları'nda POS tablosu, taksitler ve havale hesapları; ödeme temsili | [Online satış](#online-satış--canlıya-çıkmadan-önce) 1, 9; [SUNUCU.md](SUNUCU.md) › Kartla ödeme |
| **E-postalar** (gönderen, metinler, müşteri bildirimleri) | Gönderici ve alıcılar Panel › E-posta › Adresler'de (K-116); servis kurulmadı, hiçbir e-posta gitmiyor | [Üyelik, oturum ve şifre](#üyelik-oturum-ve-şifre) 1, [Müşteriye e-posta bildirimleri](#müşteriye-e-posta-bildirimleri-sipariş-dışı) |

---

## 3. Şirketten öğrenilecekler (kişiye göre)

Site canlıya çıkmadan önce şirketteki ilgili kişilerden (BT, SAP
danışmanı, muhasebe, hukuk, kargo ve ödeme kuruluşu) öğrenilmesi ya da
kararlaştırılması gerekenler. Kişiye göre gruplandı; her madde o kişiye
olduğu gibi sorulabilir.

**Nasıl kullanılır:**

1. İlgili bölümü o kişiye iletin.
2. Gelen cevabı Claude'a (ya da siteyi geliştiren kişiye) iletin. Cevap
   koda, panele ya da [KARARLAR.md](KARARLAR.md)'ye işlenir; madde
   işaretlenir.
3. Maddenin sonundaki etiket cevabın nereye gideceğini gösterir:
   - **[Panel]** Yönetim panelinden girilir; kod gerekmez.
   - **[Sunucu]** Canlı sunucuya ayar (ortam değişkeni) olarak girilir.
   - **[Karar]** Bir karardır; KARARLAR'a yazılır, gerekirse kod
     değişir.
   - **[Kod]** Cevap gelince küçük bir kod parçası yazılır (bağlantı
     parçası); sitenin geri kalanı değişmez.

**Güvenlik:** Şifreler, API anahtarları ve banka bilgileri bu dosyaya,
panele, e-postaya ya da mesaja **yazılmaz**. Yalnızca sunucuyu kuran
kişiye verilir; o kişi doğrudan sunucuya girer
([SUNUCU.md](SUNUCU.md) › 2).

### BT (Bilgi İşlem)

**Sunucu ve alan adı**

- [ ] Site hangi sunucuda çalışacak (şirketin kendi sunucusu, kiralık
      sunucu, bulut)? Sunucu Türkiye'de mi? (Müşteri verisinin yurt
      dışında tutulması KVKK açısından hukukçuya da sorulmalı.) [Karar]
- [ ] Sunucuyu kim kuracak ve yönetecek? Kurulum: Node.js 22, önünde HTTPS
      sağlayan web sunucusu (ör. nginx). [Sunucu]
- [ ] `zenweld.com` alan adı ve DNS kayıtları kimin yönetiminde? DNS'e
      kayıt ekleyebilecek kişi kim? (E-posta doğrulaması ve sitenin
      adrese bağlanması için.) [Sunucu]
- [ ] Deneme (test) ortamı olacak mı? Canlıya almadan önce değişiklikler
      orada denenir. [Karar]
- [ ] Derleme sırasında sunucu veritabanına erişebilecek mi? (Sayfalar
      derlemede hazırlanır.) [Sunucu]
- [ ] Birden fazla sunucu çalışacak mı? Çalışacaksa önbellek ve form
      sayaçları için ortak bir depo (ör. Redis) gerekir; tek sunucuda
      gerekmez. [Karar]

**Veritabanı ve yedek**

- [ ] PostgreSQL 18 (olmazsa en az 16) nerede çalışacak (yönetilen hizmet
      mi, sunucunun içinde mi)? Canlı ve deneme için ayrı veritabanı; ICU
      desteği açık (Türkçe harf karşılaştırması); şifreli (SSL) bağlantı.
      [Sunucu]
- [ ] Yedekler ne sıklıkla alınacak, nerede saklanacak, kaç gün tutulacak
      (öneri: günlük, en az 30 gün geriye dönüş)? Yedekten geri dönme bir
      kez denenecek mi? [Karar]

**Dosya deposu (fotoğraflar ve belgeler)**

- [ ] Ürün fotoğrafları ve MSDS gibi belgeler nerede saklanacak: sunucunun
      diskinde mi, ayrı bir dosya deposunda (S3 uyumlu) mı? Yedeği nasıl
      alınacak? (Sunucunun diskine yazan depo hazır: `DOSYA_KLASORU`; bu
      klasör yedeğe eklenmeli. S3 uyumlu depo seçilirse onun parçası
      yazılır.) [Karar] [Kod]
- [ ] Kendi videolarımız için sunucuya ffmpeg kurulabilir mi, video için
      ne kadar disk ayrılır (dakikası yaklaşık 60–90 MB)? Videolar için
      nesne deposu ve CDN (ör. Cloudflare R2) düşünülsün mü? (K-125;
      [SUNUCU.md › Video hazırlama](SUNUCU.md#video-hazırlama)) [Karar]

**Zamanlanmış işler ve izleme**

- [ ] Sunucuda zamanlayıcı kurulabilir mi? (SAP stoğu 15 dakikada bir
      okunacak, siparişler birkaç dakikada bir SAP'a gönderilecek, posta
      kutusu 5 dakikada bir okunacak; süresi
      dolan havale siparişleri günde bir iptal edilecek; işlem kaydının
      2 yıldan eskisi her gün silinecek.) [Sunucu]
- [ ] Hata ve kesinti olursa kime haber gidecek (izleme)? [Karar]

**Güvenlik**

- [ ] Sunucudan SAP'a ağ erişimi nasıl olacak (VPN, güvenlik duvarı
      izni)? [Sunucu]
- [ ] Formlar için bot koruması (ör. Cloudflare Turnstile) ve istek
      sınırı kimde kurulacak? [Sunucu] [Kod]
- [ ] `zenweld.com`'un bütün alt alan adları https ile çalışıyor mu?
      (Güvenlik başlığında alt alan adlarını da kapsamak için.) [Karar]
- [ ] Sunucu ayarlarını (anahtar, şifre) kim girecek ve kimler
      görebilecek? [Karar]

**E-posta**

- [ ] Site e-postaları hangi servisten gönderilecek? Bugün Resend için
      hazır; şirketin kullandığı başka bir servis varsa söylenmeli.
      [Karar] [Kod]
- [ ] Gönderen adres varsayılan olarak `info@zenweld.com`'dur (K-116;
      türe göre panelden değişir). Alan adı doğrulaması (SPF, DKIM
      kayıtları) DNS'e eklenmeli. [Sunucu]
- [ ] Formların geldiği `info@zenweld.com` kutusunu kim okuyor? [Karar]
- [ ] **`info@zenweld.com` hangi sağlayıcıda?** Google Workspace,
      Microsoft 365 ya da hosting firmasının e-postası mı? Site bu kutuyu
      okuyup sitenin e-postalarına gelen yanıtları panele alır (K-116).
      Sağlayıcıya göre: hosting e-postasında IMAP sunucusu, kullanıcı adı ve
      şifre yeter; Google Workspace'te IMAP açık olmalı ve uygulama şifresi
      gerekir; Microsoft 365'te şifreyle IMAP kapalıdır, Microsoft'un
      uygulama izniyle (Graph) bağlanan parça yazılır. Bağlantı bilgileri
      yalnızca sunucuda ortam değişkeni olur
      ([SUNUCU.md › Posta kutusu](SUNUCU.md#posta-kutusu)). İleride
      `servis@zenweld.com` gibi ayrı adresler açılacaksa onlar da aynı
      kutuya mı gelecek, ayrı kutu mu olacak? [Sunucu] [Kod]

### SAP danışmanı

**Genel**

- [ ] SAP Business One sürümü ve veritabanı türü (HANA mı, SQL Server
      mı)? [Kod]
- [ ] Service Layer (SAP'ın web servisi) açık mı? Açıksa adresi ve site
      için ayrı bir kullanıcı açılabilir mi? [Sunucu]
- [ ] Deneme için SAP'ta test şirketi var mı? [Sunucu]

**Stok okuma** (site 15 dakikada bir okur)

- [ ] Sitede gösterilecek "kullanılabilir stok" hangi görünümden okunacak
      (bugün `AVAILABLE_STOCK` diye anılıyor)? Kesin adı ve kolonları
      (kalem kodu, miktar, kalem adı). [Kod]
- [ ] Stok hangi depo(lar)dan gelecek? [Karar]
- [ ] Sitedeki ürün kodları SAP kalem kodlarıyla birebir aynı mı (K-72)?
      Seçenekli ürünler (ör. 3 m / 5 m kablo) SAP'ta ayrı kalem mi?
      [Karar]
- [ ] Okuma yolu: Service Layer mı, veritabanına salt okunur kullanıcı
      mı? [Sunucu] [Kod]

**Siparişin SAP'a yazılması**

- [ ] Site siparişi SAP'ta satış siparişi olarak hangi API ile açılır
      (ör. `SALES_ORDER`)? [Kod]
- [ ] Müşteri kartı: her web müşterisi SAP'ta ayrı cari mi açılacak,
      yoksa tek bir "web satış" carisi mi kullanılacak? [Karar]
- [ ] Siparişte fiyat KDV dahil mi hariç mi gönderilecek? Kargo ücreti,
      kupon indirimi ve taksit vade farkı SAP'ta nasıl gösterilecek
      (ayrı satır, belge indirimi…)? [Karar]
- [ ] Sipariş ödeme kesinleşince aktarılacak şekilde kuruldu (kartla
      verilince, havalede "Ödeme Alındı" denince); uygun mu? Kaç dakikada
      bir gönderilsin (bugün öneri 5 dakika)? İptal ve iade SAP'a nasıl
      yansısın? [Karar]
- [ ] Aktarım başarısız olursa kim ilgilenecek? (Panelde sipariş
      detayında durum, hata ve SAP belge numarası görünüyor; gönderilemeyen
      sipariş yeniden sıraya alınabiliyor.) SAP'ın hangi hataları geçici
      sayılsın (yeniden denensin), hangileri kalıcı? [Karar] [Kod]
- [ ] Faturayı (e-Fatura / e-Arşiv) SAP mi kesiyor? [Karar]

### Ödeme (banka / ödeme kuruluşu) — muhasebe ile birlikte

- [ ] Kartla ödeme hangi kuruluşla alınacak: iyzico, PayTR, bankaların
      sanal POS'u (hangi bankalar)? [Karar] [Kod]
- [ ] Kuruluşun 3D Secure ödeme sayfası kullanılacak (kart bilgisi
      bizim sunucumuza hiç gelmez). Kuruluşun deneme (test) hesabı
      açılabilir mi? [Sunucu]
- [ ] Üye işyeri numaraları ve API anahtarları (yalnızca sunucuya
      girilir). [Sunucu]
- [ ] Taksit: hangi kart programları (Bonus, World, Maximum…), kaç taksit,
      vade farkını müşteri mi öder, bankanın komisyon oranları? [Panel]
- [ ] Para iadesi kuruluş üzerinden mi yapılacak (kısmi iade dahil)?
      [Karar] [Kod]
- [ ] Havale/EFT: gerçek IBAN'lar ve hesap sahibi adı; ödeme süresi
      (bugün 3 gün) uygun mu; havaleyi panelde kim onaylayacak? [Panel]

### Muhasebe / mali müşavir

- [ ] e-Fatura / e-Arşiv hangi yazılım ya da entegratörle kesiliyor?
      Site siparişinin faturası kim tarafından, ne zaman kesilecek?
      [Karar] [Kod]
- [ ] Sipariş ve fatura kayıtları yasal olarak kaç yıl saklanmalı?
      (Hesap silme ve KVKK imha kuralları buna göre yazılır.) [Karar]
- [ ] Kurumsal faturada istenen bilgiler (unvan, vergi dairesi, vergi
      no) yeterli mi? [Karar]
- [ ] Kargo ücreti ve vade farkı faturada nasıl gösterilecek? [Karar]

### Kargo firmaları / lojistik

- [ ] Hangi kargo firmalarıyla çalışılacak? [Panel]
- [ ] Her firmanın takip sayfasının adresi (takip numarasıyla açılan
      adres). Panelde Mağaza Ayarları › Kargo ve Ödeme'de kargo
      firmalarına girilir. [Panel]
- [ ] Firma API veriyor mu (kargo etiketi oluşturma, gönderi durumu,
      teslim bilgisi)? Veriyorsa belgeleri ve test hesabı. [Kod]
- [ ] Kargo ücreti: sabit mi kalacak, yoksa desi, ağırlık ya da bölgeye
      göre mi hesaplanacak? Ücretsiz kargo sınırı (bugün örnek 5.000 ₺)
      ve ücret (örnek 250 ₺)? [Karar] [Panel]
- [ ] İadede müşteri ürünü hangi firmayla, hangi anlaşmalı kodla
      gönderecek? Ücretini kim ödeyecek? [Karar]

### Hukuk danışmanı / KVKK

- [ ] Sözleşme ve yasal metinler: Ön Bilgilendirme Formu, Mesafeli Satış
      Sözleşmesi, İade ve Değişim, Kullanım Koşulları, Gizlilik, Çerez
      Politikası, KVKK Aydınlatma Metni ve diğer politikalar. Bugünkü
      metinler taslak; hukukçunun metinleriyle değiştirilmeli. [Panel]
- [ ] Kurumsal alıcılara da 14 gün iade hakkı tanınıyor (K-65); sözleşmeler
      ve İade ve Değişim metni buna göre yazılmalı. [Panel]
- [ ] ETBİS kaydı (Ticaret Bakanlığı) ve MERSİS numarası. Unvan ve MERSİS
      sitede nerede gösterilmeli (alt bilgi, İletişim)? [Panel] [Karar]
- [ ] Müşteri verisi yurt dışındaki bir sunucuda tutulabilir mi? [Karar]
- [ ] Yazışmalar (K-116) metniyle saklanıyor: e-postalar ne kadar
      saklansın, sonra kendiliğinden silinsin mi? [Karar]
- [ ] Üye hesabını silince hangi kayıtlar silinsin, hangileri yasal süre
      boyunca saklansın (sipariş, teklif, garanti, yorum)? Ayrıntı:
      [Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama).
      [Karar]
- [ ] Çerezler: analiz ve pazarlama çerezleri (ör. Google Analytics)
      kullanılacaksa onay metni. [Karar]
- [ ] Ticari ileti (bülten) için İYS kaydı. [Karar]
- [ ] AB'ye satış yapılacak mı? (Erişilebilirlik zorunluluğu buna göre
      değişebilir; [Erişilebilirlik](#erişilebilirlik--önerilen-zorunlu-değil).)
      [Karar]

### Satış ve müşteri hizmetleri (şirket içi süreçler)

- [ ] **İade süreci:** kim inceler, kaç günde yanıt verilir, ürün nasıl
      geri gelir, depoda kontrol, para iadesi kaç günde ve nasıl,
      değişim olacak mı, müşteriye hangi aşamada e-posta gider? Ayrıntı:
      [İade talebi](#i̇ade-talebi) 4. [Karar]
- [ ] Hangi formun e-postası kime gitsin ve hangi adresten gitsin
      (sipariş, iade, teklif, servis, garanti…)? Panelde Müşteriler ve
      Servis › E-posta › (tür) › Adresler'e girilir (K-116). [Panel]
- [ ] Panele kimler girecek? Her biri için yönetici hesabı açılır.
      [Sunucu]
- [ ] **Anti-spatter (çapak önleyici) satılacak mı?** Eski sitede vardı;
      yeni sitede kimyasal kategorisi yok. Cevaba göre eski adresi ürüne
      ya da Aksesuarlar'a yönlenir ([SEO](#seo--anahtar-kelime-çalışmasından-kalan-işler)
      C1). [Karar]
- [ ] Müşteriye gidecek e-postalar: sipariş onayı (yasal zorunlu,
      sözleşme kopyasıyla), havale hatırlatma, kargoya verildi, teslim
      edildi, şifre sıfırlama. Gönderen adı ve metinler. [Karar]

### Pazarlama ve içerik

- [ ] Gerçek ürün fotoğrafları, teknik değerler ve fiyatlar. [Panel]
- [ ] Fotoğrafların boyutu ve kalitesi için bir standart (sahibiyle
      konuşulacak, K-102). [Karar]
- [ ] Google Search Console ve (istenirse) Google Analytics hesaplarını
      kim açacak ve yönetecek? [Sunucu] [Karar]
- [ ] Bülten için hangi servis kullanılacak (ör. Mailchimp, Brevo)?
      [Karar] [Kod]
- [ ] Sosyal medya hesaplarının adresleri doğru mu? Panelde Mağaza
      Ayarları › Şirket ve İletişim'de. [Panel]

---

## 4. Karar ya da bilgi bekleyen site işleri

Bir karara ya da bilgiye bağlı olduğu için bekleyen site işleri. Ayrıntısı
olanlar ilgili bölüme bağlanmıştır.

| İş | Neyi bekliyor | Ayrıntı |
|---|---|---|
| Çerez ayarları penceresi (analiz ve pazarlama çerezlerini ayrı açıp kapama) ve analiz kodlarının kurulması | Hangi analiz aracının kullanılacağı | [Çerezler ve yasal metinler](#çerezler-ve-yasal-metinler) 1–3, [Online satış](#online-satış--canlıya-çıkmadan-önce) 10 |
| Kategori filtrelerinin değerleri ve ürünlere eşlenmesi | Ürünlerin kesinleşmesi; Şebeke Voltajı, Amper ve Güç değerleri. Bugünkü filtreler örnek (KARARLAR K-102) | [Kategori filtreleri](#kategori-filtreleri) |
| Ürün karşılaştırma (bugün yok) | Ürünlerin kesinleşmesi; istenirse (KARARLAR K-102) | — |
| Menü düzeni, sayfalar, metinler | Sahibinin kararı; bugünkü hepsi örnek (KARARLAR K-102). Dört ana bölüm kodda sabit; yeni bölüm ya da sayfa kod işidir | — |
| Ürün Seçici'nin yeniden kurulması | Bütün ürünlerin kesinleşmesi; en son ele alınacak (KARARLAR K-69) | [Ürün Seçici ve arama](#ürün-seçici-ve-arama--en-son-yeniden-tasarlanacak) |
| Site içi aramanın ayarları (çalışma prensibi; hangi kelimede hangi sayfa çıkar) | Sahibiyle sonra ele alınacak | [Ürün Seçici ve arama](#ürün-seçici-ve-arama--en-son-yeniden-tasarlanacak) › Site içi arama |
| "İlgili Ürünler" öneri mantığı | Bölümdeki kararlar | [Ürün önerileri](#ürün-önerileri--ürün-sayfasındaki-i̇lgili-ürünler-yeniden-kurgulanacak) |
| Teklif Al formunun soruları | Sahibinin göndereceği gerçek sorular | [Teklif Al formu](#teklif-al-formu--sorular-düzenlenecek) |
| Ayrı ürünü seçeneğe dönüştürme ekranı | Gerçek ürünler girilmeye başlanınca karar | [Ürün seçenekleri](#ürün-seçenekleri-3-m--5-m-gibi) 2 |
| Satıcı bilgilerinin sitede gösterilmesi (ETBİS, unvan, MERSİS) | ETBİS kaydı ve şirket bilgileri | [Satıcı bilgileri sitede](#satıcı-bilgileri-sitede-etbi̇s-unvan-mersi̇s) |
| Kargo firması API'si (etiket, durum) | Kargo firması ve entegrasyon kararı | [Online satış](#online-satış--canlıya-çıkmadan-önce) 8 |
| Müşterinin siparişini sitede iptal etmesi | İleride düşünülecek | [Müşterinin siparişi iptal etmesi](#müşterinin-siparişi-iptal-etmesi--ileride-düşünülecek) |
| KVKK başvuru formu (2b) | İleride düşünülecek; hesap silme için 2a (Hesabımı Sil) seçildi | [Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama) 10 |
| Erişilebilirlik | Sahibin sıralaması; zorunlu değil | [Erişilebilirlik](#erişilebilirlik--önerilen-zorunlu-değil) |
| Görsel optimizasyonu | Sahibin sıralaması; zorunlu değil. Görseller sahibi söyleyince; dosya deposu, gerçek fotoğraflar ve canlıya hazırlıkta hatırlatılır (KARARLAR K-102) | [Görsel optimizasyonu](#görsel-optimizasyonu--önerilen-zorunlu-değil) |
| Gerçek fotoğraflar: ürünler (15 ürün ve 4 ürünün bir soğutma hali), blog kapakları, etkinlik fotoğrafları, Hakkımızda, anasayfa tanıtımındaki atölye fotoğrafı, satış temsilcileri, Force sayfası | Sahibinin bulup göndermesi | [Gerçek fotoğraflar — tam liste](#gerçek-fotoğraflar--tam-liste) |
| Ekipmanların gerçek içeriği (açıklama, teknik özellikler, kutu içeriği, öne çıkanlar, kılavuz) | Sahibinin göndermesi (Force serisi 9 ürün geldi) | [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) 2 |
| Geçici ürün kodlarının (`ZW-GECICI-…`) SAP kodlarıyla değiştirilmesi | SAP kodlarının açılması | [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) 6 |
| Ekipmanların gerçek fiyatları ve seçenek fiyat farkları | Sahibinin göndermesi | [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) 3 |
| Ara paket uzunluklarının gerçek değerleri | Sahibinin göndermesi | [Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler) 4 |
| Jasic lazer kaynak ürünleri (2026-10-27 listesindeki 6 model; belki çok sonra) | Sahibinin seçenekleri ayrıntılı açıklaması | [Jasic lazer kaynak ürünleri](#jasic-lazer-kaynak-ürünleri--sahibi-ayrıntılı-açıklayacak) |
| Teklif, servis, garanti ve iade durumlarında müşteriye e-posta | Hangi bildirimlerin gideceği ve metinleri | [Müşteriye e-posta bildirimleri](#müşteriye-e-posta-bildirimleri-sipariş-dışı) |
| Yöneticinin kendi şifresini panelden değiştirmesi | Şimdi yapılmıyor (K-105) | [Üyelik, oturum ve şifre](#üyelik-oturum-ve-şifre) 2 |
| SEO: anti-spatter (C1), ad, başlık ve link kalıbı (C2), ürün gamı fırsatları (C3), Search Console doğrulaması (C4), teslim süresi ve iade kargo ücreti (C5), barkod (C6) | Sahibinin kararı ya da bilgisi; C4 için BT | [SEO — anahtar kelime çalışması](#seo--anahtar-kelime-çalışmasından-kalan-işler) C |
| Sitenin tasarımı | Sahibi yapacak | [Sitenin tasarımı](#sitenin-tasarımı--sahibi-yapacak) |
| Anasayfa: kurumsal metin, güven şeridi bilgileri ve sayılarının kontrolü, gerçek metinler, yeni videoların ürünleri | Sahibinin göndermesi | [Anasayfa](#anasayfa--sahibinden-gelecekler-ve-sonraki-işler) |
| Görsel düzenleyici (önizleme, sürükle, ölçekle) ve sayfa görsellerinin panelden değişmesi | Tasarımın bitmesi (fotoğrafların yeri ve sayısı kesinleşince) | [Sitenin tasarımı](#sitenin-tasarımı--sahibi-yapacak) 5 |

---

# Ayrıntılar

## Canlı sunucu ve Vercel temizliği

Sahibinin kararı (KARARLAR K-92, 2026-11-04): canlı site Vercel'de değil,
kendi sunucumuzda ve kendi alan adımızla yayınlanır. Demo şu an Vercel'de
(derleme sunucusu ABD'de, Washington, D.C.) ve öyle kalır.

- **Sunucunun yeri ve KVKK:** Müşteri verisi sunucuda tutulacak. Türk
  kullanıcıların kişisel verisinin yurt dışında tutulması KVKK kapsamında
  değerlendirilmeli; sunucunun yeri hukuk/BT ile belirlenir.
- **Kurulum:** Site standart bir Node.js uygulamasıdır (`npm run build` +
  `npm start`, Node.js 22). Önünde HTTPS sağlayan bir web sunucusu (ör.
  nginx), zamanlayıcı ([SUNUCU.md](SUNUCU.md) › 3), yedek ve izleme.
  `NEXT_PUBLIC_SITE_URL` = `https://zenweld.com` tanımlanır; site bu alan
  adında kendiliğinden arama motorlarına açılır. Alan adı `zenweld.com`
  değilse `src/lib/seo.ts` içindeki `INDEXABLE_HOSTS` güncellenmeli.
- **Görseller:** Bugün Next'in görsel küçültmesi kullanılmıyor
  ([Görsel optimizasyonu](#görsel-optimizasyonu--önerilen-zorunlu-değil)).
  Yapılırsa sunucuda `sharp` kurulu olmalı.
- **Önbellek:** Tek sunucuda Next'in kendi önbelleği (diskte) yeterli.
  Birden fazla sunucu çalışırsa önbellek ortak bir yerde (ör. Redis)
  tutulmalı; yoksa yenileme yalnızca isteği alan sunucuda olur.
- **Derleme sırasında veritabanına erişilmelidir** (sayfalar derlemede
  hazırlanır). Bilerek böyle bırakıldı: derlemeyi
  veritabanından bağımsız yapmak, sayfaları önceden hazırlamak yerine her
  ziyarette yeniden üretmek demek; site yavaşlar. Kendi sunucumuzda (K-92)
  derleme veritabanına erişebilir.
- **Demo Vercel'den kalkınca** Vercel'e özel parçalar kaldırılır (yaklaşık
  10 dakika):
  - `apps/zenweld-web/vercel.json`
  - `apps/zenweld-web/src/lib/seo.ts` dosyasındaki `getSiteUrl()` içinde
    `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` yedeği ve önizleme
    sürümlerinin aramaya kapatılması (`VERCEL_ENV`)
  - README, `.env.example` ve kod yorumlarındaki Vercel anlatımları

## Veriyi canlıya taşıma

- **Tablolar otomatik kurulur:** `npm run db:migrate` boş bir veritabanında
  bütün tabloları kurar; aynı betikler her yayına almada çalıştırılabilir
  (çalışmış betik bir daha çalışmaz). Yönetilen PostgreSQL'de (AWS RDS ya
  da Google Cloud SQL) özel yetki gerekmez; Türkçe harf karşılaştırması
  için ICU desteği açık olmalıdır.
- **Veri:** Tablolar kurulduktan sonra `npm run db:yukle canli` (deneme
  veritabanı için `deneme`) bugünkü veriyi yükler (KARARLAR K-91); komut
  onay için veritabanının adını sorar. Örnek üye, sipariş, teklif, servis,
  garanti, yorum, kupon, depo stoğu ve bayi stok listeleri canlıya
  yüklenmez; depo stoğu ilk SAP okumasıyla gelir (K-122), o zamana kadar
  ürünler "STOKTA YOK" görünür. Panel
  veritabanına yazdığı için veri doğrudan panelden girilir; komut yalnızca
  eksik kayıtları ekler, `guncelle` yazılırsa paneldeki değişikliklerin
  üzerine yazar ([SUNUCU.md › Veri yükleme](SUNUCU.md#veri-yükleme)).
  `npm run db:seed` örnek üye ve siparişleri de yüklediği için yalnızca
  bilgisayarda çalışır.
- Bayiler, satıcılar, POS ve IBAN bilgileri açılıştan önce gerçekleriyle
  değiştirilir.
- **İlk yönetici:** Canlıya hiç hesap yüklenmez; `npm run yonetici:olustur`
  ile açılır.
- **İşlem kaydı temizliği:** Canlıda her gün `SELECT purge_audit_log();`
  çalıştırılmalı (2 yıldan eski değişiklik kayıtları; sunucudaki
  zamanlanmış iş ya da `pg_cron`).

## Veritabanı — kalanlar

Veritabanı modu bütün kayıtlar için hazır ([VERITABANI.md](VERITABANI.md),
[SUNUCU.md](SUNUCU.md)). Kayıt sayısı büyüyünce ve canlıdan önce:

1. **Katalog önbelleği:** Katalog (bugün ~110 KB, sıkıştırılmış ~17 KB) her
   sayfaya gelir. Next'in önbelleği tek kayıtta en fazla 2 MB tutar;
   katalog ~1.000 üründe bu sınıra yaklaşır (aşılırsa önbelleğe alınmaz,
   her yenilemede veritabanı okunur). Ürün sayısı bu düzeye gelmeden ürünler
   parça parça (ör. bölüm başına) önbelleğe alınmalı. Stok ve yorumlar ürün
   başına okunduğu için sınıra takılmaz (bayi stoğu bugün 2.754 satır,
   ~500 KB; ürün sayfasına yalnızca o ürünün stoktaki satırları gider).
2. **Süreye bağlı yenileme:** Değişiklik panel kaydında hemen görünür
   (`refreshSite`); sayfaların 30 saniyede bir yeniden hazırlanması yalnızca
   yedektir. Sürenin uzatılıp uzatılmayacağı sahibine sorulur (K-88).
3. **Form kayıtlarının saklama süresi:** bayilik başvurusu ve mesaj
   kayıtlarının ne kadar tutulacağı ve silinmesi KVKK kararıyla
   belirlenecek (K-100; [Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama)).
4. **"Doğrulanmış alıcı":** Giriş yapmış üyenin ürün değerlendirmesi bugün
   iki modda da "Doğrulanmış alıcı" sayılıyor; üyenin o ürünü gerçekten
   satın almış olmasıyla (teslim edilmiş sipariş) eşleştirilmeli.
5. **Panel ana sayfasının okuması:** Özet sunucuda hesaplanıyor ve
   tarayıcıya yalnızca sonuç gidiyor; ama sunucu hesap için siparişlerin,
   tekliflerin, üyelerin, servis ve garanti kayıtlarının tamamını her
   açılışta veritabanından okuyor (`readDashboardPanel`). Kayıt sayısı
   büyüdükçe (on binlerce sipariş) sayfa geç açılır ve veritabanına yük
   biner. Canlıdan önce:
   - Yalnızca seçilen dönemin ve karşılaştırılan önceki dönemin kayıtları
     okunsun (en çok 180 gün).
   - Toplam sayılar (sipariş, işlem bekleyen, üye, teklif, yeni teklif,
     garanti) veritabanında sayılsın (`count`); kayıtlar okunmasın.
   - Son 5 teklif ve son 5 sipariş yalnızca 5 kayıt olarak okunsun.
   - `users.created_at` ve `warranties.registered_at` kolonlarına dizin
     eklensin (siparişte, teklifte ve serviste zaten var).
   - Deneme veritabanına çok sayıda örnek kayıt (ör. 50.000 sipariş)
     yüklenip açılış süresi ölçülsün; hedef 1 saniyenin altı. Yavaşsa ciro,
     sipariş ve üye toplamları da veritabanında gün ve saat gruplarıyla
     (Türkiye günü) hesaplansın; o zaman hiç kayıt okunmaz.
   - Ekrandaki sayılar değişmemeli: `tests/unit/panel-ozeti.test.ts` ve
     `tests/e2e-db/panel-ana-sayfa.spec.ts` bunu dener.

## Ölçüm (hız)

Hız işi (SEO B5) bu bölümdedir: ölçümler, Lighthouse denetimi, bulgular,
yapılacaklar (20 madde) ve ölçüm turları. **Hiçbir madde atlanmaz**
(sahibi, 2026-11-25).

**Hedef (Google'ın "iyi" sınırları, telefonda):** en büyük içeriğin
görünmesi (LCP) 2,5 sn altı, sayfa kayması (CLS) 0,1 altı, ekranın kodla
kilitlendiği süre (TBT; gerçek ziyaretçide INP) 0,2 sn altı. Bilgisayardaki
ölçüm yol gösterir; **kesin sonuç canlı sunucuda yeniden ölçülür**
(sunucunun yanıt süresi, sıkıştırma ve önbellek ayarları dahil).

**Nasıl ölçülür:** `node scripts/sayfa-olcumu.mjs <adres…>` (README ›
Diğer araçlar). Her turda aynı betik: Google'ın üç ölçüsü (en büyük
içerik, sayfa kayması, kilitlenme), ilk bayt, sayfa ağırlığı (sitenin
kendi dosyaları ve dış adresler ayrı), istek ve önceden yüklenen sayfa
sayısı, en büyük içeriğin ne olduğu; 12 sayfa türü (anasayfa, grup,
kategori, ürün, blog yazısı, haber, etkinlik, Videolar, Force, bayi ağı,
Hakkımızda, sepet). Koşullar Google'ın ölçümündeki gibi: telefonda yavaş
4G (1,6 Mbit/sn, 150 ms gecikme) ve 4 kat yavaşlatılmış işlemci;
masaüstünde 10 Mbit/sn, 40 ms. Her sayfa boş önbellekle 3 kez, ortanca
değer. Boyutlar sıkıştırılmış (ağdan inen) boyuttur.

### Ölçüm turları (her turdan sonra bu bölüm güncellenir)

1. **2026-11-25 — bugünkü durum** (yapıldı; aşağıda).
2. **Tanıtım alanı ve bayi haritasının yeni tasarımından sonra** (sahibi
   tasarımı hızdan önce yapacak; hız, değişecek tasarıma göre yapılırsa
   iş iki kez yapılır): aşağıdaki 1, 2 ve 5. maddeler
   yeni tasarıma göre yapılır, yeniden ölçülür.
3. **Görsel optimizasyonundan ve gerçek fotoğraflar geldikten sonra**
   ([Görsel optimizasyonu](#görsel-optimizasyonu--önerilen-zorunlu-değil),
   [Gerçek fotoğraflar](#gerçek-fotoğraflar--tam-liste)): görseller
   değişince yeniden ölçülür.
4. **Deneme sunucusu ve veritabanı kurulunca, canlıdan önce:** veritabanı
   modunda, sunucunun gerçek ayarlarıyla (sıkıştırma, önbellek, HTTP/2)
   bütün sayfa türleri yeniden ölçülür; sunucunun yanıt süresi (ilk bayt)
   de bakılır.
5. **Canlıya çıktıktan sonra:** Search Console › Önemli Web Verileri
   (gerçek ziyaretçilerin ölçümü) ayda bir izlenir (SEO.md › 16 › 2).

### 2026-11-25 ölçümü (bilgisayarda, demo modu)

Kalın: Google'ın "iyi" sınırının üstünde. JavaScript, ekrandaki
bağlantıların önceden yüklenen sayfalarının kodunu da içerir. Dış
adresler (YouTube kapakları, harita parçaları) bu ortamda engelli
olduğu için ölçülemedi (0); deneme sunucusunda ölçülecek.

**Telefon:**

| Sayfa | LCP | CLS | TBT | JavaScript | Toplam | Önceden yüklenen | En büyük içerik |
|---|---|---|---|---|---|---|---|
| Anasayfa | **3,2 sn** | **0,30** | **0,95 sn** | 336 KB | 989 KB | 16 | Tanıtımın atölye fotoğrafı |
| Grup (Kaynak Makineleri) | 1,9 sn | 0,00 | **0,47 sn** | 308 KB | 425 KB | 12 | Kategori çizimi |
| Kategori (ürün listesi) | 2,4 sn | 0,00 | **0,50 sn** | 331 KB | 558 KB | 12 | İlk ürünün fotoğrafı |
| Ürün | 1,0 sn | 0,00 | **0,60 sn** | 331 KB | 505 KB | 12 | Ürün fotoğrafı |
| Blog yazısı | 0,8 sn | 0,00 | **0,59 sn** | 324 KB | 444 KB | 18 | Yazının metni |
| Haber | 0,9 sn | **0,14** | **0,57 sn** | 305 KB | 549 KB | 8 | Başlık |
| Etkinlik | 0,8 sn | 0,01 | **0,50 sn** | 307 KB | 503 KB | 8 | Metin |
| Videolar | 0,8 sn | 0,07 | **0,72 sn** | 338 KB | 467 KB | 10 | Kategori başlığı |
| Force | **3,9 sn** | 0,00 | **0,70 sn** | 330 KB | 1022 KB | 6 | Kaynak ustası fotoğrafı |
| Bayi ve servis ağı | 0,9 sn | 0,07 | **0,72 sn** | 345 KB | 481 KB | 6 | Başlık |
| Hakkımızda | 0,9 sn | 0,00 | **0,65 sn** | 303 KB | 396 KB | 6 | Metin |
| Sepet | **2,9 sn** | 0,00 | **0,61 sn** | 303 KB | 464 KB | 27 | Boş sepet yazısı |

**Masaüstü:** En büyük içerik bütün sayfalarda 0,8 sn altında,
kilitlenme 0,07 sn altında. Sınırı aşan tek değer anasayfadaki sayfa
kayması (**0,28**). Önceden yüklenen sayfa sayısı yüksek: blog yazısı ve
sepette 66, Videolar'da 44 (JavaScript 340–410 KB).

(4 Kasım'da anasayfa 3,0 sn ve 641 KB'tı; aradaki artış videolar ve
tanıtım görselleri. İki modun farkı: veritabanı modunda sayfa ~22–26 KB
büyük, JavaScript ~28 KB küçük; demo modundaki örnek veri canlıda
tarayıcıya gitmez.)

### 2026-11-25 Lighthouse denetimi (bilgisayarda, demo modu)

`node scripts/lighthouse-denetimi.mjs`; Lighthouse ilk kez gelen
ziyaretçi gibi açar. Kalın: 90 altı.

| Sayfa | Telefon: Performans / Erişilebilirlik / En iyi uyg. / SEO | Masaüstü: Performans / Erişilebilirlik / En iyi uyg. / SEO |
|---|---|---|
| Anasayfa | **66** / 91 / 96 / **69** | **82** / 91 / 96 / **69** |
| Grup (Kaynak Makineleri) | **86** / 96 / 100 / **69** | 100 / 96 / 100 / **69** |
| Kategori (ürün listesi) | **84** / 95 / 100 / **69** | 100 / 95 / 100 / **69** |
| Ürün | **81** / 92 / 100 / **69** | 99 / 97 / 100 / **69** |
| Blog yazısı | **84** / 95 / 100 / **69** | 100 / 95 / 100 / **69** |
| Haber | **82** / 96 / 100 / **69** | 98 / 96 / 100 / **69** |
| Etkinlik | **87** / 97 / 100 / **69** | 100 / 97 / 100 / **69** |
| Videolar | **86** / 97 / 96 / **69** | 100 / 97 / 96 / **69** |
| Force | **76** / 97 / 100 / **69** | 96 / 97 / 100 / **69** |
| Bayi ve servis ağı | **72** / 92 / 96 / **69** | 100 / 92 / 96 / **69** |
| Hakkımızda | 93 / 96 / 100 / **69** | 100 / 96 / 100 / **69** |
| Sepet | **88** / 96 / 100 / **66** | 100 / 96 / 100 / **66** |

- **SEO 69'un tek nedeni** "sayfanın dizine eklenmesi engellenmiş": demo
  ve bilgisayardaki adres arama motorlarına bilerek kapalı (canlıda,
  zenweld.com'da açılır). SEO puanı canlıda yeniden denetlenir (tur 4–5).
- **En iyi uygulamalar 96'nın nedeni** konsoldaki hatalar: bu ortamda dış
  adresler (YouTube kapakları, harita parçaları) engelli olduğu için;
  deneme sunucusunda yeniden bakılır.

### Bulgular

- **Anasayfanın en büyük içeriği** tanıtım alanındaki atölye fotoğrafı
  (122 KB); 3,2 sn'de görünüyor. Yavaş bağlantıda aynı anda inenlerle
  yarışıyor:
  - Tanıtımın diğer iki sayfasının görselleri (Jasic 167 KB, Force
    59 KB) ekranda görünmedikleri halde hemen iniyor.
  - Bayi haritası (Leaflet, 41 KB kod ve harita parçaları) sayfanın çok
    altında olduğu halde hemen yükleniyor.
  - JavaScript 335 KB: React 71 KB, sitenin metinleri ve örnek veri
    57 KB, Next.js 43 KB, harita 41 KB, diğerleri.
- **Sayfa kayması:** anasayfada 0,30 (masaüstünde 0,28; Google'a göre
  kötü, iyi 0,1 altı), haber sayfasında telefonda 0,14. Bölümler
  sonradan yer değiştiriyor; nedeni bulunacak.
- **Kilitlenme:** Telefonda bütün sayfalarda sınırın üstünde: anasayfada
  0,95 sn, diğerlerinde 0,47–0,72 sn (sınır 0,2 sn). Masaüstünde sorun
  yok; telefonun yavaş işlemcisinde sitenin kodu ağır geliyor.
- **Force sayfası:** En büyük içerik 3,8 sn'de görünüyor (büyük görsel).
- **Önceden yüklenen sayfalar:** Her sayfa, ekrandaki bağlantıların
  sayfalarını önceden indiriyor: telefonda 6–27, masaüstünde 18–66;
  telefonda bant genişliğini ve işlemciyi paylaşıyor.
- **Yazı tipleri:** 98 KB (Inter ve Barlow Condensed'in üç kalınlığı;
  Türkçe harfler için iki alt küme).
- **Sepet:** Google'a kapalı; içerik tarayıcıdaki sepete göre çiziliyor.

### Yapılacaklar

1. **Tanıtım alanı** (yeni tasarımdan sonra): ilk sayfanın görseli
   "önce bunu indir" diye işaretlenir; diğer sayfaların görselleri sayfa
   açıldıktan sonra iner (ilk geçişten önce hazır). [Kod]
2. **Bayi haritası** (yeni tasarımdan sonra): ekrana yaklaşınca yüklenir
   (anasayfa ve Force sayfası). [Kod]
3. **Sitenin kendi dosyalarına önbellek:** yapıldı (2026-11-25):
   `/images` ve `/icons` tarayıcıda 7 gün ([SUNUCU.md](SUNUCU.md) › 3 ›
   Tarayıcı önbelleği). Tekrar gelen ziyaretçide ölçülür (tur 4).
4. **Ölç ve kaydet:** her işten sonra iki modda ölçülür; sonuçlar bu
   bölüme ve SEO.md'ye yazılır.
5. **Görsellerin telefona uygun boyutta gelmesi** (sahibinin onayıyla,
   K-102): her görselin küçük ve büyük sürümü; tarayıcı ekranına uygun
   olanı seçer. Önce tanıtım alanı (yeni tasarımdan sonra), sonra gerçek
   fotoğraflarla diğerleri. [Kod]
6. **Sayfa kayması:**
   - **Anasayfa, yapıldı (2026-11-25):** nedeni "Müşterilerimiz Ne
     Diyor?" şeridiydi; kayan halka düzenine geçerken kartlar yerinden
     çıkıyor, şerit 270 px'ten 248 px'e iniyordu. Kartlar artık yerinde
     durup yalnızca kayıyor: telefonda 0,30 → 0,001, masaüstünde 0,28 →
     0,017 (kalan küçük kayma yazı tipinden).
   - **Haber sayfası (telefonda 0,14):** başlık yazı tipi (Barlow
     Condensed) geç gelince başlık önce daha geniş yedek yazı tipiyle
     çiziliyor, yazı tipi gelince daralıyor ve altındaki metin yukarı
     kayıyor. 10. maddeyle çözülür. [Kod]
   - Görsellerin ölçüsü önceden bilinmediği için (Lighthouse: genişlik ve
     yükseklik yok) görsel geç gelince de kayma olabilir; 5. maddeyle
     (görsellerin ölçüsü kaydedilir). [Kod]
7. **Kilitlenme süresi:** telefonda bütün sayfalarda (anasayfa 0,95 sn,
   diğerleri 0,47–0,72 sn).
   - **Veritabanı modunda (canlı site) çok daha az** (2026-11-25, telefon):
     ürün 0,75 → 0,21 sn, Hakkımızda 0,38 → 0,18 sn, anasayfa 0,77 →
     0,55 sn. Demo modunda sayfa açılırken örnek verinin tarayıcıda
     hazırlanması işlemciyi yoruyor; canlıda bu yok.
   - **Anasayfa veritabanı modunda da sınırın üstünde (0,55 sn):**
     anasayfaya özgü kod (tanıtım animasyonları, video ve yorum şeritleri,
     harita) incelenir, gerekmeyen kod sonraya bırakılır; önceden yükleme
     de payını alıyor (9). [Kod]
8. **Force sayfası (3,8 sn):** büyük görselin boyutu ve önceliği (Force
   sayfasının tasarımı ve görselleri de değişebilir). [Kod]
9. **Önceden yüklenen sayfalar:** telefonda 6–27, masaüstünde 18–66.
   Deney (2026-11-25, telefon, önceden yükleme kapalıyken): en büyük
   içerik değişmiyor (yükleme sayfa açıldıktan sonra başlıyor); sayfa
   başına ~90–100 KB daha az iniyor; anasayfada kilitlenme 0,96 → 0,69 sn.
   Karşılığında tıklanan sayfa anında açılmaz. **Karar sahibinde**; öneri:
   telefonda bağlantıya dokunulunca, masaüstünde üzerine gelince
   yüklensin. [Kod]
10. **Yazı tipleri:** (2026-11-25 incelemesi)
    - **Gövde yazı tipi Inter hiç uygulanmıyor:** kodda adı "Inter",
      yüklenen yazı tipinin adı "Inter Variable"; ziyaretçi gövde
      yazılarını cihazının yazı tipiyle görüyor, Inter dosyası hiç inmiyor.
      Düzeltilirse gövde Inter ile görünür, ~45 KB daha iner. **Karar
      sahibinde** (Inter mi, cihazın yazı tipi mi).
    - **Barlow Condensed** (başlıklar): yalnızca kullanılan kalınlıklar
      iniyor (600, 700; 400 çok az yerde); Türkçe harfler için iki alt
      küme. Gereksiz inen dosya yok.
    - **Yazı tipi geç gelince sayfa kayıyor** (haber sayfası 0,14):
      öneri, yazı tiplerini Next.js'in yazı tipi aracına (`next/font`)
      taşımak: yedek yazı tipinin ölçüsü otomatik ayarlanır (kayma olmaz),
      yazı tipi önceden yüklenir. Görünüş değişmez. [Kod]
11. **Bütün sayfa türlerinin Lighthouse denetimi** (performans,
    erişilebilirlik, en iyi uygulamalar, SEO; telefon ve masaüstü;
    `node scripts/lighthouse-denetimi.mjs <adres>`, her ölçüm turunda):
    anasayfa, kategori, ürün, blog, haber, etkinlik, Videolar, Force, bayi
    ağı, Hakkımızda, sepet, ödeme. Bulgular bu listeye eklenir. [Kod]
12. **Kullanılmayan JavaScript ve CSS:** (2026-11-25, Lighthouse)
    anasayfada ~71 KB: önceden yüklenen başka sayfaların kodu (ör. Force
    sayfasının kodu, 24 KB) → 9; sayfa açılırken yüklenen harita kodu
    (25 KB) → 2; React çekirdeği (22 KB) kaçınılmaz. Ayrı bir iş
    gerekmiyor; 2 ve 9 yapılınca yeniden ölçülür.
13. **Dış kaynaklar:** YouTube kapakları ve harita parçaları ilk açılışta
    inmesin (yalnızca ekrana yaklaşınca). [Kod]
14. **Sunucu (BT, tur 4'te):** yanıt süresi (ilk bayt) veritabanı
    modunda; sıkıştırma (Brotli/gzip), HTTP/2, önbellek başlıkları;
    sayfaların önbelleği (ISR). [BT ve Kod]
15. **Sepet** (Google'a kapalı, düşük öncelik): boş sepet ve iskelet
    sunucuda çizilebilir mi. [Kod]

Lighthouse denetiminden gelenler:

16. **En büyük içerik olan görselin geç fark edilmesi** (kategori, ürün,
    grup, haber, Force sayfaları): ilk görünen fotoğraf "sonra yükle"
    (lazy) ya da öncelik işaretsiz; tarayıcı onu geç istiyor. Sayfanın
    ilk görselleri öncelikli yüklenir. [Kod]
17. **Sayfanın çizimini bekleten CSS:** iki CSS dosyası (19 KB + 2 KB)
    sayfa çizilmeden önce iniyor; telefonda tahmini 0,85 sn gecikme.
    Gerekli CSS sayfanın içine gömülebilir mi denenir. [Kod]
18. **Eski tarayıcılar için ek kod:** 14 KB; desteklenen tarayıcı listesi
    güncellenirse gerekmez. [Kod]
19. **Sayfanın kodunu çalıştırma süresi:** anasayfada telefonda 1,9 sn;
    kodun ölçü okuyup sayfayı yeniden düzenlettiği yerler (zorunlu
    yeniden düzenleme) var (7. maddeyle birlikte). [Kod]
20. **Erişilebilirlik:**
    - Renk kontrastı her sayfada yetersiz (ör. küçük kırmızı ve gri
      yazılar): renkler tasarım kararıdır, sahibine sorulur.
    - Adı olmayan düğme (ürün sayfasında sağ alttaki yuvarlak düğme);
      görünen yazıyla adı uyuşmayan düğmeler (arama düğmesi, tanıtım
      sekmeleri); başlık sırası atlanıyor (kategori, blog, bayi
      sayfaları); anasayfadaki video noktaları dokunmak için çok küçük.
      [Kod]
    - Genel erişilebilirlik işleri: [Erişilebilirlik](#erişilebilirlik--önerilen-zorunlu-değil).

**Dokunulmayanlar:** React ve Next.js çekirdeği (~115 KB) kaçınılmaz.
Demo modundaki örnek veri (~47 KB) canlıda (veritabanı modu) tarayıcıya
gitmez. Gerçek üye ve sipariş verisi hiçbir zaman tarayıcı paketine
girmemeli.

## Güvenlik başlıkları — canlıya çıkarken

Başlıklar `apps/zenweld-web/next.config.mjs`'de; ne yaptıkları
[SUNUCU.md](SUNUCU.md) › 3 › Güvenlik başlıkları'nda.

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
   gerekir; bu da sayfaların her istekte sunucuda üretilmesi demektir.
   Barındırma kararıyla birlikte değerlendirilmeli.
3. **Görsel adresleri:** Politika her `https` adresinden görsel yüklemeye
   izin veriyor, çünkü panelde herhangi bir görsel adresi girilebiliyor.
   Görseller dosya deposuna taşınınca ([Görseller ve yüklenen
   dosyalar](#görseller-ve-yüklenen-dosyalar)) izin yalnızca o depoya ve
   gerçekten kullanılan dış adreslere (harita döşemeleri vb.) daraltılmalı;
   panelde dış görsel adresi girme kaldırılmalı ya da yalnızca bu adreslere
   izin vermeli.

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

## Formlar — güvenlik

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
3. **Bildirim ucu:** Kayıt tutan formlar (teklif, servis talebi, garanti,
   yorum, üyelik, sipariş, iade) veritabanı modunda sunucuda veritabanına
   yazılıyor ve e-posta bu kayıttan gidiyor. Kalan: canlıda `/api/bildirim`
   yalnızca iletişim formunu ve üyelik bildirimini kabul etmeli; bugün bu uca sahte bir bildirim (ör. "yeni
   sipariş") de gönderilebilir. Sipariş e-postası ödeme kuruluşunun
   onayından sonra gönderilmeli.
4. Veritabanı modunda formlar veritabanına yazıldığı için 1 ve 2 canlıdan
   önce şarttır (KARARLAR K-98); kupon deneme ucu (`/api/siparis/kupon`;
   ör. dakikada 10 yanlış kod) ve garanti sorgulama (`/api/formlar/garanti`)
   da istek sınırına alınmalı. Yorum formu (`/api/formlar/yorum`) dosyaları
   dosya deposuna yazdığı için (K-128) istek sınırı ve bot koruması onda
   da şart: yoksa depo dosyayla doldurulabilir.

## Next.js 16

2 Kasım 2026'da Next.js 16.4.4 ve React 19.3'e geçildi (KARARLAR K-87).

- **Güvenlik taraması (2026-11-02):** `npm audit --omit=dev` (siteye giden
  kütüphaneler) 0 açık. Tamamı 20 orta düzey uyarı, hepsi geliştirme
  araçlarında: kod denetimi (ESLint) zincirindeki `minimatch` ve
  `drizzle-kit`'in içindeki eski `esbuild`. İkisi de yalnızca
  geliştiricinin bilgisayarında çalışır, siteye ve sunucuya girmez,
  dışarıdan veri almaz. Düzeltilmiş sürümleri çıkınca `npm update` ile
  alınır; canlıdan önce tarama tekrarlanmalı.
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
  birkaç görünüm ayarı. Bu bileşenler `useSyncExternalStore` ya da sunucu
  verisiyle yeniden yazılınca kural yeniden açılır.

## Kod incelemesi bulguları

Ayrıntılı inceleme sohbette yapıldı; düzeltme zamanı ayrıca
kararlaştırılacak. Form uçlarındaki istek sınırı ve bot koruması:
[Formlar — güvenlik](#formlar--güvenlik).

1. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
2. 10 dosyada hâlâ Lorem ipsum yer tutucu metin var: anasayfa, ürün
   sayfası, blog yazısı sayfası, Teklif Al formu, Adreslerim ve örnek
   veriler (içerik, ürün, sipariş, üye, öne çıkanlar)
3. Otomatik kontrol (CI) yok; iş kuralları testleri (`npm test`) ve
   tarayıcı testleri (`npm run test:e2e`) var, elle çalıştırılıyor
   (KARARLAR K-67)

## Online satış — canlıya çıkmadan önce

Veritabanı modunda sipariş sunucuda kaydediliyor; tutar, kupon ve stok
sunucuda yeniden hesaplanıyor ([SUNUCU.md](SUNUCU.md) › 8); ödeme
temsili. Canlı için:

1. **Ödeme kuruluşu** (iyzico, PayTR veya bankanın sanal POS'u): 3D Secure,
   kartın BIN'ine göre gerçek taksit oranları, iade/iptal. Kart bilgisi hiçbir
   zaman bizim sunucumuza gelmemeli (kuruluşun ödeme formu kullanılmalı).
   Mağaza Ayarları › Kargo ve Ödeme'deki banka POS'ları gerçek sanal
   POS'larla eşleştirilmeli; POS'ların API anahtarları ve şifreleri yalnızca
   sunucuda saklanmalı, panelde/tarayıcıda tutulmamalı. Kuruluşun ödeme/3D
   Secure sayfasının adresi sitenin güvenlik politikasına (CSP) eklenmeli
   (`frame-src` ya da `form-action`). Çekilecek tutar sunucunun hesabından
   alınır. Ayrıntılı liste: [SUNUCU.md](SUNUCU.md) › Kartla ödeme › Canlı
   için gerekenler.
2. **Hukuk metinleri**: Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi,
   İade/Cayma koşulları — şu anki metinler taslak, hukuk danışmanı yazmalı.
   Kurumsal alıcılara da 14 gün iade hakkı tanınıyor (K-65); metinler buna
   göre yazılmalı ([İade talebi](#i̇ade-talebi) 1).
3. **ETBİS kaydı** (Ticaret Bakanlığı e-ticaret bilgi sistemi) yapılmalı ve
   satıcının MERSİS numarası panelden (Mağaza Ayarları › Şirket ve
   İletişim) girilmeli; sözleşmelerdeki alan hazır (K-105).
4. **e-Arşiv / e-Fatura** entegrasyonu (muhasebe yazılımı veya entegratör).
5. **Müşteriye e-posta bildirimleri**: sipariş onayı + sözleşme kopyası
   (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi. (Zenweld'e
   "yeni sipariş" e-postasının kodu hazır; Resend kurulmadığı için bugün
   hiçbir e-posta gitmiyor, 6. madde.)
6. **Form e-postaları için Resend kurulumu**: sunucuda `RESEND_API_KEY`
   tanımlanmalı ve `zenweld.com` Resend'de doğrulanmalı (gönderici
   varsayılanı info@zenweld.com, K-116). Anahtar tanımlı değilse canlıda
   e-posta formları (iletişim, bayilik) veritabanı kaydı da yoksa
   ziyaretçiye hata gösterir.
7. **Zamanlanmış iş**: süresi dolan havale siparişlerini iptal eden günlük iş
   (bugün sipariş sayfaları açılınca yapılıyor; veritabanı modunda
   siparişler okunurken sunucuda, `packages/db/src/orders.ts` ›
   `cancelExpiredTransfers`; günlük iş aynı fonksiyonu çağırabilir; kupon
   hakkı da aynı işlemde geri verilir).
8. **Kargo entegrasyonu** (isteğe bağlı): takip numarasından takip
   bağlantısı hazır (K-105): her firmaya takip sayfasının adresi girilir,
   müşteri ve panel sipariş detayında bağlantı çıkar. Gerçek takip
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
9. **Gerçek kargo ücreti, vade farkı oranları ve IBAN'lar** Mağaza Ayarları'na
   girilmeli (şu an örnek değerler).
10. **Ziyaretçi verileri** (ziyaret sayısı, ziyaretten siparişe dönüşüm,
    sepette bırakılan ürünler) için Google Analytics vb. kurulmalı; çerez
    onayına bağlı yüklenmeli.

## Zenweld depo stoğu (SAP)

Sahibinin kararı (KARARLAR K-82, K-84): Zenweld deposunun stoğu SAP'tan
okunur; stokta olmayan ürün sepete eklenmez; site siparişleri SAP'a satış
siparişi olarak yazılır. Okuma işi ve sipariş aktarım sırası hazır, bugün
deneme dosyalarıyla çalışıyor ([SUNUCU.md](SUNUCU.md) › 11).

**SAP Business One'da stok nasıl okunur:**

- **Stok nerede durur:** SAP B1 stoğu kendi veritabanında (SAP HANA ya da SQL Server) kalem ve depo başına tutar. Kullanılabilir stok = depodaki − siparişe ayrılmış. SAP ekibinin hazırlayacağı görünüm (`AVAILABLE_STOCK`) bu hesabı yapıp kalem kodu ve miktarı verir.
- **Okuma yolu (iki seçenek):**
  - **Service Layer (önerilen):** SAP B1'in resmi web servisi (HTTPS, kullanıcı adı ve şifre). Siparişleri SAP'a yazmak için de bu kullanılacağı için tek bağlantı iki işi görür.
  - **Salt okunur veritabanı kullanıcısı:** Görünüme doğrudan bağlanılır. Daha basit; ama sunucudan SAP veritabanına ağ erişimi (VPN ya da güvenlik duvarı izni) gerekir.
- **Sipariş:** Service Layer üzerinden satış siparişi oluşturulur (müşteri kartı; satırlarda kalem kodu, adet, fiyat, depo).

**Kalanlar** (SAP ekibine sorulacaklar: [3](#3-şirketten-öğrenilecekler-kişiye-göre) › SAP danışmanı):

1. **Stok:** SAP bilgileri gelince yalnızca SAP'a bağlanan küçük kaynak
   parçası yazılır; okuma kuralları ve yazma değişmez.
2. **Sipariş:** SAP'ın sipariş API'si (ör. `SALES_ORDER`) bilgileri gelince
   SAP'a yazan aktarıcı parça (siparişi SAP'ın biçimine çevirir; geçici
   hata ile kalıcı hatayı ayırır). Karar gerekiyor: her web müşterisi SAP'ta
   ayrı cari mi, yoksa tek bir "web satış" carisi mi?
3. **Zamanlayıcı:** iki işin canlı sunucuda kurulması (stok 15 dakikada bir,
   sipariş birkaç dakikada bir; [SUNUCU.md](SUNUCU.md) › 3).
4. **İptal ve iade:** SAP'a aktarılmış sipariş sitede iptal edilirse ya da
   iade edilirse SAP'a bildirilmesi (bugün SAP'ta elle yapılır).
5. İstenirse panelde sırada bekleyen ve başarısız sipariş sayısı
   ([Bağlantıların durumu](#bağlantıların-durumu-panelde--öneri)).

## Kuponlar

Kupon özelliği sitede ve panelde var (KARARLAR K-85,
[IS-KURALLARI.md › 21](IS-KURALLARI.md#21-kuponlar)); veritabanı modunda
indirim, kullanım sınırı ve iptal sunucuda ([SUNUCU.md](SUNUCU.md) › 8). Kalanlar:

1. **Kaba deneme:** Sepette art arda yanlış kod denemesi sınırlanır (ör.
   dakikada 10; [Formlar — güvenlik](#formlar--güvenlik) 4).
2. **Kişiye özel kupon:** Üyenin e-postası sunucudaki oturumdan alınır;
   üye ileride e-postasını değiştirebilecekse yeni e-posta doğrulanmadan
   kişiye özel kupon kullanılamamalı. İsteğe bağlı: Hesabım'da "Kuponlarım"
   (e-postaya tanımlı kuponlar).

## İade talebi

1. **Yasal metinler kurumsal alıcıya göre yazılacak:** İade talebi bireysel
   ve kurumsal bütün üyelere açık (KARARLAR K-65). Bugünkü Ön Bilgilendirme
   Formu'ndaki "Kurumsal alıcılar" paragrafı ("ticari amaçla alan alıcı
   tüketici sayılmaz; cayma hakkı ve tüketici mevzuatına ilişkin hükümler
   uygulanmayabilir") bununla çelişiyor. Hukukçu metinleri yazarken
   kurumsal alıcılara tanınan 14 günlük iade hakkını işlemeli ("Online
   satış" 2). Metinler panelden (Yasal Metinler) değiştirilir.
2. **Ürünün geri gönderilmesi:** Müşteriye kargo kodu ya da gönderim adresi
   verilmesi, ürün depoya ulaşınca kontrol edilmesi süreci tanımlanmalı.
3. **Para iadesi:** Ödeme kuruluşunun iade işlemi bağlanırsa onaylanan
   talepten iade başlatılabilir ([SUNUCU.md](SUNUCU.md) ›
   Kartla ödeme 7).
4. **Süreç şirketle konuşulacak (KARARLAR K-105, 2026-11-05):** Bugünkü
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

## Müşterinin siparişi iptal etmesi — ileride düşünülecek

Bugün müşteri siparişini sitede iptal edemez; iptali yönetici panelden
yapar (KARARLAR K-27'deki eski cümle 2026-10-22'de çıkarıldı). Yapılırsa
karar verilecekler:

- Hangi durumlarda iptal edilebilir (ör. yalnızca Ödeme Bekleniyor ve
  Hazırlanıyor; kargoya verilen sipariş iptal edilemez).
- Kartla ödenmiş siparişte para iadesi K-27'ye göre banka ya da ödeme
  kuruluşu üzerinden ayrıca yapılır; müşteriye bunun söylenmesi.
- Zenweld'e bildirim (e-posta) ve panelde iptal nedeninin görünmesi.

## Müşteriye e-posta bildirimleri (sipariş dışı)

Bugün müşteriye site kendiliğinden şifre sıfırlama ve "servis talebiniz
alındı" e-postası gönderir (veritabanı modunda, Resend kurulunca; K-117);
formlar info@zenweld.com'a e-posta gönderiyor. Yönetici panelden (E-posta, Servis Talepleri, Mesajlar)
müşteriye elle e-posta yazabilir (K-116).
Sipariş bildirimleri "Online satış" 5'te. Ayrıca:

1. Teklif talebinin durumu panelde değişince (İnceleniyor, Teklif Gönderildi…).
2. Servis talebinin durumu değişince.
3. Garanti kaydı alındığında ve panelde bitiş tarihi değişince.
4. İade talebinin durumu panelde değişince (İnceleniyor, Onaylandı,
   Reddedildi).

Hangi bildirimlerin gönderileceği ve metinleri kararlaştırılmalı. Yeni tür
eklenince [VERITABANI.md](VERITABANI.md) › `email_settings` › E-posta
türleri listesine ve panelin tür sekmelerine (`EMAIL_KINDS`) eklenir.

### Servis talebini en yakın yetkili servise yönlendirme

Uygulandı (KARARLAR K-117; [IS-KURALLARI.md › Servis talebi](IS-KURALLARI.md#9-servis-talebi)):
müşteriye "talebiniz alındı" e-postası, panelde en yakın yetkili servis
önerisi, servise iki hazır e-posta (talep bildirimi; servis üstlenince
müşteri bilgileri), Hesabım › Servis Taleplerim. Kalanlar:

1. **E-posta metinleri:** Müşteriye ve servise giden metinler taslaktır
   (`packages/data/src/service.ts`); sahibiyle birlikte son hali verilir.
   İmzaya destek e-postası ve telefonu eklenebilir.
2. **Yetkili servislerin e-posta adresleri:** Örnek veride
   `servis@<bayi>.example.com`; gerçek adresler Bayiler'den girilir.
3. **Servis noktalarının konumu:** Öneri il merkezinden servisin haritadaki
   konumuna kuş uçuşu uzaklıkla yapılır; bayilerin enlem/boylamı gerçek
   adreslerine göre girilmelidir. İlçe merkezleri listede yok; aynı ildeki
   servisler arasında uzaklık il merkezine göre ölçülür.
4. **Servis durumu değişince müşteriye e-posta** (yukarıda 2): bugün
   yalnızca talep alınınca e-posta gider. Durum değişince (ör.
   Tamamlandı) e-posta gidip gitmeyeceği sahibine sorulacak; servis
   bilgisi müşteriye gönderilmez (K-117).

## Bayi ve satıcı stokları

Panel akışı hazır; veritabanı modunda stok satırları, dosya yüklemeleri,
kod eşleştirmeleri ve geri alma veritabanında (panel 4. alan, K-103;
[SUNUCU.md](SUNUCU.md) › Stok Matrisi). Dosya biçimi: [STOK.md](STOK.md).

1. **Yüklenen orijinal dosyalar** denetim için dosya deposunda
   saklanmalı (bugün yalnızca okunan satırlar ve özet saklanıyor).
2. **Günlük yenileme:** Dosya uygulama, geri alma ve elle düzeltmeden sonra
   ürün sayfalarının stok verisi hemen yenilenir (`refreshSite(["stok"])`).
   "Geçerlilik süresi" zamana bağlı olduğu için sayfalar ayrıca günde en az
   bir kez yenilenmeli. Yük artarsa yenileme yalnızca etkilenen ürünlere
   daraltılabilir ([STOK.md](STOK.md)).

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
  ([SUNUCU.md](SUNUCU.md) › 2).

## Üyelik, oturum ve şifre

Veritabanı modunda üyelik, panel girişi ve şifre sıfırlama sunucuda
([SUNUCU.md](SUNUCU.md) › 7). Hesap silinince kalan veriler:
[Hesap silme](#hesap-silme--açık-konular-kvkk-ve-yasal-saklama).

1. **Şifre sıfırlama e-postası — konuşulacak (KARARLAR K-105):** Bugünkü
   düzen (yalnızca veritabanı modunda; demo sitede e-posta gitmez):
   - Müşteri Şifremi Unuttum'a e-postasını yazar; hesap olsa da olmasa da
     aynı mesaj görünür.
   - Hesap varsa e-posta servisi (Resend) üzerinden müşterinin adresine
     "Zenweld şifre sıfırlama" konulu düz metin e-posta gider. Gönderen
     Panel › E-posta › Şifre Sıfırlama › Adresler'deki adrestir (yoksa
     info@zenweld.com; K-116). Metin kodda sabittir
     (`packages/i18n/src/tr.ts`).
   - Bağlantı 1 saat geçerli ve tek kullanımlık; aynı hesap için 15
     dakikada bir. Gönderim `email_log`'a bağlantısız yazılır.
   - E-posta servisi kurulmadığı için bugün hiçbir e-posta gitmez.

   Konuşulacaklar: gönderen adres ve adı (ör. "Zenweld
   <noreply@zenweld.com>"), e-postanın metni ve görünümü (logo, düz metin
   mi), metnin panelden değişip değişmeyeceği, bağlantı süresi, gönderen
   alan adının doğrulanması (SPF/DKIM; BT ile).
2. **Yöneticinin kendi şifresini panelden değiştirmesi:** Bugün yönetici
   şifresi yalnızca sunucuda `npm run yonetici:olustur` ile değişir. Panelde
   "Şifremi değiştir" eklenecek; şimdi yapılmıyor (KARARLAR K-105).

## Hesap silme — açık konular (KVKK ve yasal saklama)

Bugün üye Hesabım › Profil › **Hesabımı Sil**'den hesabını silebiliyor
(seçenek 2a, KARARLAR K-68): hesap ve adresleri siliniyor, diğer kayıtları
kalıyor (panelden silmeyle aynı). Önerilen diğer yol (2b) aşağıda 10'da. Bu
kural demoda yeterli; canlıya çıkmadan şunlar hukukçu ve mali müşavirle
netleşmeli:

1. **Yasal saklama süresi:** Sipariş ve fatura kayıtları vergi ve ticaret
   mevzuatı gereği yıllarca saklanmalı (süreler mali müşavirle
   netleşmeli). KVKK'ya göre bu süre boyunca yalnızca gereken bilgi tutulur;
   süre dolunca silinir ya da anonimleştirilir. Sitedeki "Kişisel Veri
   Saklama ve İmha Politikası" metni buna göre yazılmalı. Cevaba göre
   [VERITABANI.md](VERITABANI.md)'ye saklama süreleri ve kendiliğinden silme
   eklenir (VERITABANI › 13).
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
9. **İz kaydı ve bildirim:** Üyenin kendi hesabını silmesi hiçbir yerde
   kayıt bırakmıyor ve Zenweld'e bildirim gitmiyor (paneldeki silme
   veritabanı modunda işlem kaydına yazılıyor). KVKK başvurularına yanıt
   verebilmek için kayıt tutulmalı.
10. **KVKK başvuru formu (2b) — ileride düşünülecek:** 2a (Hesabımı Sil)
    seçildi; 2b ileride düşünülecek (sahibin kararı, 2026-10-27).
    - **Nedir:** Hesabım'da "Verilerimle ilgili başvuru" formu. Üye başvuru
      gönderir, başvuru info@zenweld.com'a gider, gereğini yönetici yapar.
    - **2a'dan farkı:** Silmenin yanında KVKK'daki diğer hakları da (verilerini
      öğrenme, düzeltme, itiraz) kapsar; neyin silinip neyin saklanacağına
      (1–8) bir insan başvuru başına karar verir. 2a ile birlikte
      kullanılabilir; birbirinin yerine geçmez.
    - **Dikkat:** Başvurulara en geç 30 gün içinde yanıt verilmeli. Form
      yapılana kadar başvuru yolu (e-posta ya da yazılı) KVKK Aydınlatma
      Metni'nde yazmalı.

## E-posta ve posta kutusu — Panel › E-posta

Panel › E-posta hazır (K-116): türe göre adresler, metniyle yazışmalar,
panelden yazma ve yanıtlama, posta kutusundan gelen yanıtlar. Kalanlar:

1. **Posta kutusunun bağlanması:** info@zenweld.com'un sağlayıcısı BT'ye
   sorulacak ([3 › BT](#bt-bilgi-i̇şlem) › E-posta). Hosting e-postası ya
   da Google Workspace (uygulama şifresiyle) ise hazır IMAP parçası
   yeter: `IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD` sunucuya girilir.
   Microsoft 365 ise Microsoft Graph ile okuyan parça yazılır
   (`packages/db/src/mailbox.ts` › `MailboxSource`). Zamanlayıcıya
   `/api/posta/oku` eklenir (5 dakikada bir).
2. **Canlıda ilk e-postada denetlenecek:** Gönderilen e-postanın
   Message-ID'si alıcıda sitenin verdiği değer mi (Resend değiştiriyor
   mu)? Değiştiriyorsa yanıtlar yine konu ve kayıt numarasıyla eşleşir;
   yalnızca konusu değiştirilerek yazılan ve kayıt numarası taşımayan
   yanıt panele gelmez. Gerekirse Resend'in gönderdiği Message-ID
   okunup saklanır. [Kod]
3. **E-posta metinleri:** Müşteriye ve servislere gidecek e-postaların
   metinleri taslaktır; sahibiyle yazılacak ([Servis talebini en yakın yetkili servise yönlendirme](#servis-talebini-en-yakın-yetkili-servise-yönlendirme) 1).
4. **Ekler:** Gelen e-postanın ekleri bugün posta kutusunda kalır; panelde
   yalnızca adları görünür. İstenirse ekler dosya deposuna alınır;
   panelden ek gönderme de istenirse eklenir. [Karar]
5. **Saklama süresi:** yazışmalar metniyle saklanıyor; KVKK kararıyla
   ([3 › Hukuk](#hukuk-danışmanı--kvkk)) saklama süresi ve kendiliğinden
   silme eklenir.

## Bülten ve İYS

Alt bilgideki bülten kaydı bugün hiçbir yere gönderilmiyor ve saklanmıyor.
Üye olurken işaretlenen "haber ve kampanya e-postaları" izni yalnızca üye
kaydında duruyor (`newsletter` alanı). Hangi bülten servisinin kullanılacağı
karar bekliyor ([3](#3-şirketten-öğrenilecekler-kişiye-göre) › Pazarlama).

1. Servis seçilince bülten kayıtları ve üyelerin izinleri bu servise
   gönderilmeli.
2. Ticari ileti izinleri İYS'ye (İleti Yönetim Sistemi) bildirilmeli.
3. Her e-postada abonelikten çıkma bağlantısı olmalı; çıkış İYS'ye de
   yansımalı.

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

## Satıcı bilgileri sitede (ETBİS, unvan, MERSİS)

Unvan, ofis adresleri, telefonlar, e-posta, sosyal medya ve MERSİS numarası
panelden girilir (Mağaza Ayarları › Şirket ve İletişim, KARARLAR K-105);
MERSİS sözleşmelerin Satıcı bölümüne yazılır. Bugün alt bilgide adres,
telefon ve e-posta var; unvan İletişim sayfasındaki merkez kartında;
sözleşmelerdeki MERSİS alanı boş ("[—]"). Kalanlar:

- Gerçek MERSİS numarası girilmeli.
- ETBİS kaydından sonra Bakanlığın verdiği doğrulama kodu (QR/logo) sitede
  gösterilmeli.
- Unvan ve MERSİS'in alt bilgide de gösterilip gösterilmeyeceği ve hangi
  bilgilerin zorunlu olduğu hukuk danışmanıyla teyit edilmeli (bkz.
  [Online satış](#online-satış--canlıya-çıkmadan-önce) 3).

## Gerçek fotoğraflar — tam liste

Sitede gerçek fotoğraf bekleyen bütün yerler (2026-11-25, koda bakılarak).
Sahibi fotoğrafları hangi yere ait olduklarını yazarak gönderir.

**Nasıl yerleşir:** Canlıdan önce gelen fotoğraf sitenin dosyalarına
konur, web için küçültülür (WebP), dosya adı ve alt metni verilip kayda
bağlanır; canlıya yüklemede (`db:yukle`) dosya deposuna kopyalanır.
Canlıdan sonra gelen fotoğraf panelden yüklenir (doğrudan dosya deposuna
gider); örnek veriye ekleyip `db:yukle guncelle` ile yüklemek paneldeki
değişikliklerin üzerine yazar. Yüklenen fotoğraflar Google'a da gider.

| Yer | Bugün | Kaç tane | Panelde | Ayrıntı |
|---|---|---|---|---|
| Ürün fotoğrafları | 10 üründe kategori çizimi, Force'un 5 ürününde ortak geçici fotoğraf; 4 üründe bir soğutma hali eksik | 15 ürün + 4 soğutma hali | Ürünler › Görseller | [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler) |
| Anasayfa tanıtımı: atölye fotoğrafı | Zenweld'in değil (sahibi, 2026-11-25); değişecek | 1 | Anasayfa Tanıtım | [Anasayfa](#anasayfa--sahibinden-gelecekler-ve-sonraki-işler) |
| Blog kapakları | Kapak yok (Unsplash kaldırıldı); markalı yer tutucu | 6 | Blog | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) 4 |
| Etkinlik fotoğrafları | Galeri boş (Unsplash kaldırıldı): Big 5 Global 2025, International Hardware Riyadh 2025, WIN EURASIA 2025 ve 2024, İmatech 2025 ve 2024, İstanbul Hırdavat 2024, Konya Makine 2024 | 8 etkinlik | Etkinlikler | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) 4 |
| Hakkımızda üst görseli | Yok (Unsplash kaldırıldı) | 1 | Hakkımızda | [Görseller ve yüklenen dosyalar](#görseller-ve-yüklenen-dosyalar) 4 |
| Satış temsilcileri | Fotoğraf yok; adın baş harfleri görünüyor | 11 | Satış Temsilcileri | [Sitenin tasarımı](#sitenin-tasarımı--sahibi-yapacak) |
| Force sayfası | Profesyonel fotoğraf ve videolar bekleniyor | — | Bugün kodda | [Force sayfası](#force-sayfası--panelden-yönetim-fotoğraf-ve-videolar) |
| Ürün videoları | Kendi çekimlerimiz; konular aranan ifadelere göre | — | Videolar | [SEO — A7](#seo--anahtar-kelime-çalışmasından-kalan-işler) |
| Hakkımızda bölüm görselleri (isteğe bağlı) | 4 bölüm görselsiz (Hakkımızda, Vizyonumuz, Misyonumuz, Değerlerimiz) | 4 | Hakkımızda | — |
| Haber galerileri (isteğe bağlı) | Kapaklar eski siteden, gerçek; galeri yalnızca İzmir tesisi haberinde | 3 haber | Haberler | — |
| Kategori ve grup görselleri (isteğe bağlı) | Tasarım çizimleri | 50 kategori, 12 grup | Kategoriler | — |

## Ürün içeriği — gerçek fotoğraflar ve teknik değerler

Ekipmanlar'daki 35 ürün sahibinin listesinden (2026-10-27) girildi: ad, ürün
kodu (SAP kodu), alt grup, garanti ve seçenekler gerçektir (KARARLAR K-71,
K-72). Aşağıdakiler gerçekleri gelince değiştirilmeli: panelde Ürünler ›
ürün; örnek veride `packages/data/src/seed/products.seed.ts` ("ORNEK", "TEMSILI" ve
"DOGRULANMALI" notları) (KARARLAR K-73).

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
   öne çıkan özellikler (seçenekler ve garanti). Kullanım kılavuzu
   bağlantısı Force serisi dahil 40 ürünün hepsinde `#` (hiçbir yere
   gitmiyor). Amper, devrede kalma, ağırlık gibi
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
5. **Diğer örnekler:** Kampanyalar ve örnek yorumlar örnek veridir.
   Güvenlik, Aksesuarlar ve Dolgu Metalleri'nde bugün ürün yok (örnek
   ürünler silindi, KARARLAR K-78).
6. **Geçici kodlar:** SAP kodu verilmeyen 5 ürünün kodu geçicidir (KARARLAR
   K-75): ForceArc 250 (`ZW-GECICI-FORCEARC250`), ForceArc 280, ForceMIG 125,
   ForceMIG 185 MP, ForceMIG 205 DP. SAP kodları açılınca panelden (Ürünler ›
   ürün › Ürün Kodu) değiştirilmeli; bayi ve satıcı stok dosyaları kodla
   eşleştiği için bundan önce stok dosyalarında bu ürünler eşleşmez.
7. **Plazma ürünlerinde "kesme" kelimesi:** Ad ve başlıklarda "kesim"
   (KARARLAR K-118), açıklamalarda bir kez "kesme" geçer; Google'a iki
   yazım da gider ([SEO.md](SEO.md) › 2). Gerçek ürün açıklamaları ve
   Tanıtım Metinleri girilirken yapılır:
   - Dört plazma makinesinin (Multicut 105 CNC, Multicut 85 CNC, Multicut
     60 S, ForceCut 45) açıklamasının ilk paragrafında ve Plazma Kesim
     Makineleri kategorisinin Tanıtım Metni'nde "plazma kesme makinesi".
   - Plazma Kesim Aksesuarları grubunun, plazma aksesuar kategorilerinin
     (Plazma Torçları, Torç Sarf Malzemeleri, Yedek Parçaları, Aparatları)
     Tanıtım Metni'nde ve plazma aksesuar ürünlerinin açıklamasında
     "plazma kesme torcu / ucu / sarf malzemesi".
   - Ürün adına, sayfa başlığına ve teknik özellikler tablosuna
     yazılmaz; bir sayfada bir kez yeter.
   - Panelde Ürünler › ürün › Açıklama; Kategoriler › Tanıtım Metni.
   - Ürün açıklamasındaki ifadenin sayfada görünmesi için önce
     [SEO](#seo--anahtar-kelime-çalışmasından-kalan-işler) A2'deki kod işi
     gerekir (açıklama bugün sekme açılmadan sayfanın HTML'inde yok).

## Ürün fotoğrafları — eksikler

Ekipmanların gerçek fotoğrafları sahibinden gelir (KARARLAR K-77). Fotoğraf
`apps/zenweld-web/public/images/products/` klasörüne aşağıdaki adla yüklenir;
sonra `.webp` hali üretilir ve ürün örnek veriye bağlanır
(`packages/data/src/seed/products.seed.ts` › `MACHINE_PHOTOS`; bkz.
klasördeki `BURAYA-GORSEL-YUKLEYIN.md`). Fotoğrafı olmayan ürün ve soğutma
hali, alt kategorinin kart çizimini gösterir. Force serisinin 5 ürünü
(ForceArc 250, 280; ForceMIG 125, 185 MP, 205 DP) şimdilik ortak geçici bir
fotoğraf gösterir (`force-serisi-gecici.webp`, KARARLAR K-77 eki);
gerçekleri gelince geçici fotoğraf kaldırılır.

**Çeşit:** 2 = hava ve su soğutmalı hali ayrı fotoğraf; 1 = tek fotoğraf.
Ekipmanların 40 ürününden 21'inin fotoğrafı tam; 15 üründe hiç fotoğraf yok,
4 üründe bir soğutma hali eksik. Sahibi bu fotoğrafları bulamadı; bulununca
yüklenecek (2026-10-28; ForceArc 200, ForceTIG 200, ForceMIG 200 ve ForceCut
45'inki sonradan geldi):

| Kategori | Model | Çeşit | Eksik | Yüklenecek dosya adı |
|---|---|:-:|---|---|
| MMA | Ultimate 255 MMA | 1 | Fotoğraf | `ultimate-255-mma.jpg` |
| MMA | ForceArc 250 MMA | 1 | Fotoğraf | `forcearc-250-mma.jpg` |
| MMA | ForceArc 280 MMA | 1 | Fotoğraf | `forcearc-280-mma.jpg` |
| MMA | ForceArc 400 CEL MMA | 1 | Fotoğraf | `forcearc-400-cel-mma.jpg` |
| TIG | Ultimate 405 THP | 2 | Hava | `ultimate-405-thp-hava-sogutmali.jpg` |
| MIG | Ultimate 505 MTS | 2 | Hava | `ultimate-505-mts-hava-sogutmali.jpg` |
| MIG | Evomig 405 P | 2 | Hava | `evomig-405-p-hava-sogutmali.jpg` |
| MIG | Evomig 555 P | 2 | Hava | `evomig-555-p-hava-sogutmali.jpg` |
| MIG | Evomig 255 P | 1 | Fotoğraf | `evomig-255-p.jpg` |
| Çok Fonksiyonlu | ForceMIG 125 | 1 | Fotoğraf | `forcemig-125.jpg` |
| Çok Fonksiyonlu | ForceMIG 185 MP | 1 | Fotoğraf | `forcemig-185-mp.jpg` |
| Çok Fonksiyonlu | ForceMIG 205 DP | 1 | Fotoğraf | `forcemig-205-dp.jpg` |
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

## Ürün seçenekleri (3 m / 5 m gibi)

Panel, site ve veritabanı hazır: Seçenek Tanımları, kategorinin Seçenekler
sekmesi, ürünün Seçenekler sekmesi (en fazla 3 seçenek, kombinasyonlar),
ürün sayfası, sepet, sipariş ve Teklif Al. Örnek veride 17 makinede var
(Soğutma, Torç Uzunluğu, Ara Paket Uzunluğu, Tepe Güç; uzunluklar temsili).
Tablolar ve kurallar: [VERITABANI.md](VERITABANI.md) › 3 › Seçenekli ürün
(KARARLAR K-70). Kalanlar:

1. **Seçeneksiz ürün de tek varyantla tutulmalı mı (öneri):** E-ticaret
   sistemlerinin ortak yapısında her satılabilir kalem bir varyanttır;
   seçeneksiz ürün de tek bir "varsayılan varyant"la tutulur, böylece
   sepet, sipariş ve stok her zaman varyanta bağlanır. Bugün seçeneksiz
   ürünün kodu ve fiyatı ürün satırındadır (`variant_id` boş). SAP
   eşleşmesi (aşağıda 3) ve stok için yeniden değerlendirilmeli.
2. **Ayrı ürünü seçeneğe dönüştürme ekranı:** Panelde yok. Eklenip
   eklenmeyeceğine gerçek ürünler girilmeye başlanınca karar verilecek.
   Ekran yapılırsa tek adımda: seçeneği eski ürünün koduyla kurar, eski
   linki `/urun/<ürün>?secenek=<varyant>` adresine yönlendirir
   (`redirects.variant_id` hazır; demoda tarayıcı yönlendiriyor,
   `movedProductPath`), stok satırlarını, kod eşleştirmelerini ve yorumları
   taşır, ayrı ürünü kaldırır. Bugün elle yapılırsa eski link 404 verir,
   yorumlar görünmez olur ve stoklar bir sonraki stok dosyasına kadar boş
   kalır.
3. **SAP ve bayi kodları (stok ve sipariş tasarımında karar verilecek):**
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

## Ürün grupları (Kaynak Makineleri, Lazer Makineleri …)

1. Grup ve kategori kartlarındaki görseller şimdilik çizim (illüstrasyon);
   gerçek ürün/uygulama fotoğrafları gelince panelden (Ürünler → Kategoriler →
   Kart Görseli) değiştirilmeli.
2. Grup ve kategorilerin tanıtım metinleri (sayfanın altındaki "… Hakkında")
   ve SEO alanları bugün boş: [SEO — anahtar kelime çalışması](#seo--anahtar-kelime-çalışmasından-kalan-işler) A3.
3. **Lazer Aksesuarları** (Aksesuarlar'ın ilk grubu, KARARLAR K-05 eki): 5
   kategorinin ürünleri sahibinden gelince girilecek; bugün kategoriler
   boş ("Bu kategoriye henüz ürün eklenmedi.").

## Blog yazıları — yayına girmeden önce

Blog yazıları arama motorlarına açık ve site haritasında. Örnek yazıların
gövdesi ve özeti hâlâ yer tutucu metin (Lorem ipsum,
`packages/data/src/seed/content.seed.ts`). Site zenweld.com'da yayına girmeden
önce bu yazılar gerçek metinlerle değiştirilmeli ya da panelden yayından
kaldırılmalı; yoksa Google bu metni Zenweld'in içeriği olarak listeler.

## Teklif Al formu — sorular düzenlenecek

Teklif Al formunun soruları henüz tam doğru değil; sahibi gerçek soruları
gönderecek, form buna göre düzenlenecek (Teklif Al kurumsal müşteriler
içindir, KARARLAR K-25). Yer: `app/(site)/teklif-al/page.tsx`, metinler
`packages/i18n/src/tr.ts` › `quote`.

## Force sayfası — panelden yönetim, fotoğraf ve videolar

Force sayfası (`/force`, KARARLAR K-114) bugün çalışıyor; sonra yapılacaklar:

- [ ] **Panelden yönetim:** Dört makinenin slogan, kısa açıklama, rakamlar
      ve görselleri bugün kodda (`packages/i18n/src/tr.ts` › `forcePage`,
      `apps/zenweld-web/src/lib/force.ts` › `FORCE_SHOWCASE`). Panelde bir
      "Force Sayfası" ekranından değişsin (Anasayfa Tanıtım gibi). [Panel]
- [ ] **Fotoğraf ve videolar:** Sahibi makinelerin profesyonel fotoğraf ve
      videolarını gönderecek; makine bölümlerine galeri ve video eklenecek.
      Bugünkü dört makine görseli sahibinin fotoğraflarından zemini
      kaldırılarak hazırlandı; açılıştaki kaynak ustası Force fuar
      davetiyesindeki karikatürden kesildi (`public/images/force/`). [Karar]
- [ ] **Teknik değerler:** Makine bölümlerindeki rakamlar ve Teknik
      Özellikler tablosu sahibinin Force kataloğundan kodda yazılı
      (K-114); ürün kayıtlarındaki teknik özellikler ayrıdır. Katalog
      değişirse kodda güncellenir.

## Görseller ve yüklenen dosyalar

Veritabanı modunda panelde yüklenen görsel ve belgeler sunucunun dosya
deposuna (`DOSYA_KLASORU`) yazılıyor, kayıtta yalnızca adres (`/dosya/…`)
kalıyor; depo ayarlı değilse adres giriliyor (K-101, K-104, K-108;
[SUNUCU.md › Dosya deposu](SUNUCU.md#dosya-deposu)). Demo modunda yüklenen
görseller kaydın içinde (`data:`), belgeler tarayıcıda; bu görseller canlı
veriye taşınmaz. Canlı ve deneme yüklemesinde (`db:yukle`) ürün, haber,
etkinlik ve anasayfa görselleri dosya deposuna kopyalanır (K-91).

**Sahibin kararı (K-102):** Görsellerin hız, görünürlük ve performans için
iyileştirilmesi ve nasıl tutulacağı sahibi söyleyince ele alınır; dosya
deposu kurulurken, gerçek fotoğraflar gelince ve canlıya hazırlıkta
sahibine hatırlatılır. Kalanlar:

1. **Depo kararı: deponun yeri ve yedeği** sahibi ve BT ile kesinleşir
   ([3](#3-şirketten-öğrenilecekler-kişiye-göre) › BT):
   - **Sunucunun diski:** hazır, ek ücret yok; klasör yedeğe eklenmeli,
     birden fazla sunucuda ortak disk gerekir.
   - **Nesne deposu ve CDN** (S3 uyumlu, ör. Cloudflare R2): dosyalar
     ziyaretçiye en yakın noktadan gider, sunucu yorulmaz. Kendi videolarımız
     (K-125) gelince önerilen budur. Seçilirse onun parçası eklenir
     (`packages/db/src/file-storage.ts`); panel ve site değişmez.
2. **Kullanılmayan dosyaların temizliği:** Kayıttan kaldırılan görselin ya
   da silinen belgenin dosyası depoda kalıyor. Hiçbir kaydın kullanmadığı
   ve belli bir süreden eski dosyaları bulup silen bir iş (önce yalnızca
   listeleyen) yazılabilir.
3. **Web sunucusunun istek sınırı (BT):** Sunucunun önündeki web sunucusu
   (ör. nginx `client_max_body_size`) yorum formundaki dosyalar (~40 MB)
   ve panelden video yükleme (1 GB) için ayarlanmalı
   ([SUNUCU.md › Görseller ve dosyalar](SUNUCU.md#12-görseller-ve-dosyalar)).
4. **Gerçek fotoğraflar (sahibi gönderir):** Unsplash fotoğrafları örnek
   veriden kaldırıldı (6 blog kapağı, 8 etkinliğin galerisindeki 15
   fotoğraf, Hakkımızda'nın üst görseli). Gerçekleri gelecek: blog
   kapakları, etkinlik fotoğrafları (Big 5 Global 2025, International
   Hardware Riyadh 2025, WIN EURASIA 2025 ve 2024, İmatech 2025 ve 2024,
   İstanbul Hırdavat 2024, Konya Makine 2024) ve Hakkımızda görseli.
   - **Canlıdan önce:** Sahibi fotoğrafları gönderir; ürün fotoğraflarındaki
     gibi sitenin dosyalarına konur, web için küçültülür (WebP), adı ve alt
     metni verilip örnek veriye bağlanır. Canlıya yüklemede (`db:yukle`)
     dosya deposuna kopyalanır.
   - **Canlıdan sonra:** Panelden yüklenir (Blog, Etkinlikler, Hakkımızda);
     doğrudan dosya deposuna gider. Örnek veriye eklenip `db:yukle
     guncelle` ile yüklemek paneldeki değişikliklerin üzerine yazar.
   - Hepsi Google'a da gider.

## Video kütüphanesi — kalan adımlar

Video kütüphanesi hazır: YouTube videoları ve kendi videolarımız panelden
(Videolar) eklenir ve ürüne bağlanır; ürün sayfasının galerisinde,
anasayfada (kategori sekmeleriyle) ve Videolar sayfasında (`/videolar`)
görünür, Google'a bildirilir; kendi videolarımız sunucuda web için
hazırlanır ve parça parça sunulur (K-123, K-125). Kalanlar:

1. **Canlı sunucuda video hazırlama aracı (BT):** ffmpeg kurulmalı
   (Ubuntu: `apt install ffmpeg`), geçici klasörde (`/tmp`) en büyük
   videonun birkaç katı ve dosya deposunda videolar için yer olmalı
   ([SUNUCU.md › Video hazırlama](SUNUCU.md#video-hazırlama)). Demo sitede
   (vercel.app) kendi videomuz yüklenemez; yalnızca canlı sunucuda
   (veritabanı modu) çalışır.
2. **Videoların ürünleri:** Bugünkü 5 video Y300 QCW'ye bağlı; yeni
   videoların ürünlerini sahibi gönderecek
   ([Anasayfa](#anasayfa--sahibinden-gelecekler-ve-sonraki-işler) 5).

## SEO alanları ve link yönlendirme

Panelde SEO sekmesi (ürün, blog yazısı, haber, etkinlik, grup, kategori) ve
Sayfa SEO ekranı hazır; veritabanı modunda başlık, açıklama ve `keywords`
tablolardan okunur, panel kaydı hemen görünür (K-88, K-99). Eski linkler
veritabanı modunda sunucuda 301 ile yönlenir (K-120). Kalanlar:

1. **Kampanya başlangıç ve bitişinde ürün sayfası yenilenmeli.** Google'a
   giden fiyat (yapısal veri) sayfa üretilirken yazılır. Kampanya belirlenen
   saatte kendiliğinden başlayıp bittiği için o anda kimse kayıt yapmaz;
   sayfa ya kampanyanın başlangıç/bitiş saatinde zamanlanmış bir işle ya da
   saatte bir yenilenmeli. Veritabanı modunda sayfalar 30 saniyede bir
   yeniden hazırlandığı için bu gecikme bir dakikayı geçmez; süre
   uzatılırsa bu iş gerekir.
2. **Google Search Console:** [SEO — anahtar kelime çalışması](#seo--anahtar-kelime-çalışmasından-kalan-işler)
   C4 ve [SEO.md](SEO.md) › 16 › 10'da.

## SEO — anahtar kelime çalışmasından kalan işler

Anahtar kelime ve rakip analizi (16–17 Kasım 2026), sayfa sayfa öneriler
ve SEO yol haritası [SEO.md](SEO.md)'dedir; ham veriler `docs/seo/analiz-2026-11-17/`.
Sıra: önce teknik işler (B), sonra sayfa sayfa düzenleme (A); kararlar (C)
sahibindedir.

**B — Teknik SEO (kod işi)**

B1 (değişen linklerde sunucuda 301; KARARLAR K-120), B2 (eski
`zenweld.com`'un 85 adresi; K-121, [SEO.md](SEO.md) › 15) ve B3 (yapısal
veri: blog yazısı, ürüne kargo, iade, yıldız, seçenekler, açıklama, site
adı ve etkinlik düzeltmeleri; K-123) ve B4 (uzun listelerin sayfalanması;
K-124) yapıldı.

1. **B5 · Hız:** 2026-11-25 ölçümü yapıldı: anasayfada en büyük içerik
   3,2 sn, sayfa kayması 0,30, kilitlenme 1,1 sn; Force sayfası 3,8 sn.
   Bulgular, Lighthouse denetimi, 20 madde ve ölçüm turları: [Ölçüm](#ölçüm-hız). Tanıtım
   alanı ve bayi haritasına bağlı maddeler, sahibi bunların tasarımını
   yaptıktan sonra; görseller ve sunucu gelince yeniden ölçülür.
2. **B6 · Analiz kodu ve çerez onayı:** Google Analytics 4;
   [Çerezler ve yasal metinler](#çerezler-ve-yasal-metinler). Search
   Console C4'te.
3. **B7 · Sayfa içi teknik denetim (bütün sayfa türleri):** her sayfada tek
   ana başlık (H1) ve içinde ana terim; ara başlık sırası (H2, H3); sayfa
   başlığı (meta title, en çok 60 karakter) ve Google açıklaması (meta
   description, 140–155 karakter) boş ya da tekrar eden sayfa olmaması;
   görsellerin alt metni; paylaşım önizlemesi (Open Graph) ve asıl adres
   (canonical). Denetim tarayıcı testine eklenir; bulunan eksikler
   düzeltilir. Bugün başlık, açıklama, canonical ve paylaşım önizlemesi
   kodda var (K-55); H1 ve ara başlık sırası denetlenmedi. Biçimli
   metinlerde (`packages/ui/src/components/RichText.tsx`) yalnızca `## `
   ara başlığı (H2) yazılabilir; H3 bugün yazılamaz, gerekirse eklenir.

**A — Sayfa sayfa SEO düzenlemesi (anahtar kelime haritasına göre)**

Her sayfa aynı kontrol listesiyle, [SEO.md](SEO.md) › 6'daki anahtar kelime
haritasında o sayfaya verilen hedef terime göre düzenlenir:

- ad ve ana başlık (H1), link (URL);
- sayfa başlığı (meta title) ve Google açıklaması (meta description);
- sayfa metni ve ara başlıkları (`## ` ile H2); ürünlerde teknik özellik
  etiketleri ve öne çıkan bilgiler;
- görsel dosya adı ve alt metni, iç bağlantılar, yapısal veri.

Önce kalıp kararı (A1), sonra sayfa türleri sırayla. Gerçek bilgisi
gelmemiş ürünlerde metinler bilgi gelince yazılır; ad, link ve başlık
kalıbı önceden uygulanabilir. Site yayında olmadığı için link
değişikliği bugün Google'da bir şey kaybettirmez.

1. **A1 · Ad, başlık ve link kalıbı** (karar C2): ürün ve kategori adları,
   linkler, H1, meta title ve description için tek kalıp; anahtar kelime
   haritasına ve pazarın diline göre seçenekler sahibine örneklerle
   sunulur. Örnek: bugünkü "Ultimate 251 THP TIG Argon Kaynak Makinesi"
   mi, halk arası adın önde olduğu ve aranan amperin geçtiği "Ultimate 251
   THP Argon (TIG) Kaynak Makinesi 250 A" gibi bir kalıp mı? Linkinde eski
   yazım kalan 5 sayfa (`mma-ortulu-elektrod-…`, `tungsten-elektrodlar`,
   `elektrod-pense-ve-kitleri`, `karbon-kesme-elektrod-…`,
   `plazma-kesme-aksesuarlari`) bu adımda düzelir.
2. **A2 · Ürün sayfaları (bugün 40 makine; yalnızca Ekipmanlar'da ürün
   var):** Önce kod işi: ürün sayfasında uzun açıklama bugün düz metin
   basılıyor (`apps/zenweld-web/src/app/(site)/urun/[slug]/ProductPageClient.tsx`
   › `<p>{product.description}</p>`; `##`, madde ve kalın çalışmıyor) ve
   varsayılan sekme Teknik Özellikler olduğu için Açıklama sekmesine
   tıklanmadan sayfanın HTML'inde hiç yok (yalnızca yapısal veride gidiyor,
   K-123). Açıklama biçimli gösterilmeli (Tanıtım Metni gibi) ve sekme
   kapalıyken de sayfanın HTML'inde bulunmalı. [Kod] Sonra: kalıba göre ad,
   link, H1, meta title ve description; teknik özellik etiketleri ve
   birimleri; öne çıkan 3 madde; kısa ve uzun açıklama (ara başlıklı,
   [SEO.md](SEO.md) › 10); plazmada "kesme" kuralı
   ([Ürün içeriği](#ürün-içeriği--gerçek-fotoğraflar-ve-teknik-değerler)
   7); görsel alt metni; uyumlu torç, sarf ve tel bağlantıları. Ad, link ve
   başlıklar kalıp kararından sonra; metinler gerçek bilgiler gelince.
   Aksesuar, güvenlik ve tel ürünleri girilirken aynı kalıp ve SEO.md › 9
   formülleri (aksesuar: tür + tip + ölçü + uzunluk; tel: sınıf + tür +
   çap + ağırlık).
   **Ürün videolarının başlıkları** (Panel › Videolar › Başlık; K-125):
   ürüne bağlı her videonun başlığı aranan ifadeye göre yazılır (ör.
   "ForceMIG 200 ile 3 mm sacda gazaltı kaynağı"); başlığı boş videolar
   doldurulur. Bugün boş başlıkta ürünün adı kullanılıyor ve aynı ürünün
   bütün videolarında aynı başlık çıkıyor. Başlıklar Google'a gider
   (videolar VideoObject olarak bildiriliyor; [SEO.md](SEO.md) › 10).
3. **A3 · Kategoriler (50) ve gruplar (12):** ad, link, Tanıtım Metni
   (`## ` ara başlıklar H2 olarak basılır; H3 bugün yazılamaz), kısa açıklama, meta title ve description. Sıra: lazer (3),
   diğer makine kategorileri (5; plazmada "kesme" kuralı), güvenlik ve
   dolgu metalleri ("kaynak maskesi", "kaynak teli"), aksesuarlar
   ([SEO.md](SEO.md) › 8–9).
4. **A4 · Ana sayfa, bölüm sayfaları ve Force:** sayfa başlığı, açıklama,
   sayfadaki metin ve bağlantılar ([SEO.md](SEO.md) › 7). Başlık ve
   açıklama panelden (İçerik › Sayfa SEO); bölüm sayfalarında Tanıtım
   Metni alanı yok, görünen açıklama kodda
   (`apps/zenweld-web/src/lib/catalog.ts` › `SECTION_DESCRIPTIONS`); ana
   sayfa ve Force metinleri de kodda (`packages/i18n/src/tr.ts`). Bunlar
   için kod işi gerekir.
5. **A5 · Sabit sayfalar:** Hakkımızda (ürün gamı paragrafı, "Zenweld
   hangi ülkenin markası?" soru-cevabı, "60+ Ürün" sayısı; bugün 40
   makine), bayi ve servis ağı, satış temsilcileri (il adları), teklif,
   servis, garanti, SSS, kaynak rehberi, ürün seçici, MSDS, parti
   sertifikaları, iletişim ([SEO.md](SEO.md) › 11–12). Başlık ve açıklama
   panelden; Hakkımızda, SSS, belge sayfaları ve yasal metinlerin metni
   panelden (K-45), diğer sabit sayfaların metni kodda (`tr.ts`).
6. **A6 · Sitedeki mevcut yazılar:** 6 blog yazısı (metinleri yer
   tutucu), 4 haber, 9 etkinlik, SSS (iki cevap yer tutucu), belge
   sayfaları ve yasal metinler tek tek incelenir: başlık, özet, metin,
   ara başlıklar, SEO alanları, görsel alt metni, iç bağlantılar. Bilinen
   sorunlar: Konya Makine 2024 ve İmatech 2024 etkinliklerinde aynı
   "Zenweld Hakkında" paragrafı (tekrar eden metin).
7. **A7 · Yeni içerik (blog yazıları ve ürün videoları):** [SEO.md](SEO.md)
   › 13'teki 15 konu (önce lazer konuları), ayda 2–4 yazı. Yeni çekilecek
   ürün videolarının konuları da blog takvimi gibi Google'da aranan
   ifadelere göre seçilir (ör. "nasıl kullanılır", "ayarları", sac
   kalınlığına göre kaynak; SEO.md › 13).
8. **A8 · İç bağlantılar:** ürün → uyumlu aksesuar ve tel kategorisi;
   kategori ↔ blog; bağlantı metni hedef sayfanın ana terimi. Bugün
   Tanıtım Metni, blog ve ürün açıklamasında bağlantı yazılamıyor
   (biçimlendirici yalnızca `## `, `- `, `**` tanıyor); önce kod işi
   gerekir: metin biçimlendiricisine bağlantı desteği. [Kod]

**C — Sahibin kararı**

1. **C1 · Anti-spatter (çapak önleyici) satılacak mı?** Sahibi şirkete
   sorup öğrenecek. Eski adresi (`/urunler/kimyasallar/anti-spatter`)
   bugün Aksesuarlar'a yönleniyor; satılırsa ürün eklenir ve
   `apps/zenweld-web/eski-site-yonlendirmeleri.json` ile
   `docs/seo/yonlendirme-listesi.csv`'deki satırı ona çevrilir.
2. **C2 · Ad, başlık ve link kalıbı (A1):** ürün ve kategori adlarında
   halk arası ad mı önde, kısaltma mı ("Argon (TIG)" / "TIG Argon";
   pazar ve bizim kuralımız: halk arası ad önde); ürün adında amper olsun
   mu; linkler adla birlikte değişsin mi (eski yazım kalan 5 link dahil).
   Seçenekler örneklerle sunulacak.
3. **C3 · Ürün gamı fırsatları:** örtülü elektrot, kaynak gözlüğü, kaynak
   masası, şarjlı kaynak makinesi (SEO.md › 14); Jasic lazer kaynak
   (K-74).
4. **C4 · Search Console doğrulaması:** alan adının DNS kaydına kimin
   erişimi var (BT).
5. **C5 · Teslim süresi ve iade kargo ücreti:** sipariş kaç iş gününde
   kargoya verilir, kargo kaç günde ulaşır; cayma iadesinde (ve kusurlu
   üründe) kargo ücretini kim öder? Sahibi öğrenecek; gelince Google'a
   giden ürün bilgisine eklenir (`apps/zenweld-web/src/lib/seo.ts` ›
   `shippingJsonLd`, `RETURN_POLICY`).
6. **C6 · Barkod (GTIN):** ürünlerin barkodu var mı? Varsa Google
   Alışveriş eşleşmesi için ürün bilgisine eklenir (ürüne ve seçeneğe
   "Barkod" alanı gerekir: panel, veri ve veritabanı değişikliği).

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

**Site içi arama (Ara kutusu) — sonra ayarlanacak:** Aramanın çalışma
prensibi ve hangi kelimede hangi sayfanın bulunacağı sahibiyle sonra
belirlenecek. Bugünkü durum
([WEBSITE-KULLANIM.md › Arama](WEBSITE-KULLANIM.md#8-arama);
`apps/zenweld-web/src/lib/search/`):

- Arama tarayıcıda çalışır; ürünler, kategoriler, yazılar (blog, haber,
  etkinlik) ve bazı sabit sayfalar aranır. Ürün adı kategori ve
  açıklamadan önce gelir; yazım hatası ve Türkçe karakter farkı tolere
  edilir; eşanlamlı kelimeler (`synonyms.ts`) aramayı genişletir.
- Sabit sayfalar yalnızca kodda yazılı gizli kelimelerle bulunur
  (`search-client.ts` › `STATIC_PAGES`). Örnek: Teklif Al için "Teklif Al
  kurumsal vadeli çek ödeme"; arama kutusuna "vadeli" ya da "çek" yazılınca
  Teklif Al da çıkar. Bu kelimeler ve eşanlamlılar panelden değişmez.

## Ürün önerileri — ürün sayfasındaki "İlgili Ürünler" yeniden kurgulanacak

Şu anki durum: aynı kategorideki ilk 4 ürün gösteriliyor, sıralama yok. Tek
ürünlü kategoride bölüm hiç çıkmıyor (ör. Y300 QCW Lazer Kaynak Makinesi).
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
     öneri listesi saklanır.
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

## Zenweld – bayi B2B uygulaması

Zenweld ile bayiler arasındaki teklif ve siparişler (bayinin Zenweld'den mal
alması) ana siteden çıkarıldı. Bunlar için ayrı bir B2B uygulaması
geliştirilecek. Bayi hesaplarını kimin açıp yöneteceği de bu uygulamayla
birlikte netleşecek.

## Sitenin tasarımı — sahibi yapacak

Tasarım (renk, yerleşim, yazı tipi, efektler) sahibi tarafından sonra
yapılacak; bugünkü görünüm geçicidir. Tasarım yapılırken:

1. Bütün özellikler korunmalı (davranış: WEBSITE-KULLANIM ve
   ADMIN-KULLANIM). Menü düzeni, sayfalar ve metinler de sahibinin
   isteğiyle değişebilir; bugünkü hepsi örnek (KARARLAR K-102). Değişen
   davranış belgelere ve testlere işlenir.
2. Tasarımdan sonra tarayıcı testleri (`npm run test:e2e`) ve kabul kontrol
   listesi çalıştırılmalı. Testler alanları etiketiyle bulur; etiket
   metinleri değişirse testler de güncellenmeli.
3. Renk karşıtlığı bu aşamada ele alınacak ([Erişilebilirlik](#erişilebilirlik--önerilen-zorunlu-değil) 4).
4. Tasarım öncesi kodun yedeği GitHub'da `yedek/2026-10-22-tasarim-oncesi`
   dalında.
5. **Görsel düzenleyici ve sayfa görselleri** (sahibinin isteği; tasarım
   bitip sayfalardaki fotoğrafların yeri ve sayısı kesinleşince yapılacak):
   - **Görsel düzenleyici:** Paneldeki her görsel alanında (ürünler,
     kategori ve grup kartları, haber/etkinlik/blog kapakları, Hakkımızda,
     satış temsilcisi fotoğrafı) dosya seçilince ya da mevcut görselde
     **Düzenle** denince görsel, sitede görüneceği çerçevenin şeklinde
     (kare, yatay, yuvarlak) önizlenir; fareyle sürüklenir, fare tekerleği,
     kaydırma çubuğu ya da telefonda iki parmakla yakınlaştırılır;
     **Sığdır**, **Doldur**, **Sıfırla**; **Uygula** ile çerçeveye göre
     kırpılıp kaydedilir.
     - Önerilen yol kırparak kaydetmek: kayıtlar ve sitedeki gösterim
       değişmez. Sınırı: kırpılan dış kısım geri gelmez; daha geniş alan
       için görsel yeniden yüklenir. Diğer yol kırpmadan yalnızca konum ve
       yakınlığı saklamak (her zaman geri alınır, ama bütün görsel
       kayıtları ve sitedeki her gösterim değişir); sahibiyle seçilecek.
     - Başka sitedeki görselin adresi girildiyse tarayıcı o görseli
       kırpamayabilir (karşı site izin vermezse); o zaman dosya olarak
       yüklenmesi istenir.
   - **Sayfa görselleri panelden:** Bugün Destek ve Garanti sayfasının üst
     görseli (`components/support/SupportHub.tsx` › `HERO_IMAGE`, geçici:
     Evomig 205 P) kodda sabit. (Anasayfanın tanıtım alanındaki görseller
     panelden değişir: Anasayfa Tanıtım, K-45.)
     Panelde (ör. Görünüm › Sayfa Görselleri) değiştirilebilir olacak;
     önizlemede sayfanın masaüstü ve telefon görünümü birlikte görülecek.
     Tasarımda eklenen diğer sabit görseller de buraya girer. Veritabanında
     yeni bir ayar (`settings` tablosuna yeni anahtar) gerekir.
   - Satış temsilcilerinin fotoğrafı yok (sitede adın baş harfleri
     görünüyor); gerçek fotoğraflar panelden eklenecek.

## Anasayfa — sahibinden gelecekler ve sonraki işler

Anasayfa yeni tasarımla yayında (KARARLAR K-47; [WEBSITE-KULLANIM.md ›
Anasayfa](WEBSITE-KULLANIM.md#3-anasayfa)). Kalanlar:

1. **Kurumsal tanıtım sayfasının başlığı ve kısa metni:** Bugün örnek
   metin var ("Atölyeden sahaya, her kaynakta Zenweld gücü"); sahibi
   panelden girecek (Panel › Anasayfa Tanıtım).
2. **Güven şeridine eklenecek bilgiler** (sahibi bulup gönderecek):
   - kaç yıllık tecrübe
   - satılan makine ya da müşteri sayısı
   - ihracat yapılan ülke sayısı
   - belgeler (CE, ISO 9001)
   - servis yanıt süresi
   - yedek parça bulundurma süresi
3. **Güven şeridindeki sayılar kontrol edilip düzenlenecek:** Şeritteki
   yazılar sabittir, hiçbir veriye bağlı değildir (K-47); bayi sayısı,
   mağaza ayarı ya da ofis değişince kendiliğinden değişmez. Kontrol
   edilecekler: 29+ yetkili bayi ve servis noktası, 25 şehir, 12 taksit,
   ₺5.000 ücretsiz kargo sınırı, 2 ofis (İstanbul · İzmir). Bayi
   bölümündeki "Türkiye genelinde 30'u aşkın yetkili satış ve servis
   noktamız" cümlesi de aynı sayıyla uyumlu olmalı (bugün 29+ ile 30'u
   aşkın farklı). Yer: `packages/i18n/src/tr.ts` › `home.trust.items` ve
   `home.dealerSubtitle`.
4. **Gerçek metinler:** Neden Zenweld? maddelerinin açıklamaları (bugün
   lorem ipsum) sahibiyle yazılacak; tanıtım alanındaki Force Serisi ve
   Jasic Lazer metinleri panelden (Anasayfa Tanıtım) değiştirilir.
5. **Videoların ürünleri:** Bugünkü 5 video Y300 QCW Lazer Kaynak
   Makinesi'ne bağlandı (anasayfada ürün kartıyla yan yana, ürün
   sayfasında değil; K-125). Yeni eklenecek videoların ürünlerini sahibi
   gönderecek; panelden (Videolar) her videoya ürün seçilir.
6. **Tanıtım alanındaki atölye fotoğrafı:** Zenweld'in kendi fotoğrafı
   değil (sahibi, 2026-11-25); gerçeğiyle değişecek
   (`apps/zenweld-web/public/images/hero/kaynak-atolyesi.webp`, Zenweld
   sayfası; panelde Anasayfa Tanıtım). Liste:
   [Gerçek fotoğraflar — tam liste](#gerçek-fotoğraflar--tam-liste).

## Erişilebilirlik — önerilen, zorunlu değil

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
4. Renk karşıtlığı tasarım aşamasında ele alınacak.

## Görsel optimizasyonu — önerilen, zorunlu değil

1. **Görsel optimizasyonu (`next/image`):** Bugün görseller olduğu gibi
   yükleniyor (`ProductImage`, `<img loading="lazy">`). Next.js'in görsel
   bileşeni ekran boyuna uygun küçük sürüm ve WebP/AVIF üretir; sayfa daha
   hızlı açılır, görselin ölçüsü önceden bilindiği için sayfa kayması olmaz
   ("Kod incelemesi bulguları" 1).
   - Demo modunda panelden yüklenen görseller kaydın içinde (`data:`)
     durduğu için bu yoldan geçemez; veritabanı modunda dosya deposundaki
     görseller (`/dosya/…`) geçebilir.
   - `next.config.mjs` içindeki `images.remotePatterns` ve güvenlik
     politikasındaki görsel izni birlikte güncellenmeli.
