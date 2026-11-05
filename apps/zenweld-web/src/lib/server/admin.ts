import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { readSession, type SessionUser } from "@zenweld/auth/server";
import type { Actor, PanelResult } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import type { CatalogData } from "@zenweld/store";
import { getDatabaseCatalog } from "./catalog";
import { database, usesDatabase } from "./db";
import { clientInfo, json, notFound, sameOrigin, SESSION_COOKIES } from "./session-cookie";

/**
 * PANELDEKI YONETICI (veritabani modu; Asama 5, KARARLAR K-99)
 *
 * Panelin sunucuya yazdigi her istek ve panel sayfalarinin veriyi okudugu
 * sunucu kodu yoneticiyi oturum cerezinden (zw_panel) bulur. Oturum yoksa,
 * suresi dolmussa ya da hesap yonetici degilse null. Islem kaydina
 * (audit_log) yoneticinin kimligi, adi ve IP adresi yazilir.
 */

export const actorName = (user: Pick<SessionUser, "firstName" | "lastName" | "email">) =>
  `${user.firstName} ${user.lastName}`.trim() || user.email;

/** API isteginin yoneticisi (IP adresiyle). */
export async function panelAdmin(request: NextRequest): Promise<Actor | null> {
  if (!usesDatabase()) return null;
  const session = await readSession(database(), request.cookies.get(SESSION_COOKIES.admin)?.value, "admin");
  if (!session) return null;
  return { id: session.user.id, name: actorName(session.user), ip: clientInfo(request).ip };
}

/** Sunucu bileseninde (panel sayfalarinin verisi) gecerli yonetici oturumu var mi. */
export async function hasPanelSession(): Promise<boolean> {
  if (!usesDatabase()) return false;
  const token = (await cookies()).get(SESSION_COOKIES.admin)?.value;
  return (await readSession(database(), token, "admin")) !== null;
}

/** Kupon formundaki kapsam secimi icin urun, kategori ve gruplar (sitenin katalogu). */
export async function panelCatalog(): Promise<Pick<CatalogData, "products" | "categories" | "categoryGroups"> | null> {
  const catalog = await getDatabaseCatalog();
  return catalog && { products: catalog.products, categories: catalog.categories, categoryGroups: catalog.categoryGroups };
}

/** Panelin yazan islemi: islem (transaction) icinde, yonetici ve istekle. */
export type PanelAction = (
  db: Parameters<Parameters<ReturnType<typeof database>["transaction"]>[0]>[0],
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
) => Promise<PanelResult<object>>;

/**
 * Panelin yazma uclarinin ortak akisi (/api/yonetim/satis, /api/yonetim/talepler):
 * yalnizca veritabani modunda; baska siteden gelen istek 403; gecerli panel
 * oturumu yoksa 401; islem tek bir islemde (transaction) calisir. Basarida
 * afterSuccess cagrilir (or. sitenin onbellegini yenilemek).
 */
export async function runPanelAction(
  request: NextRequest,
  actions: Record<string, PanelAction>,
  name: string,
  afterSuccess?: (name: string) => void,
) {
  if (!usesDatabase() || !Object.hasOwn(actions, name)) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const actor = await panelAdmin(request);
  if (!actor) return json({ ok: false, error: tr.panel.sessionEnded }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  }
  const result = await database().transaction((tx) => actions[name](tx, actor, body as Record<string, unknown>, new Date()));
  if (!result.ok) return json({ ok: false, error: result.error }, result.status);
  afterSuccess?.(name);
  return json(result);
}
