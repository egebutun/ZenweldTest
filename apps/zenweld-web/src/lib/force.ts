"use client";

import { useMemo } from "react";
import type { Product } from "@zenweld/data";
import { listProducts, useDatabase } from "@zenweld/store";

/**
 * FORCE SAYFASI VERISI (/force; KARARLAR K-114)
 *
 * Sayfada dort makine tanitilir. Turu, slogani, one cikan ozellikleri,
 * ozellik simgeleri ve teknik tablosu sahibinin Force katalogundan gelir
 * (yazilar packages/i18n › forcePage); urun kayitlarindaki teknik
 * ozellikleri degistirmez. Fiyat, stok, sepet ve urun sayfasi baglantisi
 * urun kayitlarindan gelir (slug ile bulunur).
 */

/** Katalogdaki ozellik simgeleri (adlari i18n › forcePage.featureLabels). */
type ForceFeature =
  | "thermal"
  | "emc"
  | "arcForce"
  | "hotStart"
  | "antiStick"
  | "lcd"
  | "generator"
  | "ipTest"
  | "igbt"
  | "synergic";

/**
 * Tanitilan dort makine, sayfadaki sirayla. Sayfa gorseli zemini kaldirilmis
 * fotograftir; features katalogda o makinenin altindaki simgelerdir.
 */
export const FORCE_SHOWCASE: readonly {
  key: "mig" | "tig" | "arc" | "cut";
  slug: string;
  name: string;
  ghost: string;
  image: string;
  features: readonly ForceFeature[];
}[] = [
  {
    key: "mig",
    slug: "forcemig-200",
    name: "ForceMIG 200",
    ghost: "MIG",
    image: "/images/force/forcemig-200.webp",
    features: ["thermal", "emc", "generator", "lcd", "igbt", "ipTest", "synergic"],
  },
  {
    key: "tig",
    slug: "forcetig-200",
    name: "ForceTIG 200",
    ghost: "TIG",
    image: "/images/force/forcetig-200.webp",
    features: ["thermal", "emc", "arcForce", "hotStart", "antiStick", "lcd", "generator", "ipTest", "igbt", "synergic"],
  },
  {
    key: "arc",
    slug: "forcearc-200-mma",
    name: "ForceArc 200",
    ghost: "ARC",
    image: "/images/force/forcearc-200-mma.webp",
    features: ["thermal", "emc", "arcForce", "hotStart", "antiStick", "lcd", "generator", "ipTest", "igbt", "synergic"],
  },
  {
    key: "cut",
    slug: "forcecut-45",
    name: "ForceCut 45",
    ghost: "CUT",
    image: "/images/force/forcecut-45.webp",
    features: ["thermal", "emc", "generator", "lcd", "igbt", "ipTest"],
  },
];

export type ForceMachine = (typeof FORCE_SHOWCASE)[number];
export type ForceMachineKey = ForceMachine["key"];

/** Teknik tablonun satirlari, katalogdaki sirayla (adlari i18n › forcePage.specLabels). */
export const FORCE_SPEC_ROWS = [
  "code",
  "voltage",
  "power",
  "current",
  "duty",
  "openVoltage",
  "efficiency",
  "protection",
  "insulation",
  "size",
  "weight",
] as const;

/** Tanitilan dort makinenin urun kaydi (yayinda degilse undefined): fiyat, stok, sepet. */
export function useForceProducts(): Record<ForceMachineKey, Product | undefined> {
  const db = useDatabase();
  return useMemo(() => {
    const visible = listProducts(db);
    return Object.fromEntries(FORCE_SHOWCASE.map((m) => [m.key, visible.find((p) => p.slug === m.slug)])) as Record<
      ForceMachineKey,
      Product | undefined
    >;
  }, [db]);
}
