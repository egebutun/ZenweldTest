import type { NextRequest } from "next/server";
import {
  adminDeleteCategory,
  adminDeleteGroup,
  adminDeleteOptionDefinition,
  adminMoveCategory,
  adminMoveGroup,
  adminSaveCategory,
  adminSaveGroup,
  adminSaveOptionDefinition,
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
 *
 * Kurallar: packages/db/src/admin-catalog.ts. Basarili kayittan sonra
 * sitenin katalog onbellegi hemen yenilenir (menu, kategori ve urun
 * sayfalari, site haritasi).
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
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, () => refreshSite(["katalog"]));
}
