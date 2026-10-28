import type { OptionDefinition } from "../types";

/**
 * SECENEK TANIMLARI (panelde Ürünler › Seçenek Tanımları)
 *
 * Kategoriler hangi tanimlarin listelenecegini optionIds ile secer
 * (categories.seed.ts): MIG Torçları → Hortum Uzunluğu, MIG Torç Sarf
 * Malzemeleri → Paket, TIG makineleri → Soğutma ve Torç Uzunluğu, MIG
 * makineleri → bunlar ve Ara Paket Uzunluğu, Lazer Kaynak → Tepe Güç.
 *
 * !! Ara Paket Uzunluğu degerleri (5 m, 10 m) TEMSILIDIR; gercekleri gelince
 * duzeltilecek (docs/YAPILACAKLAR.md › Ürün içeriği).
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
  {
    id: "sogutma",
    name: "Soğutma",
    values: [
      { id: "hava", label: "Hava Soğutmalı" },
      { id: "su", label: "Su Soğutmalı" },
    ],
  },
  {
    id: "torc-uzunlugu",
    name: "Torç Uzunluğu",
    values: [
      { id: "3-m", label: "3 m" },
      { id: "4-m", label: "4 m" },
      { id: "5-m", label: "5 m" },
      { id: "8-m", label: "8 m" },
    ],
  },
  {
    id: "ara-paket-uzunlugu",
    name: "Ara Paket Uzunluğu",
    values: [
      { id: "5-m", label: "5 m" },
      { id: "10-m", label: "10 m" },
    ],
  },
  {
    id: "tepe-guc",
    name: "Tepe Güç",
    values: [
      { id: "600-w", label: "600 W" },
      { id: "1000-w", label: "1000 W" },
    ],
  },
];
