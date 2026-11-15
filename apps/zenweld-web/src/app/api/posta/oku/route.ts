import { NextResponse } from "next/server";
import { checkBearer } from "@/lib/server/bearer";
import { usesDatabase } from "@/lib/server/db";
import { readSiteMailboxes } from "@/lib/server/mailbox";

/**
 * POSTA KUTUSU OKUMA UCU (KARARLAR K-116; docs/SUNUCU.md › Zamanlanmis
 * isler)
 *
 * Sunucunun zamanlayicisi 5 dakikada bir POST ile cagirir; npm run
 * posta:oku elle cagirir. Yalnizca sunucudaki gizli anahtarla (CRON_SECRET)
 * calisir; tanimli degilse uc kapalidir. Sitenin e-postasina yanit olan ya
 * da kayit numarasi tasiyan e-postalar Panel › E-posta'ya alinir.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const allowed = checkBearer(process.env.CRON_SECRET, request.headers.get("authorization"));
  if (!allowed.ok) return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status });
  if (!usesDatabase()) return NextResponse.json({ ok: false, error: "veritabani-modu-kapali" }, { status: 409 });
  const runs = await readSiteMailboxes();
  if (!runs) return NextResponse.json({ ok: false, error: "posta-kutusu-tanimli-degil" }, { status: 503 });
  const failed = runs.filter((r) => r.error);
  return NextResponse.json(
    { ok: failed.length === 0, kutular: runs.map((r) => ({ kutu: r.mailbox, okunan: r.read, alinan: r.imported, ...(r.error && { hata: r.error }) })) },
    { status: failed.length ? 502 : 200 },
  );
}
