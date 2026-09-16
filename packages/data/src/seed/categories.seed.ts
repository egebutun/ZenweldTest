import type { Category, CategoryGroup } from "../types";

export const categoryGroups: CategoryGroup[] = [
  { id: "g1", slug: "kaynak-makineleri", section: "ekipmanlar", name: { tr: "Kaynak Makineleri", en: "Welding Machines" }, order: 1 },
  { id: "g2", slug: "plazma-kesme", section: "ekipmanlar", name: { tr: "Plazma Kesme", en: "Plasma Cutting" }, order: 2 },
  { id: "g3", slug: "duman-emis", section: "ekipmanlar", name: { tr: "Duman Emiş", en: "Fume Extraction" }, order: 3 },
  { id: "g4", slug: "oksi-gaz", section: "ekipmanlar", name: { tr: "Oksi-Gaz", en: "Oxy-Fuel" }, order: 4 },
  { id: "g5", slug: "cnc-tezgahlar", section: "ekipmanlar", name: { tr: "CNC Tezgahlar", en: "CNC Tables" }, order: 5 },
  { id: "g6", slug: "punta-kaynak", section: "ekipmanlar", name: { tr: "Punta Kaynak", en: "Spot Welders" }, order: 6 },

  { id: "g7", slug: "kaynak-maskeleri", section: "guvenlik", name: { tr: "Kaynak Maskeleri", en: "Welding Helmets" }, order: 1 },
  { id: "g8", slug: "koruyucu-giyim", section: "guvenlik", name: { tr: "Koruyucu Giyim", en: "Protective Clothing" }, order: 2 },
  { id: "g9", slug: "solunum-koruma", section: "guvenlik", name: { tr: "Solunum Koruma", en: "Respiratory Protection" }, order: 3 },

  { id: "g10", slug: "torclar", section: "aksesuarlar", name: { tr: "Torçlar", en: "Torches" }, order: 1 },
  { id: "g11", slug: "sarf-malzemeleri", section: "aksesuarlar", name: { tr: "Sarf Malzemeleri", en: "Consumables" }, order: 2 },
  { id: "g12", slug: "regulatorler", section: "aksesuarlar", name: { tr: "Regülatörler", en: "Regulators" }, order: 3 },
  { id: "g13", slug: "kablo-pense", section: "aksesuarlar", name: { tr: "Kablo & Pense", en: "Cables & Clamps" }, order: 4 },

  { id: "g14", slug: "mig-telleri", section: "dolgu-metalleri", name: { tr: "MIG Telleri", en: "MIG Wires" }, order: 1 },
  { id: "g15", slug: "tig-cubuklari", section: "dolgu-metalleri", name: { tr: "TIG Çubukları", en: "TIG Rods" }, order: 2 },
  { id: "g16", slug: "elektrotlar", section: "dolgu-metalleri", name: { tr: "Elektrotlar", en: "Electrodes" }, order: 3 },
];

export const categories: Category[] = [
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
    id: "c7", slug: "cnc-plazma", section: "ekipmanlar", group: "cnc-tezgahlar", order: 1,
    name: { tr: "CNC Plazma Sistemleri", en: "CNC Plasma Systems" },
    description: { tr: "Otomasyon sistemlerine adapte edilebilen CNC çıkışlı çözümler.", en: "CNC-ready solutions that adapt to automation systems." },
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
    id: "c11", slug: "mig-torclari", section: "aksesuarlar", group: "torclar", order: 1,
    name: { tr: "MIG Torçları", en: "MIG Torches" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c12", slug: "tig-torclari", section: "aksesuarlar", group: "torclar", order: 2,
    name: { tr: "TIG Torçları", en: "TIG Torches" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c13", slug: "nozul-meme", section: "aksesuarlar", group: "sarf-malzemeleri", order: 1,
    name: { tr: "Nozul & Meme", en: "Nozzles & Tips" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c14", slug: "gaz-regulatorleri", section: "aksesuarlar", group: "regulatorler", order: 1,
    name: { tr: "Gaz Regülatörleri", en: "Gas Regulators" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    id: "c15", slug: "sase-penseleri", section: "aksesuarlar", group: "kablo-pense", order: 1,
    name: { tr: "Şase Penseleri", en: "Earth Clamps" },
    description: { tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
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
