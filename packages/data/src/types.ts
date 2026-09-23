/** Zenweld — paylasilan veri tipleri (TR/EN cift dilli) */

export type Locale = "tr" | "en";

/** Cift dilli metin alani */
export interface I18nText {
  tr: string;
  en: string;
}

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

export type TopLevelSection =
  | "ekipmanlar"
  | "guvenlik"
  | "aksesuarlar"
  | "dolgu-metalleri";

export interface Category {
  id: string;
  slug: string;
  section: TopLevelSection;
  /** Ust kategori slug'i (mega menude sol kolon) */
  group: string;
  name: I18nText;
  description: I18nText;
  icon?: string;
  order: number;
}

/** Mega menude sol kolonda duran gruplar */
export interface CategoryGroup {
  id: string;
  slug: string;
  section: TopLevelSection;
  name: I18nText;
  order: number;
}

/* ------------------------------------------------------------------ */
/* Urun                                                                */
/* ------------------------------------------------------------------ */

export interface SpecRow {
  label: I18nText;
  value: I18nText;
}

export interface ProductImage {
  /** Uzak gorsel (Unsplash). Yuklenemezse markali SVG placeholder devreye girer. */
  url: string;
  alt: I18nText;
}

export type WeldingProcess =
  | "MIG"
  | "MAG"
  | "TIG"
  | "MMA"
  | "PULSE"
  | "PLAZMA"
  | "MULTI";

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  /** Model kodu, orn. "Z03.01.15" */
  modelCode?: string;
  section: TopLevelSection;
  categorySlug: string;
  processes: WeldingProcess[];
  shortDescription: I18nText;
  description: I18nText;
  /** KDV haric liste fiyati (TRY) */
  priceExVat: number;
  vatRate: number;
  currency: "TRY";
  images: ProductImage[];
  specs: SpecRow[];
  /** "Kutu Icerigi" maddeleri */
  inTheBox: I18nText[];
  highlights: I18nText[];
  /** Zenweld ana deposunda stok var mi */
  inStock: boolean;
  /** Zenweld deposundaki adet — anasayfadaki "azalan stok" bolumu bunu kullanir */
  stockQuantity?: number;
  /** Anasayfadaki "Hot Sale" bolumunde gosterilir */
  hotSale?: boolean;
  /** Indirim oncesi liste fiyati (KDV haric); hotSale ile birlikte kullanilir */
  listPriceExVat?: number;
  /** Teklif Al akisina acik mi */
  quotable: boolean;
  featured: boolean;
  isNew: boolean;
  manualUrl?: string;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Bayiler (fiziksel satis noktalari)                                  */
/* ------------------------------------------------------------------ */

export type DealerBadge = "yetkili-satici" | "yetkili-servis" | "showroom";

export interface Dealer {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  lat: number;
  lng: number;
  badges: DealerBadge[];
  workingHours: I18nText;
  /** Bu bayinin online magazasi varsa retailer id'si */
  retailerId?: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Online saticilar (e-ticaret siteleri)                               */
/* ------------------------------------------------------------------ */

export interface Retailer {
  id: string;
  name: string;
  /** Site ana sayfasi */
  websiteUrl: string;
  /** Logo yerine kullanilacak kisa metin (logo dosyasi yoksa) */
  logoText: string;
  logoUrl?: string;
  /** Zenweld'in kendi bayi magazasi mi (ic link) */
  isOwnStore: boolean;
  city?: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Stok — urun x satici matrisi                                        */
/* ------------------------------------------------------------------ */

export interface RetailerStock {
  productId: string;
  retailerId: string;
  inStock: boolean;
  quantity?: number;
  /** Saticiya ozel fiyat (KDV dahil). Yoksa liste fiyati gosterilir. */
  price?: number;
  /** Urunun o sitedeki dogrudan linki */
  productUrl: string;
  updatedAt: string;
}

/** Fiziksel bayi stogu — "sadece stokta olan bayiler" filtresi icin */
export interface DealerStock {
  productId: string;
  dealerId: string;
  inStock: boolean;
  quantity?: number;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Kullanicilar                                                        */
/* ------------------------------------------------------------------ */

export type UserRole = "individual" | "business" | "dealer" | "admin";
export type UserStatus = "active" | "pending" | "suspended";

export interface User {
  id: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  /** Demo amacli basit hash */
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** Kurumsal ve bayi hesaplar icin */
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  sector?: string;
  /** Bayi hesaplar icin — hangi bayi kaydina bagli */
  dealerId?: string;
  dealerCode?: string;
  /** Bayi hesabi online magaza isletiyorsa */
  retailerId?: string;
  city?: string;
  createdAt: string;
  lastLoginAt?: string;
  newsletter: boolean;
}

export interface Address {
  id: string;
  userId: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  isDefault: boolean;
}

/* ------------------------------------------------------------------ */
/* Teklifler ve siparisler                                             */
/* ------------------------------------------------------------------ */

export type QuoteStatus = "new" | "reviewing" | "sent" | "won" | "lost";
export type PaymentPreference = "vadeli" | "cek" | "havale" | "belirsiz";

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  note?: string;
}

export interface Quote {
  id: string;
  code: string;
  userId?: string;
  status: QuoteStatus;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  taxNumber?: string;
  city: string;
  paymentPreference: PaymentPreference;
  termDays?: number;
  items: QuoteItem[];
  message?: string;
  assignedTo?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  code: string;
  userId?: string;
  /** Hangi magazadan — ana site (bayi siparisi) ya da bayi-shop */
  channel: "zenweld" | "bayi-shop";
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Icerik                                                              */
/* ------------------------------------------------------------------ */

export interface BlogPost {
  id: string;
  slug: string;
  title: I18nText;
  excerpt: I18nText;
  body: I18nText;
  coverUrl: string;
  category: I18nText;
  author: string;
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  question: I18nText;
  answer: I18nText;
  topic: "genel" | "garanti" | "siparis" | "teknik";
}

/* ------------------------------------------------------------------ */
/* Etkinlikler (fuarlar, sponsorluklar)                                */
/* ------------------------------------------------------------------ */

export interface ZenweldEvent {
  id: string;
  slug: string;
  /** Etkinlik adi ozel isimdir, cevrilmez; iki dilde de ayni gosterilir. */
  title: string;
  /** Kart uzerinde gorunen kisa aciklama */
  summary: I18nText;
  /** Detay sayfasindaki uzun metin */
  description: I18nText;
  /** ISO tarih: "2025-06-16" */
  startDate: string;
  endDate: string;
  /** Etkinlik mekani, orn. "Istanbul Fuar Merkezi" */
  venue: I18nText;
  city: string;
  country: string;
  /** Kart basligindaki etkinlik logosu */
  logoUrl: string;
  /** Detay sayfasindaki fotograf galerisi */
  images: string[];
  websiteUrl?: string;
  featured: boolean;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

export interface NewsItem {
  id: string;
  slug: string;
  title: I18nText;
  summary: I18nText;
  body: I18nText;
  coverUrl: string;
  category: I18nText;
  publishedAt: string;
  featured: boolean;
  active: boolean;
}

export interface WarrantyRecord {
  id: string;
  serialNumber: string;
  productId: string;
  ownerName: string;
  email: string;
  phone: string;
  purchaseDate: string;
  dealerName: string;
  registeredAt: string;
  expiresAt: string;
  extended: boolean;
}

/* ------------------------------------------------------------------ */
/* Veritabani anlik goruntusu (localStorage'da tutulan sekil)          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Gorunum ayarlari                                                     */
/* ------------------------------------------------------------------ */

/**
 * Etkinlik ve haber metinlerinin ("## baslik", "- madde", "**kalin**")
 * gorunumu. Yonetim panelindeki Gorunum sayfasindan degistirilir.
 */
export interface RichTextStyle {
  /** Ara baslik punto (px) */
  headingSize: number;
  headingColor: string;
  /** Ara basliklar BUYUK HARF gosterilsin mi */
  headingUppercase: boolean;
  /** Baslik altindaki cizgi ve madde noktasi rengi */
  accentColor: string;
  /** Baslik altindaki cizginin genisligi (px); 0 ise cizgi gizlenir */
  accentWidth: number;
  /** Giris paragrafi punto (px) */
  leadSize: number;
  /** Govde metni punto (px) */
  bodySize: number;
  bodyColor: string;
  /** Kalin vurgulu metinlerin rengi */
  strongColor: string;
}

export interface SiteSettings {
  richText: RichTextStyle;
}

export interface ZenweldDatabase {
  version: number;
  products: Product[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  dealers: Dealer[];
  retailers: Retailer[];
  retailerStock: RetailerStock[];
  dealerStock: DealerStock[];
  users: User[];
  addresses: Address[];
  quotes: Quote[];
  orders: Order[];
  blogPosts: BlogPost[];
  events: ZenweldEvent[];
  news: NewsItem[];
  faqs: FaqItem[];
  warranties: WarrantyRecord[];
  settings: SiteSettings;
}
