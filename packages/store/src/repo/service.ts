"use client";

import type { ServiceRequest, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nextCode, nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Servis talepleri                                                    */
/* ------------------------------------------------------------------ */

export function listServiceRequests(db: ZenweldDatabase = getSnapshot()): ServiceRequest[] {
  return [...db.serviceRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createServiceRequest(
  request: Omit<ServiceRequest, "id" | "code" | "status" | "createdAt" | "updatedAt">,
): ServiceRequest {
  const at = nowIso();
  const record: ServiceRequest = {
    ...request,
    id: uid("srv"),
    code: "",
    status: "new",
    createdAt: at,
    updatedAt: at,
  };
  mutate((draft) => {
    // Numara kayit aninda en guncel listeden verilir.
    record.code = nextCode(draft, draft.serviceRequests.map((r) => r.code), `SRV-${new Date().getFullYear()}-`, 4);
    draft.serviceRequests.unshift({ ...record });
  });
  return record;
}

/** Tarayici deposuna yazilamazsa false. */
export function saveServiceRequest(request: ServiceRequest): boolean {
  return mutate((db) => {
    const idx = db.serviceRequests.findIndex((r) => r.id === request.id);
    if (idx >= 0) db.serviceRequests[idx] = { ...request, updatedAt: nowIso() };
  });
}
