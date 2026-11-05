import type { NextRequest } from "next/server";
import { adminSaveCompany, adminSaveEmailRecipients, adminSaveRichText, adminSaveShopSettings } from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › MAGAZA AYARLARI (veritabani modu; Asama 5, 5. alan; KARARLAR K-99, K-104)
 *
 *   POST /api/yonetim/ayarlar/magaza            {shop, updatedAt?}  Genel sekmesi
 *   POST /api/yonetim/ayarlar/eposta-alicilari  {items: [{type, recipients}], version}
 *   POST /api/yonetim/ayarlar/sirket            {company, updatedAt?}  Şirket ve İletişim sekmesi (adim 5.3, K-105)
 *   POST /api/yonetim/ayarlar/gorunum           {style, updatedAt?}  Görünüm ekrani (adim 5.3)
 *
 * Kurallar: packages/db/src/admin-settings.ts. Magaza ayarlari, sirket
 * bilgileri ve Görünüm degisince katalog (ayarlar dahil) hemen yenilenir;
 * e-posta alicilari her e-postada veritabanindan okundugu icin onbellege
 * girmez.
 */

export const runtime = "nodejs";

const ACTIONS = {
  magaza: adminSaveShopSettings,
  "eposta-alicilari": adminSaveEmailRecipients,
  sirket: adminSaveCompany,
  gorunum: adminSaveRichText,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) => {
    if (name !== "eposta-alicilari") refreshSite(["katalog"]);
  });
}
