# Website Kullanımı — Sitenin Özellikleri

Bu dosya ziyaretçinin ve üyenin sitede gördüğü her sayfayı ve özelliği tarif
eder: sayfada ne olduğu, hangi alanların zorunlu olduğu, hangi mesajların
çıktığı, bir işlem yapılınca ne olduğu. Tasarım (renk, yerleşim) anlatılmaz.

İlgili dosyalar:

- Panelde bu içeriklerin nasıl yönetildiği:
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md)
- Fiyat, KDV, kampanya, taksit, stok ve e-posta kurallarının ayrıntısı:
  [IS-KURALLARI.md](IS-KURALLARI.md)
- Ödeme, e-posta ve harita servisleri: [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)

**Demo notu** ile işaretli yerler bugünkü demonun sınırlarıdır (verinin
tarayıcıda durması gibi); gerçek sistemde farklı çalışacaktır.

---

## İçindekiler

1. [Ortak davranışlar](#1-ortak-davranışlar)
2. [Sayfa çerçevesi: üst menü, alt bilgi, pencereler](#2-sayfa-çerçevesi)
3. [Anasayfa](#3-anasayfa)
4. [Katalog: bölüm, grup ve kategori sayfaları](#4-katalog)
5. [Ürün kartı](#5-ürün-kartı)
6. [Ürün sayfası](#6-ürün-sayfası)
7. [Bayi ve servis bulucu](#7-bayi-ve-servis-bulucu)
8. [Arama](#8-arama)
9. [Ürün Seçici](#9-ürün-seçici)
10. [Sepet](#10-sepet)
11. [Ödeme](#11-ödeme)
12. [Sözleşmeler](#12-sözleşmeler)
13. [Üyelik: giriş, kayıt, şifre, çıkış](#13-üyelik)
14. [Hesabım](#14-hesabım)
15. [Teklif Al](#15-teklif-al)
16. [İletişim, Bayilik Başvurusu, Servis Talebi, Welders Club](#16-formlar)
17. [Garanti](#17-garanti)
18. [Belgeler: MSDS, Kaynak Rehberi, Parti Sertifikaları](#18-belgeler)
19. [Kurumsal sayfalar: Hakkımızda, Satış Temsilcilerimiz, SSS](#19-kurumsal-sayfalar)
20. [Blog, Haberler, Etkinlikler](#20-blog-haberler-etkinlikler)
21. [Yasal metinler](#21-yasal-metinler)
22. [Bulunamayan sayfa (404)](#22-bulunamayan-sayfa-404)
23. [Arama motorları (SEO)](#23-arama-motorları-seo)
24. [Bütün sayfa adresleri](#24-bütün-sayfa-adresleri)
25. [Bilinen durumlar](#25-bilinen-durumlar)

---

## 1. Ortak davranışlar

- **Dil:** Site yalnızca Türkçedir; adreslerde dil öneki yoktur
  (`/urun/...`, `/ekipmanlar/...`).
- **Yayında olmayan içerik görünmez.** Panelde "yayında değil" yapılan ürün,
  blog yazısı, haber ve etkinlik listelerde, aramada, sepette, favorilerde ve
  teklif listesinde görünmez; adresi açılırsa 404 sayfası çıkar.
- **Eski link yönlendirmesi:** Linki panelde değiştirilen ürün, grup,
  kategori, blog yazısı, haber ve etkinliğin eski adresi yeni adrese gider.
  Bir ürünün seçeneğine dönüştürülen eski ürünün adresi o seçenekle açılır
  (ör. `/urun/mig-torcu-mb25-4m` → `/urun/mig-torcu-mb25?secenek=4-m`).
- **Üye bilgileri formlara dolu gelir:** Giriş yapmış üyede Teklif Al,
  Bayilik Başvurusu, Servis Talebi, Garanti Kaydı, ürün değerlendirmesi ve
  ürün destek sohbetinde ad, e-posta, telefon, şehir ve firma bilgileri
  hesaptan doldurulur; değiştirilebilir.
- **KVKK notu:** Kişisel veri alan her formda "Kişisel verileriniz KVKK
  Aydınlatma Metni kapsamında işlenir." yazar; bağlantı `/yasal/kvkk`'ya gider.
- **Yasal bağlantılar yeni sekmede açılır:** Formlardaki yasal metin
  bağlantıları (KVKK, Kullanım Koşulları, Gizlilik, Garanti Koşulları) yeni
  sekmede açılır; doldurulan form kaybolmaz.
- **Bot tuzağı:** E-posta gönderen her formda ziyaretçinin görmediği bir alan
  vardır. Formu otomatik dolduran bot bu alanı da doldurur; o zaman sunucu
  e-posta göndermez ama bota başarılı gibi yanıt verir.
- **Form e-postaları:** Formlar `info@zenweld.com` adresine e-posta gönderir.
  Hangi formun hangi bilgileri gönderdiği: [IS-KURALLARI.md](IS-KURALLARI.md).
  - Kaydı panelde tutulan formlar (sipariş, teklif, servis talebi, garanti,
    değerlendirme, üyelik) e-postanın sonucunu beklemez; kayıt her durumda
    yapılır.
  - Kaydı olmayan formlar (iletişim, bayilik, Welders Club, ürün destek
    sohbeti) e-posta gidemezse ziyaretçiye hata gösterir ve
    `info@zenweld.com`'a doğrudan yazmasını söyler.
- **Tarayıcıda tutulanlar (Demo notu):** Sepet, favoriler, teklif listesi,
  çerez seçimi, karşılama penceresinin görülmesi ve oturum ziyaretçinin
  tarayıcısında tutulur. Bütün site verisi de (ürünler, siparişler, üyeler…)
  şimdilik tarayıcıdadır.

---

## 2. Sayfa çerçevesi

### Üst menü (her sayfada, sayfa kaydırılırken üstte sabit)

| Öğe | Davranış |
|---|---|
| Logo | Anasayfaya gider. |
| **Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri** | Başlığa tıklayınca bölüm sayfası açılır; üzerine gelince mega menü açılır. |
| **Keşfet** | Mega menü: **Kurumsal** (Hakkımızda, Satış Temsilcilerimiz, Bayimiz Olun, İletişim), **Güncel** (Haberler, Etkinlikler, Blog, Welders Club), **Diğer** (Ürün Seçici, Ultimate Kaynak Rehberi, MSDS, Parti Sertifikaları). Her bağlantının kısa açıklaması vardır. |
| **Destek ve Garanti** | Mega menü: **Destek** (Sık Sorulan Sorular, Yetkili Bayi ve Servis Bul, Servis Talebi), **Garanti** (Garanti Kaydı, Garanti Sorgulama, Garanti Koşulları). |
| **Ara** kutusu | Arama penceresini açar. Klavyede **⌘K / Ctrl+K** ile de açılır. |
| Konum simgesi | Yetkili Bayi ve Servis Ağı sayfasına gider. |
| Sepet simgesi | Sepete gider; sepetteki toplam adet rozetle yazar (99'dan fazlaysa "99+"). |
| Hesap simgesi | Girişliyse: ad soyad, e-posta, **Hesabım**, **Siparişlerim**, **Çıkış Yap** (çıkınca anasayfa). Girişsizse: **Giriş Yap**, **Üye Ol**. |

Sayfa değişince açık menüler kapanır.

**Ürün mega menüsü** (bölüm başlığının üzerine gelince):

- Solda bölümün grupları vardır; grup adına tıklayınca grup sayfası açılır.
- Grubun kategorileri, her birinin ürün sayısıyla listelenir.
- Kategorinin üzerine gelince o kategorinin ilk 6 ürünü (görsel, ad, satışta
  öne çıkan 1–2 özellik) ve **Tümünü Gör** görünür. Kategoride 6'dan fazla
  ürün varsa düğme "Tümünü Gör (N)" olur.
- Boş grupta "Bu grupta henüz kategori yok.", boş kategoride "Bu kategoriye
  henüz ürün eklenmedi." yazar.
- Gruplar ve kategoriler panelde verilen sırayla dizilir. Menüdeki ürünler
  kayıt sırasıyla gelir; Sıra numarası menüde kullanılmaz.

**Mobil menü:** Telefonda menü simgesinden yandan açılan çekmecedir. Aynı
menüler açılıp kapanır; bölümlerde "Tümünü Gör" ve tıklanabilir grup
başlıkları vardır.

### Alt bilgi (her sayfada)

- **Altı sütun:** Kurumsal, Güncel, Diğer, Destek, Garanti (üst menüdekiyle
  aynı bağlantılar) ve **Politikalar & Yasal**. Yasal sütundaki adlar panelden
  değişebildiği için kayıtlı başlıklardan okunur; sırası
  [21. bölümdeki](#21-yasal-metinler) gibidir.
- **İletişim:** Logo, İstanbul merkez adresi, telefon (+90 212 549 61 86) ve
  `info@zenweld.com`. Sosyal medya bağlantıları yeni sekmede açılır:
  Instagram, YouTube, LinkedIn, TikTok.
- **Bülten kaydı:**
  - E-posta kutusu, **Kayıt Ol** düğmesi ve "Zenweld'den bülten ve pazarlama
    e-postaları almayı kabul ediyorum" onay kutusu vardır. Kutu boş gelir;
    işaretlenmeden kayıt yapılmaz: "Bülten kaydı için onay kutusunu
    işaretleyin."
  - Gönderince "Teşekkürler! Bültenimize kaydoldunuz." yazar.
  - **Bülten kaydı bugün hiçbir yere gönderilmez ve saklanmaz.** Bilerek
    `info@zenweld.com`'a gönderilmiyor; bir bülten servisi seçilince
    bağlanacak.
- **Telif satırı:** "© <yıl> ZENWELD. Tüm hakları saklıdır."; yıl kendiliğinden
  güncellenir.

### Karşılama penceresi

- **Ne zaman çıkar:** Site ilk açıldığında, yaklaşık yarım saniye sonra.
  Hesabım sayfalarında ve panelde çıkmaz.
- **İçerik:** Kaynakçı animasyonu, logo, "Zenweld'e Hoş Geldiniz" başlığı,
  kısa tanıtım metni ve iki düğme: **Keşfetmeye Başla** (`/ekipmanlar`),
  **Bayi Bul** (bayi haritası).
- **Kapatma:** Kapat düğmesi, Esc tuşu ya da pencere dışına tıklama.
- **Tekrar görünme:** Kapatıldıktan sonra o tarayıcı sekmesi açık kaldıkça
  tekrar çıkmaz; sekme kapanıp yeniden açılırsa yine gösterilir.

### Çerez bandı

- **Ne zaman çıkar:** İlk ziyarette sayfanın altında görünür.
- **Metin:** Tanımlama bilgilerinin kullanımını anlatır. Bağlantı:
  **Çerez Politikası** (yeni sekme).
- **Düğmeler:**
  - **Tümünü Kabul Et**
  - **Tümünü Reddet**
  - **Tanımlama Bilgisi Ayarları:** Şimdilik yalnızca "Çerez tercihleri
    yakında buradan ayarlanabilecek." yazan bir pencere açar.
- **Seçimin saklanması:** Seçim ziyaretçinin tarayıcısına kaydedilir ve aynı
  tarayıcıda bir daha sorulmaz. Başka cihazda, gizli sekmede ya da tarayıcı
  verisi silinince yeniden sorulur.
- **Analiz ve reklam kodları:** Bugün sitede yok. Eklenirse yalnızca
  "Tümünü Kabul Et" seçilmişse yüklenmelidir.

---

## 3. Anasayfa

Yukarıdan aşağıya bölümler:

1. **Ürün seçici bandı:** "Hangi kaynak makinesi size uygun? — 3 soruda
   ihtiyacınıza uygun modeli bulun." ve **Teste Başla!** (`/urun-secici`).
2. **Tanıtım alanı:**
   - Fotoğraf, büyük başlık "Zenweld Kaynak Makineleri ve Plazma Kesme
     Sistemleri" ve slogan "Kaynakta bir üst seviye".
   - İki düğme: **Ürünleri Keşfet** (`/ekipmanlar`), **Teklif Al**.
3. **Kampanyalı Ürünler (Hot Sale):**
   - Kampanyası **şu an geçerli** olan ürünler, en yüksek indirim önce, en
     fazla 12 tane.
   - Kampanya başlayınca ürün buraya kendiliğinden girer, bitince çıkar.
   - Kampanyalı ürün yoksa bölüm görünmez. "Tümünü Gör" `/ekipmanlar`'a
     gider.
4. **Yeni Gelenler:**
   - Panelde "Yeni ürün" işaretli yayındaki ürünler, en fazla 12 tane.
   - Böyle bir ürün yoksa bölüm görünmez.
5. **Bayi ve servis haritası:** "Size En Yakın Zenweld Bayi ve Yetkili
   Servisini Bulun" başlığıyla bayi bulucunun anasayfa hali
   ([7. bölüm](#7-bayi-ve-servis-bulucu)).
6. **Neden Zenweld?** Beş madde: Sanayinin Tercihi, Ödüllü Marka, Kolay
   Destek, Garanti Sorgula, Yetkili Bayi ve Servis Ağı. Açıklama metinleri
   yer tutucudur (lorem ipsum).
7. **Müşterilerimiz Ne Diyor?**
   - Panelde "anasayfada göster" işaretlenmiş, onaylı ve ürünü yayında olan
     değerlendirmeler, en fazla 10 tane.
   - Kartta puan, başlık, yorum, yazan ve ürün adı vardır.
8. **Sık Sorulan Sorular:** İlk 8 soru (açılır-kapanır) ve "Tümünü Gör"
   (`/sss`).
9. **Teklif bandı:** "Kurumsal alım mı yapacaksınız? Vadeli ödeme ve çek ile
   ödeme seçenekleri için satış ekibimizden teklif alın." → **Teklif Al**.
10. **Bayilik bandı:** "Zenweld Bayisi Olmak İster misiniz?" →
    **Bayilik Başvurusu**.
11. **Bloğumuzdan:** En yeni 3 blog yazısı (kapak, kategori, başlık, tarih) ve
    "Tümünü Gör".

**Kayan şeritler:** Hot Sale, Yeni Gelenler ve yorumlar yana doğru yavaşça
kayar. Fareyle üzerine gelince durur, elle kaydırılabilir. İşletim sisteminde
"hareketi azalt" seçiliyse kaymaz.

---

## 4. Katalog

Katalog dört seviyelidir: **bölüm › grup › kategori › ürün**.

| Seviye | Adres | Sayfada ne var |
|---|---|---|
| Bölüm | `/ekipmanlar`, `/guvenlik`, `/aksesuarlar`, `/dolgu-metalleri` | Bölümün grupları kart olarak |
| Grup | `/ekipmanlar/kaynak-makineleri` | Grubun kategorileri kart olarak |
| Kategori | `/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri` | Kategorinin ürünleri |
| Ürün | `/urun/<ürün-linki>` | Ürün sayfası (kısa ve kalıcı adres; ürün başka kategoriye taşınsa da değişmez) |

Her seviyede üstte konum satırı (ör. Ekipmanlar › Kaynak Makineleri ›
...) vardır.

**Bölüm sayfası:**

- **Üst kısım:** Başlık ve sabit bir açıklama. Örnek: "Zenweld lazer ve kaynak
  makinelerini inceleyin, size en yakın yetkili bayiden satın alın."
- **Grup kartı:**
  - Görsel, grup adı, "N ürün" ve grubun kategorilerinin adları.
  - Düğme: **Kategorileri Gör**.
  - Grubun görseli yoksa ilk kategorinin, "Önerilen" sıradaki ilk ürününün
    fotoğrafı kullanılır.

**Grup sayfası:**

- **Üst kısım:** Grup adı ve açıklaması. Açıklama panelde boş bırakılmışsa
  kategori adlarından otomatik oluşturulur.
- **Kategori kartı:**
  - Görsel (yoksa kategorinin ilk ürününün fotoğrafı), ad, "N ürün" ve kısa
    açıklama.
  - Düğme: **Ürünleri İncele**.
- **Tanıtım metni:** Kartların altında "<Grup> Hakkında" başlığıyla, panelde
  yazıldıysa görünür.

**Kategori sayfası:**

- **Üst kısım:** Kategori adı ve kısa açıklaması.
- **Ürünler:** Ürün kartları ([5. bölüm](#5-ürün-kartı)).
- **Sırala:**
  - **Önerilen** (varsayılan): Panelde verilen Sıra numarası; eşit
    numaralılar ada göre, numarası olmayanlar en sonda.
  - **Fiyat (artan)** ve **Fiyat (azalan):** Müşterinin göreceği fiyatla, yani
    kampanya uygulanmış haliyle.
  - **İsme göre (A-Z):** Türkçe alfabe sırasıyla.
  - **En yeniler:** Ürünün eklenme tarihine göre.
- **Ürün sayısı ve sıfırlama:** "N ürün" yazar; **Filtreleri Temizle**
  sıralamayı varsayılana döndürür.
- **Telefonda:** Sıralama, "Filtreler (N)" düğmesiyle açılan bir pencerede
  durur.
- **Boş kategori:** "Bu kategoriye henüz ürün eklenmedi." yazar.
- **Tanıtım metni:** En altta "<Kategori> Hakkında", panelde yazıldıysa
  görünür.

**Kurallar:**

- Bir kategori yalnızca kendi grubunun adresinde açılır. Başka bir grubun
  altından yazılan adres 404 verir; her sayfanın tek adresi olur.
- Linki ya da grubu değişen kategorinin ve linki değişen grubun eski adresi
  yeni adrese yönlenir. Grubun linki değişirse içindeki bütün kategorilerin
  eski adresleri de yönlenir.

---

## 5. Ürün kartı

Katalogda, anasayfa şeritlerinde, aramada, Ürün Seçici'de, favorilerde ve
"İlgili Ürünler"de aynı kart kullanılır.

- **Favori kalbi:** Ürünü favorilere ekler ya da çıkarır. Giriş gerekmez; bkz.
  [Favorilerim](#favorilerim).
- **Görsel:** Ürünün ilk görseli; yoksa markalı yer tutucu.
- **Rozetler:**
  - Kampanya **%25 ve üzerindeyse** "Flaş İndirim %X" yazar ve kartın etrafında
    alev efekti olur. Bu eşik koddaki tek bir sayıdır, değiştirilebilir.
  - Daha düşük kampanyada "%X indirim" yazar.
  - Panelde "Yeni ürün" işaretliyse "YENİ" yazar. Kampanyalı üründe de
    görünür.
- **Ürün kodu ve adı:** Ad ürün sayfasına gider.
- **Öne çıkan özellikler:** Panelde girilen ilk 3 özellik. Yer tutucu (lorem
  ipsum) metinler gösterilmez; hiç gerçek özellik yoksa kısa açıklama gösterilir.
- **Fiyat:**
  - Büyük yazan fiyat KDV dahildir.
  - Kampanyadaysa indirimli fiyat vurgulu, normal fiyat üstü çizili
    gösterilir.
  - Altında "KDV Dahil · <tutar> KDV Hariç" yazar.
- **Düğme:**
  - Seçenekli üründe **Seçenekleri Gör**: Ürün sayfasına gider; seçenek orada
    seçilir.
  - Seçeneksiz üründe **Sepete Ekle**: 1 adet ekler; düğme **Sepete Git**'e
    dönüşür.

---

## 6. Ürün sayfası

Adres: `/urun/<ürün-linki>`. Yalnızca yayındaki ürün açılır. Adres bir ürünün
eski linkiyse ya da seçeneğe dönüşmüş eski bir ürünse yeni adrese yönlenir;
hiçbiri değilse 404 çıkar.

### Üst bölüm

- **Konum satırı:** Bölüm › Grup › Kategori › Ürün adı.
- **Galeri:**
  - Büyük görsel ve küçük resimler; küçük resme tıklayınca büyür.
  - Seçilen seçeneğin fotoğrafı varsa galeri o fotoğrafla açılır.
- **Ürün adı ve kısa açıklama.**
- **Bilgi satırı:**
  - "YENİ" rozeti (işaretliyse) ve "<N> ay garanti".
  - **Ürün Kodu:** Seçenekli üründe seçilen seçeneğin kodu.
  - **Model:** Model kodu girilmişse.
- **Seçenek seçici** (yalnızca seçenekli üründe):
  - Seçenek adı (ör. "Hortum Uzunluğu") ve değer düğmeleri (3 m, 4 m, 5 m).
  - Değerler panelde tanımlanan sırayla dizilir; ilk değer seçili gelir.
  - Seçenek değişince fiyat, ürün kodu (üstte ve Teknik Özellikler tablosunda),
    teknik özellikler, kutu içeriği, fotoğraf, bayi listesi ve online satıcılar
    değişir. Kurallar: [IS-KURALLARI.md](IS-KURALLARI.md).
  - **Yorumlar değişmez;** ürünün tüm seçenekleri için ortaktır.
  - Seçim adrese yazılır (`/urun/mig-torcu-mb25?secenek=5-m`); bu link o
    seçenekle açılır. Geçersiz seçenek yazılmışsa ilk seçenek açılır.
- **Fiyat:**
  - Kampanyada önce "%X indirim" rozeti çıkar; %25 ve üzerinde "Flaş İndirim"
    yazar ve alev simgesi eklenir.
  - "Normal fiyat" üstü çizili, KDV dahil gösterilir.
  - Büyük yazan fiyat KDV dahildir (kampanyada vurgulu). Altında
    "<tutar> KDV Hariç · KDV %<oran>" yazar.
  - Kampanyanın bitiş tarihi varsa "Kampanya <tarih saat> tarihinde sona
    eriyor" yazar.
- **Öne Çıkan Özellikler:** Panelde girilen özelliklerin tamamı.
- **Sepete ekleme:**
  - Adet kutusu (1–99; – ve + düğmeleri, elle de yazılır).
  - **Sepete Ekle** düğmesi ve favori kalbi.
  - Ekleyince "Sepete eklendi · Sepete Git →" çıkar. Seçili seçenek de
    eklenir.
- **Stoktaki Bayileri Gör:**
  - Pencerede bayi bulucuyu açar
    ([7. bölüm](#7-bayi-ve-servis-bulucu)).
  - Yalnızca bu ürünü (seçenekli üründe seçilen seçeneği) stokta tutan bayiler
    listelenir.
  - Üstte "Aranan ürün: <ad> (<seçenek>)" yazar.
- **"Ayrıca online alışveriş olarak şurada da mevcuttur:"**
  - Ürünü (seçenekli üründe seçilen seçeneği) stokta tutan online satıcıların
    kartları; kendi mağazamız en başta, diğerleri ada göre.
  - Kart, satıcının o ürüne ya da seçeneğe ait sayfasına yeni sekmede gider.
  - Satıcının fiyatı ve adedi gösterilmez.
  - 8'den fazla satıcı varsa "Daha Fazla Göster" ile açılır.
  - Altında "Stok bilgisi <tarih> itibarıyladır" yazar.
  - Hiç satıcı yoksa: "Bu ürün şu anda online satıcılarda stokta değil. En
    yakın Zenweld bayisinden temin edebilirsiniz."
- **Güven rozetleri:** Sanayinin Tercihi, Ödüllü Marka, Kolay Destek.
- **"Ürün hakkında sorularınız mı var? — Bize yazın":** Ürün destek sohbetini
  açar.

### Sekmeler

| Sekme | İçerik |
|---|---|
| **Teknik Özellikler** | Özellik–değer tablosu. Seçenekli üründe seçeneğin satırı ("Hortum Uzunluğu: 5 m") eklenir, seçeneğe özel değerler (ör. Ağırlık) uygulanır ve ürün kodu satırı seçeneğin kodunu gösterir. |
| **Ürün Açıklaması** | Uzun açıklama. Kullanım kılavuzu bağlantısı girilmişse "Kullanım Kılavuzu (PDF)". |
| **Kutu İçeriği** | Madde listesi (seçeneğe göre değişebilir). Liste boşsa sekme görünmez. |
| **Garanti** | "<N> ay garanti", bir metin (yer tutucu) ve **Garanti Kaydı →**, **Garanti Sorgula →** bağlantıları. |
| **SSS** | Sık sorulan soruların tamamı (açılır-kapanır). |

### Değerlendirmeler

- **Liste:** Yalnızca panelde onaylanmış değerlendirmeler görünür, yeniden
  eskiye. Üstte ortalama puan (bir ondalık) ve "<N> değerlendirme" yazar.
- **Değerlendirme kartı:**
  - Puan (yıldız), başlık, yorum, yazan ve tarih.
  - Fotoğraf ve videolar.
  - "Doğrulanmış alıcı" rozeti.
- **Boşsa:** "Bu ürün için henüz değerlendirme yok. İlk yorumu siz yazın."
- **Değerlendirme Yaz** formu:
  - **Puan:** Zorunlu, 1–5 yıldız.
  - **Ad:** Zorunlu; üyede hazır gelir.
  - **Başlık:** İsteğe bağlı.
  - **Yorum:** Zorunlu.
  - **Fotoğraf / Video Ekle:** Görseller otomatik küçültülür; video en fazla
    2 MB olabilir.
  - KVKK notu ve bot tuzağı vardır.
- **Hata mesajları:** "Lütfen puan verin.", "Lütfen adınızı girin.", "Lütfen
  yorumunuzu yazın.", "\"<dosya>\" çok büyük. Video en fazla 2 MB olabilir.",
  "Değerlendirmeniz kaydedilemedi; dosyalar çok büyük olabilir..."
- **Gönderince:**
  - "Değerlendirmeniz alındı. Yayınlanmadan önce ekibimiz tarafından kontrol
    edilecek." yazar.
  - Değerlendirme panelde onay bekler.
  - `info@zenweld.com`'a "Yeni ürün yorumu" e-postası gider.
- **Demo notu:** Giriş yapmış üyenin değerlendirmesi "Doğrulanmış alıcı"
  sayılır. Gerçek sistemde bu, üyenin o ürünü satın almış olmasıyla
  eşleştirilmelidir.
- **Seçenekten bağımsız:** Değerlendirmeler ürüne bağlıdır; ürünün bütün
  seçeneklerinde aynı liste görünür.

### İlgili Ürünler

Aynı kategorideki yayındaki ürünlerden ilk 4 tanesi (ürünün kendisi hariç).

### Ürün destek sohbeti

Yalnızca ürün sayfalarında, sağ altta bir düğme olarak durur.

- **Açılınca:** İlk mesaj olarak "Merhaba! Bu ürünle ilgili sorunuzu buraya
  yazabilirsiniz." ve "Sorum bu ürün hakkında: <ürün adı> · <ürün kodu>" hazır
  gelir.
- **Soru:** Zorunlu; boşsa "Lütfen sorunuzu yazın."
- **İletişim bilgisi:**
  - Üyede hesaptan alınır: "Yanıtımız hesabınızdaki <e-posta> adresine
    iletilecek."
  - Üye değilse e-posta ya da telefondan en az biri zorunludur: "Size
    dönebilmemiz için e-posta veya telefon girin."
- **Gönderince:**
  - `info@zenweld.com`'a "Ürün destek talebi — <ürün> (<kod>)" e-postası gider.
    E-postada ürün, ürün kodu, sayfanın adresi, ad, e-posta, telefon, üye olup
    olmadığı ve soru yer alır. E-postaya "yanıtla" denince cevap ziyaretçiye
    gider.
  - Ekranda sabit yanıt çıkar: "Destek ekibimiz size en kısa sürede dönüş
    yapacaktır. İyi günler dileriz."
  - E-posta gidemezse ayrıca "Mesajınız alındı. Acele bir durumsa
    info@zenweld.com adresine de yazabilirsiniz." yazar.
- KVKK notu ve bot tuzağı vardır.
- **İleride:** Sohbet bugün sabit yanıt verir. Gerçek ürün bilgileri
  girildikten sonra bir yapay zekâyla sık soruları kendisi yanıtlayacak şekilde
  geliştirilebilir.

### Arama motoru bilgileri

- **Sayfa başlığı:** Panelin SEO sekmesinden gelir; boşsa "<Ürün adı> —
  <Kategori> | ZENWELD".
- **Açıklama:** SEO sekmesinden gelir; boşsa kısa açıklama.
- **Paylaşım önizlemesi:** Ürünün ilk görseliyle (yoksa marka görseliyle)
  hazırlanır.
- **Yapısal veri:** Google'a ürün bilgileri bildirilir: KDV dahil kampanyalı
  fiyat ve kampanya bitişi, "stokta", "yeni ürün", teknik özellikler, konum
  satırı.
- **Asıl adres (canonical):** `/urun/<link>`; seçenek linkleri ayrı sayfa
  sayılmaz.

---

## 7. Bayi ve servis bulucu

Üç yerde kullanılır: **Yetkili Bayi ve Servis Ağı** sayfası
(`/yetkili-bayi-ve-servis-agi`), anasayfa ve ürün sayfasındaki
**Stoktaki Bayileri Gör** penceresi. Yalnızca panelde aktif olan bayiler
listelenir.

**Filtreler:**

- **Şehir Seçin:** Bayilerin bulunduğu şehirler alfabetik sırayla; varsayılan
  "Tüm Şehirler".
- **Yetkili Servis:** İşaretlenirse yalnızca servis veren noktalar listelenir.
- **Konumumu Kullan:**
  - Tarayıcıdan konum ister.
  - İzin verilmezse: "Konum izni alınamadı. Aşağıdan şehir seçerek de arama
    yapabilirsiniz."
- **Sıralama:**
  - Konum alınmışsa ya da şehir seçilmişse noktalar uzaklığa göre sıralanır;
    kartta "<N> km" yazar.
  - Hiçbiri yoksa liste şehir adına göre sıralanır.

**Liste (bayi sayfasında ve ürün penceresinde):**

- **Üstte:** "<N> nokta bulundu" yazar.
- **Kart:**
  - Ad, uzaklık, adres ve çalışma saatleri.
  - Rozetler: **Yetkili Bayi** / **Yetkili Servis**; online mağazası varsa
    "Online mağazası var".
- **Düğmeler:**
  - **Ara:** Telefon araması.
  - **WhatsApp:** Numara girilmişse.
  - **Yol Tarifi:** Google Haritalar'da bayinin koordinatına yol tarifi açar.
- **Seçim:** Karta tıklayınca harita o noktaya yakınlaşır.
- **Boşsa:** "Sonuç bulunamadı."

**Harita:**

- **Altyapı:** OpenStreetMap; API anahtarı gerektirmez.
- **İşaretçiler:** Her bayi için bir işaretçi vardır. Üzerine gelince bayi adı
  ve ilçe/şehir yazar; bu metin düz yazı olarak gösterilir, içine yazılan kod
  çalışmaz.
- **Konum:** Ziyaretçinin konumu "Konumunuz" noktasıyla gösterilir.
- **Kapsama:** Harita bütün noktaları sığdıracak şekilde açılır.

**Anasayfa hali:**

- Yalnızca filtreler, "<N> nokta bulundu" ve harita görünür.
- Haritada bir noktaya tıklayınca altında o noktanın kartı (eylemleriyle)
  açılır.
- Seçim yoksa "Haritadan veya listeden bir nokta seçin." yazar.

**Ürün sayfası hali:**

- Yalnızca o ürünü stokta tutan bayiler listelenir.
- **Seçenekli üründe:** Yalnızca seçilen seçeneği stokta tutanlar listelenir.
  Bayi stoğu seçenek belirtilmeden verilmişse, ürünün bütün seçenekleri için
  geçerli sayılır.
- **Stokta sayılma koşulları:** Adedin 0'dan büyük olması ve stok bilgisinin
  güncel olması gerekir (varsayılan son 3 gün; panelden değişir).
- Ayrıntı: [STOK.md](STOK.md).

---

## 8. Arama

**Arama penceresi** (üst menüdeki "Ara" ya da ⌘K / Ctrl+K):

- **Anlık sonuçlar:** Yazdıkça en fazla 24 sonuç çıkar.
- **Sonuç grupları:**
  - **Ürünler:** Kampanyalı, KDV dahil fiyatla.
  - **Kategoriler.**
  - **Yazılar:** Blog, haber, etkinlik.
  - **Sayfalar.**
- **Klavye:** Ok tuşları ve Enter ile seçilir; Esc kapatır.
- **2 harften kısa sorguda ipucu:** "Arama yazım hatalarını tolere eder —
  "kanak makinesi" yazsanız da bulur."
- **Sonuç yoksa:** "Sonuç bulunamadı" ve "Bunu mu demek istediniz?" önerileri.
- **Tümünü Gör (N):** `/arama?q=...` sayfasına gider.

**Arama sayfası** (`/arama`):

- **Kutu:** Arama kutusu ve **Ara** düğmesi.
- **Sonuç sayısı:** "\"<sorgu>\" için <N> sonuç" (en fazla 60).
- **Ürünler:** Kart olarak.
- **Diğer sonuçlar:** Liste olarak (görsel ya da simge, başlık, alt başlık).
- **Sonuç yoksa:** "Sonuç bulunamadı — Farklı bir kelime deneyin veya
  kategorilere göz atın." ve öneriler.

**Neler aranır:**

- **Ürünler** (yalnızca yayındakiler): Ad, kod, kategori, kısa ve uzun
  açıklama, kaynak yöntemleri, model kodu, teknik özellikler ve panelde girilen
  SEO anahtar kelimeleri.
- **Kategoriler:** Ad, açıklama ve anahtar kelimeleri.
- **İçerik:** Yayındaki etkinlikler, haberler ve blog yazıları.
- **Sabit sayfalar** (anahtar kelimeleriyle): Teklif Al, bayi bulucu, garanti
  sorgulama ve kaydı, Welders Club, MSDS, Parti Sertifikaları, Ürün Seçici,
  İletişim, SSS, Hakkımızda, Blog, Etkinlikler, Haberler.

**Arama kuralları:**

- **Alan ağırlıkları:** Başlık ×4, ürün kodu ×3, alt başlık (kategori) ×2,
  gövde ×1.
- **Kelime başı eşleşmesi:** "pla" yazınca "Plazma" bulunur.
- **Yazım hatası toleransı:** 3 harften uzun kelimelerde çalışır; "kanak
  makinesi" → Kaynak Makinesi.
- **Türkçe karakterler:** Karakter farkı ve büyük/küçük harf önemsizdir
  ("ortulu" ≈ "örtülü").
- **Eşanlamlılar:**
  - mig ↔ gazaltı / gmaw / telli
  - tig ↔ argon / gtaw
  - mma ↔ örtülü / elektrot / çubuk / stick
  - plazma ↔ kesme
  - maske ↔ kask
  - torç ↔ torch / tabanca
  - tel ↔ makara / bobin
  - paslanmaz ↔ inox / 304 / 316
  - ve benzerleri
- **Demo notu:** Arama tarayıcıda çalışır (MiniSearch, Elasticsearch ile aynı
  BM25 puanlaması). Gerçek sistemde aynı arayüzle bir arama sunucusuna
  bağlanabilir.

---

## 9. Ürün Seçici

Adres: `/urun-secici`. `?malzeme=celik` gibi bir ön seçimle açılırsa
1. adımı atlar.

**Adımlar:**

- Üç adımdır: "Adım N / 3".
- Her adımda birden fazla seçenek işaretlenebilir ("Birden fazla seçenek
  işaretleyebilirsiniz.").
- Seçim yapılmadan **İleri** çalışmaz; **Önceki** ile geri gidilir. Son
  adımda düğme **Sonuçları Gör** olur.

| Adım | Soru | Seçenekler ve anlamı |
|---|---|---|
| 1 | Hangi malzemeleri kaynatacaksınız? | Çelik / Karbon Çeliği → MIG, MAG, MMA · Paslanmaz Çelik → TIG, MIG, PULSE · Alüminyum → TIG, PULSE, MIG · Kesim yapacağım → PLAZMA |
| 2 | Kullanım amacınız nedir? | Hobi / Ev → en fazla 15.000 ₺ · Küçük Atölye → en fazla 50.000 ₺ · Sanayi / Seri Üretim → sınırsız (KDV hariç; birden çok seçilirse en geniş bütçe) |
| 3 | Elektrik altyapınız? | 220V Monofaze → 3 faz istemeyen makineler · 380V Trifaze → teknik özelliklerinde "3 faz" geçenler · Farketmez |

**Sonuç:**

- **Listelenen ürünler:** Ekipmanlar bölümündeki yayındaki ürünlerden
  aşağıdaki koşulların hepsine uyanlar listelenir:
  - Kaynak yöntemlerinden biri, seçilen malzemelerin yöntemlerinden biri olmalı.
  - Kampanya uygulanmış KDV hariç fiyatı bütçeyi aşmamalı.
  - Elektrik altyapısına uymalı.
- Başlıkta "Size uygun <N> ürün" yazar; ürünler kart olarak, altında
  **Yeniden başla** düğmesiyle gösterilir.

---

## 10. Sepet

Adres: `/sepet`. Sepet için giriş gerekmez; ödeme adımında istenir.

- **Saklanan bilgi:** Sepette yalnızca ürün, seçenek ve adet saklanır. Fiyat
  her zaman ürünün **o anki** fiyatından (kampanya dahil) hesaplanır; panelde
  fiyat değişirse sepet de güncel fiyatı gösterir.
- **Satır kuralları:**
  - Aynı ürünün aynı seçeneği tek satırdır; tekrar eklenince adet artar.
    Farklı seçenekler ayrı satırdır.
  - Adet 1–99 arasıdır.
- **Gizlenen satırlar:** Yayından kaldırılan ürünün satırı ve seçilen
  seçeneği artık bulunmayan satır (ör. seçenek panelden kaldırıldıysa)
  gösterilmez; başka bir seçenek sessizce satılmaz.
- **Satır:**
  - Görsel (seçeneğin fotoğrafı, yoksa ürününki), ürün adı (ürüne bağlantı),
    seçenek ("Hortum Uzunluğu: 5 m").
  - Birim fiyat ve satır toplamı (KDV dahil).
  - Adet kutusu ve **Kaldır**.
- **Sipariş Özeti:**
  - Tutarlar: Ara Toplam (KDV dahil), "KDV (fiyatlara dahil)", Kargo
    ("Ücretsiz" ya da ücret), Toplam.
  - Kargo durumu: Kargo bedavaya kalan tutar varsa "<tutar> daha ekleyin, kargo
    ücretsiz olsun." yazar; yoksa "Kargonuz ücretsiz!".
  - Kargo kuralı: Ara toplam, Mağaza Ayarları'ndaki eşiğin (varsayılan
    5.000 ₺) üzerindeyse kargo ücretsizdir; değilse kargo ücreti eklenir.
  - Düğmeler: **Ödemeye Geç** ve **Alışverişe Devam Et**.
- **Boş sepet:** "Sepetiniz boş — Ürün sayfalarından sepete ürün
  ekleyebilirsiniz." ve **Alışverişe Devam Et**.
- **Sekmeler arası:** Sepet başka bir sekmede değişirse açık sekmeye de yansır.

---

## 11. Ödeme

Adres: `/odeme`. Tek sayfada üç adım ve sağda özet vardır.

- **Giriş yapılmamışsa:** "Sipariş vermek için giriş yapın — Online
  siparişler yalnızca üye hesaplarla verilebilir. Sepetiniz giriş yaptıktan
  sonra da korunur." **Giriş Yap** düğmesi girişten sonra ödemeye geri döner;
  yanında **Üye Ol** vardır.
- **Sepet boşsa:** Boş sepet mesajı görünür.

### 1. Teslimat Adresi

- **Kayıtlı adres seçimi:** Kayıtlı adresler seçilebilir kartlardır; ilki
  seçili gelir.
- **Yeni adres alanları:**
  - Zorunlu: Ad Soyad, Telefon, İl, İlçe, Açık adres.
  - İsteğe bağlı: Adres başlığı ("Ev, İş, Atölye…").
- **"Bu adresi adreslerime kaydet":** İşaretli gelir. Sipariş tamamlanınca adres
  Adreslerim'e eklenir; başlık boşsa "Teslimat Adresi" olur.

### 2. Fatura Bilgileri

- **Fatura türü:**
  - **Bireysel:** Ad Soyad ve T.C. Kimlik No (11 hane, algoritma kontrolü).
  - **Kurumsal:** Firma Ünvanı, Vergi Dairesi ve Vergi No (10 hane).
  - Varsayılan tür üyenin hesap türüne göre gelir; değiştirilebilir.
- **Hazır bilgiler:** Üyenin adı ve firma bilgileri dolu gelir.
- **"Fatura adresim teslimat adresiyle aynı":** İşaretli gelir. İşaret
  kaldırılınca ayrı fatura adresi alanları açılır.

### 3. Ödeme Yöntemi

**Kredi / Banka Kartı:**

- **Kart alanları:**
  - Kart üzerindeki isim.
  - Kart numarası: Yazarken dörderli gruplanır, kart markası (Visa,
    Mastercard, Troy, American Express) yanında görünür.
  - Son kullanma (AA/YY).
  - CVC (3–4 hane).
- **Taksit seçenekleri:**
  - Kartın ilk 6 hanesi girilince "Kart programı: <program> · <banka>" ve
    taksit seçenekleri çıkar.
  - **Tek Çekim** her zaman vardır. Taksitler (2, 3, 6, 9, 12) kartın
    bankasının panelde açık olan taksitleridir.
  - Taksit satırında "<aylık tutar> × <N> ay" yazar; vade farkı yoksa
    "Vade farksız".
  - Kart değişince seçim Tek Çekim'e döner.
- **Tek çekimle sınırlı durumlar:**
  - Kartın programı hiçbir bankayla eşleşmezse varsayılan bankadan yalnızca
    tek çekim yapılır.
  - Sepet tutarı taksit alt sınırının altındaysa: "Taksit seçenekleri <tutar>
    ve üzeri siparişlerde geçerlidir."
- **Ödeme alınamıyorsa:** "Bu kartla şu an ödeme alınamıyor. Havale / EFT ile
  ödeyebilirsiniz."
- **Vade farkı:** Özette ve sözleşmede ayrı satırdır. Ödenecek tutar vade
  farkı dahil düğmede yazar.
- **Güvenlik notu:** "Kart bilgileriniz Zenweld'de saklanmaz; ödeme bankanızın
  3D Secure sayfasında onaylanır."
- Kart programı, banka eşleşmesi ve vade farkı hesabı:
  [IS-KURALLARI.md](IS-KURALLARI.md).

**Havale / EFT:**

- Bilgi metni: "Siparişiniz oluşturulduktan sonra aşağıdaki hesaplardan birine
  ödeme yapın ve açıklamaya sipariş numaranızı yazın. Ödeme <N> gün içinde
  hesabımıza geçmezse sipariş iptal edilir."
- Banka hesapları (banka, alıcı, IBAN; IBAN tek tıkla kopyalanır) Mağaza
  Ayarları'ndan gelir.

**Sipariş notu:** İsteğe bağlıdır.

### Özet ve onay

- **İçerik:** Ürün satırları (adet × ad) ve tutarlar; kartla taksitte vade
  farkı ayrı satırdır.
- **Onay kutusu:** "Ön Bilgilendirme Formu ile Mesafeli Satış Sözleşmesi'ni
  okudum ve kabul ediyorum." İki bağlantı da pencerede, **o siparişin
  bilgileriyle doldurulmuş** metni açar.
- **Düğme:** Kartta "<tutar> Öde", havalede "Siparişi Tamamla".

**Kontrol sırası ve hata mesajları:**

1. Teslimat ve fatura adresi eksikse: "Lütfen zorunlu alanları doldurun."
2. Bireysel faturada ad ve T.C. kimlik no: "Geçerli bir T.C. kimlik numarası
   girin."
3. Kurumsal faturada unvan, vergi dairesi ve vergi no: "Vergi numarası 10
   haneli olmalıdır."
4. Kart alanları: "Kart numarası geçersiz.", "Son kullanma tarihi geçersiz.",
   "CVC geçersiz." Bankası yoksa yukarıdaki "ödeme alınamıyor" mesajı.
5. Sözleşme onayı: "Devam etmek için Ön Bilgilendirme Formu ve Mesafeli Satış
   Sözleşmesi'ni onaylayın."

**Sipariş tamamlanınca:**

- **Sipariş numarası:** `SIP-<yıl>-<5 haneli sıra>` biçiminde verilir.
- **Durum:**
  - Kartla ödemede sipariş **Hazırlanıyor** durumunda açılır.
  - Havalede **Ödeme Bekleniyor** durumunda açılır; son ödeme tarihi bugün +
    Mağaza Ayarları'ndaki gün sayısıdır.
- **Kaydedilenler:** Sözleşmenin onaylandığı an ve sipariş anındaki ürün adı,
  seçenek adı, kodu, birim fiyatı ve KDV oranı saklanır. Sonradan ürün değişse
  de sipariş değişmez.
- **E-posta:** `info@zenweld.com`'a "Yeni sipariş" e-postası gider. T.C. kimlik
  numarası ve kart bilgisi e-postaya yazılmaz.
- **Sonrası:** Sepet boşalır ve müşteri sipariş detayına gider; bkz.
  [Siparişlerim](#siparişlerim-ve-sipariş-detayı).

**Demo notu:**

- Kartla ödemede 1,5 saniyelik "3D Secure doğrulanıyor…" beklemesinden sonra
  ödeme onaylanmış sayılır; para çekilmez.
- Kart programı, kartın ilk 6 hanesinden sabit bir kuralla seçilir. Gerçekte
  ödeme kuruluşunun BIN sorgusundan gelecektir.
- Siparişte karttan yalnızca marka, program, son 4 hane, taksit sayısı, banka
  adı ve komisyon oranı saklanır.

---

## 12. Sözleşmeler

**Ön Bilgilendirme Formu** ve **Mesafeli Satış Sözleşmesi** (6502 sayılı Kanun
ve Mesafeli Sözleşmeler Yönetmeliği gereği ödeme öncesi onaylanır).

- **Üstteki otomatik tablolar:**
  - **Satıcı:** Unvan, adres, telefon, e-posta, MERSİS No (henüz boş: "[—]").
  - **Alıcı:** Ad soyad ya da unvan, e-posta, telefon, teslimat adresi, fatura
    bilgileri.
  - **Sözleşme konusu ürünler:** Ürün (seçeneğiyle), adet, KDV dahil birim
    fiyat, toplam.
  - **Tutarlar ve ödeme:** Ürünler toplamı, kargo ücreti, vade farkı (varsa),
    ödenecek toplam tutar (KDV dahil), ödeme şekli ("Visa •••• 1111 · 3
    taksit" gibi) ve sipariş tarihi.
- **Altındaki metin:** Teslimat, cayma hakkı gibi bölümleri içerir; panelden
  (Yasal Metinler) düzenlenir.
- **Nerede ne görünür:**
  - Ödeme sayfasında o siparişin bilgileriyle doldurulur.
  - Sipariş detayından açılan kopya, onaylanan anın bilgilerini gösterir.
  - `/yasal/...` sayfalarında tablolar boş şablondur: "Sipariş sırasında
    doldurulur".

---

## 13. Üyelik

- **Ayrı oturumlar:** Site ile panelin oturumları ayrıdır. Panelden çıkış
  yapmak sitedeki oturumu etkilemez, tersi de öyle.
- **Kimler giriş yapabilir:** Site yalnızca **Bireysel** ve **Kurumsal**
  hesapları kabul eder.
  - Yönetici hesabıyla sitede giriş denenirse "hesap bulunamadı" mesajı çıkar.
    Böylece yönetici e-postaları ele verilmez.
- **Askıya alma:** Panelde askıya alınan hesabın açık oturumu hemen kapanır.

### Giriş (`/giris`)

- **Form:** E-posta ve Şifre; **Şifremi unuttum**, "Hesabınız yok mu?
  **Üye Ol**".
- **Hata mesajları:**
  - "Bu e-posta ile kayıtlı bir hesap bulunamadı."
  - "Şifre hatalı."
  - "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin."
- E-posta büyük/küçük harf duyarsızdır.
- **Girişten sonra nereye gider:**
  - Adreste `?next=` varsa ve site içi bir adresse oraya gider (ör. ödemeden
    gelindiyse ödemeye).
  - Başka bir siteye yönlendirme denemeleri reddedilir.
  - Yoksa Hesabım'a gider.

### Üye Ol (`/kayit`)

- **Hesap türü:** **Bireysel** ya da **Kurumsal**.
- **Bayiler için not:** "Zenweld Bayisi Olmak İster misiniz? Bayilik
  Başvurusu →" yazar. Bayiler sitede hesap açmaz.
- **Alanlar:**
  - Zorunlu: Ad, Soyad, E-posta, Telefon, Şifre (en az 6 karakter), Şifre
    (Tekrar).
  - İsteğe bağlı: Şehir.
  - Yalnızca kurumsalda: Firma Ünvanı (zorunlu), Vergi Dairesi, Vergi No,
    Sektör.
- **Onaylar:**
  - **Kullanım Koşulları**'nı okudum ve kabul ediyorum: Zorunlu; bağlantı yeni
    sekmede açılır.
  - "Zenweld'den haber ve kampanya e-postaları almak istiyorum": İsteğe bağlı,
    boş gelir.
- KVKK notu ve bot tuzağı vardır.
- **Hata mesajları:** "Şifreler eşleşmiyor.", "Üye olmak için Kullanım
  Koşulları'nı kabul etmelisiniz.", "Bu e-posta adresi zaten kayıtlı.", "Şifre
  en az 6 karakter olmalıdır."
- **Kayıt sonrası:**
  - Hesap hemen aktif olur ve oturum açılır; üye Hesabım'a gider. Panelden
    onay gerekmez; üye siteyi hemen kullanabilir.
  - `info@zenweld.com`'a "Yeni üye" e-postası gider: ad, e-posta, telefon,
    şehir, tür, firma ve bülten izni.

### Şifremi Unuttum (`/sifremi-unuttum`)

E-posta girilir; "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
yazar. **Demo notu:** Bugün gerçekte e-posta gönderilmez.

### Çıkış (`/cikis`)

Oturumu kapatır ve kısa bir süre sonra anasayfaya gider. Üst menüdeki **Çıkış
Yap** da aynı işi yapar.

**Demo notu:** Şifreler tarayıcıda karşılaştırılır; bu gerçek bir güvenlik
değildir. Gerçek sistemde kimlik doğrulama sunucuda yapılmalıdır.

---

## 14. Hesabım

Adres: `/hesabim/...`.

- **Girişsizse:** "Giriş Yap" kutusu çıkar.
- **Üst kısım:** "Hoş geldiniz, <Ad Soyad>" ve hesap türü rozeti (Bireysel /
  Kurumsal).
- **Menü:** Genel Bakış, Profil, Tekliflerim, Siparişlerim, Favorilerim,
  Garantilerim, Adreslerim. Alt sayfalarda da (ör. sipariş detayı) ilgili menü
  seçili kalır.
- Bu sayfalar arama motorlarına kapalıdır.

### Genel Bakış

Tekliflerim, Siparişlerim, Favorilerim ve Garantilerim için sayı kartları;
kartlar ilgili sayfaya gider.

### Profil

- **Alanlar:**
  - Ad, Soyad, Telefon, Şehir.
  - E-posta: Değiştirilemez.
  - Yalnızca kurumsalda: Firma Ünvanı, Vergi Dairesi, Vergi No.
- **Kaydet:** "Profiliniz güncellendi." yazar.

### Tekliflerim

- **Kart:** Üyenin gönderdiği teklif talepleri; teklif numarası, durum, tarih,
  ürün satırları (adet × ad — seçenek) ve müşteri notu.
- **Durumlar:** Yeni, İnceleniyor, Teklif Gönderildi, Kazanıldı, Kapandı.
  Panelde durum değişince burada hemen görünür.
- **Boşsa:** "Henüz teklif talebiniz yok."

### Siparişlerim ve sipariş detayı

**Liste:**

- **Kart:** Sipariş no, tarih, durum, ürünler (seçenekleriyle), kargodaysa
  "kargo firması · takip no", tutar.
- Karta tıklayınca detay açılır.
- **Boşsa:** "Henüz siparişiniz yok." ve **Alışverişe Devam Et**.

**Detay** (`/hesabim/siparislerim/<sipariş-no>`):

- **Erişim:** Üye yalnızca kendi siparişini görür; değilse "Sipariş
  bulunamadı."
- **Yeni sipariş mesajı:** Sipariş yeni verildiyse üstte başarı mesajı çıkar.
  - Kartla: "Ödemeniz onaylandı, siparişiniz hazırlanıyor. Kargoya
    verildiğinde takip numarası bu sayfada görünecek."
  - Havaleyle: "Siparişiniz oluşturuldu. Ödemeniz hesabımıza geçtiğinde
    hazırlanmaya başlayacak."
- **Durum ve tarih:** Durum rozeti ve sipariş tarihi/saati.
- **Sipariş Durumu çizelgesi:**
  - Adımlar: (havalede) Ödeme Bekleniyor → Hazırlanıyor → Kargoya Verildi →
    Teslim Edildi. Geçilen adımlar tarihleriyle görünür.
  - İptal edilmiş siparişte geçilen adımlar ve iptal anı ile nedeni yazar.
- **Ödeme bekleniyorsa:** "Ödemenizi <son tarih> tarihine kadar aşağıdaki
  hesaplardan birine yapın; açıklamaya <sipariş no> yazın..." ve banka
  hesapları (IBAN kopyalanır).
- **Kargoya verildiyse:** Kargo firması ve takip numarası (kopyalanır).
- **Ürünler:** Ürün ve seçenek, adet, satır tutarı; Ara Toplam, Kargo, vade
  farkı (varsa), Toplam.
- **Ödeme, adresler ve sözleşmeler:**
  - Ödeme: "Visa •••• 1111 · 3 taksit", "Tek çekim" ya da "Havale / EFT".
  - Teslimat adresi ve fatura bilgileri.
  - Sözleşmeler: Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi, sipariş
    anının bilgileriyle.
- **Demo notu:** Ödeme süresi dolan havale siparişleri, Siparişlerim ya da
  sipariş detayı açıldığında iptal edilir (sunucu olmadığı için). Gerçek
  sistemde bu iş sunucuda zamanlanmış olarak yapılmalıdır.

### Favorilerim

- **Liste:** Favorilere eklenen ürünlerin kartları. Yayından kaldırılan ürün
  görünmez.
- **Boşsa:** "Henüz favori ürününüz yok."
- **Demo notu:** Favoriler üyeye değil tarayıcıya bağlıdır; giriş yapmadan da
  çalışır.

### Garantilerim

- **Kapsam:** Üyenin e-posta adresiyle yapılmış garanti kayıtları
  (büyük/küçük harf farkı gözetilmez).
- **Kart:** Ürün, seri numarası, kayıt tarihi, garanti bitişi ve uzatılmış
  garantide "Uzatılmış garanti" rozeti.
- **Yeni Garanti Kaydı** düğmesi kayıt formuna gider.
- **Boşsa:** "Kayıtlı garanti bulunamadı." ve Garanti Kaydı.

### Adreslerim

- **Kart:**
  - Başlık, "Varsayılan" rozeti, ad soyad, açık adres, ilçe / il ve telefon.
  - Düğmeler: **Düzenle**, **Varsayılan yap**, **Sil**. Silmeden önce
    "“<başlık>” adresi silinsin mi?" diye sorulur.
- **Yeni Adres Ekle:** Ödeme sayfasındaki adres alanları ve başlık.
- **Boşsa:** "Kayıtlı adres yok" (altındaki açıklama yer tutucu).

---

## 15. Teklif Al

Adres: `/teklif-al`. Herkese açıktır; üyede bilgiler hesaptan gelir. Vadeli
ödeme veya çekle almak isteyen kurumsal müşteriler içindir; satış ekibi
teklifi ayrıca hazırlar.

**Ürün sayfasında teklife ekleme düğmesi yoktur ve olmayacaktır** (karar,
bkz. [KARARLAR.md](KARARLAR.md)). Ürünler yalnızca bu sayfadaki listeden
seçilir. Siteden Teklif Al'a anasayfadaki tanıtım alanı ve teklif bandından
gelinir.

**Adımlar:**

- Dört adımlıdır; üstteki adım çubuğuna tıklanarak da geçilir.
- 2. ve sonraki adımlara geçmek için 1. adımın eksiksiz olması gerekir.
- Önceki ve İleri düğmeleri vardır; son adımda **Teklif Talebini Gönder**.

1. **Firma Bilgileri:**
   - Zorunlu: Yetkili Kişi, E-posta (biçimi kontrol edilir), Telefon.
   - Firma Ünvanı: Ziyaretçi ve kurumsal üye için zorunlu, bireysel üye için
     isteğe bağlı.
   - İsteğe bağlı: Vergi No, Şehir.
   - Hata mesajları: "Lütfen firma ve iletişim bilgilerindeki zorunlu alanları
     doldurun.", "Lütfen geçerli bir e-posta adresi girin."
2. **Ürünler:**
   - **Teklif Listeniz:** Ürün adı, altında seçenek ve ürün kodu ("Hortum
     Uzunluğu: 5 m · ZW-TRC-MB25-5"), adet kutusu (en az 1), **Çıkar**.
   - **Ürün ekleme:** "Ürün Ekle…" listesinden seçip **Ekle**.
     - Listede panelde "Teklife açık" işaretli, yayındaki ürünler vardır.
     - Seçenekli ürün her seçeneğiyle ayrı satırdır ("MB-25 MIG Torcu — 5 m
       (ZW-TRC-MB25-5)"); seçeneksiz ürün "Ad (kod)" diye yazar.
     - Aynı ürün ve seçenek tekrar eklenirse adet artar.
   - **Saklanma (Demo notu):** Liste tarayıcıda tutulur. Yayından kalkan ürün
     ya da seçeneği artık bulunmayan satır gösterilmez.
   - **Liste boşsa:** "Teklif listeniz boş. Ürün sayfalarından ürün
     ekleyebilirsiniz." Bu metin değişecek, çünkü ürün sayfasında teklif
     düğmesi yok (bkz. [Bilinen durumlar](#25-bilinen-durumlar)).
3. **Ödeme Tercihi** (zorunlu):
   - Seçenekler: **Vadeli Ödeme**, **Çek ile Ödeme**, **Havale / EFT**,
     **Görüşelim**.
   - Vadeli'de **Vade (gün):** 30 / 45 / 60 / 90 / 120 (varsayılan 60).
   - **Notunuz** alanı vardır.
4. **Özet:**
   - Firma ve iletişim bilgileri.
   - Ürünler (adet × ad — seçenek).
   - Ödeme tercihi (vadeli ise gün sayısıyla) ve not.

**Gönderince:**

- **Kayıt:** Teklif `TKL-<yıl>-<4 haneli sıra>` numarasıyla **Yeni**
  durumunda kaydedilir.
  - Her satırda o anki ürün adı, seçenek adı ve ürün kodunun kopyası
    saklanır.
  - Üye gönderdiyse teklif Hesabım › Tekliflerim'de görünür.
- **E-posta:** `info@zenweld.com`'a "Yeni teklif talebi" e-postası gider.
  Satırlar "adet × ad (seçenek) · kod" biçimindedir.
- **Ekran:**
  - Teklif listesi boşalır.
  - "Teklif talebiniz alındı — Teklif numaranız <no>. Satış ekibimiz en geç 1
    iş günü içinde sizinle iletişime geçecek." yazar.
  - Düğmeler: **Geri** ve (üyeyse) **Tekliflerim**.
- Bot tuzağı vardır.

---

## 16. Formlar

### İletişim (`/iletisim`)

- **Form:**
  - Zorunlu: Ad Soyad, E-posta, Konu, Mesajınız.
  - KVKK notu ve bot tuzağı vardır.
- **Sonuç:**
  - Başarı: "Mesajınız alındı. En kısa sürede dönüş yapacağız."
  - Hata: "Mesajınız şu an gönderilemedi. Lütfen tekrar deneyin ya da
    info@zenweld.com adresine e-posta gönderin."
- **Kayıt:** Kayıt tutulmaz; yalnızca e-posta gider.
- **Ofislerimiz:** İstanbul ve İzmir kartları.
  - Kartta şehir, şirket unvanı, adres, telefonlar (tıklayınca arar) ve
    e-posta yer alır.
  - Gömülü Google haritası vardır; haritaya tıklamak ya da **Yol tarifi al**
    Google Haritalar'da yol tarifini açar.

### Bayilik Başvurusu (`/bayilik-basvurusu`)

- **Firma Bilgileri:**
  - Zorunlu: Firma Unvanı, Şehir.
  - İsteğe bağlı: Vergi Dairesi / No, Faaliyet Alanı ("Örn. hırdavat, sanayi,
    metal işleme"), Çalıştığınız Markalar.
  - Seçmeli: Sektörde Kaç Yıldır Faaliyettesiniz? (0–2 / 3–5 / 6–10 / 10+),
    Showroom / Mağazanız Var mı? (Evet / Hayır), Teknik Servis Verebiliyor
    musunuz? (Evet / Hayır).
- **İletişim:**
  - Zorunlu: Yetkili Kişi, E-posta, Telefon.
  - İsteğe bağlı: Eklemek İstedikleriniz.
- KVKK notu ve bot tuzağı vardır.
- **Kayıt:** Kayıt tutulmaz; yalnızca `info@zenweld.com`'a "Bayilik başvurusu
  — <firma>" e-postası gider.
- **Sonuç:**
  - Başarı: Form yerine "Başvurunuz Alındı — İlginiz için teşekkür ederiz.
    Sizlere info@zenweld.com maili üzerinden dönüş sağlıyor olacağız." ve
    **Anasayfaya Dön** görünür.
  - Hata: "Başvurunuz şu an iletilemedi. Lütfen tekrar deneyin ya da
    info@zenweld.com adresine e-posta gönderin."

### Servis Talebi (`/servis-talebi`)

- **Üstte:** "“Garanti Koşulları” için lütfen buraya tıklayınız!" (yeni sekme).
- **Makine bilgileri:**
  - **Makine Türü:** Zorunlu. Kaynak Makineleri ve Lazer Makineleri
    gruplarının kategorileri, grup başlıklarıyla listelenir.
  - **Model:** Zorunlu. Seçilen kategorinin yayındaki ürünleri, ada göre;
    önce makine türü seçilmelidir.
  - **Servis Talep Nedeni:** Zorunlu, birden fazla seçilebilir: Kurulum, Bakım,
    Onarım, Kullanım/Bakım Eğitimi.
  - **Müşteri Şikayeti:** Zorunlu, en fazla 400 karakter (sayaç görünür).
- **"Servis Talebi Bulunan Firma / Şahıs Bilgileri"** (hepsi zorunlu): Firma /
  Şahıs Adı, Adres, İl, İlçe, E-posta, Telefon, Yetkili Kişi, Yetkili Kişi GSM.
- **Onay:** "**Gizlilik sözleşmesini** okudum, kabul ediyorum." Zorunlu;
  bağlantı yeni sekmede açılır.
- Bot tuzağı vardır.
- **Hata mesajları:** "Lütfen zorunlu alanları doldurun.", "En az bir servis
  talep nedeni seçin.", "Devam etmek için gizlilik sözleşmesini onaylayın."
- **Gönderince:**
  - Talep `SRV-<yıl>-<4 haneli sıra>` numarasıyla **Yeni** durumunda kaydedilir
    ve panelde Servis Talepleri'ne düşer.
  - `info@zenweld.com`'a "Yeni servis talebi" e-postası gider.
  - Ekranda "Servis talebiniz alındı — Talep numaranız <no>. Servis ekibimiz en
    kısa sürede sizinle iletişime geçecek." yazar.
  - **Yeni talep oluştur** düğmesi makine, model, şikayet, nedenler ve onayı
    temizler; iletişim bilgileri kalır.

### Welders Club (`/welders-club`)

- **Avantajlar:** Üyelere özel indirimler, Teknik eğitim içerikleri, Etkinlik
  ve fuar davetiyeleri, Yeni ürünlere erken erişim. Açıklama metinleri yer
  tutucudur.
- **Katılım formu:**
  - Zorunlu: Ad, E-posta.
  - İsteğe bağlı: Şehir.
  - **Kulübe Katıl** düğmesi; bot tuzağı vardır.
- **Kayıt:** Kayıt tutulmaz; yalnızca `info@zenweld.com`'a "Welders Club
  katılım" e-postası gider.
- **Sonuç:**
  - Başarı: "Kulüp üyeliğiniz oluşturuldu!"
  - Hata: "Kaydınız şu an alınamadı. Lütfen tekrar deneyin ya da
    info@zenweld.com adresine e-posta gönderin."

---

## 17. Garanti

**Adresler ve seçim:**

| Adres | Sayfa |
|---|---|
| `/garanti` | Seçim ekranı |
| `/garanti/kayit` | Garanti Kaydı formu |
| `/garanti/sorgulama` | Garanti Sorgulama formu |
| `/garanti/kosullar` | Garanti Koşulları metni ([21. bölüm](#21-yasal-metinler)) |

- Seçim ekranında "Ne yapmak istiyorsunuz?" başlığı ve iki kart vardır:
  **Garanti Kaydı** ("Makinenizi online kaydederek garantinizi uzatın") ve
  **Garanti Sorgula** ("Ürününüzün garanti kapsamını ve detaylarını
  görüntüleyin").
- Seçim yapılınca o seçeneğin adresine gidilir ve form kartların hemen altında
  açılır. Kayıt ve sorgulamanın ayrı adresleri ve başlıkları vardır.

**Garanti Kaydı formu:**

- **Kişi bilgileri:**
  - Zorunlu: Ad Soyad, E-posta, Telefon, Şehir, Adres.
  - Posta Kodu: Zorunlu, 5 hane, yalnızca rakam.
- **Ürün bilgileri:**
  - **Ürün Kategorisi:** Zorunlu. Ekipmanlar bölümünün kategorileri, grup
    başlıklarıyla.
  - **Model:** Zorunlu. Kategorinin yayındaki ürünleri; önce kategori
    seçilmelidir.
  - **Seri Numarası:** Zorunlu; ipucu "Makinenin arka etiketinde yazar".
  - **Satıcı VKN:** Zorunlu, 10 ya da 11 hane; ipucu "Ürünü satın aldığınız
    firmanın vergi kimlik numarası (faturada yazar)".
- **"12 ay ücretsiz garanti uzatması istiyorum"** kutusu.
- KVKK notu ve bot tuzağı vardır.

**Kurallar:**

- Seri numarası büyük harfe çevrilip baştaki ve sondaki boşluklar silinerek
  saklanır. Aynı seri numarası ikinci kez kaydedilemez: "Bu seri numarası daha
  önce kaydedilmiş."
- E-posta küçük harfle saklanır; Garantilerim bu e-postayla eşleşir.
- **Garanti bitişi:** Kayıt tarihi + ürünün garanti süresi (ay; girilmemişse
  24) + uzatma istendiyse 12 ay. Ayrıntı: [IS-KURALLARI.md](IS-KURALLARI.md).
- **Hata mesajları:** "Posta kodu 5 haneli olmalıdır.", "Satıcı VKN 10 haneli
  (şahıs firmalarında 11 haneli) olmalıdır."

**Gönderince:**

- "Garanti kaydınız oluşturuldu." yazar; altında **Garanti Sorgula** ve
  (üyeyse) **Garantilerim** düğmeleri vardır.
- Kayıt panelde Garantiler'e düşer; `info@zenweld.com`'a "Yeni garanti kaydı"
  e-postası gider.

**Garanti Sorgulama:**

- **Arama:** Seri Numarası girilir (örnek ipucu: "ZW250-2026-004821").
  Büyük/küçük harf ve baştaki/sondaki boşluklar önemsizdir.
- **Bulunamazsa:** "Bu seri numarası ile kayıtlı bir garanti bulunamadı." ve
  **Garanti Kaydı →** (kayıt formuna geçer).
- **Bulunursa:** "Garanti kaydı bulundu" başlığı altında ürün, seri numarası,
  kayıt sahibi, kayıt tarihi ve garanti bitişi gösterilir.
  - Rozetler: Uzatılmış garantide "Uzatılmış garanti".
  - Bitiş günü geçmişse "Süresi Doldu". Bitiş günü dahil garanti geçerli
    sayılır.

---

## 18. Belgeler

Üç sayfa aynı düzendedir: **MSDS** (`/msds`), **Ultimate Kaynak Rehberi**
(`/kaynak-rehberi`) ve **Parti Sertifikaları** (`/parti-sertifikalari`).

- **Başlık ve açıklama:** Panelden (Belgeler) düzenlenir.
- **Liste:** Panelde verilen sırayla dizilir.
- **Satır:**
  - Dosya türü (PDF, DOCX…) ve belge adı.
  - Bağlı ürün "ad · kod": Ürün yayındaysa ürün sayfasına bağlantıdır, değilse
    düz yazıdır.
  - Sertifikalarda "Parti No: <no>".
  - Dosya boyutu (KB / MB) ve güncelleme tarihi.
  - Düğme: PDF'te **Görüntüle** (yeni sekmede açar), diğer dosyalarda
    **İndir**.
- **Arama kutusu:**
  - Yer tutucu: "Belge veya ürün ara…"; sertifikalarda "Belge, ürün veya parti
    no ara…".
  - Belge adı, ürün adı, ürün kodu ve parti numarasında arar.
  - Türkçe küçük harfle karşılaştırır; ı ile i aynı sayılır.
- **Boşsa:** "Henüz belge eklenmedi."
- **Dosya açılamazsa:** "Dosya açılamadı. Lütfen daha sonra tekrar deneyin."
- **Demo notu:** Yüklenen dosyalar yükleyen tarayıcıda saklanır; başka
  bilgisayarda açılmaz. Gerçek sistemde dosya depolama servisi gerekir.

---

## 19. Kurumsal sayfalar

### Hakkımızda (`/hakkimizda`)

İçerik panelden (Hakkımızda) gelir:

- **Üst kısım:** Başlık, alt başlık ve görsel.
- **Rakam kutuları:** Değer ve etiket.
- **Metin bölümleri:** Sıralıdır. Her bölümde başlık, metin ve isteğe bağlı
  görsel vardır. Görselli bölümlerde metin ve görsel yan yana durur, sırayla
  sağa-sola yer değiştirir.

Panelde kayıt yoksa varsayılan içerik gösterilir.

### Satış Temsilcilerimiz (`/satis-temsilcilerimiz`)

- **Giriş metni:** "Ürünlerimiz, fiyatlar ve kurumsal alımlar için bölgenizdeki
  satış temsilcimize telefon, WhatsApp veya e-posta ile doğrudan
  ulaşabilirsiniz."
- **Bölge düğmeleri:** "Tüm bölgeler" ve temsilcilerin bölgeleri (liste
  sırasıyla, tekrarsız). Yalnızca birden fazla bölge varsa görünür.
- **Kart:**
  - Fotoğraf (yoksa adın baş harfleri), ad, bölge, telefon, e-posta.
  - Düğmeler: **Ara** ve **WhatsApp**.
- **Boş bölge:** "Bu bölgede satış temsilcimiz bulunmuyor."
- Liste panelden yönetilir.

### Sık Sorulan Sorular (`/sss`)

- **Konu düğmeleri:** Tümü, Genel, Sipariş & Teklif, Garanti, Teknik.
- **Sorular:** Açılır-kapanır; ilk soru açık gelir. Sorular panelden yönetilir.

---

## 20. Blog, Haberler, Etkinlikler

İçeriklerin metni panelde basit biçimlendirmeyle yazılır: `## ara başlık`,
`- madde`, `**kalın**`. Punto ve renk panelin Görünüm ekranından değişir.

### Blog

- **Liste (`/blog`):**
  - Yalnızca yayındaki yazılar, yayın tarihine göre yeniden eskiye.
  - Kart: Kapak, kategori, başlık, "yazar · tarih".
- **Yazı (`/blog/<link>`):**
  - Üst kısımda başlık, "kategori · yazar · tarih" ve kapak.
  - Metin ve "← Blog" bağlantısı.
- Yayında olmayan yazı 404 verir; linki değişen yazının eski adresi yönlenir.
- Paylaşım önizlemesi yazı türündedir: yayın tarihi, yazar ve kapakla.
- Örnek yazıların metinleri yer tutucudur.

### Haberler

- **Liste (`/haberler`):**
  - Yalnızca yayındaki haberler, yayın tarihine göre yeniden eskiye; kartlar
    aynı boyutta, görsel kırpılmaz.
  - Kart: Başlık, özet (en fazla 3 satır) ve tarih.
  - Boşsa: "Henüz haber yok."
- **Haber (`/haberler/<link>`):**
  - "← Tüm haberler", tarih, başlık.
  - Kapak görseli kendi oranında gösterilir; afişler kırpılmaz.
  - Metin, **Fotoğraflar** galerisi (varsa) ve **Diğer haberler** (3 tane).
- Yayında olmayan haber 404 verir; eski link yönlenir.

### Etkinlikler

**Liste ("Etkinlik Takvimi", `/etkinlikler`):**

- **Filtreler:**
  - **Etkinlik Durumu:** Tüm Etkinlikler, Yaklaşan Etkinlikler, Geçmiş
    Etkinlikler.
  - **Ülke:** Etkinliklerin ülkeleri, alfabetik.
  - **Sıralama:** Tarihe göre yeniden eskiye (varsayılan), eskiden yeniye.
- **Sayı ve sıfırlama:** "<N> etkinlik" yazar. Filtre seçiliyse
  **Filtreleri Temizle** görünür.
- **Yaklaşan ve geçmiş ayrımı:** Etkinlik son gününün sonuna (23:59) kadar
  yaklaşan ya da devam eden sayılır.
- **Kart:**
  - Tarih bloğu: Gün aralığı, ay adı, yıl. Başlangıç ve bitiş ayları farklıysa
    "gg.aa - gg.aa" yazar.
  - Etkinlik logosu: Bütün logolar eşit görsel ağırlıkta ve kırpılmadan
    gösterilir.
  - Rozet: "Devam ediyor" ya da "<N> gün kaldı".
  - Başlık, özet, mekan ve **Detaylar**.
- **Boşsa:**
  - Yaklaşan filtresinde: "Planlanmış yaklaşan etkinlik yok." ve açıklaması.
  - Diğer durumlarda: "Seçtiğiniz filtrelere uygun etkinlik bulunamadı."
    (**Filtreleri Temizle** ile).

**Etkinlik sayfası (`/etkinlikler/<link>`):**

- "← Tüm etkinlikler", başlık (yazıldığı gibi; büyük harfe çevrilmez) ve logo.
- Açıklama ve **Fotoğraflar** galerisi.
- **Yan kutu:**
  - Tarih (başlangıç — bitiş).
  - Mekan (şehir · ülke).
  - **Etkinlik sitesi:** Girilmişse, yeni sekmede.
- Yayında olmayan etkinlik 404 verir; eski link yönlenir.

---

## 21. Yasal metinler

On bir sayfa vardır; adresleri sabittir. Başlık ve metin panelden (Yasal
Metinler) düzenlenir. Alt bilgideki "Politikalar & Yasal" listesi bu
sıradadır:

| Sayfa | Adres |
|---|---|
| Kullanım Koşulları | `/yasal/kullanim-kosullari` |
| Garanti Koşulları | `/garanti/kosullar` |
| Gizlilik Politikası | `/yasal/gizlilik` |
| Çerez Politikası | `/yasal/cerez-politikasi` |
| KVKK Aydınlatma Metni | `/yasal/kvkk` |
| Kişisel Verilerin İşlenmesi Politikası | `/yasal/kisisel-verilerin-islenmesi-politikasi` |
| Kişisel Veri Saklama ve İmha Politikası | `/yasal/kisisel-veri-saklama-ve-imha-politikasi` |
| Fiziksel Güvenlik Süreçlerine Yönelik Aydınlatma Metni | `/yasal/fiziksel-guvenlik-aydinlatma-metni` |
| İade ve Değişim | `/yasal/iade` |
| Ön Bilgilendirme Formu | `/yasal/on-bilgilendirme-formu` |
| Mesafeli Satış Sözleşmesi | `/yasal/mesafeli-satis-sozlesmesi` |

- **Sayfa düzeni:** Başlık, "Son güncelleme: <tarih>" ve metin.
- **Sözleşme sayfaları:** Ön Bilgilendirme Formu ile Mesafeli Satış
  Sözleşmesi'nde metnin üstünde boş sipariş tabloları vardır
  ([12. bölüm](#12-sözleşmeler)).
- **Arama motorları:** Metinler henüz taslak (yer tutucu) olduğu için bu
  sayfalar aramaya kapalıdır.

---

## 22. Bulunamayan sayfa (404)

Eşleşmeyen her adreste ve yayında olmayan içerikte, üst menü ve alt bilgiyle
birlikte "Aradığınız sayfa taşınmış veya kaldırılmış olabilir." yazar ve
**Ana sayfaya dön** düğmesi çıkar.

---

## 23. Arama motorları (SEO)

- **Başlık:** Her sayfanın başlığı "<sayfa başlığı> | ZENWELD" biçimindedir.
  Anasayfanınki "ZENWELD — Kaynak Makineleri ve Plazma Kesme Sistemleri".
  - Sabit sayfaların başlık ve açıklaması panelin **Sayfa SEO** ekranından
    değişir.
  - Ürün, grup, kategori, blog, haber ve etkinliklerinki kendi **SEO**
    sekmelerinden değişir; boş alanlar otomatik dolar.
- **Aramaya açıklık:** Site yalnızca gerçek alan adında (`zenweld.com`,
  `www.zenweld.com`) arama motorlarına açıktır. Demo adresinde, önizleme
  sürümlerinde ve bilgisayarda her sayfa "noindex" taşır ve site haritası
  bildirilmez.
- **Her zaman kapalı sayfalar:** Yönetim paneli, Giriş, Üye Ol, Şifremi
  Unuttum, Çıkış, Sepet, Ödeme, Arama, Hesabım ve yasal metinler (taslak).
  Bunlar site haritasına da girmez.
- **robots.txt:** Yalnızca `/api/` taramaya kapalıdır. Gizli sayfalar bilerek
  engellenmez; Google sayfayı okuyamazsa "noindex" etiketini de göremez.
  Gerekçesi: [KARARLAR.md](KARARLAR.md).
- **Site haritası (`/sitemap.xml`):** Aramaya açık sabit sayfalar, gruplar,
  kategoriler, yayındaki ürünler (son değişiklik tarihiyle), blog yazıları ve
  haberler (yayın tarihiyle) ve etkinlikler.
- **Asıl adres ve önizleme:** Her sayfa kendi adresini asıl adres (canonical)
  olarak bildirir. WhatsApp, LinkedIn ve X'te paylaşınca başlık, açıklama ve
  görselle önizleme çıkar.
- **Yapısal veri:** Anasayfada şirket bilgisi ve sık sorulan sorular; ürün
  sayfasında ürün; katalog ve ürünlerde konum satırı Google'a bildirilir.
- **Demo notu:** Panelde yapılan değişiklikleri (yeni ürün, değişen başlık,
  yeni link) sunucu bugün göremez:
  - Site haritası ve arama motorunun gördüğü başlıklar koddaki örnek veriden
    üretilir.
  - Eski linkler tarayıcıda yönlenir; arama motoru için kalıcı (301)
    yönlendirme backend ile yapılacak.
  - Ayrıntı: [YAPILACAKLAR.md](YAPILACAKLAR.md).

---

## 24. Bütün sayfa adresleri

| Adres | Sayfa |
|---|---|
| `/` | Anasayfa |
| `/ekipmanlar`, `/guvenlik`, `/aksesuarlar`, `/dolgu-metalleri` | Bölüm sayfaları |
| `/<bölüm>/<grup>` | Grup sayfası |
| `/<bölüm>/<grup>/<kategori>` | Kategori sayfası |
| `/urun/<link>` | Ürün sayfası (`?secenek=<değer>` ile seçenekli açılır) |
| `/arama?q=<sorgu>` | Arama sonuçları |
| `/urun-secici` | Ürün Seçici (`?malzeme=celik` ön seçimi) |
| `/yetkili-bayi-ve-servis-agi` | Bayi ve servis bulucu |
| `/sepet` | Sepet |
| `/odeme` | Ödeme |
| `/giris`, `/kayit`, `/sifremi-unuttum`, `/cikis` | Üyelik |
| `/hesabim` | Hesabım › Genel Bakış |
| `/hesabim/profil`, `/hesabim/tekliflerim`, `/hesabim/siparislerim`, `/hesabim/favorilerim`, `/hesabim/garantilerim`, `/hesabim/adreslerim` | Hesabım sayfaları |
| `/hesabim/siparislerim/<sipariş-no>` | Sipariş detayı |
| `/teklif-al` | Teklif Al |
| `/iletisim` | İletişim |
| `/bayilik-basvurusu` | Bayilik Başvurusu |
| `/servis-talebi` | Servis Talebi |
| `/welders-club` | Welders Club |
| `/garanti`, `/garanti/kayit`, `/garanti/sorgulama`, `/garanti/kosullar` | Garanti |
| `/msds`, `/kaynak-rehberi`, `/parti-sertifikalari` | Belgeler |
| `/hakkimizda`, `/satis-temsilcilerimiz`, `/sss` | Kurumsal ve destek |
| `/blog`, `/blog/<link>` | Blog |
| `/haberler`, `/haberler/<link>` | Haberler |
| `/etkinlikler`, `/etkinlikler/<link>` | Etkinlikler |
| `/yasal/<metin>` | Yasal metinler ([21. bölüm](#21-yasal-metinler)) |
| `/yonetim` | Yönetim paneli ([ADMIN-KULLANIM.md](ADMIN-KULLANIM.md)) |
| `/sitemap.xml`, `/robots.txt` | Arama motorları için |

---

## 25. Bilinen durumlar

Bugünkü sitede bilinen, karar bekleyen ya da sonraya bırakılmış durumlar:

- **Teklif Al metinleri:** Teklif listesi boşken "Ürün sayfalarından ürün
  ekleyebilirsiniz." yazıyor. Ürün sayfasında teklif düğmesi olmayacağına
  karar verildiği için bu metin değişecek; ürünler Teklif Al sayfasındaki
  listeden eklenir. Değişiklik, Teklif Al metinlerinin herkese hitap edecek
  şekilde yeniden yazılmasıyla birlikte yapılacak; o iş müdür kararını
  bekliyor ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
- **Bülten kaydı:** Hiçbir yere gönderilmez; bülten servisi seçilince
  bağlanacak.
- **Çerez ayarları penceresi:** Henüz boştur; analiz ve pazarlama
  kategorileri sonra eklenecek.
- **Yer tutucu metinler:** Anasayfadaki "Neden Zenweld?", ürünlerin Garanti
  sekmesi, Welders Club avantaj açıklamaları, boş Adreslerim açıklaması, yasal
  metinler ve örnek blog yazıları lorem ipsum'dur.
- **Kategori filtreleri:** Kategori sayfasında bugün yalnızca sıralama var;
  her kategorinin kendi filtreleri ileride eklenecek.
- **Ürün Seçici ve kaynak yöntemi:** Ürün Seçici ve aramadaki yöntem
  eşleşmesi (MIG, TIG, MMA…) ürünlerdeki eski "kaynak yöntemi" bilgisine
  bakar. Bu alan panelin ürün formunda yok, bu yüzden panelden eklenen yeni
  ürünler Ürün Seçici sonuçlarında çıkmaz. Ürün Seçici yeniden tasarlanacak
  ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
- **İlgili Ürünler:** Bugün aynı kategorideki ilk 4 ürün gösteriliyor; öneri
  mantığı yeniden kurgulanacak ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
