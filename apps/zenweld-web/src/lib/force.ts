"use client";

import { useMemo } from "react";
import type { Product } from "@zenweld/data";
import { listProducts, useDatabase } from "@zenweld/store";

/**
 * FORCE SAYFASI VERISI (/force; KARARLAR K-114)
 *
 * Sayfada tanitilan dort makine ve en alttaki teknik tablo urun
 * kayitlarindan gelir: fiyat, stok, teknik ozellikler ve fotograf panelden
 * degisir. Tablo, Model Serisi "Force" olan yayindaki butun urunlerdir
 * (anasayfadaki Force seridiyle ayni liste); panelde Force serisine urun
 * eklenince tabloya kendiliginden girer.
 */

/** Tanitilan dort makine, sayfadaki sirayla. Sayfa gorseli zemini kaldirilmis fotograftir. */
export const FORCE_SHOWCASE = [
  { key: "mig", slug: "forcemig-200", name: "ForceMIG 200", ghost: "MIG", image: "/images/force/forcemig-200.webp" },
  { key: "tig", slug: "forcetig-200", name: "ForceTIG 200", ghost: "TIG", image: "/images/force/forcetig-200.webp" },
  { key: "arc", slug: "forcearc-200-mma", name: "ForceArc 200", ghost: "ARC", image: "/images/force/forcearc-200-mma.webp" },
  { key: "cut", slug: "forcecut-45", name: "ForceCut 45", ghost: "CUT", image: "/images/force/forcecut-45.webp" },
] as const;

export type ForceMachineKey = (typeof FORCE_SHOWCASE)[number]["key"];

/** Tablodaki aile sirasi (urun adinin ilk kelimesi); bilinmeyen aile sona gelir. */
const FAMILY_ORDER = ["forcemig", "forcetig", "forcearc", "forcecut"];

/** Urun adinin ilk kelimesi: ForceMIG, ForceArc ... */
export const forceFamily = (p: Product) => p.name.split(/\s+/)[0];

/**
 * Tablo basligindaki kisa model adi: ilk kelime ve ardindan kucuk harf
 * icermeyen kelimeler ("ForceMIG 185 MP", "ForceArc 200 MMA", "ForceCut 45").
 */
export function forceModelName(p: Product): string {
  const [first, ...rest] = p.name.split(/\s+/);
  const model = [first];
  for (const word of rest) {
    if (/\p{Ll}/u.test(word)) break;
    model.push(word);
  }
  return model.join(" ");
}

// Turkce kucuk harf "MIG"i "mıg" yapar; aile adlari Latin harfli oldugu icin toLowerCase.
const familyRank = (p: Product) => {
  const i = FAMILY_ORDER.indexOf(forceFamily(p).toLowerCase());
  return i === -1 ? FAMILY_ORDER.length : i;
};
const modelNumber = (p: Product) => Number.parseInt(p.name.split(/\s+/)[1] ?? "", 10) || 0;

/** Force serisi urunleri: aile sirasiyla, aile icinde model numarasina gore. */
export function sortForceProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => familyRank(a) - familyRank(b) || modelNumber(a) - modelNumber(b) || a.name.localeCompare(b.name, "tr"),
  );
}

/** Ayni anlamdaki satir adlari tek satirda toplanir; Marka hepsinde ayni oldugu icin gosterilmez. */
const ROW_ALIASES: Record<string, string> = {
  "Kaynak yöntemi": "Yöntem",
  "Kaynak yöntemleri": "Yöntem",
};
const HIDDEN_ROWS = new Set(["Marka"]);

export interface ForceSpecRow {
  label: string;
  /** Urunlerin sirasiyla deger; urunde bu ozellik yoksa null. */
  values: (string | null)[];
}

/**
 * Teknik tablo satirlari: urunlerin teknik ozelliklerinin birlesimi.
 * Satir sirasi, ozelligin urunlerin kendi listelerindeki ortalama yerine
 * gore: yontem ve guc bilgisi ustte, olculer ve agirlik altta kalir.
 */
export function forceSpecRows(products: Product[]): ForceSpecRow[] {
  const rows = new Map<string, { positions: number[]; values: (string | null)[] }>();
  products.forEach((p, column) => {
    const specs = p.specs ?? [];
    specs.forEach((spec, index) => {
      const label = ROW_ALIASES[spec.label] ?? spec.label;
      if (HIDDEN_ROWS.has(label) || !spec.value.trim()) return;
      const row = rows.get(label) ?? { positions: [], values: products.map(() => null) };
      row.positions.push(specs.length > 1 ? index / (specs.length - 1) : 0);
      row.values[column] = spec.value;
      rows.set(label, row);
    });
  });
  const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return [...rows.entries()]
    .sort(([, a], [, b]) => average(a.positions) - average(b.positions))
    .map(([label, row]) => ({ label, values: row.values }));
}

/** Sayfanin urunleri: tanitilan dort makine (yayinda degilse undefined) ve tablodaki seri. */
export function useForceProducts() {
  const db = useDatabase();
  return useMemo(() => {
    const visible = listProducts(db);
    const series = sortForceProducts(visible.filter((p) => p.filterValues?.["model-serisi"]?.includes("force")));
    const showcase = Object.fromEntries(
      FORCE_SHOWCASE.map((m) => [m.key, visible.find((p) => p.slug === m.slug)]),
    ) as Record<ForceMachineKey, Product | undefined>;
    return { series, showcase };
  }, [db]);
}
