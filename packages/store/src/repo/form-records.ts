"use client";

import {
  dealerApplicationFields,
  type DealerApplication,
  type SupportMessage,
  type ZenweldDatabase,
} from "@zenweld/data";
import { mutate, uid } from "../database";
import { nowIso } from "./shared";
import { newestFirst as byNewest } from "@zenweld/utils";

/* ------------------------------------------------------------------ */
/* Form kayitlari: bayilik basvurusu, mesaj                           */
/* ------------------------------------------------------------------ */
/*
 * Demo modunda (KARARLAR K-109) bu formlar e-postayla birlikte tarayiciya
 * da kaydedilir ve panelde gorunur. Veritabani modunda kayit sunucudadir
 * (packages/db › forms.ts, admin-requests.ts); bu fonksiyonlar kullanilmaz.
 */

const newestFirst = <T extends { createdAt: string }>(list: T[] | undefined): T[] =>
  [...(list ?? [])].sort((a, b) => byNewest(a.createdAt, b.createdAt));

export const listDealerApplications = (db: ZenweldDatabase) => newestFirst(db.dealerApplications);
export const listSupportMessages = (db: ZenweldDatabase) => newestFirst(db.supportMessages);

/** Bayilik formu (/api/bayilik alanlariyla). Tarayici deposuna yazilamazsa false. */
export function addDealerApplication(values: Record<string, string | undefined>, userId?: string): boolean {
  const at = nowIso();
  const record: DealerApplication = { ...dealerApplicationFields(values), id: uid("bas"), status: "new", userId, createdAt: at, updatedAt: at };
  return mutate((db) => {
    db.dealerApplications = [record, ...(db.dealerApplications ?? [])];
  });
}

/** Iletisim formu ya da urun destek sorusu; urun kodundan urun bulunur. */
export function addSupportMessage(
  message: Omit<SupportMessage, "id" | "status" | "productId" | "createdAt" | "updatedAt">,
): boolean {
  const at = nowIso();
  return mutate((db) => {
    const product = message.productSku ? db.products.find((p) => p.sku === message.productSku) : undefined;
    const record: SupportMessage = { ...message, id: uid("msg"), status: "new", productId: product?.id, createdAt: at, updatedAt: at };
    db.supportMessages = [record, ...(db.supportMessages ?? [])];
  });
}

/** Panel: durum ve ic not (bos not silinir). */
export function setDealerApplicationStatus(id: string, status: DealerApplication["status"], adminNote: string): boolean {
  return mutate((db) => {
    const record = db.dealerApplications?.find((a) => a.id === id);
    if (record) Object.assign(record, { status, adminNote: adminNote || undefined, updatedAt: nowIso() });
  });
}

export function setSupportMessageStatus(id: string, status: SupportMessage["status"], adminNote: string): boolean {
  return mutate((db) => {
    const record = db.supportMessages?.find((m) => m.id === id);
    if (record) Object.assign(record, { status, adminNote: adminNote || undefined, updatedAt: nowIso() });
  });
}
