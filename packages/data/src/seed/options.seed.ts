import type { OptionDefinition } from "../types";

/**
 * ORNEK SECENEK TANIMLARI (panelde Ürünler › Seçenek Tanımları)
 *
 * Kategoriler hangi tanimlarin listelenecegini optionIds ile secer
 * (categories.seed.ts): MIG Torçları → Hortum Uzunluğu,
 * MIG Torç Sarf Malzemeleri → Paket.
 */
export const optionDefinitions: OptionDefinition[] = [
  {
    id: "hortum-uzunlugu",
    name: "Hortum Uzunluğu",
    values: [
      { id: "3-m", label: "3 m" },
      { id: "4-m", label: "4 m" },
      { id: "5-m", label: "5 m" },
      { id: "10-m", label: "10 m" },
    ],
  },
  {
    id: "paket",
    name: "Paket",
    values: [
      { id: "10-lu", label: "10'lu" },
      { id: "20-li", label: "20'li" },
    ],
  },
];
