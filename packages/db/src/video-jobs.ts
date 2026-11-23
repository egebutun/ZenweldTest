import { and, asc, eq, isNull } from "drizzle-orm";
import type { AuditDb } from "./audit";
import * as s from "./schema";

/**
 * KENDI VIDEOLARIMIZIN HAZIRLANMA SIRASI (KARARLAR K-125; docs/SUNUCU.md ›
 * Video hazirlama)
 *
 * Sira, videos tablosundaki "processing" satirlaridir: panel yeni dosya
 * yukleyince ya da "Yeniden hazırla" deyince satir siraya girer. Sunucunun
 * video isleyicisi (apps/zenweld-web › lib/server/video-worker.ts) siradaki
 * satiri alir, ffmpeg ile hazirlar ve sonucu burada yazar. Sunucu yeniden
 * baslarsa yarim kalan satir siradaki calismada yeniden hazirlanir.
 */

export type VideoJob = { id: string; original: string };

/** Siradaki video (en eski once); yoksa null. */
export async function nextVideoJob(db: AuditDb): Promise<VideoJob | null> {
  const [row] = await db
    .select({ id: s.videos.id, original: s.videos.fileOriginal })
    .from(s.videos)
    .where(eq(s.videos.fileStatus, "processing"))
    .orderBy(asc(s.videos.updatedAt), asc(s.videos.id))
    .limit(1);
  // Orijinali olmayan satir (bozuk kayit) bos anahtarla doner; isleyici onu hazirlanamadi diye isaretler.
  return row ? { id: row.id, original: row.original ?? "" } : null;
}

export type VideoJobResult =
  | { ok: true; hd: string; sd: string; poster: string; durationSeconds: number; width: number; height: number }
  | { ok: false };

/**
 * Hazirlamanin sonucunu yazar. Satir bu arada degistiyse (yeni dosya
 * yuklendi, silindi) bir sey yazilmaz; dondurulen false ise isleyici
 * hazirladigi dosyalari kullanilmamis sayar. Basarida orijinalin anahtari
 * silinir (dosyayi isleyici siler).
 */
export async function finishVideoJob(db: AuditDb, job: VideoJob, result: VideoJobResult, at: Date): Promise<boolean> {
  const original = job.original ? eq(s.videos.fileOriginal, job.original) : isNull(s.videos.fileOriginal);
  const where = and(eq(s.videos.id, job.id), eq(s.videos.fileStatus, "processing"), original);
  const value = result.ok
    ? {
        fileStatus: "ready",
        fileOriginal: null,
        fileHd: result.hd,
        fileSd: result.sd,
        filePoster: result.poster,
        durationSeconds: result.durationSeconds,
        width: result.width,
        height: result.height,
      }
    : { fileStatus: "failed" };
  const rows = await db.update(s.videos).set({ ...value, updatedAt: at }).where(where).returning({ id: s.videos.id });
  return rows.length > 0;
}
