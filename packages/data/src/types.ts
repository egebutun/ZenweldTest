/** Zenweld — paylasilan veri tipleri */

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
  /** Kategori tablosundaki numara (or. "1.2.3"). */
  code?: string;
  slug: string;
  section: TopLevelSection;
  /** Ust kategori slug'i (mega menude sol kolon) */
  group: string;
  name: string;
  description: string;
  icon?: string;
  /** Grup sayfasindaki kart gorseli; yoksa kategorinin ilk urununun fotografi */
  image?: string;
  order: number;
}

/** Mega menude sol kolonda duran gruplar */
export interface CategoryGroup {
  id: string;
  /** Kategori tablosundaki numara (or. "1.2"). */
  code?: string;
  slug: string;
  section: TopLevelSection;
  name: string;
  /** Bolum sayfasindaki kart gorseli; yoksa gruptaki ilk urunun fotografi */
  image?: string;
  order: number;
}

/* ------------------------------------------------------------------ */
/* Urun                                                                */
/* ------------------------------------------------------------------ */

export interface SpecRow {
  label: string;
  value: string;
}

/* ------------------------------------------------------------------ */
/* Urun secenekleri (varyantlar)                                       */
/*                                                                     */
/* Ornek: bir MIG torcunun 3 m ve 5 m secenekleri. Secenek degisince   */
/* fiyat, urun kodu, teknik ozellikler ve hangi bayide bulundugu       */
/* degisebilir.                                                        */
/* ------------------------------------------------------------------ */

export interface ProductVariantOption {
  id: string;
  label: string;
  /** Taban fiyata eklenecek fark (KDV haric, TRY). Eksi de olabilir. */
  priceDeltaExVat: number;
  /** Varyanta ozel urun kodu; yoksa urunun kendi SKU'su kullanilir. */
  sku?: string;
  /** Ayni etiketli satir varsa uzerine yazar, yoksa listeye eklenir. */
  specOverrides?: SpecRow[];
}

export interface ProductVariantGroup {
  id: string;
  /** Orn. "Torç Uzunluğu" */
  label: string;
  options: ProductVariantOption[];
}

export interface ProductImage {
  /** Uzak gorsel (Unsplash). Yuklenemezse markali SVG placeholder devreye girer. */
  url: string;
  alt: string;
}

export type WeldingProcess =
  | "MIG"
  | "MAG"
  | "TIG"
  | "MMA"
  | "PULSE"
  | "PLAZMA"
  | "MULTI";

/**
 * Urun indirimi. Normal fiyat urunde kalir; indirim yalnizca gecerlilik
 * suresi icinde uygulanir (bkz. packages/data/src/discount.ts).
 */
export interface ProductDiscount {
  /** Indirim orani (%), 1–90 */
  percent: number;
  /** Kampanya baslangici (ISO). Bos: kayit aninda baslar. */
  startsAt?: string;
  /** Kampanya bitisi (ISO). Bos: suresiz. */
  endsAt?: string;
}

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
  shortDescription: string;
  description: string;
  /**
   * KDV haric NORMAL fiyat (TRY) — indirimsiz, yonetim panelinde girilen.
   * Musterinin odedigi fiyat icin salePriceExVat() kullanilir; kampanya
   * varsa indirim orada uygulanir.
   */
  priceExVat: number;
  vatRate: number;
  currency: "TRY";
  images: ProductImage[];
  specs: SpecRow[];
  /** "Kutu Icerigi" maddeleri */
  inTheBox: string[];
  highlights: string[];
  /**
   * Kampanya / indirim. Gecerli oldugu surece urun indirimli fiyatla
   * gosterilir ve anasayfadaki "Hot Sale" bolumune kendiliginden girer;
   * suresi bitince kendiliginden cikar. Ayrica isaretlemeye gerek yok.
   */
  discount?: ProductDiscount;
  /**
   * Secenekli urunler (orn. 3 m / 5 m torc). Secim fiyati, urun kodunu,
   * teknik ozellikleri ve bayi bulunurlugunu degistirebilir.
   */
  variantGroups?: ProductVariantGroup[];
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

export type DealerBadge = "yetkili-satici" | "yetkili-servis";

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
  workingHours: string;
  /**
   * Bayinin online magazasi (Online Saticilar'daki kaydi). Varsa bayinin stok
   * dosyasindaki Link sutunu da okunur; urunler hem haritada hem bu
   * magazanin online satici kartinda gorunur. Bir magaza yalnizca bir
   * bayiye baglanabilir (bkz. saveDealer).
   */
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
  /** Zenweld'in kendi online magazasi mi (urun sayfasinda kirmizi rozetle en basta) */
  isOwnStore: boolean;
  city?: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Stok — bayi ve online satici stoklari (bkz. docs/STOK.md)           */
/* ------------------------------------------------------------------ */

export type StockSourceType = "dealer" | "retailer";

/**
 * Bir stok listesindeki bir urun satiri. Bayiler ve saticilar her gun
 * kod + adet (+ fiyat, link) listesi gonderir; liste panelden yuklenir.
 * Sitede "stokta" sayilmasi icin: adet > 0 ve kayit, panelde ayarlanan gun
 * sayisindan (settings.stock.staleDays) eski olmamali.
 */
export interface StockRow {
  productId: string;
  /** Secenekli urunde secenegin id'si; bos ise urunun tum secenekleri. */
  variantId?: string;
  /** Dosyadaki kod (bizim SKU ya da bayinin kendi kodu) */
  sku: string;
  quantity: number;
  /** Bayinin/saticinin satis fiyati (KDV dahil). Sitede gosterilmez. */
  price?: number;
  /**
   * Urunun saticinin sitesindeki sayfasi. Online satici kartinda bu linke
   * gidilir; link yoksa satici o urunde gosterilmez.
   */
  url?: string;
  updatedAt: string;
}

/**
 * Bayi stogu (DB: dealer_stock). Urun sayfasindaki "Stoktaki Bayileri Gor"
 * haritasi buradan gelir. Bayinin online magazasi varsa (Dealer.retailerId)
 * linkli satirlar o magazanin online satici kartinda da gorunur; bu
 * bayiler tek dosya gonderir.
 */
export interface DealerStock extends StockRow {
  dealerId: string;
}

/** Online satici stogu (DB: retailer_stock). Bir bayiye bagli olmayan saticilar. */
export interface RetailerStock extends StockRow {
  retailerId: string;
}

/** Stok dosyasi yuklemesi, elle duzeltme ya da geri alma kaydi (DB: stock_imports). */
export interface StockImport {
  id: string;
  sourceType: StockSourceType;
  sourceId: string;
  kind: "file" | "manual" | "revert";
  fileName?: string;
  createdAt: string;
  /** Islemi yapan yonetici */
  createdBy?: string;
  /** Elle duzeltmelerde degisikligin aciklamasi */
  note?: string;
  summary: StockImportSummary;
  /** Geri alma icin: islemden onceki stok satirlari (son yuklemelerde tutulur) */
  previous?: StockRow[];
  /** Geri alindiysa zamani */
  revertedAt?: string;
}

export interface StockImportSummary {
  /** Dosyadaki veri satiri sayisi */
  rows: number;
  matched: number;
  unmatched: number;
  invalid: number;
  /** Stoga giren (0 -> adet) */
  added: number;
  /** Adedi ya da fiyati/linki degisen */
  changed: number;
  /** Stoktan cikan (adet -> 0 ya da dosyada yok) */
  zeroed: number;
}

/** Bayinin kendi urun kodu -> bizim urunumuz (DB: sku_aliases). */
export interface SkuAlias {
  sourceId: string;
  /** Bayinin dosyasindaki kod (buyuk harf, bosluksuz saklanir) */
  code: string;
  productId: string;
  variantId?: string;
}

/* ------------------------------------------------------------------ */
/* Kullanicilar                                                        */
/* ------------------------------------------------------------------ */

export type UserRole = "individual" | "business" | "admin";
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
  /** Kurumsal hesaplar icin */
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  sector?: string;
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

/* ------------------------------------------------------------------ */
/* Online siparisler (ana sitedeki magaza)                             */
/*                                                                     */
/* Siparisi yalnizca uye musteriler verir. Akis:                       */
/*   kartla odeme   -> preparing                                       */
/*   havale/EFT     -> awaiting_payment -> (odeme alindi) preparing    */
/*   preparing -> shipped (kargo firmasi + takip no) -> delivered      */
/* Her durum degisikligi history'ye yazilir; musteri Hesabim >         */
/* Siparislerim'de bu zaman cizelgesini gorur.                         */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  | "awaiting_payment"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  /** Secili secenekler, orn. "Torç Uzunluğu: 5 m" */
  variantLabel?: string;
  quantity: number;
  /** Siparis anindaki birim fiyat (KDV haric, indirim uygulanmis) */
  unitPriceExVat: number;
  vatRate: number;
  /** Siparis anindaki birim fiyat (KDV dahil) */
  unitPrice: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
}

/** Fatura bilgileri (e-Arsiv / e-Fatura icin). */
export interface OrderInvoice {
  type: "individual" | "corporate";
  /** Bireysel: ad soyad */
  fullName?: string;
  /** Bireysel: T.C. kimlik no */
  tcKimlikNo?: string;
  /** Kurumsal */
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  address: OrderAddress;
}

export type PaymentMethod = "card" | "transfer";

export interface OrderPayment {
  method: PaymentMethod;
  /** Kart: taksit sayisi (1 = tek cekim) */
  installments?: number;
  /** Kart: "Visa", "Mastercard", "Troy" */
  cardBrand?: string;
  /** Kart: banka kart programi (Bonus, World ...) */
  cardProgram?: string;
  cardLast4?: string;
  /** Odeme alindigi an. Havalede yonetici "Odeme alindi" deyince dolar. */
  paidAt?: string;
  /** Havale: bu tarihe kadar odenmezse siparis iptal edilir. */
  dueAt?: string;
}

export interface OrderShipment {
  carrier: string;
  trackingNumber: string;
  shippedAt: string;
  deliveredAt?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: OrderAddress;
  invoice: OrderInvoice;
  items: OrderItem[];
  /** Urunler toplami (KDV dahil) */
  subtotal: number;
  /** subtotal icindeki KDV tutari (bilgi amacli) */
  vat: number;
  /** Kargo ucreti (KDV dahil); esigin uzerinde 0 */
  shipping: number;
  /** Taksitli odemede vade farki */
  installmentFee: number;
  /** Musterinin odedigi toplam */
  total: number;
  payment: OrderPayment;
  shipment?: OrderShipment;
  history: OrderStatusEvent[];
  customerNote?: string;
  /** Yalnizca yonetim panelinde gorunur */
  adminNote?: string;
  /** Musteri on bilgilendirme formu ve mesafeli satis sozlesmesini onayladi */
  termsAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Icerik                                                              */
/* ------------------------------------------------------------------ */

export interface BlogPost {
  id: string;
  /** Adres parcasi: /blog/<slug> */
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  category: string;
  author: string;
  publishedAt: string;
  /**
   * Yayinda mi? Yonetim panelinden kapatilan yazi sitede gorunmez. Eski kayitlarda alan yoksa yayinda sayilir.
   */
  active?: boolean;
}

/* ------------------------------------------------------------------ */
/* Urun degerlendirmeleri                                              */
/* ------------------------------------------------------------------ */

/** Yoruma eklenen gorsel ya da video. */
export interface ReviewMedia {
  /** data: URL ya da dosya yolu */
  url: string;
  kind: "image" | "video";
}

export interface ProductReview {
  id: string;
  productId: string;
  /** Yorumu yazan uyenin id'si; uye degilse bos. */
  userId?: string;
  authorName: string;
  /** 1 - 5 arasi yildiz */
  rating: number;
  title?: string;
  body: string;
  media: ReviewMedia[];
  /** Urunu gercekten satin almis mi (dogrulanmis alici rozeti). */
  verifiedPurchase?: boolean;
  /** Yonetim panelinde onaylandi mi; yalnizca onaylilar yayinda. */
  approved: boolean;
  /** Anasayfadaki kayan seritte gosterilsin mi (en fazla 10 tane). */
  featured: boolean;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  topic: "genel" | "garanti" | "siparis" | "teknik";
}

/* ------------------------------------------------------------------ */
/* Etkinlikler (fuarlar, sponsorluklar)                                */
/* ------------------------------------------------------------------ */

export interface ZenweldEvent {
  id: string;
  slug: string;
  /** Etkinlik adi (fuar adi) */
  title: string;
  /** Kart uzerinde gorunen kisa aciklama */
  summary: string;
  /** Detay sayfasindaki uzun metin */
  description: string;
  /** ISO tarih: "2025-06-16" */
  startDate: string;
  endDate: string;
  /** Etkinlik mekani, orn. "Istanbul Fuar Merkezi" */
  venue: string;
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
  /** Adres parcasi: /haberler/<slug> */
  slug: string;
  title: string;
  summary: string;
  body: string;
  /** Kart ve haber basindaki ana gorsel */
  coverUrl: string;
  /** Haber sayfasindaki fotograf galerisi (etkinliklerdeki gibi) */
  images: string[];
  publishedAt: string;
  featured: boolean;
  active: boolean;
}

export interface WarrantyRecord {
  id: string;
  serialNumber: string;
  /** Urun kategorisi (slug) */
  categorySlug: string;
  /** Model (urun) */
  productId: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  postalCode: string;
  address: string;
  /** Urunu satan firmanin vergi kimlik numarasi */
  sellerTaxNumber: string;
  /** Garanti suresi kayit tarihinden baslar. */
  registeredAt: string;
  expiresAt: string;
  extended: boolean;
}

/* ------------------------------------------------------------------ */
/* Hakkimizda sayfasi ve satis temsilcileri (yonetim panelinden)       */
/* ------------------------------------------------------------------ */

/** Hakkimizda sayfasindaki bir metin bolumu. */
export interface AboutSection {
  id: string;
  title: string;
  /** Bicimlendirme: "## ara baslik", "- madde", "**kalin**" (haberlerle ayni) */
  body: string;
  /** Bolumun yaninda gosterilecek gorsel (istege bagli) */
  imageUrl?: string;
}

/** Hakkimizda sayfasinin ustundeki rakam kutulari ("25+ Yillik Tecrube" gibi). */
export interface AboutStat {
  id: string;
  value: string;
  label: string;
}

export interface AboutContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  stats: AboutStat[];
  sections: AboutSection[];
  updatedAt: string;
}

/** Kesfet > Satis Temsilcilerimiz */
export interface SalesRep {
  id: string;
  name: string;
  /** Sorumlu oldugu bolge veya gorevi ("Ege Bolge", "Demo ve Satis Sonrasi ...") */
  region: string;
  phone: string;
  email: string;
  photoUrl?: string;
  /** Listede siralama (kucuk olan once) */
  order: number;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Yasal metinler (alt bilgideki Politikalar & Yasal)                  */
/* ------------------------------------------------------------------ */

/**
 * Yonetim panelinden duzenlenen yasal metin. Sayfanin adresi sabittir
 * (id -> adres eslemesi: packages/data/src/legal.ts); baslik ve metin
 * panelden degisir.
 */
export interface LegalPage {
  id: string;
  title: string;
  /** Bicimlendirme haberlerle ayni: "## ara baslik", "- madde", "**kalin**" */
  body: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Servis talepleri (Destek ve Garanti > Servis Talebi)                */
/* ------------------------------------------------------------------ */

export type ServiceReason = "kurulum" | "bakim" | "onarim" | "egitim";
export type ServiceRequestStatus = "new" | "in_progress" | "done";

export interface ServiceRequest {
  id: string;
  code: string;
  status: ServiceRequestStatus;
  /** Makine turu: kategori slug'i (Kaynak / Lazer makineleri altinda) */
  categorySlug: string;
  productId: string;
  productName: string;
  reasons: ServiceReason[];
  complaint: string;
  companyName: string;
  address: string;
  city: string;
  district: string;
  email: string;
  phone: string;
  contactName: string;
  contactGsm: string;
  /** Uye giris yapmissa */
  userId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
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

/* ------------------------------------------------------------------ */
/* Magaza ayarlari (kargo, taksit, havale)                             */
/* ------------------------------------------------------------------ */

export interface InstallmentOption {
  /** Taksit sayisi: 2, 3, 6, 9, 12 */
  count: number;
  /** Musteriye yansitilan vade farki (%). 0 = pesin fiyatina taksit. */
  ratePercent: number;
  enabled: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
}

export interface ShopSettings {
  /** Bu tutar ve ustu (KDV dahil sepet) kargo bedava */
  freeShippingThreshold: number;
  /** Esigin altindaki siparislerde kargo ucreti (KDV dahil) */
  shippingFee: number;
  installments: InstallmentOption[];
  /** Taksit secenekleri bu tutarin altindaki siparislerde gosterilmez */
  minInstallmentAmount: number;
  bankAccounts: BankAccount[];
  /** Havale/EFT icin odeme suresi (gun); dolunca siparis iptal edilir */
  transferDueDays: number;
  /** Kargo firmalari (siparise takip no girilirken secilir) */
  carriers: string[];
}

export interface StockSettings {
  /** Bu kadar gunden eski stok kayitlari sitede gosterilmez (0 = sinir yok). */
  staleDays: number;
}

export interface SiteSettings {
  richText: RichTextStyle;
  shop: ShopSettings;
  stock: StockSettings;
}

export interface ZenweldDatabase {
  version: number;
  products: Product[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  dealers: Dealer[];
  retailers: Retailer[];
  dealerStock: DealerStock[];
  retailerStock: RetailerStock[];
  stockImports: StockImport[];
  skuAliases: SkuAlias[];
  users: User[];
  addresses: Address[];
  quotes: Quote[];
  orders: Order[];
  blogPosts: BlogPost[];
  events: ZenweldEvent[];
  news: NewsItem[];
  faqs: FaqItem[];
  reviews: ProductReview[];
  warranties: WarrantyRecord[];
  about: AboutContent;
  salesReps: SalesRep[];
  legalPages: LegalPage[];
  serviceRequests: ServiceRequest[];
  settings: SiteSettings;
}
