import { readEmailLog } from "@zenweld/db";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { beforeParam, param, type LogParams } from "@/lib/admin-log-params";
import { EmailLogClient } from "./EmailLogClient";

/**
 * E-posta kaydi: sitenin gonderdigi (ya da gonderemedigi) e-postalar
 * (email_log; KARARLAR K-98). Metin saklanmaz. Yalnizca veritabani
 * modunda tutulur; her acilista sunucuda okunur, suzgecler adreste durur.
 */
export default async function EmailLogPage({ searchParams }: { searchParams: Promise<LogParams> }) {
  const params = await searchParams;
  const filter = {
    tur: param(params, "tur"),
    durum: param(params, "durum"),
    baslangic: param(params, "baslangic"),
    bitis: param(params, "bitis"),
    ara: param(params, "ara"),
  };
  if (!usesDatabase()) return <EmailLogClient page={{ entries: [], more: false }} filter={filter} />;
  if (!(await hasPanelSession())) return null;
  const page = await readEmailLog(database(), {
    type: filter.tur,
    status: filter.durum,
    from: filter.baslangic,
    to: filter.bitis,
    q: filter.ara,
    before: beforeParam(params),
  });
  return <EmailLogClient page={page} filter={filter} paged={beforeParam(params) !== undefined} />;
}
