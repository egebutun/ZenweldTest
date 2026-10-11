"use client";

import type {
  AboutContent,
  RichTextStyle,
  SalesRep,
  ShopSettings,
  ZenweldDatabase,
} from "@zenweld/data";
import { defaultSettings } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Gorunum ayarlari                                                    */
/* ------------------------------------------------------------------ */

/**
 * Metin gorunum ayarlarini dondurur. Eski bir localStorage kaydinda
 * settings bulunmayabilecegi icin eksik alanlar varsayilanla tamamlanir.
 */
export function getRichTextStyle(db: ZenweldDatabase = getSnapshot()): RichTextStyle {
  return { ...defaultSettings.richText, ...(db.settings?.richText ?? {}) };
}

export function saveRichTextStyle(style: RichTextStyle): void {
  mutate((db) => {
    db.settings = { ...db.settings, richText: style };
  });
}

/* ------------------------------------------------------------------ */
/* Magaza ayarlari (kargo, taksit, havale)                             */
/* ------------------------------------------------------------------ */

export function getShopSettings(db: ZenweldDatabase = getSnapshot()): ShopSettings {
  return { ...defaultSettings.shop, ...(db.settings?.shop ?? {}) };
}

export function saveShopSettings(shop: ShopSettings): void {
  mutate((db) => {
    db.settings = { ...db.settings, shop };
  });
}

/* ------------------------------------------------------------------ */
/* Hakkimizda ve satis temsilcileri                                    */
/* ------------------------------------------------------------------ */

/** Hakkimizda sayfasinin tum icerigini kaydeder. */
export function saveAbout(about: AboutContent): void {
  mutate((db) => {
    db.about = { ...about, updatedAt: nowIso() };
  });
}

/** Sitede gorunen (aktif) temsilciler, siraya gore. */
export function listSalesReps(db: ZenweldDatabase = getSnapshot(), includeInactive = false): SalesRep[] {
  return [...(db.salesReps ?? [])]
    .filter((r) => includeInactive || r.active)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "tr"));
}

/** Ekler veya gunceller (id bos ise yeni kayit). */
export function saveSalesRep(rep: SalesRep): SalesRep {
  const record = { ...rep, id: rep.id || uid("sr") };
  mutate((db) => {
    db.salesReps = db.salesReps ?? [];
    const idx = db.salesReps.findIndex((r) => r.id === record.id);
    if (idx >= 0) db.salesReps[idx] = record;
    else db.salesReps.push(record);
  });
  return record;
}

export function deleteSalesRep(id: string): void {
  mutate((db) => {
    db.salesReps = (db.salesReps ?? []).filter((r) => r.id !== id);
  });
}
