"use client";

import type { FaqItem } from "@zenweld/data";
import { mutate, uid } from "../database";

/* ------------------------------------------------------------------ */
/* Sik sorulan sorular — sitede listedeki sirayla gosterilir           */
/* ------------------------------------------------------------------ */

/** Ekler veya gunceller (id bos ise yeni soru, listenin sonuna). */
export function saveFaq(faq: FaqItem): void {
  const record = { ...faq, id: faq.id || uid("f") };
  mutate((db) => {
    const idx = db.faqs.findIndex((f) => f.id === record.id);
    if (idx >= 0) db.faqs[idx] = record;
    else db.faqs.push(record);
  });
}

export function deleteFaq(id: string): void {
  mutate((db) => {
    db.faqs = db.faqs.filter((f) => f.id !== id);
  });
}

/** Soruyu bir yukari (-1) veya asagi (+1) tasir. */
export function moveFaq(id: string, direction: -1 | 1): void {
  mutate((db) => {
    const i = db.faqs.findIndex((f) => f.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= db.faqs.length) return;
    [db.faqs[i], db.faqs[j]] = [db.faqs[j], db.faqs[i]];
  });
}
