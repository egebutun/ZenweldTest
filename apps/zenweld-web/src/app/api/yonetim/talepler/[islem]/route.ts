import type { NextRequest } from "next/server";
import {
  adminDeleteQuote,
  adminDeleteReview,
  adminDeleteWarranty,
  adminSaveDealerApplication,
  adminSaveQuote,
  adminSaveServiceRequest,
  adminSaveSupportMessage,
  adminSaveWarranty,
  adminSetReviewApproved,
  adminSetReviewFeatured,
  adminSetWeldersClubActive,
} from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › TALEPLER (veritabani modu; Asama 5, 2. alan; KARARLAR K-99, K-100)
 *
 *   POST /api/yonetim/talepler/teklif          {id, updatedAt, status? | assignedTo? | adminNote?}
 *   POST /api/yonetim/talepler/teklif-sil      {id, updatedAt}
 *   POST /api/yonetim/talepler/servis          {id, updatedAt, status, adminNote}
 *   POST /api/yonetim/talepler/garanti         {id, updatedAt, expiresAt? | extended?}
 *   POST /api/yonetim/talepler/garanti-sil     {id, updatedAt}
 *   POST /api/yonetim/talepler/yorum-onay      {id, updatedAt, approved}
 *   POST /api/yonetim/talepler/yorum-anasayfa  {id, updatedAt, featured}
 *   POST /api/yonetim/talepler/yorum-sil       {id, updatedAt}
 *   POST /api/yonetim/talepler/basvuru         {id, updatedAt, status, adminNote}
 *   POST /api/yonetim/talepler/mesaj           {id, updatedAt, status, adminNote}
 *   POST /api/yonetim/talepler/welders-club    {id, updatedAt, active}
 *
 * Kurallar: packages/db/src/admin-requests.ts. Yorum degisince sitenin
 * yorum onbellegi hemen yenilenir (urun sayfasi ve anasayfa seridi).
 */

export const runtime = "nodejs";

const ACTIONS = {
  teklif: adminSaveQuote,
  "teklif-sil": adminDeleteQuote,
  servis: adminSaveServiceRequest,
  garanti: adminSaveWarranty,
  "garanti-sil": adminDeleteWarranty,
  "yorum-onay": adminSetReviewApproved,
  "yorum-anasayfa": adminSetReviewFeatured,
  "yorum-sil": adminDeleteReview,
  basvuru: adminSaveDealerApplication,
  mesaj: adminSaveSupportMessage,
  "welders-club": adminSetWeldersClubActive,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, (name) => {
    if (name.startsWith("yorum-")) refreshSite(["yorumlar"]);
  });
}
