"use client";

import type { Category, OptionDefinition, Product, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";

/* ------------------------------------------------------------------ */
/* Secenek tanimlari (Hortum Uzunluğu, Paket ...)                      */
/* Tanimlar tek yerde durur; kategoriler optionIds ile hangilerinin     */
/* listelenecegini secer, urun secenekleri kimlikle baglanir.           */
/* ------------------------------------------------------------------ */

export function listOptionDefinitions(db: ZenweldDatabase = getSnapshot()): OptionDefinition[] {
  return db.optionDefinitions;
}

/** Tanimi listeleyen kategoriler. */
export function categoriesUsingOption(id: string, db: ZenweldDatabase = getSnapshot()): Category[] {
  return db.categories.filter((c) => c.optionIds?.includes(id));
}

/** Tanimi (valueId verilirse o degeri) kullanan urunler; kullanilan tanim ve deger silinemez. */
export function productsUsingOption(id: string, valueId?: string, db: ZenweldDatabase = getSnapshot()): Product[] {
  return db.products.filter(
    (p) =>
      p.options?.optionIds.includes(id) && (!valueId || p.options.variants.some((v) => v.values[id] === valueId)),
  );
}

/** Ekler (id bos ise) veya gunceller. Kaydedilen tanim; yazilamazsa null. */
export function saveOptionDefinition(definition: OptionDefinition): OptionDefinition | null {
  const record = { ...definition, id: definition.id || uid("opt") };
  const saved = mutate((db) => {
    const idx = db.optionDefinitions.findIndex((o) => o.id === record.id);
    if (idx >= 0) db.optionDefinitions[idx] = record;
    else db.optionDefinitions.push(record);
  });
  return saved ? record : null;
}

/** Tanimi siler; kategorilerdeki baglantisi da kalkar. Urunde kullaniliyorsa silinmez (false). */
export function deleteOptionDefinition(id: string): boolean {
  if (productsUsingOption(id).length) return false;
  return mutate((db) => {
    db.optionDefinitions = db.optionDefinitions.filter((o) => o.id !== id);
    db.categories.forEach((c) => {
      if (!c.optionIds?.includes(id)) return;
      const rest = c.optionIds.filter((x) => x !== id);
      c.optionIds = rest.length ? rest : undefined;
    });
  });
}
