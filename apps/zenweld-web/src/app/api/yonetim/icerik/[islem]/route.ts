import type { NextRequest } from "next/server";
import {
  adminDeleteBlogPost,
  adminDeleteEvent,
  adminDeleteFaq,
  adminDeleteNews,
  adminMoveFaq,
  adminSaveAbout,
  adminSaveBlogPost,
  adminSaveEvent,
  adminSaveFaq,
  adminSaveNews,
  adminSetBlogPostActive,
  adminSetEventActive,
  adminSetNewsActive,
} from "@zenweld/db";
import { runPanelAction } from "@/lib/server/admin";
import { refreshSite } from "@/lib/server/refresh";

/**
 * PANEL › ICERIK (veritabani modu; Asama 5, 5. alan, adim 5.2; KARARLAR K-99, K-101)
 *
 *   POST /api/yonetim/icerik/haber           {id?, slug, title, summary, body, coverUrl, images, publishedAt, active, seo, updatedAt?}
 *   POST /api/yonetim/icerik/haber-yayin     {id, active, updatedAt}
 *   POST /api/yonetim/icerik/haber-sil       {id, updatedAt}
 *   POST /api/yonetim/icerik/etkinlik        {id?, slug, title, summary, description, startDate, endDate, venue, city, country, logoUrl, images, websiteUrl, active, seo, updatedAt?}
 *   POST /api/yonetim/icerik/etkinlik-yayin  {id, active, updatedAt}
 *   POST /api/yonetim/icerik/etkinlik-sil    {id, updatedAt}
 *   POST /api/yonetim/icerik/blog            {id?, slug, title, excerpt, body, coverUrl, category, author, publishedAt, active, seo, updatedAt?}
 *   POST /api/yonetim/icerik/blog-yayin      {id, active, updatedAt}
 *   POST /api/yonetim/icerik/blog-sil        {id, updatedAt}
 *   POST /api/yonetim/icerik/sss             {id?, question, answer, topic, updatedAt?}
 *   POST /api/yonetim/icerik/sss-sil         {id, updatedAt}
 *   POST /api/yonetim/icerik/sss-sira        {id, direction: -1 | 1}
 *   POST /api/yonetim/icerik/hakkimizda      {about, updatedAt}
 *
 * Kurallar: packages/db/src/admin-content.ts. Basarili islemden sonra
 * sitenin icerik sayfalari (anasayfa dahil) hemen yenilenir.
 */

export const runtime = "nodejs";

const ACTIONS = {
  haber: adminSaveNews,
  "haber-yayin": adminSetNewsActive,
  "haber-sil": adminDeleteNews,
  etkinlik: adminSaveEvent,
  "etkinlik-yayin": adminSetEventActive,
  "etkinlik-sil": adminDeleteEvent,
  blog: adminSaveBlogPost,
  "blog-yayin": adminSetBlogPostActive,
  "blog-sil": adminDeleteBlogPost,
  sss: adminSaveFaq,
  "sss-sil": adminDeleteFaq,
  "sss-sira": adminMoveFaq,
  hakkimizda: adminSaveAbout,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, () => {
    refreshSite(["icerik"]);
  });
}
