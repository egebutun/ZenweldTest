import { createSeedDatabase, type LegalPageId } from "@zenweld/data";
import { readContent, type Content } from "@zenweld/db";
import type { ServerData } from "@zenweld/store";
import { CONTRACT_PAGE_IDS } from "@/lib/legal-documents";
import { buildTime, cached, usesDatabase } from "./db";

/**
 * SITENIN ICERIGI — SUNUCU (KARARLAR K-88, Asama 3.5)
 *
 * Blog, haberler, etkinlikler, SSS, yasal metinler, Hakkimizda, satis
 * temsilcileri, belge sayfalari ve sabit sayfalarin SEO bilgileri.
 * Veritabani modunda (lib/server/db.ts) veritabanindan okunur; demo
 * modunda sunucu koddaki ornek veriyi kullanir.
 *
 * Tarayiciya giden icerik iki parcadir:
 * - Her sayfada kullanilan (alt bilgideki yasal linkler, aramadaki blog,
 *   haber ve etkinlikler, sayfa basliklari, SSS): sayfa cercevesiyle gelir.
 *   Yasal metinlerin ve blog yazilarinin govdesi burada yoktur.
 * - Tek sayfaya ait olan (yasal metnin ve blog yazisinin govdesi,
 *   Hakkimizda, satis temsilcileri, belgeler, siparis sozlesmeleri):
 *   yalnizca o sayfaya gider.
 * Yayindan kaldirilmis kayitlar ve pasif temsilciler tarayiciya gitmez.
 */

export const CONTENT_TAG = "icerik";

const cachedContent = cached("icerik", CONTENT_TAG, readContent);

let demo: Content | undefined;

/** Demo modunda sunucunun bildigi icerik: koddaki ornek veri. */
function demoContent(): Content {
  if (!demo) {
    const seed = createSeedDatabase(buildTime());
    demo = {
      blogPosts: seed.blogPosts,
      news: seed.news,
      events: seed.events,
      faqs: seed.faqs,
      salesReps: seed.salesReps,
      legalPages: seed.legalPages,
      about: seed.about,
      pageSeo: seed.pageSeo,
      documentPages: seed.documentPages,
      documents: seed.documents,
    };
  }
  return demo;
}

/**
 * Sunucuda uretilen sayfa bilgileri (baslik, yapisal veri, site haritasi,
 * onceden hazirlanan sayfalar) icin icerik: veritabani ya da ornek veri.
 */
export async function getServerContent(): Promise<Content> {
  return usesDatabase() ? cachedContent() : demoContent();
}

/** Yayindaki kayitlar (yayindan kaldirilanlar tarayiciya gitmez). */
async function publishedContent(): Promise<Content> {
  const c = await cachedContent();
  return {
    ...c,
    blogPosts: c.blogPosts.filter((p) => p.active !== false),
    news: c.news.filter((n) => n.active),
    events: c.events.filter((e) => e.active),
    salesReps: c.salesReps.filter((r) => r.active),
    documents: c.documents.filter((d) => d.active),
  };
}

/** Govdesiz kopya: listeler, arama ve alt bilgi icin yeterli. */
const withoutBody = <T extends { body: string }>(record: T): T => ({ ...record, body: "" });

/**
 * Sayfa cercevesine (her sayfaya) giden icerik; demo modunda null.
 * Tek sayfaya ait kayit turleri bos liste: hicbir sayfa onlari
 * tarayicidaki eski kopyadan okumaz, gereken sayfa kendi verisini ekler.
 */
export async function getLayoutContent(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  const c = await publishedContent();
  return {
    legalPages: c.legalPages.map(withoutBody),
    blogPosts: c.blogPosts.map(withoutBody),
    news: c.news,
    events: c.events,
    faqs: c.faqs,
    pageSeo: c.pageSeo,
    salesReps: [],
    documentPages: [],
    documents: [],
  };
}

/** Blog yazisi sayfasi: o yazinin govdesi (digerleri govdesiz). */
export async function getBlogPostPageData(slug: string): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  const c = await publishedContent();
  return { blogPosts: c.blogPosts.map((p) => (p.slug === slug ? p : withoutBody(p))) };
}

/** Yasal metin sayfasi ve siparis sozlesmeleri: istenen metinlerin govdesi. */
export async function getLegalPageData(ids: LegalPageId[]): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  const c = await publishedContent();
  return { legalPages: c.legalPages.map((p) => (ids.includes(p.id as LegalPageId) ? p : withoutBody(p))) };
}

/** Odeme sayfasi ve siparis detayi: Ön Bilgilendirme Formu ve Mesafeli Satis Sozlesmesi. */
export const getContractPageData = () => getLegalPageData(CONTRACT_PAGE_IDS);

/** Hakkimizda. */
export async function getAboutPageData(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  return { about: (await publishedContent()).about };
}

/** Satis Temsilcilerimiz: yayindaki temsilciler. */
export async function getSalesRepsPageData(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  return { salesReps: (await publishedContent()).salesReps };
}

/** MSDS, Kaynak Rehberi, Parti Sertifikalari: sayfa metinleri ve belge listesi. */
export async function getDocumentsPageData(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  const c = await publishedContent();
  return { documentPages: c.documentPages, documents: c.documents };
}

/** Sabit sayfanin panelde (Sayfa SEO) girilen basligi ve aciklamasi. */
export async function getPageSeoOverride(path: string) {
  return (await getServerContent()).pageSeo?.[path];
}
