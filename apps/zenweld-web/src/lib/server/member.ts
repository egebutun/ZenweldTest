import type { NextRequest } from "next/server";
import { readSession } from "@zenweld/auth/server";
import type { Member } from "@zenweld/db";
import { database, usesDatabase } from "./db";
import { SESSION_COOKIES } from "./session-cookie";

/**
 * Istegi gonderen site uyesi (veritabani modu; oturum cerezinden). Uye
 * yoksa, oturum gecersizse ya da demo modundaysa null. Tarayicidan gelen
 * uye kimligi hicbir zaman kullanilmaz.
 */
export async function siteMember(request: NextRequest): Promise<Member | null> {
  if (!usesDatabase()) return null;
  const session = await readSession(database(), request.cookies.get(SESSION_COOKIES.site)?.value, "site");
  if (!session) return null;
  const { id, role, email, firstName, lastName, phone } = session.user;
  return { id, role: role as Member["role"], email, firstName, lastName, phone };
}
