import type { Product, ProductOptions, ProductVariant } from "../types";
import { machineContent } from "./machine-content.seed";

const now = "2026-09-16T08:00:00+03:00";

/**
 * Tum urunlerde kullanilan Zenweld urun fotografi.
 *
 * Dosya her iki uygulamanin public/images/products/ klasorunde bulunur.
 * Farkli urunlere farkli fotograf vermek icin: Yonetim Paneli > Urunler >
 * Duzenle > Gorseller sekmesinden URL girin veya dosya yukleyin.
 */
/* 748x1064 PNG (519 KB) yerine 800 px webp (27 KB). Orijinal PNG dosyasi
   duruyor; webp desteklemeyen tarayici ProductImage uzerinden ona duser.
   Yeni gorsel eklendiginde: node scripts/optimize-images.mjs */
const PRODUCT_PHOTO = "/images/products/zenweld-urun.webp";

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const products: Product[] = [];

/* ------------------------------------------------------------------ */
/* EKIPMANLAR — GERCEK URUNLER (sahibinin listesi, 2026-10-27)          */
/*                                                                     */
/* Sahibinden gelen: ad, urun kodu (SAP kodu), alt grup, fiyat, garanti */
/* ve secenekler. Ad ve link KARARLAR K-71'e gore yazildi.              */
/*                                                                     */
/* !! ORNEK — gercegiyle degistirilecek: kisa ve uzun aciklama, teknik  */
/* ozellikler, kutu icerigi, one cikan ozellikler, kullanim kilavuzu    */
/* linki ve fotograf. Force serisi 9 urunun icerigi sahibinin ikinci     */
/* listesinden gelir (machine-content.seed.ts); 5'inin kodu GECICIDIR   */
/* (KARARLAR K-75). Fiyatlar TEMSILIDIR (999.999 TL + KDV); secenekler   */
/* arasinda fiyat farki yok. Ara paket uzunluklari (5 m, 10 m)          */
/* temsilidir. Kaynak yontemi ve elektrik bilgisi bilerek girilmedi     */
/* (Ürün Seçici en son kurulacak, KARARLAR K-69).                       */
/* Ayrinti: docs/YAPILACAKLAR.md › Ürün içeriği; kodlar: KARARLAR K-72. */
/*                                                                     */
/* Lazer Kaynak'taki Jasic urunleri henuz eklenmedi (KARARLAR K-74).    */
/* ------------------------------------------------------------------ */

/** Temsili fiyat (KDV haric); gercek fiyatlar gelince panelden degistirilir. */
const REPRESENTATIVE_PRICE = 999_999;

const TIG_TORCH = ["4-m", "8-m"];
const MIG_TORCH = ["3-m", "4-m", "5-m"];
/** TEMSILI: gercek ara paket uzunluklari gelince duzeltilecek. */
const INTERCONNECT = ["5-m", "10-m"];

/** "4-m" -> "4M" (kodun sonuna eklenen kisim) */
const codePart = (valueId: string) => valueId.replace(/-m$/, "M");

type MachineOptions =
  /** Tek SAP kalemi; secenek yalnizca torc uzunlugu. Sayfa kodu = SAP kodu. */
  | { torch: string[] }
  /** Sogutmaya gore iki SAP kalemi; yaninda torc (ve ara paket) uzunlugu. */
  | { cooling: { hava: string; su: string }; torch: string[]; interconnect?: string[] }
  /** Her guc ayri SAP kalemi. */
  | { power: Record<string, string> };

interface MachineSeed {
  slug: string;
  name: string;
  categorySlug: string;
  /** Seceneksiz ya da tek SAP kalemli urunde SAP kodu; birden cok SAP kalemlide bos (model kodu uretilir) */
  sap?: string;
  brand?: string;
  options?: MachineOptions;
  /** Ortak urun fotografi yerine kullanilacak fotograf */
  image?: string;
}

/** SAP kodu verilmemis urunun gecici kodu (KARARLAR K-75); SAP kodu gelince degistirilir. */
const tempCode = (model: string) => `ZW-GECICI-${model}`;

/** Sahibinin ikinci listesindeki yeni Force urunlerinin (gecici) fotografi. */
const FORCE_PHOTO = "/images/products/jasic-tig200.webp";

const MMA = "mma-ortulu-elektrod-kaynak-makineleri";
const TIG = "tig-argon-kaynak-makineleri";
const MIG = "mig-gazalti-kaynak-makineleri";
const MULTI = "cok-fonksiyonlu-kaynak-makineleri";
const PLASMA = "plazma-kesim-makineleri";
const LASER_WELD = "lazer-kaynak-makineleri";
const LASER_CLEAN = "lazer-temizleme";
const LASER_MARK = "lazer-markalama";

const machineSeeds: MachineSeed[] = [
  { slug: "ultimate-255-mma", name: "Ultimate 255 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000001" },
  { slug: "ultimate-405-cel-mma", name: "Ultimate 405 CEL MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000002" },
  { slug: "forcearc-200-mma", name: "ForceArc 200 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000072" },
  { slug: "forcearc-250-mma", name: "ForceArc 250 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: tempCode("FORCEARC250"), image: FORCE_PHOTO },
  { slug: "forcearc-280-mma", name: "ForceArc 280 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: tempCode("FORCEARC280"), image: FORCE_PHOTO },
  { slug: "forcearc-400-cel-mma", name: "ForceArc 400 CEL MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000076" },

  { slug: "ultimate-251-thp", name: "Ultimate 251 THP TIG Argon Kaynak Makinesi", categorySlug: TIG, sap: "ZW30100000010", options: { torch: TIG_TORCH } },
  { slug: "ultimate-405-thp", name: "Ultimate 405 THP TIG Argon Kaynak Makinesi", categorySlug: TIG, options: { cooling: { hava: "ZW30100000011", su: "ZW30100000012" }, torch: TIG_TORCH } },
  { slug: "ultimate-300-thp", name: "Ultimate 300 THP TIG Argon Kaynak Makinesi", categorySlug: TIG, options: { cooling: { hava: "ZW30100000013", su: "ZW30100000014" }, torch: TIG_TORCH } },
  { slug: "ultimate-320-thp-ipanel", name: "Ultimate 320 THP iPanel TIG Argon Kaynak Makinesi", categorySlug: TIG, options: { cooling: { hava: "ZW30100000015", su: "ZW30100000016" }, torch: TIG_TORCH } },
  { slug: "ultimate-205-ac-dc", name: "Ultimate 205 AC/DC TIG Argon Kaynak Makinesi", categorySlug: TIG, sap: "ZW30100000019", options: { torch: TIG_TORCH } },
  { slug: "ultimate-320-ac-dc", name: "Ultimate 320 AC/DC TIG Argon Kaynak Makinesi", categorySlug: TIG, options: { cooling: { hava: "ZW30100000020", su: "ZW30100000021" }, torch: TIG_TORCH } },
  { slug: "ultimate-400-ac-dc-ipanel", name: "Ultimate 400 AC/DC iPanel TIG Argon Kaynak Makinesi", categorySlug: TIG, options: { cooling: { hava: "ZW30100000022", su: "ZW30100000023" }, torch: TIG_TORCH } },
  { slug: "forcetig-200", name: "ForceTIG 200 TIG Argon Kaynak Makinesi", categorySlug: TIG, sap: "ZW30100000073" },

  { slug: "ultimate-250-mtc", name: "Ultimate 250 MTC MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, sap: "ZW30100000024", options: { torch: MIG_TORCH } },
  { slug: "ultimate-405-mts", name: "Ultimate 405 MTS MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, options: { cooling: { hava: "ZW30100000027", su: "ZW30100000028" }, torch: MIG_TORCH, interconnect: INTERCONNECT } },
  { slug: "ultimate-505-mts", name: "Ultimate 505 MTS MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, options: { cooling: { hava: "ZW30100000030", su: "ZW30100000029" }, torch: MIG_TORCH, interconnect: INTERCONNECT } },
  { slug: "ultimate-320-mtc-ipanel", name: "Ultimate 320 MTC iPanel MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, sap: "ZW30100000031", options: { torch: MIG_TORCH } },
  { slug: "ultimate-255-mtc", name: "Ultimate 255 MTC MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, sap: "ZW30100000033", options: { torch: MIG_TORCH } },
  { slug: "ultimate-355-mtc", name: "Ultimate 355 MTC MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, sap: "ZW30100000034", options: { torch: MIG_TORCH } },
  { slug: "evomig-405-p", name: "Evomig 405 P MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, options: { cooling: { hava: "ZW30100000065", su: "ZW30100000035" }, torch: MIG_TORCH, interconnect: INTERCONNECT } },
  { slug: "evomig-555-p", name: "Evomig 555 P MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, options: { cooling: { hava: "ZW30100000062", su: "ZW30100000038" }, torch: MIG_TORCH, interconnect: INTERCONNECT } },
  { slug: "evomig-255-p", name: "Evomig 255 P MIG Gazaltı Kaynak Makinesi", categorySlug: MIG, sap: "ZW30100000064", options: { torch: MIG_TORCH } },

  { slug: "ultimate-205-mte-pro", name: "Ultimate 205 MTE Pro Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: "ZW30100000032" },
  { slug: "evomig-205-p", name: "Evomig 205 P Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: "ZW30100000037" },
  // ForceMIG serisi sahibinin ikinci listesiyle Çok Fonksiyonlu'ya alindi (ForceMIG 200 MIG'deydi).
  { slug: "forcemig-125", name: "ForceMIG 125 Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG125"), image: FORCE_PHOTO },
  { slug: "forcemig-185-mp", name: "ForceMIG 185 MP Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG185MP"), image: FORCE_PHOTO },
  { slug: "forcemig-200", name: "ForceMIG 200 Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: "ZW30100000074" },
  { slug: "forcemig-205-dp", name: "ForceMIG 205 DP Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG205DP"), image: FORCE_PHOTO },

  { slug: "multicut-105-cnc", name: "Multicut 105 CNC Plazma Kesme Makinesi", categorySlug: PLASMA, sap: "ZW30100000042" },
  { slug: "multicut-85-cnc", name: "Multicut 85 CNC Plazma Kesme Makinesi", categorySlug: PLASMA, sap: "ZW30100000043" },
  { slug: "multicut-60-s", name: "Multicut 60 S Plazma Kesme Makinesi", categorySlug: PLASMA, sap: "ZW30100000044" },
  { slug: "forcecut-45", name: "ForceCut 45 Plazma Kesme Makinesi", categorySlug: PLASMA, sap: "ZW30100000075" },

  { slug: "y300-qcw", name: "Y300 QCW Lazer Kaynak Makinesi", categorySlug: LASER_WELD, options: { power: { "600-w": "ZW40100000113", "1000-w": "ZW40100000114" } } },

  { slug: "jasic-ls-20000f-lazer-temizleme", name: "Jasic LS-20000F Lazer Temizleme Makinesi", categorySlug: LASER_CLEAN, sap: "ZW30100000059", brand: "Jasic" },
  { slug: "jasic-ls-30000d-lazer-temizleme", name: "Jasic LS-30000D Lazer Temizleme Makinesi", categorySlug: LASER_CLEAN, sap: "ZW30100000071", brand: "Jasic" },
  { slug: "jasic-300-w-puls-lazer-temizleme", name: "Jasic 300 W Portatif Puls Lazer Temizleme Makinesi", categorySlug: LASER_CLEAN, sap: "ZW40100000106", brand: "Jasic" },

  { slug: "fc-50", name: "FC-50 Lazer Markalama Makinesi", categorySlug: LASER_MARK, sap: "ZW30100000056" },
  { slug: "uv-5", name: "UV-5 Lazer Markalama Makinesi", categorySlug: LASER_MARK, sap: "ZW30100000057" },
  { slug: "jasic-30-w-fiber-lazer-markalama", name: "Jasic 30 W Portatif Fiber Lazer Markalama Makinesi", categorySlug: LASER_MARK, sap: "ZW30100000066", brand: "Jasic" },
];

/** Varyant: kimligi degerlerden (secenek sirasiyla), kodu SAP kodu + secenek. */
function variant(optionIds: string[], valueIds: string[], sku: string): ProductVariant {
  return {
    id: valueIds.join("_"),
    values: Object.fromEntries(optionIds.map((o, i) => [o, valueIds[i]])),
    sku,
    priceDeltaExVat: 0,
  };
}

/**
 * Seceneklerin kodlari (KARARLAR K-72): SAP kodunun sonuna torc uzunlugu
 * ("-4M") ve ara paket uzunlugu ("-AP10M") eklenir. Tepe guc seceneklerinin
 * kodlari SAP kodlaridir.
 */
function machineOptions(seed: MachineSeed): ProductOptions | undefined {
  const o = seed.options;
  if (!o) return undefined;
  if ("power" in o) {
    return { optionIds: ["tepe-guc"], variants: Object.entries(o.power).map(([w, sap]) => variant(["tepe-guc"], [w], sap)) };
  }
  if ("cooling" in o) {
    const optionIds = ["sogutma", "torc-uzunlugu", ...(o.interconnect ? ["ara-paket-uzunlugu"] : [])];
    const variants = (["hava", "su"] as const).flatMap((c) =>
      o.torch.flatMap((t) =>
        o.interconnect
          ? o.interconnect.map((a) => variant(optionIds, [c, t, a], `${o.cooling[c]}-${codePart(t)}-AP${codePart(a)}`))
          : [variant(optionIds, [c, t], `${o.cooling[c]}-${codePart(t)}`)],
      ),
    );
    return { optionIds, variants };
  }
  return { optionIds: ["torc-uzunlugu"], variants: o.torch.map((t) => variant(["torc-uzunlugu"], [t], `${seed.sap}-${codePart(t)}`)) };
}

const TYPE_BY_CATEGORY: Record<string, string> = {
  [MMA]: "MMA (örtülü elektrod) kaynak makinesi",
  [TIG]: "TIG (argon) kaynak makinesi",
  [MIG]: "MIG/MAG (gazaltı) kaynak makinesi",
  [MULTI]: "çok fonksiyonlu kaynak makinesi",
  [PLASMA]: "plazma kesme makinesi",
  [LASER_WELD]: "lazer kaynak makinesi",
  [LASER_CLEAN]: "lazer temizleme makinesi",
  [LASER_MARK]: "lazer markalama makinesi",
};

/** Seceneklerin okunur hali: kisa aciklama ve one cikan ozellikler (ORNEK). */
function optionPhrases(o: MachineOptions | undefined): string[] {
  if (!o) return [];
  // ["3-m", "4-m", "5-m"] -> "3, 4 ve 5 m"
  const m = (list: string[]) => {
    const n = list.map((x) => x.replace("-m", ""));
    return `${n.length > 1 ? `${n.slice(0, -1).join(", ")} ve ${n[n.length - 1]}` : n[0]} m`;
  };
  if ("power" in o) return ["600 W ve 1000 W tepe güç seçenekleri"];
  return [
    ...("cooling" in o ? ["Hava ve su soğutma seçenekleri"] : []),
    `${m(o.torch)} torç seçenekleri`,
    ...("cooling" in o && o.interconnect ? [`${m(o.interconnect)} ara paket seçenekleri`] : []),
  ];
}

machineSeeds.forEach((seed) => {
  const brand = seed.brand ?? "Zenweld";
  const options = machineOptions(seed);
  // Birden cok SAP kalemli urunun sayfa kodu SAP'ta yoktur (KARARLAR K-72).
  const sku = seed.sap ?? `ZW-${seed.slug.toUpperCase()}`;
  const type = TYPE_BY_CATEGORY[seed.categorySlug];
  const phrases = optionPhrases(seed.options);
  // Sahibinin gonderdigi icerik varsa o; yoksa ORNEK icerik (gercekleri gelince degistirilecek).
  const content = machineContent[seed.slug];
  const short = content?.short ?? `${brand} ${type}.${phrases.length ? ` ${phrases.join("; ")}.` : ""}`;
  products.push({
    id: `p-${seed.slug}`,
    slug: seed.slug,
    sku,
    name: seed.name,
    ...(seed.brand ? { brand: seed.brand } : {}),
    section: "ekipmanlar",
    categorySlug: seed.categorySlug,
    processes: [],
    shortDescription: short,
    description: content?.description ?? `${short} ${lorem}`,
    priceExVat: REPRESENTATIVE_PRICE,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: seed.image ?? PRODUCT_PHOTO, alt: seed.name }],
    specs: [
      { label: "Marka", value: brand },
      { label: "Ürün Kodu", value: sku },
      ...(content?.specs ?? [{ label: "Ürün Türü", value: type.charAt(0).toLocaleUpperCase("tr") + type.slice(1) }]),
    ],
    inTheBox: content?.inTheBox ?? [
      "1 x Ana ünite",
      ...(seed.options && !("power" in seed.options) ? ["1 x Torç (seçilen uzunlukta)"] : []),
      "1 x Kullanım kılavuzu",
    ],
    highlights: content?.highlights ?? [...phrases, "12 ay garanti", "Yetkili bayi ve servis ağı"].slice(0, 3),
    ...(options ? { options } : {}),
    quotable: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 12,
    createdAt: now,
    updatedAt: now,
    active: true,
  });
});

/* ---------------------------------------------------------------- */
/* Aksesuar / guvenlik / dolgu metali urunleri (placeholder icerik)  */
/* ---------------------------------------------------------------- */

interface AccessorySeed {
  slug: string;
  sku: string;
  name: string;
  section: Product["section"];
  categorySlug: string;
  price: number;
  short: string;
  /** Menu kartinda gorunen 1-2 satislik ozellik */
  highlights?: string[];
}

const accessorySeeds: AccessorySeed[] = [
  { slug: "zenmask-auto-9000", sku: "ZW-MASK9000", name: "ZenMask Auto 9000", section: "guvenlik", categorySlug: "otomatik-kararan-bas-maskeleri", price: 3450, short: "Gerçek renk teknolojili otomatik kararan kaynak maskesi, 4 sensörlü.", highlights: ["Gerçek renk (True Color) görüş", "4 sensörlü, 1/25000 sn tepki", "DIN 5-13 kademesiz ayar"] },
  { slug: "zenmask-basic-500", sku: "ZW-MASK500", name: "ZenMask Basic 500", section: "guvenlik", categorySlug: "otomatik-kararan-bas-maskeleri", price: 1290, short: "Giriş seviyesi otomatik kararan kaynak maskesi, 2 sensörlü.", highlights: ["Giriş seviyesi, hafif kask", "2 sensörlü otomatik kararma", "Değiştirilebilir ön cam"] },
  { slug: "kaynak-eldiveni-pro", sku: "ZW-GLV-PRO", name: "Pro Kaynak Eldiveni", section: "guvenlik", categorySlug: "kaynak-eldivenleri", price: 480, short: "Sığır derisi, kevlar dikişli, ısıya dayanıklı kaynak eldiveni.", highlights: ["Sığır derisi, kevlar dikiş", "Isıya ve kıvılcıma dayanıklı", "Astarlı, uzun manşetli"] },
  { slug: "kaynak-onlugu-deri", sku: "ZW-APR-01", name: "Deri Kaynak Önlüğü", section: "guvenlik", categorySlug: "kaynak-onlukleri", price: 890, short: "Kıvılcıma ve ısıya dayanıklı tam boy deri kaynak önlüğü.", highlights: ["Tam boy deri koruma", "Ayarlanabilir omuz askısı", "Kıvılcım ve cüruf geçirmez"] },
  { slug: "mig-torcu-mb25", sku: "ZW-TRC-MB25", name: "MB-25 MIG Torcu", section: "aksesuarlar", categorySlug: "mig-torclari", price: 1650, short: "250A kapasiteli, Euro bağlantılı MIG kaynak torcu. 3, 4 ve 5 metre seçenekleriyle.", highlights: ["250 A / %60 devrede kalma", "Euro bağlantılı hortum", "Yaygın sarf malzeme bulunabilirliği"] },
  { slug: "mig-torcu-mb36", sku: "ZW-TRC-MB36", name: "MB-36 MIG Torcu", section: "aksesuarlar", categorySlug: "mig-torclari", price: 2050, short: "350A kapasiteli, ağır hizmet MIG kaynak torcu. 3 ve 4 metre seçenekleriyle.", highlights: ["350 A ağır hizmet kapasitesi", "3 m ve 4 m hortum seçenekleri", "Kalın kesitte sürekli kaynak"] },
  { slug: "tig-torcu-wp26", sku: "ZW-TRC-WP26", name: "WP-26 TIG Torcu 4m", section: "aksesuarlar", categorySlug: "tig-torclari", price: 1980, short: "Hava soğutmalı, 200A kapasiteli 4 metre TIG kaynak torcu.", highlights: ["200 A hava soğutmalı", "4 m esnek hortum paketi", "Standart WP-26 sarf uyumu"] },
  { slug: "gaz-nozulu-seti", sku: "ZW-NZL-SET", name: "Gaz Nozulu Seti", section: "aksesuarlar", categorySlug: "mig-torc-sarf-malzemeleri", price: 420, short: "MB-25 uyumlu gaz nozulu seti. 10'lu ve 20'li paket seçenekleriyle.", highlights: ["MB-25 torçlarla uyumlu", "10'lu ve 20'li paket seçenekleri", "Bakır gövde, uzun ömür"] },
  { slug: "kontak-meme-seti", sku: "ZW-TIP-SET", name: "Kontak Meme Seti M6 (20'li)", section: "aksesuarlar", categorySlug: "mig-torc-sarf-malzemeleri", price: 380, short: "0.8 / 1.0 / 1.2 mm ölçülerinde 20 adetlik kontak meme seti.", highlights: ["0.8 / 1.0 / 1.2 mm karışık", "M6 diş, MB-25 uyumlu", "20 adetlik paket"] },
  { slug: "gazalti-teli-sg2-08", sku: "ZW-WIRE-SG208", name: "SG2 Gazaltı Teli 0.8 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "karbonlu-celik-mig-telleri", price: 1450, short: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", highlights: ["Bakır kaplı SG2 kalite", "0.8 mm, 15 kg makara", "Düşük sıçrantı, düzgün dikiş"] },
  { slug: "gazalti-teli-sg2-10", sku: "ZW-WIRE-SG210", name: "SG2 Gazaltı Teli 1.0 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "karbonlu-celik-mig-telleri", price: 1420, short: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", highlights: ["Bakır kaplı SG2 kalite", "1.0 mm, 15 kg makara", "Kalın kesitte yüksek verim"] },
  { slug: "tig-cubugu-308l", sku: "ZW-ROD-308L", name: "308L Paslanmaz TIG Çubuğu 2.4 mm", section: "dolgu-metalleri", categorySlug: "paslanmaz-celik-tig-telleri", price: 2250, short: "304/308 paslanmaz çelik kaynağı için 5 kg'lık TIG çubuğu paketi.", highlights: ["304 / 308 paslanmaz için", "2.4 mm, 5 kg paket", "Korozyona dayanıklı dikiş"] },
];

/* ------------------------------------------------------------------ */
/* DEMO AKSESUAR KALEMLERI — !! DOGRULANMALI !!                        */
/*                                                                     */
/* Mega menudeki 3x3 urun izgarasini ve "Tumunu Gor (N)" davranisini   */
/* test edebilmek icin eklenen ornek kalemlerdir. Model tipleri         */
/* sektorde yaygin standartlardir (MB-15/24/25/36, WP-17/26 vb.);       */
/* fiyatlar ve aciklamalar temsilidir. Zenweld'in gercek urun           */
/* listesiyle degistirilmeli veya silinmelidir.                        */
/*                                                                     */
/* Kategori dagilimi (menu testi icin):                                 */
/*   MIG > MIG Torclari        14 urun  -> "Tumunu Gor (14)" cikar      */
/*   MIG > Sarf Malzemeleri    12 urun  -> "Tumunu Gor (12)" cikar      */
/*   MIG > Yedek Parca          5 urun  -> ikinci satir yarim           */
/* ------------------------------------------------------------------ */

type Demo = [slug: string, sku: string, name: string, cat: string, price: number,
  short: string, a: string, b: string, c: string];

const demoAccessories: Demo[] = [
  /* --- MIG Aksesuarları > MIG Torçları --- */
  ["mig-torcu-mb15", "ZW-TRC-MB15", "MB-15 MIG Torcu 3m", "mig-torclari", 980,
    "180A kapasiteli, hafif gövdeli 3 metre MIG torcu.",
    "İnce sacta kolay kullanım", "Hafif gövde, 180 A", "Değiştirilebilir kısa boyun"],
  ["mig-torcu-mb24", "ZW-TRC-MB24", "MB-24 MIG Torcu 3m", "mig-torclari", 1320,
    "250A kapasiteli, Euro bağlantılı 3 metre MIG torcu.",
    "Euro bağlantı standardı", "250 A / %60 devrede kalma", "Yaygın sarf bulunabilirliği"],
  ["mig-torcu-mb38", "ZW-TRC-MB38", "MB-38 MIG Torcu 4m", "mig-torclari", 2680,
    "400A kapasiteli, endüstriyel kullanım için 4 metre MIG torcu.",
    "400 A endüstriyel kapasite", "Güçlendirilmiş hortum paketi", "Uzun ömürlü kontak meme yuvası"],
  ["mig-torcu-mb401-su", "ZW-TRC-MB401W", "MB-401 Su Soğutmalı MIG Torcu 3m", "mig-torclari", 4450,
    "400A kapasiteli, su soğutmalı 3 metre MIG torcu.",
    "Su soğutma ile uzun süreli kaynak", "Daha düşük torç sıcaklığı", "Hızlı geçmeli su bağlantısı"],
  ["mig-torcu-mb501-su", "ZW-TRC-MB501W", "MB-501 Su Soğutmalı MIG Torcu 4m", "mig-torclari", 5750,
    "500A kapasiteli, su soğutmalı 4 metre MIG torcu.",
    "500 A sürekli kaynak kapasitesi", "Robot ve otomasyona uygun", "Yüksek akımda düşük yıpranma"],
  ["mig-spool-gun-200", "ZW-TRC-SG200", "SG-200 Spool Gun 4m", "mig-torclari", 6250,
    "Alüminyum kaynağı için makaralı besleme üniteli 4 metre torç.",
    "Alüminyum telde besleme sorunu yok", "Entegre 1 kg makara", "Torç üzerinden hız ayarı"],
  ["mig-push-pull-torc", "ZW-TRC-PP8", "Push-Pull Alüminyum Torcu 8m", "mig-torclari", 12900,
    "Uzun mesafede alüminyum kaynağı için 8 metre push-pull torç.",
    "8 m uzaklıkta stabil tel akışı", "Alüminyum ve paslanmaz uyumlu", "Dijital hız göstergesi"],
  ["mig-torcu-kisa-boyun", "ZW-TRC-KB25", "MB-25 Kısa Boyun Torç 2m", "mig-torclari", 1480,
    "Dar alanlarda çalışma için kısa boyunlu 2 metre MIG torcu.",
    "Dar alanda rahat erişim", "Standart MB-25 sarf uyumu", "Hafif, tek elle kullanım"],

  /* --- MIG Aksesuarları > MIG Torç Sarf Malzemeleri --- */
  ["kontak-meme-seti-m8", "ZW-TIP-M8", "Kontak Meme Seti M8 (20'li)", "mig-torc-sarf-malzemeleri", 460,
    "MB-36 uyumlu, 1.0 / 1.2 mm ölçülerinde 20 adetlik kontak meme seti.",
    "MB-36 / MB-38 uyumlu", "20 adetlik ekonomik paket", "Bakır alaşım, uzun ömür"],
  ["gaz-dagitici-seti", "ZW-DIF-SET", "Gaz Dağıtıcı (Difüzör) Seti (5'li)", "mig-torc-sarf-malzemeleri", 390,
    "MB-25 uyumlu 5 adetlik gaz dağıtıcı seti.",
    "Homojen gaz dağılımı", "Isıya dayanıklı pirinç gövde", "Kolay sökülüp takılır"],
  ["tel-kilavuzu-3m", "ZW-LNR-3", "Tel Kılavuzu (Liner) 3m 0.8-1.0 mm", "mig-torc-sarf-malzemeleri", 320,
    "3 metre torçlar için çelik spiral tel kılavuzu.",
    "Düzgün tel akışı", "0.8 – 1.0 mm tel uyumu", "Çelik spiral yapı"],
  ["tel-kilavuzu-4m", "ZW-LNR-4", "Tel Kılavuzu (Liner) 4m 1.0-1.2 mm", "mig-torc-sarf-malzemeleri", 380,
    "4 metre torçlar için çelik spiral tel kılavuzu.",
    "Uzun torçta tel sıkışmasını önler", "1.0 – 1.2 mm tel uyumu", "Kesilerek boy ayarlanabilir"],
  ["makara-seti-v-kanal", "ZW-ROL-V", "Çelik Makara Seti V Kanal 0.8/1.0", "mig-torc-sarf-malzemeleri", 540,
    "Çelik tel besleme için V kanallı makara seti.",
    "Sertleştirilmiş çelik", "Çift ölçü: 0.8 / 1.0 mm", "Standart besleme üniteleriyle uyumlu"],
  ["anti-spatter-sprey", "ZW-AS-400", "Anti-Spatter Sprey 400 ml", "mig-torc-sarf-malzemeleri", 210,
    "Nozul ve iş parçasında sıçrantı yapışmasını önleyen sprey.",
    "Nozul ömrünü uzatır", "Silikonsuz formül", "İş parçasına boya öncesi uyumlu"],
  ["nozul-temizleme-seti", "ZW-CLN-SET", "Nozul Temizleme Seti", "mig-torc-sarf-malzemeleri", 290,
    "Nozul ve meme temizliği için eğe ve raybalardan oluşan set.",
    "Sarf ömrünü uzatır", "Çantalı 8 parça", "Taşınabilir çantalı"],

  /* --- MIG Aksesuarları > MIG Torç Yedek Parçaları --- */
  ["mb25-torc-boynu", "ZW-SPR-N25", "MB-25 Torç Boynu (Swan Neck)", "mig-torc-yedek-parcalari", 890,
    "MB-25 torçlar için yedek eğik boyun.",
    "Orijinal geometri", "Tek parça değişim", "Sızdırmaz o-ring dahil"],
  ["mb36-torc-boynu", "ZW-SPR-N36", "MB-36 Torç Boynu (Swan Neck)", "mig-torc-yedek-parcalari", 1150,
    "MB-36 torçlar için yedek eğik boyun.",
    "350 A kapasite", "Güçlendirilmiş bakır iç yapı", "Yüksek akıma dayanıklı"],
  ["torc-tetik-anahtari", "ZW-SPR-SW", "Torç Tetik Anahtarı", "mig-torc-yedek-parcalari", 240,
    "MB serisi torçlar için yedek tetik mikro anahtarı.",
    "Tüm MB serisi uyumlu", "Kolay montaj", "Kablolu hazır set"],
  ["euro-baglanti-adaptoru", "ZW-SPR-EU", "Euro Bağlantı Adaptörü", "mig-torc-yedek-parcalari", 560,
    "Torç ile makine arasında standart Euro bağlantı adaptörü.",
    "Pirinç gövde", "Gaz sızdırmaz conta", "Tüm MB serisiyle uyumlu"],
  ["torc-govde-kulp-seti", "ZW-SPR-HG", "MB-25 Torç Gövde ve Kulp Seti", "mig-torc-yedek-parcalari", 720,
    "MB-25 torçlar için yedek gövde ve kulp seti.",
    "Isıya dayanıklı polimer", "Vidalı montaj", "Kaymaz yüzey"],

  /* --- MIG Aksesuarları > MIG Torçları (MAG uygulamaları) --- */
  ["mag-torcu-mb25", "ZW-TRC-MG25", "MB-25 MAG Torcu 3m", "mig-torclari", 1650,
    "CO2 ve karışım gaz uygulamaları için 250A 3 metre MAG torcu.",
    "CO2 ve karışım gaz uyumu", "250 A kapasite", "3 m Euro bağlantı"],
  ["mag-torcu-mb36", "ZW-TRC-MG36", "MB-36 MAG Torcu 4m", "mig-torclari", 2350,
    "Ağır hizmet MAG uygulamaları için 350A 4 metre torç.",
    "Kalın kesitte yüksek verim", "350 A ağır hizmet", "Güçlendirilmiş hortum"],
  ["mag-torcu-mb501-su", "ZW-TRC-MG501W", "MB-501 Su Soğutmalı MAG Torcu 4m", "mig-torclari", 5950,
    "Yoğun üretim için 500A su soğutmalı 4 metre MAG torcu.",
    "Sürekli üretime uygun", "Su soğutmalı gövde", "Hızlı geçmeli su bağlantısı"],
  ["mag-torcu-kisa-boyun", "ZW-TRC-MGKB", "MAG Kısa Boyun Torç 3m", "mig-torclari", 1720,
    "Dar alanlarda MAG kaynağı için kısa boyunlu 3 metre torç.",
    "Dar alanda erişim", "Standart sarf uyumu", "Hafif gövde"],

  /* --- MIG Aksesuarları > MIG Torç Sarf Malzemeleri (MAG) --- */
  ["mag-gaz-nozulu-seti", "ZW-NZL-MG", "CO2 Gaz Nozulu Seti (10'lu)", "mig-torc-sarf-malzemeleri", 440,
    "MAG uygulamaları için 10 adetlik konik gaz nozulu seti.",
    "Sıçrantıya dayanıklı kaplama", "10 adetlik paket", "Konik ağız, dar dikişe uygun"],
  ["mag-kontak-meme-cucrzr", "ZW-TIP-CZ", "Kontak Meme Seti M6 CuCrZr (20'li)", "mig-torc-sarf-malzemeleri", 520,
    "Yüksek akımda uzun ömürlü CuCrZr alaşımlı kontak meme seti.",
    "Yüksek akımda uzun ömür", "CuCrZr alaşım", "M6 diş standardı"],
  ["mag-difuzor-seti", "ZW-DIF-MG", "MAG Difüzör Seti (5'li)", "mig-torc-sarf-malzemeleri", 410,
    "MAG torçları için 5 adetlik gaz dağıtıcı seti.",
    "Dengeli gaz akışı", "Isıya dayanıklı", "Kolay sökülüp takılır"],

  /* --- TIG Aksesuarları > Tungsten Elektrodlar + TIG Torç Sarf Malzemeleri --- */
  ["tungsten-wl15-24", "ZW-TNG-WL24", "WL-15 Tungsten Elektrot 2.4 mm (10'lu)", "tungsten-elektrodlar", 890,
    "Altın renk kodlu, lantanlı tungsten elektrot, 10 adet.",
    "AC ve DC'de kullanılabilir", "Kolay ark tutuşturma", "Radyoaktif değil (lantanlı)"],
  ["tungsten-wc20-16", "ZW-TNG-WC16", "WC-20 Tungsten Elektrot 1.6 mm (10'lu)", "tungsten-elektrodlar", 780,
    "Gri renk kodlu, seryumlu tungsten elektrot, 10 adet.",
    "Düşük akımda kararlı ark", "İnce kesit için ideal", "Uzun elektrot ömrü"],
  ["seramik-nozul-seti-wp26", "ZW-CUP-26", "WP-26 Seramik Nozul Seti (10'lu)", "tig-torc-sarf-malzemeleri", 460,
    "WP-26 torçlar için 4 – 8 numara seramik nozul seti.",
    "4 – 8 numara karışık", "Yüksek ısı dayanımı", "Isıl şoka dayanıklı"],
  ["pens-seti-wp26", "ZW-COL-26", "WP-26 Pens (Collet) Seti", "tig-torc-sarf-malzemeleri", 380,
    "1.6 / 2.4 / 3.2 mm ölçülerinde pens ve pens gövdesi seti.",
    "Üç ölçü tek sette", "Bakır alaşım", "Pens ve gövde bir arada"],
  ["gaz-lensi-seti-wp26", "ZW-GLN-26", "WP-26 Gaz Lensi Seti", "tig-torc-sarf-malzemeleri", 640,
    "Daha geniş ve düzgün gaz örtüsü için gaz lensi seti.",
    "Paslanmazda oksitlenmeyi azaltır", "Daha geniş gaz örtüsü", "Uzun uzatma için uygun"],
  ["arka-kapak-seti-wp26", "ZW-CAP-26", "WP-26 Arka Kapak Seti (3'lü)", "tig-torc-sarf-malzemeleri", 260,
    "Kısa, orta ve uzun boy arka kapaklardan oluşan set.",
    "Üç boy bir arada", "Sızdırmaz o-ring", "Dar alanda kısa kapak"],

  /* --- TIG Aksesuarları > TIG Torç Yedek Parçaları --- */
  ["wp26-torc-kafasi", "ZW-SPR-H26", "WP-26 Torç Kafası", "tig-torc-yedek-parcalari", 980,
    "WP-26 TIG torçlar için yedek torç kafası.",
    "200 A hava soğutmalı", "Orijinal ölçü", "Orijinal ölçülerde"],
  ["wp26-hortum-seti", "ZW-SPR-C26", "WP-26 Hortum Seti 4m", "tig-torc-yedek-parcalari", 1240,
    "WP-26 torçlar için 4 metre yedek kablo ve hortum paketi.",
    "Esnek kauçuk hortum", "4 m tam takım", "Gaz ve akım tek pakette"],
  ["wp17-torc-govdesi", "ZW-SPR-B17", "WP-17 Torç Gövdesi", "tig-torc-yedek-parcalari", 760,
    "WP-17 TIG torçlar için yedek gövde ve kulp.",
    "150 A hava soğutmalı", "Isıya dayanıklı kulp", "Kaymaz kulp"],
];

demoAccessories.forEach(([slug, sku, name, cat, price, short, a, b, c]) => {
  accessorySeeds.push({
    slug, sku, name,
    section: "aksesuarlar",
    categorySlug: cat,
    price,
    short,
    highlights: [a, b, c],
  });
});

accessorySeeds.forEach((a, i) => {
  products.push({
    id: `p-${a.slug}`,
    slug: a.slug,
    sku: a.sku,
    name: a.name,
    section: a.section,
    categorySlug: a.categorySlug,
    processes: [],
    shortDescription: a.short,
    description: lorem,
    priceExVat: a.price,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: a.name }],
    specs: [
      { label: "Marka", value: "Zenweld" },
      { label: "Ürün Kodu", value: a.sku },
      { label: "Menşei", value: "Türkiye" },
    ],
    inTheBox: ["1 x " + a.name],
    highlights: a.highlights ?? [],
    quotable: true,
    isNew: i < 2,
    warrantyMonths: 12,
    createdAt: now,
    updatedAt: now,
    active: true,
  });
});

/* ------------------------------------------------------------------ */
/* Kampanyalar — !! DEMO VERISI, DOGRULANMALI !!                       */
/*                                                                     */
/* Anasayfadaki "Hot Sale" bolumunu beslemek icin kullanilir.          */
/* Kampanyalar yonetim panelinde Urunler > urun > "Kampanya /         */
/* Indirim" bolumunden duzenlenir veya kaldirilir.                     */
/* ------------------------------------------------------------------ */

/**
 * Kampanyali urunler: slug -> indirim orani (%)
 * Tarihsiz (suresiz) ornek kampanyalar; panelden tarih eklenebilir.
 */
const HOT_SALE: Record<string, number> = {
  "ultimate-250-mtc": 12,
  "evomig-205-p": 15,
  "forcearc-200-mma": 20,
  "multicut-85-cnc": 10,
  "mig-torcu-mb25": 18,
  "zenmask-auto-9000": 25,
  "gazalti-teli-sg2-08": 10,
};

/**
 * Yeni gelenler (anasayfadaki "Yeni Gelenler" seridi).
 * Serit ekrani dolduracak kadar urun olsun diye 8 urun; bazilari ayni
 * zamanda kampanyali, kartta iki etiket birlikte gorunur. Panelde
 * Urunler > urun > "Yeni" kutusundan degistirilir.
 */
const NEW_ARRIVALS = new Set([
  "evomig-205-p",
  "ultimate-205-mte-pro",
  "ultimate-251-thp",
  "ultimate-255-mma",
  "multicut-85-cnc",
  "zenmask-auto-9000",
  "zenmask-basic-500",
  "tig-torcu-wp26",
]);

products.forEach((p) => {
  if (NEW_ARRIVALS.has(p.slug)) p.isNew = true;
  const percent = HOT_SALE[p.slug];
  if (percent) {
    // Urunde NORMAL fiyat saklanir, indirim gosterimde uygulanir.
    // Aksesuar fiyatlari musterinin odedigi (indirimli) tutarlar olarak
    // yazilmisti; ekranda ayni tutarlar gorunsun diye normal fiyat
    // bunlardan geri hesaplanir. Ekipmanlarin temsili fiyati normal
    // fiyattir, degismez.
    if (p.section !== "ekipmanlar") p.priceExVat = Math.round(p.priceExVat / (1 - percent / 100) / 10) * 10;
    p.discount = { percent };
  }
});

/* ------------------------------------------------------------------ */
/* Secenekli urunler (varyantlar)                                      */
/*                                                                     */
/* Ornek: MB-25 (3 / 4 / 5 m) ve MB-36 (3 / 4 m) MIG torclari, Gaz      */
/* Nozulu Seti (10'lu / 20'li). Secenek adi ve degerleri ortak tanimdan */
/* gelir (options.seed.ts); "Hortum Uzunluğu: 4 m" gibi teknik satir    */
/* secimden kendiliginden olusur. Bayi ve satici stogu varyant bazli    */
/* tutulur (bkz. stock.seed.ts).                                        */
/*                                                                     */
/* "MB-25 MIG Torcu 4m" ve "MB-36 MIG Torcu 3m" onceden ayri urundu;    */
/* eski linkleri (previousSlugs) ilgili varyantla acilir.               */
/* ------------------------------------------------------------------ */

/** Tek secenekli urunun varyantlari: kimligi ve kombinasyonu degerin kimligidir. */
const singleOption = (
  optionId: string,
  rows: (Omit<ProductVariant, "id" | "values"> & { valueId: string })[],
): ProductOptions => ({
  optionIds: [optionId],
  variants: rows.map(({ valueId, ...rest }) => ({ id: valueId, values: { [optionId]: valueId }, ...rest })),
});

const PRODUCT_OPTIONS: Record<string, ProductOptions> = {
  "mig-torcu-mb25": singleOption("hortum-uzunlugu", [
    { valueId: "3-m", sku: "ZW-TRC-MB25-3", priceDeltaExVat: 0, specOverrides: [{ label: "Ağırlık", value: "1,9 kg" }] },
    { valueId: "4-m", sku: "ZW-TRC-MB25-4", priceDeltaExVat: 240, specOverrides: [{ label: "Ağırlık", value: "2,3 kg" }], previousSlugs: ["mig-torcu-mb25-4m"] },
    { valueId: "5-m", sku: "ZW-TRC-MB25-5", priceDeltaExVat: 460, specOverrides: [{ label: "Ağırlık", value: "2,7 kg" }] },
  ]),
  "mig-torcu-mb36": singleOption("hortum-uzunlugu", [
    { valueId: "3-m", sku: "ZW-TRC-MB36-3", priceDeltaExVat: 0, specOverrides: [{ label: "Ağırlık", value: "2,4 kg" }], previousSlugs: ["mig-torcu-mb36-3m"] },
    { valueId: "4-m", sku: "ZW-TRC-MB36-4", priceDeltaExVat: 300, specOverrides: [{ label: "Ağırlık", value: "2,9 kg" }] },
  ]),
  // 20'li paketin fiyati ornektir; panelden degistirilir.
  "gaz-nozulu-seti": singleOption("paket", [
    { valueId: "10-lu", sku: "ZW-NZL-SET-10", priceDeltaExVat: 0, inTheBox: ["10 x Gaz nozulu"] },
    { valueId: "20-li", sku: "ZW-NZL-SET-20", priceDeltaExVat: 380, inTheBox: ["20 x Gaz nozulu"] },
  ]),
};

products.forEach((p) => {
  const options = PRODUCT_OPTIONS[p.slug];
  if (options) p.options = options;
});

// Kategori icindeki sira: bu dosyadaki siraya gore 1, 2, 3 ... (panelden degisir).
const lastOrder = new Map<string, number>();
products.forEach((p) => {
  p.order = (lastOrder.get(p.categorySlug) ?? 0) + 1;
  lastOrder.set(p.categorySlug, p.order);
});
