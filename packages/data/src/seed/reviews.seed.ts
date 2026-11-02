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
    approved: true,
    featured: false,
    createdAt: STAMP,
    ...extra,
  };
}

export const reviews: ProductReview[] = [
  review("rv1", "p-ultimate-250-mtc", "Mehmet A.", 5, "Atölyede günlük kullanımda",
    "Üç aydır her gün kullanıyoruz, ark tutuşu çok stabil. Ayarları kolay; yeni başlayan çırak bile düzgün dikiş atabiliyor.",
    { featured: true }),
  review("rv2", "p-evomig-205-p", "Serkan K.", 5, "Dikişler temiz",
    "Dikişler gerçekten düzgün ve temiz çıkıyor. Bu fiyata bu kaliteyi beklemiyordum.",
    { featured: true }),
  review("rv3", "p-ultimate-405-mts", "Hakan T.", 4, "Uzun kaynakta rahat",
    "Su soğutmalı aldık, uzun dikişlerde torç ısınmıyor ve tel sürme düzgün. Makine biraz ağır, arabası olmasa taşımak zor olurdu.",
    { featured: true }),
  review("rv4", "p-forcearc-200-mma", "Yusuf D.", 5, "Şantiyede iş görüyor",
    "Şantiyede kolayca taşıyorum, elektrot kaynağında ark çok kararlı. Şimdiye kadar hiç sorun çıkarmadı.",
    { featured: true }),
  review("rv5", "p-multicut-85-cnc", "Emre B.", 5, "Temiz kesim",
    "Kesim yüzeyinde cüruf neredeyse yok, taşlama işi çok azaldı. CNC bağlantısı da sorunsuz çalıştı.",
    { featured: true }),
  review("rv6", "p-ultimate-251-thp", "Ali R.", 4, "İnce sacda kontrollü",
    "Paslanmaz ince sacda ark başlangıcı yumuşak, delme olmuyor. Menüye alışmak biraz zaman aldı, sonrası kolay.",
    { featured: true }),
  review("rv7", "p-ultimate-355-mtc", "Caner Ö.", 5, "Seri üretimde sorunsuz",
    "Vardiya boyunca sürekli çalışıyor, ısınma yapıp kesmiyor. Tel sürme ünitesi çok düzgün.",
    { featured: true }),
  review("rv8", "p-forcemig-200", "Okan S.", 5, "Küçük atölye için yeterli",
    "Gazaltı ve elektrot kaynağını aynı makinede yapabiliyorum. Hafif, servis aracına rahat sığıyor.",
    { featured: true }),
  review("rv9", "p-ultimate-205-ac-dc", "Barış Y.", 5, "AC/DC tek makinede",
    "Hem alüminyum hem paslanmaz işliyorum, ikisi için ayrı makine almaktan kurtuldum.",
    { featured: true }),
  review("rv10", "p-y300-qcw", "Fatih G.", 4, "Lazerle hız farkı belli",
    "İnce paslanmazda dikiş çok temiz, sonradan taşlamaya neredeyse gerek kalmıyor. Kullanmadan önce eğitim almak şart.",
    { featured: true }),
  // Onay bekleyen ornek (yonetim panelinde gorunur, sitede gorunmez)
  review("rv11", "p-ultimate-255-mma", "Deneme Kullanıcı", 3, "Fena değil",
    "İşimi görüyor ama kablo biraz kısa geldi.",
    { approved: false }),
];
