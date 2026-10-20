# Test Bilgileri

Demo sitede denemek için giriş bilgileri ve ödeme ekranında kullanılabilecek test
kartları.

> **Yalnızca demo içindir.**
> - Ödeme ekranı şu an gerçek ödeme almaz. Kart numarası yalnızca biçim olarak
>   kontrol edilir; hiçbir yere gönderilmez, siparişte yalnızca son 4 hanesi tutulur.
>   Yine de **gerçek kart bilgisi girmeyin.**
> - Canlıya çıkmadan önce bu demo hesaplar silinmeli, yönetici şifresi
>   değiştirilmelidir. Bugünkü giriş sistemi tarayıcıda çalışır, gerçek güvenlik
>   sağlamaz (bkz. [YAPILACAKLAR.md](YAPILACAKLAR.md)).

---

## Giriş bilgileri

| Hesap | Giriş adresi | E-posta | Şifre | Not |
|---|---|---|---|---|
| **Yönetim paneli** | `/yonetim` | `admin@zenweld.com` | `admin123` | Yalnızca yönetim paneline girer |
| **Bireysel üye** | `/giris` | `bireysel@demo.com` | `demo123` | Ahmet Yılmaz. Kayıtlı adresi, siparişi ve garanti kaydı var |
| **Kurumsal üye** | `/giris` | `kurumsal@demo.com` | `demo123` | Elif Demir, Demir Metal Sanayi A.Ş. Fatura bilgileri (vergi dairesi, vergi no) dolu gelir |

Ek örnek hesaplar (şifre yine `demo123`):

- `hobi@demo.com`: ikinci bireysel üye, siparişi yok.
- `satinalma@ornekfirma.com`: onay bekleyen kurumsal üye. Hesabım'da "Onay Bekliyor"
  etiketi görünür; panelde Üyeler'den onaylanabilir.

Demo verisi tarayıcıda tutulur. Panelde yapılan değişiklikler yalnızca o tarayıcıda
görünür; site güncellendiğinde demo verisi baştan kurulabilir.

---

## Ödeme ekranı

### Geçerli test kartları

Ad soyad herhangi bir isim olabilir. **Son kullanma tarihi** gelecekte bir ay olmalı
(örnek `12/30`), **CVC** 3 hane (American Express'te 4 hane, örnek `1234`).

| Kart | Numara | Program | Taksitler hangi bankadan (POS) |
|---|---|---|---|
| Visa | `4111 1111 1111 1111` | World | Yapı Kredi World |
| Visa | `4400 0000 0000 0008` | Bonus | Garanti Bonus |
| Mastercard | `5555 5555 5555 4444` | Advantage | HSBC Advantage (örnekte en fazla 6 taksit) |
| Troy | `9792 0300 0000 0000` | Advantage | HSBC Advantage |
| American Express | `3782 822463 10005` | Advantage | HSBC Advantage |

- Hata mesajını denemek için **geçersiz** kart: `4111 1111 1111 1112`
- "Program" (Bonus, World …) demoda kart numarasının ilk 6 hanesinden üretilir;
  gerçekte ödeme kuruluşunun sorgusundan gelir.
- Taksitler kartın programına bağlı bankanın (POS) taksitleridir; Mağaza Ayarları →
  Kartla Taksit'ten banka bazında değiştirilir. Taksit seçenekleri 1.000 ₺ ve üzeri
  siparişlerde çıkar.
- **Varsayılan POS'u (tek çekim) denemek için:** Mağaza Ayarları'nda HSBC Advantage'ı
  pasif yapıp kaydedin, sonra `5555 5555 5555 4444` ile ödeyin: kart iyzico'dan
  yalnızca tek çekim olarak alınır.
- "Öde" denince 3D Secure doğrulaması taklit edilir (yaklaşık 1,5 saniye), sipariş
  oluşur ve sipariş sayfası açılır.

### Fatura bilgileri

Siparişi tamamlamak için fatura bilgisi de geçerli olmalı:

| Fatura türü | Gerekli bilgi | Test değeri |
|---|---|---|
| Bireysel | T.C. kimlik no (algoritmaya uygun 11 hane) | `10000000146` |
| Kurumsal | Vergi no (10 hane) | `1234567890` (kurumsal demo hesabında dolu gelir) |

### Havale / EFT

Kart yerine **Havale / EFT** seçilirse kart bilgisi istenmez. Sipariş "Ödeme
Bekleniyor" durumunda oluşur; ödeme süresi 3 gündür ve son günün sonunda (23:59)
dolar (Mağaza Ayarları'ndan değiştirilir). Ödeme, panelde **Siparişler → sipariş →
Ödeme Alındı** ile onaylanır; sipariş "Hazırlanıyor" durumuna geçer.
