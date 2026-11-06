import type { NextRequest } from "next/server";
import { readMembersForExport, readQuotesForExport, readWarrantiesForExport } from "@zenweld/db";
import { memberCsvRows, quoteCsvRows, warrantyCsvRows } from "@/lib/admin-csv";
import { memberListFilter, quoteListFilter, warrantyListFilter, type ParamReader } from "@/lib/admin-lists";
import { istanbulDateKey } from "@/lib/admin-stats";
import { panelAdmin, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { json, notFound } from "@/lib/server/session-cookie";

/**
 * PANEL › CSV INDIR (veritabani modu)
 *
 *   GET /api/yonetim/csv/teklifler?durum=…
 *   GET /api/yonetim/csv/garantiler?ara=…&durum=…
 *   GET /api/yonetim/csv/uyeler?ara=…&rol=…&durum=…
 *
 * Listedeki suzgece uyan kayitlarin tamaminin CSV satirlari (JSON; dosyayi
 * tarayici olusturur). Yalnizca yonetici oturumuyla calisir. Sutunlar demo
 * moduyla ortaktir (lib/admin-csv.ts).
 */

export const runtime = "nodejs";

type Context = { params: Promise<{ liste: string }> };

export async function GET(request: NextRequest, context: Context) {
  if (!usesDatabase()) return notFound();
  if (!(await panelAdmin(request))) return json({ ok: false }, 401);
  const params = request.nextUrl.searchParams;
  const get: ParamReader = (name) => params.get(name)?.trim().slice(0, 100) || undefined;
  const db = database();
  switch ((await context.params).liste) {
    case "teklifler":
      return json({ ok: true, rows: quoteCsvRows(await readQuotesForExport(db, quoteListFilter(get))) });
    case "garantiler": {
      const products = (await panelCatalog())?.products ?? [];
      const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
      const filter = warrantyListFilter(get, istanbulDateKey(new Date()));
      return json({ ok: true, rows: warrantyCsvRows(await readWarrantiesForExport(db, filter), name) });
    }
    case "uyeler":
      return json({ ok: true, rows: memberCsvRows(await readMembersForExport(db, memberListFilter(get))) });
    default:
      return notFound();
  }
}
