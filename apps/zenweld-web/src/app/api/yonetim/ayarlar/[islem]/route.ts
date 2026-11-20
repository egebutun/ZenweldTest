import type { NextRequest } from "next/server";
import { adminSaveCompany, adminSaveHomeHero, adminSaveHomeVideos, adminSaveRichText, adminSaveShopSettings } from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › MAGAZA AYARLARI (veritabani modu; Asama 5, 5. alan; KARARLAR K-99)
 *
 *   POST /api/yonetim/ayarlar/magaza            {shop, updatedAt?}  Genel sekmesi
 *   POST /api/yonetim/ayarlar/sirket            {company, updatedAt?}  Şirket ve İletişim sekmesi (adim 5.3, K-105)
 *   POST /api/yonetim/ayarlar/gorunum           {style, updatedAt?}  Görünüm ekrani (adim 5.3)
 *   POST /api/yonetim/ayarlar/tanitim           {hero, updatedAt?}  Anasayfa Tanıtım ekrani (K-45)
 *   POST /api/yonetim/ayarlar/videolar          {videos, updatedAt?}  Anasayfa Videoları ekrani (K-125)
 *
 * Kurallar: packages/db/src/admin-settings.ts. Magaza ayarlari, sirket
 * bilgileri, Görünüm, tanitim alani ve videolar degisince katalog (ayarlar dahil)
 * hemen yenilenir. E-posta adresleri: /api/yonetim/eposta.
 */

export const runtime = "nodejs";

const ACTIONS = {
  magaza: adminSaveShopSettings,
  sirket: adminSaveCompany,
  gorunum: adminSaveRichText,
  tanitim: adminSaveHomeHero,
  videolar: adminSaveHomeVideos,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, () => refreshSite(["katalog"]));
}
