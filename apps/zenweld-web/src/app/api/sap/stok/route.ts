import { NextResponse } from "next/server";
import { stockSourceFromEnv, syncWarehouseStock } from "@zenweld/db";
import { checkBearer } from "@/lib/server/bearer";
import { database, usesDatabase } from "@/lib/server/db";
import { refreshSite } from "@/lib/server/refresh";

/**
 * SAP DEPO STOGU OKUMA UCU (KARARLAR K-84; docs/ENTEGRASYONLAR.md › SAP)
 *
 * Zamanlanmis is 15 dakikada bir cagirir (Vercel'in zamanlanmis isleri GET
 * ile, sunucudaki zamanlayici ya da npm run sap:stok ile). Yalnizca
 * sunucudaki gizli anahtarla (CRON_SECRET) calisir; tanimli degilse uc
 * kapalidir. Okuma kurallari: packages/db/src/sap-stock.ts. Stok
 * degistiyse depo stogunu kullanan sayfalar o anda yenilenir.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request) {
  const allowed = checkBearer(process.env.CRON_SECRET, request.headers.get("authorization"));
  if (!allowed.ok) return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status });
  if (!usesDatabase()) return NextResponse.json({ ok: false, error: "veritabani-modu-kapali" }, { status: 409 });
  const source = stockSourceFromEnv();
  if (!source) return NextResponse.json({ ok: false, error: "kaynak-tanimli-degil" }, { status: 503 });

  const result = await syncWarehouseStock(database(), source);
  if (result.status === "failed") {
    return NextResponse.json({ ok: false, okuma: result.runId, error: result.error }, { status: 502 });
  }
  const changed = result.added.length + result.removed.length + result.changed.length;
  if (changed > 0) refreshSite(["depo-stogu"]);
  return NextResponse.json({ ok: true, okuma: result.runId, kalem: result.rowsRead, degisen: changed, yenilendi: changed > 0 });
}

export const GET = handle;
export const POST = handle;
