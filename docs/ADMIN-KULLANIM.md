# Yönetim Paneli Kullanım Kılavuzu

> Bu kılavuz Zenweld ana sitesinin yönetim panelidir (`/yonetim`).

Sol menü gruplar halindedir; grup başlığına tıklayınca sayfaları açılır, açık
olan sayfanın grubu kendiliğinden açık gelir:

| Grup | Sayfalar |
|---|---|
| Panel | Özet |
| Satış | Siparişler · Teklifler · Mağaza Ayarları |
| Ürünler | Ürünler · Kategoriler · Stok Matrisi · Yorumlar |
| Bayi ve Satış Ağı | Bayiler · Online Satıcılar · Satış Temsilcileri |
| Müşteriler ve Servis | Üyeler · Servis Talepleri · Garantiler |
| İçerik | Haberler · Etkinlikler · Blog · Hakkımızda · Sık Sorulan Sorular · Belgeler · Yasal Metinler · Sayfa SEO |
| Ayarlar | Görünüm |

Panel adresi: `http://localhost:3000/yonetim` (canlıda `zenweld.com/yonetim`)
Demo giriş: `admin@zenweld.com` / `admin123`

> Panel ana sitenin içinde, kendi bölümünde çalışır ve kendi giriş ekranı vardır. Ana
> sitenin "Giriş Yap" sayfası yönetici hesaplarını kabul etmez; sitede panele
> giden bir bağlantı da yoktur. Panelden çıkış yapmak sitedeki oturumu etkilemez.

> Panel yalnızca Türkçedir. Backend gelene kadar değişiklikler tarayıcının yerel
> deposunda saklanır; başlangıç verisi `packages/data` içindeki örnek verilerdir.
> Depo dolarsa sayfanın üstünde kırmızı **"Kaydedilemedi"** uyarısı çıkar ve
> "kaydedildi" mesajı görünmez; büyük görseller veya kullanılmayan kayıtlar
> silinip tekrar denenir.

---

## 1. Panel (Dashboard)

En üstteki **Bugün / Son 7 gün / Son 30 gün / Son 90 gün** seçimi altındaki
tüm grafikleri aynı döneme göre gösterir (seçim tarayıcıda hatırlanır).
Değişim yüzdeleri bir önceki eşit uzunluktaki dönemin **aynı saatine kadarki**
kısmıyla karşılaştırılır: bugün 09:00'da, dünün 00:00–09:00 arası. Böylece
süren gün tam bir günle karşılaştırılmaz. "Üye" kartı ve grafiği yönetici
hesaplarını saymaz.

| Grafik | Ne gösterir |
|---|---|
| **Özet kutuları** | Ciro, sipariş sayısı, ortalama sepet, yeni üye |
| **Ciro** | Saatlik (Bugün), günlük (7/30 gün) veya haftalık (90 gün) ciro |
| **Sipariş durumları** | Dönemde verilen siparişlerin şu anki durumu; işlem bekleyenler vurgulu |
| **Ödeme yöntemi** | Kart tek çekim / taksitli / havale oranı ve taksit sayıları |
| **En çok satan ürünler** | Ciroya göre ilk 5 ürün (üzerine gelince adet) |
| **Ürün grubuna göre ciro** | Kaynak Makineleri, MIG Telleri … |
| **Teklif hunisi** | Gelen → incelenen → teklif verilen → kazanılan; kazanma oranı |
| **Yeni üyeler** | Bireysel ve kurumsal yeni kayıtlar |
| **Şehirlere göre sipariş** | Teslimat adresine göre ilk 10 şehir |
| **Servis ve garanti** | Servis talebi ve garanti kaydı sayısı; en çok talep gelen modeller |

- **Ciro** = iptal edilmeyen siparişlerin toplamı (KDV ve vade farkı dahil).
- Grafiklerin üzerine gelince ayrıntı kutusu açılır; "Tablo olarak göster" ile
  tüm değerler tablo halinde görülür.
- Grafiklerdeki örnek hareketler `packages/data/src/seed/sample-activity.seed.ts`
  dosyasından gelir (son 90 güne yayılmış örnek üye, sipariş, teklif, servis
  talebi ve garanti kaydı). Canlıya çıkmadan önce silinmelidir.

Grafiklerin altında **Genel durum** kartları: aktif ürün, üye, online satıcı, teklif ve sipariş sayıları
(üye, teklif ve sipariş yalnızca ana sitenin kayıtlarıdır; bayi kayıtları sayılmaz).
Onay bekleyen üye, yeni teklif ve işlem bekleyen sipariş (havale onayı veya
kargoya verilecek) varsa kartta uyarı rozeti çıkar.

Altta **"Hiçbir online satıcıda stokta olmayan ürünler"** listesi vardır. Bu
ürünlerin sayfasında online satıcı bölümü boş görünür — listeye tıklayarak
doğrudan stok matrisine gidebilirsiniz.

---

## 2. Ürünler

### Ürün listesi
- Liste sitedeki gibi dizilir: menüdeki kategori sırası, kategori içinde **Sıra**
- Ad veya SKU ile arama, bölüme göre filtreleme
- 👁 simgesi: ürünü yayından kaldırır / yayına alır
- ✏️ simgesi: düzenleme ekranı
- 🗑 simgesi: ürünü ve tüm stok kayıtlarını siler

### Ürün düzenleme / yeni ürün
Altı sekme vardır:

| Sekme | İçerik |
|---|---|
| **Temel Bilgiler** | Ad, SKU, model kodu, bölüm, kategori, **Sıra**, fiyat (KDV hariç → dahil otomatik hesaplanır), durum işaretleri, kılavuz PDF bağlantısı |
| **Açıklamalar** | Kısa/detaylı açıklama, öne çıkan özellikler |
| **Görseller** | URL ile ekleme veya dosya yükleme, sıralama, kapak seçimi |
| **Teknik Özellikler** | Satır satır özellik–değer tablosu |
| **Kutu İçeriği** | Madde listesi |
| **SEO** | Ürün linki, sayfa başlığı, açıklama, anahtar kelimeler, Google önizlemesi |

**Sıra:** Ürünün kendi kategorisinde kaçıncı göründüğü. Kategori sayfasındaki
"Önerilen" sıralama ve kategori kartında görsel yoksa kullanılan ürün buna
göre belirlenir. Küçük numara önce gelir; aynı numaralı ürünler ada göre dizilir.
Yeni ürünün Sırası boş bırakılırsa kategorinin sonuna eklenir.

**Ürün adı:** Ürün adına marka ("Zenweld") yazılmaz; sayfa başlığına
"| ZENWELD" otomatik eklenir.

**SEO sekmesi:**
- **Ürün Linki:** Ürün sayfasının adresi (`/urun/…`). Yeni üründe addan otomatik
  oluşur. Kayıtlı bir ürünün linki değiştirilirse eski link yeni linke
  yönlendirilir; paylaşılmış bağlantılar ve Google'daki eski sonuç çalışmaya devam
  eder. Yönlenen eski linkler sekmede listelenir. Başka bir ürün bu eski linki
  alırsa yönlendirme kalkar, link o ürünü açar.
- **Ürün Sayfa Başlığı:** Tarayıcı sekmesinde ve Google sonucunda görünen başlık.
  Boş bırakılırsa "Ürün adı — Kategori | ZENWELD" kullanılır. 60 karakteri
  geçmemesi önerilir.
- **Açıklama:** Google sonucunda başlığın altında görünen metin. Boş bırakılırsa
  ürünün kısa açıklaması kullanılır. 160 karakteri geçmemesi önerilir.
- **Anahtar Kelimeler:** Virgülle ayrılır. Ürün site içi aramada bu kelimelerle de
  bulunur ve sayfanın `keywords` etiketine yazılır. Google bu etiketi sıralamada
  kullanmaz; görünürlüğü asıl belirleyen başlık, açıklama ve sayfa içeriğidir.

Aynı **SEO sekmesi blog yazılarında, haberlerde ve etkinliklerde** de vardır
(İçerik menüsü). Link, eski linkin yönlendirilmesi ve anahtar kelimeler ürünlerdeki
gibi çalışır. Boş bırakılan başlık yerine "Başlık | ZENWELD", boş açıklama yerine
yazının/haberin özeti ve etkinliğin kısa açıklaması kullanılır.

**Durum işaretleri:**
- **Kampanya / indirim** — Zenweld ana sitesindeki fiyatı etkiler.

**Not:** Yeni ürün eklediğinizde hiçbir satıcıda ve bayide stokta görünmez. Ürünün
online satıcılarda ve bayi haritasında çıkması için **Stok Matrisi**'nden
işaretlemelisiniz. Sitede satın alınabilmesi için ayrıca bir şey gerekmez: her
yayındaki ürün sepete eklenebilir.

---

## 2b. Kategoriler

Dört ürün bölümünün (Ekipmanlar, Güvenlik, Aksesuarlar, Dolgu Metalleri)
**grupları** (mega menüde sol kolon, örn. Kaynak Makineleri) ve **kategorileri**
(örn. MMA Örtülü Elektrod Kaynak Makineleri) menüdeki sırayla listelenir.

- **Grup Ekle** (bölümün sağ üstü) ve **Kategori Ekle** (grubun altında) yeni kayıt
  açar. Yeni grup ve kategori menüde, bölüm/grup sayfasındaki kartlarda ve ürün
  formunun kategori listesinde hemen görünür.
- ↑ ↓ okları menüdeki ve kartlardaki sırayı değiştirir.
- 🗑 **Ürünü olan kategori** ve **kategorisi olan grup silinemez**; önce
  içindekiler başka yere taşınır (ürünün kategorisi ürün formundan değişir).

Düzenleme ekranında üç sekme vardır:

| Sekme | İçerik |
|---|---|
| **Temel Bilgiler** | Ad, grup (kategoride) / bölüm (grupta, yalnızca yeni grupta seçilir), kısa açıklama, kart görseli |
| **Tanıtım Metni** | Sayfanın altında, ürünlerin (grup sayfasında kategori kartlarının) altında "… Hakkında" başlığıyla görünen uzun metin. Boşsa görünmez. Biçimlendirme haberlerle aynı |
| **SEO** | Link, sayfa başlığı, açıklama, anahtar kelimeler, Google önizlemesi (ürünlerdeki gibi) |

- Kategorinin **kısa açıklaması** sayfa başlığının altında ve grup sayfasındaki
  kartta görünür. Grubun kısa açıklaması boşsa kategori adlarından oluşturulur.
- Kategori adresi grubun altındadır: `/ekipmanlar/kaynak-makineleri/<kategori>`.
  Kategorinin linki değişirse ya da başka bir gruba taşınırsa eski adres yeni
  adrese yönlenir. **Grubun linki** değişirse gruptaki bütün kategorilerin eski
  adresleri de yeni adreslere yönlenir.
- Kategorinin linki değişince içindeki ürünler kategoriye bağlı kalır; ürün
  adresleri (`/urun/…`) değişmez.

---

## 3. Stok Matrisi

Bayilerin ve online satıcıların her gün gönderdiği stok listeleri buraya yüklenir.
Ürün sayfasındaki **Stoktaki Bayileri Gör** haritası ve "Ayrıca online alışveriş
olarak şurada da mevcuttur" listesi bu veriden gelir. Zenweld'in kendi deposu burada
yoktur; sitede her ürün her zaman satıştadır. Ayrıntılar ve dosya biçimi:
[STOK.md](STOK.md).

- **Bayi ve Satıcılar** sekmesi:
  - Her kaynağın stoktaki ürün sayısı, son güncelleme zamanı ve sitede görünüp
    görünmediği listelenir. Güncellenmeyenler üstte, sarı uyarıyla durur.
  - Üstteki **Stok geçerlilik süresi** (varsayılan 3 gün): bu süre içinde dosya
    gelmeyen kaynağın stoğu sitede gösterilmez. 0 = sınırsız.
- **Kaynak sayfası** (listede adına tıklayın):
  - **Dosya Yükle (CSV / XLSX):** önce önizleme açılır (eşleşen, tanınmayan, hatalı
    satırlar ve mevcut stokla fark). **Stoğu Güncelle** ile uygulanır.
  - Her dosya o kaynağın **tam listesidir**; dosyada olmayan ürün stoktan çıkar.
    Dosya öncekinden çok kısaysa onay istenir.
  - **Tanınmayan kodlar** (bayinin kendi kodu) önizlemede bir ürüne eşleştirilir;
    sonraki dosyalarda kendiliğinden tanınır.
  - Tablodan adet, fiyat ve link elle düzeltilir (alandan çıkınca kaydedilir; boş
    bırakılan adet eski değerine döner), satır eklenir/silinir. Link sütunu
    yalnızca online satıcılarda ve online mağazası olan bayilerde vardır.
  - **Geçmiş:** yüklemeler ve elle düzeltmeler, yapanın adıyla. Son yükleme
    **Bu yüklemeyi geri al** ile geri alınır.
  - **Şablon İndir:** bizim SKU'larımızla dolu CSV; bayiye gönderilip doldurtulabilir.
- **Ürün Bazında** sekmesi — bir ürünün hangi bayide/satıcıda kaç adet olduğu ve
  sitede görünüp görünmediği. Yalnızca görüntüleme; düzeltme kaynak sayfasından.

**Online mağazası olan bayi** (Bayiler formunda "Bağlı olduğu online mağaza" seçili)
tek dosya gönderir: Kod, Adet, Fiyat ve Link. Stoktaki ürünler haritada, linki olanlar
ayrıca o mağazanın online satıcı kartında görünür. Mağaza listede ayrı satır olarak
çıkmaz; listede bayinin yanında "Online mağaza" etiketi vardır.

Sitede adet ve fiyat gösterilmez. Ürün sayfasında yalnızca stoğu olan bayiler ve
online satıcılar listelenir; online satıcı kartı dosyadaki ürün linkine gider, linki
olmayan ürün online kartta görünmez.

---

## 4. Siparişler

Üyelerin sitede verdiği online siparişler. Üstteki sekmelerle duruma göre
süzülür; sipariş no, müşteri veya e-posta ile aranır. Siparişe tıklayınca detay
açılır:

| Durum | Ne yapılır |
|---|---|
| **Ödeme Bekleniyor** (havale/EFT) | Açıklamasında sipariş no yazan ödeme hesaba geçince **Ödeme Alındı**. Süre, son ödeme **gününün sonunda** (23:59) dolar; sonra sipariş kendiliğinden iptal olur ve artık onaylanamaz. |
| **Hazırlanıyor** | Kargoya verince kargo firmasını seçip takip numarasını girin → **Kargoya Ver** |
| **Kargoda** | Takip numarası düzeltilebilir; teslim edilince **Teslim Edildi** |
| Teslim edilmemiş her sipariş | **Siparişi İptal Et** (neden yazılırsa müşteri görür). Ödemesi alınmış siparişin iadesi banka / ödeme kuruluşu üzerinden ayrıca yapılır. |

Müşteri her adımı ve takip numarasını Hesabım › Siparişlerim'de görür. Detayda
fatura bilgileri (TCKN veya VKN), ödeme (kart, taksit sayısı), sözleşme onay
zamanı ve yalnızca panelde görünen **İç Not** alanı bulunur.

> Demoda kartla ödeme gerçek değildir; sipariş kaydı ve akış gösterim içindir.

---

## 4b. Mağaza Ayarları

- **Kargo** — ücretsiz kargo sınırı (varsayılan 5.000 ₺), altındaki siparişlerde
  kargo ücreti, kargo firmaları listesi
- **Kartla Taksit** — taksit için en düşük sipariş tutarı ve banka POS'ları tablosu.
  Her POS'ta: aktif/pasif, banka etiketi ve adı, kart programı (Bonus, World …),
  mağaza no, POS adı.
  - **Taksit Oranları (Göster):** müşteriye sunulan taksit sayıları ve her biri için
    vade farkı (%0 = peşin fiyatına taksit).
  - **Firma Taksit Oranları:** bankanın Zenweld'den kestiği komisyon (tek çekim dahil).
    Müşteri görmez; kartlı siparişin detayında tahmini banka komisyonu ve net tahsilat
    olarak görünür (sipariş anındaki oranla).
  - Ödeme sayfasında kart, programı eşleşen ilk aktif POS'un taksitleriyle çekilir.
    Eşleşmeyen kartlar "Diğer kartlar için varsayılan" işaretli POS'tan (örnekte
    iyzico) tek çekim ödenir.
  - Pencerelerde "Uygula" taslağa yazar; saklamak için sayfanın üstündeki **Kaydet**.
- **Havale / EFT** — IBAN'lar ve ödeme süresi (gün)

> Varsayılan kargo ücreti, banka POS'ları (mağaza no, oranlar) ve IBAN'lar
> **örnektir**; gerçek değerler girilmelidir.

---

## 4c. Servis Talepleri

Sitedeki **Destek ve Garanti › Servis Talebi** formundan gelen talepler: makine türü,
model, talep nedeni (kurulum, bakım, onarım, eğitim), müşteri şikayeti ve iletişim
bilgileri. Satıra tıklayınca detay açılır; durum (Yeni → İşlemde → Tamamlandı) ve
yalnızca panelde görünen iç not buradan kaydedilir.

## 4d. Sık Sorulan Sorular

Soru ekle, düzenle (soru, cevap, konu), sil ve oklarla sırala. Sorular
sitedeki SSS sayfasında, ürün sayfalarının SSS sekmesinde ve anasayfada (ilk 8
soru) bu sırayla görünür.

## 4d-2. Belgeler

Sitedeki **Keşfet › Diğer** menüsündeki üç belge sayfası: **MSDS**, **Ultimate Kaynak
Rehberi** ve **Parti Sertifikaları**. Üstteki sekmelerle sayfa seçilir.

- **Sayfa metni:** sayfanın başlığı ve kısa açıklaması.
- **Belge Ekle:** dosya (PDF, Word, Excel, JPG, PNG veya ZIP; en fazla 25 MB), başlık
  (boşsa dosya adından dolar), isteğe bağlı ürün ve yalnızca Parti Sertifikaları'nda
  **Parti / Lot No**. Ziyaretçi belge adı, ürün adı, ürün kodu ve parti numarasıyla
  arayabilir.
- Listede oklarla sıralanır; "Yayında" etiketine tıklayınca yayından kalkar ya da
  yayına alınır. Düzenlemede yeni dosya seçilirse eskisinin yerine geçer.
- Sitede PDF'ler "Görüntüle" ile yeni sekmede açılır, diğer dosyalar "İndir" ile iner.

> Backend gelene kadar yüklenen dosyalar da diğer veriler gibi yalnızca yükleyen
> tarayıcıda saklanır ve görünür.

## 4e. Yasal Metinler

Alt bilgideki **Politikalar & Yasal** listesindeki 11 sayfanın başlığı ve metni
buradan düzenlenir. Sayfa adresleri ve sıralaması sabittir. Biçimlendirme
haberlerle aynıdır (`## ara başlık`, `- madde`, `**kalın**`).

Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'nde satıcı, alıcı ve ürün
tabloları siparişten otomatik doldurulur; düzenlenen metin tabloların altında görünür.

> Metinlerin tamamı **taslaktır**; hukuk danışmanının metinleriyle değiştirilmelidir.

## 4f. Sayfa SEO

Sabit sayfaların (ana sayfa, ürün bölümleri, Keşfet menüsündeki sayfalar, destek ve
garanti sayfaları) Google'da ve tarayıcı sekmesinde görünen **başlığı** ve
**açıklaması** buradan değiştirilir. Liste menüdeki gibi üç bölümdedir; her satırda
başlık, karakter sayısı, açıklama ve durum (**Varsayılan** / **Değiştirildi**)
görünür.

- ✏️ simgesi düzenleme penceresini açar: başlık (60 karakter önerilir), açıklama
  (160 karakter önerilir) ve Google önizlemesi.
- Boş bırakılan alanda varsayılan metin kullanılır (kutuda gri yazıyla görünür).
  **Varsayılana dön** iki alanı da boşaltır; **Kaydet** ile uygulanır.
- Bu sayfaların linkleri menüye bağlı olduğu için değiştirilemez.

Ürün, blog, haber ve etkinliklerin SEO alanları kendi düzenleme ekranlarındaki
**SEO** sekmesindedir.

---

## 5. Teklifler

Teklif kartına tıklayınca detay açılır:

- Sol: firma bilgileri, istenen ürünler, müşteri notu
- Sağ: durum (Yeni → İnceleniyor → Teklif Gönderildi → Kazanıldı/Kapandı),
  atanan satış temsilcisi, iç not, **E-posta Gönder** butonu. Temsilci ve iç not
  alandan çıkınca kaydedilir.

Durum değişiklikleri müşterinin `Hesabım → Tekliflerim` sayfasına anında yansır.

Bayilerin Zenweld'den teklif talepleri burada yer almaz; Zenweld ile bayiler
arasındaki teklif ve siparişler ileride ayrı bir **B2B uygulamasında** yürütülecek.

---

## 6. Bayiler

Yetkili Bayi ve Servis Ağı haritasındaki ve ürün sayfasındaki "Stoktaki Bayileri
Gör" penceresindeki fiziksel satış/servis noktaları.

Enlem–boylam değerlerini Google Maps'te konuma sağ tıklayıp kopyalayabilirsiniz.
**Bayi Türü** zorunludur: *Yetkili Bayi*, *Yetkili Servis* ya da *Yetkili Bayi +
Yetkili Servis*. Ayrıca **Showroom var** işaretlenebilir. Bunlar haritada ve servis
ağı sayfasında rozet olarak görünür. Bayinin online mağazası varsa önce mağazayı
**Online Satıcılar**'a ekleyin, sonra burada **Bağlı olduğu online mağaza** alanından
seçin. Bir mağaza yalnızca bir bayiye bağlanabilir; başka bayiye bağlı mağaza listede
seçilemez. Bu bayi stok dosyasında ürün linklerini de gönderir; ürünler hem haritada hem
o mağazanın online satıcı kartında görünür (bkz. Stok Matrisi).

---

## 7. Online Satıcılar

Ürün sayfasında logosu çıkacak e-ticaret siteleri.

- **Logo Metni:** kutuda görünen kısa yazı (örn. `BAŞAK HIRDAVAT`)
- **Site Adresi:** satıcının ana sayfası; ürün kartı ise stok dosyasındaki ürün linkine gider
- **Kendi mağazamız:** Zenweld'in kendi online mağazası olursa işaretlenir; kırmızı rozetle en başta gösterilir
- **Aktif:** kapatılırsa hiçbir ürün sayfasında görünmez

Kartta satıcının kaç ürün sayfasında göründüğü yazar. Bir bayiye bağlı mağazada
bayinin adı görünür; bu mağazanın stoğu bayinin dosyasından gelir.

Satıcıyı silmek, o satıcıya ait tüm stok kayıtlarını da siler; bağlı olduğu bayinin
online mağaza bağlantısı kalkar.

---

## 8. Satış Temsilcileri

Sitedeki **Keşfet → Kurumsal → Satış Temsilcilerimiz** sayfasının listesi.

- **Temsilci ekle / düzenle:** ad soyad, bölge veya görev, telefon,
  e-posta, isteğe bağlı fotoğraf (yoksa baş harfler gösterilir)
- **Sıra:** oklarla yukarı/aşağı taşınır; sitede bu sırayla görünür
- **Sitede / Gizli:** rozete tıklayınca temsilci sitede gizlenir ama silinmez
- Sitedeki bölge düğmeleri listedeki bölgelerden kendiliğinden oluşur
- Telefon, sitede hem "Ara" hem "WhatsApp" düğmesine bağlanır

---

## 9. Üyeler

Yalnızca **ana sitenin** üyeleri (bireysel, kurumsal) ve yönetici hesapları
listelenir. Bayiler ana sitenin üyesi değildir.

- Rol, durum ve metin araması ile filtreleme
- Rol açılır menüsünden anında değiştirilebilir
- **Onayla** → `pending` (onay bekleyen) hesabı aktifleştirir
- **Askıya al** → hesabın girişini engeller
- **CSV İndir** → filtrelenmiş üye listesini dışa aktarır

Yönetici hesapları silinemez. Yönetici kendi rolünü değiştiremez ve kendini
askıya alamaz. Son aktif yöneticinin rolü düşürülemez; böylece panele girecek
kimsenin kalmaması önlenir.

---

## 10. Garantiler

Ana sitede **Destek ve Garanti → Garanti Kaydı** formuyla yapılan kayıtlar. Form:
Ad Soyad, e-posta, telefon, şehir, posta kodu, adres, ürün kategorisi, model,
seri numarası, satıcı VKN ve "12 ay ücretsiz garanti uzatması" seçeneği.
Satın alma tarihi sorulmadığı için **garanti süresi kayıt tarihinden başlar**.
Müşterinin `Hesabım → Garantilerim` sayfası ve sitedeki garanti sorgulama aynı
kayıtları kullanır; burada yapılan değişiklik oralara anında yansır.

- Seri no, isim veya e-posta ile arama; "garantisi devam eden / süresi dolan /
  uzatılmış" filtresi
- **Garanti bitişi** tarih kutusundan elle değiştirilebilir
- **+12 ay** (uzatılmış garanti) işaretlenince bitiş tarihine 12 ay eklenir,
  kaldırılınca 12 ay çıkarılır; elle girilen tarih korunur
- Bitiş günü dahil garanti geçerlidir (site sorgulamasıyla aynı)
- Kaydı yapan kişi ana sitenin üyesiyse "Üye" etiketi görünür
- Silme ve **CSV indir**

---

## 11. Hakkımızda

Sitedeki **Hakkımızda** sayfasının tamamı buradan yönetilir:

- **Sayfa başlığı:** başlık, alt başlık ve arka plan görseli
- **Rakamlar:** "25+ Yıllık Tecrübe" gibi kutular; eklenir, silinir
- **Bölümler:** başlık + metin + isteğe bağlı görsel. Bölüm eklenir,
  silinir, oklarla sıralanır. Metinde `## Ara başlık`, `- madde`, `**kalın**`
  kullanılabilir. Görseli olan bölümler metin ve görsel yan yana gösterilir.
- Değişiklikler **Kaydet** ile sayfaya yansır; kaydedilmemiş değişiklik varsa
  uyarı çıkar.

---

## 12. Form e-postaları (info@zenweld.com)

Sitedeki formlar gönderilince **info@zenweld.com**'a e-posta gider. Yanıtla
dendiğinde e-posta doğrudan formu dolduran kişiye gider.

| Form | Kaydı ayrıca panelde |
|---|---|
| İletişim formu | — (yalnızca e-posta) |
| Bayilik başvurusu | — (yalnızca e-posta) |
| Welders Club katılım | — (yalnızca e-posta) |
| Ürün sayfası destek sorusu | — (yalnızca e-posta) |
| Teklif Al | Teklifler |
| Servis Talebi | Servis Talepleri |
| Garanti Kaydı | Garantiler |
| Ürün yorumu | Yorumlar (onay bekler) |
| Üye ol | Üyeler |
| Sipariş | Siparişler (T.C. kimlik no ve kart bilgisi e-postaya yazılmaz) |

- Yalnızca e-postayla giden formlarda e-posta gönderilemezse ziyaretçiye hata
  gösterilir ve tekrar deneyebilir; panele kaydı olan formlar kaydı yine alır.
- E-posta için sunucuda `RESEND_API_KEY` tanımlı olmalı (bkz. README). Tanımlı
  değilse demo adresinde formlar başarılı görünür ama e-posta gitmez.
- Her formda botlar için görünmez bir tuzak alanı var; formu otomatik dolduran
  botların gönderimi e-posta olarak gelmez.
- Şifremi unuttum ve bülten aboneliği henüz bir yere gitmiyor (backend ile).

