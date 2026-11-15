import type { NextRequest } from "next/server";
import { isEmailType, parseOutgoingEmail } from "@zenweld/data";
import { adminSaveEmailSettings, findEmailMessage, readEntityEmails, writeAudit } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { panelAdmin, runPanelAction } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { addressesFor, sendPanelMail } from "@/lib/server/mail";
import { readSiteMailboxes } from "@/lib/server/mailbox";
import { json, notFound, sameOrigin } from "@/lib/server/session-cookie";

/**
 * PANEL › E-POSTA (veritabani modu; KARARLAR K-116)
 *
 *   POST /api/yonetim/eposta/adresler  {type, sender, recipients, version}  turun adresleri
 *   POST /api/yonetim/eposta/gonder    {type, to, subject, body, entity?, parentId?}  Yeni e-posta / Yanitla
 *   POST /api/yonetim/eposta/oku       posta kutusunu hemen okur (zamanlanmis isi beklemeden)
 *   GET  /api/yonetim/eposta/kayit?tur=service_requests&id=…&eposta=servis  kaydin yazismalari ve turun gondericisi
 *
 * Her istek yonetici oturumuyla denetlenir; adres degisikligi ve gonderilen
 * e-posta islem kaydina yazilir. Kurallar: packages/data › email.ts,
 * packages/db › emails.ts.
 */

export const runtime = "nodejs";

type Context = { params: Promise<{ islem: string }> };

/** E-postanin baglanabildigi kayitlar (panelde e-posta gonder kutusu olan ekranlar ve kayit numarasi olanlar). */
const ENTITY_TYPES = ["service_requests", "support_messages", "quotes", "orders", "return_requests", "warranties", "dealer_applications", "users"];

export async function POST(request: NextRequest, context: Context) {
  const action = (await context.params).islem;
  if (action === "adresler") return runPanelAction(request, { adresler: adminSaveEmailSettings }, action);
  if (!usesDatabase() || (action !== "gonder" && action !== "oku")) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const actor = await panelAdmin(request);
  if (!actor) return json({ ok: false, error: tr.panel.sessionEnded }, 401);

  if (action === "oku") {
    const runs = await readSiteMailboxes();
    if (!runs) return json({ ok: false, error: tr.panel.mailboxMissing }, 400);
    const failed = runs.find((r) => r.error);
    if (failed) return json({ ok: false, error: `${tr.panel.mailboxFailed} ${failed.error}` }, 502);
    return json({ ok: true, imported: runs.reduce((sum, r) => sum + r.imported, 0) });
  }

  const parsed = parseOutgoingEmail(await request.json().catch(() => null));
  if (!parsed.ok) return json({ ok: false, error: parsed.error ?? tr.panel.invalidRequest }, 400);
  const email = parsed.value;
  if (email.entity && !ENTITY_TYPES.includes(email.entity.type)) return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  const parent = email.parentId ? await findEmailMessage(database(), email.parentId) : undefined;
  if (email.parentId && !parent) return json({ ok: false, error: tr.panel.emailNotFound }, 404);

  const sent = await sendPanelMail(email, actor, parent && { id: parent.id, messageId: parent.messageId });
  await database().transaction((tx) =>
    writeAudit(
      tx,
      actor,
      {
        action: "create",
        entityType: "email_log",
        entityId: sent.id ? String(sent.id) : "-",
        entityLabel: `E-posta: ${email.subject}`.slice(0, 200),
        changes: { to: [null, email.to], status: [null, sent.status], ...(email.entity && { record: [null, `${email.entity.type}:${email.entity.id}`] }) },
      },
      new Date(),
    ),
  );
  return json({ ok: true, ...(sent.id && { id: String(sent.id) }), status: sent.status, ...(sent.error && { error: sent.error }) });
}

export async function GET(request: NextRequest, context: Context) {
  if (!usesDatabase() || (await context.params).islem !== "kayit") return notFound();
  if (!(await panelAdmin(request))) return json({ ok: false, error: tr.panel.sessionEnded }, 401);
  const type = request.nextUrl.searchParams.get("tur") ?? "";
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const emailType = request.nextUrl.searchParams.get("eposta");
  if (!ENTITY_TYPES.includes(type) || !id || id.length > 100 || !isEmailType(emailType)) {
    return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  }
  const [messages, { from }] = await Promise.all([readEntityEmails(database(), type, id), addressesFor(emailType)]);
  return json({ ok: true, messages, from });
}
