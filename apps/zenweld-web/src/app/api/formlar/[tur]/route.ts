import { after, type NextRequest } from "next/server";
import {
  createQuote,
  createReview,
  createServiceRequest,
  findWarranty,
  memberQuotes,
  memberWarranties,
  registerWarranty,
  type FormFailure,
} from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { quoteNotice, reviewNotice, serviceNotice, warrantyNotice } from "@/lib/form-text";
import { getDatabaseCatalog } from "@/lib/server/catalog";
import { database, usesDatabase } from "@/lib/server/db";
import { isBot, recordBot, sourcePath } from "@/lib/server/mail";
import { sendNotification } from "@/lib/server/notify";
import { siteMember } from "@/lib/server/member";
import { json, notFound, sameOrigin } from "@/lib/server/session-cookie";

/**
 * FORMLAR (veritabani modu; Asama 5.3)
 *
 *   POST /api/formlar/teklif   Teklif Al          -> {code}
 *   POST /api/formlar/servis   servis talebi      -> {code}
 *   POST /api/formlar/garanti  garanti kaydi
 *   POST /api/formlar/yorum    urun yorumu (panel onayi bekler)
 *   GET  /api/formlar/garanti?seri=...  garanti sorgulama (herkes)
 *   GET  /api/formlar/teklifler          uyenin teklifleri
 *   GET  /api/formlar/garantiler         uyenin garantileri (e-postasiyla)
 *
 * Kurallar: packages/db/src/forms.ts. Formlar ziyaretciye de aciktir;
 * giris yapmissa uye oturum cerezinden bulunur. Bot tuzagi doluysa kayit
 * yapilmaz, basarili gibi yanit verilir. info@zenweld.com bildirimi
 * kayittan sonra gider; yanit onu beklemez.
 */

export const runtime = "nodejs";

type Context = { params: Promise<{ tur: string }> };


const failure = (result: FormFailure) => json({ ok: false, error: result.error }, result.status);

export async function GET(request: NextRequest, context: Context) {
  const { tur } = await context.params;
  if (!usesDatabase()) return notFound();
  const db = database();
  if (tur === "garanti") {
    return json({ ok: true, warranty: await findWarranty(db, request.nextUrl.searchParams.get("seri")) });
  }
  if (tur !== "teklifler" && tur !== "garantiler") return notFound();
  const member = await siteMember(request);
  if (!member) return json({ ok: false, error: tr.auth.errors.sessionEnded }, 401);
  return tur === "teklifler"
    ? json({ ok: true, quotes: await memberQuotes(db, member.id) })
    : json({ ok: true, warranties: await memberWarranties(db, member.email) });
}

const TYPES = { teklif: "teklif", servis: "servis", garanti: "garanti", yorum: "yorum" } as const;

export async function POST(request: NextRequest, context: Context) {
  const { tur } = await context.params;
  if (!usesDatabase() || !Object.hasOwn(TYPES, tur)) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const type = TYPES[tur as keyof typeof TYPES];
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const page = sourcePath(request);
  if (isBot(body)) {
    await recordBot({ type, sourcePath: page });
    return json({ ok: true, code: "" });
  }
  const catalog = await getDatabaseCatalog();
  if (!catalog) return notFound();
  const member = await siteMember(request);
  const db = database();
  const at = new Date();

  switch (type) {
    case "teklif": {
      const result = await db.transaction((tx) => createQuote(tx, member, body, at, catalog));
      if (!result.ok) return failure(result);
      const { quote } = result;
      after(() => sendNotification("teklif", quoteNotice(quote, tr), { sourcePath: page, entity: { type: "quotes", id: quote.id } }));
      return json({ ok: true, code: quote.code });
    }
    case "servis": {
      const result = await db.transaction((tx) => createServiceRequest(tx, member, body, at, catalog));
      if (!result.ok) return failure(result);
      const { request: record } = result;
      after(() =>
        sendNotification("servis", serviceNotice(record, tr), {
          sourcePath: page,
          entity: { type: "service_requests", id: record.id },
        }),
      );
      return json({ ok: true, code: record.code });
    }
    case "garanti": {
      const result = await db.transaction((tx) => registerWarranty(tx, body, at, catalog));
      if (!result.ok) return failure(result);
      const { warranty, productName } = result;
      after(() =>
        sendNotification("garanti", warrantyNotice(warranty, productName), {
          sourcePath: page,
          entity: { type: "warranties", id: warranty.id },
        }),
      );
      return json({ ok: true, serialNumber: warranty.serialNumber });
    }
    case "yorum": {
      const result = await createReview(db, member, body, at, catalog);
      if (!result.ok) return failure(result);
      const { review, productName } = result;
      after(() =>
        sendNotification("yorum", reviewNotice(review, productName), { sourcePath: page, entity: { type: "reviews", id: review.id } }),
      );
      return json({ ok: true });
    }
  }
}
