# Yönetim Paneli Kullanım Kılavuzu

> Bu kılavuz Zenweld ana sitesinin yönetim panelidir (`/yonetim`).

Sol menü gruplar halindedir; grup başlığına tıklayınca sayfaları açılır, açık
olan sayfanın grubu kendiliğinden açık gelir:

| Grup | Sayfalar |
|---|---|
| Panel | Özet |
| Satış | Siparişler · Teklifler · Mağaza Ayarları |
| Ürünler | Ürünler · Stok Matrisi · Yorumlar |
| Bayi ve Satış Ağı | Bayiler · Online Satıcılar · Satış Temsilcileri |
| Müşteriler ve Servis | Üyeler · Servis Talepleri · Garantiler |
| İçerik | Haberler · Etkinlikler · Blog · Hakkımızda · Sık Sorulan Sorular · Yasal Metinler |
| Ayarlar | Görünüm |

Panel adresi: `http://localhost:3000/yonetim` (canlıda `zenweld.com/yonetim`)
Demo giriş: `admin@zenweld.com` / `admin123`

> Panel ana sitenin içinde, kendi bölümünde çalışır ve kendi giriş ekranı vardır. Ana
> sitenin "Giriş Yap" sayfası yönetici hesaplarını kabul etmez; sitede panele
> giden bir bağlantı da yoktur. Panelden çıkış yapmak sitedeki oturumu etkilemez.

> Panel yalnızca Türkçedir. Backend gelene kadar değişiklikler tarayıcının yerel
> deposunda saklanır; başlangıç verisi `packages/data` içindeki örnek verilerdir.

---

## 1. Panel (Dashboard)

Özet kartlar: aktif ürün, üye, online satıcı, teklif ve sipariş sayıları
(üye, teklif ve sipariş yalnızca ana sitenin kayıtlarıdır; bayi kayıtları sayılmaz).
Onay bekleyen üye, yeni teklif ve işlem bekleyen sipariş (havale onayı veya
kargoya verilecek) varsa kartta uyarı rozeti çıkar.

Altta **"Hiçbir online satıcıda stokta olmayan ürünler"** listesi vardır. Bu
ürünlerin sayfasında online satıcı bölümü boş görünür — listeye tıklayarak
doğrudan stok matrisine gidebilirsiniz.

---

## 2. Ürünler

### Ürün listesi
- Ad veya SKU ile arama, bölüme göre filtreleme
- 👁 simgesi: ürünü yayından kaldırır / yayına alır
- ✏️ simgesi: düzenleme ekranı
- 🗑 simgesi: ürünü ve tüm stok kayıtlarını siler

### Ürün düzenleme / yeni ürün
Beş sekme vardır:

| Sekme | İçerik |
|---|---|
| **Temel Bilgiler** | Ad, URL (slug), SKU, model kodu, bölüm, kategori, fiyat (KDV hariç → dahil otomatik hesaplanır), durum işaretleri, kılavuz PDF bağlantısı |
| **Açıklamalar** | TR ve EN kısa/detaylı açıklama, öne çıkan özellikler |
| **Görseller** | URL ile ekleme veya dosya yükleme, sıralama, kapak seçimi |
| **Teknik Özellikler** | Satır satır TR/EN özellik–değer tablosu |
| **Kutu İçeriği** | TR/EN madde listesi |

**Durum işaretleri:**
- **Kampanya / indirim** — Zenweld ana sitesindeki fiyatı etkiler.

**Not:** Yeni ürün eklediğinizde hiçbir satıcıda ve bayide stokta görünmez. Ürünün
online satıcılarda ve bayi haritasında çıkması için **Stok Matrisi**'nden
işaretlemelisiniz. Sitede satın alınabilmesi için ayrıca bir şey gerekmez: her
yayındaki ürün sepete eklenebilir.

---

## 3. Stok Matrisi

Ürün sayfasında gösterilen iki listenin stoğu buradan yönetilir. Zenweld'in kendi
deposu burada yoktur; sitede her ürün her zaman satıştadır.

- **Online Satıcılar** sekmesi — ürün × satıcı matrisi. İşaretli satıcı, ürün
  sayfasındaki "Ayrıca online alışveriş olarak şurada da mevcuttur" bölümünde
  görünür. Bir satıcı seçilince adet, fiyat ve toplu işaretleme açılır; CSV ile
  toplu güncelleme yapılabilir.
- **Fiziksel Bayiler** sekmesi — bayiyi seçip o bayide stokta olan ürünleri
  işaretleyin. Ürün sayfasındaki **Stoktaki Bayileri Gör** haritası bu bilgiyi
  kullanır. Seçenekli ürünlerde (3 m / 5 m torç gibi) her seçenek ayrı satırdır.
  "Toplam bayi" sütunu ürünün kaç bayide bulunduğunu gösterir.

---

## 4. Siparişler

Üyelerin sitede verdiği online siparişler. Üstteki sekmelerle duruma göre
süzülür; sipariş no, müşteri veya e-posta ile aranır. Siparişe tıklayınca detay
açılır:

| Durum | Ne yapılır |
|---|---|
| **Ödeme Bekleniyor** (havale/EFT) | Açıklamasında sipariş no yazan ödeme hesaba geçince **Ödeme Alındı**. Son ödeme tarihi geçerse sipariş kendiliğinden iptal olur. |
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
- **Kartla Taksit** — sunulacak taksit sayıları ve her biri için vade farkı (%0 =
  peşin fiyatına taksit), taksit için en düşük sipariş tutarı
- **Havale / EFT** — IBAN'lar ve ödeme süresi (gün)

> Varsayılan kargo ücreti, vade farkı oranları ve IBAN'lar **örnektir**; gerçek
> değerler girilmelidir.

---

## 4c. Servis Talepleri

Sitedeki **Destek ve Garanti › Servis Talebi** formundan gelen talepler: makine türü,
model, talep nedeni (kurulum, bakım, onarım, eğitim), müşteri şikayeti ve iletişim
bilgileri. Satıra tıklayınca detay açılır; durum (Yeni → İşlemde → Tamamlandı) ve
yalnızca panelde görünen iç not buradan kaydedilir.

## 4d. Sık Sorulan Sorular

Soru ekle, düzenle (TR/EN soru ve cevap, konu), sil ve oklarla sırala. Sorular
sitedeki SSS sayfasında, ürün sayfalarının SSS sekmesinde ve anasayfada (ilk 8
soru) bu sırayla görünür. İngilizce alanlar boş bırakılırsa Türkçesi kullanılır.

## 4e. Yasal Metinler

Alt bilgideki **Politikalar & Yasal** listesindeki 11 sayfanın başlığı ve metni
buradan düzenlenir (TR/EN). Sayfa adresleri ve sıralaması sabittir. Biçimlendirme
haberlerle aynıdır (`## ara başlık`, `- madde`, `**kalın**`).

Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'nde satıcı, alıcı ve ürün
tabloları siparişten otomatik doldurulur; düzenlenen metin tabloların altında görünür.

> Metinlerin tamamı **taslaktır**; hukuk danışmanının metinleriyle değiştirilmelidir.

---

## 5. Teklifler

Teklif kartına tıklayınca detay açılır:

- Sol: firma bilgileri, istenen ürünler, müşteri notu
- Sağ: durum (Yeni → İnceleniyor → Teklif Gönderildi → Kazanıldı/Kapandı),
  atanan satış temsilcisi, iç not, **E-posta Gönder** butonu

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
ağı sayfasında rozet olarak görünür. Bayinin online mağazası varsa **Bağlı olduğu online mağaza**
alanından eşleştirin.

---

## 7. Online Satıcılar

Ürün sayfasında logosu çıkacak e-ticaret siteleri.

- **Logo Metni:** kutuda görünen kısa yazı (örn. `BAŞAK HIRDAVAT`)
- **Site Adresi:** ürün bağlantıları bu adresin altına kurulur
- **Kendi mağazamız:** Zenweld'in kendi online mağazası olursa işaretlenir; kırmızı rozetle en başta gösterilir
- **Aktif:** kapatılırsa hiçbir ürün sayfasında görünmez

Satıcıyı silmek, o satıcıya ait tüm stok kayıtlarını da siler.

---

## 8. Satış Temsilcileri

Sitedeki **Keşfet → Kurumsal → Satış Temsilcilerimiz** sayfasının listesi.

- **Temsilci ekle / düzenle:** ad soyad, bölge veya görev (TR/EN), telefon,
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

Yönetici hesapları silinemez.

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
- **+12 ay** (uzatılmış garanti) işaretlenince / kaldırılınca bitiş tarihi ürünün
  garanti süresine göre yeniden hesaplanır
- Kaydı yapan kişi ana sitenin üyesiyse "Üye" etiketi görünür
- Silme ve **CSV indir**

---

## 11. Hakkımızda

Sitedeki **Hakkımızda** sayfasının tamamı buradan yönetilir:

- **Sayfa başlığı:** başlık, alt başlık (TR/EN) ve arka plan görseli
- **Rakamlar:** "25+ Yıllık Tecrübe" gibi kutular; eklenir, silinir
- **Bölümler:** başlık + metin (TR/EN) + isteğe bağlı görsel. Bölüm eklenir,
  silinir, oklarla sıralanır. Metinde `## Ara başlık`, `- madde`, `**kalın**`
  kullanılabilir. Görseli olan bölümler metin ve görsel yan yana gösterilir.
- İngilizce alan boş bırakılırsa İngilizce sayfada Türkçe metin gösterilir.
- Değişiklikler **Kaydet** ile sayfaya yansır; kaydedilmemiş değişiklik varsa
  uyarı çıkar.
