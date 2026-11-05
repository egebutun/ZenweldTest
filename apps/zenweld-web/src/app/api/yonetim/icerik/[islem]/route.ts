import type { NextRequest } from "next/server";
import {
  adminDeleteBlogPost,
  adminDeleteDocument,
  adminDeleteEvent,
  adminDeleteFaq,
  adminDeleteNews,
  adminMoveDocument,
  adminMoveFaq,
  adminSaveAbout,
  adminSaveBlogPost,
  adminSaveDocument,
  adminSaveDocumentPage,
  adminSaveEvent,
  adminSaveFaq,
  adminSaveLegalPage,
  adminSaveNews,
  adminSavePageSeo,
  adminSetBlogPostActive,
  adminSetDocumentActive,
  adminSetEventActive,
  adminSetNewsActive,
  type Actor,
  type AuditDb,
} from "@zenweld/db";
import { isIndexablePage } from "@/lib/page-meta";
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
 * Adim 5.3 (KARARLAR K-104):
 *   POST /api/yonetim/icerik/yasal-metin     {id, title, body, updatedAt}
 *   POST /api/yonetim/icerik/sayfa-seo       {path, title, description, updatedAt?}
 *   POST /api/yonetim/icerik/belge-sayfasi   {section, title, subtitle, updatedAt?}
 *   POST /api/yonetim/icerik/belge           {id?, section, title, productId, lotNumber, active, address, updatedAt?}
 *   POST /api/yonetim/icerik/belge-yayin     {id, active, updatedAt}
 *   POST /api/yonetim/icerik/belge-sil       {id, updatedAt}
 *   POST /api/yonetim/icerik/belge-sira      {id, direction: -1 | 1}
 *
 * Kurallar: packages/db/src/admin-content.ts, admin-pages.ts. Basarili
 * islemden sonra sitenin icerik sayfalari (anasayfa dahil) hemen yenilenir.
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
  "yasal-metin": adminSaveLegalPage,
  // Yalnizca Sayfa SEO ekranindaki (aramaya acik) sabit sayfalar.
  "sayfa-seo": (db: AuditDb, actor: Actor, input: Record<string, unknown>, at: Date) =>
    adminSavePageSeo(db, actor, input, at, isIndexablePage),
  "belge-sayfasi": adminSaveDocumentPage,
  belge: adminSaveDocument,
  "belge-yayin": adminSetDocumentActive,
  "belge-sil": adminDeleteDocument,
  "belge-sira": adminMoveDocument,
};

type Context = { params: Promise<{ islem: string }> };

export async function POST(request: NextRequest, context: Context) {
  return runPanelAction(request, ACTIONS, (await context.params).islem, () => {
    refreshSite(["icerik"]);
  });
}
