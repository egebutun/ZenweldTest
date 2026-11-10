import { EMAIL_RECIPIENT_TYPES } from "@zenweld/data";

/**
 * ISLEM KAYDI VE E-POSTA KAYDI EKRANLARININ ADLARI (panel; Asama 5, 6. alan)
 *
 * Kayitlarda tablo ve tur adlari (orders, teklif...) durur; ekran Turkce
 * adlarini gosterir. Listede olmayan ad oldugu gibi gosterilir.
 */

export const ENTITY_LABELS: Record<string, string> = {
  orders: "Sipariş",
  return_requests: "İade talebi",
  coupons: "Kupon",
  quotes: "Teklif",
  service_requests: "Servis talebi",
  warranties: "Garanti",
  reviews: "Yorum",
  dealer_applications: "Bayilik başvurusu",
  support_messages: "Mesaj",
  welders_club_signups: "Welders Club",
  option_definitions: "Seçenek tanımı",
  categories: "Kategori",
  category_groups: "Grup",
  products: "Ürün",
  dealers: "Bayi",
  retailers: "Online satıcı",
  sales_reps: "Satış temsilcisi",
  dealer_stock: "Bayi stoğu",
  retailer_stock: "Satıcı stoğu",
  stock_imports: "Stok dosyası",
  sku_aliases: "Kod eşleştirme",
  settings: "Ayarlar",
  email_recipients: "E-posta alıcıları",
  news: "Haber",
  events: "Etkinlik",
  blog_posts: "Blog yazısı",
  faqs: "SSS",
  about_page: "Hakkımızda",
  legal_pages: "Yasal metin",
  page_seo: "Sayfa SEO",
  document_pages: "Belge sayfası",
  documents: "Belge",
  files: "Yüklenen dosya",
  users: "Üye / yönetici",
};

export const entityLabel = (type: string) => ENTITY_LABELS[type] ?? type;

export const ACTION_LABELS: Record<string, string> = {
  create: "Ekledi",
  update: "Değiştirdi",
  delete: "Sildi",
  login: "Giriş yaptı",
  logout: "Çıkış yaptı",
};

/** Kaydin paneldeki sayfasi (silinmemisse); bilinmeyen tur icin yok. */
export function entityHref(type: string, id: string): string | undefined {
  // Tanitim alani ayari kendi ekranindadir.
  if (type === "settings" && id === "home_hero") return "/yonetim/tanitim";
  const detail: Record<string, string> = {
    orders: "/yonetim/siparisler/",
    coupons: "/yonetim/kuponlar/",
    products: "/yonetim/urunler/",
    categories: "/yonetim/kategoriler/",
    category_groups: "/yonetim/kategoriler/grup/",
    news: "/yonetim/haberler/",
    events: "/yonetim/etkinlikler/",
    blog_posts: "/yonetim/blog/",
    legal_pages: "/yonetim/yasal-metinler/",
    files: "/dosya/",
  };
  const list: Record<string, string> = {
    return_requests: "/yonetim/iade-talepleri",
    quotes: "/yonetim/teklifler",
    service_requests: "/yonetim/servis-talepleri",
    warranties: "/yonetim/garantiler",
    reviews: "/yonetim/yorumlar",
    dealer_applications: "/yonetim/bayilik-basvurulari",
    support_messages: "/yonetim/mesajlar",
    welders_club_signups: "/yonetim/welders-club",
    option_definitions: "/yonetim/secenekler",
    dealers: "/yonetim/bayiler",
    retailers: "/yonetim/saticilar",
    sales_reps: "/yonetim/satis-temsilcileri",
    settings: "/yonetim/magaza",
    email_recipients: "/yonetim/magaza",
    faqs: "/yonetim/sss",
    about_page: "/yonetim/hakkimizda",
    page_seo: "/yonetim/sayfa-seo",
    document_pages: "/yonetim/belgeler",
    documents: "/yonetim/belgeler",
    users: "/yonetim/uyeler",
  };
  if (detail[type]) return `${detail[type]}${type === "files" ? id : encodeURIComponent(id)}`;
  return list[type];
}

export const EMAIL_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(EMAIL_RECIPIENT_TYPES.map((t) => [t.type, t.label])),
  "sifre-sifirlama": "Şifre sıfırlama",
};

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  sent: "Gönderildi",
  failed: "Gönderilemedi",
  skipped: "Gönderilmedi",
};

/** Degisikligin bir degeri: kisa metin (uzunsa kirpilir). */
export function showValue(value: unknown, max = 160): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
