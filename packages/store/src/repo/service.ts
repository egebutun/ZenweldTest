"use client";

import type { ServiceRequest, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Servis talepleri                                                    */
/* ------------------------------------------------------------------ */

export function listServiceRequests(db: ZenweldDatabase = getSnapshot()): ServiceRequest[] {
  return [...db.serviceRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createServiceRequest(
  request: Omit<ServiceRequest, "id" | "code" | "status" | "createdAt" | "updatedAt">,
): ServiceRequest {
  const db = getSnapshot();
  const prefix = `SRV-${new Date().getFullYear()}-`;
  const last = db.serviceRequests
    .filter((r) => r.code.startsWith(prefix))
    .reduce((max, r) => Math.max(max, Number(r.code.slice(prefix.length)) || 0), 0);
  const at = nowIso();
  const record: ServiceRequest = {
    ...request,
    id: uid("srv"),
    code: `${prefix}${String(last + 1).padStart(4, "0")}`,
    status: "new",
    createdAt: at,
    updatedAt: at,
  };
  mutate((draft) => {
    draft.serviceRequests.unshift(record);
  });
  return record;
}

export function saveServiceRequest(request: ServiceRequest): void {
  mutate((db) => {
    const idx = db.serviceRequests.findIndex((r) => r.id === request.id);
    if (idx >= 0) db.serviceRequests[idx] = { ...request, updatedAt: nowIso() };
  });
}
