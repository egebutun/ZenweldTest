import type { Category, CategoryGroup } from "../types";

/**
 * URUN KATEGORILERI
 *
 * Zenweld'in onayli kategori agaci (Ekim 2026). Uc seviye:
 *   1      ust bolum   (ekipmanlar, guvenlik ...) -> ana menu
 *   1.1    grup        -> mega menude sol kolon, /ekipmanlar?grup=<slug>
 *   1.1.1  kategori    -> /ekipmanlar/<slug>; urunler buraya baglanir
 *
 * "code" alani kategori tablosundaki numaradir (siralama da buna gore).
 * Bir kategoride urun olmak zorunda degil; urunler belli oldukca eklenir.
 */

export const categoryGroups: CategoryGroup[] = [
  { id: "g1.1", code: "1.1", slug: "lazer-makinalari", section: "ekipmanlar", name: { tr: "Lazer Makinaları", en: "Laser Machines" }, order: 1 },
  { id: "g1.2", code: "1.2", slug: "kaynak-makinalari", section: "ekipmanlar", name: { tr: "Kaynak Makinaları", en: "Welding Machines" }, order: 2 },

  { id: "g2.1", code: "2.1", slug: "kaynak-maskeleri", section: "guvenlik", name: { tr: "Kaynak Maskeleri", en: "Welding Helmets" }, order: 1 },
  { id: "g2.2", code: "2.2", slug: "koruyucu-giyim", section: "guvenlik", name: { tr: "Koruyucu Giyim", en: "Protective Clothing" }, order: 2 },

  { id: "g3.1", code: "3.1", slug: "mig-aksesuarlari", section: "aksesuarlar", name: { tr: "MIG Aksesuarları", en: "MIG Accessories" }, order: 1 },
  { id: "g3.2", code: "3.2", slug: "tig-aksesuarlari", section: "aksesuarlar", name: { tr: "TIG Aksesuarları", en: "TIG Accessories" }, order: 2 },
  { id: "g3.3", code: "3.3", slug: "mma-aksesuarlari", section: "aksesuarlar", name: { tr: "MMA Aksesuarları", en: "MMA Accessories" }, order: 3 },
  { id: "g3.4", code: "3.4", slug: "plazma-kesme-aksesuarlari", section: "aksesuarlar", name: { tr: "Plazma Kesme Aksesuarları", en: "Plasma Cutting Accessories" }, order: 4 },
  { id: "g3.5", code: "3.5", slug: "diger-aksesuarlar", section: "aksesuarlar", name: { tr: "Diğer Aksesuarlar", en: "Other Accessories" }, order: 5 },

  { id: "g4.1", code: "4.1", slug: "mig-telleri", section: "dolgu-metalleri", name: { tr: "MIG Telleri", en: "MIG Wires" }, order: 1 },
  { id: "g4.2", code: "4.2", slug: "tig-telleri", section: "dolgu-metalleri", name: { tr: "TIG Telleri", en: "TIG Wires" }, order: 2 },
];

export const categories: Category[] = [
  {
    id: "c1.1.1", code: "1.1.1", slug: "lazer-kaynak-makinalari", section: "ekipmanlar", group: "lazer-makinalari", order: 1,
    name: { tr: "Lazer Kaynak Makinaları", en: "Laser Welding Machines" },
    description: { tr: "Yüksek hızda, düşük ısı girdisiyle temiz ve ince dikişli kaynak.", en: "Fast welding with low heat input and clean, fine beads." },
  },
  {
    id: "c1.1.2", code: "1.1.2", slug: "lazer-temizleme", section: "ekipmanlar", group: "lazer-makinalari", order: 2,
    name: { tr: "Lazer Temizleme", en: "Laser Cleaning" },
    description: { tr: "Pas, boya ve oksiti yüzeye zarar vermeden kimyasalsız temizleyin.", en: "Remove rust, paint and oxide without chemicals or surface damage." },
  },
  {
    id: "c1.1.3", code: "1.1.3", slug: "lazer-markalama", section: "ekipmanlar", group: "lazer-makinalari", order: 3,
    name: { tr: "Lazer Markalama", en: "Laser Marking" },
    description: { tr: "Metal yüzeylere kalıcı, hassas yazı, logo ve kod işleme.", en: "Permanent, precise text, logos and codes on metal surfaces." },
  },
  {
    id: "c1.2.1", code: "1.2.1", slug: "mma-ortulu-elektrod-kaynak-makinalari", section: "ekipmanlar", group: "kaynak-makinalari", order: 1,
    name: { tr: "MMA (Stick) Örtülü Elektrod Kaynak Makinaları", en: "MMA (Stick) Welding Machines" },
    description: { tr: "Gaz kullanmadan dış mekan kaynağı ve genel imalat için ideal.", en: "Ideal for outdoor welding and general fabrication without gas." },
  },
  {
    id: "c1.2.2", code: "1.2.2", slug: "tig-argon-kaynak-makinalari", section: "ekipmanlar", group: "kaynak-makinalari", order: 2,
    name: { tr: "TIG (GTAW) Argon Kaynak Makinaları", en: "TIG (GTAW) Welding Machines" },
    description: { tr: "Alüminyum dahil metallerde hassas kaynak işleri için ideal.", en: "Ideal for precision welding on metals including aluminium." },
  },
  {
    id: "c1.2.3", code: "1.2.3", slug: "mig-gazalti-kaynak-makinalari", section: "ekipmanlar", group: "kaynak-makinalari", order: 3,
    name: { tr: "MIG (GMAW) Gazaltı Kaynak Makinaları", en: "MIG (GMAW) Welding Machines" },
    description: { tr: "Araç panelinden metal imalatına kadar hızlı ve istikrarlı kaynak.", en: "Fast, consistent welding from car panels to metal fabrication." },
  },
  {
    id: "c1.2.4", code: "1.2.4", slug: "cok-fonksiyonlu-kaynak-makinalari", section: "ekipmanlar", group: "kaynak-makinalari", order: 4,
    name: { tr: "Çok Fonksiyonlu Kaynak Makinaları", en: "Multi-Process Welding Machines" },
    description: { tr: "Tek makinede birden fazla kaynak yönteminin esnekliği.", en: "The flexibility of several welding processes in one machine." },
  },
  {
    id: "c1.2.5", code: "1.2.5", slug: "plazma-kesim-makinalari", section: "ekipmanlar", group: "kaynak-makinalari", order: 5,
    name: { tr: "Plazma Kesim Makinaları", en: "Plasma Cutting Machines" },
    description: { tr: "Karbon çeliği, paslanmaz ve alüminyumda temiz kesim performansı.", en: "Clean cutting on carbon steel, stainless and aluminium." },
  },
  {
    id: "c2.1.1", code: "2.1.1", slug: "otomatik-kararan-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 1,
    name: { tr: "Otomatik Kararan Baş Maskeleri", en: "Auto-Darkening Welding Helmets" },
    description: { tr: "Ark anında kendiliğinden kararan, gözü koruyan kaynak maskeleri.", en: "Helmets that darken automatically the instant the arc strikes." },
  },
  {
    id: "c2.1.2", code: "2.1.2", slug: "lazer-isini-koruyucu-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 2,
    name: { tr: "Lazer Işını Koruyucu Baş Maskeleri", en: "Laser Safety Helmets" },
    description: { tr: "Lazer kaynak ve temizlikte yüzü ve gözleri koruyan maskeler.", en: "Face and eye protection for laser welding and cleaning." },
  },
  {
    id: "c2.1.3", code: "2.1.3", slug: "lazer-isini-koruyucu-gozlukler", section: "guvenlik", group: "kaynak-maskeleri", order: 3,
    name: { tr: "Lazer Işını Koruyucu Gözlükler", en: "Laser Safety Glasses" },
    description: { tr: "Lazer dalga boyuna uygun, sertifikalı koruyucu gözlükler.", en: "Certified safety glasses matched to the laser wavelength." },
  },
  {
    id: "c2.2.1", code: "2.2.1", slug: "kaynak-eldivenleri", section: "guvenlik", group: "koruyucu-giyim", order: 1,
    name: { tr: "Kaynak Eldivenleri", en: "Welding Gloves" },
    description: { tr: "Isıya ve kıvılcıma dayanıklı deri kaynak eldivenleri.", en: "Heat- and spark-resistant leather welding gloves." },
  },
  {
    id: "c2.2.2", code: "2.2.2", slug: "kaynak-onlukleri", section: "guvenlik", group: "koruyucu-giyim", order: 2,
    name: { tr: "Kaynak Önlükleri", en: "Welding Aprons" },
    description: { tr: "Kıvılcım ve cürufa karşı vücudu koruyan deri önlükler.", en: "Leather aprons that protect against sparks and slag." },
  },
  {
    id: "c3.1.1", code: "3.1.1", slug: "mig-torclari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 1,
    name: { tr: "MIG Torçları", en: "MIG Torches" },
    description: { tr: "Euro bağlantılı MIG kaynak torçları ve torç setleri.", en: "Euro-connection MIG welding torches and torch sets." },
  },
  {
    id: "c3.1.2", code: "3.1.2", slug: "push-pull-torclar", section: "aksesuarlar", group: "mig-aksesuarlari", order: 2,
    name: { tr: "Push Pull Torçlar", en: "Push-Pull Torches" },
    description: { tr: "Alüminyum ve uzun mesafede düzgün tel beslemesi için.", en: "Smooth wire feeding for aluminium and long distances." },
  },
  {
    id: "c3.1.3", code: "3.1.3", slug: "booster-10-m", section: "aksesuarlar", group: "mig-aksesuarlari", order: 3,
    name: { tr: "Booster 10 m", en: "Booster 10 m" },
    description: { tr: "Tel sürmeyi 10 metreye kadar uzatan ara besleme ünitesi.", en: "Intermediate feeder that extends wire feeding up to 10 m." },
  },
  {
    id: "c3.1.4", code: "3.1.4", slug: "mig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "mig-aksesuarlari", order: 4,
    name: { tr: "MIG Torç Sarf Malzemeleri", en: "MIG Torch Consumables" },
    description: { tr: "Gaz nozulu, kontak meme ve diğer MIG sarf malzemeleri.", en: "Gas nozzles, contact tips and other MIG consumables." },
  },
  {
    id: "c3.1.5", code: "3.1.5", slug: "mig-torc-yedek-parcalari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 5,
    name: { tr: "MIG Torç Yedek Parçaları", en: "MIG Torch Spare Parts" },
    description: { tr: "MIG torçları için gövde, boyun, hortum ve tetik yedekleri.", en: "Body, neck, liner and trigger spares for MIG torches." },
  },
  {
    id: "c3.2.1", code: "3.2.1", slug: "tig-torclari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 1,
    name: { tr: "TIG Torçları", en: "TIG Torches" },
    description: { tr: "Hava ve su soğutmalı TIG kaynak torçları.", en: "Air-cooled and water-cooled TIG welding torches." },
  },
  {
    id: "c3.2.2", code: "3.2.2", slug: "tig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "tig-aksesuarlari", order: 2,
    name: { tr: "TIG Torç Sarf Malzemeleri", en: "TIG Torch Consumables" },
    description: { tr: "Pens, seramik nozul, gaz lensi ve diğer TIG sarf malzemeleri.", en: "Collets, ceramic cups, gas lenses and other TIG consumables." },
  },
  {
    id: "c3.2.3", code: "3.2.3", slug: "tig-torc-yedek-parcalari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 3,
    name: { tr: "TIG Torç Yedek Parçaları", en: "TIG Torch Spare Parts" },
    description: { tr: "TIG torçları için kafa, gövde ve hortum yedekleri.", en: "Head, body and hose spares for TIG torches." },
  },
  {
    id: "c3.2.4", code: "3.2.4", slug: "ayak-pedallari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 4,
    name: { tr: "Ayak Pedalları", en: "Foot Pedals" },
    description: { tr: "Kaynak akımını ayakla hassas şekilde ayarlamak için.", en: "Fine control of welding current with your foot." },
  },
  {
    id: "c3.2.5", code: "3.2.5", slug: "tungsten-elektrodlar", section: "aksesuarlar", group: "tig-aksesuarlari", order: 5,
    name: { tr: "Tungsten Elektrodlar", en: "Tungsten Electrodes" },
    description: { tr: "Farklı malzeme ve akımlar için renk kodlu tungsten elektrodlar.", en: "Colour-coded tungsten electrodes for different metals and currents." },
  },
  {
    id: "c3.3.1", code: "3.3.1", slug: "elektrod-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 1,
    name: { tr: "Elektrod Pense ve Kitleri", en: "Electrode Holders and Kits" },
    description: { tr: "Elektrod pensleri ve kablolu hazır kitler.", en: "Electrode holders and ready-made cable kits." },
  },
  {
    id: "c3.3.2", code: "3.3.2", slug: "sase-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 2,
    name: { tr: "Şase Pense ve Kitleri", en: "Earth Clamps and Kits" },
    description: { tr: "Şase pensleri ve kablolu hazır kitler.", en: "Earth clamps and ready-made cable kits." },
  },
  {
    id: "c3.4.1", code: "3.4.1", slug: "plazma-torclari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 1,
    name: { tr: "Plazma Torçları", en: "Plasma Torches" },
    description: { tr: "Elle ve CNC kesim için plazma torçları.", en: "Plasma torches for hand-held and CNC cutting." },
  },
  {
    id: "c3.4.2", code: "3.4.2", slug: "plazma-torc-sarf-malzemeleri", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 2,
    name: { tr: "Plazma Torç Sarf Malzemeleri", en: "Plasma Torch Consumables" },
    description: { tr: "Elektrod, meme ve diğer plazma sarf malzemeleri.", en: "Electrodes, nozzles and other plasma consumables." },
  },
  {
    id: "c3.4.3", code: "3.4.3", slug: "plazma-torc-yedek-parcalari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 3,
    name: { tr: "Plazma Torç Yedek Parçaları", en: "Plasma Torch Spare Parts" },
    description: { tr: "Plazma torçları için gövde ve hortum yedekleri.", en: "Body and hose spares for plasma torches." },
  },
  {
    id: "c3.4.4", code: "3.4.4", slug: "plazma-torc-aparatlari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 4,
    name: { tr: "Plazma Torç Aparatları", en: "Plasma Torch Attachments" },
    description: { tr: "Daire kesme pergeli, kılavuz ve mesafe aparatları.", en: "Circle-cutting compasses, guides and stand-off attachments." },
  },
  {
    id: "c3.5.1", code: "3.5.1", slug: "su-sogutmalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 1,
    name: { tr: "Su Soğutmalar", en: "Water Coolers" },
    description: { tr: "Yüksek akımda torcu serin tutan su soğutma üniteleri.", en: "Water-cooling units that keep the torch cool at high current." },
  },
  {
    id: "c3.5.2", code: "3.5.2", slug: "tasiyici-arabalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 2,
    name: { tr: "Taşıyıcı Arabalar", en: "Trolleys" },
    description: { tr: "Makine, tüp ve aksesuarları taşımak için arabalar.", en: "Trolleys for carrying machines, cylinders and accessories." },
  },
  {
    id: "c3.5.3", code: "3.5.3", slug: "tel-surme-uniteleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 3,
    name: { tr: "Tel Sürme Üniteleri", en: "Wire Feeders" },
    description: { tr: "Ayrı tel sürme üniteleri ve besleme sistemleri.", en: "Separate wire feeder units and feeding systems." },
  },
  {
    id: "c3.5.4", code: "3.5.4", slug: "tel-surme-makaralari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 4,
    name: { tr: "Tel Sürme Makaraları", en: "Wire Feed Rollers" },
    description: { tr: "Tel çapına ve tipine uygun tel sürme makaraları.", en: "Feed rollers matched to wire diameter and type." },
  },
  {
    id: "c3.5.5", code: "3.5.5", slug: "kaynak-kablolari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 5,
    name: { tr: "Kaynak Kabloları", en: "Welding Cables" },
    description: { tr: "Esnek, yüksek akım taşıyan kaynak kabloları.", en: "Flexible, high-current welding cables." },
  },
  {
    id: "c3.5.6", code: "3.5.6", slug: "uzaktan-kumandalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 6,
    name: { tr: "Uzaktan Kumandalar", en: "Remote Controls" },
    description: { tr: "Kaynak ayarlarını makineye gitmeden değiştirin.", en: "Change welding settings without walking to the machine." },
  },
  {
    id: "c3.5.7", code: "3.5.7", slug: "karbon-kesme-elektrod-ve-penseleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 7,
    name: { tr: "Karbon Kesme Elektrod ve Penseleri", en: "Carbon Gouging Electrodes and Holders" },
    description: { tr: "Oluk açma ve kaynak sökme için karbon elektrod ve penseler.", en: "Carbon electrodes and holders for gouging and weld removal." },
  },
  {
    id: "c4.1.1", code: "4.1.1", slug: "karbonlu-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 1,
    name: { tr: "Karbonlu Çelik MIG Telleri", en: "Carbon Steel MIG Wires" },
    description: { tr: "Genel çelik imalatı için bakır kaplı gazaltı telleri.", en: "Copper-coated MIG wires for general steel fabrication." },
  },
  {
    id: "c4.1.2", code: "4.1.2", slug: "paslanmaz-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 2,
    name: { tr: "Paslanmaz Çelik MIG Telleri", en: "Stainless Steel MIG Wires" },
    description: { tr: "Paslanmaz çelik kaynağı için MIG telleri.", en: "MIG wires for welding stainless steel." },
  },
  {
    id: "c4.1.3", code: "4.1.3", slug: "aluminyum-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 3,
    name: { tr: "Alüminyum MIG Telleri", en: "Aluminium MIG Wires" },
    description: { tr: "Alüminyum ve alaşımları için MIG telleri.", en: "MIG wires for aluminium and its alloys." },
  },
  {
    id: "c4.1.4", code: "4.1.4", slug: "gazsiz-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 4,
    name: { tr: "Gazsız Özlü MIG Telleri", en: "Gasless Flux-Cored MIG Wires" },
    description: { tr: "Gaz tüpü gerektirmeyen, dış mekana uygun özlü teller.", en: "Flux-cored wires that need no gas cylinder, ideal outdoors." },
  },
  {
    id: "c4.1.5", code: "4.1.5", slug: "gazli-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 5,
    name: { tr: "Gazlı Özlü MIG Telleri", en: "Gas-Shielded Flux-Cored MIG Wires" },
    description: { tr: "Yüksek verim ve derin nüfuziyet için gazlı özlü teller.", en: "Gas-shielded flux-cored wires for high output and deep penetration." },
  },
  {
    id: "c4.1.6", code: "4.1.6", slug: "metal-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 6,
    name: { tr: "Metal Özlü MIG Telleri", en: "Metal-Cored MIG Wires" },
    description: { tr: "Az cüruf ve yüksek yığma hızı için metal özlü teller.", en: "Metal-cored wires for low slag and high deposition rates." },
  },
  {
    id: "c4.2.1", code: "4.2.1", slug: "karbonlu-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 1,
    name: { tr: "Karbonlu Çelik TIG Telleri", en: "Carbon Steel TIG Wires" },
    description: { tr: "Karbonlu çelik için TIG kaynak telleri.", en: "TIG filler wires for carbon steel." },
  },
  {
    id: "c4.2.2", code: "4.2.2", slug: "paslanmaz-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 2,
    name: { tr: "Paslanmaz Çelik TIG Telleri", en: "Stainless Steel TIG Wires" },
    description: { tr: "Paslanmaz çelik için TIG kaynak telleri.", en: "TIG filler wires for stainless steel." },
  },
  {
    id: "c4.2.3", code: "4.2.3", slug: "aluminyum-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 3,
    name: { tr: "Alüminyum TIG Telleri", en: "Aluminium TIG Wires" },
    description: { tr: "Alüminyum ve alaşımları için TIG kaynak telleri.", en: "TIG filler wires for aluminium and its alloys." },
  },
];
