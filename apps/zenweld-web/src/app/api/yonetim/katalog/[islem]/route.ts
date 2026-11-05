import type { NextRequest } from "next/server";
import {
  adminDeleteCategory,
  adminDeleteGroup,
  adminDeleteOptionDefinition,
  adminDeleteProduct,
  adminMoveCategory,
  adminMoveGroup,
  adminSaveCategory,
  adminSaveGroup,
  adminSaveOptionDefinition,
  adminSaveProduct,
  adminSetProductActive,
} from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › KATALOG (veritabani modu; Asama 5, 3. alan; KARARLAR K-99)
 *
 *   POST /api/yonetim/katalog/secenek        secenek tanimi (+ id, updatedAt duzenlemede)
 *   POST /api/yonetim/katalog/secenek-sil    {id, updatedAt}
 *   POST /api/yonetim/katalog/kategori       kategori formu (+ id, updatedAt; mapping: eslesme tablosu)
 *   POST /api/yonetim/katalog/kategori-sil   {id, updatedAt}
 *   POST /api/yonetim/katalog/kategori-sira  {id, direction: -1 | 1}
 *   POST /api/yonetim/katalog/grup           grup formu (+ id, updatedAt duzenlemede)
 *   POST /api/yonetim/katalog/grup-sil       {id, updatedAt}
 *   POST /api/yonetim/katalog/grup-sira      {id, direction: -1 | 1}
 *   POST /api/yonetim/katalog/urun           urun formu (+ id, updatedAt duzenlemede)
 *   POST /api/yonetim/katalog/urun-yayin     {id, updatedAt, active}
 *   POST /api/yonetim/katalog/urun-sil       {id, updatedAt}
 *
 * Kurallar: packages/db/src/admin-catalog.ts. Basarili kayittan sonra
 * sitenin katalog onbellegi hemen yenilenir (menu, kategori ve urun
 * sayfalari, site haritasi). Urun islemlerinde bayi/satici stogu (kaldirilan
 * kombinasyonun satirlari silinir) ve yorumlar (anasayfa seridi yalnizca
 * yayindaki urunlerin yorumlarini gosterir) da yenilenir.
 */

export const runtime = "nodejs";

const ACTIONS = {
  secenek: adminSaveOptionDefinition,
  "secenek-sil": adminDeleteOptionDefinition,
  kategori: adminSaveCategory,
  "kategori-sil": adminDeleteCategory,
  "kategori-sira": adminMoveCategory,
  grup: adminSaveGroup,
  "grup-sil": adminDeleteGroup,
  "grup-sira": adminMoveGroup,
  urun: adminSaveProduct,
  "urun-yayin": adminSetProductActive,
  "urun-sil": adminDeleteProduct,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) =>
    refreshSite(name.startsWith("urun") ? ["katalog", "stok", "yorumlar"] : ["katalog"]),
  );
}
