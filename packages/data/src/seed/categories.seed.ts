import type { Category, CategoryFilter, CategoryGroup } from "../types";

/**
 * URUN KATEGORILERI
 *
 * Zenweld'in onayli kategori agaci (Ekim 2026). Uc seviye:
 *   1      ust bolum   (ekipmanlar, guvenlik ...) -> ana menu, /ekipmanlar (grup kartlari)
 *   1.1    grup        -> mega menude sol kolon, /ekipmanlar/<slug> (kategori kartlari)
 *   1.1.1  kategori    -> /ekipmanlar/<grup>/<slug>; urunler buraya baglanir
 * Urunler kategoriye yalnizca slug ile baglandigi icin kategori slug'lari tekil olmali.
 *
 * "code" alani kategori tablosundaki numaradir (siralama da buna gore).
 * Bir kategoride urun olmak zorunda degil; urunler belli oldukca eklenir.
 *
 * "image": kartlardaki gorsel (public/images/categories/). Verilmezse ilk
 * urunun fotografi kullanilir; Kaynak Makineleri bu yuzden gorselsizdir.
 */

const img = (slug: string) => `/images/categories/${slug}.svg`;

/*
 * EKIPMANLAR ALT KATEGORI FILTRELERI (KARARLAR K-76)
 *
 * Degiskenler sahibinin listesinden. Şebeke Voltajı, Amper ve Güç (W)
 * degerleri urunler kesinlesince girilecek; degeri olmayan filtre sitede
 * gorunmez. Model Serisi her kategoride orada bulunan serilerdir.
 */
const SERIES = {
  ultimate: { id: "ultimate", label: "Ultimate" },
  evomig: { id: "evomig", label: "Evomig" },
  force: { id: "force", label: "Force" },
  multicut: { id: "multicut", label: "Multicut" },
  y300: { id: "y300", label: "Y300" },
};
const filter = (id: string, name: string, values: [id: string, label: string][] = []): CategoryFilter => ({
  id,
  name,
  values: values.map(([vid, label]) => ({ id: vid, label })),
});
const modelSeries = (...series: (keyof typeof SERIES)[]): CategoryFilter => ({
  id: "model-serisi",
  name: "Model Serisi",
  values: series.map((s) => SERIES[s]),
});
const VOLTAGE = filter("sebeke-voltaji", "Şebeke Voltajı");
const CURRENT = filter("amper", "Amper");
const POWER = filter("guc", "Güç (W)");
const PHYSICAL = filter("fiziki-yapi", "Fiziki Yapı", [["portatif", "Portatif"], ["kompakt", "Kompakt"], ["cantali", "Çantalı"]]);
const MIG_MODE = filter("calisma-modu", "Çalışma Modu", [["standart", "Standart"], ["puls", "Puls"]]);

export const categoryGroups: CategoryGroup[] = [
  { id: "g1.1", code: "1.1", slug: "lazer-makineleri", section: "ekipmanlar", name: "Lazer Makineleri", image: img("lazer-makineleri"), order: 1 },
  { id: "g1.2", code: "1.2", slug: "kaynak-makineleri", section: "ekipmanlar", name: "Kaynak Makineleri", image: img("kaynak-makineleri"), order: 2 },

  { id: "g2.1", code: "2.1", slug: "kaynak-maskeleri", section: "guvenlik", name: "Kaynak Maskeleri", image: img("kaynak-maskeleri"), order: 1 },
  { id: "g2.2", code: "2.2", slug: "koruyucu-giyim", section: "guvenlik", name: "Koruyucu Giyim", image: img("koruyucu-giyim"), order: 2 },

  // Sahibinin 2026-10-28 eki; kategori tablosunda numarasi yok (KARARLAR K-05 eki).
  { id: "g3.0", slug: "lazer-aksesuarlari", section: "aksesuarlar", name: "Lazer Aksesuarları", order: 1 },
  { id: "g3.1", code: "3.1", slug: "mig-aksesuarlari", section: "aksesuarlar", name: "MIG Aksesuarları", image: img("mig-aksesuarlari"), order: 2 },
  { id: "g3.2", code: "3.2", slug: "tig-aksesuarlari", section: "aksesuarlar", name: "TIG Aksesuarları", image: img("tig-aksesuarlari"), order: 3 },
  { id: "g3.3", code: "3.3", slug: "mma-aksesuarlari", section: "aksesuarlar", name: "MMA Aksesuarları", image: img("mma-aksesuarlari"), order: 4 },
  { id: "g3.4", code: "3.4", slug: "plazma-kesme-aksesuarlari", section: "aksesuarlar", name: "Plazma Kesme Aksesuarları", image: img("plazma-kesme-aksesuarlari"), order: 5 },
  { id: "g3.5", code: "3.5", slug: "diger-aksesuarlar", section: "aksesuarlar", name: "Diğer Aksesuarlar", image: img("diger-aksesuarlar"), order: 6 },

  { id: "g4.1", code: "4.1", slug: "mig-telleri", section: "dolgu-metalleri", name: "MIG Telleri", image: img("mig-telleri"), order: 1 },
  { id: "g4.2", code: "4.2", slug: "tig-telleri", section: "dolgu-metalleri", name: "TIG Telleri", image: img("tig-telleri"), order: 2 },
];

export const categories: Category[] = [
  {
    id: "c1.1.1", code: "1.1.1", slug: "lazer-kaynak-makineleri", section: "ekipmanlar", group: "lazer-makineleri", order: 1,
    image: img("lazer-kaynak-makineleri"),
    name: "Lazer Kaynak Makineleri",
    description: "Yüksek hızda, düşük ısı girdisiyle temiz ve ince dikişli kaynak.",
    optionIds: ["tepe-guc"],
    filters: [modelSeries("y300"), VOLTAGE, PHYSICAL],
  },
  {
    id: "c1.1.2", code: "1.1.2", slug: "lazer-temizleme", section: "ekipmanlar", group: "lazer-makineleri", order: 2,
    image: img("lazer-temizleme"),
    name: "Lazer Temizleme",
    description: "Pas, boya ve oksiti yüzeye zarar vermeden kimyasalsız temizleyin.",
    filters: [
      filter("fiziki-yapi", "Fiziki Yapı", [["portatif", "Portatif"], ["kompakt", "Kompakt"]]),
      filter("lazer-tipi", "Lazer Tipi", [["fiber", "Fiber"], ["puls", "Puls"]]),
      POWER,
    ],
  },
  {
    id: "c1.1.3", code: "1.1.3", slug: "lazer-markalama", section: "ekipmanlar", group: "lazer-makineleri", order: 3,
    image: img("lazer-markalama"),
    name: "Lazer Markalama",
    description: "Metal yüzeylere kalıcı, hassas yazı, logo ve kod işleme.",
    filters: [
      filter("fiziki-yapi", "Fiziki Yapı", [["masa-tipi", "Masa Tipi"], ["portatif", "Portatif"]]),
      filter("lazer-tipi", "Lazer Tipi", [["uv", "UV"], ["fiber", "Fiber"]]),
      POWER,
    ],
  },
  {
    id: "c1.2.1", code: "1.2.1", slug: "mma-ortulu-elektrod-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 1,
    image: img("mma-ortulu-elektrod-kaynak-makineleri"),
    name: "MMA (Stick) Örtülü Elektrod Kaynak Makineleri",
    description: "Gaz kullanmadan dış mekan kaynağı ve genel imalat için ideal.",
    filters: [modelSeries("ultimate", "force"), VOLTAGE, CURRENT],
  },
  {
    id: "c1.2.2", code: "1.2.2", slug: "tig-argon-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 2,
    image: img("tig-argon-kaynak-makineleri"),
    name: "TIG (GTAW) Argon Kaynak Makineleri",
    description: "Alüminyum dahil metallerde hassas kaynak işleri için ideal.",
    optionIds: ["sogutma", "torc-uzunlugu"],
    filters: [modelSeries("ultimate", "force"), VOLTAGE, CURRENT, filter("calisma-modu", "Çalışma Modu", [["dc", "DC"], ["ac-dc", "AC/DC"]])],
  },
  {
    id: "c1.2.3", code: "1.2.3", slug: "mig-gazalti-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 3,
    image: img("mig-gazalti-kaynak-makineleri"),
    name: "MIG (GMAW) Gazaltı Kaynak Makineleri",
    description: "Araç panelinden metal imalatına kadar hızlı ve istikrarlı kaynak.",
    optionIds: ["sogutma", "torc-uzunlugu", "ara-paket-uzunlugu"],
    filters: [modelSeries("ultimate", "evomig"), VOLTAGE, CURRENT, MIG_MODE, PHYSICAL],
  },
  {
    id: "c1.2.4", code: "1.2.4", slug: "cok-fonksiyonlu-kaynak-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 4,
    image: img("cok-fonksiyonlu-kaynak-makineleri"),
    name: "Çok Fonksiyonlu Kaynak Makineleri",
    description: "Tek makinede birden fazla kaynak yönteminin esnekliği.",
    // MIG ile ayni filtreler (K-76)
    filters: [modelSeries("ultimate", "evomig", "force"), VOLTAGE, CURRENT, MIG_MODE, PHYSICAL],
  },
  {
    id: "c1.2.5", code: "1.2.5", slug: "plazma-kesim-makineleri", section: "ekipmanlar", group: "kaynak-makineleri", order: 5,
    image: img("plazma-kesim-makineleri"),
    name: "Plazma Kesim Makineleri",
    description: "Karbon çeliği, paslanmaz ve alüminyumda temiz kesim performansı.",
    filters: [modelSeries("multicut", "force"), VOLTAGE, CURRENT],
  },
  {
    id: "c2.1.1", code: "2.1.1", slug: "otomatik-kararan-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 1,
    image: img("otomatik-kararan-bas-maskeleri"),
    name: "Otomatik Kararan Baş Maskeleri",
    description: "Ark anında kendiliğinden kararan, gözü koruyan kaynak maskeleri.",
  },
  {
    id: "c2.1.2", code: "2.1.2", slug: "lazer-isini-koruyucu-bas-maskeleri", section: "guvenlik", group: "kaynak-maskeleri", order: 2,
    image: img("lazer-isini-koruyucu-bas-maskeleri"),
    name: "Lazer Işını Koruyucu Baş Maskeleri",
    description: "Lazer kaynak ve temizlikte yüzü ve gözleri koruyan maskeler.",
  },
  {
    id: "c2.1.3", code: "2.1.3", slug: "lazer-isini-koruyucu-gozlukler", section: "guvenlik", group: "kaynak-maskeleri", order: 3,
    image: img("lazer-isini-koruyucu-gozlukler"),
    name: "Lazer Işını Koruyucu Gözlükler",
    description: "Lazer dalga boyuna uygun, sertifikalı koruyucu gözlükler.",
  },
  {
    id: "c2.2.1", code: "2.2.1", slug: "kaynak-eldivenleri", section: "guvenlik", group: "koruyucu-giyim", order: 1,
    image: img("kaynak-eldivenleri"),
    name: "Kaynak Eldivenleri",
    description: "Isıya ve kıvılcıma dayanıklı deri kaynak eldivenleri.",
  },
  {
    id: "c2.2.2", code: "2.2.2", slug: "kaynak-onlukleri", section: "guvenlik", group: "koruyucu-giyim", order: 2,
    image: img("kaynak-onlukleri"),
    name: "Kaynak Önlükleri",
    description: "Kıvılcım ve cürufa karşı vücudu koruyan deri önlükler.",
  },
  {
    id: "c3.0.1", slug: "lazer-kaynak-kafalari", section: "aksesuarlar", group: "lazer-aksesuarlari", order: 1,
    name: "Lazer Kaynak Kafaları",
    description:
      "El tipi kaynak kafaları (27S gibi), otomasyon ve robot kafaları (25A gibi) ile kafa, kablo ve bağlantı elemanlarının birlikte satıldığı komple kafa setleri.",
  },
  {
    id: "c3.0.2", slug: "lazer-temizleme-kafalari", section: "aksesuarlar", group: "lazer-aksesuarlari", order: 2,
    name: "Lazer Temizleme Kafaları",
    description: "El tipi lazer temizleme kafaları ve setleri.",
  },
  {
    id: "c3.0.3", slug: "lazer-tel-surme-uniteleri", section: "aksesuarlar", group: "lazer-aksesuarlari", order: 3,
    name: "Lazer Tel Sürme Üniteleri",
    description: "Tek tel, çift tel ve üç tel sürme üniteleri ile tel sürme kabloları ve bağlantı parçaları.",
  },
  {
    id: "c3.0.4", slug: "lazer-sarf-malzemeleri", section: "aksesuarlar", group: "lazer-aksesuarlari", order: 4,
    name: "Lazer Sarf Malzemeleri",
    description:
      "Sık değişen, stoktan satılan kalemler: koruyucu lensler (koruyucu camlar), kaynak nozulları, tel kılavuz uçları, conta ve O-ringler.",
  },
  {
    id: "c3.0.5", slug: "lazer-yedek-parcalari", section: "aksesuarlar", group: "lazer-aksesuarlari", order: 5,
    name: "Lazer Yedek Parçaları",
    description:
      "Servis ve arıza nedeniyle değişen kalemler: odaklama ve kolimatör lensleri, lens tutucular ve kartuşlar, fiber kablolar, kafa içi kartlar, sensörler ve motorlar.",
  },
  {
    id: "c3.1.1", code: "3.1.1", slug: "mig-torclari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 1,
    image: img("mig-torclari"),
    name: "MIG Torçları",
    description: "Euro bağlantılı MIG kaynak torçları ve torç setleri.",
    optionIds: ["hortum-uzunlugu"],
  },
  {
    id: "c3.1.2", code: "3.1.2", slug: "push-pull-torclar", section: "aksesuarlar", group: "mig-aksesuarlari", order: 2,
    image: img("push-pull-torclar"),
    name: "Push Pull Torçlar",
    description: "Alüminyum ve uzun mesafede düzgün tel beslemesi için.",
  },
  {
    id: "c3.1.3", code: "3.1.3", slug: "booster-10-m", section: "aksesuarlar", group: "mig-aksesuarlari", order: 3,
    image: img("booster-10-m"),
    name: "Booster 10 m",
    description: "Tel sürmeyi 10 metreye kadar uzatan ara besleme ünitesi.",
  },
  {
    id: "c3.1.4", code: "3.1.4", slug: "mig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "mig-aksesuarlari", order: 4,
    image: img("mig-torc-sarf-malzemeleri"),
    name: "MIG Torç Sarf Malzemeleri",
    description: "Gaz nozulu, kontak meme ve diğer MIG sarf malzemeleri.",
    optionIds: ["paket"],
  },
  {
    id: "c3.1.5", code: "3.1.5", slug: "mig-torc-yedek-parcalari", section: "aksesuarlar", group: "mig-aksesuarlari", order: 5,
    image: img("mig-torc-yedek-parcalari"),
    name: "MIG Torç Yedek Parçaları",
    description: "MIG torçları için gövde, boyun, hortum ve tetik yedekleri.",
  },
  {
    id: "c3.2.1", code: "3.2.1", slug: "tig-torclari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 1,
    image: img("tig-torclari"),
    name: "TIG Torçları",
    description: "Hava ve su soğutmalı TIG kaynak torçları.",
  },
  {
    id: "c3.2.2", code: "3.2.2", slug: "tig-torc-sarf-malzemeleri", section: "aksesuarlar", group: "tig-aksesuarlari", order: 2,
    image: img("tig-torc-sarf-malzemeleri"),
    name: "TIG Torç Sarf Malzemeleri",
    description: "Pens, seramik nozul, gaz lensi ve diğer TIG sarf malzemeleri.",
  },
  {
    id: "c3.2.3", code: "3.2.3", slug: "tig-torc-yedek-parcalari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 3,
    image: img("tig-torc-yedek-parcalari"),
    name: "TIG Torç Yedek Parçaları",
    description: "TIG torçları için kafa, gövde ve hortum yedekleri.",
  },
  {
    id: "c3.2.4", code: "3.2.4", slug: "ayak-pedallari", section: "aksesuarlar", group: "tig-aksesuarlari", order: 4,
    image: img("ayak-pedallari"),
    name: "Ayak Pedalları",
    description: "Kaynak akımını ayakla hassas şekilde ayarlamak için.",
  },
  {
    id: "c3.2.5", code: "3.2.5", slug: "tungsten-elektrodlar", section: "aksesuarlar", group: "tig-aksesuarlari", order: 5,
    image: img("tungsten-elektrodlar"),
    name: "Tungsten Elektrodlar",
    description: "Farklı malzeme ve akımlar için renk kodlu tungsten elektrodlar.",
  },
  {
    id: "c3.3.1", code: "3.3.1", slug: "elektrod-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 1,
    image: img("elektrod-pense-ve-kitleri"),
    name: "Elektrod Pense ve Kitleri",
    description: "Elektrod pensleri ve kablolu hazır kitler.",
  },
  {
    id: "c3.3.2", code: "3.3.2", slug: "sase-pense-ve-kitleri", section: "aksesuarlar", group: "mma-aksesuarlari", order: 2,
    image: img("sase-pense-ve-kitleri"),
    name: "Şase Pense ve Kitleri",
    description: "Şase pensleri ve kablolu hazır kitler.",
  },
  {
    id: "c3.4.1", code: "3.4.1", slug: "plazma-torclari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 1,
    image: img("plazma-torclari"),
    name: "Plazma Torçları",
    description: "Elle ve CNC kesim için plazma torçları.",
  },
  {
    id: "c3.4.2", code: "3.4.2", slug: "plazma-torc-sarf-malzemeleri", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 2,
    image: img("plazma-torc-sarf-malzemeleri"),
    name: "Plazma Torç Sarf Malzemeleri",
    description: "Elektrod, meme ve diğer plazma sarf malzemeleri.",
  },
  {
    id: "c3.4.3", code: "3.4.3", slug: "plazma-torc-yedek-parcalari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 3,
    image: img("plazma-torc-yedek-parcalari"),
    name: "Plazma Torç Yedek Parçaları",
    description: "Plazma torçları için gövde ve hortum yedekleri.",
  },
  {
    id: "c3.4.4", code: "3.4.4", slug: "plazma-torc-aparatlari", section: "aksesuarlar", group: "plazma-kesme-aksesuarlari", order: 4,
    image: img("plazma-torc-aparatlari"),
    name: "Plazma Torç Aparatları",
    description: "Daire kesme pergeli, kılavuz ve mesafe aparatları.",
  },
  {
    id: "c3.5.1", code: "3.5.1", slug: "su-sogutmalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 1,
    image: img("su-sogutmalar"),
    name: "Su Soğutmalar",
    description: "Yüksek akımda torcu serin tutan su soğutma üniteleri.",
  },
  {
    id: "c3.5.2", code: "3.5.2", slug: "tasiyici-arabalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 2,
    image: img("tasiyici-arabalar"),
    name: "Taşıyıcı Arabalar",
    description: "Makine, tüp ve aksesuarları taşımak için arabalar.",
  },
  {
    id: "c3.5.3", code: "3.5.3", slug: "tel-surme-uniteleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 3,
    image: img("tel-surme-uniteleri"),
    name: "Tel Sürme Üniteleri",
    description: "Ayrı tel sürme üniteleri ve besleme sistemleri.",
  },
  {
    id: "c3.5.4", code: "3.5.4", slug: "tel-surme-makaralari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 4,
    image: img("tel-surme-makaralari"),
    name: "Tel Sürme Makaraları",
    description: "Tel çapına ve tipine uygun tel sürme makaraları.",
  },
  {
    id: "c3.5.5", code: "3.5.5", slug: "kaynak-kablolari", section: "aksesuarlar", group: "diger-aksesuarlar", order: 5,
    image: img("kaynak-kablolari"),
    name: "Kaynak Kabloları",
    description: "Esnek, yüksek akım taşıyan kaynak kabloları.",
  },
  {
    id: "c3.5.6", code: "3.5.6", slug: "uzaktan-kumandalar", section: "aksesuarlar", group: "diger-aksesuarlar", order: 6,
    image: img("uzaktan-kumandalar"),
    name: "Uzaktan Kumandalar",
    description: "Kaynak ayarlarını makineye gitmeden değiştirin.",
  },
  {
    id: "c3.5.7", code: "3.5.7", slug: "karbon-kesme-elektrod-ve-penseleri", section: "aksesuarlar", group: "diger-aksesuarlar", order: 7,
    image: img("karbon-kesme-elektrod-ve-penseleri"),
    name: "Karbon Kesme Elektrod ve Penseleri",
    description: "Oluk açma ve kaynak sökme için karbon elektrod ve penseler.",
  },
  {
    id: "c4.1.1", code: "4.1.1", slug: "karbonlu-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 1,
    image: img("karbonlu-celik-mig-telleri"),
    name: "Karbonlu Çelik MIG Telleri",
    description: "Genel çelik imalatı için bakır kaplı gazaltı telleri.",
  },
  {
    id: "c4.1.2", code: "4.1.2", slug: "paslanmaz-celik-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 2,
    image: img("paslanmaz-celik-mig-telleri"),
    name: "Paslanmaz Çelik MIG Telleri",
    description: "Paslanmaz çelik kaynağı için MIG telleri.",
  },
  {
    id: "c4.1.3", code: "4.1.3", slug: "aluminyum-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 3,
    image: img("aluminyum-mig-telleri"),
    name: "Alüminyum MIG Telleri",
    description: "Alüminyum ve alaşımları için MIG telleri.",
  },
  {
    id: "c4.1.4", code: "4.1.4", slug: "gazsiz-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 4,
    image: img("gazsiz-ozlu-mig-telleri"),
    name: "Gazsız Özlü MIG Telleri",
    description: "Gaz tüpü gerektirmeyen, dış mekana uygun özlü teller.",
  },
  {
    id: "c4.1.5", code: "4.1.5", slug: "gazli-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 5,
    image: img("gazli-ozlu-mig-telleri"),
    name: "Gazlı Özlü MIG Telleri",
    description: "Yüksek verim ve derin nüfuziyet için gazlı özlü teller.",
  },
  {
    id: "c4.1.6", code: "4.1.6", slug: "metal-ozlu-mig-telleri", section: "dolgu-metalleri", group: "mig-telleri", order: 6,
    image: img("metal-ozlu-mig-telleri"),
    name: "Metal Özlü MIG Telleri",
    description: "Az cüruf ve yüksek yığma hızı için metal özlü teller.",
  },
  {
    id: "c4.2.1", code: "4.2.1", slug: "karbonlu-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 1,
    image: img("karbonlu-celik-tig-telleri"),
    name: "Karbonlu Çelik TIG Telleri",
    description: "Karbonlu çelik için TIG kaynak telleri.",
  },
  {
    id: "c4.2.2", code: "4.2.2", slug: "paslanmaz-celik-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 2,
    image: img("paslanmaz-celik-tig-telleri"),
    name: "Paslanmaz Çelik TIG Telleri",
    description: "Paslanmaz çelik için TIG kaynak telleri.",
  },
  {
    id: "c4.2.3", code: "4.2.3", slug: "aluminyum-tig-telleri", section: "dolgu-metalleri", group: "tig-telleri", order: 3,
    image: img("aluminyum-tig-telleri"),
    name: "Alüminyum TIG Telleri",
    description: "Alüminyum ve alaşımları için TIG kaynak telleri.",
  },
];
