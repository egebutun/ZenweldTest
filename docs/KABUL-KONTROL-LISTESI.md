# Kabul Kontrol Listesi — "Bitti mi?" Sorusunun Ölçüsü

Bu dosya sitenin ve panelin beklendiği gibi çalıştığını madde madde
doğrulamak içindir. Site yeniden kurulduğunda, büyük bir değişiklikten sonra
ya da canlıya çıkmadan önce baştan sona uygulanır.

**Nasıl kullanılır:**

- Her madde bir **işlem → beklenen sonuç** çiftidir. Sonuç tutuyorsa kutu
  işaretlenir.
- Parantez içindeki somut değerler bugünkü **örnek veriden** gelir (ör.
  MB-25 MIG Torcu). Örnek veri değiştiyse aynı durumu gösteren başka bir
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
- [ ] İş kuralları testleri (`npm test`) geçer.
- [ ] Tarayıcı testleri (`npm run build` sonra `npm run test:e2e`) geçer.
      Bunlar şu maddeleri kendiliğinden dener: bütün sayfaların açılması
      (hata, 404, "demo" yazısı, İngilizce, güvenlik politikası), güvenlik
      başlıkları, seçenekli ürünün kartla satın alınması, iki seçenekli
      üründe kombinasyon seçimi, sepette adet sınırı, teklif gönderme ve numarası, belge yükleme/açma/indirme,
      garanti bitiş günü, şifre değiştirme ve hesap silme, iade talebi.

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
      (MB-25 3 m: normal 2.412 ₺, kampanya %18 → **1.978 ₺**, KDV hariç
      1.648 ₺).
- [ ] %25 ve üzeri kampanyada "Flaş İndirim" yazar (Zenmask Auto 9000: %25 →
      4.140 ₺).

**Seçenekler** (MB-25 MIG Torcu):

- [ ] Sayfa açılınca ilk seçenek seçilidir (3 m).
- [ ] **4 m** seçilince: fiyat **2.214 ₺**, ürün kodu **ZW-TRC-MB25-4**,
      adres `?secenek=4-m`.
- [ ] **5 m** seçilince: fiyat **2.430 ₺** (KDV hariç 2.025 ₺), kod
      **ZW-TRC-MB25-5**; Teknik Özellikler'de "Ürün Kodu: ZW-TRC-MB25-5",
      "Hortum Uzunluğu: 5 m", "Ağırlık: 2,7 kg".
- [ ] `/urun/mig-torcu-mb25?secenek=5-m` doğrudan açılınca 5 m seçili gelir.
- [ ] **Eski ayrı ürünün linki** `/urun/mig-torcu-mb25-4m` →
      `/urun/mig-torcu-mb25?secenek=4-m`; `/urun/mig-torcu-mb36-3m` → MB-36
      3 m seçeneği.
- [ ] Gaz Nozulu Seti **20'li** seçilince: kod **ZW-NZL-SET-20**, fiyat
      **960 ₺**, Kutu İçeriği "20 x Gaz nozulu", Teknik Özellikler "Paket:
      20'li".
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

---

## 9. Üyelik ve Hesabım

- [ ] Üye Ol'da "Kullanım Koşulları" kutusu zorunludur ve boş gelir; kampanya
      e-postası kutusu isteğe bağlı ve boş gelir.
- [ ] Kayıt olan üye **hemen** giriş yapmış olur ve Hesabım'a gider; panel
      onayı gerekmez; "Onay Bekliyor" yazısı hiçbir yerde yoktur.
- [ ] Aynı e-postayla ikinci kayıt: "Bu e-posta adresi zaten kayıtlı."
- [ ] Yönetici hesabıyla sitede giriş: "Bu e-posta ile kayıtlı bir hesap
      bulunamadı."
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
      tekrar farklıysa "Şifreler eşleşmiyor.", 6 karakterden kısa yeni şifre
      reddedilir; başarılıysa "Şifreniz değiştirildi." Çıkış yapınca eski
      şifreyle giriş "Şifre hatalı." der, yenisiyle girilir.
- [ ] Profil › Hesabımı Sil: yanlış şifreyle silinmez; doğru şifre ve onayla
      silinir, Giriş sayfasında "Hesabınız silindi." yazar; aynı e-postayla
      giriş "hesap bulunamadı" der. Üyenin siparişleri panelde durur.
- [ ] Bireysel üyede teslim edilen siparişin detayında **İade Talebi
      Oluştur** teslim gününden itibaren 14 gün görünür, sonra görünmez;
      kurumsal üyede hiç görünmez.
- [ ] Ürün seçmeden gönderilen talep: "İade edilecek en az bir ürün seçin."
      Gönderilen talep `IAD-<yıl>-<4 hane>` numarası ve "Yeni" durumuyla
      görünür; açık talep varken düğme görünmez.
- [ ] Site ve panel oturumu ayrıdır; birinden çıkış diğerini etkilemez.

---

## 10. Teklif Al

- [ ] Sayfa girişsiz de açılır; üyede bilgiler hesaptan gelir.
- [ ] Yetkili, geçerli e-posta ve telefon olmadan 2. adıma geçilmez;
      ziyaretçi ve kurumsal üyede firma ünvanı zorunlu, bireysel üyede
      isteğe bağlı.
- [ ] Ürün listesinde yalnızca yayında ve "Teklife açık" ürünler vardır;
      seçenekli ürün her seçeneğiyle ayrı satırdır ("MB-25 MIG Torcu — 5 m
      (ZW-TRC-MB25-5)").
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
- [ ] E-posta anahtarı tanımlıyken her form `info@zenweld.com`'a
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
- [ ] Demo adresinde ve yerel bilgisayarda her sayfada "noindex" vardır;
      `robots.txt` site haritasını bildirmez.
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

**Teklifler:**

- [ ] Durum değişikliği müşterinin Tekliflerim sayfasına yansır.
- [ ] Temsilci ve iç not alandan çıkınca kaydedilir.
- [ ] CSV indirilir; `=` ile başlayan hücre Excel'de formül olarak çalışmaz.

**İade Talepleri:**

- [ ] Sitede açılan talep listede görünür; satıra tıklayınca ürünler,
      açıklama, iletişim bilgileri ve para iadesi uyarısı çıkar.
- [ ] Durum Onaylandı yapılıp kaydedilince müşteri sipariş detayında
      "Onaylandı" görür ve kalan ürünler için süre içinde yeni talep açabilir.

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

---

## 18. Panel: stok

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

---

## 21. Veri ve kalıcılık

- [ ] Panelde yapılan değişiklik sayfa yenilenince korunur.
- [ ] Panel bir sekmede, site başka sekmede açıkken değişiklikler birbirini
      silmez; diğer sekme güncel veriyi görür.
- [ ] Örnek veri değiştirildiğinde `DB_VERSION` artırılmışsa tarayıcıdaki
      veri örnek veriyle yeniden kurulur.
- [ ] **Canlıya çıkmadan:** örnek satış hareketleri
      (`sample-activity.seed.ts`) kaldırılmış, gerçek kargo/POS/IBAN değerleri
      ve gerçek yasal metinler girilmiş, e-posta anahtarı tanımlanmıştır
      ([YAPILACAKLAR.md](YAPILACAKLAR.md)).
