import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { checkUpload, uploadAddress, uploadKey, UPLOAD_RULES, uploadSizeError, type UploadKind } from "@zenweld/data";
import { writeAudit } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { panelAdmin } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { fileStorage } from "@/lib/server/files";
import { json, notFound, sameOrigin } from "@/lib/server/session-cookie";

/**
 * PANELDEN DOSYA YUKLEME (veritabani modu; KARARLAR K-108;
 * docs/IS-KURALLARI.md › 23)
 *
 *   POST /api/yonetim/dosya?tur=gorsel|belge   form: dosya
 *
 * Yalnizca gecerli panel oturumu olan yonetici yukler (yoksa 401); baska
 * siteden gelen istek 403; dosya deposu ayarli degilse 503. Dosyanin turu
 * icerigine bakilarak bulunur; kabul edilmeyen tur ya da buyuk dosya 400 /
 * 413. Dosya depoya yazilir, yukleme islem kaydina (audit_log, "files")
 * yazilir ve sitedeki adresi doner: { ok, address, fileName, size }.
 * Adres kayda (urun gorseli, belge...) panelin kendi kaydetme isteginde
 * yazilir.
 */

export const runtime = "nodejs";

const KINDS: UploadKind[] = ["gorsel", "belge"];

export async function POST(request: NextRequest) {
  if (!usesDatabase()) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const actor = await panelAdmin(request);
  if (!actor) return json({ ok: false, error: tr.panel.sessionEnded }, 401);

  const kind = request.nextUrl.searchParams.get("tur") as UploadKind;
  if (!KINDS.includes(kind)) return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  const storage = fileStorage();
  if (!storage) return json({ ok: false, error: kind === "gorsel" ? tr.panel.uploadDisabled : tr.panel.documentUploadDisabled }, 503);
  // Govde okunmadan once: sinirdan cok buyuk istek hic okunmaz.
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > UPLOAD_RULES[kind].maxBytes + 64 * 1024) return json({ ok: false, error: uploadSizeError(kind) }, 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("dosya");
  if (!(file instanceof File)) return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  if (file.size > UPLOAD_RULES[kind].maxBytes) return json({ ok: false, error: uploadSizeError(kind) }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = checkUpload(kind, file.name, bytes);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  const at = new Date();
  const key = uploadKey(kind, at, randomBytes(8).toString("hex"), file.name, checked.ext);
  await storage.put(key, bytes);
  await database().transaction((tx) =>
    writeAudit(
      tx,
      actor,
      { action: "create", entityType: "files", entityId: key, entityLabel: file.name.slice(0, 200), changes: { tur: kind, boyut: bytes.length } },
      at,
    ),
  );
  return json({ ok: true, address: uploadAddress(key), fileName: key.slice(key.lastIndexOf("/") + 1), size: bytes.length });
}
