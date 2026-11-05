import type { NextRequest } from "next/server";
import {
  adminApplyStockImport,
  adminDeleteStockLevel,
  adminRevertStockImport,
  adminSaveSkuAlias,
  adminSaveStockSettings,
  adminSetStockLevel,
} from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › STOK MATRISI (veritabani modu; Asama 5, 4. alan; KARARLAR K-99, K-103)
 *
 *   POST /api/yonetim/stok/satir      elle duzeltme ya da satir ekleme
 *        {sourceType, sourceId, productId, variantId, label, patch: {quantity?, price?, url?}, updatedAt?}
 *   POST /api/yonetim/stok/satir-sil  {sourceType, sourceId, productId, variantId, label, updatedAt}
 *   POST /api/yonetim/stok/ayar       {staleDays, updatedAt?}
 *   POST /api/yonetim/stok/dosya      {sourceType, sourceId, fileName, table, version, confirmTruncated}
 *        (table: tarayicinin okudugu satir x hucre tablosu; sunucu yeniden eslestirir)
 *   POST /api/yonetim/stok/geri-al    {id}  son dosya yuklemesini geri alir
 *   POST /api/yonetim/stok/eslestir   {sourceType, sourceId, code, productId, variantId}
 *
 * Kurallar: packages/db/src/admin-stock.ts. Basarili islemden sonra urun
 * sayfalarindaki stoktaki bayiler ve online satici kartlari hemen yenilenir;
 * ayar degisince katalog (magaza ayarlari) da.
 */

export const runtime = "nodejs";

const ACTIONS = {
  satir: adminSetStockLevel,
  "satir-sil": adminDeleteStockLevel,
  ayar: adminSaveStockSettings,
  dosya: adminApplyStockImport,
  "geri-al": adminRevertStockImport,
  eslestir: adminSaveSkuAlias,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) =>
    refreshSite(name === "ayar" ? ["katalog", "stok"] : ["stok"]),
  );
}
