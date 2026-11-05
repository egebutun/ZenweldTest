import type { NextRequest } from "next/server";
import {
  adminCancelOrder,
  adminDeleteCoupon,
  adminMarkOrderDelivered,
  adminMarkOrderPaid,
  adminSaveCoupon,
  adminSaveOrderNote,
  adminSaveReturnRequest,
  adminSetCouponActive,
  adminShipOrder,
} from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { panelAdmin } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { json, notFound, sameOrigin } from "@/lib/server/session-cookie";

/**
 * PANEL › SATIS (veritabani modu; Asama 5, 1. alan; KARARLAR K-99)
 *
 *   POST /api/yonetim/satis/odeme-alindi   {id, updatedAt}
 *   POST /api/yonetim/satis/kargo          {id, updatedAt, carrier, trackingNumber}
 *   POST /api/yonetim/satis/teslim         {id, updatedAt}
 *   POST /api/yonetim/satis/iptal          {id, updatedAt, note?}
 *   POST /api/yonetim/satis/siparis-notu   {id, updatedAt, adminNote}
 *   POST /api/yonetim/satis/iade-talebi    {id, updatedAt, status, adminNote}
 *   POST /api/yonetim/satis/kupon          kupon formu (+ id, updatedAt duzenlemede)
 *   POST /api/yonetim/satis/kupon-durum    {id, updatedAt, active}
 *   POST /api/yonetim/satis/kupon-sil      {id, updatedAt}
 *
 * Kurallar: packages/db/src/admin-sales.ts. Yalnizca gecerli panel oturumu
 * olan yonetici yazabilir; updatedAt ekranin acildigi andaki degerdir, kayit
 * sonradan degismisse 409 doner. Ekranlarin verisi sayfalarin sunucu
 * tarafinda okunur (yonetim/(panel)/siparisler/layout.tsx vb.).
 */

export const runtime = "nodejs";

const ACTIONS = {
  "odeme-alindi": adminMarkOrderPaid,
  kargo: adminShipOrder,
  teslim: adminMarkOrderDelivered,
  iptal: adminCancelOrder,
  "siparis-notu": adminSaveOrderNote,
  "iade-talebi": adminSaveReturnRequest,
  kupon: adminSaveCoupon,
  "kupon-durum": adminSetCouponActive,
  "kupon-sil": adminDeleteCoupon,
} as const;

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase() || !Object.hasOwn(ACTIONS, islem)) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const actor = await panelAdmin(request);
  if (!actor) return json({ ok: false, error: tr.panel.sessionEnded }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  }

  const action = ACTIONS[islem as keyof typeof ACTIONS];
  const result = await database().transaction((tx) => action(tx, actor, body as Record<string, unknown>, new Date()));
  return result.ok ? json(result) : json({ ok: false, error: result.error }, result.status);
}
