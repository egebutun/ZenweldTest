import type { Category, CategoryGroup } from "../types";

export const categoryGroups: CategoryGroup[] = [
  { id: "g1", slug: "lazer", section: "ekipmanlar", name: { tr: "Lazer", en: "Laser" }, order: 1 },
  { id: "g2", slug: "kaynak-makineleri", section: "ekipmanlar", name: { tr: "Kaynak Makineleri", en: "Welding Machines" }, order: 2 },
  { id: "g3", slug: "plazma-kesme", section: "ekipmanlar", name: { tr: "Plazma Kesme", en: "Plasma Cutting" }, order: 3 },

  { id: "g7", slug: "kaynak-maskeleri", section: "guvenlik", name: { tr: "Kaynak Maskeleri", en: "Welding Helmets" }, order: 1 },
  { id: "g8", slug: "koruyucu-giyim", section: "guvenlik", name: { tr: "Koruyucu Giyim", en: "Protective Clothing" }, order: 2 },
  { id: "g9", slug: "solunum-koruma", section: "guvenlik", name: { tr: "Solunum Koruma", en: "Respiratory Protection" }, order: 3 },

  { id: "g10", slug: "mig", section: "aksesuarlar", name: { tr: "MIG", en: "MIG" }, order: 1 },
  { id: "g11", slug: "mag", section: "aksesuarlar", name: { tr: "MAG", en: "MAG" }, order: 2 },
  { id: "g12", slug: "tig", section: "aksesuarlar", name: { tr: "TIG", en: "TIG" }, order: 3 },
  { id: "g13", slug: "regulatorler", section: "aksesuarlar", name: { tr: "Regülatörler", en: "Regulators" }, order: 4 },

  { id: "g14", slug: "mig-telleri", section: "dolgu-metalleri", name: { tr: "MIG Telleri", en: "MIG Wires" }, order: 1 },
  { id: "g15", slug: "tig-cubuklari", section: "dolgu-metalleri", name: { tr: "TIG Çubukları", en: "TIG Rods" }, order: 2 },
  { id: "g16", slug: "elektrotlar", section: "dolgu-metalleri", name: { tr: "Elektrotlar", en: "Electrodes" }, order: 3 },
];

export const categories: Category[] = [
  {
    id: "c19", slug: "lazer-kaynak-makineleri", section: "ekipmanlar", group: "lazer", order: 1,
    name: { tr: "Lazer Kaynak Makineleri", en: "Laser Welding Machines" },
    description: { tr: "Yüksek hızda, düşük ısı girdisiyle temiz ve ince dikişli kaynak.", en: "Fast welding with low heat input and clean, fine beads." },
  },
  {
    id: "c20", slug: "lazer-kesme-makineleri", section: "ekipmanlar", group: "lazer", order: 2,
    name: { tr: "Lazer Kesme Makineleri", en: "Laser Cutting Machines" },
    description: { tr: "Sac metalde yüksek hassasiyetli, çapaksız kesim performansı.", en: "High-precision, burr-free cutting performance on sheet metal." },
  },
  {
    id: "c1", slug: "multi-process", section: "ekipmanlar", group: "kaynak-makineleri", order: 1,
    name: { tr: "Multi-Process", en: "Multi-Process" },
    description: { tr: "Tek makinede birden fazla kaynak yönteminin esnekliğini yakalayın.", en: "Get the flexibility of multiple welding processes in one machine." },
  },
  {
    id: "c2", slug: "mig-gmaw", section: "ekipmanlar", group: "kaynak-makineleri", order: 2,
    name: { tr: "MIG (GMAW)", en: "MIG (GMAW)" },
    description: { tr: "Araç panelinden metal imalatına kadar hızlı ve istikrarlı.", en: "Fast and consistent across jobs from car panels to metal fabrication." },
  },
  {
    id: "c3", slug: "pulse-mig", section: "ekipmanlar", group: "kaynak-makineleri", order: 3,
    name: { tr: "Pulse MIG", en: "Pulse MIG" },
    description: { tr: "Gelişmiş pulse teknolojisiyle çarpılmayı ve sıçrantıyı en aza indirin.", en: "Minimise distortion and spatter with advanced pulse MIG technology." },
  },
  {
    id: "c4", slug: "tig-gtaw", section: "ekipmanlar", group: "kaynak-makineleri", order: 4,
    name: { tr: "TIG (GTAW)", en: "TIG (GTAW)" },
    description: { tr: "Alüminyum dahil metallerde hassas kaynak işleri için ideal.", en: "Ideal for precision welding tasks with metals including aluminium." },
  },
  {
    id: "c5", slug: "mma-stick", section: "ekipmanlar", group: "kaynak-makineleri", order: 5,
    name: { tr: "MMA (Örtülü Elektrot)", en: "MMA (Stick)" },
    description: { tr: "Gaz kullanmadan dış mekan kaynağı ve genel imalat için ideal.", en: "Ideal for outdoor welding and general fabrication without using gas." },
  },
  {
    id: "c6", slug: "plazma-kesme-makineleri", section: "ekipmanlar", group: "plazma-kesme", order: 1,
    name: { tr: "Plazma Kesme Makineleri", en: "Plasma Cutters" },
    description: { tr: "Karbon çeliği, paslanmaz ve alüminyumda temiz kesim performansı.", en: "Clean cutting performance on carbon steel, stainless and aluminium." },
  },
  {
    id: "c8", slug: "otomatik-kararan-maskeler", section: "guvenlik", group: "kaynak-maskeleri", order: 1,
    name: { tr: "Otomatik Kararan Maskeler", en: "Auto-Darkening Helmets" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c9", slug: "kaynak-eldivenleri", section: "guvenlik", group: "koruyucu-giyim", order: 1,
    name: { tr: "Kaynak Eldivenleri", en: "Welding Gloves" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c10", slug: "kaynak-onlukleri", section: "guvenlik", group: "koruyucu-giyim", order: 2,
    name: { tr: "Kaynak Önlükleri", en: "Welding Aprons" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c11", slug: "mig-torclari", section: "aksesuarlar", group: "mig", order: 1,
    name: { tr: "MIG Torçları", en: "MIG Torches" },
    description: { tr: "Euro bağlantılı MIG kaynak torçları ve torç setleri.", en: "Euro-connection MIG welding torches and torch sets." },
  },
  {
    id: "c21", slug: "mig-yedek-parca", section: "aksesuarlar", group: "mig", order: 2,
    name: { tr: "Yedek Parça", en: "Spare Parts" },
    description: { tr: "MIG torçları için gövde, boyun, hortum ve tetik yedekleri.", en: "Body, neck, liner and trigger spares for MIG torches." },
  },
  {
    id: "c22", slug: "mig-sarf-malzemeleri", section: "aksesuarlar", group: "mig", order: 3,
    name: { tr: "Sarf Malzemeleri", en: "Consumables" },
    description: { tr: "Gaz nozulu, kontak meme ve diğer MIG sarf malzemeleri.", en: "Gas nozzles, contact tips and other MIG consumables." },
  },
  {
    id: "c23", slug: "mag-torclari", section: "aksesuarlar", group: "mag", order: 1,
    name: { tr: "MAG Torçları", en: "MAG Torches" },
    description: { tr: "Karışım gazla çalışan MAG uygulamaları için kaynak torçları.", en: "Welding torches for MAG applications using mixed shielding gas." },
  },
  {
    id: "c24", slug: "mag-yedek-parca", section: "aksesuarlar", group: "mag", order: 2,
    name: { tr: "Yedek Parça", en: "Spare Parts" },
    description: { tr: "MAG torçları için gövde, boyun, hortum ve tetik yedekleri.", en: "Body, neck, liner and trigger spares for MAG torches." },
  },
  {
    id: "c25", slug: "mag-sarf-malzemeleri", section: "aksesuarlar", group: "mag", order: 3,
    name: { tr: "Sarf Malzemeleri", en: "Consumables" },
    description: { tr: "Gaz nozulu, kontak meme ve diğer MAG sarf malzemeleri.", en: "Gas nozzles, contact tips and other MAG consumables." },
  },
  {
    id: "c12", slug: "tig-torclari", section: "aksesuarlar", group: "tig", order: 1,
    name: { tr: "TIG Torçları", en: "TIG Torches" },
    description: { tr: "Hava ve su soğutmalı TIG kaynak torçları.", en: "Air-cooled and water-cooled TIG welding torches." },
  },
  {
    id: "c26", slug: "tig-yedek-parca", section: "aksesuarlar", group: "tig", order: 2,
    name: { tr: "Yedek Parça", en: "Spare Parts" },
    description: { tr: "TIG torçları için kafa, kapak ve hortum yedekleri.", en: "Head, cap and hose spares for TIG torches." },
  },
  {
    id: "c27", slug: "tig-sarf-malzemeleri", section: "aksesuarlar", group: "tig", order: 3,
    name: { tr: "Sarf Malzemeleri", en: "Consumables" },
    description: { tr: "Tungsten elektrot, pens, seramik nozul ve gaz lensleri.", en: "Tungsten electrodes, collets, ceramic nozzles and gas lenses." },
  },
  {
    id: "c14", slug: "gaz-regulatorleri", section: "aksesuarlar", group: "regulatorler", order: 1,
    name: { tr: "Gaz Regülatörleri", en: "Gas Regulators" },
    description: { tr: "Argon, CO2 ve karışım gazlar için debimetreli regülatörler.", en: "Regulators with flowmeters for argon, CO2 and mixed gases." },
  },
  {
    id: "c16", slug: "gazalti-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 1,
    name: { tr: "Gazaltı Telleri", en: "Solid MIG Wires" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c17", slug: "paslanmaz-tig-cubuklari", section: "dolgu-metalleri", group: "tig-cubuklari", order: 1,
    name: { tr: "Paslanmaz TIG Çubukları", en: "Stainless TIG Rods" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c18", slug: "rutil-elektrotlar", section: "dolgu-metalleri", group: "elektrotlar", order: 1,
    name: { tr: "Rutil Elektrotlar", en: "Rutile Electrodes" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
];
