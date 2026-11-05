import type { NextRequest } from "next/server";
import {
  adminDeleteDealer,
  adminDeleteRetailer,
  adminDeleteSalesRep,
  adminMoveSalesRep,
  adminSaveDealer,
  adminSaveRetailer,
  adminSaveSalesRep,
  adminSetSalesRepActive,
} from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › BAYI AGI (veritabani modu; Asama 5, 4. alan; KARARLAR K-99, K-103)
 *
 *   POST /api/yonetim/bayi-agi/bayi             bayi formu (+ id, updatedAt duzenlemede)
 *   POST /api/yonetim/bayi-agi/bayi-sil         {id, updatedAt}
 *   POST /api/yonetim/bayi-agi/satici           online satici formu (+ id, updatedAt)
 *   POST /api/yonetim/bayi-agi/satici-sil       {id, updatedAt}
 *   POST /api/yonetim/bayi-agi/temsilci         satis temsilcisi formu (+ id, updatedAt)
 *   POST /api/yonetim/bayi-agi/temsilci-durum   {id, updatedAt, active}
 *   POST /api/yonetim/bayi-agi/temsilci-sira    {id, direction: -1 | 1}
 *   POST /api/yonetim/bayi-agi/temsilci-sil     {id, updatedAt}
 *
 * Kurallar: packages/db/src/admin-network.ts. Basarili kayittan sonra
 * sitenin ilgili onbellegi hemen yenilenir: bayi ve satici islemlerinde
 * bayiler ve stok (Bayi Bul, urun sayfasindaki stoktaki bayiler ve online
 * satici kartlari), temsilci islemlerinde icerik (Satış Temsilcilerimiz).
 */

export const runtime = "nodejs";

const ACTIONS = {
  bayi: adminSaveDealer,
  "bayi-sil": adminDeleteDealer,
  satici: adminSaveRetailer,
  "satici-sil": adminDeleteRetailer,
  temsilci: adminSaveSalesRep,
  "temsilci-durum": adminSetSalesRepActive,
  "temsilci-sira": adminMoveSalesRep,
  "temsilci-sil": adminDeleteSalesRep,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) =>
    refreshSite(name.startsWith("temsilci") ? ["icerik"] : ["bayiler", "stok"]),
  );
}
