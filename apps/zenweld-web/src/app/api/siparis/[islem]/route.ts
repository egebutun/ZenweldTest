import { after, type NextRequest } from "next/server";
import { AUTH_ERRORS, readSession } from "@zenweld/auth/server";
import { checkCartCoupon, createReturnRequest, memberOrders, placeOrder, readPricingData, type Member, type OrderFailure } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { couponProblemText } from "@/lib/coupon";
import { orderNotice, returnNotice } from "@/lib/order-text";
import { getDatabaseCatalog } from "@/lib/server/catalog";
import { database, usesDatabase } from "@/lib/server/db";
import { sendNotification } from "@/lib/server/notify";
import { SESSION_COOKIES, clearSessionCookie, json, notFound, sameOrigin } from "@/lib/server/session-cookie";

/**
 * SIPARISLER (veritabani modu; Asama 5.2, KARARLAR K-97)
 *
 *   POST /api/siparis/kupon  {code, lines}: sepete yazilan kuponun sonucu
 *                            (ziyaretci de cagirir; uye varsa kisiye ozel
 *                            kupon ve kisi basi sinir de denetlenir)
 *   POST /api/siparis/ver    odeme sayfasi: siparisi kaydeder (yalnizca uye)
 *   GET  /api/siparis/liste  uyenin siparisleri ve iade talepleri
 *   POST /api/siparis/iade   {orderCode, items, reason, note}: iade talebi
 *
 * Tutar, stok ve kupon sunucuda yeniden hesaplanir; kurallar
 * packages/db/src/orders.ts. Uye oturum cerezinden bulunur. Zenweld'e
 * bildirim e-postasi kayittan sonra gider; yanit onu beklemez.
 */

export const runtime = "nodejs";

type Context = { params: Promise<{ islem: string }> };

async function sessionMember(request: NextRequest): Promise<Member | null> {
  const token = request.cookies.get(SESSION_COOKIES.site)?.value;
  const session = await readSession(database(), token, "site");
  if (!session) return null;
  const { id, role, email, firstName, lastName, phone } = session.user;
  return { id, role: role as Member["role"], email, firstName, lastName, phone };
}

const sessionEnded = (request: NextRequest) =>
  clearSessionCookie(json({ ok: false, error: AUTH_ERRORS.sessionEnded }, 401), request, "site");

function orderFailure(result: OrderFailure) {
  const error = result.coupon ? result.error.replace("{reason}", couponProblemText(result.coupon, tr)) : result.error;
  return json({ ok: false, error }, result.status);
}

export async function GET(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase() || islem !== "liste") return notFound();
  const member = await sessionMember(request);
  if (!member) return sessionEnded(request);
  const result = await database().transaction((tx) => memberOrders(tx, member.id, new Date()));
  return json({ ok: true, ...result });
}

export async function POST(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase() || !["kupon", "ver", "iade"].includes(islem)) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const member = await sessionMember(request);

  if (islem === "kupon") {
    // Sepetteki fiyatlar sayfanin katalogundan gelir; kupon da ayni katalogla hesaplanir.
    const catalog = await getDatabaseCatalog();
    if (!catalog) return notFound();
    return json({ ok: true, result: await checkCartCoupon(database(), catalog, body, member, new Date()) });
  }

  if (!member) return sessionEnded(request);
  const db = database();
  if (islem === "ver") {
    const pricing = await readPricingData(db);
    const result = await db.transaction((tx) => placeOrder(tx, member, body, new Date(), pricing));
    if (!result.ok) return orderFailure(result);
    after(() => sendNotification("siparis", orderNotice(result.order, tr)));
    return json({ ok: true, code: result.order.code });
  }

  const result = await db.transaction((tx) => createReturnRequest(tx, member, body, new Date()));
  if (!result.ok) return orderFailure(result);
  after(() => sendNotification("iade", returnNotice(result.request, tr)));
  return json({ ok: true, code: result.request.code });
}
