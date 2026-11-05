import type { NextRequest } from "next/server";
import { adminDeleteMember, adminSaveMember } from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";

/**
 * PANEL › UYELER (veritabani modu; Asama 5, 6. alan; KARARLAR K-35, K-36, K-99)
 *
 *   POST /api/yonetim/uyeler/uye       {id, updatedAt, role, status}
 *   POST /api/yonetim/uyeler/uye-sil   {id, updatedAt}
 *
 * Kurallar: packages/db/src/admin-members.ts; ortak akis (oturum, islem,
 * hata): lib/server/admin.ts › runPanelAction.
 */

export const runtime = "nodejs";

const ACTIONS = {
  uye: adminSaveMember,
  "uye-sil": adminDeleteMember,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem);
}
