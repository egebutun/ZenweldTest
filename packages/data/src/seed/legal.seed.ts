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

const DRAFT_TR =
  "Bu metin örnek bir taslaktır; yayına almadan önce hukuk danışmanınız tarafından hazırlanmalıdır.";
const DRAFT_EN =
  "This text is a sample draft; it must be prepared by your legal adviser before going live.";

const page = (id: LegalPageId, title: LegalPage["title"], tr: string, en: string): LegalPage => ({
  id,
  title,
  body: { tr: `${DRAFT_TR}\n${tr.trim()}`, en: `${DRAFT_EN}\n${en.trim()}` },
  updatedAt: STAMP,
});

export const legalPages: LegalPage[] = [
  page(
    "kullanim-kosullari",
    { tr: "Kullanım Koşulları", en: "Terms of Use" },
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
    `
## Parties and scope
These terms apply to all visitors and members using zenweld.com.
## Membership
- Members are responsible for keeping their details accurate and up to date.
- Account security and password confidentiality are the member's responsibility.
## Intellectual property
Trademarks, logos, images and texts on the site belong to Zenweld and may not be used without permission.
## Limitation of liability
Product information and prices may change without notice.
## Changes
Zenweld may update these terms; the current text is published on this page.
`,
  ),
  page(
    "garanti-kosullari",
    { tr: "Garanti Koşulları", en: "Warranty Terms" },
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
    `
## Warranty period
The warranty period is shown on each product page and starts from the invoice date.
## Coverage
Faults caused by defects in materials or workmanship are covered.
## Exclusions
- Use contrary to the manual, incorrect electrical connection
- Intervention or repairs by unauthorised persons
- Consumables and normal wear
## How to apply
In case of a fault, fill in the Service Request form or contact your nearest authorised service.
`,
  ),
  page(
    "gizlilik",
    { tr: "Gizlilik Politikası", en: "Privacy Policy" },
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
    `
## What we collect
Information you share in membership, order, service request and contact forms.
## How we use it
To fulfil your orders and requests, support you and meet our legal obligations.
## Sharing
Your information is shared only with our shipping, payment and service providers, as far as necessary.
## Security
We apply technical and administrative measures to protect your information.
## Contact
For privacy questions, write to info@zenweld.com.
`,
  ),
  page(
    "cerez-politikasi",
    { tr: "Çerez Politikası", en: "Cookie Policy" },
    `
## Çerez nedir
Çerezler, siteyi ziyaret ettiğinizde tarayıcınıza kaydedilen küçük dosyalardır.
## Kullandığımız çerez türleri
- **Zorunlu çerezler:** Sepet, oturum ve dil tercihi gibi sitenin çalışması için gerekenler. Onay gerektirmez.
- **Analiz çerezleri:** Site trafiğini ölçmek için. Yalnızca onay verirseniz kullanılır.
- **Pazarlama çerezleri:** İçerik ve reklamları kişiselleştirmek için. Yalnızca onay verirseniz kullanılır.
## Tercihlerinizi yönetme
Çerez tercihlerinizi sitedeki çerez bandından veya tarayıcı ayarlarınızdan değiştirebilirsiniz.
`,
    `
## What is a cookie
Cookies are small files stored in your browser when you visit the site.
## Types of cookies we use
- **Strictly necessary:** needed for the site to work, such as cart, session and language. No consent required.
- **Analytics:** to measure site traffic. Used only with your consent.
- **Marketing:** to personalise content and ads. Used only with your consent.
## Managing your preferences
You can change your cookie preferences from the cookie banner or your browser settings.
`,
  ),
  page(
    "kvkk",
    { tr: "KVKK Aydınlatma Metni", en: "Personal Data Protection Notice" },
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
    `
## Data controller
Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.
## Personal data processed
Identity, contact, customer transaction, address and billing information.
## Purposes and legal grounds
Establishing and performing contracts, legal obligations and legitimate interest.
## Transfers
To shipping, payment and accounting providers and authorised public bodies.
## Your rights
For your rights under Article 11 of the Law, apply to info@zenweld.com.
`,
  ),
  page(
    "kisisel-verilerin-islenmesi-politikasi",
    { tr: "Kişisel Verilerin İşlenmesi Politikası", en: "Personal Data Processing Policy" },
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
    `
## Purpose and scope
This policy explains the principles Zenweld follows when processing personal data.
## Principles
- Lawfulness and fairness
- Accuracy and, where necessary, being up to date
- Processing for specified, explicit and legitimate purposes
- Being relevant, limited and proportionate
## Data categories and data subjects
Customers, members, dealers, suppliers and visitors.
## Data security
Technical and administrative measures taken to keep personal data secure.
`,
  ),
  page(
    "kisisel-veri-saklama-ve-imha-politikasi",
    { tr: "Kişisel Veri Saklama ve İmha Politikası", en: "Personal Data Retention and Destruction Policy" },
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
    `
## Purpose
Defines how long personal data is kept and how it is destroyed.
## Retention periods
- Order and invoice records: for the period required by law
- Membership data: during membership and the legal period afterwards
- Contact and service requests: for a set period after the request is closed
## Destruction methods
Deletion, destruction or anonymisation.
## Periodic destruction
Data whose retention period has expired is destroyed at regular intervals.
`,
  ),
  page(
    "fiziksel-guvenlik-aydinlatma-metni",
    {
      tr: "Fiziksel Güvenlik Süreçlerine Yönelik Aydınlatma Metni",
      en: "Notice on Physical Security Processes",
    },
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
    `
## Scope
Covers camera recordings and visitor entry/exit records at our offices, factory and warehouses.
## Data processed
Camera footage, visitor name, date and time of visit.
## Purpose
Ensuring the security of buildings, employees and visitors.
## Retention
Records are kept for a set period and then destroyed.
## Your rights
For your rights under Article 11 of the Law, apply to info@zenweld.com.
`,
  ),
  page(
    "iade",
    { tr: "İade ve Değişim", en: "Returns and Exchanges" },
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
    `
## Right of withdrawal
You can return the product within 14 days of delivery without giving a reason.
## Conditions
- The product must be unused and in its original packaging.
- The invoice and all accessories must be included.
## Process
Send your return request to info@zenweld.com; your payment is refunded within 14 days of the product reaching us.
## Exchanges
Faulty or damaged products are exchanged.
`,
  ),
  page(
    "on-bilgilendirme-formu",
    { tr: "Ön Bilgilendirme Formu", en: "Pre-Information Form" },
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
    `
## Delivery
Products are delivered by courier to the address given by the Buyer within 30 days of order confirmation at the latest. The carrier and tracking number are shown on the Buyer's Account > My Orders page once the product ships.
## Right of withdrawal
The Buyer may withdraw within 14 days of receiving the product without giving any reason and without penalty. The notice is sent to the Seller by email; the Seller refunds the payment within 14 days of receiving it.
## Corporate buyers
A Buyer purchasing for commercial or professional purposes is not a consumer; in that case the right of withdrawal and consumer-law provisions may not apply.
## Warranty
Products are covered by the Zenweld warranty for the period stated on the product page.
## Complaints and disputes
Disputes are handled by the Consumer Arbitration Committees at the Buyer's place of residence within the monetary limits announced each year by the Ministry of Trade, and by Consumer Courts above those limits.
`,
  ),
  page(
    "mesafeli-satis-sozlesmesi",
    { tr: "Mesafeli Satış Sözleşmesi", en: "Distance Sales Contract" },
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
    `
## Subject of the contract
This contract sets out the rights and obligations of the parties regarding the sale and delivery of the products above, ordered electronically by the Buyer on the Seller's website zenweld.com.
## General provisions
The Buyer confirms having read the preliminary information on the product's main characteristics, sale price, payment method and delivery, and having given the required electronic approval. The contract takes effect when the Buyer confirms the order; a copy is sent to the Buyer's email address.
## Delivery
Products are delivered within 30 days of order confirmation at the latest.
## Right of withdrawal
The Buyer may withdraw within 14 days of receiving the product.
## Disputes
Consumer Arbitration Committees and Consumer Courts have jurisdiction.
`,
  ),
];
