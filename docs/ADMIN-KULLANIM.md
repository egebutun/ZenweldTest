# Yönetim Paneli Kullanımı — Panelin Özellikleri

Bu dosya yönetim panelindeki (`/yonetim`) her ekranı tarif eder: ekranda ne
olduğu, hangi alanların zorunlu olduğu, hangi mesajların çıktığı, kaydedince
sitede ne değiştiği. Tasarım (renk, yerleşim) anlatılmaz.

İlgili dosyalar:

- Bu içeriklerin sitede nasıl göründüğü: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md)
- Fiyat, KDV, kampanya, taksit, sipariş ve garanti kurallarının ayrıntısı:
  [IS-KURALLARI.md](IS-KURALLARI.md)
- Kayıtların alanları ve tablolar: [VERI-MODELI.md](VERI-MODELI.md)
- Bayi ve online satıcı stoklarının ayrıntısı: [STOK.md](STOK.md)
- Ödeme, e-posta ve harita servisleri: [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)

**Demo notu** ile işaretli yerler bugünkü demonun sınırlarıdır (verinin
tarayıcıda durması gibi); gerçek sistemde farklı çalışacaktır.

Panelin giriş bilgileri yalnızca [README](../README.md)'de yazar.

---

## İçindekiler

1. [Giriş ve panel çerçevesi](#1-giriş-ve-panel-çerçevesi)
2. [Ortak davranışlar](#2-ortak-davranışlar)
3. [Panel (ana sayfa)](#3-panel-ana-sayfa)
4. [Siparişler](#4-siparişler)
5. [Teklifler](#5-teklifler)
6. [Mağaza Ayarları](#6-mağaza-ayarları)
7. [Ürünler](#7-ürünler)
8. [Kategoriler ve gruplar](#8-kategoriler-ve-gruplar)
9. [Seçenek Tanımları](#9-seçenek-tanımları)
10. [Stok Matrisi](#10-stok-matrisi)
11. [Yorumlar](#11-yorumlar)
12. [Bayiler](#12-bayiler)
13. [Online Satıcılar](#13-online-satıcılar)
14. [Satış Temsilcileri](#14-satış-temsilcileri)
15. [Üyeler](#15-üyeler)
16. [Servis Talepleri](#16-servis-talepleri)
17. [Garantiler](#17-garantiler)
18. [Haberler, Etkinlikler, Blog](#18-haberler-etkinlikler-blog)
19. [Hakkımızda](#19-hakkımızda)
20. [Sık Sorulan Sorular](#20-sık-sorulan-sorular)
21. [Belgeler](#21-belgeler)
22. [Yasal Metinler](#22-yasal-metinler)
23. [Sayfa SEO](#23-sayfa-seo)
24. [Görünüm](#24-görünüm)
25. [Siteden panele gelenler](#25-siteden-panele-gelenler)
26. [Bütün panel adresleri](#26-bütün-panel-adresleri)
27. [Bilinen durumlar](#27-bilinen-durumlar)

---

## 1. Giriş ve panel çerçevesi

**Yeri:**

- Panel sitenin içinde, kendi bölümünde çalışır: `zenweld.com/yonetim`.
- Sitenin üst menüsü ve alt bilgisi panelde yoktur.
- Sitede panele giden hiçbir bağlantı yoktur.
- Panel yalnızca Türkçedir.
- Panel sayfaları arama motorlarına her zaman kapalıdır (sayfa etiketi ve
  sunucu başlığı ile).
- Tarayıcı sekmesinde bütün panel sayfalarında "Zenweld Yönetim Paneli"
  yazar.

**Oturum:**

- Panelin kendi giriş ekranı ve kendi oturumu vardır; sitedeki üye
  oturumundan ayrıdır.
- Panele yalnızca **Yönetici** rolündeki hesaplar girebilir. Sitenin "Giriş
  Yap" sayfası yönetici hesabını kabul etmez.
- Panelden çıkış yapmak sitedeki oturumu etkilemez; tersi de geçerlidir.
- Girişsiz açılan her panel sayfası `/yonetim/giris?next=<sayfa>` adresine
  gider. Giriş yapılınca istenen sayfa açılır; yalnızca `/yonetim` ile
  başlayan adreslere dönülür.
- Zaten giriş yapılmışsa giriş ekranı doğrudan panele geçer.
- Yöneticinin hesabı askıya alınırsa açık oturumu hemen kapanır.

**Giriş ekranı:**

- Alanlar: E-posta, Şifre. Düğme: **Giriş Yap**.
- Altta "Bu sayfa yalnızca Zenweld çalışanları içindir." yazar.
- Hata mesajları sitedeki girişle aynıdır:
  - "Bu e-posta ile kayıtlı bir hesap bulunamadı."
  - "Şifre hatalı."
  - "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin."

**Üst çubuk:**

- Logo ve "Yönetim Paneli".
- **Siteyi aç** (yeni sekmede).
- Giriş yapan yöneticinin adı.
- **Çıkış** (giriş ekranına döner).

**Sol menü:**

- En üstte **Panel** (ana sayfa).
- Altında gruplar vardır. Grup başlığına tıklayınca sayfaları açılır; açık
  olan sayfanın grubu kendiliğinden açık gelir.

| Grup | Sayfalar |
|---|---|
| Satış | Siparişler · Teklifler · Mağaza Ayarları |
| Ürünler | Ürünler · Kategoriler · Seçenek Tanımları · Stok Matrisi · Yorumlar |
| Bayi ve Satış Ağı | Bayiler · Online Satıcılar · Satış Temsilcileri |
| Müşteriler ve Servis | Üyeler · Servis Talepleri · Garantiler |
| İçerik | Haberler · Etkinlikler · Blog · Hakkımızda · Sık Sorulan Sorular · Belgeler · Yasal Metinler · Sayfa SEO |
| Ayarlar | Görünüm |

**Bulunamayan panel sayfası:** "Sayfa bulunamadı" ve **Panele dön**
düğmesi.

**Demo notu:**

- Yetki kontrolü yalnızca tarayıcıda yapılır; canlıya çıkmadan önce sunucu
  tarafında kimlik doğrulama şarttır.
- Panelde yapılan her değişiklik tarayıcının yerel deposuna yazılır.
  Başlangıç verisi `packages/data` içindeki örnek verilerdir.

---

## 2. Ortak davranışlar

**Kaydetme:**

- Formlu ekranlarda (ürün, kategori, grup, haber, etkinlik, blog, yasal
  metin) altta **Kaydet** ve **Vazgeç** vardır. Vazgeç bir önceki sayfaya
  döner.
  - Yeni kayıtta düğme "…Oluştur" adını taşır (ör. **Ürünü Oluştur**).
    Kayıttan sonra düzenleme sayfası açılır.
  - Düzenlemede düğme **Değişiklikleri Kaydet**'tir. Kayıttan sonra yeşil
    "… kaydedildi." mesajı kısa süre görünür.
- Hata olursa formun üstünde kırmızı mesaj çıkar ve form hatanın olduğu
  sekmeye geçer.
- Pencereli ekranlarda (bayi, satıcı, temsilci, SSS, seçenek tanımı, POS)
  pencere **Kaydet** ile kapanır, **Vazgeç** ile değişiklik atılır.
- Listedeki küçük işlemler (yayına al/kaldır, sıra okları, durum seçimi,
  rol seçimi) anında kaydedilir.

**Depo dolu uyarısı (Demo notu):**

- Tarayıcı deposuna yazılamazsa sayfanın üstünde kırmızı bant çıkar:
  "Kaydedilemedi: tarayıcı deposu dolu, son değişiklik uygulanmadı. Büyük
  görselleri ya da kullanılmayan kayıtları silip tekrar deneyin." Bant
  **Kapat** ile kapatılır.
- Bu durumda formlar "kaydedildi" mesajı göstermez.

**Silme:**

- Her silmeden önce onay sorulur. Mesaj çoğunlukla ""<ad>" silinsin mi? Bu
  işlem geri alınamaz." biçimindedir.

**Yayında olmayan kayıt:**

- Listede soluk görünür; sitede görünmez (adresi açılırsa 404).

**Görsel yükleme (tüm panel):**

- Görsel iki yolla eklenir: adres (URL) yazarak ya da dosya yükleyerek.
- Yüklenen dosya tarayıcıda otomatik küçültülür ve gerekirse WebP'ye
  çevrilir.
  - 300 KB'tan küçük dosyaya dokunulmaz.
  - En küçük halinde bile 1,5 MB'a sığmazsa reddedilir: "<dosya>
    küçültüldükten sonra bile çok büyük. Lütfen daha düşük çözünürlüklü bir
    görsel seçin veya URL girin."
  - Okunamayan dosya: "<dosya> okunamadı. Farklı bir dosya deneyin."
- Logo alanlarında görselin çevresindeki boş beyaz kenar kırpılır.
- Tek görsel alanlarında (temsilci fotoğrafı, Hakkımızda görselleri)
  yüklenen dosyanın adresi "(yüklenen dosya)" diye görünür ve elle
  değiştirilemez; **Kaldır** ya da yeni dosya ile değişir.
- **Demo notu:** Yüklenen görsel veritabanının içine yazılır; gerçek
  sistemde dosya deposuna yüklenecek.

**Biçimli metin alanları:**

- Haber, etkinlik, blog, Hakkımızda, yasal metin ve kategori/grup tanıtım
  metinlerinde şu biçimler kullanılabilir:
  - Boş satır yeni paragraf başlatır.
  - Satır başında `## ` ara başlık yapar.
  - Satır başında `- ` madde yapar.
  - `**kelime**` kalın görünür.
- Bu metinlerin punto ve renkleri [Görünüm](#24-görünüm) ekranından
  ayarlanır.

**SEO sekmesi** (ürün, kategori, grup, haber, etkinlik, blog):

- **Link:**
  - Adresin sabit kısmı solda yazar (ör. `/urun/`), yalnızca son kısım
    yazılır.
  - "Linkte Türkçe karakter ve boşluk kullanılmaz; yazdığınız metin
    otomatik düzeltilir." (ğ→g, ş→s, boşluk→tire).
  - Yeni kayıtta link addan/başlıktan kendiliğinden oluşur. Boş bırakılırsa
    kayıtta addan üretilir.
  - Adda hiç Latin harf ya da rakam yoksa kayıt yapılmaz: "Link
    oluşturulamadı: adda Latin harf ya da rakam yok. SEO sekmesinde Latin
    harf ve rakamlarla bir link yazın."
  - Aynı türde başka bir kayıt aynı linki kullanıyorsa kayıt yapılmaz
    (mesajlar ilgili ekranda).
- **Link değişince:**
  - Uyarı: "Kaydedince eski link <eski> yeni linke yönlendirilir;
    paylaşılmış bağlantılar ve Google'daki eski sonuç çalışmaya devam eder."
  - Kayıttan sonra "Yeni linke yönlenen eski linkler" listesi görünür.
  - Yeni link başka bir kaydın eski linkiyse o eski yönlendirme kalkar.
- **Sayfa Başlığı:** Boş bırakılırsa otomatik başlık kullanılır (kutuda
  gri yazar). Sayaç 60 karakterdir.
- **Açıklama:** Boş bırakılırsa kaydın kısa açıklaması/özeti kullanılır.
  Sayaç 160 karakterdir.
- Sınır aşılınca sayaç kırmızı olur: "— Google bu uzunlukta kesebilir".
  Kayıt engellenmez.
- **Anahtar Kelimeler:** Virgülle ayrılır; aynı kelime iki kez yazılırsa
  bir kez saklanır. "Site içi aramada bu kelimelerle de bulunur ve sayfanın
  keywords etiketine yazılır."
- **Google Önizlemesi:** Arama sonucundaki görünüm (`zenweld.com › urun ›
  link`, başlık, açıklama). Açıklama yoksa "Açıklama girilmedi."

**Arama kutuları:** Türkçe büyük/küçük harfe duyarsızdır ("İ" ve "ı"
doğru eşleşir).

**CSV indirme:** Siparişler hariç liste ekranlarındaki **CSV İndir**,
ekrandaki süzülmüş listeyi indirir (Teklifler, Üyeler, Garantiler).

**Müşteriye bildirim:** Panelde yapılan hiçbir değişiklik müşteriye
e-posta göndermez. Müşteri sipariş, teklif ve garanti durumunu sitedeki
Hesabım sayfasında görür.

---

## 3. Panel (ana sayfa)

Adres: `/yonetim`. Başlık: "Panel — Satış, teklif ve müşteri özetleri."

**Dönem seçimi:**

- Seçenekler: Bugün / Son 7 gün / Son 30 gün (varsayılan) / Son 90 gün.
- Seçim tarayıcıda hatırlanır ve bütün grafikleri sınırlar.
- Kırılım: Bugün saatlik, 7 ve 30 gün günlük, 90 gün haftalık.
- Değişim yüzdeleri bir önceki eşit dönemle karşılaştırılır; önceki dönemin
  yalnızca **aynı saatine kadarki** kısmı sayılır. Örneğin bugün 09:00'da
  "Bugün" seçiliyse dünün 00:00–09:00 arası alınır; süren gün tam bir günle
  karşılaştırılmaz.

**Özet kutuları** (önceki döneme göre değişimle):

- **Ciro:** İptal hariç siparişlerin tahsil edilen toplamı (KDV ve vade
  farkı dahil).
- **Sipariş:** İptal hariç sipariş sayısı.
- **Ortalama sepet.**
- **Yeni üye:** Yöneticiler sayılmaz.

**Grafikler:**

1. **Ciro:** Zamana göre, KDV dahil, iptal hariç. En yüksek değer
   etiketlidir; ipucunda sipariş sayısı vardır; tablo görünümüne geçilebilir.
2. **Sipariş durumları:** Dönemde verilen siparişlerin şu anki durumu; ayrıca
   şu an işlem bekleyenler (ödeme bekleyen + hazırlanan).
3. **Ödeme yöntemi:** Kart–tek çekim / Kart–taksitli / Havale-EFT; adet ve
   ciro. Taksit sayılarının dağılımı.
4. **En çok satan ürünler:** Ciroya göre ilk 5 (üzerine gelince adet).
5. **Ürün grubuna göre ciro:** İlk 12; grubu olmayan "Diğer".
6. **Teklif hunisi:**
   - Gelen talep → İncelenen (Yeni olmayan) → Teklif verilen (Gönderildi,
     Kazanıldı, Kapandı) → Kazanılan.
   - Kazanma oranı = kazanılan ÷ (kazanılan + kapanan).
7. **Yeni üyeler:** Bireysel ve kurumsal.
8. **Şehirlere göre sipariş:** Teslimat iline göre, ilk 10.
9. **Servis ve garanti:** Servis talebi ve garanti kaydı sayıları; en çok
   servis istenen 5 model.

- Grafiklerin üzerine gelince ayrıntı kutusu açılır.
- Ciro, Yeni üyeler ve Servis ve garanti grafiklerinde **Tablo olarak
  göster** ile bütün değerler tablo halinde görülür.

**Genel durum** (sayı kartları, ilgili ekrana gider). Üye, teklif ve sipariş
yalnızca ana sitenin kayıtlarıdır; bayi kayıtları sayılmaz.

- Aktif Ürün.
- Üye.
- Online Satıcı (aktif olanlar).
- Teklif (altında "N yeni").
- Sipariş (altında "N işlem bekliyor" = ödeme bekleyen + hazırlanan).
- Garanti Kaydı.
- Etkinlik (aktif; altında "N yaklaşan" ya da "yaklaşan etkinlik yok").
- Haber (aktif).

**Hiçbir online satıcıda stokta olmayan ürünler:**

- Sayı rozetli başlık ve ilk 12 ürünün bağlantısı.
- "Bu ürünlerin sayfasında "online satıcı" bölümü boş görünür. Stok
  matrisinden güncelleyebilirsiniz."
- Ürüne tıklanınca Stok Matrisi › Ürün Bazında o ürün açık ve en üstte
  gelir.

**Son Teklifler ve Son Siparişler:**

- Son 5 teklif (firma veya yetkili, tarih) Teklifler'e gider.
- Son 5 sipariş (kod, tutar) sipariş detayına gider.
- Boşsa "Henüz teklif yok." / "Henüz sipariş yok."

**Demo notu:**

- Panel açılınca ödeme süresi dolan havale siparişleri iptal edilir (gerçek
  sistemde zamanlanmış görev yapacak).
- Grafiklerdeki örnek hareketler (son 90 güne yayılmış örnek üye, sipariş,
  teklif, servis talebi ve garanti kaydı)
  `packages/data/src/seed/sample-activity.seed.ts` dosyasından gelir. Canlıya
  çıkmadan önce silinmelidir.

---

## 4. Siparişler

Üyelerin sitede verdiği online siparişler. Siparişin kuralları (durumlar,
kod, havale süresi) için bkz. [IS-KURALLARI.md](IS-KURALLARI.md).

### Liste

Adres: `/yonetim/siparisler`. Açıklama: "Üyelerin sitede verdiği online
siparişler. Havale ödemesini onaylamak, kargo takip numarası girmek için
siparişi açın."

- **Sekmeler** (sayılı): Tümü / Ödeme Bekleniyor / Hazırlanıyor / Kargoda /
  Teslim Edildi / İptal.
- **Arama:** Sipariş no, müşteri adı, e-posta, fatura firma adı.
- **Tablo:** Kod, tarih, müşteri, ürünler (adet × ad), tutar, ödeme ("Kart",
  "Kart · N taksit" ya da "Havale/EFT"), durum rozeti.
- Satıra tıklayınca sipariş detayı açılır.
- Boşsa "Henüz sipariş yok." / "Bu filtreye uyan sipariş yok."
- Panelde sipariş oluşturulmaz ve silinmez.

### Sipariş detayı

Adres: `/yonetim/siparisler/<id>`. Başlıkta sipariş kodu, tarih-saat ve
müşteri adı; **← Tüm siparişler** bağlantısı. Bulunamazsa "Sipariş
bulunamadı."

**İşlem kartı** (siparişin durumuna göre):

| Durum | Ekranda | Düğme | Sonuç |
|---|---|---|---|
| Ödeme Bekleniyor | "Havale/EFT bekleniyor. Son ödeme tarihi: <tarih>. Açıklamada <kod> yazan ödeme hesaba geçince onaylayın." | **Ödeme Alındı** | Hazırlanıyor |
| Hazırlanıyor | "Sipariş kargoya verildiğinde firmayı ve takip numarasını girin; müşteri hesabında görür." Kargo firması + Takip numarası | **Kargoya Ver** | Kargoda |
| Kargoda | "Takip numarasında hata varsa düzeltip kaydedebilirsiniz." Kargo firması + Takip numarası | **Kaydet** ve **Teslim Edildi** | Kaydet: bilgi düzelir; Teslim Edildi: Teslim Edildi |
| Teslim Edildi / İptal | "Bu sipariş teslim edildi/iptal edildi; başka işlem yok." | — | — |

- **Ödeme Alındı:** Havale süresi son ödeme **gününün sonunda** (23:59) dolar.
  Süre dolmuşsa sipariş onaylanmaz; "Ödeme süresi doldu" notuyla iptal edilir.
- **Kargo firması** listesi [Mağaza Ayarları](#6-mağaza-ayarları)'ndan
  gelir. Sonradan listeden çıkarılmış ama siparişte kayıtlı firma "<firma>
  (listede yok)" diye görünür.
- Kargo firması ve takip numarası zorunludur: "Kargo firması ve takip
  numarası zorunludur."
- Takip numarası düzeltilince ilk kargoya verilme tarihi değişmez.
- **Siparişi İptal Et:** Teslim edilmemiş ve iptal edilmemiş her siparişte
  vardır.
  - "İptal nedeni (müşteri görür)" alanı açılır; boş bırakılabilir.
  - Ödemesi alınmış siparişte uyarı: "Ödeme alınmış bir sipariş. İadeyi
    ödeme kuruluşu / banka üzerinden ayrıca yapmanız gerekir."
  - **İptal Et** / **Vazgeç**.

**Ürünler:**

- Ürün adı; altında ürün kodu ve seçenek ("ZW-TRC-MB25-5 · Hortum Uzunluğu:
  5 m").
- Adet, Birim (KDV dahil), Tutar.
- Ara toplam, İçindeki KDV, Kargo (0 ise "Ücretsiz"), Vade farkı (varsa),
  **Toplam**.
- Bütün bilgiler sipariş anındaki kopyadır; ürün sonradan değişse ya da
  silinse de sipariş değişmez.

**Adresler:**

- **Teslimat Adresi:** Ad soyad, telefon, adres, ilçe / il.
- **Fatura Bilgileri:** Kurumsalda firma, vergi dairesi ve VKN; bireyselde
  ad soyad ve TC kimlik no; altında fatura adresi.

**Sağ sütun:**

- **Durum:** Rozet ve geçmiş (her adımın durumu, tarih-saati, varsa notu).
- **Müşteri:** Ad, e-posta, telefon, **Üyeler sayfası →**.
- **Ödeme:**
  - Yöntem: "Kredi / banka kartı" ya da "Havale / EFT".
  - Kartta: Kart (marka •••• son 4 hane), Program, POS, Taksit ("Tek çekim"
    ya da "N taksit").
  - Kartta **Banka komisyonu (tahmini):** Sipariş anındaki firma taksit oranı
    × toplam. **Net tahsilat (tahmini):** toplam − komisyon. Kesin tutar
    banka ekstresindedir.
  - Havalede Son ödeme tarihi.
  - Ödendi (tarih-saat ya da —), Sözleşme onayı (tarih-saat).
- **Müşteri Notu:** Müşteri ödeme sayfasında not yazdıysa.
- **İç Not:** "Yalnızca panelde görünür"; **Notu Kaydet** → "Kaydedildi".

**Demo notu:** Kartla ödeme gerçek değildir; sipariş kaydı ve akış gösterim
içindir.

---

## 5. Teklifler

Adres: `/yonetim/teklifler`. Açıklama: "<N> teklif talebi".

Sitedeki Teklif Al formundan gelen talepler. Panelde fiyat girilmez; teklif
satış ekibi tarafından hazırlanıp e-postayla gönderilir. Bayilerin teklifleri
burada değildir (ileride ayrı B2B uygulamasında).

- **Durum süzgeci:** Tüm durumlar / Yeni / İnceleniyor / Teklif Gönderildi /
  Kazanıldı / Kapandı.
- **CSV İndir** (`zenweld-teklifler.csv`): kod, firma (yoksa yetkili),
  yetkili, e-posta, telefon, şehir, ödeme tercihi, vade, ürünler ("2x Ad
  (seçenek) | …"), durum, tarih.
- **Satır:** Kod, durum rozeti, ödeme tercihi rozeti (Vadeli / Çek /
  Havale/EFT / Görüşülecek), firma ya da yetkili, tarih-saat. Tıklayınca
  açılır; aynı anda tek satır açık kalır.

**Açık satır:**

- **Firma Bilgileri:** Yetkili, E-posta, Telefon, Vergi No (yoksa —), Şehir,
  Vade (vadeli ise "N gün").
- **Ürünler:** "adet × ad — seçenek (kod)". Teklif anındaki kopyadır.
- **Müşteri Notu** (varsa).
- **Durum:** Seçilince hemen kaydedilir. Müşteri durumu Hesabım ›
  Tekliflerim'de görür.
- **Atanan Satış Temsilcisi:** Serbest metin ("Örn. Satış – Mehmet B.");
  alandan çıkınca kaydedilir.
- **İç Not:** Alandan çıkınca kaydedilir.
- **E-posta Gönder:** E-posta programını açar; konu "Zenweld Teklif <kod>".
- **Sil:** "<kod> silinsin mi?". Silinen teklifin numarası yeniden
  kullanılmaz.

---

## 6. Mağaza Ayarları

Adres: `/yonetim/magaza`. Açıklama: "Online satışta kargo ücreti, taksit
seçenekleri ve havale/EFT hesapları."

**Kaydetme:**

- Ekranın tamamı üstteki tek **Kaydet** düğmesiyle saklanır.
- "Kaydedilmemiş değişiklikler var. Saklamak için Kaydet'e basın." /
  "Mağaza ayarları kaydedildi."
- Ayarlar başka bir sekmede kaydedilirse ekran yenilenir; bu ekranda
  kaydedilmemiş değişiklik varsa korunur.

**Kargo:**

- **Ücretsiz kargo sınırı (₺, KDV dahil):** Sepet bu tutar ve üzerindeyse
  kargo ücretsiz. Örnek değer 5.000 ₺.
- **Kargo ücreti (₺, KDV dahil):** Sınırın altındaki siparişlerde. Örnek değer
  250 ₺.
- **Kargo firmaları:** Her satıra bir firma; sipariş kargoya verilirken
  seçilir. En az bir firma zorunlu: "En az bir kargo firması girin."

**Kartla Taksit:**

- Açıklama: "Her bankanın kendi taksit seçenekleri ve komisyonu vardır.
  Ödeme sayfasında kart, programı eşleşen bankanın taksitleriyle çekilir;
  eşleşmeyen kartlar varsayılan POS'tan tek çekim ödenir."
- **Taksit için en düşük sipariş tutarı (₺).** Örnek değer 1.000 ₺.
- Ödeme sayfasında kart, programı eşleşen **ilk aktif** POS'un taksitleriyle
  çekilir. Eşleşmeyen kartlar varsayılan POS'tan (örnek veride iyzico) tek
  çekim ödenir.
- **POS tablosu:**
  - Sütunlar: Düzenle · Aktif (kutu) · Banka (kısa etiket) · Banka adı ·
    Mağaza no · POS adı · Firma taksit oranları (**Göster**) · Taksit
    oranları (**Göster**).
  - Banka adının altında "Program: <program>" ya da "Kart programı yok".
  - Varsayılan POS'ta "Varsayılan · diğer kartlar tek çekim".
  - Aynı programda listede daha üstte aktif bir POS varsa: "Kullanılmıyor:
    aynı programda üstte aktif POS var".
  - Pasif POS soluk görünür.
- Aktif varsayılan POS yoksa uyarı: "Aktif varsayılan POS yok: kart programı
  eşleşmeyen kartlarla ödeme alınamaz. Bir POS'u düzenleyip "Diğer kartlar
  için varsayılan" işaretleyin."
- **POS Ekle / POS'u Düzenle penceresi:**
  - **Banka (etiket)** (zorunlu): "Listede logo yerine görünen kısa ad".
  - **Banka adı** (zorunlu).
  - **Kart programı:** "Yok (yalnızca tek çekim)", Bonus, World, Maximum,
    Axess, CardFinans, Paraf, Advantage, BankkartCombo. "Bu programdaki
    kartlar bu POS'un taksitleriyle çekilir".
  - **Mağaza no:** "Bankanın verdiği üye işyeri numarası".
  - **POS adı.**
  - **Aktif.**
  - **"Diğer kartlar için varsayılan: kart programı eşleşmeyen kartlar bu
    POS'tan tek çekim ödenir".** Varsayılan tektir; işaretlenince diğer
    POS'lardan kalkar.
  - Düğmeler: **Uygula**, **Vazgeç**, **Sil** (onaylı).
  - Hata: "Banka etiketi ve banka adı zorunludur."
  - "Değişiklikler sayfanın üstündeki Kaydet ile saklanır."
- **Taksit Oranları penceresi** (müşteriye sunulan):
  - Satırlar: 2, 3, 6, 9, 12 taksit. Her satırda **Sunulsun** ve **Vade
    farkı (%)**.
  - "Vade farkı %0 ise müşteri peşin fiyatına taksit yapar, banka
    komisyonunu Zenweld öder."
  - POS'un kart programı yoksa: "Bu POS'un kart programı yok; yalnızca tek
    çekim yapılır, taksitler kullanılmaz."
- **Firma Taksit Oranları penceresi** (bankanın komisyonu):
  - Satırlar: Tek çekim, 2, 3, 6, 9, 12 taksit; **Komisyon (%)**.
  - "Bankanın bu POS'tan yapılan çekimlerde Zenweld'den kestiği komisyon.
    Müşteriye gösterilmez; panelde sipariş detayında tahmini komisyon ve net
    tahsilat olarak görünür."
  - Boş bırakılan satır kaydedilmez.
- Oranlarda virgül kullanılabilir. Hata: "Oranlar 0 veya daha büyük bir
  sayı olmalı."
- POS'un API anahtarı ve şifresi panelde **yoktur**; yalnızca sunucuda
  saklanır (bkz. [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)).

**Havale / EFT:**

- "Bu hesaplar ödeme sayfasında ve müşterinin sipariş detayında gösterilir."
- **Ödeme süresi (gün):** En az 1; örnek değer 3. "Dolunca sipariş iptal
  edilir." Süre son günün 23:59'unda dolar.
- **Hesaplar:** Banka, Alıcı, IBAN (büyük harfe çevrilir), sil.
- **Hesap Ekle:** Alıcı adı ilk hesaptan kopyalanır.
- Hata: "Her banka hesabında banka adı ve IBAN zorunludur."

**Önemli:** Kargo ücreti, banka POS'ları (mağaza no, oranlar) ve IBAN'lar
örnek veridir; canlıya çıkmadan gerçek değerler girilmelidir.

---

## 7. Ürünler

### Liste

Adres: `/yonetim/urunler`. Açıklama: "<N> ürün listeleniyor".

- **Yeni Ürün** düğmesi.
- **Arama:** "Ürün adı veya SKU ara…".
- **Bölüm süzgeci:** Tüm bölümler / Ekipmanlar / Güvenlik / Aksesuarlar /
  Dolgu Metalleri.
- **Sıralama:** Sitedeki gibi; menüdeki kategori sırası, kategori içinde
  Sıra numarası.
- **Tablo:**
  - Ürün: kapak görseli, ad, ürün kodu.
  - Kategori, Sıra (yoksa —).
  - Fiyat: KDV dahil normal fiyat; kampanya geçerliyse kampanya fiyatı ve
    üstü çizili normal fiyat. Altta "<KDV hariç> + KDV".
  - Durum: kampanya rozeti, yayında değilse "Yayında değil".
  - İşlem: göz (**Yayından kaldır** / **Yayına al**, anında), kalem
    (**Düzenle**), çöp (**Sil**).
- **Kampanya rozeti:**
  - "Planlandı %X · <tarih> başlar"
  - "Kampanya %X · <tarih>'e kadar" ya da "Kampanya %X · süresiz"
    (%25 ve üzeri "Flaş Kampanya")
  - "Kampanya bitti (%X)"
- **Sil:** ""<ad>" silinsin mi? Bu işlem geri alınamaz."
  - Ürünün bayi ve satıcı stok satırları ile kod eşleştirmeleri de silinir.
  - Ürünün linki boşa çıkar; başka bir ürün bu linki alabilir.
  - Belgelerdeki ürün bağlantısı kalkar; belge kalır.
  - Sipariş ve teklifler kendi kopyalarını korur.

### Ürün formu

- **Yeni:** `/yonetim/urunler/yeni`. "Kataloğa yeni bir ürün ekleyin.
  Kaydettikten sonra stok matrisinden satıcı stoklarını
  işaretleyebilirsiniz."
- **Düzenleme:** `/yonetim/urunler/<id>`. Başlıkta ad, "SKU: <kod>" ve
  **Ürün sayfasını gör ↗**. Bulunamazsa "Ürün bulunamadı."
- **Sekmeler** (sayı rozetli): Temel Bilgiler · Açıklamalar · Görseller ·
  Teknik Özellikler · Kutu İçeriği · Seçenekler · SEO.
- **Yeni ürünün başlangıç değerleri:** Bölüm Ekipmanlar, bölümün ilk
  kategorisi, KDV %20, garanti 24 ay; Yayında, Teklife açık ve Yeni ürün
  rozeti işaretli.
- Kayıt: "Ürün kaydedildi."
- **Yeni ürün ve stok:** Yeni ürün hiçbir bayide ve online satıcıda stokta
  görünmez. Haritada ve online satıcılarda çıkması için bayi/satıcı stok
  dosyalarında yer alması gerekir ([Stok Matrisi](#10-stok-matrisi)). Sitede
  satın alınabilmesi için ayrıca bir şey gerekmez; yayındaki her ürün sepete
  eklenebilir.

#### Temel Bilgiler

- **Ürün Adı** (zorunlu): "Ürün adı zorunludur." Yeni üründe link addan
  oluşur. Ada marka ("Zenweld") yazılmaz; sayfa başlığına "| ZENWELD"
  kendiliğinden eklenir.
- **Ürün Kodu (SKU)** (zorunlu).
- **Model Kodu.**
- **Garanti (ay).**
- **Bölüm:** Değişince bölümün ilk kategorisi seçilir.
- **Kategori:** Yalnızca seçili bölümün kategorileri.
- **Sıra:** "Kategori sayfasında kaçıncı görünür (1 en başta). Boşsa
  kategorinin sonuna eklenir."
  - Küçük numara önce gelir; aynı numaralı ürünler ada göre dizilir.
  - Kategori sayfasındaki "Önerilen" sıralama, panel listesinin sırası ve
    kategori kartında görsel yoksa kullanılan ürün buna göre belirlenir.
- **Normal fiyat (KDV hariç, ₺)** (zorunlu): "İndirimsiz fiyat".
- **KDV (%).**
- **KDV dahil:** Hesaplanır, değiştirilemez.
- **Kampanya:**
  - "Bu ürüne kampanya / indirim uygula" işaretlenince alanlar açılır
    (başlangıç %10).
  - **İndirim oranı (%)** (zorunlu): "%1–%90. %25 ve üzeri "Flaş İndirim"
    olarak gösterilir."
  - **Başlangıç:** "Boş bırakılırsa hemen başlar".
  - **Bitiş:** "Boş bırakılırsa süresiz".
  - Canlı önizleme: Normal fiyat (üstü çizili), Kampanya fiyatı (KDV dahil)
    ve kampanya rozeti.
  - Seçenekli üründe: "Seçenekli ürün: aynı indirim oranı tüm seçeneklere
    (ör. 3 m / 5 m) uygulanır."
  - Hatalar: "İndirim oranı %1 ile %90 arasında tam sayı olmalıdır." /
    "Kampanya bitişi, başlangıçtan sonra olmalıdır."
- **Yayında (aktif)**, **Teklife açık** (Teklif Al listesinde çıkar), **Yeni
  ürün rozeti**.
- **Kullanım Kılavuzu (PDF bağlantısı).**

#### Açıklamalar

- **Kısa Açıklama**, **Detaylı Açıklama.**
- **Öne Çıkan Özellikler:**
  - **Ekle** ile satır eklenir; oklarla sıralanır, çöple silinir.
  - "İlk 3 tanesi menüdeki ürün kartında madde madde görünür." İlk 3 satır
    kırmızı numaralıdır ("Menüde görünür"); diğerleri gri ("Yalnızca ürün
    sayfasında").
  - Boşsa: "Henüz özellik eklenmedi. Özellik yoksa menüdeki kartta kısa
    açıklama gösterilir."

#### Görseller

- "Görsel URL'si girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar
  otomatik olarak küçültülüp WebP'ye çevrilir; boyutla uğraşmanıza gerek
  yok. İlk görsel kapak görselidir."
- **URL Ekle**; **Dosya Yükle** (birden çok dosya seçilebilir; seçilen
  sırayla eklenir).
- İlk görselde "Kapak" rozeti. Tutamaç görseli bir öne alır; çöp siler.
- Görselin alt metni ürün adıdır.
- Boşsa: "Henüz görsel eklenmedi. Görsel yoksa markalı Zenweld placeholder
  gösterilir."

#### Teknik Özellikler ve Kutu İçeriği

- **Teknik Özellikler:** **Satır Ekle** ile Özellik + Değer satırı; çöp
  siler.
- **Kutu İçeriği:** **Madde Ekle** ile metin satırı; çöp siler.

#### Seçenekler

Bir ürün tek sayfada seçenekleriyle satılabilir (ör. hortum uzunluğu 3 m /
5 m). Her seçeneğin kendi ürün kodu ve fiyatı olur. Kurallar:

- Bir üründe yalnızca bir seçenek adı olur (ör. yalnızca "Hortum
  Uzunluğu").
- Seçenekler ortak [Seçenek Tanımları](#9-seçenek-tanımları)'ndan gelir;
  ürünün kategorisinde işaretli olanlar listelenir.

**Seçeneği olmayan ürün:**

- "Ürün tek sayfada seçenekleriyle satılır (ör. 3 m / 5 m); her seçeneğin
  kendi ürün kodu ve fiyatı olur."
- **Seçenek** listesi ("Hortum Uzunluğu (3 m, 4 m, 5 m)") ve **Seçenek
  Ekle**.
- Kategoride işaretli seçenek yoksa: ""<Kategori>" kategorisinde işaretli
  seçenek yok. Seçenekler kategorinin Seçenekler sekmesinden işaretlenir:
  Kategoriyi aç".
- Kategori seçilmemişse: "Önce Temel Bilgiler sekmesinden kategori seçin."

**Seçenekli ürün:**

- Üstte "Seçenek: <ad>" ve **Seçeneği Kaldır**. Değer varsa onay sorulur:
  "Seçenek ve tüm değerleri bu üründen kaldırılsın mı?"
- Seçenek tanımı silinmişse: "Bu ürünün seçenek tanımı bulunamadı (silinmiş
  olabilir)." ve **Seçeneği Kaldır**.
- **Değer ekle:** Tanımdaki, bu üründe henüz olmayan değerler düğme olarak
  çıkar.
- "Listede olmayan bir değer gerekiyorsa Seçenek Tanımları ekranında "<ad>"
  tanımına ekleyin."
- Hiç değer yoksa: "Henüz değer eklenmedi. Bu üründe satılan değerleri
  aşağıdan ekleyin." Değersiz seçenek kaydedilmez.

**Her değerin kartı:**

- Başlıkta değer adı ve çöp (değeri bu üründen kaldırır).
- **Ürün kodu (SKU)** (zorunlu). Kutuda "ör. <ana kod>-…" ipucu.
- **Fiyat farkı (KDV hariç, ₺):** "Ana fiyata eklenir; eksi olabilir".
- **Normal fiyat:** Hesaplanır ("<KDV hariç> + KDV · <KDV dahil>").
- Bir zamanlar ayrı ürün olup bu seçeneğe dönüştürülen değerde: "Eski ürün
  linki /urun/<link> bu seçenekle açılır." Değer üründen kaldırılırsa bu
  yönlendirme de kalkar.
- **"Bu değerde farklı olanlar (isteğe bağlı)"** (doluysa açık gelir):
  - **Fotoğraf:** "Ürünün fotoğrafı" ya da ürünün görsellerinden biri.
    Üründe görsel yoksa: "Önce Görseller sekmesinden ürüne fotoğraf
    ekleyin." Seçilen fotoğraf sonradan üründen silinirse seçim de kalkar.
  - **Teknik özellik farkları:** "Yalnızca bu değerde farklı olan satırlar
    (ör. Ağırlık); aynı adlı satırın yerine geçer. "<Seçenek>: <değer>"
    satırı kendiliğinden eklenir." **Satır Ekle**.
  - **Kutu içeriği:** "Ürünün kutu içeriği kullanılıyor." ve **Bu değer için
    ayrı liste** (ürünün listesini kopyalar). Ayrı listede **Madde Ekle** ve
    **Ürünün listesine dön**.
- Boş satır ve maddeler kayıtta atılır.

**Kodların kuralı** (ürün kodu ve seçenek kodları tek havuzdadır; bayi ve
satıcı stok dosyaları bu kodlarla eşleşir):

- Kodlar karşılaştırılırken boşluklar atılır, büyük harfe çevrilir.
- Ürün kodu başka bir ürünün ya da başka bir ürünün seçeneğinin koduyla aynı
  olamaz:
  - "Ürün kodu (<kod>) "<ad>" ürününde kullanılıyor."
  - "Ürün kodu (<kod>) "<ad>" ürününün seçeneğinde kullanılıyor."
- Seçenek kodu:
  - Boş olamaz: ""<değer>" seçeneğinin ürün kodu zorunludur."
  - Ürünün kendi koduyla aynı olamaz: ""<değer>" seçeneğinin kodu (<kod>)
    ürünün kendi koduyla aynı olamaz."
  - Aynı ürünün başka değeriyle aynı olamaz: "… "<diğer değer>" seçeneğinde
    de var."
  - Başka ürün ya da seçenek koduyla aynı olamaz (yukarıdaki mesajlar).
- Seçeneğin fiyatı eksiye düşemez: ""<değer>" seçeneğinin fiyatı eksiye
  düşüyor."
- Hata olunca form Seçenekler sekmesine geçer.

**Kaydedince:**

- Üründen kaldırılan değerlerin bayi/satıcı stok satırları ve kod
  eşleştirmeleri silinir.
- Seçenek adı değiştirildiyse (başka tanım seçildiyse) ürünün bütün
  seçenekli stok satırları silinir.

**Ayrı bir ürünü seçeneğe dönüştürmek** (ör. "MB-25 MIG Torcu 4m" ürününü
"MB-25 MIG Torcu"nun 4 m seçeneği yapmak):

1. Ayrı ürün silinir; kodu boşa çıkar.
2. Ana ürüne değer eklenir ve o kod seçeneğe yazılır.
3. Silinen ürünün eski linkinin seçeneğe yönlenmesi bugün panelden
   kurulamaz (bkz. [Bilinen durumlar](#27-bilinen-durumlar)).

Seçenekli ürünün sitede nasıl göründüğü (fiyat, kod ve fotoğrafın seçime göre
değişmesi, `?secenek=` adresi, sepet ve teklif davranışı, seçime göre bayi ve
online satıcılar, ortak yorumlar):
[WEBSITE-KULLANIM.md › Ürün sayfası](WEBSITE-KULLANIM.md#6-ürün-sayfası).

#### SEO

- [Ortak SEO sekmesi](#2-ortak-davranışlar); link `/urun/<link>`.
- Başka ürün aynı linki kullanıyorsa: ""<link>" adresi "<ad>" ürününde
  kullanılıyor."
- Sayfa Başlığı boşsa "Ürün adı — Kategori | ZENWELD" kullanılır.
- Açıklama boşsa ürünün kısa açıklaması kullanılır.
- Anahtar kelimeler site içi aramada işe yarar; Google bu etiketi sıralamada
  kullanmaz. Görünürlüğü asıl belirleyen başlık, açıklama ve sayfa içeriğidir.

---

## 8. Kategoriler ve gruplar

Katalog dört sabit bölümden oluşur: Ekipmanlar, Güvenlik, Aksesuarlar,
Dolgu Metalleri. Her bölümde gruplar (menüde sol kolon), her grupta
kategoriler vardır. Ürün bir kategoriye bağlıdır.

### Liste

Adres: `/yonetim/kategoriler`. Açıklama: "Ürün bölümlerinin grupları ve
kategorileri, menüdeki sırayla. Oklar menüdeki ve kartlardaki sırayı
değiştirir."

- Her bölüm ayrı kutudadır ve **Grup Ekle** düğmesi vardır (bölüm seçili
  gelir).
- **Tablo:**
  - Sıra: yukarı/aşağı okları (anında kaydedilir; menüde ve kartlarda sıra
    değişir).
  - Ad: grup satırı; altında girintili kategori satırları.
  - Link: `/bolum/grup` ya da `/bolum/grup/kategori`.
  - İçerik: "N kategori" ya da "N ürün".
  - Düzenle, Sil.
- Her grubun altında **+ Kategori Ekle** (grup seçili gelir).
- Bölümde grup yoksa: "Bu bölümde henüz grup yok."
- **Silme:**
  - Ürünü olan kategori silinemez; çöp pasiftir ve ipucunda "Ürünü olan
    kategori silinemez; önce ürünleri başka kategoriye taşıyın." yazar.
  - Kategorisi olan grup silinemez: "İçinde kategori olan grup silinemez;
    önce kategorileri taşıyın."
  - Onay: ""<ad>" silinsin mi? Bu işlem geri alınamaz."
- Bir ürünün kategorisi ürün formunun Temel Bilgiler sekmesinden değişir.

### Kategori formu

- **Yeni:** `/yonetim/kategoriler/yeni?grup=<grup>`. "Kategori, seçtiğiniz
  grubun altında menüye ve grup sayfasına eklenir." Yeni kategori grubunun
  sonuna eklenir.
- **Düzenleme:** `/yonetim/kategoriler/<id>`. Başlıkta ad, link ve
  **Sayfayı gör ↗**. Bulunamazsa "Kategori bulunamadı."
- **Sekmeler:** Temel Bilgiler · Tanıtım Metni · Seçenekler · SEO.
- Kayıt: "Kategori kaydedildi."

**Temel Bilgiler:**

- **Kategori Adı** (zorunlu): "Kategori adı zorunludur."
- **Grup:** Bölümlere göre gruplanmış liste. "Bir grup seçin." Düzenlemede:
  "Grup değişirse kategorinin linki de değişir; eski link yeni linke
  yönlenir."
- **Kısa Açıklama:** "Sayfanın başlığının altında ve grup sayfasındaki
  kartta görünür."
- **Kart Görseli:** **URL Kullan**, **Dosya Yükle**, **Görseli kaldır**.
  "Görsel yoksa kategorideki ilk ürünün fotoğrafı kullanılır."

**Tanıtım Metni:** "Tanıtım metni sayfanın altında "… Hakkında" başlığıyla
görünür; boş bırakılırsa gösterilmez." Biçimli metindir.

**Seçenekler:**

- "Bu kategorideki ürünlere seçenek eklenirken (ör. 3 m / 5 m) işaretli
  seçenekler listelenir. Seçeneklerin adı ve değerleri Seçenek Tanımları
  ekranında düzenlenir; aynı seçenek birden çok kategoride kullanılabilir."
- Her tanım bir işaret kutusudur: ad, değerleri ("3 m · 4 m · 5 m"), bu
  kategoride kullanılıyorsa "Bu kategoride N üründe kullanılıyor".
- Kullanılan tanımın işareti kaldırılırken onay sorulur: ""<ad>" bu
  kategoride N üründe kullanılıyor. Bu ürünlerin seçenekleri değişmez;
  yalnızca bu kategoride yeni bir ürüne seçenek eklerken listelenmez. İşaret
  kaldırılsın mı?"
- **Yeni Seçenek Tanımı:** Seçenek tanımı penceresini açar. Tanım hemen
  kaydedilir ve işaretli gelir; kategorinin kendisi formun Kaydet'i ile
  kaydedilir.
- Tanım yoksa: "Henüz seçenek tanımı yok."
- Form açıkken başka yerden silinen tanımlar kayda yazılmaz.

**SEO:**

- [Ortak SEO sekmesi](#2-ortak-davranışlar); link `/bolum/grup/<link>`.
- Kategori linki sitede tekildir: ""<link>" linki "<ad>" kategorisinde
  kullanılıyor."
- Açıklama boşsa kategorinin kısa açıklaması kullanılır.

**Kaydedince:**

- Link ya da grup değiştiyse eski adres yeni adrese yönlenir.
- Kategorinin bütün ürünleri yeni kategori linkine ve bölümüne taşınır;
  ürünler kategoriye bağlı kalır. Ürün adresleri (`/urun/…`) değişmez.
- Kategori silinse ya da ürün başka kategoriye taşınsa da seçenek tanımları
  ve ürünlerin seçenekleri bozulmaz.

### Grup formu

- **Yeni:** `/yonetim/kategoriler/grup/yeni?bolum=<bölüm>`. "Grup, menüde
  bölümün altında sol kolona ve bölüm sayfasına eklenir." Yeni grup bölümün
  sonuna eklenir.
- **Düzenleme:** `/yonetim/kategoriler/grup/<id>`. Bulunamazsa "Grup
  bulunamadı."
- **Sekmeler:** Temel Bilgiler · Tanıtım Metni · SEO.
- Kayıt: "Grup kaydedildi."

**Temel Bilgiler:**

- **Grup Adı** (zorunlu): "Grup adı zorunludur."
- **Bölüm:** Yalnızca yeni grupta seçilir; "Kayıtlı grubun bölümü
  değiştirilemez."
- **Kısa Açıklama:** "Grup sayfasının başlığının altında görünür. Boş
  bırakılırsa kategori adlarından oluşturulur (gri yazı)."
- **Kart Görseli:** "Görsel yoksa gruptaki ilk ürünün fotoğrafı kullanılır."

**Tanıtım Metni:** Kategoriyle aynı; ayrıca "Grup sayfasında kategori
kartlarının altında durur."

**SEO:**

- Link `/bolum/<link>`. Grup linki yalnızca kendi bölümünde tekildir:
  ""<link>" linki bu bölümde "<ad>" grubunda kullanılıyor."
- Link değişince ek not: "Gruptaki kategorilerin linkleri de değişir;
  onların eski linkleri de yeni linklere yönlenir."

---

## 9. Seçenek Tanımları

Adres: `/yonetim/secenekler`. Açıklama: "Ürün seçeneklerinin adı ve
değerleri. Hangi kategoride listeleneceği kategorinin Seçenekler sekmesinden
seçilir."

Tanımlar ortaktır: aynı tanım (ör. "Hortum Uzunluğu: 3 m, 4 m, 5 m") birden
çok kategoride kullanılabilir. Bir değerin adı düzeltilince her yerde
değişir.

- **Yeni Seçenek** düğmesi.
- **Tablo:** Seçenek, Değerler ("3 m · 4 m"), Kategoriler (bağlantılı; yoksa
  —), Ürün (kullanan ürün sayısı; yoksa —), Düzenle, Sil.
- Boşsa: "Henüz seçenek tanımı yok."
- **Sil:**
  - Bir üründe kullanılıyorsa silinmez: ""<ad>" N üründe kullanılıyor; önce
    ürünlerin Seçenekler sekmesinden kaldırın."
  - Kullanılmıyorsa onay: ""<ad>" silinsin mi? N kategoriden de
    kaldırılır." Kategorilerdeki işaret de kalkar.

**Yeni Seçenek / Seçeneği Düzenle penceresi:**

- **Seçenek Adı** (zorunlu): "ör. Hortum Uzunluğu, Paket".
- **Değerler:**
  - Sıralı listedir; oklarla sıralanır. Sitede de bu sırayla görünür.
  - Değerin adı yerinde düzeltilebilir.
  - X ile silinir. Bir üründe kullanılan değer silinmez: ""<değer>" N
    üründe kullanılıyor; önce ürünün Seçenekler sekmesinden kaldırın."
  - Yeni değer kutuya yazılıp **Ekle** ya da Enter ile eklenir ("Yeni değer,
    ör. 10 m"). Aynısı varsa: ""<değer>" zaten var."
  - Her değerin değişmeyen bir kimliği vardır (ilk addan üretilir). Ad
    düzeltilince ürün, stok ve `?secenek=` bağlantıları kopmaz.
- **Kaydet** tanımı hemen kaydeder. Hatalar:
  - "Seçenek adı zorunludur."
  - ""<ad>" adında bir seçenek zaten var."
  - "En az bir değer ekleyin."
  - "Boş değer var."
  - ""<değer>" iki kez yazılmış."
  - "Kaydedilemedi: tarayıcı deposu dolu."
- Ad ve değer karşılaştırmaları Türkçe büyük/küçük harfe duyarsızdır.

---

## 10. Stok Matrisi

Adres: `/yonetim/stok`. Açıklama: "Bayilerin ve online satıcıların
gönderdiği stok listeleri. Dosyayı ilgili bayinin/satıcının sayfasından
yükleyin."

Bayiler ve online satıcılar ürün kodu + adet listesi gönderir; liste buradan
yüklenir. Ürün sayfasındaki "Stoktaki bayiler" ve "online satıcılar" bu
verilerden gelir. Zenweld'in kendi deposu burada yoktur (sitede her ürün her
zaman satıştadır). Sitede adet ve fiyat gösterilmez; yalnızca stoğu olan
bayiler ve online satıcılar listelenir. Seçenekli üründe seçilen seçeneğe göre
listelenir. Dosya biçimi ve backend için ayrıntı: [STOK.md](STOK.md).

**Kaynaklar:**

- Aktif bayiler. Bir online mağazaya bağlı bayi, o mağazanın linkleriyle
  birlikte tek kaynaktır.
- Aktif online satıcılar. Bir bayiye bağlı olan mağaza ayrıca listelenmez.

İki sekme vardır: **Bayi ve Satıcılar** ve **Ürün Bazında**.

### Bayi ve Satıcılar

- **Stok geçerlilik süresi:**
  - "Son N gün içinde güncellenen stoklar sitede gösterilir. Bir bayi ya da
    satıcı bu süre içinde yeni dosya göndermezse ürünleri sitede "stokta"
    görünmez ve burada uyarı çıkar. 0 yazılırsa süre sınırı olmaz."
  - 0–365 arası tam sayı; başlangıç değeri 3 gün.
  - Kendi **Kaydet** düğmesi vardır → "Kaydedildi".
- **Süzgeç:** Tümü / Bayiler / Online satıcılar. **Arama:** "Bayi/satıcı
  veya şehir ara…".
- Eski stoklu kaynak varsa rozet: "N kaynağın stoğu X günden eski".
- **Tablo** (güncellenmemiş kaynaklar üstte ve sarı):
  - Bayi / Satıcı (şehirle; kaynak sayfasına gider).
  - Tür: Bayi / Online satıcı; ek rozetler "Online mağaza", "Kendi
    mağazamız".
  - Stoktaki ürün: "stokta olan / toplam satır".
  - Son güncelleme: tarih-saat ve "N saat önce" (yoksa —).
  - Durum: "Stok yüklenmedi" / "Sitede görünüyor" / "N gündür güncellenmedi ·
    sitede gizli".
  - **Stok listesi >**.
- Boşsa: "Kayıt bulunamadı."
- Yaş metinleri: hiç yüklenmedi, az önce, N dakika önce, N saat önce, N gün
  önce.

### Kaynak sayfası

Adres: `/yonetim/stok?kaynak=dealer:<id>` ya da `?kaynak=retailer:<id>`.
Kaynak yoksa "Bayi/satıcı bulunamadı."

- **← Tüm bayi ve satıcılar.**
- Başlık: kaynağın adı; altında "Bayi · <şehir> · Online mağaza: <ad>".
- **Şablon İndir:** `<ad>-stok-sablonu.csv`. Yayındaki bütün ürünler ve
  seçenekleri, bu kaynağın bugünkü adetleriyle; bayiye gönderilip
  doldurtulabilir.
  - Seçenekli üründe her seçenek kendi koduyla ayrı satırdır (ör. MB-25 3 m /
    4 m / 5 m).
  - Dosyadaki seçenek kodu stoğu o seçeneğe yazar; ürünün ana kodu bütün
    seçenekler için geçerli sayılır.
- **Dosya Yükle (CSV / XLSX):** `.csv`, `.xlsx`, `.txt`. Dosya okunamazsa
  hata metni ya da "Dosya okunamadı." Okunursa önizleme penceresi açılır.
- **Özet:** Stoktaki ürün (N / M satır), Son güncelleme, durum rozeti.
  Linkli kaynakta "N stoktaki ürünün linki yok · online satıcı kartında
  görünmez".
- **Dosya biçimi açıklaması:**
  - İlk satırda başlıklar: **SKU** (ya da Ürün Kodu / Stok Kodu), **Adet**,
    **Fiyat**. Online satıcıda ve online mağazalı bayide ayrıca **Link**
    (ürünün satıcının sitesindeki sayfası; linki olmayan ürün online satıcı
    kartında görünmez).
  - "Fiyat sitede gösterilmez. Her dosya bu kaynağın tam listesi sayılır:
    dosyada olmayan ürün stoktan çıkar."
  - Online mağazalı bayide: "Bu bayinin online mağazası da aynı dosyadan
    beslenir: stoktaki ürünler haritada, linkli olanlar ayrıca online satıcı
    kartında görünür."
  - "Şablonu indirip doldurtabilirsiniz; Excel'de .xlsx ya da .csv olarak
    kaydedilebilir."
- **Stok listesi:**
  - Arama: "Ürün veya kod ara…"; **Yalnızca stoktakiler**.
  - Sütunlar: Kod, Ürün ("Ad (Seçenek: değer)"; silinmiş üründe "Silinmiş
    ürün"), Adet, Fiyat (₺), Ürün linki (linkli kaynakta), Güncelleme, sil.
  - Adet, fiyat ve link yerinde düzeltilir; alandan çıkınca ya da Enter ile
    kaydedilir.
  - Geçersiz değer (boş ya da eksi adet, kesirli adet, eksi fiyat, `http`
    ile başlamayan link) kaydedilmez, eski değer geri gelir.
  - Sil: "<ürün> bu listeden çıkarılsın mı?"
  - Boşsa: "Henüz stok yüklenmedi. Dosya yükleyin ya da aşağıdan satır
    ekleyin." / "Aramaya uyan satır yok."
- **Satır ekle:** Ürün listesi (yayındaki ürünler A–Z; "Kod — Ad (tüm
  seçenekler)" ve her seçenek için "Kod — Ad (değer)"), Adet, **Ekle**.
- **Geçmiş** (son 30 işlem):
  - Rozet: Dosya / Elle / Geri alma; tarih-saat; dosya adı ya da not.
  - Dosya ve geri almada "+N giren · N değişen · −N çıkan" ve varsa "N satır
    uygulanmadı".
  - İşlemi yapan yöneticinin adı. Geri alınmış yüklemede "Geri alındı ·
    <tarih>".
  - Son dosya yüklemesinde **Bu yüklemeyi geri al**: ""<dosya>" yüklemesi
    geri alınsın mı? Stok bu yüklemeden önceki haline döner." → "Yükleme
    geri alındı; stok önceki haline döndü."
  - Boşsa: "Henüz işlem yok."
- Dosya uygulanınca: "Stok güncellendi: N ürün işlendi · N stoğa girdi · N
  değişti · N stoktan çıktı · N satır uygulanmadı."

### Dosya önizleme penceresi

Başlık: "Stok dosyası: <dosya>".

- "<Kaynak> stoğu bu dosyadaki listeyle değiştirilecek. Dosyada olmayan
  ürünler stoktan çıkar."
- **Okunan sütunlar:** "Başlık satırı N. Okunan sütunlar: Kod = A, Adet = B,
  Fiyat = C, Link = D". Eksikse "fiyat sütunu bulunamadı" / "link sütunu
  bulunamadı". Başlık yoksa "Başlık satırı bulunamadı."
- **Sayılar:** Dosyadaki satır, Eşleşen ürün, Tanınmayan kod, Hatalı satır;
  Stoğa girecek, Değişecek, Stoktan çıkacak, Değişmeyen.
- **Uygulanamayan dosya:**
  - Başlık yoksa: "Dosyada başlık satırı bulunamadı; uygulanamaz. İlk
    satırlardan birinde "Kod" (veya SKU) ve "Adet" başlıkları olmalı. Şablon
    İndir ile alınan dosyadaki başlık satırını silmeyin."
  - Eşleşen ürün yoksa: "Dosyada eşleşen ürün yok; uygulanamaz. Sütun
    başlıklarını ve kodları kontrol edin."
- **Yarım dosya koruması:** Dosya öncekinden çok daha kısaysa: "Bu dosya
  öncekinden çok daha kısa: önceki listede N stoklu ürün vardı, bu dosyada M
  ürün var. Yarım gönderilmiş olabilir; uygularsanız K ürün stoktan çıkar."
  **"Dosyanın tam liste olduğunu kontrol ettim"** işaretlenmeden uygulanmaz.
- **Uyarılar:**
  - Linksiz stok: "Stoktaki N ürünün linki yok; bu ürünler online satıcı
    kartında görünmez (haritada görünür)."
  - Aynı ürün birden çok satırda: "N ürün dosyada birden fazla kez geçiyor;
    her biri için son satır kullanıldı (satır …)."
  - Satır uyarıları: "Satır N (<kod>): <uyarı>".
- **Sekmeler:**
  - **Değişiklikler:** Durum (Stoğa giriyor / Değişiyor / Adet 0 / Dosyada
    yok), Ürün ve kod, Önce, Sonra, Fiyat (değiştiyse eskisi üstü çizili).
    Değişiklik yoksa "Mevcut stokta değişiklik yok."
  - **Tanınmayan kodlar:** Satır, Dosyadaki kod, Adet, "Hangi ürün? (bir kez
    eşleştirilir, sonraki dosyalarda tanınır)" listesi ve **Eşleştir**.
    Eşleştirme hemen kaydedilir; dosya yeniden eşleşir. Hepsi tanındıysa
    "Tüm kodlar tanındı."
  - **Hatalı satırlar:** Satır, Kod, Sorun. Yoksa "Hatalı satır yok."
- "Tanınmayan ve hatalı satırlar uygulanmaz; bu ürünler stoğa girmez.
  Dosyayı düzelttirip yeniden yükleyebilir ya da kodları yukarıdan
  eşleştirebilirsiniz."
- **Stoğu Güncelle** / **Vazgeç**. Depo doluysa: "Stok güncellenemedi:
  tarayıcı deposu dolu. Değişiklik uygulanmadı."

### Ürün Bazında

Adres: `/yonetim/stok?sekme=urun`. Yalnızca görüntülemedir; düzeltme kaynağın
sayfasından yapılır.

- **Arama:** "Ürün adı veya SKU ara…".
- Açıklama: "“Sitede” sayıları: adedi 0'dan büyük ve son N gün içinde
  güncellenmiş kaynaklar. Online satıcı kartı için ürün linki de olmalı;
  online mağazası olan bayiler bu sayıya bayinin dosyasından girer."
- **Tablo:** Ürün (kapak, ad, kod), Sitede: bayi, Sitede: online satıcı (0
  ise sarı).
- Satıra tıklayınca kaynaklar açılır: kaynak adı (kaynak sayfasına gider) ·
  tür (+ online mağaza), seçenek, adet, yaş, durum:
  - Sitede
  - Link yok · gizli
  - Eski · gizli
  - Stokta yok
- Ürün hiçbir listede yoksa: "Hiçbir bayi ya da satıcının listesinde yok."
- `?sekme=urun&urun=<id>` ile açılınca o ürün en üstte, açık ve sarı
  vurgulu gelir.

---

## 11. Yorumlar

Adres: `/yonetim/yorumlar`. Açıklama: "<N> yorum · <N> onay bekliyor ·
anasayfada X/10".

Sitede ürün sayfasından yazılan değerlendirmeler. Yeni yorum onaylanmadan
sitede görünmez. Seçenekli üründe yorumlar ürün bazındadır; bütün seçenekler
aynı yorumları paylaşır.

- **Arama:** "Yorum veya kişi ara…" (yazar adı ve metin).
- **Onay bekleyenler** düğmesi listeyi süzer.
- En yeni yorum önce gelir.
- **Kart** (onay bekleyen sarı):
  - Yıldızlar, yazar, ürün adı, tarih.
  - Rozetler: Onay bekliyor / Anasayfada / Doğrulanmış alıcı.
  - Başlık, metin, eklenmiş fotoğraf ve videolar (video oynatılabilir).
- **Düğmeler:**
  - **Onayla** ↔ **Yayından kaldır.** Yayından kaldırılan yorum anasayfadan
    da çıkar.
  - **Anasayfada göster** ↔ **Anasayfadan çıkar.** Yalnızca onaylı yorumda
    çalışır. En fazla 10 yorum anasayfada olur; doluysa: "Anasayfada en
    fazla 10 yorum gösterilebilir. Önce birini çıkarın." Sınıra yalnızca
    onaylı ve ürünü yayında olan yorumlar sayılır.
  - **Sil:** Onay sorar: "<yazar> adlı kişinin yorumu silinsin mi? Bu işlem
    geri alınamaz."
- Boşsa: "Yorum bulunamadı."
- Panelde yorum yazılmaz ve metni düzenlenmez.

---

## 12. Bayiler

Adres: `/yonetim/bayiler`. Açıklama: "Yetkili Bayi ve Servis Ağı haritasında
ve ürün sayfasındaki “Stoktaki Bayileri Gör” penceresinde görünen satış ve
servis noktaları."

Bayiler sitenin müşterisi değildir; sitede bayi girişi yoktur (bkz.
[KARARLAR.md](KARARLAR.md)).

- **Yeni Bayi** düğmesi.
- **Şehir süzgeci:** "Tüm şehirler (N)" ve kayıtlı şehirler (A–Z).
- **Tablo:** Bayi (ad ve adres), Şehir / İlçe, Telefon, Rozetler (Yetkili
  Bayi / Yetkili Servis; bağlı mağaza varsa "Online mağaza"), **Düzenle**,
  Sil.
- Pasif bayi soluk görünür; sitede görünmez.
- **Sil:** "<ad> silinsin mi?" Bayinin stok satırları, stok yükleme geçmişi
  ve kod eşleştirmeleri de silinir.

**Yeni Bayi / Bayiyi Düzenle penceresi:**

- **Bayi Adı** (zorunlu), **Şehir** (zorunlu), **İlçe**, **Adres**. Ad ve
  şehrin başındaki/sonundaki boşluklar atılır.
- **Telefon**, **WhatsApp.**
- **Enlem (lat)** ("Google Maps'ten kopyalayabilirsiniz") ve **Boylam
  (lng).** Google Maps'te konuma sağ tıklayınca koordinat kopyalanır. Yeni
  kayıtta 39.1 / 35.6 (Türkiye'nin ortası) gelir.
- **Çalışma Saatleri:** Yeni kayıtta "Hafta içi 09:00 – 18:00".
- **Bağlı olduğu online mağaza:**
  - "Yok" ya da online satıcılardan biri.
  - Başka bayiye bağlı mağaza seçilemez; yanında "— bağlı: <bayi>" yazar.
  - "Seçilirse bayinin stok dosyasındaki ürün linkleri de okunur; ürünler
    haritada ve bu mağazanın online satıcı kartında görünür. Bir mağaza
    yalnızca bir bayiye bağlanabilir."
  - Bayinin online mağazası varsa önce mağaza
    [Online Satıcılar](#13-online-satıcılar)'a eklenir, sonra burada seçilir.
- **Bayi Türü** (zorunlu): Yetkili Bayi / Yetkili Servis / Yetkili Bayi +
  Yetkili Servis. Sitede haritada ve servis ağı sayfasında rozet olarak
  görünür.
- **Aktif.**
- Hatalar:
  - "Bayi adı ve şehir zorunludur."
  - "Bayi türünü seçin: Yetkili Bayi, Yetkili Servis ya da ikisi."
  - "Bu online mağaza başka bir bayiye bağlı. Bir online mağaza yalnızca bir
    bayiye bağlanabilir."

---

## 13. Online Satıcılar

Adres: `/yonetim/saticilar`. Açıklama: "Ürün sayfalarındaki “Ayrıca online
alışveriş olarak şurada da mevcuttur” bölümünde çıkacak siteler."

- **Yeni Satıcı** düğmesi.
- **Kart:**
  - Logo metni; Zenweld'in kendi mağazasıysa kırmızı "Kendi mağazamız"
    rozeti.
  - Ad, site adresi (yeni sekmede açılır).
  - "N ürün sayfasında": şu an sitede kartı görünen ürün sayısı.
  - Şehir; pasifse "Pasif".
  - Bir bayinin online mağazasıysa: "Bayi: <bayi> · stok bayinin dosyasından
    gelir" (bayinin stok sayfasına gider).
  - **Düzenle**, Sil.
- **Sil:** "<ad> ve tüm stok kayıtları silinsin mi?" Stok satırları, geçmiş
  ve kod eşleştirmeleri silinir; bağlı bayinin bağlantısı kalkar.

**Yeni Satıcı / Satıcıyı Düzenle penceresi:**

- **Satıcı Adı** (zorunlu).
- **Logo Metni:** "Ürün sayfasındaki kutuda görünecek kısa yazı". Boşsa
  adın büyük harfli hali kullanılır.
- **Site Adresi** (zorunlu): "https://…". Satıcının ana sayfasıdır; ürün
  sayfasındaki kart ise stok dosyasındaki ürün linkine gider.
- **Şehir.**
- **"Zenweld'in kendi online mağazası (ürün sayfasında kırmızı rozetle en
  başta)".**
- **Aktif:** Kapatılırsa hiçbir ürün sayfasında görünmez.
- Ad ve site adresi boşsa: "Satıcı adı ve site adresi zorunludur." Başındaki
  ve sonundaki boşluklar atılır.

---

## 14. Satış Temsilcileri

Adres: `/yonetim/satis-temsilcileri`. Açıklama: "<N> temsilci · <N> sitede
görünüyor".

Sitedeki Keşfet › Satış Temsilcilerimiz sayfasının listesi. Sitedeki bölge
düğmeleri listedeki "Bölge / Görev" değerlerinden kendiliğinden oluşur.

- **Sayfayı gör** (yeni sekme), **Temsilci ekle.**
- **Tablo:**
  - Sıra: yukarı/aşağı okları; numaralar 1, 2, 3… diye yenilenir.
  - Ad Soyad, Bölge / Görev, İletişim (telefon, e-posta).
  - Durum: "Sitede" / "Gizli" rozeti; tıklayınca değişir. Gizli temsilci
    silinmez, sitede görünmez.
  - Düzenle, Sil ("<ad> listeden silinsin mi?").
- Boşsa: "Henüz temsilci yok."

**Yeni Temsilci / Temsilciyi Düzenle penceresi:**

- **Ad Soyad** (zorunlu).
- **Bölge / Görev** (zorunlu): "ör. Ege Bölgesi".
- **Telefon** (zorunlu): "WhatsApp bu numaraya açılır"; örnek "+90 532 000
  00 00". Sitede hem **Ara** hem **WhatsApp** düğmesi bu numaraya bağlanır.
- **E-posta** (zorunlu).
- **Fotoğraf (isteğe bağlı):** "Yoksa ad soyadın baş harfleri gösterilir".
- **Sitede göster.**
- Yeni temsilci listenin sonuna eklenir.
- Hatalar:
  - "Ad soyad, bölge / görev, telefon ve e-posta zorunludur."
  - "E-posta adresi geçersiz görünüyor."
  - "Telefon numarası eksik görünüyor (ör. +90 532 000 00 00)." (en az 10
    rakam)

---

## 15. Üyeler

Adres: `/yonetim/uyeler`. Açıklama: "<N> üye listeleniyor".

Yalnızca ana sitenin üyeleri (bireysel, kurumsal) ve yönetici hesapları
listelenir. Bayiler ana sitenin üyesi değildir.

- **CSV İndir** (`zenweld-uyeler.csv`): ad, soyad, e-posta, rol, durum,
  firma, vergi no, telefon, şehir, kayıt tarihi.
- **Arama:** "İsim, e-posta veya firma ara…".
- **Rol süzgeci:** Tüm roller / Bireysel / Kurumsal / Yönetici.
- **Durum süzgeci:** Tüm durumlar / Aktif / Askıda.
- **Tablo:**
  - Üye: ad soyad, e-posta, telefon.
  - Firma / Vergi No (yoksa —).
  - **Rol:** Liste; seçilince hemen kaydedilir. Kendi satırında kilitlidir:
    "Kendi rolünüzü değiştiremezsiniz."
  - **Durum:** Rozet (Aktif / Askıda). Aktif üyede **Askıya al** (kendi
    satırında yok), askıdaki üyede **Aktifleştir**.
  - Kayıt tarihi.
  - Sil: Yönetici satırında pasiftir. Onay: "<e-posta> silinsin mi?" Üyenin
    kayıtlı adresleri de silinir; siparişleri, teklifleri, servis talepleri ve
    yorumları kalır.

**Kurallar:**

- Son aktif yöneticinin rolü düşürülemez, askıya alınamaz ve silinemez
  (panele kimse giremez hale gelmesin diye).
- Askıya alınan üye sitede giriş yapamaz; açık oturumu hemen kapanır.
- Rol **Yönetici** yapılan hesap panele girebilir, sitede giriş yapamaz.
  Yöneticilikten çıkarılan hesap panele giremez, sitede giriş yapabilir.
- Bireysel ve kurumsal üye sitede aynı işlemleri yapabilir; kurumsal üyede
  kayıtta firma bilgisi istenir.
- Sitede kayıt olan üye **Aktif** başlar ve siteyi hemen kullanabilir;
  panelden onay gerekmez (karar, bkz. [KARARLAR.md](KARARLAR.md)). Üyelikte
  "onay bekliyor" durumu yoktur.
- Panelde üye eklenmez; ad, e-posta ve şifre değiştirilmez.

---

## 16. Servis Talepleri

Adres: `/yonetim/servis-talepleri`. Açıklama: "<N> talep · <N> yeni".

Sitedeki Servis Talebi formundan gelenler. Talep `SRV-<yıl>-<4 hane>`
koduyla **Yeni** durumunda gelir. En yeni talep önce.

- **Tablo:**
  - Talep: kod ve tarih-saat.
  - Firma / Şahıs: ad; altında ilçe / il.
  - Makine: model adı; altında kategori adı.
  - Neden: Kurulum, Bakım, Onarım, Kullanım/Bakım Eğitimi (birden çok
    olabilir).
  - Durum: Yeni / İşlemde / Tamamlandı.
- Satıra tıklayınca açılır:
  - **Müşteri şikayeti.**
  - Adres, E-posta, Telefon, Yetkili kişi, Yetkili GSM.
  - **Durum** listesi ve **İç not** ("İç not (yalnızca panelde görünür)").
    İkisi **Kaydet** ile birlikte kaydedilir; düğmenin yanında "Kaydedildi"
    yazar. Durum ya da not yeniden değiştirilince bu yazı kalkar.
- Boşsa: "Henüz servis talebi yok."
- Talep silinmez. Servis talebi müşterinin Hesabım sayfasında görünmez.

---

## 17. Garantiler

Adres: `/yonetim/garantiler`. Açıklama: "<N> garanti kaydı · <N> geçerli".

Sitedeki Garanti Kaydı formundan gelen kayıtlar (ad soyad, e-posta, telefon,
şehir, posta kodu, adres, ürün, seri numarası, satıcı VKN, 12 ay uzatma
isteği). Buradaki değişiklik müşterinin Hesabım › Garantilerim sayfasına ve
sitedeki garanti sorgulamaya anında yansır (aynı veri).

- Satın alma tarihi sorulmadığı için garanti süresi **kayıt tarihinden**
  başlar: kayıt tarihi + ürünün garanti süresi + (istendiyse) 12 ay.
- Bitiş günü dahil garanti geçerlidir (site sorgulamasıyla aynı).

- **CSV indir** (`garanti-kayitlari.csv`): seri no, ürün, sahibi, e-posta,
  telefon, şehir, posta kodu, adres, satıcı VKN, bitiş, uzatılmış
  (evet/hayır), kayıt tarihi.
- **Arama:** "Seri no, isim veya e-posta ara…".
- **Süzgeç:** Tüm kayıtlar / Garantisi devam eden / Süresi dolan / Uzatılmış
  garanti.
- En yeni kayıt önce.
- **Tablo:**
  - Ürün / Seri No.
  - Sahibi: ad, e-posta, telefon; "Üye" ya da "Üye değil" (e-posta bir
    üyede kayıtlı mı).
  - Adres: adres, posta kodu, şehir.
  - Satıcı VKN / "Kayıt: <tarih>".
  - **Garanti Bitişi:** Tarih kutusu; değişince hemen kaydedilir. Altında
    "Geçerli" ya da "Süresi doldu" (bitiş bugünden önceyse).
  - **Uzatılmış:** "+12 ay" kutusu. İşaretlenince bitiş tarihine 12 ay
    eklenir, kaldırılınca 12 ay çıkarılır; elle girilmiş tarih bu şekilde
    korunur.
  - Sil: "<seri no> seri numaralı kayıt silinsin mi?"
- Boşsa: "Henüz garanti kaydı yok." / "Aramanıza uygun kayıt yok."
- Ekranın altındaki not: "Bitiş tarihi ve uzatılmış garanti değişiklikleri
  müşterinin “Hesabım → Garantilerim” sayfasına ve sitedeki garanti
  sorgulamaya anında yansır. “+12 ay” işaretlenince bitiş tarihine 12 ay
  eklenir, kaldırılınca 12 ay çıkarılır."
- 29 Şubat'a denk gelen tarihler bilinçli olarak olduğu gibi bırakıldı (bkz.
  [KARARLAR.md](KARARLAR.md)).

---

## 18. Haberler, Etkinlikler, Blog

Üçü aynı form çerçevesini ve [ortak SEO sekmesini](#2-ortak-davranışlar)
kullanır.

### Listeler

| | Haberler | Etkinlikler | Blog |
|---|---|---|---|
| Adres | `/yonetim/haberler` | `/yonetim/etkinlikler` | `/yonetim/blog` |
| Açıklama | "<N> haber listeleniyor" | "<N> etkinlik listeleniyor" | "<N> yazı listeleniyor" |
| Yeni düğmesi | Yeni Haber | Yeni Etkinlik | Yeni Yazı |
| Arama | "Haber başlığı veya özet ara…" | "Etkinlik adı, şehir veya ülke ara…" | "Yazı başlığı, kategori veya özet ara…" |
| Süzgeç | — | Tüm etkinlikler / Yaklaşan / Geçmiş | — |
| Sıralama | Yayın tarihi, yeniden eskiye | Başlangıç tarihi, yeniden eskiye | Yayın tarihi, yeniden eskiye |
| Sütunlar | Haber (kapak, başlık, /link), Yayın Tarihi, Durum | Etkinlik (logo, ad, /link), Tarih (başlangıç ve bitiş), Konum (şehir, ülke), Durum | Yazı (kapak, başlık, /link), Kategori, Yayın Tarihi, Durum |

- **Durum rozetleri:** Yayında / Yayında değil. Etkinlikte ayrıca Yaklaşan
  (bitişi bugün ya da sonra) / Geçmiş.
- **İşlem:** göz (**Yayından kaldır** / **Yayına al**), **Düzenle**, **Sil**
  (""<başlık>" silinsin mi? Bu işlem geri alınamaz.").
- Boşsa: "Kayıt bulunamadı."
- **Yayına giriş:** "Yayında" işaretli kayıt kaydedildiği anda sitede
  görünür. Yayın tarihi yalnızca sıralama ve gösterim içindir; ileri bir
  tarih seçilse de kayıt beklemeden yayına girer. Zamanlanmış yayın yoktur
  (karar, bkz. [KARARLAR.md](KARARLAR.md)).

### Haber formu

- **Yeni:** "Duyuru, basın açıklaması veya kurumsal haber ekleyin."
- **Düzenleme:** Başlık, yayın tarihi ve **Haber sayfasını gör ↗**.
  Bulunamazsa "Haber bulunamadı."
- **Temel Bilgiler:** **Haber Başlığı** (zorunlu), **Yayın Tarihi**
  (tarih-saat; yeni kayıtta şimdi), **Yayında (aktif)**.
- **İçerik:** **Özet** ve **Haber Metni**. "Özet haber kartında, metin haber
  sayfasında görünür." Biçimli metindir.
- **Görseller:**
  - Kapak görseli: **URL Kullan**, **Dosya Yükle**, **Görseli kaldır**.
  - **Fotoğraf Galerisi:** "Kapak görselinin yanı sıra habere istediğiniz
    kadar fotoğraf ekleyebilirsiniz. Bunlar haber sayfasının altında
    görünür." **URL Ekle**, **Dosya Yükle** (çoklu), sil. Boşsa "Henüz
    fotoğraf eklenmedi."
- **SEO:** Link `/haberler/<link>`; açıklama boşsa haberin özeti.
- Kayıt: **Haberi Oluştur** / "Haber kaydedildi."
- Hatalar: "Haber başlığı zorunludur." / ""<link>" adresi "<başlık>"
  haberinde kullanılıyor."

### Etkinlik formu

- **Yeni:** "Fuar, sponsorluk veya etkinlik ekleyin. Bitiş tarihi bugünden
  ileride olan etkinlikler sitede 'Yaklaşan' filtresinde görünür."
- **Düzenleme:** "<başlangıç> — <bitiş>" ve **Etkinlik sayfasını gör ↗**.
  Bulunamazsa "Etkinlik bulunamadı."
- **Temel Bilgiler:**
  - **Etkinlik Adı** (zorunlu).
  - **Başlangıç Tarihi** ve **Bitiş Tarihi** (zorunlu; yeni kayıtta ikisi de
    bugün). Bitiş başlangıçtan önce seçilemez; başlangıç ileri alınınca
    bitiş de gerekirse ileri gelir.
  - **Mekan:** "Örn. İstanbul Fuar Merkezi".
  - **Şehir.**
  - **Ülke:** "Etkinlik sayfasındaki filtre bu alanı kullanır". Öneri
    listesi: Türkiye (varsayılan), Birleşik Arap Emirlikleri, Suudi
    Arabistan, Almanya, İtalya, Fransa, Rusya, Mısır, Irak, Azerbaycan;
    listede olmayan ülke de yazılabilir.
  - **Etkinlik Web Sitesi.**
  - **Yayında (aktif).**
- **Açıklamalar:** **Kısa Açıklama** (etkinlik kartında) ve **Detaylı
  Açıklama** (etkinlik sayfasında). Biçimli metindir.
- **Logo & Fotoğraflar:**
  - "…Kalıcı kullanım için görselleri `public/images/events/` klasörüne
    koyup `/images/events/dosya.png` yolunu girin."
  - **Etkinlik Logosu:** Yüklenen logonun çevresindeki boş beyaz kenar
    kırpılır; **Logoyu kaldır**.
  - **Fotoğraf Galerisi.**
- **SEO:** Link `/etkinlikler/<link>`; açıklama boşsa kısa açıklama.
- Kayıt: **Etkinliği Oluştur** / "Etkinlik kaydedildi."
- Hatalar: "Etkinlik adı zorunludur." / "Bitiş tarihi başlangıç tarihinden
  önce olamaz." / ""<link>" adresi "<ad>" etkinliğinde kullanılıyor."

### Blog yazısı formu

- **Yeni:** "Kaydedilen yazı sitede yayınlanır."
- **Düzenleme:** "<kategori> · <tarih>" ve **Yazı sayfasını gör ↗**.
  Bulunamazsa "Yazı bulunamadı."
- **Temel Bilgiler:**
  - **Yazı Başlığı** (zorunlu).
  - **Kategori:** "Örn. Teknik Rehber, İpuçları, Bakım". Mevcut kategoriler
    öneri olarak çıkar; yeni kategori yazılabilir. Blog kategorisi ayrı bir
    liste değildir, yazının üzerindeki metindir; sitedeki kategori süzgeci
    bu metinlerden oluşur.
  - **Yazar:** Boşsa "Zenweld".
  - **Yayın Tarihi**, **Yayında (sitede görünür).**
- **İçerik:** **Özet** (yazı kartında) ve **Yazı Metni** (yazı sayfasında).
- **Kapak Görseli.**
- **SEO:** Link `/blog/<link>`; açıklama boşsa yazının özeti.
- Kayıt: **Yazıyı Oluştur** / "Yazı kaydedildi."
- Hatalar: "Yazı başlığı zorunludur." / ""<link>" adresi "<başlık>"
  yazısında kullanılıyor."

---

## 19. Hakkımızda

Adres: `/yonetim/hakkimizda`. Açıklama: "Son kayıt: <tarih-saat>".

Sitedeki `/hakkimizda` sayfasının bütün içeriği.

- **Sayfayı gör**; **Kaydet** üstte ve altta (değişiklik yoksa pasif).
- "Kaydedilmemiş değişiklikler var." / "Kaydedildi. Hakkımızda sayfası
  güncellendi." Hata: "Sayfa başlığı zorunludur."
- **Sayfa Başlığı:** **Başlık** (zorunlu), **Alt başlık**, **Arka plan
  görseli**.
- **Rakamlar:**
  - **Rakam ekle**; her satırda **Değer** ("25+"), **Açıklama**, sil.
  - Değeri boş satır kaydedilmez.
  - Hiç yoksa: "Rakam yok; sayfada bu alan gösterilmez."
- **Bölümler:**
  - **Bölüm ekle**; her bölüm "Bölüm N" başlıklı, yukarı/aşağı okları ve sil
    ("Bu bölüm silinsin mi?").
  - Alanlar: **Başlık**, **Metin** (biçimli), **Görsel (isteğe bağlı)**.
  - "Görseli olan bölümler sitede metin ve görsel yan yana gösterilir."
  - Hiç yoksa: "Henüz bölüm yok. “Bölüm ekle” ile başlayın."

---

## 20. Sık Sorulan Sorular

Adres: `/yonetim/sss`. Açıklama: "SSS sayfasında, ürün sayfalarındaki SSS
sekmesinde ve anasayfada (ilk 8 soru) bu sırayla görünür."

- **Yeni Soru** düğmesi.
- **Tablo:** Sıra (yukarı/aşağı okları, anında), Soru (altında cevabın
  başı), Konu rozeti, Düzenle, Sil ("Bu soru silinsin mi?").
- Boşsa: "Henüz soru yok."
- **Pencere:** **Konu** (Genel / Sipariş & Teklif / Garanti / Teknik),
  **Soru** (zorunlu), **Cevap** (zorunlu). Hata: "Soru ve cevap
  zorunludur." Yeni soru listenin sonuna eklenir.

---

## 21. Belgeler

Adres: `/yonetim/belgeler`. Açıklama: "Keşfet › Diğer menüsündeki belge
sayfaları. Yüklenen belgeler sitede bu listedeki sırayla görünür."

- **Sekmeler** (belge sayılı): **MSDS** (`/msds`), **Ultimate Kaynak
  Rehberi** (`/kaynak-rehberi`), **Parti Sertifikaları**
  (`/parti-sertifikalari`).
- **Belge Ekle** açık sekmeye belge ekler.
- **Sayfa metni:** Sitedeki sayfanın **Başlık** (zorunlu) ve **Açıklama**
  alanları; kendi **Kaydet** düğmesi (değişiklik yoksa pasif) →
  "Kaydedildi"; **Sayfayı aç**.
- **Tablo:**
  - Sıra: yukarı/aşağı okları.
  - Belge: başlık; altında dosya adı ve boyutu.
  - Ürün: "Ad · Kod" ya da —.
  - Parti No (yalnızca Parti Sertifikaları'nda).
  - Durum: Yayında / Yayında değil; tıklayınca değişir.
  - **Görüntüle** (yeni sekmede açar), **Düzenle**, **Sil** (""<başlık>"
    silinsin mi? Dosya da silinir.").
- Boşsa: "Bu sayfada henüz belge yok. “Belge Ekle” ile yükleyin."

**Belge Ekle / Belgeyi Düzenle penceresi:**

- **Dosya** (yeni belgede zorunlu): "PDF, Word, Excel, JPG, PNG veya ZIP · en
  fazla 25 MB". Düzenlemede "seçmezseniz mevcut dosya kalır". Seçilen ya da
  mevcut dosyanın adı ve boyutu görünür.
- **Başlık** (zorunlu): Elle yazılmadıkça seçilen dosyanın adıyla
  (uzantısız) dolar.
- **Ürün:** "İsteğe bağlı. Ziyaretçi ürün adı veya koduyla arayabilir."
- **Parti / Lot No** (yalnızca Parti Sertifikaları): "İsteğe bağlı.
  Ziyaretçi parti numarasıyla arayabilir."
- **Yayında (sitede görünür).**
- Kaydederken düğmede "Yükleniyor…" yazar.
- Düzenlemede yeni dosya seçilirse eskisinin yerine geçer.
- Sitede ziyaretçi belge adı, ürün adı, ürün kodu ve parti numarasıyla
  arayabilir. PDF'ler **Görüntüle** ile yeni sekmede açılır, diğer dosyalar
  **İndir** ile iner.
- Kabul edilen uzantılar: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, zip.
- Hatalar:
  - "Başlık zorunludur." / "Dosya seçin."
  - "Bu dosya türü yüklenemez (.<uzantı>). Kabul edilenler: PDF, Word,
    Excel, JPG, PNG, ZIP."
  - "Dosya 25 MB'tan büyük (N MB)."
  - "Dosya kaydedilemedi: tarayıcının dosya deposu dolu ya da kapalı (gizli
    pencere)."
  - "Belge kaydedilemedi: tarayıcı deposu dolu. Değişiklik uygulanmadı."

**Demo notu:** Dosyanın kendisi tarayıcının dosya deposunda (IndexedDB),
kaydı veritabanında durur. Başka bir tarayıcıda dosya bulunmaz: "<dosya> bu
tarayıcıda bulunamadı; dosyayı yeniden yükleyin."

---

## 22. Yasal Metinler

Adres: `/yonetim/yasal-metinler`. Açıklama: "Alt bilgideki Politikalar &
Yasal sayfaları. Başlık ve metni düzenlemek için satıra tıklayın."

Sayfalar sabittir; eklenmez, silinmez, adresi ve sırası değişmez. Sıra alt
bilgideki sıradır:

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

(Sayfa adları panelde değiştirilebilir; tablodakiler başlangıç adlarıdır.)

**Önemli:** Metinlerin tamamı taslaktır; canlıya çıkmadan hukuk danışmanının
metinleriyle değiştirilmelidir.

- **Liste:** Başlık (düzenlemeye gider), Adres (sitede yeni sekmede açılır),
  Son güncelleme, Düzenle.
- **Düzenleme:** `/yonetim/yasal-metinler/<id>`. "Yasal metin" ve **Sayfayı
  gör ↗**. Bulunamazsa "Metin bulunamadı."
  - **Metin** sekmesi (ilk açılan):
    - Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'nde: "Satıcı, alıcı
      ve ürün tabloları siparişten otomatik doldurulur; bu metin tabloların
      altında görünür."
    - Diğerlerinde: "Metin sayfada başlığın altında görünür."
    - Biçimli metindir.
  - **Başlık** sekmesi: "Başlık sayfada ve alt bilgideki Politikalar & Yasal
    listesinde görünür. Sayfanın adresi değişmez."
  - **Değişiklikleri Kaydet** → "Metin kaydedildi."
  - Hatalar: "Başlık zorunludur." (Başlık sekmesine geçer) / "Metin
    zorunludur."

---

## 23. Sayfa SEO

Adres: `/yonetim/sayfa-seo`. Açıklama: "Sabit sayfaların Google'da ve
tarayıcı sekmesinde görünen başlığı ve açıklaması. Boş bırakılan alanda
varsayılan metin kullanılır. Bu sayfaların linkleri menüye bağlı olduğu için
değiştirilmez."

Listedeki sayfalar aramaya açık sabit sayfalardır; site haritasındaki sabit
sayfalarla aynı listedir.

| Grup | Sayfalar |
|---|---|
| Ana sayfa ve ürün bölümleri | Ana Sayfa, Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri, Teklif Al |
| Keşfet | Hakkımızda, Satış Temsilcilerimiz, Bayilik Başvurusu, İletişim, Haberler, Etkinlikler, Blog, Welders Club, Ürün Seçici, Ultimate Kaynak Rehberi, MSDS, Parti Sertifikaları |
| Destek ve Garanti | Sık Sorulan Sorular, Yetkili Bayi ve Servis Ağı, Servis Talebi, Garanti, Garanti Kaydı, Garanti Sorgulama |

- Giriş Yap, Üye Ol, Şifremi Unuttum ve Arama sayfaları aramaya kapalıdır;
  listede yoktur.
- Ürün, kategori, grup, haber, etkinlik ve blog sayfalarının SEO'su kendi
  formlarındadır.
- **Tablo:** Sayfa (ad ve yol), Sayfa Başlığı (altında "N/60"; aşınca
  kırmızı), Açıklama, Durum (Değiştirildi / Varsayılan), Düzenle.

**"Sayfa SEO: <ad>" penceresi:**

- **Sayfa Linki:** Kilitli. "Link sabittir; menüye ve sayfalar arasındaki
  bağlantılara bağlı."
- **Sayfa Başlığı:** Sayaç; "Boş bırakılırsa: <varsayılan başlık>".
- **Açıklama:** Sayaç; "Boş bırakılırsa varsayılan açıklama kullanılır (gri
  yazı)."
- **Google Önizlemesi.**
- **Kaydet**, **Vazgeç**, **Varsayılana dön** (alanları boşaltır; Kaydet ile
  uygulanır).

---

## 24. Görünüm

Adres: `/yonetim/gorunum`. Açıklama: "Haber, etkinlik ve blog yazılarındaki,
Hakkımızda sayfasındaki, yasal metinlerdeki ve kategori tanıtım metinlerindeki
yazıların punto ve renklerini buradan ayarlayın."

- Bilgi: "Bu ayarlar haber, etkinlik ve blog yazılarındaki, Hakkımızda
  sayfasındaki, yasal metinlerdeki (sipariş sözleşmeleri dahil) ve
  kategori/grup tanıtım metinlerindeki ara başlık, madde ve kalın vurguları
  etkiler. Sayfa başlıkları, menüler ve ürün sayfaları marka tasarımına bağlı
  olduğu için buradan değişmez."
- Yani ayarlar bütün biçimli metinlere uygulanır; sipariş sözleşmeleri Ön
  Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'dir.

**Ayarlar:**

| Bölüm | Ayar | Aralık | Başlangıç |
|---|---|---|---|
| Ara Başlık | Punto | 14–32 px | 18 |
| Ara Başlık | Renk | renk seçici veya kod | #141619 |
| Ara Başlık | BÜYÜK HARF göster | açık/kapalı | açık |
| Vurgu Rengi | Çizgi ve madde noktası | renk | #b82429 |
| Vurgu Rengi | Başlık altı çizgi genişliği | 0–160 px, 4'er | 40 ("0 yaparsanız çizgi gizlenir.") |
| Metin | Giriş paragrafı puntosu | 14–26 px | 18 |
| Metin | Gövde puntosu | 12–22 px | 15 |
| Metin | Gövde rengi | renk | #3d4348 |
| Metin | Kalın vurgu rengi | renk | #141619 |

- **Canlı önizleme:** Kaydedilmemiş ayarlarla örnek metni gösterir.
- **Ayarları Kaydet** → "Görünüm ayarları kaydedildi."
- **Varsayılana Dön:** Ayarları başlangıç değerlerine çeker; Ayarları Kaydet
  ile uygulanır.
- Ayarlar başka bir sekmede kaydedilirse ekran yenilenir; kaydedilmemiş
  değişiklik varsa korunur.

---

## 25. Siteden panele gelenler

| Sitedeki form | Panelde | Başlangıç durumu |
|---|---|---|
| Ödeme (sipariş) | Siparişler | Kartta Hazırlanıyor, havalede Ödeme Bekleniyor |
| Teklif Al | Teklifler | Yeni |
| Servis Talebi | Servis Talepleri | Yeni |
| Garanti Kaydı | Garantiler | — |
| Ürün değerlendirmesi | Yorumlar | Onay bekliyor |
| Üye Ol | Üyeler | Aktif |
| İletişim | — (yalnızca e-posta) | — |
| Bayilik Başvurusu | — (yalnızca e-posta) | — |
| Welders Club | — (yalnızca e-posta) | — |
| Ürün sayfası destek sorusu | — (yalnızca e-posta) | — |
| Bülten kaydı | — (hiçbir yere gitmez) | — |
| Şifremi Unuttum | — (hiçbir yere gitmez) | — |

- Bu formların hepsi ayrıca `info@zenweld.com`'a e-posta gönderir (bülten ve
  şifre hariç).
  - E-postada **Yanıtla** denince yanıt doğrudan formu dolduran kişiye gider.
  - Sipariş e-postasına T.C. kimlik no ve kart bilgisi yazılmaz.
  - Yalnızca e-postayla giden formlarda e-posta gönderilemezse ziyaretçiye hata
    gösterilir ve tekrar deneyebilir; panele kaydı olan formlar kaydı yine
    alır.
  - Her formda botlar için görünmez bir tuzak alanı vardır; onu dolduran
    gönderim e-posta olarak gelmez.
  - E-posta için sunucuda e-posta servisinin anahtarı tanımlı olmalıdır (bkz.
    README). Demo adresinde anahtar yoksa formlar başarılı görünür ama
    e-posta gitmez.
  - Ayrıntı: [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md).
- Panelden müşteriye e-posta gitmez.

---

## 26. Bütün panel adresleri

| Adres | Ekran |
|---|---|
| `/yonetim/giris` | Giriş |
| `/yonetim` | Panel (ana sayfa) |
| `/yonetim/siparisler` | Siparişler |
| `/yonetim/siparisler/<id>` | Sipariş detayı |
| `/yonetim/teklifler` | Teklifler |
| `/yonetim/magaza` | Mağaza Ayarları |
| `/yonetim/urunler` | Ürünler |
| `/yonetim/urunler/yeni` | Yeni ürün |
| `/yonetim/urunler/<id>` | Ürün düzenleme |
| `/yonetim/kategoriler` | Kategoriler |
| `/yonetim/kategoriler/yeni?grup=<id>` | Yeni kategori |
| `/yonetim/kategoriler/<id>` | Kategori düzenleme |
| `/yonetim/kategoriler/grup/yeni?bolum=<bölüm>` | Yeni grup |
| `/yonetim/kategoriler/grup/<id>` | Grup düzenleme |
| `/yonetim/secenekler` | Seçenek Tanımları |
| `/yonetim/stok` | Stok Matrisi › Bayi ve Satıcılar |
| `/yonetim/stok?sekme=urun[&urun=<id>]` | Stok Matrisi › Ürün Bazında |
| `/yonetim/stok?kaynak=dealer:<id>` / `retailer:<id>` | Kaynağın stok sayfası |
| `/yonetim/yorumlar` | Yorumlar |
| `/yonetim/bayiler` | Bayiler |
| `/yonetim/saticilar` | Online Satıcılar |
| `/yonetim/satis-temsilcileri` | Satış Temsilcileri |
| `/yonetim/uyeler` | Üyeler |
| `/yonetim/servis-talepleri` | Servis Talepleri |
| `/yonetim/garantiler` | Garantiler |
| `/yonetim/haberler`, `/yeni`, `/<id>` | Haberler |
| `/yonetim/etkinlikler`, `/yeni`, `/<id>` | Etkinlikler |
| `/yonetim/blog`, `/yeni`, `/<id>` | Blog |
| `/yonetim/hakkimizda` | Hakkımızda |
| `/yonetim/sss` | Sık Sorulan Sorular |
| `/yonetim/belgeler` | Belgeler |
| `/yonetim/yasal-metinler` | Yasal Metinler |
| `/yonetim/yasal-metinler/<id>` | Yasal metin düzenleme |
| `/yonetim/sayfa-seo` | Sayfa SEO |
| `/yonetim/gorunum` | Görünüm |

---

## 27. Bilinen durumlar

Bugünkü panelde bilinen, karar bekleyen ya da sonraya bırakılmış durumlar:

- **Ürün formunda olmayan alan — kaynak yöntemi (MIG, TIG, MMA…):** Ürün
  Seçici ve aramadaki yöntem eşleşmesi bu alana bakar; panelden eklenen ürün
  Ürün Seçici'de çıkmaz (bkz.
  [WEBSITE-KULLANIM.md › Bilinen durumlar](WEBSITE-KULLANIM.md#25-bilinen-durumlar)).
- **Ayrı ürünü seçeneğe dönüştürme:** Eski ayrı ürünün linkini bir seçeneğe
  yönlendirme bugün yalnızca örnek veride var; panelde bunu yapan bir
  işlem yok ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
- **Müşteriye bildirim:** Sipariş, teklif, servis ve garanti durumları
  değişince müşteriye e-posta gitmiyor.
- **Demo sınırları:**
  - Yetki kontrolü tarayıcıda yapılıyor.
  - Bütün veri tarayıcının yerel deposunda; başka tarayıcıda panel
    değişiklikleri görünmez.
  - Görseller veritabanının içine yazılıyor; belgeler tarayıcının dosya
    deposunda.
  - Süresi dolan havale siparişleri sayfa açılınca iptal ediliyor.
