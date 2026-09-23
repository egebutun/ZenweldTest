import type { Product } from "../types";
import { stockPhotos } from "./images";

/**
 * Gercek Zenweld modelleri (zenweld.com ve yetkili bayi siteleri kaynakli).
 *
 * !! DOGRULANMALI !!
 * Teknik degerler arama sonuclarindan derlendi; resmi kataloga erisilemedigi
 * icin amper / devrede kalma / agirlik gibi degerler yaklasiktir.
 * Admin panel > Urunler > Duzenle ekranindan duzeltilebilir.
 */

const now = "2026-09-16T08:00:00+03:00";

/**
 * Tum urunlerde kullanilan Zenweld urun fotografi.
 *
 * Dosya her iki uygulamanin public/images/products/ klasorunde bulunur.
 * Farkli urunlere farkli fotograf vermek icin: Yonetim Paneli > Urunler >
 * Duzenle > Gorseller sekmesinden URL girin veya dosya yukleyin.
 */
const PRODUCT_PHOTO = "/images/products/zenweld-urun.png";

const lorem = {
  tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
};

export const products: Product[] = [
  /* ------------------------------------------------------------ 1 */
  {
    id: "p-ultimate-250-mtc",
    slug: "ultimate-250-mtc",
    sku: "ZW-U250MTC",
    name: "Zenweld Ultimate 250 MTC",
    modelCode: "Z05.02.25",
    section: "ekipmanlar",
    categorySlug: "multi-process",
    processes: ["MIG", "MAG", "TIG", "MMA", "MULTI"],
    shortDescription: {
      tr: "D300 mm tel besleme ünitesi entegre, 250A gücünde monofaze multi-process inverter kaynak makinesi.",
      en: "Single-phase 250A multi-process inverter welder with integrated D300 mm wire feeder.",
    },
    description: {
      tr: "Ultimate 250 MTC, D300 mm tel besleme ünitesi entegre edilmiş, güvenilir monofaze inverter kaynak makinesidir. 250A gücü ile farklı malzeme ve uygulamalarda profesyonel kaynak imkânı sunar. Tek buton ile MIG, MMA veya TIG DC kaynak yöntemleri arasında geçiş yapılabilir. Karbon çelikleri, paslanmaz çelikler ve alüminyum alaşımları dâhil pek çok metalde kullanılabilir. Kutup değiştirme özelliği sayesinde özel alaşımlı tellerle (DCEN) çalışmaya olanak tanır. Hafif ve akıllı tasarımı, zorlu koşullarda dahi taşınabilir kullanım sağlar. Hafif sanayi, bakım-onarım hizmetleri, hobi kullanımı ve küçük atölye işletmeleri için uygundur.",
      en: "The Ultimate 250 MTC is a reliable single-phase inverter welding machine with an integrated D300 mm wire feed unit. Its 250A output delivers professional results across different materials and applications. MIG, MMA or TIG DC processes are selected with a single button, covering carbon steels, stainless steels and aluminium alloys. The polarity-change feature allows working with special alloy wires (DCEN). Its lightweight, intelligent design makes it portable even in demanding conditions — ideal for light industry, maintenance and repair, hobby use and small workshops.",
    },
    priceExVat: 41500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MIG / MAG / MMA / TIG DC", en: "MIG / MAG / MMA / TIG DC" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "30 – 250 A", en: "30 – 250 A" } },
      { label: { tr: "Devrede Kalma (40°C)", en: "Duty Cycle (40°C)" }, value: { tr: "%60 @ 250 A", en: "60% @ 250 A" } },
      { label: { tr: "Tel Besleme", en: "Wire Feeder" }, value: { tr: "Entegre, D300 mm makara", en: "Integrated, D300 mm spool" } },
      { label: { tr: "Tel Çapı", en: "Wire Diameter" }, value: { tr: "0.8 – 1.2 mm", en: "0.8 – 1.2 mm" } },
      { label: { tr: "Kutup Değiştirme (DCEN)", en: "Polarity Change (DCEN)" }, value: { tr: "Var", en: "Yes" } },
      { label: { tr: "Koruma Sınıfı", en: "Protection Class" }, value: { tr: "IP21S", en: "IP21S" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 24 kg", en: "~ 24 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate 250 MTC Ana Ünite", en: "1 x Ultimate 250 MTC Power Source" },
      { tr: "1 x 3 m MIG Torcu", en: "1 x 3 m MIG Torch" },
      { tr: "1 x 3 m Şase Kablosu ve Pensesi", en: "1 x 3 m Earth Lead and Clamp" },
      { tr: "1 x 3 m Elektrot Pensesi", en: "1 x 3 m Electrode Holder" },
      { tr: "1 x Argon Regülatörü", en: "1 x Argon Regulator" },
      { tr: "1 x 1.8 m Gaz Hortumu", en: "1 x 1.8 m Gas Hose" },
      { tr: "2 x 0.8-1.0 mm V Kanal Makara", en: "2 x 0.8-1.0 mm V Groove Roller" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "Tek butonla MIG / MMA / TIG geçişi", en: "One-button MIG / MMA / TIG selection" },
      { tr: "Entegre D300 mm tel besleme ünitesi", en: "Integrated D300 mm wire feed unit" },
      { tr: "DCEN kutup değiştirme özelliği", en: "DCEN polarity change" },
      { tr: "Monofaze şebekede 250 A performans", en: "250 A output on single-phase power" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 2 */
  {
    id: "p-ultimate-255-mtc",
    slug: "ultimate-255-mtc",
    sku: "ZW-U255MTC",
    name: "Zenweld Ultimate 255 MTC",
    modelCode: "Z05.02.55",
    section: "ekipmanlar",
    categorySlug: "mig-gmaw",
    processes: ["MIG", "MAG", "MMA", "TIG"],
    shortDescription: {
      tr: "Senkron kontrol panelli, 255A gücünde gazaltı kaynak makinesi. Ağır hizmet atölye kullanımı için.",
      en: "255A gas-shielded welding machine with synergic control panel for heavy-duty workshop use.",
    },
    description: {
      tr: "Ultimate 255 MTC, senkron (synergic) kontrol paneli sayesinde tel çapı ve malzeme seçimine göre kaynak parametrelerini otomatik ayarlar. Yüksek devrede kalma oranıyla sürekli üretim yapan atölyeler için tasarlanmıştır. Karbon çeliği, paslanmaz ve alüminyum uygulamalarında istikrarlı ark sunar.",
      en: "The Ultimate 255 MTC sets welding parameters automatically based on wire diameter and material thanks to its synergic control panel. Designed for workshops in continuous production with a high duty cycle, it delivers a stable arc on carbon steel, stainless and aluminium.",
    },
    priceExVat: 48900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MIG / MAG / MMA / TIG DC", en: "MIG / MAG / MMA / TIG DC" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "30 – 255 A", en: "30 – 255 A" } },
      { label: { tr: "Devrede Kalma (40°C)", en: "Duty Cycle (40°C)" }, value: { tr: "%60 @ 255 A", en: "60% @ 255 A" } },
      { label: { tr: "Kontrol", en: "Control" }, value: { tr: "Senkron (Synergic)", en: "Synergic" } },
      { label: { tr: "Tel Çapı", en: "Wire Diameter" }, value: { tr: "0.8 – 1.2 mm", en: "0.8 – 1.2 mm" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 26 kg", en: "~ 26 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate 255 MTC Ana Ünite", en: "1 x Ultimate 255 MTC Power Source" },
      { tr: "1 x 3 m MIG Torcu", en: "1 x 3 m MIG Torch" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Argon Regülatörü", en: "1 x Argon Regulator" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "Senkron kontrol paneli", en: "Synergic control panel" },
      { tr: "Yüksek devrede kalma oranı", en: "High duty cycle" },
      { tr: "Alüminyum uyumlu tel besleme", en: "Aluminium-ready wire feed" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 3 */
  {
    id: "p-ultimate-355-mtc",
    slug: "ultimate-355-mtc",
    sku: "ZW-U355MTC",
    name: "Zenweld Ultimate 355 MTC",
    modelCode: "Z05.03.55",
    section: "ekipmanlar",
    categorySlug: "mig-gmaw",
    processes: ["MIG", "MAG", "MMA"],
    shortDescription: {
      tr: "Trifaze 355A gazaltı kaynak makinesi. Ağır sanayi ve sürekli üretim için endüstriyel çözüm.",
      en: "Three-phase 355A gas-shielded welder — an industrial solution for heavy industry and continuous production.",
    },
    description: {
      tr: "Ultimate 355 MTC, trifaze şebekede 355A'e kadar kaynak akımı sunan endüstriyel sınıf bir gazaltı kaynak makinesidir. Ayrı tel besleme ünitesi ve uzatılabilir ara kablo seçeneğiyle büyük parçalarda çalışma kolaylığı sağlar. Ağır sanayi, çelik konstrüksiyon ve seri imalat uygulamaları için tasarlanmıştır.",
      en: "The Ultimate 355 MTC is an industrial-class gas-shielded welder delivering up to 355A on three-phase power. With a separate wire feed unit and extendable interconnection cable, it simplifies work on large assemblies — built for heavy industry, steel construction and serial production.",
    },
    priceExVat: 96500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MIG / MAG / MMA", en: "MIG / MAG / MMA" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "380 V ± %15, 3 faz", en: "380 V ±15%, 3-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "40 – 355 A", en: "40 – 355 A" } },
      { label: { tr: "Devrede Kalma (40°C)", en: "Duty Cycle (40°C)" }, value: { tr: "%60 @ 355 A", en: "60% @ 355 A" } },
      { label: { tr: "Tel Besleme", en: "Wire Feeder" }, value: { tr: "Ayrı ünite, 4 makaralı", en: "Separate unit, 4-roller" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 52 kg", en: "~ 52 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate 355 MTC Ana Ünite", en: "1 x Ultimate 355 MTC Power Source" },
      { tr: "1 x Tel Besleme Ünitesi", en: "1 x Wire Feed Unit" },
      { tr: "1 x 3 m MIG Torcu", en: "1 x 3 m MIG Torch" },
      { tr: "1 x 5 m Ara Kablo Seti", en: "1 x 5 m Interconnection Cable Set" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "Trifaze endüstriyel güç", en: "Three-phase industrial power" },
      { tr: "Ayrı tel besleme ünitesi", en: "Separate wire feed unit" },
      { tr: "Seri imalat için yüksek dayanım", en: "Built for serial production" },
    ],
    inStock: true,
    quotable: true,
    featured: false,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 4 */
  {
    id: "p-ultimate-205-mte-pro",
    slug: "ultimate-205-mte-pro",
    sku: "ZW-U205MTE",
    name: "Zenweld Ultimate 205 MTE Pro",
    modelCode: "Z05.02.05",
    section: "ekipmanlar",
    categorySlug: "mig-gmaw",
    processes: ["MIG", "MAG", "MMA", "TIG"],
    shortDescription: {
      tr: "Kompakt gövdeli, 200A sınıfı taşınabilir MIG kaynak makinesi. Servis ve saha işleri için ideal.",
      en: "Compact 200A-class portable MIG welder — ideal for service and field work.",
    },
    description: {
      tr: "Ultimate 205 MTE Pro, kompakt gövdesi ve düşük ağırlığı ile saha ve servis işlerinde öne çıkan bir MIG kaynak makinesidir. Monofaze şebekede çalışır, D200 mm makara kullanır ve gazsız (özlü tel) kaynağa da uygundur. Bakım-onarım, oto sanayi ve hafif imalat uygulamaları için uygundur.",
      en: "The Ultimate 205 MTE Pro stands out in field and service work thanks to its compact body and low weight. It runs on single-phase power, takes D200 mm spools and also supports gasless (flux-cored) welding — a fit for maintenance, automotive and light fabrication.",
    },
    priceExVat: 28900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MIG / MAG / MMA / TIG DC", en: "MIG / MAG / MMA / TIG DC" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "30 – 200 A", en: "30 – 200 A" } },
      { label: { tr: "Makara Kapasitesi", en: "Spool Capacity" }, value: { tr: "D200 mm", en: "D200 mm" } },
      { label: { tr: "Gazsız Kaynak", en: "Gasless Welding" }, value: { tr: "Destekler", en: "Supported" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 15 kg", en: "~ 15 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate 205 MTE Pro Ana Ünite", en: "1 x Ultimate 205 MTE Pro Power Source" },
      { tr: "1 x 3 m MIG Torcu", en: "1 x 3 m MIG Torch" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "15 kg kompakt gövde", en: "15 kg compact body" },
      { tr: "Gazlı ve gazsız kaynak", en: "Gas and gasless welding" },
      { tr: "Saha ve servis için taşınabilir", en: "Portable for field and service" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 5 */
  {
    id: "p-evomig-205-p",
    slug: "evomig-205-p",
    sku: "ZW-EVO205P",
    name: "Zenweld Evomig 205 P Pulse MIG",
    modelCode: "Z06.02.05",
    section: "ekipmanlar",
    categorySlug: "pulse-mig",
    processes: ["PULSE", "MIG", "MAG", "TIG", "MMA", "MULTI"],
    shortDescription: {
      tr: "Pulse ve Double Pulse destekli, renkli ekranlı sinerjik MIG kaynak makinesi. Alüminyumda üstün görünüm.",
      en: "Synergic MIG welder with Pulse and Double Pulse, colour display — outstanding bead appearance on aluminium.",
    },
    description: {
      tr: "Evomig 205 P, pulse ve double pulse kaynak modları ile ince sacta çarpılmayı ve sıçrantıyı minimuma indirir. Renkli ekranlı sinerjik arayüzü sayesinde malzeme, tel çapı ve gaz seçimi yapıldığında tüm parametreler otomatik olarak ayarlanır. Özellikle alüminyum ve paslanmaz uygulamalarında dekoratif, pul pul kaynak dikişi elde edilir.",
      en: "The Evomig 205 P minimises distortion and spatter on thin sheet with its pulse and double pulse modes. Its colour synergic interface sets every parameter automatically once material, wire diameter and gas are selected, producing a decorative, stacked-dime bead — especially on aluminium and stainless.",
    },
    priceExVat: 64900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "Pulse MIG / Double Pulse / MIG / MAG / TIG / MMA", en: "Pulse MIG / Double Pulse / MIG / MAG / TIG / MMA" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "30 – 200 A", en: "30 – 200 A" } },
      { label: { tr: "Ekran", en: "Display" }, value: { tr: "Renkli TFT, sinerjik", en: "Colour TFT, synergic" } },
      { label: { tr: "Hafıza", en: "Memory" }, value: { tr: "Kullanıcı program hafızası", en: "User program memory" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 21 kg", en: "~ 21 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Evomig 205 P Ana Ünite", en: "1 x Evomig 205 P Power Source" },
      { tr: "1 x 3 m MIG Torcu", en: "1 x 3 m MIG Torch" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Argon Regülatörü", en: "1 x Argon Regulator" },
      { tr: "2 x U Kanal Alüminyum Makarası", en: "2 x U Groove Aluminium Roller" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "Pulse ve Double Pulse modları", en: "Pulse and Double Pulse modes" },
      { tr: "Renkli sinerjik ekran", en: "Colour synergic display" },
      { tr: "Alüminyumda dekoratif dikiş", en: "Decorative bead on aluminium" },
      { tr: "Minimum sıçrantı", en: "Minimal spatter" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: true,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 6 */
  {
    id: "p-ultimate-205-acdc-tig",
    slug: "ultimate-205-acdc-tig",
    sku: "ZW-U205ACDC",
    name: "Zenweld Ultimate 205 AC/DC TIG",
    modelCode: "Z04.02.05",
    section: "ekipmanlar",
    categorySlug: "tig-gtaw",
    processes: ["TIG", "MMA"],
    shortDescription: {
      tr: "AC/DC TIG kaynak makinesi. Alüminyum ve alaşımlarında hassas kaynak için pulse ve dalga formu kontrolü.",
      en: "AC/DC TIG welder with pulse and waveform control for precision welding on aluminium and its alloys.",
    },
    description: {
      tr: "Ultimate 205 AC/DC TIG, alüminyum ve alaşımlarının kaynağı için AC modu, çelik ve paslanmaz için DC modu sunar. Ayarlanabilir AC frekansı, temizleme dengesi ve pulse fonksiyonu ile ince parçalarda dahi tam kontrol sağlar. HF ateşleme ve ayak pedalı desteği ile hassas işçilik gerektiren uygulamalar için tasarlanmıştır.",
      en: "The Ultimate 205 AC/DC TIG offers AC mode for aluminium and its alloys and DC mode for steel and stainless. Adjustable AC frequency, cleaning balance and a pulse function give full control even on thin material. HF ignition and foot-pedal support make it a fit for precision work.",
    },
    priceExVat: 52900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "AC/DC TIG / MMA", en: "AC/DC TIG / MMA" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "10 – 200 A", en: "10 – 200 A" } },
      { label: { tr: "AC Frekansı", en: "AC Frequency" }, value: { tr: "20 – 200 Hz", en: "20 – 200 Hz" } },
      { label: { tr: "Temizleme Dengesi", en: "Cleaning Balance" }, value: { tr: "Ayarlanabilir", en: "Adjustable" } },
      { label: { tr: "Ateşleme", en: "Ignition" }, value: { tr: "HF (Yüksek Frekans)", en: "HF (High Frequency)" } },
      { label: { tr: "Pedal Desteği", en: "Pedal Support" }, value: { tr: "Var", en: "Yes" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 23 kg", en: "~ 23 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate 205 AC/DC Ana Ünite", en: "1 x Ultimate 205 AC/DC Power Source" },
      { tr: "1 x 4 m TIG Torcu (WP-26)", en: "1 x 4 m TIG Torch (WP-26)" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Elektrot Pensesi", en: "1 x Electrode Holder" },
      { tr: "1 x Argon Regülatörü", en: "1 x Argon Regulator" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "AC modunda alüminyum kaynağı", en: "Aluminium welding in AC mode" },
      { tr: "Ayarlanabilir AC frekansı ve denge", en: "Adjustable AC frequency and balance" },
      { tr: "Pulse TIG fonksiyonu", en: "Pulse TIG function" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 7 */
  {
    id: "p-ultimate-th-200",
    slug: "ultimate-th-200",
    sku: "ZW-UTH200",
    name: "Zenweld Ultimate TH 200",
    modelCode: "Z04.01.20",
    section: "ekipmanlar",
    categorySlug: "tig-gtaw",
    processes: ["TIG", "MMA"],
    shortDescription: {
      tr: "DC TIG / MMA inverter kaynak makinesi. HF ateşlemeli, hafif ve taşınabilir gövde.",
      en: "DC TIG / MMA inverter welder with HF ignition in a light, portable body.",
    },
    description: {
      tr: "Ultimate TH 200, çelik ve paslanmaz uygulamaları için DC TIG ve MMA kaynak yöntemlerini tek gövdede sunar. HF ateşleme sayesinde tungsten elektrot iş parçasına temas etmeden ark başlatılır; böylece kaynak bölgesinde kirlenme önlenir. Hafif yapısı ile saha ve bakım işlerinde rahat taşınır.",
      en: "The Ultimate TH 200 combines DC TIG and MMA in a single body for steel and stainless work. HF ignition starts the arc without the tungsten touching the workpiece, preventing contamination of the weld zone. Its light build travels easily for field and maintenance jobs.",
    },
    priceExVat: 24500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "DC TIG / MMA", en: "DC TIG / MMA" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "10 – 200 A", en: "10 – 200 A" } },
      { label: { tr: "Ateşleme", en: "Ignition" }, value: { tr: "HF (Yüksek Frekans)", en: "HF (High Frequency)" } },
      { label: { tr: "Devrede Kalma (40°C)", en: "Duty Cycle (40°C)" }, value: { tr: "%60 @ 200 A", en: "60% @ 200 A" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 9 kg", en: "~ 9 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate TH 200 Ana Ünite", en: "1 x Ultimate TH 200 Power Source" },
      { tr: "1 x 4 m TIG Torcu", en: "1 x 4 m TIG Torch" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Elektrot Pensesi", en: "1 x Electrode Holder" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "9 kg ultra hafif gövde", en: "9 kg ultra-light body" },
      { tr: "HF ateşleme ile temiz ark başlangıcı", en: "Clean arc start with HF ignition" },
      { tr: "TIG ve MMA tek makinede", en: "TIG and MMA in one machine" },
    ],
    inStock: true,
    quotable: true,
    featured: false,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 8 */
  {
    id: "p-arc-200",
    slug: "arc-200",
    sku: "ZW-ARC200",
    name: "Zenweld ARC 200",
    modelCode: "Z03.01.15",
    section: "ekipmanlar",
    categorySlug: "mma-stick",
    processes: ["MMA"],
    shortDescription: {
      tr: "200A örtülü elektrot (MMA) inverter kaynak makinesi. Dış mekan ve genel imalat için gaz gerektirmez.",
      en: "200A MMA stick inverter welder — no gas required, for outdoor work and general fabrication.",
    },
    description: {
      tr: "Zenweld ARC 200, inverter teknolojisi sayesinde klasik trafolu makinelere göre çok daha hafif ve verimli çalışan bir örtülü elektrot kaynak makinesidir. Gaz kullanmadığı için açık havada ve rüzgârlı ortamlarda kaynak yapılabilir. Hot Start, Arc Force ve Anti-Stick fonksiyonları ile elektrot yapışmasını önler ve istikrarlı bir ark sağlar.",
      en: "Thanks to inverter technology the Zenweld ARC 200 is far lighter and more efficient than a traditional transformer machine. Because it needs no shielding gas it can weld outdoors and in windy conditions. Hot Start, Arc Force and Anti-Stick prevent electrode sticking and keep the arc stable.",
    },
    priceExVat: 9900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MMA (Örtülü Elektrot)", en: "MMA (Stick)" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "20 – 200 A", en: "20 – 200 A" } },
      { label: { tr: "Elektrot Çapı", en: "Electrode Diameter" }, value: { tr: "2.0 – 4.0 mm", en: "2.0 – 4.0 mm" } },
      { label: { tr: "Fonksiyonlar", en: "Functions" }, value: { tr: "Hot Start / Arc Force / Anti-Stick", en: "Hot Start / Arc Force / Anti-Stick" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 5 kg", en: "~ 5 kg" } },
    ],
    inTheBox: [
      { tr: "1 x ARC 200 Ana Ünite", en: "1 x ARC 200 Power Source" },
      { tr: "1 x Elektrot Pensesi ve Kablosu", en: "1 x Electrode Holder and Lead" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Taşıma Askısı", en: "1 x Carry Strap" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "5 kg, tek elle taşınabilir", en: "5 kg, carry with one hand" },
      { tr: "Gaz gerektirmez — dış mekan kaynağı", en: "No gas required — outdoor welding" },
      { tr: "Hot Start / Arc Force / Anti-Stick", en: "Hot Start / Arc Force / Anti-Stick" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 9 */
  {
    id: "p-arc-120",
    slug: "arc-120",
    sku: "ZW-ARC120",
    name: "Zenweld ARC 120",
    modelCode: "Z03.01.12",
    section: "ekipmanlar",
    categorySlug: "mma-stick",
    processes: ["MMA"],
    shortDescription: {
      tr: "Hobi ve bakım-onarım işleri için giriş seviyesi 120A örtülü elektrot inverter kaynak makinesi.",
      en: "Entry-level 120A MMA stick inverter welder for hobby and maintenance work.",
    },
    description: {
      tr: "ARC 120, ev tipi şebekede rahatlıkla çalışan, hobi kullanıcıları ve küçük bakım-onarım işleri için tasarlanmış giriş seviyesi bir inverter kaynak makinesidir. Kompakt boyutu ve düşük ağırlığı ile alet çantasında taşınabilir.",
      en: "The ARC 120 runs comfortably on domestic power and is designed for hobby users and small maintenance jobs. Its compact size and low weight let it travel in a tool bag.",
    },
    priceExVat: 5900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MMA (Örtülü Elektrot)", en: "MMA (Stick)" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "20 – 120 A", en: "20 – 120 A" } },
      { label: { tr: "Elektrot Çapı", en: "Electrode Diameter" }, value: { tr: "2.0 – 3.2 mm", en: "2.0 – 3.2 mm" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 3.5 kg", en: "~ 3.5 kg" } },
    ],
    inTheBox: [
      { tr: "1 x ARC 120 Ana Ünite", en: "1 x ARC 120 Power Source" },
      { tr: "1 x Elektrot Pensesi ve Kablosu", en: "1 x Electrode Holder and Lead" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "Giriş seviyesi, ekonomik", en: "Entry level, economical" },
      { tr: "3.5 kg kompakt gövde", en: "3.5 kg compact body" },
      { tr: "Ev tipi şebekede çalışır", en: "Runs on domestic power" },
    ],
    inStock: true,
    quotable: false,
    featured: false,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 10 */
  {
    id: "p-ultimate-arc-200s",
    slug: "ultimate-arc-200-s",
    sku: "ZW-UARC200S",
    name: "Zenweld Ultimate ARC 200 S",
    modelCode: "Z03.02.00",
    section: "ekipmanlar",
    categorySlug: "mma-stick",
    processes: ["MMA", "TIG"],
    shortDescription: {
      tr: "Profesyonel kullanım için yüksek devrede kalma oranlı 200A MMA / Lift TIG kaynak makinesi.",
      en: "200A MMA / Lift TIG welder with a high duty cycle for professional use.",
    },
    description: {
      tr: "Ultimate ARC 200 S, profesyonel kullanıcılar için yüksek devrede kalma oranı ve güçlendirilmiş soğutma sistemiyle geliştirilmiştir. Lift TIG özelliği sayesinde ek bir makineye ihtiyaç duymadan hassas TIG işleri de yapılabilir. Selülozik elektrotlarla boru kaynağına uygundur.",
      en: "The Ultimate ARC 200 S was developed for professionals with a high duty cycle and reinforced cooling. Its Lift TIG capability covers precision TIG work without a second machine, and it handles pipe welding with cellulosic electrodes.",
    },
    priceExVat: 14900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kaynak Yöntemi", en: "Process" }, value: { tr: "MMA / Lift TIG", en: "MMA / Lift TIG" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kaynak Akım Aralığı", en: "Welding Current Range" }, value: { tr: "20 – 200 A", en: "20 – 200 A" } },
      { label: { tr: "Devrede Kalma (40°C)", en: "Duty Cycle (40°C)" }, value: { tr: "%80 @ 200 A", en: "80% @ 200 A" } },
      { label: { tr: "Selülozik Elektrot", en: "Cellulosic Electrode" }, value: { tr: "Uygun", en: "Supported" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 7 kg", en: "~ 7 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Ultimate ARC 200 S Ana Ünite", en: "1 x Ultimate ARC 200 S Power Source" },
      { tr: "1 x Elektrot Pensesi ve Kablosu", en: "1 x Electrode Holder and Lead" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Taşıma Askısı", en: "1 x Carry Strap" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "%80 devrede kalma oranı", en: "80% duty cycle" },
      { tr: "Lift TIG desteği", en: "Lift TIG support" },
      { tr: "Selülozik elektrot uyumlu", en: "Cellulosic electrode compatible" },
    ],
    inStock: true,
    quotable: true,
    featured: false,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 11 */
  {
    id: "p-multicut-40-cnc",
    slug: "multicut-40-cnc",
    sku: "ZW-MC40CNC",
    name: "Zenweld Multicut 40 CNC",
    modelCode: "Z07.01.40",
    section: "ekipmanlar",
    categorySlug: "plazma-kesme-makineleri",
    processes: ["PLAZMA"],
    shortDescription: {
      tr: "Monofaze 40A plazma kesme makinesi. 14 mm temiz kesim, CNC bağlantı çıkışı ve PFC modülü.",
      en: "Single-phase 40A plasma cutter — 14 mm clean cut, CNC connection output and PFC module.",
    },
    description: {
      tr: "Multicut 40 CNC, monofaze giriş gerilimi ile çalışan ve yüksek devrede kalma oranıyla maksimum 40 Amper'e kadar kesim yapabilen bir plazma kesme makinesidir. Otomasyon sistemlerine adapte edilebilen CNC bağlantı çıkışı bulunur. Yüksek frekanssız çalışma yöntemi ve koruma sistemi üst düzey güvenlik sağlar. IGBT teknolojisi üstün performanslı kesme arkı oluşturur; PFC modülü sayesinde düşük enerji tüketimi ve mükemmel kesme arkı kontrolü sunar. Karbon çeliği, galvanizli çelik, paslanmaz çelik, döküm malzemeler, alüminyum ve alaşımlarının kesiminde kullanılır. 14 mm temiz kesim ve 20 mm oluk açma performansına sahiptir.",
      en: "The Multicut 40 CNC runs on single-phase input and cuts up to 40 A with a high duty cycle. It has a CNC connection output for adaptation to automation systems, plus a high-frequency-free working method and protection system for top-level safety. IGBT technology creates a superior cutting arc, while the PFC module keeps energy consumption low and arc control excellent. It cuts carbon steel, galvanised steel, stainless steel, cast materials, aluminium and alloys, with 14 mm clean cutting and 20 mm gouging performance.",
    },
    priceExVat: 32900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kesme Yöntemi", en: "Process" }, value: { tr: "Plazma Kesme", en: "Plasma Cutting" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "220 V ± %15, 1 faz", en: "220 V ±15%, 1-phase" } },
      { label: { tr: "Kesme Akımı", en: "Cutting Current" }, value: { tr: "20 – 40 A", en: "20 – 40 A" } },
      { label: { tr: "Temiz Kesim", en: "Clean Cut" }, value: { tr: "14 mm", en: "14 mm" } },
      { label: { tr: "Oluk Açma", en: "Gouging" }, value: { tr: "20 mm", en: "20 mm" } },
      { label: { tr: "CNC Çıkışı", en: "CNC Output" }, value: { tr: "Var", en: "Yes" } },
      { label: { tr: "Ateşleme", en: "Ignition" }, value: { tr: "Yüksek frekanssız (Blowback)", en: "High-frequency free (Blowback)" } },
      { label: { tr: "PFC Modülü", en: "PFC Module" }, value: { tr: "Var", en: "Yes" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 12 kg", en: "~ 12 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Multicut 40 CNC Ana Ünite", en: "1 x Multicut 40 CNC Power Source" },
      { tr: "1 x 6 m Plazma Torcu", en: "1 x 6 m Plasma Torch" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Hava Regülatörü ve Filtresi", en: "1 x Air Regulator and Filter" },
      { tr: "5 x Yedek Elektrot ve Meme", en: "5 x Spare Electrode and Nozzle" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "14 mm temiz kesim performansı", en: "14 mm clean cutting performance" },
      { tr: "Otomasyon için CNC bağlantı çıkışı", en: "CNC connection output for automation" },
      { tr: "Yüksek frekanssız güvenli ateşleme", en: "Safe high-frequency-free ignition" },
      { tr: "PFC ile düşük enerji tüketimi", en: "Low energy consumption with PFC" },
    ],
    inStock: true,
    quotable: true,
    featured: true,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },

  /* ------------------------------------------------------------ 12 */
  {
    id: "p-multicut-60-s",
    slug: "multicut-60-s",
    sku: "ZW-MC60S",
    name: "Zenweld Multicut 60 S",
    modelCode: "Z07.02.60",
    section: "ekipmanlar",
    categorySlug: "plazma-kesme-makineleri",
    processes: ["PLAZMA"],
    shortDescription: {
      tr: "Trifaze, kompakt ve taşınabilir 60A plazma kesme makinesi. 18 mm temiz kesim, 25 mm oluk açma.",
      en: "Portable, compact three-phase 60A plasma cutter — 18 mm clean cut, 25 mm gouging.",
    },
    description: {
      tr: "Multicut 60 S, taşınabilir ve kompakt yapıda trifaze bir plazma kesme makinesidir. Merkezi bağlantı, yüksek frekanssız çalışma yöntemi ve koruma sistemi üst düzey güvenlik sağlar. 18 mm temiz kesim ve 25 mm oluk açma performansı sunar. Otomasyona uygun CNC bağlantı çıkışı bulunur.",
      en: "The Multicut 60 S is a portable, compact three-phase plasma cutter. Central connection, a high-frequency-free working method and a protection system deliver top-level safety, with 18 mm clean cutting and 25 mm gouging performance. A CNC connection output makes it automation-ready.",
    },
    priceExVat: 58900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: { tr: "Zenweld ürün görseli", en: "Zenweld product image" } }],
    specs: [
      { label: { tr: "Kesme Yöntemi", en: "Process" }, value: { tr: "Plazma Kesme", en: "Plasma Cutting" } },
      { label: { tr: "Şebeke Gerilimi", en: "Input Voltage" }, value: { tr: "380 V ± %15, 3 faz", en: "380 V ±15%, 3-phase" } },
      { label: { tr: "Kesme Akımı", en: "Cutting Current" }, value: { tr: "20 – 60 A", en: "20 – 60 A" } },
      { label: { tr: "Temiz Kesim", en: "Clean Cut" }, value: { tr: "18 mm", en: "18 mm" } },
      { label: { tr: "Oluk Açma", en: "Gouging" }, value: { tr: "25 mm", en: "25 mm" } },
      { label: { tr: "Torç Bağlantısı", en: "Torch Connection" }, value: { tr: "Merkezi bağlantı", en: "Central connection" } },
      { label: { tr: "CNC Çıkışı", en: "CNC Output" }, value: { tr: "Var", en: "Yes" } },
      { label: { tr: "Ağırlık", en: "Weight" }, value: { tr: "~ 18 kg", en: "~ 18 kg" } },
    ],
    inTheBox: [
      { tr: "1 x Multicut 60 S Ana Ünite", en: "1 x Multicut 60 S Power Source" },
      { tr: "1 x 6 m Plazma Torcu (merkezi bağlantı)", en: "1 x 6 m Plasma Torch (central connection)" },
      { tr: "1 x Şase Kablosu ve Pensesi", en: "1 x Earth Lead and Clamp" },
      { tr: "1 x Hava Regülatörü ve Filtresi", en: "1 x Air Regulator and Filter" },
      { tr: "1 x Kullanım Kılavuzu", en: "1 x Operating Manual" },
    ],
    highlights: [
      { tr: "18 mm temiz kesim / 25 mm oluk açma", en: "18 mm clean cut / 25 mm gouging" },
      { tr: "Merkezi torç bağlantısı", en: "Central torch connection" },
      { tr: "Trifaze endüstriyel güç", en: "Three-phase industrial power" },
    ],
    inStock: false,
    quotable: true,
    featured: false,
    isNew: false,
    manualUrl: "#",
    warrantyMonths: 24,
    createdAt: now,
    updatedAt: now,
    active: true,
  },
];

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
  photo: string;
  short: { tr: string; en: string };
  /** Menu kartinda gorunen 1-2 satislik ozellik */
  highlights?: { tr: string; en: string }[];
}

const accessorySeeds: AccessorySeed[] = [
  { slug: "zenmask-auto-9000", sku: "ZW-MASK9000", name: "Zenweld ZenMask Auto 9000", section: "guvenlik", categorySlug: "otomatik-kararan-maskeler", price: 3450, photo: stockPhotos.welderAtWork, short: { tr: "Gerçek renk teknolojili otomatik kararan kaynak maskesi, 4 sensörlü.", en: "True-colour auto-darkening welding helmet with 4 sensors." } },
  { slug: "zenmask-basic-500", sku: "ZW-MASK500", name: "Zenweld ZenMask Basic 500", section: "guvenlik", categorySlug: "otomatik-kararan-maskeler", price: 1290, photo: stockPhotos.workshop, short: { tr: "Giriş seviyesi otomatik kararan kaynak maskesi, 2 sensörlü.", en: "Entry-level auto-darkening welding helmet with 2 sensors." } },
  { slug: "kaynak-eldiveni-pro", sku: "ZW-GLV-PRO", name: "Zenweld Pro Kaynak Eldiveni", section: "guvenlik", categorySlug: "kaynak-eldivenleri", price: 480, photo: stockPhotos.toolsFlatlay, short: { tr: "Sığır derisi, kevlar dikişli, ısıya dayanıklı kaynak eldiveni.", en: "Cowhide, Kevlar-stitched, heat-resistant welding glove." } },
  { slug: "kaynak-onlugu-deri", sku: "ZW-APR-01", name: "Zenweld Deri Kaynak Önlüğü", section: "guvenlik", categorySlug: "kaynak-onlukleri", price: 890, photo: stockPhotos.industrialShop, short: { tr: "Kıvılcıma ve ısıya dayanıklı tam boy deri kaynak önlüğü.", en: "Full-length leather welding apron resistant to sparks and heat." } },
  { slug: "mig-torcu-mb25", sku: "ZW-TRC-MB25", name: "Zenweld MB-25 MIG Torcu 3m", section: "aksesuarlar", categorySlug: "mig-torclari", price: 1650, photo: stockPhotos.toolsFlatlay, short: { tr: "250A kapasiteli, 3 metre Euro bağlantılı MIG kaynak torcu.", en: "250A, 3 m Euro-connection MIG welding torch." } },
  { slug: "mig-torcu-mb36", sku: "ZW-TRC-MB36", name: "Zenweld MB-36 MIG Torcu 4m", section: "aksesuarlar", categorySlug: "mig-torclari", price: 2350, photo: stockPhotos.workshop, short: { tr: "350A kapasiteli, 4 metre ağır hizmet MIG kaynak torcu.", en: "350A, 4 m heavy-duty MIG welding torch." } },
  { slug: "tig-torcu-wp26", sku: "ZW-TRC-WP26", name: "Zenweld WP-26 TIG Torcu 4m", section: "aksesuarlar", categorySlug: "tig-torclari", price: 1980, photo: stockPhotos.metalWork, short: { tr: "Hava soğutmalı, 200A kapasiteli 4 metre TIG kaynak torcu.", en: "Air-cooled 200A 4 m TIG welding torch." } },
  { slug: "gaz-nozulu-seti", sku: "ZW-NZL-SET", name: "Zenweld Gaz Nozulu Seti (10'lu)", section: "aksesuarlar", categorySlug: "mig-sarf-malzemeleri", price: 420, photo: stockPhotos.toolsFlatlay, short: { tr: "MB-25 uyumlu 10 adetlik gaz nozulu seti.", en: "10-piece gas nozzle set compatible with MB-25." } },
  { slug: "kontak-meme-seti", sku: "ZW-TIP-SET", name: "Zenweld Kontak Meme Seti M6 (20'li)", section: "aksesuarlar", categorySlug: "mig-sarf-malzemeleri", price: 380, photo: stockPhotos.workshop, short: { tr: "0.8 / 1.0 / 1.2 mm ölçülerinde 20 adetlik kontak meme seti.", en: "20-piece contact tip set in 0.8 / 1.0 / 1.2 mm." } },
  { slug: "argon-regulatoru-cift-manometreli", sku: "ZW-REG-AR2", name: "Zenweld Çift Manometreli Argon Regülatörü", section: "aksesuarlar", categorySlug: "gaz-regulatorleri", price: 1150, photo: stockPhotos.industrialShop, short: { tr: "Debimetreli, çift manometreli argon / karışım gaz regülatörü.", en: "Argon / mixed-gas regulator with flowmeter and dual gauges." } },
  { slug: "gazalti-teli-sg2-08", sku: "ZW-WIRE-SG208", name: "Zenweld SG2 Gazaltı Teli 0.8 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "gazalti-telleri", price: 1450, photo: stockPhotos.metalWork, short: { tr: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", en: "Copper-coated SG2 grade MIG wire, 15 kg spool." } },
  { slug: "gazalti-teli-sg2-10", sku: "ZW-WIRE-SG210", name: "Zenweld SG2 Gazaltı Teli 1.0 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "gazalti-telleri", price: 1420, photo: stockPhotos.factoryLine, short: { tr: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", en: "Copper-coated SG2 grade MIG wire, 15 kg spool." } },
  { slug: "tig-cubugu-308l", sku: "ZW-ROD-308L", name: "Zenweld 308L Paslanmaz TIG Çubuğu 2.4 mm", section: "dolgu-metalleri", categorySlug: "paslanmaz-tig-cubuklari", price: 2250, photo: stockPhotos.blueprint, short: { tr: "304/308 paslanmaz çelik kaynağı için 5 kg'lık TIG çubuğu paketi.", en: "5 kg TIG rod pack for welding 304/308 stainless steel." } },
  { slug: "rutil-elektrot-6013", sku: "ZW-ELC-6013", name: "Zenweld E6013 Rutil Elektrot 3.25 mm", section: "dolgu-metalleri", categorySlug: "rutil-elektrotlar", price: 680, photo: stockPhotos.sparksDark, short: { tr: "Genel amaçlı rutil örtülü elektrot, 5 kg paket.", en: "General-purpose rutile-coated electrode, 5 kg pack." } },
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
/*   MIG > MIG Torclari        12 urun  -> "Tumunu Gor (12)" cikar      */
/*   MIG > Sarf Malzemeleri     9 urun  -> tam 3x3, sayi cikmaz         */
/*   MIG > Yedek Parca          5 urun  -> ikinci satir yarim           */
/* ------------------------------------------------------------------ */

type Demo = [slug: string, sku: string, name: string, cat: string, price: number,
  trShort: string, enShort: string, trA: string, enA: string, trB: string, enB: string];

const demoAccessories: Demo[] = [
  /* --- MIG > MIG Torçları (mevcut 2 + 10 = 12) --- */
  ["mig-torcu-mb15", "ZW-TRC-MB15", "Zenweld MB-15 MIG Torcu 3m", "mig-torclari", 980,
    "180A kapasiteli, hafif gövdeli 3 metre MIG torcu.", "Lightweight 180A 3 m MIG torch.",
    "İnce sacta kolay kullanım", "Easy handling on thin sheet", "Hafif gövde, 180 A", "Lightweight body, 180 A"],
  ["mig-torcu-mb24", "ZW-TRC-MB24", "Zenweld MB-24 MIG Torcu 3m", "mig-torclari", 1320,
    "250A kapasiteli, Euro bağlantılı 3 metre MIG torcu.", "250A Euro-connection 3 m MIG torch.",
    "Euro bağlantı standardı", "Euro connection standard", "250 A / %60 devrede kalma", "250 A / 60% duty cycle"],
  ["mig-torcu-mb25-4m", "ZW-TRC-MB25-4", "Zenweld MB-25 MIG Torcu 4m", "mig-torclari", 1890,
    "250A kapasiteli, 4 metre uzun erişimli MIG torcu.", "250A 4 m long-reach MIG torch.",
    "4 m ile geniş çalışma alanı", "4 m for wider working area", "MB-25 sarf uyumu", "Uses standard MB-25 consumables"],
  ["mig-torcu-mb36-3m", "ZW-TRC-MB36-3", "Zenweld MB-36 MIG Torcu 3m", "mig-torclari", 2050,
    "350A kapasiteli, ağır hizmet 3 metre MIG torcu.", "Heavy-duty 350A 3 m MIG torch.",
    "Kalın kesitte sürekli kaynak", "Continuous welding on thick sections", "350 A ağır hizmet", "350 A heavy duty"],
  ["mig-torcu-mb38", "ZW-TRC-MB38", "Zenweld MB-38 MIG Torcu 4m", "mig-torclari", 2680,
    "400A kapasiteli, endüstriyel kullanım için 4 metre MIG torcu.", "400A 4 m MIG torch for industrial use.",
    "400 A endüstriyel kapasite", "400 A industrial capacity", "Güçlendirilmiş hortum paketi", "Reinforced cable assembly"],
  ["mig-torcu-mb401-su", "ZW-TRC-MB401W", "Zenweld MB-401 Su Soğutmalı MIG Torcu 3m", "mig-torclari", 4450,
    "400A kapasiteli, su soğutmalı 3 metre MIG torcu.", "Water-cooled 400A 3 m MIG torch.",
    "Su soğutma ile uzun süreli kaynak", "Long welding runs with water cooling", "Daha düşük torç sıcaklığı", "Lower torch temperature"],
  ["mig-torcu-mb501-su", "ZW-TRC-MB501W", "Zenweld MB-501 Su Soğutmalı MIG Torcu 4m", "mig-torclari", 5750,
    "500A kapasiteli, su soğutmalı 4 metre MIG torcu.", "Water-cooled 500A 4 m MIG torch.",
    "500 A sürekli kaynak kapasitesi", "500 A continuous welding capacity", "Robot ve otomasyona uygun", "Suitable for robot and automation"],
  ["mig-spool-gun-200", "ZW-TRC-SG200", "Zenweld SG-200 Spool Gun 4m", "mig-torclari", 6250,
    "Alüminyum kaynağı için makaralı besleme üniteli 4 metre torç.", "4 m spool gun with on-board feeder for aluminium welding.",
    "Alüminyum telde besleme sorunu yok", "No feeding issues with aluminium wire", "Entegre 1 kg makara", "Built-in 1 kg spool"],
  ["mig-push-pull-torc", "ZW-TRC-PP8", "Zenweld Push-Pull Alüminyum Torcu 8m", "mig-torclari", 12900,
    "Uzun mesafede alüminyum kaynağı için 8 metre push-pull torç.", "8 m push-pull torch for aluminium welding at distance.",
    "8 m uzaklıkta stabil tel akışı", "Stable wire feed at 8 m", "Alüminyum ve paslanmaz uyumlu", "For aluminium and stainless"],
  ["mig-torcu-kisa-boyun", "ZW-TRC-KB25", "Zenweld MB-25 Kısa Boyun Torç 2m", "mig-torclari", 1480,
    "Dar alanlarda çalışma için kısa boyunlu 2 metre MIG torcu.", "Short-neck 2 m MIG torch for confined spaces.",
    "Dar alanda rahat erişim", "Better access in tight spaces", "Standart MB-25 sarf uyumu", "Standard MB-25 consumables"],

  /* --- MIG > Sarf Malzemeleri (mevcut 2 + 7 = 9) --- */
  ["kontak-meme-seti-m8", "ZW-TIP-M8", "Zenweld Kontak Meme Seti M8 (20'li)", "mig-sarf-malzemeleri", 460,
    "MB-36 uyumlu, 1.0 / 1.2 mm ölçülerinde 20 adetlik kontak meme seti.", "20-piece M8 contact tip set in 1.0 / 1.2 mm for MB-36.",
    "MB-36 / MB-38 uyumlu", "Fits MB-36 / MB-38", "20 adetlik ekonomik paket", "Economical 20-piece pack"],
  ["gaz-dagitici-seti", "ZW-DIF-SET", "Zenweld Gaz Dağıtıcı (Difüzör) Seti (5'li)", "mig-sarf-malzemeleri", 390,
    "MB-25 uyumlu 5 adetlik gaz dağıtıcı seti.", "5-piece gas diffuser set for MB-25.",
    "Homojen gaz dağılımı", "Even gas distribution", "Isıya dayanıklı pirinç gövde", "Heat-resistant brass body"],
  ["tel-kilavuzu-3m", "ZW-LNR-3", "Zenweld Tel Kılavuzu (Liner) 3m 0.8-1.0 mm", "mig-sarf-malzemeleri", 320,
    "3 metre torçlar için çelik spiral tel kılavuzu.", "Steel liner for 3 m torches.",
    "Düzgün tel akışı", "Smooth wire feed", "0.8 – 1.0 mm tel uyumu", "For 0.8 – 1.0 mm wire"],
  ["tel-kilavuzu-4m", "ZW-LNR-4", "Zenweld Tel Kılavuzu (Liner) 4m 1.0-1.2 mm", "mig-sarf-malzemeleri", 380,
    "4 metre torçlar için çelik spiral tel kılavuzu.", "Steel liner for 4 m torches.",
    "Uzun torçta tel sıkışmasını önler", "Prevents wire jams in long torches", "1.0 – 1.2 mm tel uyumu", "For 1.0 – 1.2 mm wire"],
  ["makara-seti-v-kanal", "ZW-ROL-V", "Zenweld Çelik Makara Seti V Kanal 0.8/1.0", "mig-sarf-malzemeleri", 540,
    "Çelik tel besleme için V kanallı makara seti.", "V-groove drive roller set for steel wire.",
    "Sertleştirilmiş çelik", "Hardened steel", "Çift ölçü: 0.8 / 1.0 mm", "Dual size: 0.8 / 1.0 mm"],
  ["anti-spatter-sprey", "ZW-AS-400", "Zenweld Anti-Spatter Sprey 400 ml", "mig-sarf-malzemeleri", 210,
    "Nozul ve iş parçasında sıçrantı yapışmasını önleyen sprey.", "Spray that prevents spatter sticking to nozzle and workpiece.",
    "Nozul ömrünü uzatır", "Extends nozzle life", "Silikonsuz formül", "Silicone-free formula"],
  ["nozul-temizleme-seti", "ZW-CLN-SET", "Zenweld Nozul Temizleme Seti", "mig-sarf-malzemeleri", 290,
    "Nozul ve meme temizliği için eğe ve raybalardan oluşan set.", "File and reamer set for cleaning nozzles and tips.",
    "Sarf ömrünü uzatır", "Extends consumable life", "Çantalı 8 parça", "8 pieces in a pouch"],

  /* --- MIG > Yedek Parça (5) --- */
  ["mb25-torc-boynu", "ZW-SPR-N25", "Zenweld MB-25 Torç Boynu (Swan Neck)", "mig-yedek-parca", 890,
    "MB-25 torçlar için yedek eğik boyun.", "Replacement swan neck for MB-25 torches.",
    "Orijinal geometri", "Original geometry", "Tek parça değişim", "Single-part replacement"],
  ["mb36-torc-boynu", "ZW-SPR-N36", "Zenweld MB-36 Torç Boynu (Swan Neck)", "mig-yedek-parca", 1150,
    "MB-36 torçlar için yedek eğik boyun.", "Replacement swan neck for MB-36 torches.",
    "350 A kapasite", "350 A capacity", "Güçlendirilmiş bakır iç yapı", "Reinforced copper core"],
  ["torc-tetik-anahtari", "ZW-SPR-SW", "Zenweld Torç Tetik Anahtarı", "mig-yedek-parca", 240,
    "MB serisi torçlar için yedek tetik mikro anahtarı.", "Replacement trigger microswitch for MB-series torches.",
    "Tüm MB serisi uyumlu", "Fits all MB-series torches", "Kolay montaj", "Easy to fit"],
  ["euro-baglanti-adaptoru", "ZW-SPR-EU", "Zenweld Euro Bağlantı Adaptörü", "mig-yedek-parca", 560,
    "Torç ile makine arasında standart Euro bağlantı adaptörü.", "Standard Euro connector between torch and machine.",
    "Pirinç gövde", "Brass body", "Gaz sızdırmaz conta", "Gas-tight seal"],
  ["torc-govde-kulp-seti", "ZW-SPR-HG", "Zenweld MB-25 Torç Gövde ve Kulp Seti", "mig-yedek-parca", 720,
    "MB-25 torçlar için yedek gövde ve kulp seti.", "Replacement handle and body set for MB-25 torches.",
    "Isıya dayanıklı polimer", "Heat-resistant polymer", "Vidalı montaj", "Screw-fit assembly"],

  /* --- MAG > MAG Torçları (4) --- */
  ["mag-torcu-mb25", "ZW-TRC-MG25", "Zenweld MB-25 MAG Torcu 3m", "mag-torclari", 1650,
    "CO2 ve karışım gaz uygulamaları için 250A 3 metre MAG torcu.", "250A 3 m MAG torch for CO2 and mixed gas.",
    "CO2 ve karışım gaz uyumu", "For CO2 and mixed gas", "250 A kapasite", "250 A capacity"],
  ["mag-torcu-mb36", "ZW-TRC-MG36", "Zenweld MB-36 MAG Torcu 4m", "mag-torclari", 2350,
    "Ağır hizmet MAG uygulamaları için 350A 4 metre torç.", "350A 4 m torch for heavy-duty MAG work.",
    "Kalın kesitte yüksek verim", "High output on thick sections", "350 A ağır hizmet", "350 A heavy duty"],
  ["mag-torcu-mb501-su", "ZW-TRC-MG501W", "Zenweld MB-501 Su Soğutmalı MAG Torcu 4m", "mag-torclari", 5950,
    "Yoğun üretim için 500A su soğutmalı 4 metre MAG torcu.", "Water-cooled 500A 4 m MAG torch for high-volume production.",
    "Sürekli üretime uygun", "Built for continuous production", "Su soğutmalı gövde", "Water-cooled body"],
  ["mag-torcu-kisa-boyun", "ZW-TRC-MGKB", "Zenweld MAG Kısa Boyun Torç 3m", "mag-torclari", 1720,
    "Dar alanlarda MAG kaynağı için kısa boyunlu 3 metre torç.", "Short-neck 3 m torch for MAG welding in tight spaces.",
    "Dar alanda erişim", "Access in tight spaces", "Standart sarf uyumu", "Standard consumables"],

  /* --- MAG > Sarf Malzemeleri (3) --- */
  ["mag-gaz-nozulu-seti", "ZW-NZL-MG", "Zenweld CO2 Gaz Nozulu Seti (10'lu)", "mag-sarf-malzemeleri", 440,
    "MAG uygulamaları için 10 adetlik konik gaz nozulu seti.", "10-piece conical gas nozzle set for MAG work.",
    "Sıçrantıya dayanıklı kaplama", "Spatter-resistant coating", "10 adetlik paket", "10-piece pack"],
  ["mag-kontak-meme-cucrzr", "ZW-TIP-CZ", "Zenweld Kontak Meme Seti M6 CuCrZr (20'li)", "mag-sarf-malzemeleri", 520,
    "Yüksek akımda uzun ömürlü CuCrZr alaşımlı kontak meme seti.", "Long-life CuCrZr contact tip set for high current.",
    "Yüksek akımda uzun ömür", "Long life at high current", "CuCrZr alaşım", "CuCrZr alloy"],
  ["mag-difuzor-seti", "ZW-DIF-MG", "Zenweld MAG Difüzör Seti (5'li)", "mag-sarf-malzemeleri", 410,
    "MAG torçları için 5 adetlik gaz dağıtıcı seti.", "5-piece gas diffuser set for MAG torches.",
    "Dengeli gaz akışı", "Balanced gas flow", "Isıya dayanıklı", "Heat resistant"],

  /* --- TIG > Sarf Malzemeleri (6) --- */
  ["tungsten-wl15-24", "ZW-TNG-WL24", "Zenweld WL-15 Tungsten Elektrot 2.4 mm (10'lu)", "tig-sarf-malzemeleri", 890,
    "Altın renk kodlu, lantanlı tungsten elektrot, 10 adet.", "Gold-coded lanthanated tungsten electrode, 10 pieces.",
    "AC ve DC'de kullanılabilir", "Works on both AC and DC", "Kolay ark tutuşturma", "Easy arc starting"],
  ["tungsten-wc20-16", "ZW-TNG-WC16", "Zenweld WC-20 Tungsten Elektrot 1.6 mm (10'lu)", "tig-sarf-malzemeleri", 780,
    "Gri renk kodlu, seryumlu tungsten elektrot, 10 adet.", "Grey-coded ceriated tungsten electrode, 10 pieces.",
    "Düşük akımda kararlı ark", "Stable arc at low current", "İnce kesit için ideal", "Ideal for thin sections"],
  ["seramik-nozul-seti-wp26", "ZW-CUP-26", "Zenweld WP-26 Seramik Nozul Seti (10'lu)", "tig-sarf-malzemeleri", 460,
    "WP-26 torçlar için 4 – 8 numara seramik nozul seti.", "Size 4 – 8 ceramic cup set for WP-26 torches.",
    "4 – 8 numara karışık", "Mixed sizes 4 – 8", "Yüksek ısı dayanımı", "High heat resistance"],
  ["pens-seti-wp26", "ZW-COL-26", "Zenweld WP-26 Pens (Collet) Seti", "tig-sarf-malzemeleri", 380,
    "1.6 / 2.4 / 3.2 mm ölçülerinde pens ve pens gövdesi seti.", "Collet and collet body set in 1.6 / 2.4 / 3.2 mm.",
    "Üç ölçü tek sette", "Three sizes in one set", "Bakır alaşım", "Copper alloy"],
  ["gaz-lensi-seti-wp26", "ZW-GLN-26", "Zenweld WP-26 Gaz Lensi Seti", "tig-sarf-malzemeleri", 640,
    "Daha geniş ve düzgün gaz örtüsü için gaz lensi seti.", "Gas lens set for wider, smoother shielding coverage.",
    "Paslanmazda oksitlenmeyi azaltır", "Less oxidation on stainless", "Daha geniş gaz örtüsü", "Wider gas coverage"],
  ["arka-kapak-seti-wp26", "ZW-CAP-26", "Zenweld WP-26 Arka Kapak Seti (3'lü)", "tig-sarf-malzemeleri", 260,
    "Kısa, orta ve uzun boy arka kapaklardan oluşan set.", "Set of short, medium and long back caps.",
    "Üç boy bir arada", "Three lengths together", "Sızdırmaz o-ring", "Sealed with o-ring"],

  /* --- TIG > Yedek Parça (3) --- */
  ["wp26-torc-kafasi", "ZW-SPR-H26", "Zenweld WP-26 Torç Kafası", "tig-yedek-parca", 980,
    "WP-26 TIG torçlar için yedek torç kafası.", "Replacement torch head for WP-26 TIG torches.",
    "200 A hava soğutmalı", "200 A air-cooled", "Orijinal ölçü", "Original dimensions"],
  ["wp26-hortum-seti", "ZW-SPR-C26", "Zenweld WP-26 Hortum Seti 4m", "tig-yedek-parca", 1240,
    "WP-26 torçlar için 4 metre yedek kablo ve hortum paketi.", "4 m replacement cable and hose package for WP-26.",
    "Esnek kauçuk hortum", "Flexible rubber hose", "4 m tam takım", "Complete 4 m assembly"],
  ["wp17-torc-govdesi", "ZW-SPR-B17", "Zenweld WP-17 Torç Gövdesi", "tig-yedek-parca", 760,
    "WP-17 TIG torçlar için yedek gövde ve kulp.", "Replacement body and handle for WP-17 TIG torches.",
    "150 A hava soğutmalı", "150 A air-cooled", "Isıya dayanıklı kulp", "Heat-resistant handle"],
];

const demoPhotos = [
  stockPhotos.toolsFlatlay, stockPhotos.workshop, stockPhotos.metalWork,
  stockPhotos.industrialShop, stockPhotos.factoryLine,
];

demoAccessories.forEach(([slug, sku, name, cat, price, trShort, enShort, trA, enA, trB, enB], i) => {
  accessorySeeds.push({
    slug, sku, name,
    section: "aksesuarlar",
    categorySlug: cat,
    price,
    photo: demoPhotos[i % demoPhotos.length],
    short: { tr: trShort, en: enShort },
    highlights: [
      { tr: trA, en: enA },
      { tr: trB, en: enB },
    ],
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
    images: [{ url: PRODUCT_PHOTO, alt: { tr: a.name, en: a.name } }],
    specs: [
      { label: { tr: "Marka", en: "Brand" }, value: { tr: "Zenweld", en: "Zenweld" } },
      { label: { tr: "Ürün Kodu", en: "Product Code" }, value: { tr: a.sku, en: a.sku } },
      { label: { tr: "Menşei", en: "Origin" }, value: { tr: "Türkiye", en: "Türkiye" } },
    ],
    inTheBox: [{ tr: "1 x " + a.name, en: "1 x " + a.name }],
    highlights: a.highlights ?? [],
    inStock: i % 7 !== 0,
    quotable: true,
    featured: false,
    isNew: i < 2,
    warrantyMonths: 12,
    createdAt: now,
    updatedAt: now,
    active: true,
  });
});
