import { eq } from "drizzle-orm";
import type { SeoFields } from "@zenweld/data";
import { slugify } from "@zenweld/utils";
import type { AuditDb } from "./audit";
import { text } from "./panel";
import * as s from "./schema";

/**
 * LINKLER VE SEO ALANLARI — PANELIN ORTAK KURALLARI
 *
 * Katalog (urun, kategori, grup) ve icerik (blog, haber, etkinlik)
 * kayitlari ayni sekilde kaydedilir: link degisince eski adres yeni adrese
 * yonlenir (redirects), SEO alanlari ayni bicimde denetlenir.
 */

/** Yonlendirmenin hedef turu (redirects.target_type). */
export type RedirectTarget = "product" | "category" | "group" | "blog" | "news" | "event";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** SEO alanlari; bos alan yazilmaz. Bicim bozuksa null. */
export function parseSeo(value: unknown): SeoFields | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const input = record(value);
  const keywords = Array.isArray(input.keywords)
    ? input.keywords.map((k) => text(k, 60)).filter(Boolean).slice(0, 30)
    : [];
  const seo: SeoFields = {
    ...(text(input.title, 200) && { title: text(input.title, 200) }),
    ...(text(input.description, 500) && { description: text(input.description, 500) }),
    ...(keywords.length && { keywords }),
  };
  return Object.keys(seo).length ? seo : undefined;
}

/** Link: gecerli bir adres parcasi olmali (bosluksuz, kucuk harf, tire). */
export const validSlug = (slug: string) => slug !== "" && slugify(slug) === slug;

/** Adres degisti: eski adres kayda yonlenir; yeni adres baska bir kaydin eski adresiyse o yonlendirme kalkar. */
export async function movePath(db: AuditDb, oldPath: string, newPath: string, targetType: RedirectTarget, targetId: string) {
  if (oldPath === newPath) return;
  await db
    .insert(s.redirects)
    .values({ oldPath, targetType, targetId, variantId: null })
    .onConflictDoUpdate({ target: s.redirects.oldPath, set: { targetType, targetId, variantId: null } });
  await db.delete(s.redirects).where(eq(s.redirects.oldPath, newPath));
}

/** Yeni kaydin adresi baska bir kaydin eski adresiyse o yonlendirme kalkar. */
export const releasePath = (db: AuditDb, path: string) => db.delete(s.redirects).where(eq(s.redirects.oldPath, path));
