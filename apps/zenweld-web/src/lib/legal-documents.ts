import type { LegalPageId } from "@zenweld/data";

/**
 * Siparis sozlesmeleri: odeme sayfasinda ve siparis detayinda gosterilen
 * Ön Bilgilendirme Formu ve Mesafeli Satis Sozlesmesi. Satici, alici ve
 * urun tablolari otomatiktir; altindaki metin panelin "Yasal Metinler"
 * ekranindan duzenlenir (bu kimliklerle). Sunucu da bu sayfalarin metnini
 * yalnizca sozlesme gosteren sayfalara gonderir (lib/server/content.ts).
 */
export type LegalDocumentKind = "preInfo" | "contract";

export const DOC_ID: Record<LegalDocumentKind, LegalPageId> = {
  preInfo: "on-bilgilendirme-formu",
  contract: "mesafeli-satis-sozlesmesi",
};

export const CONTRACT_PAGE_IDS: LegalPageId[] = Object.values(DOC_ID);
