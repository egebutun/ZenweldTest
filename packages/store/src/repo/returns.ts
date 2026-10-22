"use client";

import { canRequestReturn, returnableQuantities, type ReturnRequest, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nextCode, nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Iade (cayma) talepleri                                              */
/* ------------------------------------------------------------------ */

export function listReturnRequests(db: ZenweldDatabase = getSnapshot()): ReturnRequest[] {
  return [...db.returnRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function returnRequestsForOrder(orderId: string, db: ZenweldDatabase = getSnapshot()): ReturnRequest[] {
  return listReturnRequests(db).filter((r) => r.orderId === orderId);
}

export type NewReturnRequest = Omit<ReturnRequest, "id" | "code" | "status" | "createdAt" | "updatedAt">;

/**
 * Iade talebi acar. Kurallar (packages/data/src/returns.ts) kayit aninda
 * guncel veriyle yeniden denetlenir: uyenin kendi siparisi, bireysel uye,
 * sure icinde, acik talep yok, adetler iade edilebilecek adedi asmiyor.
 * Kurala uymazsa false doner.
 */
export function createReturnRequest(input: NewReturnRequest): ReturnRequest | false {
  const at = nowIso();
  const record: ReturnRequest = { ...input, id: uid("iad"), code: "", status: "new", createdAt: at, updatedAt: at };
  let created = false;
  mutate((draft) => {
    const order = draft.orders.find((o) => o.id === input.orderId);
    const user = draft.users.find((u) => u.id === input.userId);
    if (!order || !user || order.userId !== user.id) return;
    if (!canRequestReturn(order, user.role, draft.returnRequests)) return;
    const left = returnableQuantities(order, draft.returnRequests);
    const valid = (item: ReturnRequest["items"][number]) =>
      Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= (left[item.line] ?? 0);
    if (!input.items.length || !input.items.every(valid)) return;
    // Numara kayit aninda en guncel listeden verilir.
    record.code = nextCode(draft, draft.returnRequests.map((r) => r.code), `IAD-${new Date().getFullYear()}-`, 4);
    draft.returnRequests.unshift({ ...record });
    created = true;
  });
  return created ? record : false;
}

/** Panelden durum ve ic not. Tarayici deposuna yazilamazsa false. */
export function saveReturnRequest(request: ReturnRequest): boolean {
  return mutate((db) => {
    const i = db.returnRequests.findIndex((r) => r.id === request.id);
    if (i >= 0) db.returnRequests[i] = { ...request, updatedAt: nowIso() };
  });
}
