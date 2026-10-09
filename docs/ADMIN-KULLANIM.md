# Yönetim Paneli Kullanım Kılavuzu

> Bu kılavuz Zenweld ana sitesinin yönetim panelidir (`/yonetim`).

Menü sırası: Panel · Ürünler · Stok Matrisi · Siparişler · Teklifler · Bayiler ·
Online Satıcılar · Satış Temsilcileri · Üyeler · Garantiler · Etkinlikler ·
Haberler · Blog · Hakkımızda · Yorumlar · Görünüm · Veri Yönetimi

Panel adresi: `http://localhost:3000/yonetim` (canlıda `zenweld.com/yonetim`)
Demo giriş: `admin@zenweld.com` / `admin123`

> Panel ana sitenin içinde, kendi bölümünde çalışır ve kendi giriş ekranı vardır. Ana
> sitenin "Giriş Yap" sayfası yönetici hesaplarını kabul etmez; sitede panele
> giden bir bağlantı da yoktur. Panelden çıkış yapmak sitedeki oturumu etkilemez.

> Panel yalnızca Türkçedir. Tüm değişiklikler tarayıcının yerel deposunda saklanır;
> kalıcı hale getirmek için **Veri Yönetimi → JSON Dışa Aktar** kullanın.

---

## 1. Panel (Dashboard)

Özet kartlar: aktif ürün, üye, online satıcı, teklif ve sipariş sayıları
(üye, teklif ve sipariş yalnızca ana sitenin kayıtlarıdır; bayi kayıtları sayılmaz).
Onay bekleyen üye ve yeni teklif varsa kartta uyarı rozeti çıkar.

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
| **Temel Bilgiler** | Ad, URL (slug), SKU, model kodu, bölüm, kategori, kaynak yöntemleri, fiyat (KDV hariç → dahil otomatik hesaplanır), durum işaretleri, kılavuz PDF bağlantısı |
| **Açıklamalar** | TR ve EN kısa/detaylı açıklama, öne çıkan özellikler |
| **Görseller** | URL ile ekleme veya dosya yükleme, sıralama, kapak seçimi |
| **Teknik Özellikler** | Satır satır TR/EN özellik–değer tablosu |
| **Kutu İçeriği** | TR/EN madde listesi |

**Durum işaretleri:**
- **Kampanya / indirim** — Zenweld ana sitesindeki fiyatı etkiler.

**Not:** Yeni ürün eklediğinizde hiçbir satıcıda stokta görünmez. Ürünün online
satıcılarda çıkması için **Stok Matrisi**'nden işaretlemelisiniz.

---

## 4. Siparişler

Ana sitenin siparişleri listelenir; durum açılır menüsünden güncellenir.
Ana site şu an doğrudan satış yapmadığı için liste boştur.

Burada bayi kaydı yoktur; Zenweld ile bayiler arasındaki siparişler ileride ayrı
B2B uygulamasında olacak.

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

"Nereden Alabilirim" haritasındaki fiziksel satış/servis noktaları.

Enlem–boylam değerlerini Google Maps'te konuma sağ tıklayıp kopyalayabilirsiniz.
Rozetler (Yetkili Satıcı / Yetkili Servis / Showroom) hem haritada hem servis ağı
sayfasında kullanılır. Bayinin online mağazası varsa **Bağlı olduğu online mağaza**
alanından eşleştirin.

---

## 7. Online Satıcılar

Ürün sayfasında logosu çıkacak e-ticaret siteleri.

- **Logo Metni:** kutuda görünen kısa yazı (örn. `BAŞAK HIRDAVAT`)
- **Site Adresi:** ürün bağlantıları bu adresin altına kurulur
- **Kendi bayi mağazası:** işaretlenirse kırmızı rozetle en başta gösterilir
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

Ana sitede **Garanti → Garanti Kaydı** formuyla yapılan kayıtlar.
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

---

## 12. Veri Yönetimi ⭐

| İşlem | Ne yapar |
|---|---|
| **JSON Dışa Aktar** | Tüm veritabanını tek dosya olarak indirir |
| **JSON İçe Aktar** | Daha önce indirilen yedeği geri yükler (mevcut veri değişir) |
| **Sıfırla** | Projeyle gelen başlangıç verisine döner |

**Sunum öncesi öneri:** Demoyu anlatmadan hemen önce **Sıfırla** deyip temiz bir
başlangıç yapın; böylece önceki denemeler ekranda görünmez.

**Günlük çalışma önerisi:** Stok güncellemelerini bitirdikten sonra **JSON Dışa
Aktar** ile yedek alın.
