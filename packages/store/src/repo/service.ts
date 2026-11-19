"use client";

import { memberServiceRequest, turkeyYear, type MemberServiceRequest, type ServiceRequest, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nextCode, nowIso } from "./shared";
import { newestFirst } from "@zenweld/utils";

/* ------------------------------------------------------------------ */
/* Servis talepleri                                                    */
/* ------------------------------------------------------------------ */

export function listServiceRequests(db: ZenweldDatabase = getSnapshot()): ServiceRequest[] {
  return [...db.serviceRequests].sort((a, b) => newestFirst(a.createdAt, b.createdAt));
}

/** Uyenin talepleri (Hesabim › Servis Taleplerim): ic not ve atanan servis yok (KARARLAR K-117). */
export function serviceRequestsForUser(userId: string, db: ZenweldDatabase = getSnapshot()): MemberServiceRequest[] {
  return listServiceRequests(db)
    .filter((r) => r.userId === userId)
    .map(memberServiceRequest);
}

/** Tarayici deposuna yazilamazsa (depo dolu) kayit yapilmaz ve null doner. */
export function createServiceRequest(
  request: Omit<ServiceRequest, "id" | "code" | "status" | "createdAt" | "updatedAt">,
): ServiceRequest | null {
  const at = nowIso();
  const record: ServiceRequest = {
    ...request,
    id: uid("srv"),
    code: "",
    status: "new",
    createdAt: at,
    updatedAt: at,
  };
  const saved = mutate((draft) => {
    // Numara kayit aninda en guncel listeden verilir.
    record.code = nextCode(draft, draft.serviceRequests.map((r) => r.code), `SRV-${turkeyYear(new Date())}-`, 4);
    draft.serviceRequests.unshift({ ...record });
  });
  return saved ? record : null;
}

/** Tarayici deposuna yazilamazsa false. */
export function saveServiceRequest(request: ServiceRequest): boolean {
  return mutate((db) => {
    const idx = db.serviceRequests.findIndex((r) => r.id === request.id);
    if (idx >= 0) db.serviceRequests[idx] = { ...request, updatedAt: nowIso() };
  });
}
