import type { Metadata } from "next";
import type { PageSeoFields, TopLevelSection } from "@zenweld/data";
import { SECTION_DESCRIPTIONS, SECTION_TITLES } from "@/lib/catalog";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

/**
 * SABIT SAYFALARIN ARAMA BASLIKLARI VE ACIKLAMALARI
 *
 * Ana sayfa, urun bolumleri, kurumsal, destek ve garanti sayfalari.
 * Buradaki metinler varsayilandir; panelde Icerik > Sayfa SEO'dan
 * degistirilir (veritabani: pageSeo). Sayfalar basligi kendi layout/page
 * dosyasindan bu tabloyla alir:
 *
 *   export const generateMetadata = pageMetadataFor("/msds");
 *
 * Aramaya acik sayfalar (noindex olmayanlar) site haritasina girer ve Sayfa
 * SEO ekraninda bu sirayla listelenir. Yeni bir sabit sayfa eklerken buraya
 * bir satir eklemek yeterlidir.
 */

export const PAGE_GROUPS = ["Ana sayfa ve ürün bölümleri", "Keşfet", "Destek ve Garanti"] as const;
type PageGroup = (typeof PAGE_GROUPS)[number];

interface PageMeta {
  /** Paneldeki adi */
  name: string;
  /** Kisa baslik; sonuna "| ZENWELD" eklenir */
  title: string;
  /** Tam baslik ("| ZENWELD" eklenmez); yalnizca ana sayfa */
  absoluteTitle?: string;
  description: string;
  /** Sayfa SEO ekranindaki bolum */
  group?: PageGroup;
  /** Giris, kayit gibi sayfalar: her zaman "noindex"; panelde ve site haritasinda yok. */
  noindex?: boolean;
}

export const HOME_TITLE = "ZENWELD — Kaynak Makineleri ve Plazma Kesme Sistemleri";

const [HOME, DISCOVER, SUPPORT] = PAGE_GROUPS;

const section = (s: TopLevelSection): PageMeta => ({
  name: SECTION_TITLES[s],
  title: SECTION_TITLES[s],
  description: SECTION_DESCRIPTIONS[s],
  group: HOME,
});

const PAGES = {
  "/": { name: "Ana Sayfa", title: HOME_TITLE, absoluteTitle: HOME_TITLE, description: SITE_DESCRIPTION, group: HOME },
  "/ekipmanlar": section("ekipmanlar"),
  "/guvenlik": section("guvenlik"),
  "/aksesuarlar": section("aksesuarlar"),
  "/dolgu-metalleri": section("dolgu-metalleri"),
  "/teklif-al": { name: "Teklif Al", title: "Teklif Al", description: "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin.", group: HOME },

  "/hakkimizda": { name: "Hakkımızda", title: "Hakkımızda", description: "Zenweld hakkında: kaynak teknolojileri, üretim yaklaşımımız ve Türkiye genelindeki bayi ağımız.", group: DISCOVER },
  "/satis-temsilcilerimiz": { name: "Satış Temsilcilerimiz", title: "Satış Temsilcilerimiz", description: "Zenweld satış temsilcileri: İstanbul, Ege, Akdeniz, Bursa ve İç Anadolu bölgelerinde telefon, WhatsApp ve e-posta ile doğrudan iletişim.", group: DISCOVER },
  "/bayilik-basvurusu": { name: "Bayilik Başvurusu", title: "Bayilik Başvurusu", description: "Zenweld yetkili bayisi olun: başvuru formunu doldurun, bölge satış ekibimiz sizinle iletişime geçsin.", group: DISCOVER },
  "/iletisim": { name: "İletişim", title: "İletişim", description: "Zenweld ile iletişime geçin: telefon, e-posta ve adres bilgileri.", group: DISCOVER },
  "/haberler": { name: "Haberler", title: "Haberler", description: "Zenweld'den son gelişmeler, duyurular ve basın açıklamaları.", group: DISCOVER },
  "/etkinlikler": { name: "Etkinlikler", title: "Etkinlik Takvimi", description: "Zenweld'in katılacağı veya sponsor olacağı fuar ve diğer etkinlikler hakkında bilgi bulabilirsiniz.", group: DISCOVER },
  "/blog": { name: "Blog", title: "Blog", description: "Kaynak dünyasından haberler, teknik rehberler ve uzman ipuçları.", group: DISCOVER },
  "/welders-club": { name: "Welders Club", title: "Welders Club", description: "Binlerce kaynakçının buluştuğu Zenweld topluluğuna katılın; üyelere özel indirimler, eğitim içerikleri ve etkinlik davetiyeleri.", group: DISCOVER },
  "/urun-secici": { name: "Ürün Seçici", title: "Ürün Seçici", description: "Üç soruda ihtiyacınıza uygun Zenweld kaynak makinesini bulun.", group: DISCOVER },
  "/kaynak-rehberi": { name: "Ultimate Kaynak Rehberi", title: "Ultimate Kaynak Rehberi", description: "Ücretsiz dijital kaynak rehberini edinin veya basılı sürümü sipariş edin.", group: DISCOVER },
  "/msds": { name: "MSDS", title: "MSDS — Malzeme Güvenlik Bilgi Formları", description: "Zenweld ürünlerine ait malzeme güvenlik bilgi formlarını sorgulayın.", group: DISCOVER },
  "/parti-sertifikalari": { name: "Parti Sertifikaları", title: "Parti Sertifikaları", description: "Zenweld ürün uygunluk ve parti sertifikalarını indirin.", group: DISCOVER },

  "/sss": { name: "Sık Sorulan Sorular", title: "Sık Sorulan Sorular", description: "Zenweld ürünleri, garanti, sipariş ve teknik konularda sık sorulan sorular.", group: SUPPORT },
  "/yetkili-bayi-ve-servis-agi": { name: "Yetkili Bayi ve Servis Ağı", title: "Yetkili Bayi ve Servis Ağı", description: "Size en yakın Zenweld yetkili bayisini haritada bulun; ürünleri yerinde inceleyin ve satın alın.", group: SUPPORT },
  "/servis-talebi": { name: "Servis Talebi", title: "Servis Talebi", description: "Zenweld makineniz için kurulum, bakım, onarım veya kullanım eğitimi talebi oluşturun.", group: SUPPORT },
  "/garanti": { name: "Garanti", title: "Garanti", description: "Zenweld makinenizin garantisini online kaydedin ya da seri numaranızla mevcut garantinizi sorgulayın.", group: SUPPORT },
  "/garanti/kayit": { name: "Garanti Kaydı", title: "Garanti Kaydı", description: "Zenweld makinenizin garantisini seri numarasıyla online kaydedin ve garanti sürenizi uzatın.", group: SUPPORT },
  "/garanti/sorgulama": { name: "Garanti Sorgulama", title: "Garanti Sorgulama", description: "Zenweld makinenizin garanti durumunu ve bitiş tarihini seri numarasıyla sorgulayın.", group: SUPPORT },

  // Aramada cikmamasi gereken sayfalar (site acik olsa bile).
  "/giris": { name: "Giriş Yap", title: "Giriş Yap", description: "Zenweld hesabınıza giriş yapın.", noindex: true },
  "/kayit": { name: "Üye Ol", title: "Üye Ol", description: "Zenweld hesabı oluşturun.", noindex: true },
  "/sifremi-unuttum": { name: "Şifremi Unuttum", title: "Şifremi Unuttum", description: "Şifre sıfırlama.", noindex: true },
  "/cikis": { name: "Çıkış", title: "Çıkış", description: "Oturum kapatılıyor.", noindex: true },
  "/sepet": { name: "Sepetim", title: "Sepetim", description: "Zenweld alışveriş sepeti.", noindex: true },
  "/odeme": { name: "Ödeme", title: "Ödeme", description: "Siparişinizi tamamlayın.", noindex: true },
  "/arama": { name: "Arama", title: "Arama", description: "Zenweld ürünlerinde arama yapın.", noindex: true },
} satisfies Record<string, PageMeta>;

export type StaticPagePath = keyof typeof PAGES;

/** Sayfa SEO ekrani ve site haritasi: aramaya acik sabit sayfalar, menudeki sirayla. */
export const INDEXABLE_PAGES = (Object.entries(PAGES) as [StaticPagePath, PageMeta][])
  .filter(([, meta]) => !meta.noindex)
  .map(([path, meta]) => ({ path, name: meta.name, group: meta.group as PageGroup }));

/** Panelde duzenlenebilen (aramaya acik) sabit sayfa mi? */
export function isIndexablePage(path: string): path is StaticPagePath {
  return path in PAGES && !(PAGES[path as StaticPagePath] as PageMeta).noindex;
}

/** Sayfanin basligi ve aciklamasi: paneldeki deger, bossa varsayilan. */
export function staticPageSeo(path: StaticPagePath, override?: PageSeoFields) {
  const meta: PageMeta = PAGES[path];
  return {
    title: override?.title?.trim() || meta.absoluteTitle || `${meta.title} | ${SITE_NAME}`,
    description: override?.description?.trim() || meta.description,
  };
}

/**
 * layout/page icin hazir generateMetadata. Panelde degistirilen metin
 * backend kurulunca veritabanindan okunacak (docs/YAPILACAKLAR.md); bugun
 * varsayilan kullanilir.
 */
export function pageMetadataFor(path: StaticPagePath) {
  return (): Metadata => {
    const meta: PageMeta = PAGES[path];
    if (meta.noindex) {
      return { title: meta.title, description: meta.description, robots: { index: false, follow: false } };
    }
    const { title, description } = staticPageSeo(path);
    return {
      // Tam baslik: ust sayfanin baslik sablonuna bagli kalmaz.
      title: { absolute: title },
      description,
      alternates: canonical(path),
      openGraph: { title, description, url: absoluteUrl(path) },
    };
  };
}
