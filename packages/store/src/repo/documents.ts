"use client";

import type { DocumentFile, DocumentPage, DocumentSection, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { deleteFile, getFile, putFile } from "../files";
import { nowIso } from "./shared";

/**
 * BELGELER — Kesfet > Diger: MSDS, Ultimate Kaynak Rehberi, Parti Sertifikalari
 *
 * Kayit (baslik, urun, parti no, dosya adi ve boyutu) veritabaninda; dosyanin
 * kendisi dosya deposunda (../files.ts). Backend'de: documents tablosu +
 * dosya sunucusu. addDocument / updateDocument -> dosya yukleme ucu,
 * documentBlob -> dosyanin adresi.
 */

/** Dosya basina en fazla boyut */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

/** Yuklenebilecek dosya turleri */
export const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "zip"];

/** Kullaniciya gosterilecek hata (tur, boyut, depo) */
export class DocumentError extends Error {}

export interface DocumentInput {
  title: string;
  productId?: string;
  lotNumber?: string;
  active: boolean;
}

export function documentPage(section: DocumentSection, db: ZenweldDatabase = getSnapshot()): DocumentPage {
  return db.documentPages.find((p) => p.section === section) ?? { section, title: "", subtitle: "" };
}

export function saveDocumentPage(page: DocumentPage): boolean {
  return mutate((db) => {
    db.documentPages = [...db.documentPages.filter((p) => p.section !== page.section), page];
  });
}

/** Sitede gorunen belgeler: yayinda olanlar, panelde verilen sirayla. */
export function listDocuments(section: DocumentSection, db: ZenweldDatabase = getSnapshot()): DocumentFile[] {
  return db.documents.filter((d) => d.section === section && d.active);
}

/** Panel: bolumun tum belgeleri (yayinda olmayanlar dahil), sirayla. */
export function documentsOfSection(section: DocumentSection, db: ZenweldDatabase = getSnapshot()): DocumentFile[] {
  return db.documents.filter((d) => d.section === section);
}

function checkFile(file: File): void {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOCUMENT_EXTENSIONS.includes(ext)) {
    throw new DocumentError(`Bu dosya türü yüklenemez (.${ext}). Kabul edilenler: PDF, Word, Excel, JPG, PNG, ZIP.`);
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentError(`Dosya 25 MB'tan büyük (${(file.size / 1_048_576).toFixed(1)} MB).`);
  }
}

async function storeFile(id: string, file: File) {
  checkFile(file);
  const fileKey = `${id}-${Date.now().toString(36)}`;
  try {
    await putFile(fileKey, file);
  } catch {
    throw new DocumentError("Dosya kaydedilemedi: tarayıcının dosya deposu dolu ya da kapalı (gizli pencere).");
  }
  return { fileKey, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size };
}

/** Bos alanlari atar; parti no yalnizca parti sertifikalarinda tutulur. */
const cleanInput = (section: DocumentSection, input: DocumentInput) => ({
  title: input.title.trim(),
  productId: input.productId || undefined,
  lotNumber: section === "parti-sertifikalari" ? input.lotNumber?.trim() || undefined : undefined,
  active: input.active,
});

/** Kayit yazilamadi (tarayici deposu dolu): yeni yuklenen dosya geri silinir. */
async function recordFailed(fileKey?: string): Promise<never> {
  if (fileKey) await deleteFile(fileKey).catch(() => undefined);
  throw new DocumentError("Belge kaydedilemedi: tarayıcı deposu dolu. Değişiklik uygulanmadı.");
}

/** Yeni belge: once dosya depoya yazilir, sonra kayit listenin sonuna eklenir. */
export async function addDocument(section: DocumentSection, input: DocumentInput, file: File): Promise<DocumentFile> {
  const id = uid("doc");
  const stored = await storeFile(id, file);
  const at = nowIso();
  const record: DocumentFile = { id, section, ...cleanInput(section, input), ...stored, createdAt: at, updatedAt: at };
  const saved = mutate((db) => {
    db.documents.push(record);
  });
  if (!saved) await recordFailed(stored.fileKey);
  return record;
}

/** Belgeyi gunceller; yeni dosya verilirse eskisinin yerini alir. */
export async function updateDocument(id: string, input: DocumentInput, file?: File): Promise<void> {
  const current = getSnapshot().documents.find((d) => d.id === id);
  if (!current) return;
  const stored = file ? await storeFile(id, file) : undefined;
  const saved = mutate((db) => {
    const doc = db.documents.find((d) => d.id === id);
    if (doc) Object.assign(doc, cleanInput(doc.section, input), stored, { updatedAt: nowIso() });
  });
  // Eski dosya yalnizca kayit yeni dosyayi gosterdikten sonra silinir.
  if (!saved) await recordFailed(stored?.fileKey);
  if (stored) await deleteFile(current.fileKey).catch(() => undefined);
}

export function setDocumentActive(id: string, active: boolean): void {
  mutate((db) => {
    const doc = db.documents.find((d) => d.id === id);
    if (doc) doc.active = active;
  });
}

/** Kayit silinemezse (depo dolu) dosya da silinmez; false doner. */
export async function deleteDocument(id: string): Promise<boolean> {
  const doc = getSnapshot().documents.find((d) => d.id === id);
  if (!doc) return false;
  const removed = mutate((db) => {
    db.documents = db.documents.filter((d) => d.id !== id);
  });
  if (removed) await deleteFile(doc.fileKey).catch(() => undefined);
  return removed;
}

/** Belgeyi kendi bolumu icinde bir yukari (-1) veya asagi (+1) tasir. */
export function moveDocument(id: string, direction: -1 | 1): void {
  mutate((db) => {
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return;
    const siblings = db.documents.filter((d) => d.section === doc.section);
    const other = siblings[siblings.indexOf(doc) + direction];
    if (!other) return;
    const i = db.documents.indexOf(doc);
    const j = db.documents.indexOf(other);
    [db.documents[i], db.documents[j]] = [db.documents[j], db.documents[i]];
  });
}

/** Dosyanin icerigi; bu tarayicida yoksa undefined. */
export function documentBlob(doc: DocumentFile): Promise<Blob | undefined> {
  return getFile(doc.fileKey).catch(() => undefined);
}
