import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { checkUpload, fileExtension, uploadKey, UPLOAD_RULES, uploadSizeError, uploadTypeError, VIDEO_TOOL_MISSING } from "@zenweld/data";
import { FileTooLargeError, writeAudit } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { panelAdmin } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { fileStorage } from "@/lib/server/files";
import { json, notFound, sameOrigin } from "@/lib/server/session-cookie";
import { videoToolsAvailable } from "@/lib/server/video-worker";

/**
 * PANEL › KENDI VIDEOMUZUN YUKLENMESI (veritabani modu; KARARLAR K-125)
 *
 *   POST /api/yonetim/video-yukle   govde: videonun kendisi; X-Dosya-Adi: dosyanin adi (URL kodlu)
 *
 * Orijinal video (en fazla 1 GB) bellege alinmadan dosya deposuna yazilir
 * ("video/2026/11/<16 hane>/orijinal.<uzanti>"); sinir asilirsa yazilan
 * kisim silinir (413). Tur dosyanin icerigine bakilarak bulunur (MP4, MOV,
 * M4V, WebM, MKV); baska tur silinir (400). Yanit { ok, upload }:
 * panel bu anahtari videoyu kaydederken gonderir; sunucu videoyu o zaman
 * hazirlamaya baslar (lib/server/video-worker.ts).
 *
 * Yalnizca gecerli panel oturumuyla (401) ve ayni siteden (403). Depo ayarli
 * degilse ya da sunucuda ffmpeg yoksa 503. Yukleme audit_log'a (files)
 * yazilir.
 */

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!usesDatabase()) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const actor = await panelAdmin(request);
  if (!actor) return json({ ok: false, error: tr.panel.sessionEnded }, 401);
  const storage = fileStorage();
  if (!storage) return json({ ok: false, error: tr.panel.uploadDisabled }, 503);
  if (!(await videoToolsAvailable())) return json({ ok: false, error: VIDEO_TOOL_MISSING }, 503);

  const { maxBytes } = UPLOAD_RULES.video;
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return json({ ok: false, error: uploadSizeError("video") }, 413);
  if (!request.body) return json({ ok: false, error: tr.panel.invalidRequest }, 400);
  const name = decodeURIComponent(request.headers.get("x-dosya-adi") ?? "video").slice(0, 200);
  const declared = fileExtension(name);
  if (!UPLOAD_RULES.video.extensions.includes(declared)) return json({ ok: false, error: uploadTypeError("video") }, 400);

  const at = new Date();
  const random = randomBytes(8).toString("hex");
  // Adin uzantisiyla yazilir; icerik bu uzantinin ailesinden degilse silinir.
  const key = uploadKey("video", at, random, name, declared);
  let size: number;
  try {
    size = await storage.write(key, request.body, maxBytes);
  } catch (error) {
    if (error instanceof FileTooLargeError) return json({ ok: false, error: uploadSizeError("video") }, 413);
    throw error;
  }
  const head = await storage.read(key, { start: 0, end: Math.min(size, 64) - 1 });
  const bytes = head ? new Uint8Array(await new Response(head.stream).arrayBuffer()) : new Uint8Array();
  // Boyut yazarken denetlendi; burada tur (ilk baytlar) ve uzantinin icerikle uyumu.
  const typeOk = size > 0 && detectMatches(checkUpload("video", name, bytes), declared);
  if (!typeOk) {
    await storage.remove(key);
    return json({ ok: false, error: size === 0 ? tr.panel.invalidRequest : uploadTypeError("video") }, 400);
  }

  await database().transaction((tx) =>
    writeAudit(tx, actor, { action: "create", entityType: "files", entityId: key, entityLabel: name, changes: { tur: "video", boyut: size } }, at),
  );
  return json({ ok: true, upload: key, size });
}

/** Icerikten bulunan tur, adin uzantisiyla ayni video ailesinde mi. */
function detectMatches(checked: ReturnType<typeof checkUpload>, declared: string): boolean {
  if (!checked.ok) return false;
  const iso = ["mp4", "mov", "m4v"];
  const matroska = ["webm", "mkv"];
  return checked.ext === declared || (iso.includes(checked.ext) && iso.includes(declared)) || (matroska.includes(checked.ext) && matroska.includes(declared));
}
