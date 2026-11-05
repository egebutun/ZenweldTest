# Kabul Kontrol Listesi — "Bitti mi?" Sorusunun Ölçüsü

Bu dosya sitenin ve panelin beklendiği gibi çalıştığını madde madde
doğrulamak içindir. Site yeniden kurulduğunda, büyük bir değişiklikten sonra
ya da canlıya çıkmadan önce baştan sona uygulanır.

**Nasıl kullanılır:**

- Her madde bir **işlem → beklenen sonuç** çiftidir. Sonuç tutuyorsa kutu
  işaretlenir.
- Parantez içindeki somut değerler bugünkü **örnek veriden** gelir (ör.
  Ultimate 250 MTC). Örnek veri değiştiyse aynı durumu gösteren başka bir
  kayıtla denenir; kural aynıdır.
- Denemeye **temiz tarayıcı verisiyle** başlanır (gizli pencere ya da site
  verisi silinmiş tarayıcı); panelde yapılan denemeler örnek veriyi değiştirir.
- Demo hesapların giriş bilgileri ve test kartı [README](../README.md)'dedir.
- Ayrıntılı davranış için: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md),
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md), [IS-KURALLARI.md](IS-KURALLARI.md).

---

## İçindekiler

1. [Hazırlık](#1-hazırlık)
2. [Genel](#2-genel)
3. [Menü, alt bilgi ve anasayfa](#3-menü-alt-bilgi-ve-anasayfa)
4. [Katalog](#4-katalog)
5. [Ürün sayfası ve seçenekler](#5-ürün-sayfası-ve-seçenekler)
6. [Arama ve Ürün Seçici](#6-arama-ve-ürün-seçici)
7. [Sepet](#7-sepet)
8. [Ödeme ve sipariş](#8-ödeme-ve-sipariş)
9. [Üyelik ve Hesabım](#9-üyelik-ve-hesabım)
10. [Teklif Al](#10-teklif-al)
11. [Formlar ve e-posta](#11-formlar-ve-e-posta)
12. [Garanti](#12-garanti)
13. [İçerik sayfaları, belgeler ve yasal metinler](#13-içerik-sayfaları-belgeler-ve-yasal-metinler)
14. [Arama motorları ve adresler](#14-arama-motorları-ve-adresler)
15. [Panel: giriş ve çerçeve](#15-panel-giriş-ve-çerçeve)
16. [Panel: satış](#16-panel-satış)
17. [Panel: ürünler, kategoriler, seçenekler ve filtreler](#17-panel-ürünler-kategoriler-seçenekler-ve-filtreler)
18. [Panel: stok](#18-panel-stok)
19. [Panel: bayi ağı, müşteriler ve servis](#19-panel-bayi-ağı-müşteriler-ve-servis)
20. [Panel: içerik ve ayarlar](#20-panel-içerik-ve-ayarlar)
21. [Veri ve kalıcılık](#21-veri-ve-kalıcılık)

---

## 1. Hazırlık

- [ ] `npm install` ve `npm run build` hatasız biter.
- [ ] `npm start` ile site açılır; anasayfa 200 döner.
- [ ] Tip kontrolü (`npx tsc --noEmit -p apps/zenweld-web/tsconfig.json`)
      hatasız geçer.
- [ ] Kod denetimi (`npm run lint`) hata ve uyarı vermez.
- [ ] `npm audit --omit=dev` (siteye giden kütüphaneler) açık göstermez.
- [ ] İş kuralları testleri (`npm test`) geçer.
- [ ] Tarayıcı testleri (`npm run build` sonra `npm run test:e2e`) geçer.
      Bunlar şu maddeleri kendiliğinden dener: bütün sayfaların açılması
      (hata, 404, "demo" yazısı, İngilizce, güvenlik politikası), güvenlik
      başlıkları, seçenekli ürünün kartla satın alınması, iki seçenekli
      üründe kombinasyon seçimi, sepette adet sınırı, teklif gönderme ve numarası, belge yükleme/açma/indirme,
      garanti bitiş günü, şifre değiştirme ve hesap silme, iade talebi,
      depo stoğu (STOKTA YOK, sepet ve ödeme engeli, panel sütunu), kupon
      (panelde oluşturma ve hata, sepette uygulama ve geçersiz kod, sonradan
      geçersiz kalan kuponla ödeme engeli, kuponlu sipariş ve kişi başı
      sınır, kişiye özel kupon panelde ve sepette).
- [ ] Veritabanı: boş bir PostgreSQL'de `npm run db:migrate` hatasız biter
      ve 64 tablo kurulur; ikinci çalıştırmada bir şey değişmez.
      `npm run db:generate` "No schema changes" der.
- [ ] `npm run db:seed` boş veritabanına örnek veriyi yükler ve tablo
      tablo satır sayılarını yazar (ör. products 40, orders 133); ikinci
      çalıştırmada "Veritabanında kayıt var…" deyip durur. `npm run
      db:studio`'da ürünler, siparişler ve kuponlar görünür.
- [ ] Veri yükleme (KARARLAR K-91): yalnızca `npm run db:migrate`
      çalışmış bir veritabanında `npm run db:yukle canli` katalog, içerik,
      ayarlar, bayiler ve depo stoğunu yükler ve tablo tablo eklenenleri
      yazar; `users`, `orders`, `reviews`, `coupons` ve `dealer_stock` boş
      kalır. Aynı komut ikinci kez çalışınca her satır "değişmeyen"dir.
      `npm run db:yukle deneme` ayrıca yorum, kupon ve bayi stoklarını
      ekler. `db:studio`'da bir ürünün fiyatı değiştirilince
      `npm run db:yukle canli eksikler` ona dokunmaz, `npm run db:yukle canli`
      eski fiyata döndürür. Adres `localhost` değilse komut veritabanının
      adını sorar; yanlış yazılırsa hiçbir şey yüklemez.
- [ ] Yönetici hesabı (`npm run yonetici:olustur`): boş bir veritabanında
      e-posta, ad, soyad, telefon ve iki kez şifre sorar; şifre ekranda
      görünmez; 8 karakterden kısa şifre ve eşleşmeyen tekrar kabul
      edilmez. `db:studio`'da `users`'ta rolü `admin`, şifre özeti
      `$argon2id$` ile başlar. Aynı e-postayla tekrar çalışınca şifre
      değiştirmeyi sorar; bir üyenin e-postasıyla hesap açmaz.
- [ ] SAP stok okuma (deneme dosyası; README › SAP stok okuma): site
      veritabanı modunda, `CRON_SECRET` ve `SAP_STOK_DOSYASI` tanımlıyken
      `npm run sap:stok` "50 kalem" okur. Dosyada stokta olan bir ürünün
      miktarı 0 yapılıp komut tekrar çalışınca "1 değişti" der ve ürün
      sayfası hemen STOKTA YOK olur; aynı komut değişiklik yokken "Değişiklik
      yok" der. Dosyada bir satırın kodu silinince komut "Stok okunamadı,
      son stok korundu" der, sayfa değişmez; `db:studio`'da `sap_sync_runs`'ta
      okumalar `success` / `failed` ve hata metniyle görünür. Dosyada
      yalnızca 5 satır bırakılınca komut "Yarım okuma olabilir" der ve stok
      değişmez; `npm run sap:stok zorla` ile uygulanır (KARARLAR K-93).
      Anahtarsız ya da yanlış anahtarla `/api/sap/stok` çalışmaz.
- [ ] Veritabanı testleri (`npm run test:db`) geçer. Şunları dener: tablo
      listesi ve kolonlar [VERITABANI.md](VERITABANI.md) ile aynı; ürün ve
      varyant kodları tek havuzda; Türkçe harf duyarsız adlar; üye e-postası;
      silme kuralları; filtre değerinin kategoriyle uyumu; tek varsayılan
      adres ve POS; kayıt numarası; değişiklik kaydının korunması ve 2 yıllık
      temizlik; kupon kodu, sınırları ve kullanımı; kişiye özel kupon
      e-postaları; kargo gönderisi; SAP depo stoğu; form kayıtlarının sabit
      değerleri; örnek verinin tablolara hatasız yüklenmesi, satır sayıları
      ve başlıca bağlar; tablolardan geri okunan verinin örnek veriyle
      birebir aynı olması (okuma katmanı).

---

## 2. Genel

- [ ] Sitede ve panelde İngilizce arayüz metni yoktur (anasayfadaki "Hot
      Sale" hariç; [KARARLAR.md](KARARLAR.md) K-01).
- [ ] `/tr`, `/en/...` adresleri 404 verir.
- [ ] Sitede ve panelde "demo" yazısı geçmez.
- [ ] Var olmayan bir adres 404 sayfası gösterir; panelde "Sayfa bulunamadı"
      ve "Panele dön".
- [ ] Bir sayfa hata verirse "Bir sorun oluştu", **Tekrar Dene** ve **Ana
      sayfaya dön** çıkar; üst menü ve alt bilgi yerinde kalır. (Elle
      denemek için geçici olarak hata veren bir sayfa gerekir; yazılımcı
      dener.)
- [ ] Her yanıtta güvenlik başlıkları vardır (tarayıcının geliştirici
      araçları › Ağ ya da `curl -I`): `Content-Security-Policy`,
      `Strict-Transport-Security`, `X-Frame-Options: DENY`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
      `Permissions-Policy`.
- [ ] Sitede ve panelde gezinirken tarayıcı konsolunda "Content Security
      Policy" uyarısı çıkmaz; bayi haritası, iletişim sayfasındaki Google
      Haritalar, blog/haber görselleri ve panelde açılan PDF belgeler
      görünür.
- [ ] Yayında olmayan ürün, blog yazısı, haber ve etkinliğin adresi 404
      verir; listelerde ve aramada görünmez.
- [ ] Telefon genişliğinde menü, ürün sayfası, sepet, ödeme ve panel
      kullanılabilir.

---

## 3. Menü, alt bilgi ve anasayfa

- [ ] Üst menü: Ekipmanlar · Güvenlik · Aksesuarlar · Dolgu Metalleri ·
      Keşfet · Destek ve Garanti.
- [ ] Bölüm menüsünde grup başlığı grup sayfasına, kategori kategori
      sayfasına gider; bölüm adına tıklanınca bölüm sayfası açılır.
- [ ] Mobil menüde her bölümde **Tümünü Gör** vardır; **Teklif Al bağlantısı
      yoktur** (masaüstüyle aynı).
- [ ] Sağ üstteki kullanıcı menüsünde Hesabım ve Siparişlerim vardır,
      **Tekliflerim yoktur**.
- [ ] Alt bilgide Politikalar & Yasal altında 11 yasal metin vardır.
- [ ] Alt bilgide bülten kaydı: izin kutusu boş gelir; işaretlemeden kayıt
      olmaz ("Bülten kaydı için onay kutusunu işaretleyin."); kayıt hiçbir
      yere gönderilmez.
- [ ] İlk ziyarette çerez bandı çıkar (Tümünü Kabul Et / Tümünü Reddet /
      Tanımlama Bilgisi Ayarları); seçim yapılınca aynı tarayıcıda bir daha
      sorulmaz.
- [ ] Anasayfada Yeni Gelenler'in altındaki sıra: bayi haritası → Neden
      Zenweld? → Müşterilerimiz Ne Diyor? → Sık Sorulan Sorular (ilk 8) →
      Teklif bandı → Bayilik bandı → Bloğumuzdan (en yeni 3).
- [ ] Kampanyası geçerli ürünler Kampanyalı Ürünler (Hot Sale) bölümünde en
      yüksek indirim önce görünür; kampanya bitince kendiliğinden çıkar.
- [ ] Anasayfa yorum şeridinde panelde "Anasayfada göster" denmiş en fazla 10
      onaylı yorum görünür.

---

## 4. Katalog

- [ ] `/ekipmanlar` grupları **resimli kartlarla** gösterir (Lazer Makineleri,
      Kaynak Makineleri).
- [ ] `/ekipmanlar/kaynak-makineleri` kategorileri **kartlarla** gösterir,
      ürün listelemez.
- [ ] Aksesuarlar menüsünün ilk grubu **Lazer Aksesuarları**'dır; altında
      Lazer Kaynak Kafaları, Lazer Temizleme Kafaları, Lazer Tel Sürme
      Üniteleri, Lazer Sarf Malzemeleri ve Lazer Yedek Parçaları vardır.
      Kartlarda sahibinin notlarından yazılan açıklama ve "0 ürün" görünür;
      kategori sayfası "Bu kategoriye henüz ürün eklenmedi." yazar.
- [ ] Güvenlik, Aksesuarlar ve Dolgu Metalleri'nde ürün yoktur (KARARLAR
      K-78): menüleri, bölüm ve grup sayfaları açılır; kartlarda "0 ürün",
      kategori sayfalarında "Bu kategoriye henüz ürün eklenmedi." yazar.
- [ ] Ekipmanlar'da sahibinin listelerindeki 40 ürün vardır (MMA 6, TIG 8,
      MIG 9, Çok Fonksiyonlu 6, Plazma 4, Lazer Kaynak 1, Lazer Temizleme 3,
      Lazer Markalama 3). Lazer Kaynak'ta yalnızca Y300 QCW var (Jasic lazer
      kaynaklar sonra, KARARLAR K-74). Fiyatlar temsili: 999.999 ₺ + KDV.
- [ ] ForceMIG serisi (125, 185 MP, 200, 205 DP) Çok Fonksiyonlu'dadır.
      Force serisi ürünlerin sayfasında Teknik Özellikler, Ürün Açıklaması,
      Kutu İçeriği ve Öne Çıkan Özellikler sahibinin listesindeki gibidir (ör.
      ForceArc 200: "Ağırlık: 3,56 kg"); yeni 5 Force ürününün kodu
      `ZW-GECICI-…`.
- [ ] Ürün adı model ve türü içerir (ör. "Ultimate 405 THP TIG Argon Kaynak
      Makinesi"); Jasic ürünlerinin adında "Jasic" yazar.
- [ ] Ultimate 405 MTS'de Hava Soğutmalı ve Su Soğutmalı seçilince fotoğraf
      o halin fotoğrafına değişir; `?secenek=su_3-m_5-m` linki su
      fotoğrafıyla açılır.
- [ ] Fotoğrafı olmayan ürün (ör. Ultimate 255 MMA) ve soğutma hali (ör.
      Ultimate 405 THP'de Hava) alt kategorinin kart çizimini gösterir;
      Force serisinin 9 ürünü (ör. ForceArc 200 MMA) ortak geçici
      fotoğrafı, ForceArc 400 CEL MMA çizimi gösterir;
      Ultimate 505 MTS'nin kartında su soğutmalı fotoğrafı görünür.
- [ ] Kategori sayfası ürünleri listeler; aynı gruptaki diğer kategorilerin
      şeridi yoktur.
- [ ] Kategoride "Önerilen" sıralama paneldeki Sıra numarasına göredir;
      eşit numaralar ada göre.
- [ ] MIG kategorisinde solda Model Serisi (Ultimate (6), Evomig (3)),
      Çalışma Modu ve Fiziki Yapı görünür; Şebeke Voltajı ve Amper görünmez.
      Lazer Temizleme'de Fiziki Yapı ve Lazer Tipi görünür, Güç görünmez.
- [ ] Evomig seçilince 3 ürün kalır ve adres `?model-serisi=evomig` olur;
      Puls da seçilince liste değişmez (Çalışma Modu eşlenmemiş).
- [ ] Panelde bir ürüne Fiziki Yapı: Kompakt işaretlenince sitede Kompakt
      seçilince yalnızca o ürün kalır; diğer Fiziki Yapı değerleri (0) ve
      soluk görünür.
- [ ] Filtreli adres yeni sekmede aynı seçimle açılır; ürün sayfasından geri
      dönülünce seçim korunur.
- [ ] Uyan ürün yoksa "Seçtiğiniz filtrelere uyan ürün yok." ve **Filtreleri
      Temizle** çıkar; Filtreleri Temizle seçimi ve sıralamayı sıfırlar,
      adres filtresiz olur.
- [ ] Telefonda filtreler "Filtreler (N)" penceresinde açılır.
- [ ] Filtresi olmayan kategoride (ör. MIG Torçları) yalnızca sıralama
      vardır.
- [ ] `/ekipmanlar?grup=kaynak-makineleri` 404 verir.
- [ ] Konum satırında (breadcrumb) her seviye tıklanabilir.
- [ ] Kategori ve grup kartında görsel yoksa ilk ürünün fotoğrafı görünür
      (örnek veride her kartın çizimi var; panelden Kart Görseli kaldırılarak
      denenir).
- [ ] Tanıtım metni girilmiş grup ve kategoride sayfanın altında "<ad>
      Hakkında" bölümü çıkar; boşsa çıkmaz.

---

## 5. Ürün sayfası ve seçenekler

**Fiyat ve kampanya:**

- [ ] Büyük fiyat KDV dahildir; altında "<tutar> KDV Hariç · KDV %20" yazar.
- [ ] Kampanyalı üründe normal fiyat üstü çizili, kampanya fiyatı vurgulu
      (Ultimate 250 MTC: normal 1.199.999 ₺, kampanya %12 → **1.055.999 ₺**,
      KDV hariç 879.999 ₺).
- [ ] %25 ve üzeri kampanyada "Flaş İndirim" yazar (ForceArc 200 MMA: %25 →
      899.999 ₺).

**Seçenekler** (Ultimate 250 MTC; torç uzunlukları temsili):

- [ ] Sayfa açılınca ilk seçenek seçilidir (3 m), kod **ZW30100000024-3M**.
- [ ] **4 m** seçilince ürün kodu **ZW30100000024-4M**, adres `?secenek=4-m`.
- [ ] **5 m** seçilince kod **ZW30100000024-5M**; Teknik Özellikler'de "Ürün
      Kodu: ZW30100000024-5M" ve "Torç Uzunluğu: 5 m".
- [ ] `/urun/ultimate-250-mtc?secenek=5-m` doğrudan açılınca 5 m seçili gelir.
- [ ] Kombinasyona panelde ayrı fiyat farkı, kutu içeriği ya da teknik değer
      girilince o kombinasyon seçildiğinde sitede o değerler görünür (örnek
      veride yok; panelde Seçenekler sekmesinden denenir).
- [ ] Seçenek değişince **yorumlar değişmez** (ortak havuz).
- [ ] Seçenek değişince "Stoktaki Bayileri Gör" ve online satıcılar o
      seçeneği stokta tutanlara göre değişir.

**Birden çok seçenek** (Ultimate 405 THP ve Ultimate 405 MTS):

- [ ] Ultimate 405 THP'de Soğutma (Hava / Su) ve Torç Uzunluğu (4 m / 8 m)
      ayrı satırdır; ilk kombinasyon Hava · 4 m seçili gelir, kod
      **ZW30100000011-4M**.
- [ ] **Su** ve **8 m** seçilince kod **ZW30100000012-8M**, adres
      `?secenek=su_8-m`; Teknik Özellikler'de "Soğutma: Su Soğutmalı",
      "Torç Uzunluğu: 8 m". Bu link o kombinasyonla açılır.
- [ ] Ultimate 405 MTS'de üç seçenek (Soğutma, Torç Uzunluğu 3/4/5 m, Ara
      Paket Uzunluğu 5/10 m); ör. Hava · 3 m · 5 m kodu
      **ZW30100000027-3M-AP5M**.
- [ ] Panelden bir kombinasyon çıkarılınca (ör. Su · 4 m) o değer diğer
      seçimle birlikte kesik çizgili ve soluk görünür; seçilince satılan ilk
      kombinasyona geçilir.
- [ ] Sepette ve teklif listesinde satır "Soğutma: Su Soğutmalı · Torç
      Uzunluğu: 8 m" yazar ve kombinasyonun kodunu gösterir.
- [ ] Y300 QCW'de Tepe Güç seçenekleri: 600 W (**ZW40100000113**), 1000 W
      (**ZW40100000114**).

**Diğer:**

- [ ] Sekmeler: Teknik Özellikler, Ürün Açıklaması, Kutu İçeriği, Garanti,
      SSS; kutu içeriği boş üründe Kutu İçeriği sekmesi görünmez.
- [ ] Favori kalbi **Sepete Ekle düğmesinin yanındadır**; tıklanınca ürün
      Favorilerim'e girer.
- [ ] Ürün sayfasında **teklif düğmesi ya da teklif yazısı yoktur.**
- [ ] Sepete Ekle her yayındaki üründe çalışır (Zenweld'de stok sınırı yok).
- [ ] Online satıcı kartları yalnızca stokta ve ürün linki olan satıcılardır;
      kart ürünün satıcıdaki sayfasına yeni sekmede gider; kartta "STOKTA"
      yazmaz, fiyat ve adet görünmez; Zenweld'in kendi mağazası en baştadır.
- [ ] "Stoktaki Bayileri Gör" yalnızca stoğu olan bayileri haritada gösterir.
- [ ] Değerlendirme yazılabilir; puan, ad ve yorum zorunlu; gönderince
      "Değerlendirmeniz alındı. Yayınlanmadan önce ekibimiz tarafından kontrol
      edilecek." yazar ve yorum panelde onaylanana kadar görünmez.
- [ ] Ürün destek sorusu gönderilebilir; soru boşken ve üye olmayan
      ziyaretçide e-posta ya da telefon olmadan gönderilmez.

---

## 6. Arama ve Ürün Seçici

- [ ] Arama Türkçe karakter farkını gözetmez ("kaynak" / "KAYNAK").
- [ ] Panelde ürüne yazılan anahtar kelimeyle ürün aramada bulunur.
- [ ] Aramadaki fiyat ürünün kendi KDV oranıyla hesaplanır.
- [ ] Seçenekli ürün kombinasyon koduyla bulunur (ör. `ZW30100000012` →
      Ultimate 405 THP). Seçenekli ürünün kartında kod yazmaz.
- [ ] Ürün Seçici açılır, üç soruyu sorar ve sonuç ekranına gelir.
      Sonuçların doğruluğu denenmez: sorular ve süzme mantığı bütün ürünler
      kesinleşince en son kurulacak ([KARARLAR.md](KARARLAR.md) K-69).

---

## 7. Sepet

- [ ] Aynı ürün ve seçenek tekrar eklenince adet artar; farklı seçenek ayrı
      satırdır ve seçenek adıyla kodu yazar.
- [ ] Adet 1–99 arasında kalır (500 yazılınca 99 olur).
- [ ] Ara toplam 5.000 ₺ altındaysa kargo 250 ₺ ve "ücretsiz kargoya kalan"
      tutar görünür; 5.000 ₺ ve üzerinde kargo ücretsiz.
- [ ] Yayından kaldırılan ürünün satırı sepette görünmez.
- [ ] Ürünün sepetteki seçeneği panelden kaldırılınca o satır görünmez.
- [ ] Sepet sayfa yenilenince ve sekmeler arasında korunur.

**Zenweld depo stoğu** (örnek veride ForceArc 280 MMA ve UV-5 stoksuz,
Ultimate 405 MTS'nin su soğutmalı kalemi stoksuz; [IS-KURALLARI.md ›
20](IS-KURALLARI.md#20-zenweld-depo-stoğu)):

- [ ] ForceArc 280 MMA'nın kartında görselin altında STOKTA YOK yazar ve
      kart düğmesi devre dışı STOKTA YOK'tur; ürün sayfasında adet kutusu ve
      Sepete Ekle yerine devre dışı STOKTA YOK görünür.
- [ ] Ultimate 405 MTS'nin kartında STOKTA YOK yazmaz; ürün sayfasında Su
      Soğutmalı seçilince STOKTA YOK, Hava Soğutmalı seçilince Sepete Ekle.
- [ ] Sepete eklenmiş bir ürünün stoğu 0 olunca sepette STOKTA YOK yazar,
      Ödemeye Geç devre dışı kalır ve uyarı çıkar; ödeme sayfasında Siparişi
      Tamamla aynı uyarıyı verir.
- [ ] Stoksuz ürün için Teklif Al'da teklif istenebilir; stoktaki bayiler
      ürün sayfasında gösterilmeye devam eder.

**Kupon** (örnek veride HOSGELDIN5, LAZER25000, YAZ10, OZEL15;
[IS-KURALLARI.md › 21](IS-KURALLARI.md#21-kuponlar)):

- [ ] Sepette "hosgeldin5" yazılıp Uygula'ya basılınca "HOSGELDIN5 kuponu
      uygulandı." ve özette "Kupon (HOSGELDIN5)" satırı çıkar; indirim
      ara toplamın %5'idir (tam lira).
- [ ] YAZ10: "Bu kuponun süresi dolmuş."; olmayan kod: "Bu kupon kodu
      geçerli değil."; kod sepete kaydedilmez.
- [ ] LAZER25000 lazer kaynak makinesi olmayan sepette "Sepetinizde bu
      kuponun geçerli olduğu ürün yok."; 500.000 ₺ altındaki sepette en az
      tutar uyarısı verir.
- [ ] Kupon düşüldükten sonra tutar ücretsiz kargo sınırının altına inerse
      kargo ücreti eklenir; kupon kargoya uygulanmaz.
- [ ] Kişiye özel OZEL15: girişsiz sepette uygulanır ve "ödeme adımında
      … kontrol edilir" notu çıkar; README'deki Bireysel hesapla giriş
      yapılınca "Bu kupon hesabınıza tanımlı değil…" olur ve ödemeye
      geçilmez. Panelde OZEL15'e bu hesabın e-postası eklenince uygulanır.
- [ ] Uygulanmış kupon panelden pasife alınınca sepette kırmızı uyarı çıkar,
      indirim düşülmez ve Ödemeye Geç devre dışı kalır; Kuponu kaldır ile
      devam edilir.

---

## 8. Ödeme ve sipariş

- [ ] Girişsiz `/odeme`: "Sipariş vermek için giriş yapın…" ve Giriş Yap /
      Üye Ol; girişten sonra ödemeye dönülür, sepet korunur.
- [ ] Kayıtlı adres seçilebilir; yeni adres girilip "adreslerime kaydet"
      ile kaydedilebilir.
- [ ] Bireysel faturada geçersiz T.C. kimlik no: "Geçerli bir T.C. kimlik
      numarası girin."
- [ ] Kurumsal faturada 10 haneden farklı VKN: "Vergi numarası 10 haneli
      olmalıdır."
- [ ] Geçersiz kart numarası, son kullanma ya da CVC hata verir.
- [ ] Test kartı girilince kart programı ve banka görünür; Tek Çekim her
      zaman vardır; taksitler o bankanın açık taksitleridir.
- [ ] Toplam 1.000 ₺ altındaysa yalnızca tek çekim sunulur.
- [ ] Vade farklı taksitte vade farkı ayrı satırda görünür ve düğmedeki tutara
      eklenir.
- [ ] Sözleşme onayı işaretlenmeden sipariş verilmez; bağlantılar siparişin
      bilgileriyle doldurulmuş Ön Bilgilendirme Formu ve Mesafeli Satış
      Sözleşmesi'ni açar.
- [ ] Kartla sipariş: "3D Secure doğrulanıyor…" beklemesi, sonra sipariş
      **Hazırlanıyor** durumunda açılır; numara `SIP-<yıl>-<5 hane>`.
- [ ] Havaleyle sipariş **Ödeme Bekleniyor** açılır; son ödeme bugün + 3 gün;
      banka hesapları ve IBAN kopyalama görünür.
- [ ] Sipariş sonrası sepet boşalır ve sipariş detayı açılır.
- [ ] Sipariş detayında ürün adı, seçenek ve kod sipariş anındaki gibidir;
      ürün panelde değiştirilse de değişmez.
- [ ] Kuponlu siparişte ödeme özetinde, sözleşmelerde, sipariş detayında ve
      "Yeni sipariş" e-postasında kupon satırı görünür; vade farkı kupon
      düşülmüş toplamdan hesaplanır.
- [ ] Kişi başı 1 kullanımlı kuponla sipariş veren üye aynı kuponu tekrar
      uyguladığında "Bu kuponu kullanım hakkınız dolmuş." görür.

---

## 9. Üyelik ve Hesabım

- [ ] Üye Ol'da "Kullanım Koşulları" kutusu zorunludur ve boş gelir; kampanya
      e-postası kutusu isteğe bağlı ve boş gelir.
- [ ] Kayıt olan üye **hemen** giriş yapmış olur ve Hesabım'a gider; panel
      onayı gerekmez; "Onay Bekliyor" yazısı hiçbir yerde yoktur.
- [ ] Aynı e-postayla ikinci kayıt: "Bu e-posta adresi zaten kayıtlı."
- [ ] Yönetici hesabıyla sitede giriş: "E-posta ya da şifre hatalı." (olmayan
      hesapla ve yanlış şifreyle de aynı mesaj).
- [ ] Panelde askıya alınan üye giriş yapamaz; açık oturumu kapanır.
- [ ] `/giris?next=https://baska-site` girişten sonra dış siteye gitmez.
- [ ] Hesabım menüsü: Genel Bakış, Profil, Tekliflerim, Siparişlerim,
      Favorilerim, Garantilerim, Adreslerim (bireysel ve kurumsal üyede
      aynı).
- [ ] Siparişlerim'de durum geçmişi ve kargo takip numarası görünür.
- [ ] Garantilerim'de "Yeni Garanti Kaydı" garanti kayıt sayfasına gider;
      form üyenin adı ve e-postasıyla dolu gelir.
- [ ] Adreslerim'de yeni adres eklenir; ilk adres varsayılan olur.
- [ ] Profil › Şifre Değiştir: yanlış mevcut şifre "Mevcut şifre hatalı.",
      tekrar farklıysa "Şifreler eşleşmiyor.", 8 karakterden kısa yeni şifre
      reddedilir; başarılıysa "Şifreniz değiştirildi." Çıkış yapınca eski
      şifreyle giriş "E-posta ya da şifre hatalı." der, yenisiyle girilir.
- [ ] Profil › Hesabımı Sil: yanlış şifreyle silinmez; doğru şifre ve onayla
      silinir, Giriş sayfasında "Hesabınız silindi." yazar; aynı e-postayla
      giriş "E-posta ya da şifre hatalı." der. Üyenin siparişleri panelde durur.
- [ ] Bireysel üyede teslim edilen siparişin detayında **İade Talebi
      Oluştur** teslim gününden itibaren 14 gün görünür, sonra görünmez;
      kurumsal üyede hiç görünmez.
- [ ] Ürün seçmeden gönderilen talep: "İade edilecek en az bir ürün seçin."
      Gönderilen talep `IAD-<yıl>-<4 hane>` numarası ve "Yeni" durumuyla
      görünür; açık talep varken düğme görünmez.
- [ ] Site ve panel oturumu ayrıdır; birinden çıkış diğerini etkilemez.
- [ ] Veritabanı modunda üyelik (Aşama 4.2): üye olunca `db:studio`'da
      `users`'ta görünür, şifre özeti `$argon2id$` ile başlar. Tarayıcının
      geliştirici araçlarında `zw_oturum` çerezi HttpOnly'dir; sayfa
      yenilense de oturum açık kalır. Çıkışta `sessions`'taki satır silinir.
      Bir hesaba 10 kez yanlış şifre girilince "Çok fazla deneme yapıldı. 15
      dakika sonra tekrar deneyin." çıkar, doğru şifreyle de girilmez. İki
      tarayıcıda aynı üyeyle girilip birinde şifre değiştirilince diğerinde
      Hesabım "Giriş Yap" kutusunu gösterir. Demo üyesinin (`bireysel@demo.com`)
      eski şifresi ilk girişte güçlü özete çevrilir.
- [ ] Şifre sıfırlama (veritabanı modu, K-95): Şifremi Unuttum'da kayıtlı ve
      kayıtsız e-postayla aynı mesaj çıkar; kayıtlı üye için
      `password_reset_tokens`'a bir satır yazılır, 15 dakika içinde tekrar
      istenince yeni satır yazılmaz. Resend tanımlıysa üyeye "Zenweld şifre
      sıfırlama" e-postası gelir; bağlantıyla yeni şifre belirlenince Giriş
      sayfasında "Şifreniz değiştirildi…" yazar, diğer cihazdaki oturum
      kapanır. Aynı bağlantı ikinci kez ve 1 saatten sonra "Bağlantı geçersiz
      ya da süresi dolmuş." der; `/sifre-sifirla` bağlantısız açılınca da.
- [ ] Adresler ve favoriler (veritabanı modu, Aşama 5.1, K-96): Adreslerim'de
      eklenen adres `addresses`'ta görünür; varsayılan değiştirilince ve
      varsayılan silinince kalan ilk adres varsayılan olur. Başka tarayıcıda
      aynı üyeyle girilince aynı adresler görünür; ödeme sayfasında
      varsayılan adres seçili gelir. 21. adres "En fazla 20 adres
      kaydedebilirsiniz." der. Giriş yapmadan iki ürünün kalbine basılır;
      giriş yapınca ikisi `favourites`'a yazılır ve Favorilerim'de görünür.
      Başka tarayıcıda biri çıkarılınca ilk tarayıcıda sayfa yenilenince o da
      gider. Çıkış yapınca kalpler boş görünür; tekrar girişte favoriler
      geri gelir.
- [ ] Siparişler (veritabanı modu, Aşama 5.2, K-97): sepette veritabanına
      eklenen bir kuponun kodu uygulanır, olmayan kod "Bu kupon kodu geçerli
      değil." der. Kartla verilen sipariş `orders`'ta "preparing" durumunda,
      sunucunun hesapladığı tutarla görünür; `card_last4` son 4 hanedir, kart
      numarasının tamamı hiçbir yerde yoktur. `payment_transactions`'ta o
      siparişin `sale` / `success` satırı vardır (`provider_ref`
      `TEMSILI-…`; K-108). Sipariş başka tarayıcıda aynı
      üyeyle Siparişlerim'de görünür. Ödeme sayfası açıkken ürünün fiyatı
      veritabanında değiştirilip "Öde"ye basılınca sipariş alınmaz ve
      "Fiyatlar güncellendi; ödenecek tutar artık <tutar>." çıkar. Havale
      siparişinin `due_at`'i geçmişe çekilince Siparişlerim açılırken sipariş
      "İptal Edildi" olur ve geçmişte "Ödeme süresi doldu" yazar. Teslim
      edilmiş siparişte açılan iade talebi `return_requests`'te görünür.
- [ ] SAP'a sipariş aktarımı (veritabanı modu, K-108; README › SAP sipariş
      aktarımı): kartla verilen siparişin `sap_order_exports`'ta `pending`
      satırı vardır; havale siparişinin yoktur, panelde **Ödeme Alındı**
      denince olur. Panel sipariş detayında SAP Aktarımı kutusu "Sırada"
      der. `npm run sap:siparis` siparişi `SAP_SIPARIS_DOSYASI`'na bir satır
      olarak yazar; kutu "Aktarıldı" ve "DENEME-<sipariş no>" gösterir.
      Satır `failed` yapılınca kutu "Aktarılamadı", son hata ve **Yeniden
      sıraya al** gösterir; basınca "Sırada" olur ve `audit_log`'a yazılır.
      Ödenip gönderilmeden iptal edilen sipariş "Aktarılmadı" olur.
      Anahtarsız ya da yanlış anahtarla `/api/sap/siparis` çalışmaz.
- [ ] Formlar (veritabanı modu, Aşama 5.3, K-98): ziyaretçi olarak gönderilen
      teklif `quotes`'ta `TKL-…` numarasıyla görünür; üyenin teklifi
      Tekliflerim'de görünür. Servis talebi `service_requests`'te, garanti
      kaydı `warranties`'te görünür; aynı seri numarası küçük harfle
      tekrar girilince "Bu seri numarası daha önce kaydedilmiş." der. Garanti
      sorgulamada seri numarası küçük harf ve boşlukla yazılsa da bulunur;
      Garantilerim'de görünür. Değerlendirme `reviews`'ta onaysız durur.
      İletişim formu `support_messages`'ta, Welders Club katılımı
      `welders_club_signups`'ta, bayilik başvurusu `dealer_applications`'ta
      görünür. Her form için `email_log`'da bir satır vardır (Resend
      tanımlı değilse durumu `skipped`).
- [ ] Veritabanı modunda panel (Aşama 4.3): oturumsuz `/yonetim/urunler`
      giriş ekranına (`?next=%2Fyonetim%2Furunler`) gider; yönetici girişinden
      sonra Ürünler açılır. `zw_panel` çerezi HttpOnly'dir; `sessions`'ta
      `admin` satırının bitişi girişten 8 saat sonradır. Sitede giriş yapmış
      üye `/yonetim`'i açınca giriş ekranını görür; üyenin bilgileriyle
      panele girilmez. Çıkış ya da yöneticinin askıya alınması oturumu
      kapatır.

---

## 10. Teklif Al

- [ ] Sayfa girişsiz de açılır; üyede bilgiler hesaptan gelir.
- [ ] Yetkili, geçerli e-posta ve telefon olmadan 2. adıma geçilmez;
      ziyaretçi ve kurumsal üyede firma ünvanı zorunlu, bireysel üyede
      isteğe bağlı.
- [ ] 2. adımda ürünler Lazer Makineleri / Kaynak Makineleri ve onların
      türlerine ayrılmış, fotoğraflı listelenir. Grupların "N model"
      toplamı Ekipmanlar'daki yayındaki ürün sayısıdır; başka bölümün ürünü
      yoktur (panelde bir ürünü Aksesuarlar'a taşıyınca listeden çıkar).
- [ ] Modele tıklayınca altında panel açılır. Seçenekli modelde
      (ör. Ultimate 405 MTS) Su Soğutmalı seçilince fotoğraf su soğutmalı
      hale, ürün kodu o kombinasyonun koduna geçer.
- [ ] Adet artırılıp **Teklif Listesine Ekle**'ye basınca "Teklif listenize
      eklendi." yazar; Teklif Listeniz'de satır o kombinasyonun fotoğrafı,
      seçenekleri ve koduyla görünür; modelde "✓ Listede" çıkar.
- [ ] Liste boşken "Teklif listeniz boş. Yukarıdan model seçip listeye
      ekleyin." yazar; ürün sayfasına yönlendiren yazı yoktur.
- [ ] Ürün eklenmeden teklif gönderilmez.
- [ ] Vadeli ödemede vade 30/45/60/90/120 gün (varsayılan 60).
- [ ] Gönderince teklif numarası `TKL-<yıl>-<4 hane>` görünür; liste boşalır;
      üyede teklif Tekliflerim'de durur.
- [ ] Panelde silinen teklifin numarası yeni teklife verilmez; en son
      teklif silinse de (örnek: TKL-…-0049 silinince yeni teklif 0050 olur).

---

## 11. Formlar ve e-posta

- [ ] Kişisel veri alan her formda "Kişisel verileriniz KVKK Aydınlatma
      Metni kapsamında işlenir." notu vardır; bağlantı yeni sekmede açılır.
- [ ] Formlardaki yasal bağlantılar yeni sekmede açılır; form kaybolmaz.
- [ ] Onay kutuları boş gelir (Kullanım Koşulları, sözleşme onayı, servis
      gizlilik onayı, kampanya e-postası izni, bülten izni).
- [ ] İletişim, Bayilik Başvurusu, Welders Club ve ürün destek sorusu
      gönderilir; demo adresinde e-posta servisi tanımlı değilse başarılı
      görünür.
- [ ] E-posta anahtarı tanımlıyken her form varsayılan adrese
      (`info@zenweld.com`; veritabanı modunda türün panelde yazılan
      alıcılarına)
      [IS-KURALLARI.md](IS-KURALLARI.md#18-form-e-postaları)'daki konu ve
      alanlarla e-posta gönderir; **Yanıtla** formu doldurana gider (yorum
      e-postası hariç).
- [ ] Sipariş e-postasında T.C. kimlik no ve kart bilgisi yoktur.
- [ ] Bot tuzağı alanı doldurulmuş gönderim e-posta üretmez.
- [ ] Servis Talebi: talep nedeni seçilmeden gönderilmez; şikayet en fazla
      400 karakter; gizlilik onayı zorunlu; talep `SRV-<yıl>-<4 hane>`
      numarasıyla panele düşer.

---

## 12. Garanti

- [ ] Garanti kaydında "12 ay ücretsiz garanti uzatması" kutusu boş gelir.
- [ ] Aynı seri numarası ikinci kez kaydedilemez: "Bu seri numarası daha önce
      kaydedilmiş." (büyük/küçük harf ve boşluk farkı önemsiz).
- [ ] Bitiş = kayıt tarihi + ürünün garanti süresi (+ uzatma 12 ay) (24 ay +
      uzatma → 36 ay sonrası).
- [ ] Gece 00:00–03:00 arasında yapılan kayıtta bitiş tarihi bir gün erken
      çıkmaz.
- [ ] Garanti Sorgulama seri numarasıyla kaydı bulur; bitiş günü dahil
      "geçerli", ertesi gün "Süresi Doldu".
- [ ] Kayıt, büyük harfle yazılmış e-postayla yapılsa da üyenin
      Garantilerim sayfasında görünür.

---

## 13. İçerik sayfaları, belgeler ve yasal metinler

- [ ] Haberler blog düzeninde, aynı boyutta kartlar; manşet yok.
- [ ] Etkinlikler ülke süzgeci ve Yaklaşan/Geçmiş ayrımıyla çalışır; bitiş
      günü dahil "yaklaşan".
- [ ] Satış Temsilcilerimiz'de bölge düğmeleri temsilcilerin bölgelerinden
      oluşur; Ara ve WhatsApp düğmeleri çalışır; panelde "Gizli" yapılan
      temsilci görünmez.
- [ ] Yetkili Bayi ve Servis Ağı haritası açılır; bayi türü rozetleri ve yol
      tarifi bağlantısı çalışır.
- [ ] MSDS, Kaynak Rehberi ve Parti Sertifikaları sayfalarında panelden
      yüklenen belgeler listelenir; ad, ürün, kod ve parti numarasıyla
      aranır; PDF "Görüntüle" ile, diğerleri "İndir" ile açılır; ürünü yayında
      olmayan belgede ürün adı tıklanamaz.
- [ ] 11 yasal metin kendi adresinde açılır (ör. `/yasal/kvkk`,
      `/garanti/kosullar`).

---

## 14. Arama motorları ve adresler

- [ ] Sayfa başlıkları "<sayfa> | ZENWELD" biçimindedir; ürün de "<ad> |
      ZENWELD" (kategori eklenmez).
- [ ] Panelde ürüne Marka yazılınca (ör. Jasic) sayfa kaynağındaki ürün
      bilgisinde (`"brand"` ve `product:brand`) o marka, boşsa Zenweld yazar.
- [ ] Zenweld deposunda stoğu olmayan ürünün sayfa kaynağındaki ürün
      bilgisinde `OutOfStock`, stoktaki üründe `InStock` yazar.
- [ ] Demo adresinde ve yerel bilgisayarda her sayfada "noindex" vardır;
      `robots.txt` site haritasını bildirmez. Tarayıcı testi bunu bilgisayarda
      her çalıştırmada dener (`tests/e2e/tarama.spec.ts`); canlı demo
      adresinde sayfa kaynağında `noindex` aranarak elle bakılır.
- [ ] `robots.txt` yalnızca `/api/` kapatır.
- [ ] `/sitemap.xml`: aramaya açık sabit sayfalar, bölüm/grup/kategori,
      yayındaki ürünler (seçeneksiz tek adres), blog, haber ve etkinlikler
      vardır; panel, hesap, sepet, ödeme, giriş, arama ve yasal metinler
      yoktur.
- [ ] Her sayfa kendi adresini canonical olarak bildirir.
- [ ] Panelde linki değiştirilen ürün/kategori/grup/blog/haber/etkinliğin
      eski adresi yeni adrese gider; grubun linki değişince kategorilerinin
      eski adresleri de yönlenir.
- [ ] Paylaşım önizlemesinde başlık, açıklama ve görsel vardır.

---

## 15. Panel: giriş ve çerçeve

- [ ] Girişsiz `/yonetim/...` → `/yonetim/giris?next=...`; girişten sonra
      istenen sayfa açılır.
- [ ] Site hesabıyla panele giriş yapılamaz.
- [ ] Panel sayfalarında `X-Robots-Tag: noindex` başlığı vardır.
- [ ] Bir panel ekranı hata verirse "Bir sorun oluştu", **Tekrar dene** ve
      **Panele dön** çıkar; sol menü yerinde kalır. (Elle denemek için
      geçici olarak hata veren bir ekran gerekir; yazılımcı dener.)
- [ ] Sol menü grupları: Satış, Ürünler, Bayi ve Satış Ağı, Müşteriler ve
      Servis, İçerik, Ayarlar; açık sayfanın grubu açık gelir.
- [ ] Panelde her silme onay ister (yorum silme dahil).
- [ ] Tarayıcı deposu dolunca kırmızı "Kaydedilemedi…" bandı çıkar ve
      "kaydedildi" mesajı görünmez.

---

## 16. Panel: satış

**Panel ana sayfası:**

- [ ] Dönem seçimi (Bugün / 7 / 30 / 90 gün) bütün grafikleri değiştirir ve
      hatırlanır.
- [ ] Değişim yüzdesi önceki dönemin aynı saatine kadarki kısmıyla
      karşılaştırılır (sabah saatlerinde anlamsız "−%70" çıkmaz).
- [ ] Üye sayısı yöneticiyi saymaz; "onay bekliyor" yazısı yoktur.
- [ ] "Hiçbir online satıcıda stokta olmayan ürünler"deki ürün, Stok
      Matrisi › Ürün Bazında'da o ürünü açık getirir.

**Siparişler:**

- [ ] Havale siparişinde **Ödeme Alındı** → Hazırlanıyor.
- [ ] Kargo firması ve takip numarası olmadan **Kargoya Ver** çalışmaz;
      girilince Kargoda; müşteri Siparişlerim'de takip numarasını görür.
- [ ] Kargoda iken takip numarası düzeltilebilir; **Teslim Edildi** → Teslim
      Edildi.
- [ ] Teslim edilmemiş sipariş nedenle iptal edilir; neden müşteride görünür;
      ödemesi alınmış siparişte iade uyarısı çıkar.
- [ ] Son ödeme günü geçmiş havale siparişi sayfa açılınca "Ödeme süresi
      doldu" notuyla iptal olur ve onaylanamaz; son gün 23:59'a kadar
      onaylanabilir.
- [ ] Kartlı siparişte tahmini banka komisyonu ve net tahsilat görünür.
- [ ] Kuponlu siparişte "Kupon (<KOD>)" satırı kupona bağlantılıdır ve her
      ürün satırında "Kupon payı" yazar; sipariş iptal edilince kuponun
      Kullanımlar sekmesinde "İptal edildi · sayılmıyor" olur ve kullanım
      sayısı azalır.

**Teklifler:**

- [ ] Durum değişikliği müşterinin Tekliflerim sayfasına yansır.
- [ ] Temsilci ve iç not alandan çıkınca kaydedilir.
- [ ] CSV indirilir; `=` ile başlayan hücre Excel'de formül olarak çalışmaz.

**İade Talepleri:**

- [ ] Sitede açılan talep listede görünür; satıra tıklayınca ürünler,
      açıklama, iletişim bilgileri ve para iadesi uyarısı çıkar.
- [ ] Durum Onaylandı yapılıp kaydedilince müşteri sipariş detayında
      "Onaylandı" görür ve kalan ürünler için süre içinde yeni talep açabilir.

**Kuponlar:**

- [ ] Satış › Kuponlar'da örnek kuponlar durumlarıyla görünür (YAZ10
      "Süresi doldu"); arama ve durum süzgeci çalışır.
- [ ] Yeni kupon: kod yazarken büyük harfe döner; "AB" gibi kısa kod,
      %101, bitişi başlangıçtan önce tarih ve aynı kod kaydedilmez, mesaj
      verir.
- [ ] Kapsam "Yalnızca seçilen…" iken seçim yapılmadan kaydedilmez; seçilen
      kategori ve ürünler etiket olarak görünür.
- [ ] Kimler Kullanabilir › "Yalnızca belirli kişiler" seçilip e-posta
      eklenmeden kaydedilmez; geçersiz e-posta eklenmez; üye olan e-postanın
      yanında adı, olmayanın yanında "henüz üye değil" yazar; listede
      "kişiye özel (<n> e-posta)" görünür.
- [ ] Pasife alınan kupon sepette "Bu kupon kodu geçerli değil." verir.
- [ ] Kullanılmamış kupon silinir; siparişte kullanılmış kuponun sil simgesi
      soluktur.

**Veritabanı modunda Satış ekranları (KARARLAR K-99):**

- [ ] Sitede verilen sipariş ve açılan iade talebi panelde görünür; sitede
      kullanılan kupon Kuponlar'da kullanım sayısına eklenir.
- [ ] Ödeme Alındı, Kargoya Ver, Teslim Edildi, iptal ve iç not başka
      tarayıcıda açılan panelde de görünür; müşteri Siparişlerim'de görür.
- [ ] Bir sekmede açık sipariş, başka sekmede değiştirilince (ör. kargoya
      verilince) ilk sekmede kaydedilmez: "Bu kayıt siz açtıktan sonra
      değişti; sayfayı yenileyin." Sayfa yenilenince kaydedilir.
- [ ] Aynı denemeler iade talebinde (durum, not) ve kuponda (düzenleme,
      aktif/pasif, silme) de geçerlidir.
- [ ] Yeni kupon oluşturulunca düzenleme sayfası açılır; sitede kupon kodu
      hemen kullanılabilir.
- [ ] Panel oturumu kapanmışken (ör. başka sekmede çıkış) yapılan işlem
      kaydedilmez: "Panel oturumunuz kapanmış. Lütfen yeniden giriş yapın."
- [ ] `npm run db:studio` › `audit_log`: her işlem, panel girişi ve çıkışı
      yöneticinin adıyla, değişen alanların eski ve yeni haliyle yazılmıştır.

**Veritabanı modunda Talepler ekranları (KARARLAR K-99, K-100):**

- [ ] Sitede gönderilen teklif, servis talebi, garanti kaydı ve yorum
      panelde görünür.
- [ ] Teklifin durumu seçilip hemen ardından iç not yazılınca ikisi de
      kaydedilir ("kayıt değişti" uyarısı çıkmaz); müşteri Tekliflerim'de
      yeni durumu görür.
- [ ] Panelde onaylanan yorum ürün sayfasında hemen görünür; yayından
      kaldırılınca gider; anasayfaya alınan yorum anasayfa şeridinde görünür.
- [ ] Garantide "+12 ay" işaretlenince bitiş tarihi 12 ay ileri gider;
      müşterinin Garantilerim sayfasında ve garanti sorgulamada görünür.
- [ ] Sitedeki Bayimiz Olun formu Bayi ve Satış Ağı › Bayilik
      Başvuruları'nda; iletişim formu ve ürün sayfasındaki destek sorusu
      Müşteriler ve Servis › Mesajlar'da; Welders Club katılımı Müşteriler
      ve Servis › Welders Club'da görünür.
- [ ] Başvurunun ve mesajın durumu ve iç notu kaydedilir; başvuru, mesaj
      ve Welders Club kaydı için silme düğmesi yoktur.
- [ ] Welders Club'da **Pasife al** satırı soluklaştırır ve "Pasif · <tarih>"
      yazar; **Aktif yap** geri alır.
- [ ] Bir sekmede açık kayıt başka sekmede değiştirilince ilk sekmede
      kaydedilmez: "Bu kayıt siz açtıktan sonra değişti; sayfayı yenileyin."

**Mağaza Ayarları:**

- [ ] Kargo sınırı ve ücreti değişince sepetteki kargo değişir.
- [ ] Kargo firması listesi boş kaydedilemez.
- [ ] POS kapatılınca o programdaki kart varsayılan POS'tan tek çekim olur.
      Aktif varsayılan POS yoksa panelde uyarı çıkar; programı eşleşmeyen
      kartla ödemede "Bu kartla şu an ödeme alınamıyor…" yazar.
- [ ] Aynı programda iki aktif POS varsa alttakinde "Kullanılmıyor: aynı
      programda üstte aktif POS var" yazar.
- [ ] Bir taksitin vade farkı değişince ödeme sayfasındaki tutar değişir.
- [ ] Havale süresi değişince yeni siparişlerin son ödeme tarihi değişir.
- [ ] POS API anahtarı ya da şifresi için alan yoktur.
- [ ] Aynı kargo firması iki kez yazılıp kaydedilince bir kez kalır.
- [ ] Kargo ve Ödeme sekmesinde değişiklik yapıp E-posta Alıcıları
      sekmesine geçip dönünce değişiklik durur.
- [ ] E-posta Alıcıları'nda geçersiz adres kaydedilmez ("<tür>: "<adres>"
      geçerli bir e-posta adresi değil."); büyük harfle yazılan adres küçük
      harfe döner.
- [ ] Kargo Firmaları'nda bir firmaya `https://…{takip}` biçiminde takip
      adresi girilip kaydedilince o firmayla kargoya verilmiş siparişte
      müşterinin sipariş detayında **Kargoyu takip et**, panel sipariş
      detayında "<firma> takip sayfasını aç" çıkar ve takip numarasıyla
      firmanın sayfasını açar. `{takip}` içermeyen adres kaydedilmez.
- [ ] Şirket ve İletişim'de MERSİS no girilince Ön Bilgilendirme Formu ve
      Mesafeli Satış Sözleşmesi'nin Satıcı bölümünde görünür (boşsa
      "[—]"); 16 rakam değilse kaydedilmez.
- [ ] Telefon, e-posta ya da merkez ofisin adresi değişince alt bilgide;
      ofisler değişince İletişim sayfasında değişir. Boş bırakılan sosyal
      medya simgesi alt bilgide görünmez.

**Veritabanı modunda Mağaza Ayarları (KARARLAR K-99, K-104, K-105):**

- [ ] Kargo ücreti değişince sepetteki kargo hemen değişir; işlem kaydına
      eski ve yeni değer yazılır. Hemen ardından eski değer yazılınca uyarı
      çıkmaz.
- [ ] Bir sekmede Mağaza Ayarları açıkken başka sekmede kaydedilirse ilk
      sekmede kaydedilmez ("Bu kayıt siz açtıktan sonra değişti; sayfayı
      yenileyin.").
- [ ] Varsayılan POS başka bir POS'a alınıp kaydedilince `db:studio`'da
      `payment_pos`'ta yalnızca o POS varsayılandır.
- [ ] E-posta Alıcıları'nda bir türe adres yazılınca o formun sonraki
      e-postası `email_log`'da bu adreslerle görünür; boşaltılınca
      `SUPPORT_EMAIL`'e döner.
- [ ] Kargo firmasına girilen takip adresi `db:studio` › `carriers` ›
      `tracking_url`'de görünür.
- [ ] Şirket ve İletişim kaydı sitede (alt bilgi, İletişim, sözleşmeler)
      hemen görünür; `settings`'te `company` satırı ve işlem kaydı
      yazılmıştır. Hemen ardından ikinci kayıtta uyarı çıkmaz.

---

## 17. Panel: ürünler, kategoriler, seçenekler ve filtreler

**Ürünler:**

- [ ] Yeni ürün oluşturulur ve sitede `/urun/<ad>` adresinde açılır; ada
      "Zenweld" yazılmaz.
- [ ] Sıra numarası verilen ürün kategoride o sırada görünür; boşsa sona
      eklenir.
- [ ] Başka ürünün kodu ya da başka ürünün **seçenek kodu** verilince kayıt
      olmaz (boşluk/büyük-küçük harf farkı da yakalanır).
- [ ] Kampanya %0 ya da %91 kaydedilmez; bitiş başlangıçtan önce olamaz;
      başlangıç gelecekteyse "Planlandı" rozeti çıkar ve fiyat değişmez.
- [ ] Görsel yükleme: büyük dosya küçültülür; çoklu seçimde sıra korunur;
      ilk görsel kapaktır.
- [ ] Seçenekler sekmesinde yalnızca kategoride işaretli tanımlar listelenir;
      kodsuz kombinasyon kaydedilmez; kombinasyonun fiyatı eksiye düşemez.
- [ ] En fazla 3 seçenek eklenir. Değer işaretlenince kombinasyonlar
      kendiliğinden oluşur; çöp kombinasyonu "Satılmayan kombinasyonlar"a
      taşır, oradan geri eklenir.
- [ ] Seçenekli ürüne ikinci seçenek eklenip ilk değeri işaretlenince var
      olan kombinasyonların kodları korunur; yeni değerin kombinasyonları boş
      kodla gelir ve kod girilmeden kayıt olmaz.
- [ ] Değer üründen kaldırılıp kaydedilince o değerin stok satırları silinir.
- [ ] Link değiştirilince eski link yeni linke yönlenir; aynı link başka
      üründe varsa kayıt olmaz.
- [ ] Ürün silinince stok satırları silinir; geçmiş sipariş ve teklifler
      etkilenmez.

**Kategoriler:**

- [ ] Ürünü olan kategori ve kategorisi olan grup silinemez.
- [ ] Oklarla sıra değişince menü ve kartlar değişir.
- [ ] Kategori başka gruba taşınınca adresi değişir, eski adres yönlenir,
      ürünleri kategoriyle gider.
- [ ] Kategoride kullanılan bir seçenek tanımının işareti kaldırılırken "N
      üründe kullanılıyor…" onayı çıkar; ürünlerin seçenekleri bozulmaz.
- [ ] Ekipmanların 8 alt kategorisinin Filtreler sekmesinde filtreler
      KARARLAR K-76'daki gibidir (ör. MIG: Model Serisi, Şebeke Voltajı,
      Amper, Çalışma Modu, Fiziki Yapı); Şebeke Voltajı, Amper ve Güç (W)
      "Değer yok; sitede görünmez" yazar.
- [ ] Ürünlerin Değerleri tablosunda Model Serisi her üründe işaretlidir
      (MIG: Ultimate 6, Evomig 3); diğer sütunlar açık sarıdır.
- [ ] Tabloda bir ürüne değer işaretlenip kaydedilince ürünün Filtreler
      sekmesinde aynı değer işaretli görünür; tersi de geçerlidir.
- [ ] Filtreye değer eklenince, adı düzeltilince ve sırası değişince
      sitede ve ürünün Filtreler sekmesinde de değişir; ürünlerde işaretli değer
      silinirken "N üründe işaretli" onayı çıkar ve kaydedince ürünlerden
      kalkar.
- [ ] Aynı adla ikinci filtre ya da filtre içinde aynı değer kaydedilemez.
- [ ] Ürünün kategorisi değiştirilip kaydedilince eski kategorinin filtre
      değerleri silinir.

**Seçenek Tanımları:**

- [ ] Üründe kullanılan tanım ve değer silinemez (kaç üründe kullanıldığı
      yazar).
- [ ] Değerin adı düzeltilince ürün sayfasında ve sepette yeni ad görünür;
      `?secenek=` bağlantısı çalışmaya devam eder.
- [ ] Aynı adla ikinci tanım, tanım içinde aynı değer iki kez kaydedilemez.

**Veritabanı modunda Seçenek Tanımları, Kategoriler ve gruplar, Ürünler (KARARLAR K-99, K-101):**

- [ ] Yeni seçenek tanımı, kategori ya da grup kaydedilince başka
      tarayıcıda açılan panelde de görünür; kategori ve grup sitenin
      menüsünde ve bölüm sayfasında hemen görünür.
- [ ] Kategorinin linki ya da grubu değişince sitede eski adres yeni adrese
      yönlenir ve yeni ad hemen görünür; grubun linki değişince gruptaki
      kategorilerin eski adresleri de yönlenir.
- [ ] Dosya deposu ayarlıyken (`DOSYA_KLASORU`, K-108) Kart Görseli
      alanında **Dosya Yükle** ile seçilen görsel yüklenir, alana
      `/dosya/gorsel/…` adresi gelir; kaydedilince sitede görünür. Depo
      ayarlı değilken **Dosya Yükle** yoktur; "Görsel yükleme dosya deposu
      kurulunca açılacak; şimdilik görsel adresi girin." yazar; görsel
      adresi girilip kaydedilince sitede görünür.
- [ ] Bir sekmede açık kategori formu, başka sekmede aynı kategori
      kaydedilince ilk sekmede kaydedilmez: "Bu kayıt siz açtıktan sonra
      değişti; sayfayı yenileyin." Oklarla sıra değiştirmek açık formu
      eskitmez.
- [ ] Filtreler sekmesindeki tabloda değer işaretlenmiş bir ürün, bu arada
      ürün formundan kaydedilmişse kategori kaydedilmez (aynı uyarı).
- [ ] Yeni tanım hemen ardından düzenlenince "kayıt değişti" uyarısı
      çıkmaz.
- [ ] Yeni ürün oluşturulunca düzenleme sayfası açılır; ürün sitede
      `/urun/<link>` adresinde girilen fiyatla görünür. Hemen ardından fiyat
      ve link değiştirilip kaydedilince uyarı çıkmaz; sitede yeni fiyat
      görünür, eski link yeni linke yönlenir.
- [ ] Ürünün Görseller sekmesinde (depo ayarlıyken) **Dosya Yükle** ile
      birkaç görsel seçilince seçilme sırasıyla eklenir; ürün kaydedilince
      sitede görünür, `DOSYA_KLASORU`'nda `gorsel/<yıl>/<ay>/` altında
      dosyaları vardır. SVG ya da içi görsel olmayan dosya "Bu dosya türü
      yüklenemez…" der. Depo ayarlı değilken **Dosya Yükle** yoktur; görsel
      adresi eklenince sitede görünür.
- [ ] Listede göz ile yayından kaldırılan ürünün sayfası açılmaz
      ("Sayfa bulunamadı"); yayına alınınca açılır. Silinen ürün listeden ve
      siteden gider; geçmiş tekliflerde adı kalır.
- [ ] Başka üründe kullanılan kod (büyük/küçük harf ve boşluk farkıyla da)
      ya da link girilince kaydedilmez.
- [ ] Kombinasyonu kaldırılan ürünün o kombinasyona ait bayi stok satırları
      Stok Matrisi'nden kalkar (`db:studio` › `dealer_stock`).
- [ ] `npm run db:studio` › `audit_log`: tanım, kategori ve grup
      değişiklikleri ile tablodan değişen ürünlerin filtre değerleri
      yazılmıştır; `redirects`'te eski adresler vardır.

---

## 18. Panel: stok

- [ ] Ürünler listesinde Depo Stoğu sütunu vardır; üstte "Depo stoğu SAP'tan
      okunur, panelden değiştirilmez · son okuma: …" yazar. ForceArc 280 MMA
      "Stokta yok"; Ultimate 405 MTS "<N> adet" ve "1/2 SAP kalemi stoksuz".

- [ ] Şablon İndir: yayındaki ürünler ve her kombinasyon kendi koduyla ayrı
      satırda.
- [ ] Dosya yüklenince önizleme açılır: okunan sütunlar, eşleşen /
      tanınmayan / hatalı satırlar, stoğa girecek / değişecek / çıkacak.
- [ ] Dosyada olmayan ürün stoktan çıkar (tam liste).
- [ ] Önceki listede ≥10 stoklu ürün varken yarıdan az ürünlü dosya, "tam
      liste" onayı olmadan uygulanmaz.
- [ ] Başlık satırı olmayan dosya uygulanmaz.
- [ ] Tanınmayan kod bir ürüne eşleştirilince sonraki dosyada kendiliğinden
      tanınır.
- [ ] Son yükleme **geri alınır**; stok önceki haline döner.
- [ ] Adet/fiyat/link tabloda düzeltilir; boş adet eski değerine döner; Tab
      ile sonraki alana geçilir.
- [ ] Stok geçerlilik süresi (3 gün) aşılan kaynağın ürünleri sitede
      görünmez ve listede "sitede gizli" uyarısı çıkar; 0 yapılınca sınır
      kalkar.
- [ ] Online mağazası olan bayinin linkli satırları hem haritada hem o
      mağazanın online satıcı kartında görünür; linksiz satır yalnızca
      haritada.
- [ ] Kombinasyon koduyla gelen satır yalnızca o kombinasyonu, ana kodla
      gelen satır bütün kombinasyonları stokta gösterir.

**Veritabanı modunda Stok Matrisi (KARARLAR K-99, K-103):**

- [ ] Listede her kaynağın "stoktaki / satır" sayısı `db:studio`'daki
      satırlarla aynıdır.
- [ ] Kaynak sayfasında adet 0 yapılınca ürün sayfasında o bayi "stoktaki
      bayiler"den hemen çıkar; geçmişte "Elle" kaydı yöneticinin adıyla
      görünür. Hemen ardından eski adet yazılınca uyarı çıkmaz.
- [ ] Bir sekmede kaynak sayfası açıkken başka sekmede aynı satır
      düzeltilirse ilk sekmedeki düzeltme kaydedilmez ("Bu kayıt siz
      açtıktan sonra değişti; sayfayı yenileyin.") ve kutudaki değer geri
      gelir.
- [ ] **Satır ekle** ile eklenen satır ve silinen satır `db:studio`'da
      görünür/kalkar; geçmişte "(yeni satır)" ve "listeden çıkarıldı"
      yazar.
- [ ] Stok geçerlilik süresi değişince ürün sayfalarındaki stoktaki
      bayiler hemen değişir.
- [ ] Dosya yüklenip **Stoğu Güncelle** denince satırlar `db:studio`'da
      dosyadaki listeyle değişir; ürün sayfasındaki stoktaki bayiler hemen
      değişir; geçmişte "Dosya" kaydı yöneticinin adıyla görünür.
- [ ] Önizleme açıkken başka sekmede aynı kaynağın bir satırı düzeltilirse
      **Stoğu Güncelle** uygulanmaz ("Bu kayıt siz açtıktan sonra değişti;
      sayfayı yenileyin.").
- [ ] Tanınmayan kod **Eşleştir** ile bağlanınca `sku_aliases`'ta görünür
      ve pencerede tanınmış olur.
- [ ] **Bu yüklemeyi geri al** ile stok `db:studio`'da yüklemeden önceki
      haline döner; geçmişte "Geri alma" kaydı düşer, düğme kaybolur.
- [ ] Altıncı dosya yüklemesinden sonra en eski yüklemenin `previous`
      kolonu boşalır; geçmiş kayıtları silinmez.

---

## 19. Panel: bayi ağı, müşteriler ve servis

- [ ] Bayi adı ve şehri, bayi türü olmadan bayi kaydedilmez; başka bayiye
      bağlı online mağaza seçilemez.
- [ ] Pasif bayi haritada görünmez.
- [ ] Online satıcının adı ve site adresi olmadan kayıt olmaz; pasif satıcı
      hiçbir ürün sayfasında görünmez.
- [ ] Satış temsilcisinde telefon 10 rakamdan azsa ya da e-posta geçersizse
      kayıt olmaz; sıra okları sitedeki sırayı değiştirir.
- [ ] Üyeler: rol seçimi hemen kaydedilir; kendi rolünü değiştiremez,
      kendini askıya alamaz; son aktif yönetici düşürülemez ya da
      silinemez.
- [ ] Askıdaki üyede **Aktifleştir** vardır; "Onayla" düğmesi yoktur.
- [ ] Üye silinince kayıtlı adresleri de silinir; siparişleri kalır.
- [ ] Servis talebinde durum ve iç not Kaydet ile kaydedilir; "Kaydedildi"
      yazar.
- [ ] Garantiler: bitiş tarihi değişikliği sitedeki sorgulamaya yansır; "+12
      ay" bitişe 12 ay ekler, kaldırılınca çıkarır; elle girilen tarih
      korunur.

**Veritabanı modunda Üyeler (KARARLAR K-35, K-36, K-99):**

- [ ] Sitede yeni üye olunca panelde Üyeler listesinde görünür (sayfa
      yenilenince); yönetici hesapları da listededir.
- [ ] Üyenin rolü Kurumsal yapılır, hemen ardından **Askıya al**'a basılır:
      uyarı çıkmaz, `db:studio`'da ikisi de görünür, işlem kaydına iki satır
      düşer. Askıdaki üye sitede giriş yapamaz; açık oturumu bir sonraki
      tıklamada kapanır.
- [ ] Kendi satırında rol listesi kapalıdır, **Askıya al** yoktur; yönetici
      satırında **Sil** kapalıdır.
- [ ] İki yönetici varken biri diğerini askıya alır; kalan tek aktif
      yönetici (başka tarayıcıdan) askıya alınmaya çalışılınca "Son aktif
      yöneticinin rolü değiştirilemez, askıya alınamaz." çıkar.
- [ ] Üye silinince `db:studio`'da adresleri ve oturumları da yoktur;
      siparişleri kalır, siparişin üye bağı boşalır.

**Veritabanı modunda İşlem Kaydı ve E-posta Kaydı (KARARLAR K-81, K-98, K-99):**

- [ ] Ayarlar menüsünde İşlem Kaydı ve E-posta Kaydı vardır (demo modunda
      yoktur).
- [ ] Panelde bir siparişin iç notu kaydedilince İşlem Kaydı'nda en üstte
      "Değiştirdi · Sipariş · SIP-…" satırı çıkar; "1 alan" açılınca eski
      ve yeni not görünür; sipariş adına tıklanınca sipariş açılır.
- [ ] İşlem "Giriş yaptı" seçilip **Süz**'e basılınca yalnızca girişler
      kalır; adres çubuğunda `islem=login` vardır, sayfa yenilenince süzgeç
      kalır. Bugünün tarihi başlangıç ve bitişe yazılınca yalnızca bugünün
      kayıtları görünür.
- [ ] 50'den çok kayıt varsa **Daha eski kayıtlar →** sonraki 50'yi
      getirir; **← En yeni kayıtlar** başa döner.
- [ ] Sitede teklif formu gönderilince E-posta Kaydı'nda "Teklif talebi"
      satırı çıkar; e-posta servisi ayarlı değilse durumu "Gönderilmedi"dir
      ve nedeni yazar. Teklif numarasına tıklanınca Teklifler açılır.

**Veritabanı modunda panel ana sayfası (KARARLAR K-99):**

- [ ] Panel ana sayfasındaki Sipariş, Üye, Teklif ve Garanti Kaydı
      kutularının sayıları `db:studio`'daki satır sayılarıyla aynıdır (Üye'de
      yöneticiler sayılmaz).
- [ ] Sitede kartla sipariş verilince sayfa yenilenince Sipariş sayısı bir
      artar; Ciro grafiğinde bugüne eklenir ("Bugün" seçiliyken).
- [ ] Ödeme süresi geçmiş havale siparişi ana sayfa açılınca "İptal Edildi"
      olur ve "işlem bekliyor"da sayılmaz.

**Veritabanı modunda Bayiler, Online Satıcılar, Satış Temsilcileri (KARARLAR K-99, K-103):**

- [ ] Yeni bayi kaydedilince Yetkili Bayi ve Servis Ağı haritasında hemen
      görünür; adı değişince haritada da değişir; hemen ardından yeniden
      kaydetmek "kayıt değişti" uyarısı vermez.
- [ ] Silinen bayinin stok satırları, stok geçmişi ve kod eşleştirmeleri
      `db:studio`'da da yoktur; bayilik başvurusundaki bağlantısı boştur.
- [ ] Bir sekmede bayi formu açıkken başka sekmede bağlı olduğu online
      mağaza silinirse ilk sekmede kaydedilmez ("Bu kayıt siz açtıktan
      sonra değişti; sayfayı yenileyin.").
- [ ] Temsilci formunda **Dosya yükle** yoktur; fotoğraf adresi girilir.
      Eklenen temsilci Satış Temsilcilerimiz sayfasında hemen görünür,
      gizlenince gider.
- [ ] `db:studio` › `audit_log`: bayi, satıcı ve temsilci değişiklikleri
      yazılmıştır.

---

## 20. Panel: içerik ve ayarlar

- [ ] Yorum: Onayla → üründe görünür; Anasayfada göster en fazla 10; sınıra
      yalnızca onaylı ve ürünü yayında olanlar sayılır.
- [ ] Haber, blog, etkinlik "Yayında" kaydedilince **hemen** sitede görünür
      (ileri tarih seçilse de).
- [ ] Etkinlikte "Öne çıkan" seçeneği yoktur; bitiş başlangıçtan önce olamaz.
- [ ] Blog yazarı boşsa "Zenweld" olur.
- [ ] Hakkımızda: başlık zorunlu; rakam ve bölümler eklenip sıralanır; sitede
      görseli olan bölüm yan yana görünür.
- [ ] SSS sırası sitedeki SSS sayfasında, ürün sekmesinde ve anasayfada (ilk
      8) aynıdır.
- [ ] Belgeler: dosya seçicide yalnızca PDF, Word, Excel, JPG, PNG ve ZIP
      çıkar; 25 MB'tan büyük dosya yüklenmez; yayından kaldırılan belge
      sitede görünmez.
- [ ] Yasal metin başlığı değişince alt bilgideki ad da değişir; adres
      değişmez.
- [ ] Sayfa SEO: başlık değişince sayfanın sekme başlığı değişir; Varsayılana
      dön + Kaydet varsayılana döndürür.
- [ ] Görünüm: punto ve renk değişikliği haber, blog, Hakkımızda ve yasal
      metinlere yansır; Varsayılana Dön + Ayarları Kaydet başlangıç
      değerlerine döndürür.
- [ ] Görünüm: renk kod kutusuna "#fff" ya da "kırmızı" yazılınca
      kaydedilmez; "Gövde rengi #RRGGBB biçiminde olmalı…" uyarısı çıkar.

**Veritabanı modunda içerik (KARARLAR K-99, K-101, K-104, K-108):**

- [ ] Yeni haber (etkinlik, blog yazısı) kaydedilince `db:studio`'da görünür
      ve sitede hemen açılır; işlem kaydına yazılır.
- [ ] Haberin linki değişince eski adres yeni adrese gider; haber
      silinince `redirects`'teki satırı da silinir.
- [ ] Görseller sekmesinde (depo ayarlıyken) **Dosya Yükle** görseli
      yükler; kaydedilen haber sitede görseliyle açılır. Depo ayarlı
      değilken **Dosya Yükle** yoktur, "Görsel yükleme dosya deposu
      kurulunca açılacak…" notu vardır; adres girilerek görsel eklenir.
- [ ] Bir sekmede açık haber başka sekmede kaydedilince ilk sekmede
      kaydedilmez ("Bu kayıt siz açtıktan sonra değişti; sayfayı
      yenileyin.").
- [ ] SSS'te soru eklenir, oklarla taşınır, silinir; SSS sayfası hemen
      değişir. Taşıdıktan sonra aynı soru pencerede düzeltilip kaydedilir
      (uyarı çıkmaz).
- [ ] Hakkımızda kaydı sitede hemen görünür; hemen ardından ikinci kayıtta
      uyarı çıkmaz.
- [ ] Belgeler (depo ayarlıyken, K-108): Belge Ekle penceresinde PDF
      seçilip kaydedilince belge sitedeki sayfada hemen görünür, listede
      boyutu yazar; **Görüntüle** dosyayı `/dosya/belge/…` adresinde açar.
      Adı `.pdf` olup içi PDF olmayan dosya "Bu dosya türü yüklenemez…"
      der; 25 MB'tan büyük dosya yüklenmez. Yayından kaldırılan belge
      sitede görünmez; silinen belge `db:studio`'da da yoktur.
- [ ] Belgeler (depo ayarlı değilken, K-104): Belge Ekle penceresinde dosya
      seçme yoktur; **Dosya adresi** alanı ve "Dosya yükleme dosya deposu
      kurulunca açılacak…" notu vardır. `https://` ile başlamayan adres
      kaydedilmez. Adresle eklenen belge sitedeki sayfada hemen görünür,
      **Görüntüle** o adresi yeni sekmede açar; boyut yazmaz.
- [ ] Yükleme ucu (`/api/yonetim/dosya`) panel oturumu olmadan çalışmaz;
      `/dosya/` altında olmayan ya da geçersiz bir adres "bulunamadı" der.
- [ ] Belge sayfasının başlığı ve açıklaması sitede hemen değişir.
- [ ] Yasal metin kaydı sitede hemen görünür; hemen ardından ikinci kayıtta
      uyarı çıkmaz. Bir sekmede açık metin başka sekmede kaydedilince ilk
      sekmede kaydedilmez.
- [ ] Sayfa SEO: kaydedilen başlık sayfanın sekme başlığında hemen görünür;
      Varsayılana dön + Kaydet ile `page_seo` satırı silinir.
- [ ] Görünüm kaydı sitedeki biçimli metinlere hemen yansır; hemen ardından
      ikinci kayıtta uyarı çıkmaz.
- [ ] `db:studio` › `audit_log`: yasal metin, sayfa SEO, belge ve Görünüm
      değişiklikleri yazılmıştır.

---

## 21. Veri ve kalıcılık

- [ ] Panelde yapılan değişiklik sayfa yenilenince korunur.
- [ ] Panel bir sekmede, site başka sekmede açıkken değişiklikler birbirini
      silmez; diğer sekme güncel veriyi görür.
- [ ] Örnek veri değiştirildiğinde `DB_VERSION` artırılmışsa tarayıcıdaki
      veri örnek veriyle yeniden kurulur.
- [ ] `DATA_SOURCE` boşken site bugünkü gibi çalışır: panelde değiştirilen
      ürün fiyatı sitede görünür.
- [ ] `DATA_SOURCE=database` ile derlenip açılan sitede (README ›
      Veritabanı) ürünler, kategoriler, seçenekler, depo stoğu ve mağaza
      ayarları veritabanından gelir: `db:studio`'da bir ürünün fiyatı
      değiştirilince en geç bir dakika sonra ürün sayfasında, menüde ve
      sepette yeni fiyat görünür; depo stoğu 0 yapılan ürün STOKTA YOK
      olur ve sepete eklenmez.
- [ ] Aynı modda: `db:studio`'da bir ürüne online satıcı stoğu (adet > 0,
      link, bugünün tarihi) eklenince en geç bir dakikada ürün sayfasında
      satıcı kartı çıkar; bir bayinin o üründeki stoğu 0 yapılınca
      "Stoktaki bayileri gör" listesinden düşer; bayinin adı değişince Bayi
      Bul'da, öne çıkan yorumun başlığı değişince anasayfada yeni hali
      görünür. Sayfa kaynağında satıcının fiyatı ve başka ürünlerin bayi
      stoğu yer almaz.
- [ ] Aynı modda içerik: `db:studio`'da blog yazısının başlığı ve metni,
      bir yasal metin, bir SSS sorusu, bir haber başlığı, bir satış
      temsilcisinin adı ve Sayfa SEO'da bir sabit sayfanın başlığı
      (`page_seo`) değiştirilince en geç bir dakikada sitede, sekme
      başlığında ve site haritasında (yeni blog yazısı) görünür. Yasal
      metnin ve blog yazısının gövdesi yalnızca kendi sayfasının kaynağında
      yer alır.
- [ ] Aynı modda `REVALIDATE_SECRET` tanımlıyken: `db:studio`'da yapılan
      değişiklikten sonra `npm run site:yenile` çalıştırılınca sayfa bir
      sonraki açılışta yenidir (beklemeden). Anahtarsız ya da yanlış
      anahtarla yenileme isteği reddedilir; anahtar tanımlı değilse uç
      kapalıdır (tarayıcı testi de dener).
- [ ] Aynı modda veritabanı kapanırsa yayındaki sayfalar son hazırlanmış
      haliyle açılmaya devam eder; veritabanı açılınca güncel veri gelir.
- [ ] `npm run test:e2e:db` geçer: veritabanı modunda bütün sayfalar
      hatasız açılır; bütün ürünlerin fiyatı ve stok durumu veritabanıyla
      aynıdır; değişiklik yenilemeden sonra hemen görünür; bayi stoğu,
      satıcı fiyatı ve yasal metin gövdesi yalnızca gereken sayfadadır; üye
      kartla satın alabilir. (Yukarıdaki veritabanı modu maddelerinin
      çoğunu bu test dener.)
- [ ] **Canlıya çıkmadan:** örnek satış hareketleri
      (`sample-activity.seed.ts`) kaldırılmış, gerçek kargo/POS/IBAN değerleri
      ve gerçek yasal metinler girilmiş, e-posta anahtarı tanımlanmıştır
      ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
