import type { AboutContent, BlogPost, FaqItem, NewsItem, ZenweldEvent } from "./types";

/**
 * ICERIK KAYIT KURALLARI — PANEL (demo ve veritabani modu ayni)
 *
 * Haberler, Etkinlikler, Blog, Sık Sorulan Sorular ve Hakkımızda
 * formlarinin dogrulamasi. Tarayici (panel ekranlari) ve sunucu
 * (packages/db › admin-content.ts) ayni kurallari kullanir; sunucu
 * tarayicidan geleni yeniden denetler.
 */

/**
 * Link bos kalirsa (adda Latin harf ya da rakam yok, orn. Rusca bir
 * etkinlik adi) kayit yapilmaz; bos linkli sayfa acilamazdi.
 */
export const EMPTY_SLUG_ERROR =
  "Link oluşturulamadı: adda Latin harf ya da rakam yok. SEO sekmesinde Latin harf ve rakamlarla bir link yazın.";

/** Haber: baslik zorunlu. Sorun yoksa null. */
export const newsDraftError = (draft: Pick<NewsItem, "title">): string | null =>
  draft.title.trim() ? null : "Haber başlığı zorunludur.";

/** Blog yazisi: baslik zorunlu. Sorun yoksa null. */
export const blogDraftError = (draft: Pick<BlogPost, "title">): string | null =>
  draft.title.trim() ? null : "Yazı başlığı zorunludur.";

/** Etkinlik: ad zorunlu; bitis baslangictan once olamaz. Sorun yoksa null. */
export function eventDraftError(draft: Pick<ZenweldEvent, "title" | "startDate" | "endDate">): string | null {
  if (!draft.title.trim()) return "Etkinlik adı zorunludur.";
  if (draft.endDate < draft.startDate) return "Bitiş tarihi başlangıç tarihinden önce olamaz.";
  return null;
}

export const newsSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" haberinde kullanılıyor.`;
export const blogSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" yazısında kullanılıyor.`;
export const eventSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" etkinliğinde kullanılıyor.`;

/** Sik sorulan soru: soru ve cevap zorunlu. Sorun yoksa null. */
export const faqDraftError = (draft: Pick<FaqItem, "question" | "answer">): string | null =>
  draft.question.trim() && draft.answer.trim() ? null : "Soru ve cevap zorunludur.";

/** SSS konulari (sitedeki suzgecle ayni). */
export const FAQ_TOPICS: FaqItem["topic"][] = ["genel", "siparis", "garanti", "teknik"];

/** Hakkimizda: sayfa basligi zorunlu. Sorun yoksa null. */
export const aboutDraftError = (draft: Pick<AboutContent, "heroTitle">): string | null =>
  draft.heroTitle.trim() ? null : "Sayfa başlığı zorunludur.";
