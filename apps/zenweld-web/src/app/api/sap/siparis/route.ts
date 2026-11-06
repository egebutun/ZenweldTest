import { NextResponse } from "next/server";
import { exportSapOrders, orderExporterFromEnv } from "@zenweld/db";
import { checkBearer } from "@/lib/server/bearer";
import { database, usesDatabase } from "@/lib/server/db";

/**
 * SIPARISLERIN SAP'A AKTARIM UCU (KARARLAR K-84, K-108;
 * docs/SUNUCU.md › 3 › Zamanlanmis isler)
 *
 * Sunucunun zamanlayicisi birkac dakikada bir POST ile cagirir; npm run
 * sap:siparis elle cagirir. Yalnizca sunucudaki gizli anahtarla
 * (CRON_SECRET) calisir; tanimli degilse uc kapalidir. Sirada zamani gelmis
 * siparisleri gonderir (packages/db/src/sap-orders.ts) ve kac siparisin
 * gonderildigini, yeniden denenecegini, basarisiz oldugunu, atlandigini
 * dondurur (siparis numaralariyla).
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const allowed = checkBearer(process.env.CRON_SECRET, request.headers.get("authorization"));
  if (!allowed.ok) return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status });
  if (!usesDatabase()) return NextResponse.json({ ok: false, error: "veritabani-modu-kapali" }, { status: 409 });
  const exporter = orderExporterFromEnv();
  if (!exporter) return NextResponse.json({ ok: false, error: "aktarici-tanimli-degil" }, { status: 503 });

  const run = await exportSapOrders(database(), exporter, new Date());
  return NextResponse.json({
    ok: true,
    aktarici: exporter.id,
    gonderildi: run.sent,
    yenidenDenenecek: run.retrying,
    basarisiz: run.failed,
    atlandi: run.skipped,
  });
}
