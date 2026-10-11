import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { languageAlternates, ogUrl } from "@/lib/seo";

/**
 * SABIT SAYFALARIN ARAMA BASLIKLARI VE ACIKLAMALARI
 *
 * Bu sayfalarin icerigi tarayicida cizildigi icin ("use client") basligi
 * kendi layout.tsx dosyalari verir; hepsi bu tablodan okur:
 *
 *   export const generateMetadata = pageMetadataFor("/msds");
 *
 * Yeni bir sabit sayfa eklerken buraya bir satir eklemek yeterlidir.
 * [baslik, aciklama] her iki dilde zorunludur.
 */
interface PageMeta {
  tr: [title: string, description: string];
  en: [title: string, description: string];
  /** Giris, kayit gibi sayfalar: her zaman "noindex". */
  noindex?: boolean;
}

const PAGES = {
  "/hakkimizda": {
    tr: ["Hakkımızda", "Zenweld hakkında: kaynak teknolojileri, üretim yaklaşımımız ve Türkiye genelindeki bayi ağımız."],
    en: ["About Us", "About Zenweld: welding technologies, our approach to manufacturing and our dealer network across Türkiye."],
  },
  "/satis-temsilcilerimiz": {
    tr: ["Satış Temsilcilerimiz", "Zenweld satış temsilcileri: İstanbul, Ege, Akdeniz, Bursa ve İç Anadolu bölgelerinde telefon, WhatsApp ve e-posta ile doğrudan iletişim."],
    en: ["Our Sales Representatives", "Zenweld sales representatives: contact our team in Istanbul, the Aegean, Mediterranean, Bursa and Central Anatolia regions by phone, WhatsApp or e-mail."],
  },
  "/iletisim": {
    tr: ["İletişim", "Zenweld ile iletişime geçin: telefon, e-posta ve adres bilgileri."],
    en: ["Contact Us", "Get in touch with Zenweld: phone, email and address."],
  },
  "/teklif-al": {
    tr: ["Teklif Al", "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin."],
    en: ["Request a Quote", "We offer deferred payment and payment by cheque for corporate customers. Fill in the form and our sales team will contact you."],
  },
  "/garanti": {
    tr: ["Garanti", "Zenweld makinenizin garantisini online kaydedin ya da seri numaranızla mevcut garantinizi sorgulayın."],
    en: ["Warranty", "Register your Zenweld machine's warranty online or look up an existing warranty by serial number."],
  },
  "/garanti/kayit": {
    tr: ["Garanti Kaydı", "Zenweld makinenizin garantisini seri numarasıyla online kaydedin ve garanti sürenizi uzatın."],
    en: ["Warranty Registration", "Register your Zenweld machine's warranty online with its serial number and extend your warranty period."],
  },
  "/garanti/sorgulama": {
    tr: ["Garanti Sorgulama", "Zenweld makinenizin garanti durumunu ve bitiş tarihini seri numarasıyla sorgulayın."],
    en: ["Warranty Check", "Check your Zenweld machine's warranty status and expiry date by serial number."],
  },
  "/blog": {
    tr: ["Blog", "Kaynak dünyasından haberler, teknik rehberler ve uzman ipuçları."],
    en: ["Blog", "News, technical guides and expert tips from the world of welding."],
  },
  "/welders-club": {
    tr: ["Welders Club", "Binlerce kaynakçının buluştuğu Zenweld topluluğuna katılın; üyelere özel indirimler, eğitim içerikleri ve etkinlik davetiyeleri."],
    en: ["Welders Club", "Join the Zenweld community of thousands of welders — member discounts, training content and event invitations."],
  },
  "/sss": {
    tr: ["Sık Sorulan Sorular", "Zenweld ürünleri, garanti, sipariş ve teknik konularda sık sorulan sorular."],
    en: ["Frequently Asked Questions", "Frequently asked questions about Zenweld products, warranty, orders and technical topics."],
  },
  "/urun-secici": {
    tr: ["Ürün Seçici", "Üç soruda ihtiyacınıza uygun Zenweld kaynak makinesini bulun."],
    en: ["Product Selector", "Find the right Zenweld welding machine for your needs in three questions."],
  },
  "/kaynak-rehberi": {
    tr: ["Ultimate Kaynak Rehberi", "Ücretsiz dijital kaynak rehberini edinin veya basılı sürümü sipariş edin."],
    en: ["The Ultimate Welding Guide", "Get the free digital welding guide or order the printed edition."],
  },
  "/msds": {
    tr: ["MSDS — Malzeme Güvenlik Bilgi Formları", "Zenweld ürünlerine ait malzeme güvenlik bilgi formlarını sorgulayın."],
    en: ["MSDS — Safety Data Sheets", "Look up material safety data sheets for Zenweld products."],
  },
  "/parti-sertifikalari": {
    tr: ["Parti Sertifikaları", "Zenweld ürün uygunluk ve parti sertifikalarını indirin."],
    en: ["Batch Certificates", "Download Zenweld product compliance and batch certificates."],
  },

  // Aramada cikmamasi gereken sayfalar (site acik olsa bile).
  "/giris": {
    tr: ["Giriş Yap", "Zenweld hesabınıza giriş yapın."],
    en: ["Sign In", "Sign in to your Zenweld account."], noindex: true,
  },
  "/kayit": {
    tr: ["Üye Ol", "Zenweld hesabı oluşturun."],
    en: ["Create an Account", "Create a Zenweld account."], noindex: true,
  },
  "/sifremi-unuttum": {
    tr: ["Şifremi Unuttum", "Şifre sıfırlama."],
    en: ["Forgot Password", "Password reset."], noindex: true,
  },
  "/cikis": {
    tr: ["Çıkış", "Oturum kapatılıyor."],
    en: ["Sign Out", "Signing out."], noindex: true,
  },
  "/arama": {
    tr: ["Arama", "Zenweld ürünlerinde arama yapın."],
    en: ["Search", "Search Zenweld products."], noindex: true,
  },
} satisfies Record<string, PageMeta>;

export type StaticPagePath = keyof typeof PAGES;

export function staticPageMetadata(path: StaticPagePath, locale: Locale): Metadata {
  const page: PageMeta = PAGES[path];
  const [title, description] = page[locale];
  if (page.noindex) {
    return { title, description, robots: { index: false, follow: false } };
  }
  return {
    title,
    description,
    alternates: languageAlternates(path, locale),
    openGraph: { title, description, url: ogUrl(path, locale) },
  };
}

/** layout.tsx icin hazir generateMetadata. */
export function pageMetadataFor(path: StaticPagePath) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    return staticPageMetadata(path, isLocale(locale) ? locale : "tr");
  };
}
