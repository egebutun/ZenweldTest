# Yönetim Paneli Kullanım Kılavuzu

Panel adresi: `http://localhost:3000/tr/admin`
Demo giriş: `admin@zenweld.com` / `admin123`

> Panel yalnızca Türkçedir. Tüm değişiklikler tarayıcının yerel deposunda saklanır;
> kalıcı hale getirmek için **Veri Yönetimi → JSON Dışa Aktar** kullanın.

---

## 1. Panel (Dashboard)

Özet kartlar: aktif ürün, üye, online satıcı, teklif ve sipariş sayıları.
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

**Not:** Yeni ürün eklediğinizde hiçbir satıcıda stokta görünmez. Ürünün online
satıcılarda çıkması için **Stok Matrisi**'nden işaretlemelisiniz.

---

## 3. Stok Matrisi ⭐

Projenin en kritik ekranı. Bir ürünün hangi online satıcıda stokta olduğunu
belirler — ürün sayfasındaki *"Ayrıca online alışveriş olarak şurada da
mevcuttur"* bölümü doğrudan buradan beslenir.

### Matris modu (varsayılan)
Satırlar ürün, sütunlar satıcıdır. Yeşil ✓ = stokta, gri ✕ = stokta değil.
Hücreye tıklayarak anında değiştirirsiniz.

### Tek satıcı modu
Üstteki açılır menüden *"Sadece: Başak Hırdavat"* gibi bir satıcı seçtiğinizde
yalnızca o satıcının sütunu kalır ve **adet + fiyat + son güncelleme** alanları
açılır. "Tümünü işaretle / Tümünü temizle" butonları bu modda kullanışlıdır.

### CSV ile toplu güncelleme
1. CSV'nin ait olduğu satıcıyı seçin
2. Dosyayı yükleyin

Beklenen biçim (ayraç `;` veya `,`):

```csv
sku;stok;adet;fiyat
ZW-U250MTC;1;4;49800
ZW-ARC200;var;12;11880
ZW-MC40CNC;0;0;
```

Stok sütununa `1`, `var`, `evet`, `true`, `stokta` yazılabilir. SKU eşleşmeyen
satırlar atlanır ve kaç satırın atlandığı bildirilir.

---

## 4. Online Satıcılar

Ürün sayfasında logosu çıkacak e-ticaret siteleri.

- **Logo Metni:** kutuda görünen kısa yazı (örn. `BAŞAK HIRDAVAT`)
- **Site Adresi:** ürün bağlantıları bu adresin altına kurulur
- **Kendi bayi mağazası:** işaretlenirse kırmızı rozetle en başta gösterilir
- **Aktif:** kapatılırsa hiçbir ürün sayfasında görünmez

Satıcıyı silmek, o satıcıya ait tüm stok kayıtlarını da siler.

---

## 5. Bayiler

"Nereden Alabilirim" haritasındaki fiziksel satış/servis noktaları.

Enlem–boylam değerlerini Google Maps'te konuma sağ tıklayıp kopyalayabilirsiniz.
Rozetler (Yetkili Satıcı / Yetkili Servis / Showroom) hem haritada hem servis ağı
sayfasında kullanılır. Bayinin online mağazası varsa **Bağlı olduğu online mağaza**
alanından eşleştirin.

---

## 6. Üyeler

- Rol, durum ve metin araması ile filtreleme
- Rol açılır menüsünden anında değiştirilebilir
- **Onayla** → `pending` bayi hesabını aktifleştirir (bayi böylece stok bildirimi
  yapabilir hale gelir)
- **Askıya al** → hesabın girişini engeller
- **CSV İndir** → filtrelenmiş üye listesini dışa aktarır

Yönetici hesapları silinemez.

---

## 7. Teklifler

Teklif kartına tıklayınca detay açılır:

- Sol: firma bilgileri, istenen ürünler, müşteri notu
- Sağ: durum (Yeni → İnceleniyor → Teklif Gönderildi → Kazanıldı/Kapandı),
  atanan satış temsilcisi, iç not, **E-posta Gönder** butonu

Durum değişiklikleri müşterinin `Hesabım → Tekliflerim` sayfasına anında yansır.

---

## 8. Siparişler

Bayi siparişleri (Zenweld kanalı) ve bayi mağazasından gelen siparişler
listelenir. Durum açılır menüsünden güncellenir.

---

## 9. Veri Yönetimi ⭐

| İşlem | Ne yapar |
|---|---|
| **JSON Dışa Aktar** | Tüm veritabanını tek dosya olarak indirir |
| **JSON İçe Aktar** | Daha önce indirilen yedeği geri yükler (mevcut veri değişir) |
| **Sıfırla** | Projeyle gelen başlangıç verisine döner |

**Sunum öncesi öneri:** Demoyu anlatmadan hemen önce **Sıfırla** deyip temiz bir
başlangıç yapın; böylece önceki denemeler ekranda görünmez.

**Günlük çalışma önerisi:** Stok güncellemelerini bitirdikten sonra **JSON Dışa
Aktar** ile yedek alın.
