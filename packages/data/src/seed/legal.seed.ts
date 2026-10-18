import type { LegalPage } from "../types";
import type { LegalPageId } from "../legal";

/**
 * YASAL METINLERIN BASLANGIC HALI
 *
 * !! TASLAK !! Basliklar ilgili mevzuatin bekledigi yapiya gore konuldu;
 * metinler ornektir. Yayina almadan once hukuk danismani tarafindan
 * yazilmali ve yonetim panelindeki "Yasal Metinler" sayfasindan
 * guncellenmelidir.
 *
 * On Bilgilendirme Formu ve Mesafeli Satis Sozlesmesi'nde satici, alici
 * ve urun tablolari siparisten otomatik doldurulur; buradaki metin o
 * tablolarin altinda gosterilir.
 */

const STAMP = "2026-10-18T09:00:00+03:00";

const DRAFT =
  "Bu metin örnek bir taslaktır; yayına almadan önce hukuk danışmanınız tarafından hazırlanmalıdır.";

const page = (id: LegalPageId, title: string, body: string): LegalPage => ({
  id,
  title,
  body: `${DRAFT}\n${body.trim()}`,
  updatedAt: STAMP,
});

export const legalPages: LegalPage[] = [
  page(
    "kullanim-kosullari",
    "Kullanım Koşulları",
    `
## Taraflar ve kapsam
Bu koşullar zenweld.com sitesini kullanan tüm ziyaretçiler ve üyeler için geçerlidir.
## Üyelik
- Üyelik bilgilerinin doğru ve güncel tutulması üyenin sorumluluğundadır.
- Hesap güvenliği ve şifrenin gizliliği üyeye aittir.
## Fikri mülkiyet
Sitedeki marka, logo, görsel ve metinler Zenweld'e aittir; izinsiz kullanılamaz.
## Sorumluluğun sınırlandırılması
Ürün bilgileri ve fiyatlar önceden haber verilmeksizin değiştirilebilir.
## Değişiklikler
Zenweld bu koşulları güncelleyebilir; güncel metin bu sayfada yayımlanır.
`,
  ),
  page(
    "garanti-kosullari",
    "Garanti Koşulları",
    `
## Garanti süresi
Garanti süresi her ürünün sayfasında belirtilir ve fatura tarihinden itibaren başlar.
## Garanti kapsamı
Malzeme ve işçilik hatalarından kaynaklanan arızalar garanti kapsamındadır.
## Garanti dışı durumlar
- Kullanım kılavuzuna aykırı kullanım, hatalı elektrik bağlantısı
- Yetkisiz kişilerce yapılan müdahale ve onarımlar
- Sarf malzemeleri ve olağan aşınma
## Başvuru
Arıza durumunda Servis Talebi formunu doldurabilir veya en yakın yetkili servise başvurabilirsiniz.
`,
  ),
  page(
    "gizlilik",
    "Gizlilik Politikası",
    `
## Hangi bilgileri topluyoruz
Üyelik, sipariş, servis talebi ve iletişim formlarında paylaştığınız bilgiler.
## Bilgileri ne için kullanıyoruz
Siparişlerinizi ve taleplerinizi yerine getirmek, size destek vermek ve yasal yükümlülüklerimizi yerine getirmek için.
## Paylaşım
Bilgileriniz yalnızca kargo, ödeme ve hizmet sağlayıcılarımızla, gerekli olduğu ölçüde paylaşılır.
## Güvenlik
Bilgilerinizi korumak için teknik ve idari tedbirler uygularız.
## İletişim
Gizlilikle ilgili sorularınız için info@zenweld.com adresine yazabilirsiniz.
`,
  ),
  page(
    "cerez-politikasi",
    "Çerez Politikası",
    `
## Çerez nedir
Çerezler, siteyi ziyaret ettiğinizde tarayıcınıza kaydedilen küçük dosyalardır.
## Kullandığımız çerez türleri
- **Zorunlu çerezler:** Sepet ve oturum gibi sitenin çalışması için gerekenler. Onay gerektirmez.
- **Analiz çerezleri:** Site trafiğini ölçmek için. Yalnızca onay verirseniz kullanılır.
- **Pazarlama çerezleri:** İçerik ve reklamları kişiselleştirmek için. Yalnızca onay verirseniz kullanılır.
## Tercihlerinizi yönetme
Çerez tercihlerinizi sitedeki çerez bandından veya tarayıcı ayarlarınızdan değiştirebilirsiniz.
`,
  ),
  page(
    "kvkk",
    "KVKK Aydınlatma Metni",
    `
## Veri sorumlusu
Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.
## İşlenen kişisel veriler
Kimlik, iletişim, müşteri işlem, adres ve fatura bilgileri.
## İşleme amaçları ve hukuki sebepler
Sözleşmenin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaat kapsamında.
## Aktarım
Kargo, ödeme ve muhasebe hizmet sağlayıcılarına ve yetkili kamu kurumlarına.
## Haklarınız
KVKK 11. madde kapsamındaki haklarınız için info@zenweld.com adresine başvurabilirsiniz.
`,
  ),
  page(
    "kisisel-verilerin-islenmesi-politikasi",
    "Kişisel Verilerin İşlenmesi Politikası",
    `
## Amaç ve kapsam
Bu politika, Zenweld'in kişisel verileri işlerken uyduğu ilkeleri açıklar.
## Temel ilkeler
- Hukuka ve dürüstlük kurallarına uygunluk
- Doğru ve gerektiğinde güncel olma
- Belirli, açık ve meşru amaçlar için işleme
- Amaçla bağlantılı, sınırlı ve ölçülü olma
## Veri kategorileri ve veri sahipleri
Müşteriler, üyeler, bayiler, tedarikçiler ve ziyaretçiler.
## Veri güvenliği
Kişisel verilerin güvenliği için alınan teknik ve idari tedbirler.
`,
  ),
  page(
    "kisisel-veri-saklama-ve-imha-politikasi",
    "Kişisel Veri Saklama ve İmha Politikası",
    `
## Amaç
Kişisel verilerin ne kadar süre saklanacağını ve nasıl imha edileceğini belirler.
## Saklama süreleri
- Sipariş ve fatura kayıtları: ilgili mevzuatta öngörülen süre boyunca
- Üyelik bilgileri: üyelik süresince ve sonrasında yasal süre boyunca
- İletişim ve servis talepleri: talebin sonuçlanmasından itibaren belirlenen süre boyunca
## İmha yöntemleri
Silme, yok etme veya anonim hale getirme.
## Periyodik imha
Saklama süresi dolan veriler belirli aralıklarla imha edilir.
`,
  ),
  page(
    "fiziksel-guvenlik-aydinlatma-metni",
    "Fiziksel Güvenlik Süreçlerine Yönelik Aydınlatma Metni",
    `
## Kapsam
Ofis, fabrika ve depolarımızdaki kamera kayıtları ile ziyaretçi giriş-çıkış kayıtlarını kapsar.
## İşlenen veriler
Kamera görüntüleri, ziyaretçi adı, ziyaret tarihi ve saati.
## İşleme amacı
Bina, çalışan ve ziyaretçi güvenliğinin sağlanması.
## Saklama
Kayıtlar belirlenen süre boyunca saklanır, ardından imha edilir.
## Haklarınız
KVKK 11. madde kapsamındaki haklarınız için info@zenweld.com adresine başvurabilirsiniz.
`,
  ),
  page(
    "iade",
    "İade ve Değişim",
    `
## Cayma hakkı
Ürünü teslim aldığınız tarihten itibaren 14 gün içinde gerekçe göstermeden iade edebilirsiniz.
## İade koşulları
- Ürün kullanılmamış ve orijinal ambalajında olmalıdır.
- Fatura ve tüm aksesuarlar eksiksiz gönderilmelidir.
## İade süreci
İade talebinizi info@zenweld.com adresine iletin; ödemeniz ürün bize ulaştıktan sonra 14 gün içinde iade edilir.
## Değişim
Hatalı veya hasarlı ürünlerde değişim yapılır.
`,
  ),
  page(
    "on-bilgilendirme-formu",
    "Ön Bilgilendirme Formu",
    `
## Teslimat
Ürünler, sipariş onayından itibaren en geç 30 gün içinde Alıcı'nın bildirdiği teslimat adresine kargo ile teslim edilir. Kargo firması ve takip numarası, ürün kargoya verildiğinde Alıcı'nın Hesabım > Siparişlerim sayfasında gösterilir.
## Cayma hakkı
Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir. Cayma bildirimi e-posta ile Satıcı'ya iletilir; Satıcı bildirimi aldıktan sonra 14 gün içinde ödemeyi iade eder.
## Kurumsal alıcılar
Ürünü ticari veya mesleki amaçla satın alan Alıcı tüketici sayılmaz; bu durumda cayma hakkı ve tüketici mevzuatına ilişkin hükümler uygulanmayabilir.
## Garanti
Ürünler, ürün sayfasında belirtilen süre boyunca Zenweld garantisi altındadır.
## Şikâyet ve uyuşmazlık
Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dahilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.
`,
  ),
  page(
    "mesafeli-satis-sozlesmesi",
    "Mesafeli Satış Sözleşmesi",
    `
## Sözleşmenin konusu
Bu sözleşme, Alıcı'nın Satıcı'ya ait zenweld.com internet sitesinden elektronik ortamda sipariş verdiği, yukarıda nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler.
## Genel hükümler
Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli onayı verdiğini kabul eder. Sözleşme, Alıcı'nın siparişi onaylamasıyla yürürlüğe girer; bir kopyası Alıcı'nın e-posta adresine gönderilir.
## Teslimat
Ürünler, sipariş onayından itibaren en geç 30 gün içinde teslim edilir.
## Cayma hakkı
Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir.
## Uyuşmazlık
Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
`,
  ),
];
