import type { Locale } from "./config";

/**
 * DILE GORE ADRESLER
 *
 * Uygulamanin ic rota agaci Turkce'dir (/urun, /ekipmanlar ...). Ingilizce
 * ziyaretciye gorunen adresler bu tablo uzerinden cevrilir:
 *
 *   ic rota:      /en/urun/arc-200
 *   gorunen adres: /en/products/arc-200
 *
 * Cevrimi middleware yapar; linkler localizePath() ile uretilir.
 *
 * ONEMLI: Bu tablo yalnizca YAPISAL segmentleri cevirir. Urun slug'lari
 * (arc-200) iki dilde aynidir — model adlari cevrilmez. Kategori, blog ve
 * haber slug'larinin Ingilizcesi kaydin kendisinde tutulur (slugEn; bkz.
 * packages/data/src/slugs.ts).
 */

/** Birinci seviye segmentler: /tr/<segment> */
const TOP_LEVEL: Record<string, string> = {
  urun: "products",
  ekipmanlar: "equipment",
  guvenlik: "safety",
  aksesuarlar: "accessories",
  "dolgu-metalleri": "filler-metals",
  "yetkili-bayi-ve-servis-agi": "authorised-dealer-service-network",
  "teklif-al": "request-quote",
  arama: "search",
  kesfet: "explore",
  destek: "support",
  kurumsal: "legal",
  giris: "login",
  kayit: "register",
  cikis: "logout",
  "sifremi-unuttum": "forgot-password",
  hesabim: "account",

  // Bayi magazasina ozel segmentler
  magaza: "shop",
  // Bayi magazasinda blog ust seviyededir (/blog); ana sitede
  // /kesfet/blog altindadir — iki yazim da ayni kelimeye cevrilir.
  blog: "blog",
  sepet: "cart",
  odeme: "checkout",
  "siparis-tamam": "order-complete",
  hakkimizda: "about",
  iletisim: "contact",
  "kargo-iade": "shipping-returns",
};

/** Ikinci seviye segmentler: yalnizca su ust segmentlerin altinda gecerli */
const NESTED: Record<string, Record<string, string>> = {
  kesfet: {
    "bayilik-basvurusu": "become-a-dealer",
    "welders-club": "welders-club",
    garanti: "warranty",
    blog: "blog",
    etkinlikler: "events",
    haberler: "news",
    msds: "msds",
    "parti-sertifikalari": "batch-certificates",
    "urun-secici": "product-selector",
    "kaynak-rehberi": "welding-guide",
    "satis-temsilcilerimiz": "sales-representatives",
  },
  destek: {
    sss: "faq",
    iletisim: "contact",
    "geri-cagirma": "recall",
  },
  kurumsal: {
    kvkk: "privacy-notice",
    gizlilik: "privacy-policy",
    "garanti-sartlari": "warranty-terms",
    "kullanim-kosullari": "terms",
    iade: "returns",
  },
  hesabim: {
    profil: "profile",
    tekliflerim: "my-quotes",
    siparislerim: "my-orders",
    favorilerim: "favourites",
    garantilerim: "my-warranties",
    adreslerim: "addresses",
  },
};

const invert = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(map).map(([tr, en]) => [en, tr]));

const TOP_LEVEL_REVERSE = invert(TOP_LEVEL);
const NESTED_REVERSE: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(NESTED).map(([parent, map]) => [TOP_LEVEL[parent] ?? parent, invert(map)]),
);

/**
 * Ic rotayi ziyaretciye gosterilecek adrese cevirir.
 * localizePath("/urun/arc-200", "en") -> "/products/arc-200"
 * localizePath("/urun/arc-200", "tr") -> "/urun/arc-200"
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === "tr") return path;

  // Sorgu ve parca (?grup=..., #...) cevrilmez, sona aynen eklenir. Onceden
  // "/ekipmanlar?grup=x" tek parca sanilip hic cevrilmiyordu.
  const [, base, suffix] = path.match(/^([^?#]*)(.*)$/) ?? ["", path, ""];

  const [first, second, ...rest] = base.replace(/^\//, "").split("/");
  if (!first) return path;

  const translatedFirst = TOP_LEVEL[first];
  if (!translatedFirst) return path;

  const nestedMap = NESTED[first];
  const translatedSecond = second && nestedMap ? (nestedMap[second] ?? second) : second;

  return "/" + [translatedFirst, translatedSecond, ...rest].filter(Boolean).join("/") + suffix;
}

/**
 * Ziyaretciye gosterilen adresi ic rotaya cevirir (middleware kullanir).
 * internalizePath("/products/arc-200") -> "/urun/arc-200"
 */
export function internalizePath(path: string): string {
  const [first, second, ...rest] = path.replace(/^\//, "").split("/");
  if (!first) return path;

  const internalFirst = TOP_LEVEL_REVERSE[first];
  if (!internalFirst) return path;

  const nestedMap = NESTED_REVERSE[first];
  const internalSecond = second && nestedMap ? (nestedMap[second] ?? second) : second;

  return "/" + [internalFirst, internalSecond, ...rest].filter(Boolean).join("/");
}

/** Ingilizce adreslerin tamami (middleware'in hangi yollari cevirecegini bilmesi icin) */
export const ENGLISH_TOP_SEGMENTS = Object.values(TOP_LEVEL);
