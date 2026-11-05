import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { readSession, type SessionUser } from "@zenweld/auth/server";
import type { Actor } from "@zenweld/db";
import type { CatalogData } from "@zenweld/store";
import { getDatabaseCatalog } from "./catalog";
import { database, usesDatabase } from "./db";
import { clientInfo, SESSION_COOKIES } from "./session-cookie";

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
