import type { Product, ProductImage, ProductOptions, ProductVariant } from "../types";
import { categories } from "./categories.seed";
import { machineContent } from "./machine-content.seed";

const now = "2026-09-16T08:00:00+03:00";

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const products: Product[] = [];

/* ------------------------------------------------------------------ */
/* EKIPMANLAR — GERCEK URUNLER (sahibinin listesi, 2026-10-27)          */
/*                                                                     */
/* Sahibinden gelen: ad, urun kodu (SAP kodu), alt grup, fiyat, garanti */
/* ve secenekler. Ad ve link KARARLAR K-71'e gore yazildi.              */
/*                                                                     */
/* !! ORNEK — gercegiyle degistirilecek: kisa ve uzun aciklama, teknik  */
/* ozellikler, kutu icerigi, one cikan ozellikler ve kullanim kilavuzu  */
/* linki. Fotograflar: MACHINE_PHOTOS. Force serisi 9 urunun icerigi    */
/* sahibinin ikinci listesinden gelir (machine-content.seed.ts);        */
/* 5'inin kodu GECICIDIR                                                */
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
}

/** SAP kodu verilmemis urunun gecici kodu (KARARLAR K-75); SAP kodu gelince degistirilir. */
const tempCode = (model: string) => `ZW-GECICI-${model}`;

/**
 * GERCEK URUN FOTOGRAFLARI (sahibinden, KARARLAR K-77)
 *
 * public/images/products/ altinda; dosya adi urunun linkidir: <link>.webp,
 * soğutma secenekli urunde <link>-hava-sogutmali.webp ve
 * <link>-su-sogutmali.webp (yaninda orijinal .jpg/.png). Burada fotografi
 * gelmis olanlar yazilir. Fotografi olmayan urun ve soğutma hali, alt
 * kategorinin kart cizimini gosterir. Eksikler: docs/YAPILACAKLAR.md ›
 * Ürün fotoğrafları.
 */
const MACHINE_PHOTOS = new Set([
  "ultimate-405-cel-mma",
  "ultimate-251-thp",
  "ultimate-405-thp-su-sogutmali",
  "ultimate-300-thp-hava-sogutmali",
  "ultimate-300-thp-su-sogutmali",
  "ultimate-320-thp-ipanel-hava-sogutmali",
  "ultimate-320-thp-ipanel-su-sogutmali",
  "ultimate-205-ac-dc",
  "ultimate-320-ac-dc-hava-sogutmali",
  "ultimate-320-ac-dc-su-sogutmali",
  "ultimate-400-ac-dc-ipanel-hava-sogutmali",
  "ultimate-400-ac-dc-ipanel-su-sogutmali",
  "ultimate-405-mts-hava-sogutmali",
  "ultimate-405-mts-su-sogutmali",
  "ultimate-505-mts-su-sogutmali",
  "ultimate-250-mtc",
  "ultimate-320-mtc-ipanel",
  "ultimate-255-mtc",
  "ultimate-355-mtc",
  "evomig-405-p-su-sogutmali",
  "evomig-555-p-su-sogutmali",
  "ultimate-205-mte-pro",
  "evomig-205-p",
  "multicut-105-cnc",
  "multicut-85-cnc",
  "multicut-60-s",
]);

/**
 * Gercek fotografi gelene kadar Force serisi 9 urunun gecici ortak fotografi
 * (sahibinin istegi, KARARLAR K-77 eki). ForceArc 400 CEL bunlardan degil.
 */
const FORCE_TEMP_PHOTO = "/images/products/force-serisi-gecici.webp";
const FORCE_TEMP = new Set([
  "forcearc-200-mma",
  "forcearc-250-mma",
  "forcearc-280-mma",
  "forcemig-125",
  "forcemig-185-mp",
  "forcemig-200",
  "forcemig-205-dp",
  "forcetig-200",
  "forcecut-45",
]);

const COOLING_LABELS = { hava: "Hava Soğutmalı", su: "Su Soğutmalı" } as const;

/**
 * Urunun fotograflari. Soğutma secenekli urunde hava ve su hali ayri
 * fotograftir; varyant kendi halinin fotografini gosterir (byCooling).
 */
function machinePhotos(seed: MachineSeed): { images: ProductImage[]; byCooling?: Record<"hava" | "su", string> } {
  const drawing = categories.find((c) => c.slug === seed.categorySlug)?.image ?? "";
  const photo = (name: string) => (MACHINE_PHOTOS.has(name) ? `/images/products/${name}.webp` : undefined);
  if (!seed.options || !("cooling" in seed.options)) {
    const temp = FORCE_TEMP.has(seed.slug) ? FORCE_TEMP_PHOTO : undefined;
    return { images: [{ url: photo(seed.slug) ?? temp ?? drawing, alt: seed.name }] };
  }
  const halves = (["hava", "su"] as const).map((c) => ({ c, url: photo(`${seed.slug}-${c}-sogutmali`) }));
  if (halves.every((h) => !h.url)) return { images: [{ url: drawing, alt: seed.name }] };
  const byCooling = { hava: halves[0].url ?? drawing, su: halves[1].url ?? drawing };
  // Kart ilk fotografi gosterir; gercek fotograf cizimden once gelir.
  const ordered = [...halves].sort((a, b) => Number(!a.url) - Number(!b.url));
  return {
    images: ordered.map((h) => ({ url: byCooling[h.c], alt: h.url ? `${seed.name} — ${COOLING_LABELS[h.c]}` : seed.name })),
    byCooling,
  };
}

const MMA = "mma-ortulu-elektrod-kaynak-makineleri";
const TIG = "tig-argon-kaynak-makineleri";
const MIG = "mig-gazalti-kaynak-makineleri";
const MULTI = "cok-fonksiyonlu-kaynak-makineleri";
const PLASMA = "plazma-kesim-makineleri";
const LASER_WELD = "lazer-kaynak-makineleri";
const LASER_CLEAN = "lazer-temizleme";
const LASER_MARK = "lazer-markalama";

/**
 * Model Serisi filtresi (KARARLAR K-76): urun adinin ilk kelimesinden.
 * Lazer temizleme ve markalama kategorilerinde bu filtre yok. Diger
 * filtrelerin degerleri sonra eslenecek.
 */
const SERIES_BY_PREFIX: Record<string, string> = {
  ultimate: "ultimate",
  evomig: "evomig",
  forcearc: "force",
  forcetig: "force",
  forcemig: "force",
  forcecut: "force",
  multicut: "multicut",
  y300: "y300",
};

const machineSeeds: MachineSeed[] = [
  { slug: "ultimate-255-mma", name: "Ultimate 255 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000001" },
  { slug: "ultimate-405-cel-mma", name: "Ultimate 405 CEL MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000002" },
  { slug: "forcearc-200-mma", name: "ForceArc 200 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: "ZW30100000072" },
  { slug: "forcearc-250-mma", name: "ForceArc 250 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: tempCode("FORCEARC250") },
  { slug: "forcearc-280-mma", name: "ForceArc 280 MMA Elektrod Kaynak Makinesi", categorySlug: MMA, sap: tempCode("FORCEARC280") },
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
  { slug: "forcemig-125", name: "ForceMIG 125 Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG125") },
  { slug: "forcemig-185-mp", name: "ForceMIG 185 MP Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG185MP") },
  { slug: "forcemig-200", name: "ForceMIG 200 Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: "ZW30100000074" },
  { slug: "forcemig-205-dp", name: "ForceMIG 205 DP Çok Fonksiyonlu Kaynak Makinesi", categorySlug: MULTI, sap: tempCode("FORCEMIG205DP") },

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
  const photos = machinePhotos(seed);
  const options = machineOptions(seed);
  // Soğutma secenekli urunde her varyant kendi halinin fotografini gosterir.
  options?.variants.forEach((v) => {
    const cooling = v.values.sogutma as "hava" | "su" | undefined;
    if (photos.byCooling && cooling) v.image = photos.byCooling[cooling];
  });
  // Birden cok SAP kalemli urunun sayfa kodu SAP'ta yoktur (KARARLAR K-72).
  const sku = seed.sap ?? `ZW-${seed.slug.toUpperCase()}`;
  const type = TYPE_BY_CATEGORY[seed.categorySlug];
  const phrases = optionPhrases(seed.options);
  // Sahibinin gonderdigi icerik varsa o; yoksa ORNEK icerik (gercekleri gelince degistirilecek).
  const content = machineContent[seed.slug];
  const series = SERIES_BY_PREFIX[seed.slug.split("-")[0]];
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
    images: photos.images,
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
    ...(series ? { filterValues: { "model-serisi": [series] } } : {}),
    manualUrl: "#",
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
  // %25 ve uzeri "Flaş İndirim" etiketinin ornegi
  "forcearc-200-mma": 25,
  "multicut-85-cnc": 10,
};

products.forEach((p) => {
  const percent = HOT_SALE[p.slug];
  // Urunde NORMAL fiyat saklanir, indirim gosterimde uygulanir.
  if (percent) p.discount = { percent };
});

// Kategori icindeki sira: bu dosyadaki siraya gore 1, 2, 3 ... (panelden degisir).
const lastOrder = new Map<string, number>();
products.forEach((p) => {
  p.order = (lastOrder.get(p.categorySlug) ?? 0) + 1;
  lastOrder.set(p.categorySlug, p.order);
});
