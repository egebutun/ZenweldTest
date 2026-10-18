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
  { id: "g1.1", code: "1.1", slug: "lazer-makineleri", section: "ekipmanlar", name: "Lazer Makineleri", order: 1 },
  { id: "g1.2", code: "1.2", slug: "kaynak-makineleri", section: "ekipmanlar", name: "Kaynak Makineleri", order: 2 },

  { id: "g2.1", code: "2.1", slug: "kaynak-maskeleri", section: "guvenlik", name: "Kaynak Maskeleri", order: 1 },
  { id: "g2.2", code: "2.2", slug: "koruyucu-giyim", section: "guvenlik", name: "Koruyucu Giyim", order: 2 },

  { id: "g3.1", code: "3.1", slug: "mig-aksesuarlari", section: "aksesuarlar", name: "MIG Aksesuarları", order: 1 },
  { id: "g3.2", code: "3.2", slug: "tig-aksesuarlari", section: "aksesuarlar", name: "TIG Aksesuarları", order: 2 },
  { id: "g3.3", code: "3.3", slug: "mma-aksesuarlari", section: "aksesuarlar", name: "MMA Aksesuarları", order: 3 },
  { id: "g3.4", code: "3.4", slug: "plazma-kesme-aksesuarlari", section: "aksesuarlar", name: "Plazma Kesme Aksesuarları", order: 4 },
  { id: "g3.5", code: "3.5", slug: "diger-aksesuarlar", section: "aksesuarlar", name: "Diğer Aksesuarlar", order: 5 },

  { id: "g4.1", code: "4.1", slug: "mig-telleri", section: "dolgu-metalleri", name: "MIG Telleri", order: 1 },
  { id: "g4.2", code: "4.2", slug: "tig-telleri", section: "dolgu-metalleri", name: "TIG Telleri", order: 2 },
];

export const categories: Category[] = [
  {
    id: "c1.1.1", code: "1.1.1", slug: "lazer-kaynak-makineleri", section: "ekipmanlar", group: "lazer-makineleri", order: 1,
    name: "Lazer Kaynak Makineleri",
    description: "Yüksek hızda, düşük ısı girdisiyle temiz ve ince dikişli kaynak.",
  },
  {
    id: "c1.1.2", code: "1.1.2", slug: "lazer-temizleme", section: "ekipmanlar", group: "lazer-makineleri", order: 2,
    name: "Lazer Temizleme",
    description: "Pas, boya ve oksiti yüzeye zarar vermeden kimyasalsız temizleyin.",
  },
  {
    id: "c1.1.3", code: "1.1.3", slug: "lazer-markalama", section: "ekipmanlar", group: "lazer-makineleri", order: 3,
    name: "Lazer Markalama",
    description: "Metal yüzeylere kalıcı, hassas yazı, logo ve kod işleme.",
  },
  {
    id: "c1.2.1", code: "1.2.1", slug: "mma-ortulu-elektrod-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 1,
    name: "MMA (Stick) Örtülü Elektrod Kaynak Makineleri",
    description: "Gaz kullanmadan dış mekan kaynağı ve genel imalat için ideal.",
  },
  {
    id: "c1.2.2", code: "1.2.2", slug: "tig-argon-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 2,
    name: "TIG (GTAW) Argon Kaynak Makineleri",
    description: "Alüminyum dahil metallerde hassas kaynak işleri için ideal.",
  },
  {
    id: "c1.2.3", code: "1.2.3", slug: "mig-gazalti-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 3,
    name: "MIG (GMAW) Gazaltı Kaynak Makineleri",
    description: "Araç panelinden metal imalatına kadar hızlı ve istikrarlı kaynak.",
  },
  {
    id: "c1.2.4", code: "1.2.4", slug: "cok-fonksiyonlu-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 4,
    name: "Çok Fonksiyonlu Kaynak Makineleri",
    description: "Tek makinede birden fazla kaynak yönteminin esnekliği.",
  },
  {
    id: "c1.2.5", code: "1.2.5", slug: "plazma-kesim-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 5,
    name: "Plazma Kesim Makineleri",
    description: "Karbon çeliği, paslanmaz ve alüminyumda temiz kesim performansı.",
  },
  {
    id: "c2.1.1", code: "2.1.1", slug: "otomatik-kararan-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 1,
    name: "Otomatik Kararan Baş Maskeleri",
    description: "Ark anında kendiliğinden kararan, gözü koruyan kaynak maskeleri.",
  },
  {
    id: "c2.1.2", code: "2.1.2", slug: "lazer-isini-koruyucu-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 2,
    name: "Lazer Işını Koruyucu Baş Maskeleri",
    description: "Lazer kaynak ve temizlikte yüzü ve gözleri koruyan maskeler.",
  },
  {
    id: "c2.1.3", code: "2.1.3", slug: "lazer-isini-koruyucu-gozlukler", section: "guvenlik", group: "kaynak-maskeleri", order: 3,
    name: "Lazer Işını Koruyucu Gözlükler",
    description: "Lazer dalga boyuna uygun, sertifikalı koruyucu gözlükler.",
  },
  {
    id: "c2.2.1", code: "2.2.1", slug: "kaynak-eldivenleri", section: "guvenlik", group: "koruyucu-giyim", order: 1,
    name: "Kaynak Eldivenleri",
    description: "Isıya ve kıvılcıma dayanıklı deri kaynak eldivenleri.",
  },
  {
    id: "c2.2.2", code: "2.2.2", slug: "kaynak-onlukleri", section: "guvenlik", group: "koruyucu-giyim", order: 2,
    name: "Kaynak Önlükleri",
    description: "Kıvılcım ve cürufa karşı vücudu koruyan deri önlükler.",
  },
  {
    id: "c3.1.1", code: "3.1.1", slug: "mig-torclari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 1,
    name: "MIG Torçları",
    description: "Euro bağlantılı MIG kaynak torçları ve torç setleri.",
  },
  {
    id: "c3.1.2", code: "3.1.2", slug: "push-pull-torclar", section: "aksesuarlar", group: "mig-aksesuarlari", order: 2,
    name: "Push Pull Torçlar",
    description: "Alüminyum ve uzun mesafede düzgün tel beslemesi için.",
  },
  {
    id: "c3.1.3", code: "3.1.3", slug: "booster-10-m", section: "aksesuarlar", group: "mig-aksesuarlari", order: 3,
    name: "Booster 10 m",
    description: "Tel sürmeyi 10 metreye kadar uzatan ara besleme ünitesi.",
  },
  {
    id: "c3.1.4", code: "3.1.4", slug: "mig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "mig-aksesuarlari", order: 4,
    name: "MIG Torç Sarf Malzemeleri",
    description: "Gaz nozulu, kontak meme ve diğer MIG sarf malzemeleri.",
  },
  {
    id: "c3.1.5", code: "3.1.5", slug: "mig-torc-yedek-parcalari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 5,
    name: "MIG Torç Yedek Parçaları",
    description: "MIG torçları için gövde, boyun, hortum ve tetik yedekleri.",
  },
  {
    id: "c3.2.1", code: "3.2.1", slug: "tig-torclari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 1,
    name: "TIG Torçları",
    description: "Hava ve su soğutmalı TIG kaynak torçları.",
  },
  {
    id: "c3.2.2", code: "3.2.2", slug: "tig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "tig-aksesuarlari", order: 2,
    name: "TIG Torç Sarf Malzemeleri",
    description: "Pens, seramik nozul, gaz lensi ve diğer TIG sarf malzemeleri.",
  },
  {
    id: "c3.2.3", code: "3.2.3", slug: "tig-torc-yedek-parcalari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 3,
    name: "TIG Torç Yedek Parçaları",
    description: "TIG torçları için kafa, gövde ve hortum yedekleri.",
  },
  {
    id: "c3.2.4", code: "3.2.4", slug: "ayak-pedallari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 4,
    name: "Ayak Pedalları",
    description: "Kaynak akımını ayakla hassas şekilde ayarlamak için.",
  },
  {
    id: "c3.2.5", code: "3.2.5", slug: "tungsten-elektrodlar", section: "aksesuarlar", group: "tig-aksesuarlari", order: 5,
    name: "Tungsten Elektrodlar",
    description: "Farklı malzeme ve akımlar için renk kodlu tungsten elektrodlar.",
  },
  {
    id: "c3.3.1", code: "3.3.1", slug: "elektrod-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 1,
    name: "Elektrod Pense ve Kitleri",
    description: "Elektrod pensleri ve kablolu hazır kitler.",
  },
  {
    id: "c3.3.2", code: "3.3.2", slug: "sase-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 2,
    name: "Şase Pense ve Kitleri",
    description: "Şase pensleri ve kablolu hazır kitler.",
  },
  {
    id: "c3.4.1", code: "3.4.1", slug: "plazma-torclari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 1,
    name: "Plazma Torçları",
    description: "Elle ve CNC kesim için plazma torçları.",
  },
  {
    id: "c3.4.2", code: "3.4.2", slug: "plazma-torc-sarf-malzemeleri", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 2,
    name: "Plazma Torç Sarf Malzemeleri",
    description: "Elektrod, meme ve diğer plazma sarf malzemeleri.",
  },
  {
    id: "c3.4.3", code: "3.4.3", slug: "plazma-torc-yedek-parcalari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 3,
    name: "Plazma Torç Yedek Parçaları",
    description: "Plazma torçları için gövde ve hortum yedekleri.",
  },
  {
    id: "c3.4.4", code: "3.4.4", slug: "plazma-torc-aparatlari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 4,
    name: "Plazma Torç Aparatları",
    description: "Daire kesme pergeli, kılavuz ve mesafe aparatları.",
  },
  {
    id: "c3.5.1", code: "3.5.1", slug: "su-sogutmalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 1,
    name: "Su Soğutmalar",
    description: "Yüksek akımda torcu serin tutan su soğutma üniteleri.",
  },
  {
    id: "c3.5.2", code: "3.5.2", slug: "tasiyici-arabalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 2,
    name: "Taşıyıcı Arabalar",
    description: "Makine, tüp ve aksesuarları taşımak için arabalar.",
  },
  {
    id: "c3.5.3", code: "3.5.3", slug: "tel-surme-uniteleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 3,
    name: "Tel Sürme Üniteleri",
    description: "Ayrı tel sürme üniteleri ve besleme sistemleri.",
  },
  {
    id: "c3.5.4", code: "3.5.4", slug: "tel-surme-makaralari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 4,
    name: "Tel Sürme Makaraları",
    description: "Tel çapına ve tipine uygun tel sürme makaraları.",
  },
  {
    id: "c3.5.5", code: "3.5.5", slug: "kaynak-kablolari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 5,
    name: "Kaynak Kabloları",
    description: "Esnek, yüksek akım taşıyan kaynak kabloları.",
  },
  {
    id: "c3.5.6", code: "3.5.6", slug: "uzaktan-kumandalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 6,
    name: "Uzaktan Kumandalar",
    description: "Kaynak ayarlarını makineye gitmeden değiştirin.",
  },
  {
    id: "c3.5.7", code: "3.5.7", slug: "karbon-kesme-elektrod-ve-penseleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 7,
    name: "Karbon Kesme Elektrod ve Penseleri",
    description: "Oluk açma ve kaynak sökme için karbon elektrod ve penseler.",
  },
  {
    id: "c4.1.1", code: "4.1.1", slug: "karbonlu-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 1,
    name: "Karbonlu Çelik MIG Telleri",
    description: "Genel çelik imalatı için bakır kaplı gazaltı telleri.",
  },
  {
    id: "c4.1.2", code: "4.1.2", slug: "paslanmaz-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 2,
    name: "Paslanmaz Çelik MIG Telleri",
    description: "Paslanmaz çelik kaynağı için MIG telleri.",
  },
  {
    id: "c4.1.3", code: "4.1.3", slug: "aluminyum-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 3,
    name: "Alüminyum MIG Telleri",
    description: "Alüminyum ve alaşımları için MIG telleri.",
  },
  {
    id: "c4.1.4", code: "4.1.4", slug: "gazsiz-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 4,
    name: "Gazsız Özlü MIG Telleri",
    description: "Gaz tüpü gerektirmeyen, dış mekana uygun özlü teller.",
  },
  {
    id: "c4.1.5", code: "4.1.5", slug: "gazli-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 5,
    name: "Gazlı Özlü MIG Telleri",
    description: "Yüksek verim ve derin nüfuziyet için gazlı özlü teller.",
  },
  {
    id: "c4.1.6", code: "4.1.6", slug: "metal-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 6,
    name: "Metal Özlü MIG Telleri",
    description: "Az cüruf ve yüksek yığma hızı için metal özlü teller.",
  },
  {
    id: "c4.2.1", code: "4.2.1", slug: "karbonlu-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 1,
    name: "Karbonlu Çelik TIG Telleri",
    description: "Karbonlu çelik için TIG kaynak telleri.",
  },
  {
    id: "c4.2.2", code: "4.2.2", slug: "paslanmaz-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 2,
    name: "Paslanmaz Çelik TIG Telleri",
    description: "Paslanmaz çelik için TIG kaynak telleri.",
  },
  {
    id: "c4.2.3", code: "4.2.3", slug: "aluminyum-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 3,
    name: "Alüminyum TIG Telleri",
    description: "Alüminyum ve alaşımları için TIG kaynak telleri.",
  },
];
