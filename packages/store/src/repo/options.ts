"use client";

import type { Category, OptionDefinition, ZenweldDatabase } from "@zenweld/data";
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

/** Tanimi siler; kategorilerdeki baglantisi da kalkar. */
export function deleteOptionDefinition(id: string): boolean {
  return mutate((db) => {
    db.optionDefinitions = db.optionDefinitions.filter((o) => o.id !== id);
    db.categories.forEach((c) => {
      if (!c.optionIds?.includes(id)) return;
      const rest = c.optionIds.filter((x) => x !== id);
      c.optionIds = rest.length ? rest : undefined;
    });
  });
}
