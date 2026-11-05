import { auditLogFacets, readAuditLog } from "@zenweld/db";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { beforeParam, param, type LogParams } from "@/lib/admin-log-params";
import { AuditLogClient } from "./AuditLogClient";

/**
 * Islem kaydi: panelde yapilan her degisiklik ve panele giris/cikis
 * (audit_log; KARARLAR K-81, K-99). Yalnizca veritabani modunda tutulur;
 * her acilista sunucuda okunur, suzgecler adreste durur.
 */
export default async function AuditLogPage({ searchParams }: { searchParams: Promise<LogParams> }) {
  const params = await searchParams;
  const filter = {
    tur: param(params, "tur"),
    yonetici: param(params, "yonetici"),
    islem: param(params, "islem"),
    baslangic: param(params, "baslangic"),
    bitis: param(params, "bitis"),
    ara: param(params, "ara"),
  };
  if (!usesDatabase()) return <AuditLogClient page={{ entries: [], more: false }} facets={{ entityTypes: [], actors: [] }} filter={filter} />;
  if (!(await hasPanelSession())) return null;
  const db = database();
  const page = await readAuditLog(db, {
    entityType: filter.tur,
    actorUserId: filter.yonetici,
    action: filter.islem,
    from: filter.baslangic,
    to: filter.bitis,
    q: filter.ara,
    before: beforeParam(params),
  });
  return <AuditLogClient page={page} facets={await auditLogFacets(db)} filter={filter} paged={beforeParam(params) !== undefined} />;
}
