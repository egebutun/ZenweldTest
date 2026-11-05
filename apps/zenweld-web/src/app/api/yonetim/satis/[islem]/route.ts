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
import { runPanelAction } from "@/lib/server/admin";

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
 * Kurallar: packages/db/src/admin-sales.ts; ortak akis (oturum, islem,
 * hata): lib/server/admin.ts › runPanelAction. updatedAt ekranin gordugu
 * son degisiklik anidir; kayit sonradan degismisse 409 doner.
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
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem);
}
