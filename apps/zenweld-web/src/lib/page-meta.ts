import type { Metadata } from "next";
import { absoluteUrl, canonical } from "@/lib/seo";

/**
 * SABIT SAYFALARIN ARAMA BASLIKLARI VE ACIKLAMALARI
 *
 * Bu sayfalarin icerigi tarayicida cizildigi icin ("use client") basligi
 * kendi layout.tsx dosyalari verir; hepsi bu tablodan okur:
 *
 *   export const generateMetadata = pageMetadataFor("/msds");
 *
 * Yeni bir sabit sayfa eklerken buraya bir satir eklemek yeterlidir.
 */
interface PageMeta {
  title: string;
  description: string;
  /** Giris, kayit gibi sayfalar: her zaman "noindex". */
  noindex?: boolean;
}

const PAGES = {
  "/hakkimizda": { title: "Hakkımızda", description: "Zenweld hakkında: kaynak teknolojileri, üretim yaklaşımımız ve Türkiye genelindeki bayi ağımız." },
  "/satis-temsilcilerimiz": { title: "Satış Temsilcilerimiz", description: "Zenweld satış temsilcileri: İstanbul, Ege, Akdeniz, Bursa ve İç Anadolu bölgelerinde telefon, WhatsApp ve e-posta ile doğrudan iletişim." },
  "/iletisim": { title: "İletişim", description: "Zenweld ile iletişime geçin: telefon, e-posta ve adres bilgileri." },
  "/teklif-al": { title: "Teklif Al", description: "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin." },
  "/garanti": { title: "Garanti", description: "Zenweld makinenizin garantisini online kaydedin ya da seri numaranızla mevcut garantinizi sorgulayın." },
  "/garanti/kayit": { title: "Garanti Kaydı", description: "Zenweld makinenizin garantisini seri numarasıyla online kaydedin ve garanti sürenizi uzatın." },
  "/garanti/sorgulama": { title: "Garanti Sorgulama", description: "Zenweld makinenizin garanti durumunu ve bitiş tarihini seri numarasıyla sorgulayın." },
  "/servis-talebi": { title: "Servis Talebi", description: "Zenweld makineniz için kurulum, bakım, onarım veya kullanım eğitimi talebi oluşturun." },
  "/blog": { title: "Blog", description: "Kaynak dünyasından haberler, teknik rehberler ve uzman ipuçları." },
  "/welders-club": { title: "Welders Club", description: "Binlerce kaynakçının buluştuğu Zenweld topluluğuna katılın; üyelere özel indirimler, eğitim içerikleri ve etkinlik davetiyeleri." },
  "/sss": { title: "Sık Sorulan Sorular", description: "Zenweld ürünleri, garanti, sipariş ve teknik konularda sık sorulan sorular." },
  "/urun-secici": { title: "Ürün Seçici", description: "Üç soruda ihtiyacınıza uygun Zenweld kaynak makinesini bulun." },
  "/kaynak-rehberi": { title: "Ultimate Kaynak Rehberi", description: "Ücretsiz dijital kaynak rehberini edinin veya basılı sürümü sipariş edin." },
  "/msds": { title: "MSDS — Malzeme Güvenlik Bilgi Formları", description: "Zenweld ürünlerine ait malzeme güvenlik bilgi formlarını sorgulayın." },
  "/parti-sertifikalari": { title: "Parti Sertifikaları", description: "Zenweld ürün uygunluk ve parti sertifikalarını indirin." },

  // Aramada cikmamasi gereken sayfalar (site acik olsa bile).
  "/giris": { title: "Giriş Yap", description: "Zenweld hesabınıza giriş yapın.", noindex: true },
  "/kayit": { title: "Üye Ol", description: "Zenweld hesabı oluşturun.", noindex: true },
  "/sifremi-unuttum": { title: "Şifremi Unuttum", description: "Şifre sıfırlama.", noindex: true },
  "/cikis": { title: "Çıkış", description: "Oturum kapatılıyor.", noindex: true },
  "/sepet": { title: "Sepetim", description: "Zenweld alışveriş sepeti.", noindex: true },
  "/odeme": { title: "Ödeme", description: "Siparişinizi tamamlayın.", noindex: true },
  "/arama": { title: "Arama", description: "Zenweld ürünlerinde arama yapın.", noindex: true },
} satisfies Record<string, PageMeta>;

export type StaticPagePath = keyof typeof PAGES;

/** layout.tsx icin hazir generateMetadata. */
export function pageMetadataFor(path: StaticPagePath) {
  return (): Metadata => {
    const { title, description, noindex }: PageMeta = PAGES[path];
    if (noindex) {
      return { title, description, robots: { index: false, follow: false } };
    }
    return {
      title,
      description,
      alternates: canonical(path),
      openGraph: { title, description, url: absoluteUrl(path) },
    };
  };
}
