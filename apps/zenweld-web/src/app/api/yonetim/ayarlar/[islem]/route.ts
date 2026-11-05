import type { NextRequest } from "next/server";
import { adminSaveEmailRecipients, adminSaveShopSettings } from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › MAGAZA AYARLARI (veritabani modu; Asama 5, 5. alan; KARARLAR K-99, K-104)
 *
 *   POST /api/yonetim/ayarlar/magaza            {shop, updatedAt?}  Genel sekmesi
 *   POST /api/yonetim/ayarlar/eposta-alicilari  {items: [{type, recipients}], version}
 *
 * Kurallar: packages/db/src/admin-settings.ts. Magaza ayarlari degisince
 * katalog (ayarlar dahil) hemen yenilenir; e-posta alicilari her e-postada
 * veritabanindan okundugu icin onbellege girmez.
 */

export const runtime = "nodejs";

const ACTIONS = {
  magaza: adminSaveShopSettings,
  "eposta-alicilari": adminSaveEmailRecipients,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) => {
    if (name === "magaza") refreshSite(["katalog"]);
  });
}
