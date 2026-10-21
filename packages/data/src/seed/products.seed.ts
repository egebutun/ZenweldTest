import type { Product, ProductVariantGroup } from "../types";
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
/* 748x1064 PNG (519 KB) yerine 800 px webp (27 KB). Orijinal PNG dosyasi
   duruyor; webp desteklemeyen tarayici ProductImage uzerinden ona duser.
   Yeni gorsel eklendiginde: node scripts/optimize-images.mjs */
const PRODUCT_PHOTO = "/images/products/zenweld-urun.webp";

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const products: Product[] = [
  /* ------------------------------------------------------------ 1 */
  {
    id: "p-ultimate-250-mtc",
    slug: "ultimate-250-mtc",
    sku: "ZW-U250MTC",
    name: "Ultimate 250 MTC",
    modelCode: "Z05.02.25",
    section: "ekipmanlar",
    categorySlug: "cok-fonksiyonlu-kaynak-makineleri",
    processes: ["MIG", "MAG", "TIG", "MMA", "MULTI"],
    shortDescription: "D300 mm tel besleme ünitesi entegre, 250A gücünde monofaze multi-process inverter kaynak makinesi.",
    description: "Ultimate 250 MTC, D300 mm tel besleme ünitesi entegre edilmiş, güvenilir monofaze inverter kaynak makinesidir. 250A gücü ile farklı malzeme ve uygulamalarda profesyonel kaynak imkânı sunar. Tek buton ile MIG, MMA veya TIG DC kaynak yöntemleri arasında geçiş yapılabilir. Karbon çelikleri, paslanmaz çelikler ve alüminyum alaşımları dâhil pek çok metalde kullanılabilir. Kutup değiştirme özelliği sayesinde özel alaşımlı tellerle (DCEN) çalışmaya olanak tanır. Hafif ve akıllı tasarımı, zorlu koşullarda dahi taşınabilir kullanım sağlar. Hafif sanayi, bakım-onarım hizmetleri, hobi kullanımı ve küçük atölye işletmeleri için uygundur.",
    priceExVat: 41500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MIG / MAG / MMA / TIG DC" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "30 – 250 A" },
      { label: "Devrede Kalma (40°C)", value: "%60 @ 250 A" },
      { label: "Tel Besleme", value: "Entegre, D300 mm makara" },
      { label: "Tel Çapı", value: "0.8 – 1.2 mm" },
      { label: "Kutup Değiştirme (DCEN)", value: "Var" },
      { label: "Koruma Sınıfı", value: "IP21S" },
      { label: "Ağırlık", value: "~ 24 kg" },
    ],
    inTheBox: [
      "1 x Ultimate 250 MTC Ana Ünite",
      "1 x 3 m MIG Torcu",
      "1 x 3 m Şase Kablosu ve Pensesi",
      "1 x 3 m Elektrot Pensesi",
      "1 x Argon Regülatörü",
      "1 x 1.8 m Gaz Hortumu",
      "2 x 0.8-1.0 mm V Kanal Makara",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "Tek butonla MIG / MMA / TIG geçişi",
      "Entegre D300 mm tel besleme ünitesi",
      "DCEN kutup değiştirme özelliği",
      "Monofaze şebekede 250 A performans",
    ],
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
    name: "Ultimate 255 MTC",
    modelCode: "Z05.02.55",
    section: "ekipmanlar",
    categorySlug: "mig-gazalti-kaynak-makineleri",
    processes: ["MIG", "MAG", "MMA", "TIG"],
    shortDescription: "Senkron kontrol panelli, 255A gücünde gazaltı kaynak makinesi. Ağır hizmet atölye kullanımı için.",
    description: "Ultimate 255 MTC, senkron (synergic) kontrol paneli sayesinde tel çapı ve malzeme seçimine göre kaynak parametrelerini otomatik ayarlar. Yüksek devrede kalma oranıyla sürekli üretim yapan atölyeler için tasarlanmıştır. Karbon çeliği, paslanmaz ve alüminyum uygulamalarında istikrarlı ark sunar.",
    priceExVat: 48900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MIG / MAG / MMA / TIG DC" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "30 – 255 A" },
      { label: "Devrede Kalma (40°C)", value: "%60 @ 255 A" },
      { label: "Kontrol", value: "Senkron (Synergic)" },
      { label: "Tel Çapı", value: "0.8 – 1.2 mm" },
      { label: "Ağırlık", value: "~ 26 kg" },
    ],
    inTheBox: [
      "1 x Ultimate 255 MTC Ana Ünite",
      "1 x 3 m MIG Torcu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Argon Regülatörü",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "Senkron kontrol paneli",
      "Yüksek devrede kalma oranı",
      "Alüminyum uyumlu tel besleme",
    ],
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
    name: "Ultimate 355 MTC",
    modelCode: "Z05.03.55",
    section: "ekipmanlar",
    categorySlug: "mig-gazalti-kaynak-makineleri",
    processes: ["MIG", "MAG", "MMA"],
    shortDescription: "Trifaze 355A gazaltı kaynak makinesi. Ağır sanayi ve sürekli üretim için endüstriyel çözüm.",
    description: "Ultimate 355 MTC, trifaze şebekede 355A'e kadar kaynak akımı sunan endüstriyel sınıf bir gazaltı kaynak makinesidir. Ayrı tel besleme ünitesi ve uzatılabilir ara kablo seçeneğiyle büyük parçalarda çalışma kolaylığı sağlar. Ağır sanayi, çelik konstrüksiyon ve seri imalat uygulamaları için tasarlanmıştır.",
    priceExVat: 96500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MIG / MAG / MMA" },
      { label: "Şebeke Gerilimi", value: "380 V ± %15, 3 faz" },
      { label: "Kaynak Akım Aralığı", value: "40 – 355 A" },
      { label: "Devrede Kalma (40°C)", value: "%60 @ 355 A" },
      { label: "Tel Besleme", value: "Ayrı ünite, 4 makaralı" },
      { label: "Ağırlık", value: "~ 52 kg" },
    ],
    inTheBox: [
      "1 x Ultimate 355 MTC Ana Ünite",
      "1 x Tel Besleme Ünitesi",
      "1 x 3 m MIG Torcu",
      "1 x 5 m Ara Kablo Seti",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "Trifaze endüstriyel güç",
      "Ayrı tel besleme ünitesi",
      "Seri imalat için yüksek dayanım",
    ],
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
    name: "Ultimate 205 MTE Pro",
    modelCode: "Z05.02.05",
    section: "ekipmanlar",
    categorySlug: "mig-gazalti-kaynak-makineleri",
    processes: ["MIG", "MAG", "MMA", "TIG"],
    shortDescription: "Kompakt gövdeli, 200A sınıfı taşınabilir MIG kaynak makinesi. Servis ve saha işleri için ideal.",
    description: "Ultimate 205 MTE Pro, kompakt gövdesi ve düşük ağırlığı ile saha ve servis işlerinde öne çıkan bir MIG kaynak makinesidir. Monofaze şebekede çalışır, D200 mm makara kullanır ve gazsız (özlü tel) kaynağa da uygundur. Bakım-onarım, oto sanayi ve hafif imalat uygulamaları için uygundur.",
    priceExVat: 28900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MIG / MAG / MMA / TIG DC" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "30 – 200 A" },
      { label: "Makara Kapasitesi", value: "D200 mm" },
      { label: "Gazsız Kaynak", value: "Destekler" },
      { label: "Ağırlık", value: "~ 15 kg" },
    ],
    inTheBox: [
      "1 x Ultimate 205 MTE Pro Ana Ünite",
      "1 x 3 m MIG Torcu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "15 kg kompakt gövde",
      "Gazlı ve gazsız kaynak",
      "Saha ve servis için taşınabilir",
    ],
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
    name: "Evomig 205 P Pulse MIG",
    modelCode: "Z06.02.05",
    section: "ekipmanlar",
    categorySlug: "mig-gazalti-kaynak-makineleri",
    processes: ["PULSE", "MIG", "MAG", "TIG", "MMA", "MULTI"],
    shortDescription: "Pulse ve Double Pulse destekli, renkli ekranlı sinerjik MIG kaynak makinesi. Alüminyumda üstün görünüm.",
    description: "Evomig 205 P, pulse ve double pulse kaynak modları ile ince sacta çarpılmayı ve sıçrantıyı minimuma indirir. Renkli ekranlı sinerjik arayüzü sayesinde malzeme, tel çapı ve gaz seçimi yapıldığında tüm parametreler otomatik olarak ayarlanır. Özellikle alüminyum ve paslanmaz uygulamalarında dekoratif, pul pul kaynak dikişi elde edilir.",
    priceExVat: 64900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "Pulse MIG / Double Pulse / MIG / MAG / TIG / MMA" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "30 – 200 A" },
      { label: "Ekran", value: "Renkli TFT, sinerjik" },
      { label: "Hafıza", value: "Kullanıcı program hafızası" },
      { label: "Ağırlık", value: "~ 21 kg" },
    ],
    inTheBox: [
      "1 x Evomig 205 P Ana Ünite",
      "1 x 3 m MIG Torcu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Argon Regülatörü",
      "2 x U Kanal Alüminyum Makarası",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "Pulse ve Double Pulse modları",
      "Renkli sinerjik ekran",
      "Alüminyumda dekoratif dikiş",
      "Minimum sıçrantı",
    ],
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
    name: "Ultimate 205 AC/DC TIG",
    modelCode: "Z04.02.05",
    section: "ekipmanlar",
    categorySlug: "tig-argon-kaynak-makineleri",
    processes: ["TIG", "MMA"],
    shortDescription: "AC/DC TIG kaynak makinesi. Alüminyum ve alaşımlarında hassas kaynak için pulse ve dalga formu kontrolü.",
    description: "Ultimate 205 AC/DC TIG, alüminyum ve alaşımlarının kaynağı için AC modu, çelik ve paslanmaz için DC modu sunar. Ayarlanabilir AC frekansı, temizleme dengesi ve pulse fonksiyonu ile ince parçalarda dahi tam kontrol sağlar. HF ateşleme ve ayak pedalı desteği ile hassas işçilik gerektiren uygulamalar için tasarlanmıştır.",
    priceExVat: 52900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "AC/DC TIG / MMA" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "10 – 200 A" },
      { label: "AC Frekansı", value: "20 – 200 Hz" },
      { label: "Temizleme Dengesi", value: "Ayarlanabilir" },
      { label: "Ateşleme", value: "HF (Yüksek Frekans)" },
      { label: "Pedal Desteği", value: "Var" },
      { label: "Ağırlık", value: "~ 23 kg" },
    ],
    inTheBox: [
      "1 x Ultimate 205 AC/DC Ana Ünite",
      "1 x 4 m TIG Torcu (WP-26)",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Elektrot Pensesi",
      "1 x Argon Regülatörü",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "AC modunda alüminyum kaynağı",
      "Ayarlanabilir AC frekansı ve denge",
      "Pulse TIG fonksiyonu",
    ],
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
    name: "Ultimate TH 200",
    modelCode: "Z04.01.20",
    section: "ekipmanlar",
    categorySlug: "tig-argon-kaynak-makineleri",
    processes: ["TIG", "MMA"],
    shortDescription: "DC TIG / MMA inverter kaynak makinesi. HF ateşlemeli, hafif ve taşınabilir gövde.",
    description: "Ultimate TH 200, çelik ve paslanmaz uygulamaları için DC TIG ve MMA kaynak yöntemlerini tek gövdede sunar. HF ateşleme sayesinde tungsten elektrot iş parçasına temas etmeden ark başlatılır; böylece kaynak bölgesinde kirlenme önlenir. Hafif yapısı ile saha ve bakım işlerinde rahat taşınır.",
    priceExVat: 24500,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "DC TIG / MMA" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "10 – 200 A" },
      { label: "Ateşleme", value: "HF (Yüksek Frekans)" },
      { label: "Devrede Kalma (40°C)", value: "%60 @ 200 A" },
      { label: "Ağırlık", value: "~ 9 kg" },
    ],
    inTheBox: [
      "1 x Ultimate TH 200 Ana Ünite",
      "1 x 4 m TIG Torcu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Elektrot Pensesi",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "9 kg ultra hafif gövde",
      "HF ateşleme ile temiz ark başlangıcı",
      "TIG ve MMA tek makinede",
    ],
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
    name: "ARC 200",
    modelCode: "Z03.01.15",
    section: "ekipmanlar",
    categorySlug: "mma-ortulu-elektrod-kaynak-makineleri",
    processes: ["MMA"],
    shortDescription: "200A örtülü elektrot (MMA) inverter kaynak makinesi. Dış mekan ve genel imalat için gaz gerektirmez.",
    description: "Zenweld ARC 200, inverter teknolojisi sayesinde klasik trafolu makinelere göre çok daha hafif ve verimli çalışan bir örtülü elektrot kaynak makinesidir. Gaz kullanmadığı için açık havada ve rüzgârlı ortamlarda kaynak yapılabilir. Hot Start, Arc Force ve Anti-Stick fonksiyonları ile elektrot yapışmasını önler ve istikrarlı bir ark sağlar.",
    priceExVat: 9900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MMA (Örtülü Elektrot)" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "20 – 200 A" },
      { label: "Elektrot Çapı", value: "2.0 – 4.0 mm" },
      { label: "Fonksiyonlar", value: "Hot Start / Arc Force / Anti-Stick" },
      { label: "Ağırlık", value: "~ 5 kg" },
    ],
    inTheBox: [
      "1 x ARC 200 Ana Ünite",
      "1 x Elektrot Pensesi ve Kablosu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Taşıma Askısı",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "5 kg, tek elle taşınabilir",
      "Gaz gerektirmez — dış mekan kaynağı",
      "Hot Start / Arc Force / Anti-Stick",
    ],
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
    name: "ARC 120",
    modelCode: "Z03.01.12",
    section: "ekipmanlar",
    categorySlug: "mma-ortulu-elektrod-kaynak-makineleri",
    processes: ["MMA"],
    shortDescription: "Hobi ve bakım-onarım işleri için giriş seviyesi 120A örtülü elektrot inverter kaynak makinesi.",
    description: "ARC 120, ev tipi şebekede rahatlıkla çalışan, hobi kullanıcıları ve küçük bakım-onarım işleri için tasarlanmış giriş seviyesi bir inverter kaynak makinesidir. Kompakt boyutu ve düşük ağırlığı ile alet çantasında taşınabilir.",
    priceExVat: 5900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MMA (Örtülü Elektrot)" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "20 – 120 A" },
      { label: "Elektrot Çapı", value: "2.0 – 3.2 mm" },
      { label: "Ağırlık", value: "~ 3.5 kg" },
    ],
    inTheBox: [
      "1 x ARC 120 Ana Ünite",
      "1 x Elektrot Pensesi ve Kablosu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "Giriş seviyesi, ekonomik",
      "3.5 kg kompakt gövde",
      "Ev tipi şebekede çalışır",
    ],
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
    name: "Ultimate ARC 200 S",
    modelCode: "Z03.02.00",
    section: "ekipmanlar",
    categorySlug: "mma-ortulu-elektrod-kaynak-makineleri",
    processes: ["MMA", "TIG"],
    shortDescription: "Profesyonel kullanım için yüksek devrede kalma oranlı 200A MMA / Lift TIG kaynak makinesi.",
    description: "Ultimate ARC 200 S, profesyonel kullanıcılar için yüksek devrede kalma oranı ve güçlendirilmiş soğutma sistemiyle geliştirilmiştir. Lift TIG özelliği sayesinde ek bir makineye ihtiyaç duymadan hassas TIG işleri de yapılabilir. Selülozik elektrotlarla boru kaynağına uygundur.",
    priceExVat: 14900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kaynak Yöntemi", value: "MMA / Lift TIG" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kaynak Akım Aralığı", value: "20 – 200 A" },
      { label: "Devrede Kalma (40°C)", value: "%80 @ 200 A" },
      { label: "Selülozik Elektrot", value: "Uygun" },
      { label: "Ağırlık", value: "~ 7 kg" },
    ],
    inTheBox: [
      "1 x Ultimate ARC 200 S Ana Ünite",
      "1 x Elektrot Pensesi ve Kablosu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Taşıma Askısı",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "%80 devrede kalma oranı",
      "Lift TIG desteği",
      "Selülozik elektrot uyumlu",
    ],
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
    name: "Multicut 40 CNC",
    modelCode: "Z07.01.40",
    section: "ekipmanlar",
    categorySlug: "plazma-kesim-makineleri",
    processes: ["PLAZMA"],
    shortDescription: "Monofaze 40A plazma kesme makinesi. 14 mm temiz kesim, CNC bağlantı çıkışı ve PFC modülü.",
    description: "Multicut 40 CNC, monofaze giriş gerilimi ile çalışan ve yüksek devrede kalma oranıyla maksimum 40 Amper'e kadar kesim yapabilen bir plazma kesme makinesidir. Otomasyon sistemlerine adapte edilebilen CNC bağlantı çıkışı bulunur. Yüksek frekanssız çalışma yöntemi ve koruma sistemi üst düzey güvenlik sağlar. IGBT teknolojisi üstün performanslı kesme arkı oluşturur; PFC modülü sayesinde düşük enerji tüketimi ve mükemmel kesme arkı kontrolü sunar. Karbon çeliği, galvanizli çelik, paslanmaz çelik, döküm malzemeler, alüminyum ve alaşımlarının kesiminde kullanılır. 14 mm temiz kesim ve 20 mm oluk açma performansına sahiptir.",
    priceExVat: 32900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kesme Yöntemi", value: "Plazma Kesme" },
      { label: "Şebeke Gerilimi", value: "220 V ± %15, 1 faz" },
      { label: "Kesme Akımı", value: "20 – 40 A" },
      { label: "Temiz Kesim", value: "14 mm" },
      { label: "Oluk Açma", value: "20 mm" },
      { label: "CNC Çıkışı", value: "Var" },
      { label: "Ateşleme", value: "Yüksek frekanssız (Blowback)" },
      { label: "PFC Modülü", value: "Var" },
      { label: "Ağırlık", value: "~ 12 kg" },
    ],
    inTheBox: [
      "1 x Multicut 40 CNC Ana Ünite",
      "1 x 6 m Plazma Torcu",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Hava Regülatörü ve Filtresi",
      "5 x Yedek Elektrot ve Meme",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "14 mm temiz kesim performansı",
      "Otomasyon için CNC bağlantı çıkışı",
      "Yüksek frekanssız güvenli ateşleme",
      "PFC ile düşük enerji tüketimi",
    ],
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
    name: "Multicut 60 S",
    modelCode: "Z07.02.60",
    section: "ekipmanlar",
    categorySlug: "plazma-kesim-makineleri",
    processes: ["PLAZMA"],
    shortDescription: "Trifaze, kompakt ve taşınabilir 60A plazma kesme makinesi. 18 mm temiz kesim, 25 mm oluk açma.",
    description: "Multicut 60 S, taşınabilir ve kompakt yapıda trifaze bir plazma kesme makinesidir. Merkezi bağlantı, yüksek frekanssız çalışma yöntemi ve koruma sistemi üst düzey güvenlik sağlar. 18 mm temiz kesim ve 25 mm oluk açma performansı sunar. Otomasyona uygun CNC bağlantı çıkışı bulunur.",
    priceExVat: 58900,
    vatRate: 20,
    currency: "TRY",
    images: [{ url: PRODUCT_PHOTO, alt: "Zenweld ürün görseli" }],
    specs: [
      { label: "Kesme Yöntemi", value: "Plazma Kesme" },
      { label: "Şebeke Gerilimi", value: "380 V ± %15, 3 faz" },
      { label: "Kesme Akımı", value: "20 – 60 A" },
      { label: "Temiz Kesim", value: "18 mm" },
      { label: "Oluk Açma", value: "25 mm" },
      { label: "Torç Bağlantısı", value: "Merkezi bağlantı" },
      { label: "CNC Çıkışı", value: "Var" },
      { label: "Ağırlık", value: "~ 18 kg" },
    ],
    inTheBox: [
      "1 x Multicut 60 S Ana Ünite",
      "1 x 6 m Plazma Torcu (merkezi bağlantı)",
      "1 x Şase Kablosu ve Pensesi",
      "1 x Hava Regülatörü ve Filtresi",
      "1 x Kullanım Kılavuzu",
    ],
    highlights: [
      "18 mm temiz kesim / 25 mm oluk açma",
      "Merkezi torç bağlantısı",
      "Trifaze endüstriyel güç",
    ],
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
  short: string;
  /** Menu kartinda gorunen 1-2 satislik ozellik */
  highlights?: string[];
}

const accessorySeeds: AccessorySeed[] = [
  { slug: "zenmask-auto-9000", sku: "ZW-MASK9000", name: "ZenMask Auto 9000", section: "guvenlik", categorySlug: "otomatik-kararan-bas-maskeleri", price: 3450, photo: stockPhotos.welderAtWork, short: "Gerçek renk teknolojili otomatik kararan kaynak maskesi, 4 sensörlü.", highlights: ["Gerçek renk (True Color) görüş", "4 sensörlü, 1/25000 sn tepki", "DIN 5-13 kademesiz ayar"] },
  { slug: "zenmask-basic-500", sku: "ZW-MASK500", name: "ZenMask Basic 500", section: "guvenlik", categorySlug: "otomatik-kararan-bas-maskeleri", price: 1290, photo: stockPhotos.workshop, short: "Giriş seviyesi otomatik kararan kaynak maskesi, 2 sensörlü.", highlights: ["Giriş seviyesi, hafif kask", "2 sensörlü otomatik kararma", "Değiştirilebilir ön cam"] },
  { slug: "kaynak-eldiveni-pro", sku: "ZW-GLV-PRO", name: "Pro Kaynak Eldiveni", section: "guvenlik", categorySlug: "kaynak-eldivenleri", price: 480, photo: stockPhotos.toolsFlatlay, short: "Sığır derisi, kevlar dikişli, ısıya dayanıklı kaynak eldiveni.", highlights: ["Sığır derisi, kevlar dikiş", "Isıya ve kıvılcıma dayanıklı", "Astarlı, uzun manşetli"] },
  { slug: "kaynak-onlugu-deri", sku: "ZW-APR-01", name: "Deri Kaynak Önlüğü", section: "guvenlik", categorySlug: "kaynak-onlukleri", price: 890, photo: stockPhotos.industrialShop, short: "Kıvılcıma ve ısıya dayanıklı tam boy deri kaynak önlüğü.", highlights: ["Tam boy deri koruma", "Ayarlanabilir omuz askısı", "Kıvılcım ve cüruf geçirmez"] },
  { slug: "mig-torcu-mb25", sku: "ZW-TRC-MB25", name: "MB-25 MIG Torcu", section: "aksesuarlar", categorySlug: "mig-torclari", price: 1650, photo: stockPhotos.toolsFlatlay, short: "250A kapasiteli, Euro bağlantılı MIG kaynak torcu. 3, 4 ve 5 metre seçenekleriyle.", highlights: ["250 A / %60 devrede kalma", "Euro bağlantılı hortum", "Yaygın sarf malzeme bulunabilirliği"] },
  { slug: "mig-torcu-mb36", sku: "ZW-TRC-MB36", name: "MB-36 MIG Torcu 4m", section: "aksesuarlar", categorySlug: "mig-torclari", price: 2350, photo: stockPhotos.workshop, short: "350A kapasiteli, 4 metre ağır hizmet MIG kaynak torcu.", highlights: ["350 A ağır hizmet kapasitesi", "4 m uzun erişim", "Kalın kesitte sürekli kaynak"] },
  { slug: "tig-torcu-wp26", sku: "ZW-TRC-WP26", name: "WP-26 TIG Torcu 4m", section: "aksesuarlar", categorySlug: "tig-torclari", price: 1980, photo: stockPhotos.metalWork, short: "Hava soğutmalı, 200A kapasiteli 4 metre TIG kaynak torcu.", highlights: ["200 A hava soğutmalı", "4 m esnek hortum paketi", "Standart WP-26 sarf uyumu"] },
  { slug: "gaz-nozulu-seti", sku: "ZW-NZL-SET", name: "Gaz Nozulu Seti (10'lu)", section: "aksesuarlar", categorySlug: "mig-torc-sarf-malzemeleri", price: 420, photo: stockPhotos.toolsFlatlay, short: "MB-25 uyumlu 10 adetlik gaz nozulu seti.", highlights: ["MB-25 torçlarla uyumlu", "10 adetlik ekonomik paket", "Bakır gövde, uzun ömür"] },
  { slug: "kontak-meme-seti", sku: "ZW-TIP-SET", name: "Kontak Meme Seti M6 (20'li)", section: "aksesuarlar", categorySlug: "mig-torc-sarf-malzemeleri", price: 380, photo: stockPhotos.workshop, short: "0.8 / 1.0 / 1.2 mm ölçülerinde 20 adetlik kontak meme seti.", highlights: ["0.8 / 1.0 / 1.2 mm karışık", "M6 diş, MB-25 uyumlu", "20 adetlik paket"] },
  { slug: "gazalti-teli-sg2-08", sku: "ZW-WIRE-SG208", name: "SG2 Gazaltı Teli 0.8 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "karbonlu-celik-mig-telleri", price: 1450, photo: stockPhotos.metalWork, short: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", highlights: ["Bakır kaplı SG2 kalite", "0.8 mm, 15 kg makara", "Düşük sıçrantı, düzgün dikiş"] },
  { slug: "gazalti-teli-sg2-10", sku: "ZW-WIRE-SG210", name: "SG2 Gazaltı Teli 1.0 mm (15 kg)", section: "dolgu-metalleri", categorySlug: "karbonlu-celik-mig-telleri", price: 1420, photo: stockPhotos.factoryLine, short: "Bakır kaplı SG2 kalite gazaltı kaynak teli, 15 kg makara.", highlights: ["Bakır kaplı SG2 kalite", "1.0 mm, 15 kg makara", "Kalın kesitte yüksek verim"] },
  { slug: "tig-cubugu-308l", sku: "ZW-ROD-308L", name: "308L Paslanmaz TIG Çubuğu 2.4 mm", section: "dolgu-metalleri", categorySlug: "paslanmaz-celik-tig-telleri", price: 2250, photo: stockPhotos.blueprint, short: "304/308 paslanmaz çelik kaynağı için 5 kg'lık TIG çubuğu paketi.", highlights: ["304 / 308 paslanmaz için", "2.4 mm, 5 kg paket", "Korozyona dayanıklı dikiş"] },
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
  short: string, a: string, b: string, c: string];

const demoAccessories: Demo[] = [
  /* --- MIG Aksesuarları > MIG Torçları --- */
  ["mig-torcu-mb15", "ZW-TRC-MB15", "MB-15 MIG Torcu 3m", "mig-torclari", 980,
    "180A kapasiteli, hafif gövdeli 3 metre MIG torcu.",
    "İnce sacta kolay kullanım", "Hafif gövde, 180 A", "Değiştirilebilir kısa boyun"],
  ["mig-torcu-mb24", "ZW-TRC-MB24", "MB-24 MIG Torcu 3m", "mig-torclari", 1320,
    "250A kapasiteli, Euro bağlantılı 3 metre MIG torcu.",
    "Euro bağlantı standardı", "250 A / %60 devrede kalma", "Yaygın sarf bulunabilirliği"],
  ["mig-torcu-mb25-4m", "ZW-TRC-MB25-4", "MB-25 MIG Torcu 4m", "mig-torclari", 1890,
    "250A kapasiteli, 4 metre uzun erişimli MIG torcu.",
    "4 m ile geniş çalışma alanı", "MB-25 sarf uyumu", "Ergonomik kavrama kulpu"],
  ["mig-torcu-mb36-3m", "ZW-TRC-MB36-3", "MB-36 MIG Torcu 3m", "mig-torclari", 2050,
    "350A kapasiteli, ağır hizmet 3 metre MIG torcu.",
    "Kalın kesitte sürekli kaynak", "350 A ağır hizmet", "Güçlendirilmiş hortum paketi"],
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

const demoPhotos = [
  stockPhotos.toolsFlatlay, stockPhotos.workshop, stockPhotos.metalWork,
  stockPhotos.industrialShop, stockPhotos.factoryLine,
];

demoAccessories.forEach(([slug, sku, name, cat, price, short, a, b, c], i) => {
  accessorySeeds.push({
    slug, sku, name,
    section: "aksesuarlar",
    categorySlug: cat,
    price,
    photo: demoPhotos[i % demoPhotos.length],
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
    featured: false,
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
  "arc-200": 20,
  "multicut-40-cnc": 10,
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
  "ultimate-th-200",
  "ultimate-arc-200-s",
  "multicut-40-cnc",
  "zenmask-auto-9000",
  "zenmask-basic-500",
  "tig-torcu-wp26",
]);

products.forEach((p) => {
  if (NEW_ARRIVALS.has(p.slug)) p.isNew = true;
  const percent = HOT_SALE[p.slug];
  if (percent) {
    // Urunde NORMAL fiyat saklanir, indirim gosterimde uygulanir.
    // Yukaridaki fiyatlar musterinin odedigi (indirimli) tutarlar olarak
    // yazilmisti; ekranda ayni tutarlar gorunsun diye normal fiyat
    // bunlardan geri hesaplanir.
    p.priceExVat = Math.round(p.priceExVat / (1 - percent / 100) / 10) * 10;
    p.discount = { percent };
  }
});

/* ------------------------------------------------------------------ */
/* Secenekli urunler (varyantlar)                                      */
/*                                                                     */
/* Ornek: MB-25 MIG torcu 3 / 4 / 5 metre secenekleriyle satiliyor.    */
/* Secenek degisince fiyat, urun kodu ve "Hortum Uzunlugu" teknik      */
/* satiri degisiyor; bayi bulunurlugu da varyant bazli tutuluyor       */
/* (bkz. stock.seed.ts).                                               */
/*                                                                     */
/* Yeni bir secenekli urun icin buraya bir kayit eklemek yeterli.      */
/* ------------------------------------------------------------------ */
const VARIANT_GROUPS: Record<string, ProductVariantGroup[]> = {
  "mig-torcu-mb25": [
    {
      id: "hortum-uzunlugu",
      label: "Hortum Uzunluğu",
      options: [
        {
          id: "3m",
          label: "3 metre",
          priceDeltaExVat: 0,
          sku: "ZW-TRC-MB25-3",
          specOverrides: [
            { label: "Hortum Uzunluğu", value: "3 m" },
            { label: "Ağırlık", value: "1,9 kg" },
          ],
        },
        {
          id: "4m",
          label: "4 metre",
          priceDeltaExVat: 240,
          sku: "ZW-TRC-MB25-4",
          specOverrides: [
            { label: "Hortum Uzunluğu", value: "4 m" },
            { label: "Ağırlık", value: "2,3 kg" },
          ],
        },
        {
          id: "5m",
          label: "5 metre",
          priceDeltaExVat: 460,
          sku: "ZW-TRC-MB25-5",
          specOverrides: [
            { label: "Hortum Uzunluğu", value: "5 m" },
            { label: "Ağırlık", value: "2,7 kg" },
          ],
        },
      ],
    },
  ],
};

products.forEach((p) => {
  const groups = VARIANT_GROUPS[p.slug];
  if (groups) p.variantGroups = groups;
});

// Kategori icindeki sira: bu dosyadaki siraya gore 1, 2, 3 ... (panelden degisir).
const lastOrder = new Map<string, number>();
products.forEach((p) => {
  p.order = (lastOrder.get(p.categorySlug) ?? 0) + 1;
  lastOrder.set(p.categorySlug, p.order);
});
