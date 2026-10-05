import type { AboutContent, SalesRep } from "../types";
import { stockPhotos } from "./images";

/**
 * HAKKIMIZDA SAYFASI — baslangic icerigi
 *
 * Yonetim panelinden (/yonetim/hakkimizda) duzenlenir. Bolumlerin metni
 * ornektir; Zenweld'in onayli metni geldiginde panelden degistirilir.
 */
export const about: AboutContent = {
  heroTitle: { tr: "Hakkımızda", en: "About Us" },
  heroSubtitle: {
    tr: "Türkiye'nin kaynak teknolojileri markası",
    en: "Türkiye's welding technology brand",
  },
  heroImage: stockPhotos.industrialShop,
  stats: [
    { id: "s1", value: "30+", label: { tr: "Yetkili Bayi", en: "Authorised Dealers" } },
    { id: "s2", value: "60+", label: { tr: "Ürün", en: "Products" } },
    { id: "s3", value: "25+", label: { tr: "Yıllık Tecrübe", en: "Years of Experience" } },
    { id: "s4", value: "%100", label: { tr: "Yerli Üretim", en: "Made in Türkiye" } },
  ],
  sections: [
    {
      id: "a1",
      title: { tr: "Biz Kimiz?", en: "Who We Are" },
      body: {
        tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      },
    },
    {
      id: "a2",
      title: { tr: "Vizyonumuz ve Misyonumuz", en: "Our Vision and Mission" },
      body: {
        tr: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n- Lorem ipsum dolor sit amet\n- Consectetur adipiscing elit\n- Sed do eiusmod tempor",
        en: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n- Lorem ipsum dolor sit amet\n- Consectetur adipiscing elit\n- Sed do eiusmod tempor",
      },
    },
  ],
  updatedAt: "2026-10-05T09:00:00+03:00",
};

/**
 * SATIS TEMSILCILERIMIZ
 *
 * Zenweld'in verdigi liste (Ekim 2026). Yonetim panelinden
 * (/yonetim/satis-temsilcileri) eklenir, duzenlenir, silinir.
 */
const reps: [string, string, string, string, string][] = [
  ["Murat Kapucu", "İstanbul Avrupa Yakası", "Istanbul European Side", "+90 542 829 29 88", "murat.kapucu@zentek.com.tr"],
  ["Ümit Kapucu", "İstanbul Avrupa Yakası", "Istanbul European Side", "+90 533 370 94 63", "umit.kapucu@zentek.com.tr"],
  ["Murat Ulubaba", "İstanbul Anadolu Yakası", "Istanbul Anatolian Side", "+90 533 898 13 87", "murat.ulubaba@zenweld.com"],
  ["Emre Subaşı", "İstanbul Anadolu Yakası", "Istanbul Anatolian Side", "+90 535 677 55 78", "emre.subasi@zenweld.com"],
  ["Hüseyin Sevim", "Bursa Bölge", "Bursa Region", "+90 535 883 46 88", "huseyin.sevim@zenweld.com"],
  ["Hüseyin Açıkel", "Ege Bölge", "Aegean Region", "+90 535 883 50 95", "huseyin.acikel@zenweld.com"],
  ["Emrah Akyıldız", "Ege Bölge", "Aegean Region", "+90 530 955 41 12", "emrah.akyildiz@zenweld.com"],
  ["Hasan Kurtoğlu", "Akdeniz Bölge", "Mediterranean Region", "+90 553 379 33 36", "hasan.kurtoglu@zenweld.com"],
  ["Mehmet Yıldırım", "Akdeniz Bölge", "Mediterranean Region", "+90 535 883 50 97", "mehmet.yildirim@zenweld.com"],
  ["Harun Yaşın", "İç Anadolu Bölgesi", "Central Anatolia Region", "+90 533 409 12 49", "harun.yasin@zenweld.com"],
  ["Tuncay Sülün", "Demo ve Satış Sonrası Hizmetler Uzmanı", "Demo & After-Sales Services Specialist", "+90 507 837 55 56", "tuncay.sulun@zenweld.com"],
];

export const salesReps: SalesRep[] = reps.map(([name, tr, en, phone, email], i) => ({
  id: `sr${i + 1}`,
  name,
  region: { tr, en },
  phone,
  email,
  order: i + 1,
  active: true,
}));
