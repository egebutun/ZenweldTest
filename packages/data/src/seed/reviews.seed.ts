import type { ProductReview } from "../types";

/**
 * ORNEK URUN DEGERLENDIRMELERI
 *
 * !! DEMO VERI — GERCEK MUSTERI YORUMU DEGILDIR !!
 * Gercek yorumlar geldiginde bu dosya bosaltilmalidir. Gercek bir
 * markanin sitesinde uydurma yorum yayinlamak hem yaniltici hem de
 * ticari uygulama mevzuati acisindan sorunludur.
 *
 * featured: true olanlar anasayfadaki kayan seritte gorunur.
 */
const STAMP = "2026-09-20T10:00:00+03:00";

function review(
  id: string,
  productId: string,
  authorName: string,
  rating: number,
  title: string,
  body: string,
  extra: Partial<ProductReview> = {},
): ProductReview {
  return {
    id,
    productId,
    authorName,
    rating,
    title,
    body,
    media: [],
    verifiedPurchase: true,
    site: "zenweld",
    approved: true,
    featured: false,
    createdAt: STAMP,
    ...extra,
  };
}

export const reviews: ProductReview[] = [
  review("rv1", "p-ultimate-250-mtc", "Mehmet A.", 5, "Atölyede günlük kullanımda",
    "Üç aydır her gün kullanıyoruz, ark tutuşu çok stabil. Sinerjik ayarlar sayesinde yeni başlayan çırak bile düzgün dikiş atabiliyor.",
    { featured: true }),
  review("rv2", "p-evomig-205-p", "Serkan K.", 5, "Alüminyumda fark ediyor",
    "Double pulse modunda alüminyum dikişler gerçekten dekoratif çıkıyor. Bu fiyata bu özellik beklemiyordum.",
    { featured: true }),
  review("rv3", "p-zenmask-auto-9000", "Hakan T.", 4, "Net görüş",
    "Gerçek renk camı gözü çok daha az yoruyor. Tek eksiği kafa bandının biraz sert olması, alışınca sorun kalmıyor.",
    { featured: true }),
  review("rv4", "p-arc-200", "Yusuf D.", 5, "Taşınabilir ve güçlü",
    "Şantiyede tek elle taşıyorum, 5 kg gerçekten. Jeneratörle de sorunsuz çalıştı.",
    { featured: true }),
  review("rv5", "p-multicut-40-cnc", "Emre B.", 5, "Temiz kesim",
    "10 mm sacta cüruf neredeyse yok, taşlama işi çok azaldı. CNC bağlantısı da sorunsuz çalıştı.",
    { featured: true }),
  review("rv6", "p-mig-torcu-mb25", "Ali R.", 4, "Sarf malzemesi kolay bulunuyor",
    "Standart MB-25 sarfları her yerde var, bu büyük avantaj. 4 metreyi tercih ettim, erişim rahat.",
    { featured: true }),
  review("rv7", "p-ultimate-355-mtc", "Caner Ö.", 5, "Seri üretimde sorunsuz",
    "Vardiya boyunca sürekli çalışıyor, ısınma yapıp kesmiyor. Tel sürme ünitesi çok düzgün.",
    { featured: true }),
  review("rv8", "p-gazalti-teli-sg2-08", "Okan S.", 4, "Az sıçrantı",
    "Bakır kaplama düzgün, kontak memesi tıkanmıyor. Dikiş görüntüsü temiz çıkıyor.",
    { featured: true }),
  review("rv9", "p-ultimate-205-acdc-tig", "Barış Y.", 5, "AC/DC tek makinede",
    "Hem alüminyum hem paslanmaz işliyorum, ikisi için ayrı makine almaktan kurtuldum.",
    { featured: true }),
  review("rv10", "p-argon-regulatoru-cift-manometreli", "Fatih G.", 4, "Sızdırmıyor",
    "Debimetre okuması net, altı aydır hiç kaçak yapmadı. Fiyatına göre gayet iyi.",
    { featured: true }),
  // --- ZENWELD-BAYI-A magazasina ait yorumlar ---
  // Bayi sahibi ana siteden giris yapip Hesabim > Yorumlar'dan yonetir.
  review("rvb1", "p-ultimate-250-mtc", "İsmail Ç.", 5, "Hızlı teslimat",
    "Siparişten iki gün sonra elimdeydi, kurulum için de telefonla destek verdiler.",
    { site: "bayi", retailerId: "r-zenweld-bayi-a", featured: true }),
  review("rvb2", "p-zenmask-auto-9000", "Levent A.", 4, "Fiyat/performans iyi",
    "Mağazadan aldım, kutusu sağlam geldi. Maskenin camı beklediğimden net.",
    { site: "bayi", retailerId: "r-zenweld-bayi-a", featured: true }),
  review("rvb3", "p-arc-200", "Tuncay E.", 5, "Servis desteği",
    "Bir ayar sorunu yaşadım, mağazadan aradılar ve aynı gün çözdüler.",
    { site: "bayi", retailerId: "r-zenweld-bayi-a", approved: false }),

  // Onay bekleyen ornek (yonetim panelinde gorunur, sitede gorunmez)
  review("rv11", "p-arc-120", "Deneme Kullanıcı", 3, "Fena değil",
    "Giriş seviyesi için yeterli ama kablo biraz kısa geldi.",
    { approved: false }),
];
