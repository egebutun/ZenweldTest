"use client";

import { LEGAL_ROUTES, type LegalPage, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Yasal metinler                                                      */
/* ------------------------------------------------------------------ */

/** Alt bilgideki sirayla tum yasal metinler. */
export function listLegalPages(db: ZenweldDatabase = getSnapshot()): LegalPage[] {
  return LEGAL_ROUTES.map((r) => db.legalPages.find((p) => p.id === r.id)).filter(
    (p): p is LegalPage => Boolean(p),
  );
}

export function findLegalPage(id: string, db: ZenweldDatabase = getSnapshot()): LegalPage | undefined {
  return db.legalPages.find((p) => p.id === id);
}

export function saveLegalPage(page: LegalPage): void {
  mutate((db) => {
    const idx = db.legalPages.findIndex((p) => p.id === page.id);
    if (idx >= 0) db.legalPages[idx] = { ...page, updatedAt: nowIso() };
  });
}
