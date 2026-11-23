import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileExtension, uploadAddress, videoEncodeArgs, videoFileKey } from "@zenweld/data";
import { finishVideoJob, nextVideoJob, type VideoJob, type VideoJobResult } from "@zenweld/db";
import { database, usesDatabase } from "./db";
import { fileStorage } from "./files";
import { refreshSite } from "./refresh";

/**
 * KENDI VIDEOLARIMIZIN HAZIRLANMASI (veritabani modu; KARARLAR K-125;
 * docs/SUNUCU.md › Video hazirlama)
 *
 * Panelde yuklenen orijinal video (en fazla 1 GB) sunucuda ffmpeg ile web
 * icin hazirlanir: 1080p ve 720p surum (H.264, hizli baslama; ayarlar
 * packages/data › video-rules.ts › VIDEO_PRESETS) ve videonun 1. saniyesinden
 * kapak karesi (WebP; ffmpeg'de WebP yoksa JPG). HDR (iPhone) videolarin
 * renkleri SDR'ye donusturulur. Hazirlaninca orijinal silinir.
 *
 * Isleyici sunucuda tek tek calisir (ayni anda bir video): sira
 * veritabanindaki "processing" satirlaridir (packages/db › video-jobs.ts).
 * Panel video kaydedince ve Videolar ekrani acilinca (siradaki video
 * varsa) panelin istek ucundan baslatilir; sunucu yeniden baslarsa yarim
 * kalan video bir sonraki baslatmada yeniden hazirlanir. Bir video en fazla 2 saat surebilir; asilirsa hazirlanamadi.
 *
 * Arac: FFMPEG_PATH ve FFPROBE_PATH (tanimli degilse "ffmpeg", "ffprobe").
 */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const TIME_LIMIT_MS = 2 * 60 * 60 * 1000;

/** Komutu calistirir; ciktisini dondurur, hata verirse firlatir. */
function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    const timer = setTimeout(() => child.kill("SIGKILL"), TIME_LIMIT_MS);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${command} ${code}: ${err}`));
    });
  });
}

let available: Promise<boolean> | undefined;

/** Sunucuda ffmpeg ve ffprobe var mi (bir kez denetlenir). */
export function videoToolsAvailable(): Promise<boolean> {
  available ??= Promise.all([run(FFMPEG, ["-version"]), run(FFPROBE, ["-version"])]).then(
    () => true,
    () => false,
  );
  return available;
}

type Probe = { width: number; height: number; duration: number; hdr: boolean };

async function probe(path: string): Promise<Probe> {
  const out = await run(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,color_transfer:stream_side_data=rotation:format=duration",
    "-of", "json",
    path,
  ]);
  const data = JSON.parse(out) as {
    streams?: { width?: number; height?: number; color_transfer?: string; side_data_list?: { rotation?: number }[] }[];
    format?: { duration?: string };
  };
  const stream = data.streams?.[0] ?? {};
  const rotated = Math.abs(stream.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0) % 180 === 90;
  return {
    width: (rotated ? stream.height : stream.width) ?? 0,
    height: (rotated ? stream.width : stream.height) ?? 0,
    duration: Number(data.format?.duration ?? 0),
    hdr: ["arib-std-b67", "smpte2084"].includes(stream.color_transfer ?? ""),
  };
}

/** Bir videoyu hazirlar ve dosyalari depoya yazar. */
async function prepare(job: VideoJob): Promise<VideoJobResult> {
  const storage = fileStorage();
  if (!storage || !job.original) return { ok: false };
  const dir = await mkdtemp(join(tmpdir(), "zenweld-video-"));
  try {
    const input = join(dir, `orijinal.${fileExtension(job.original)}`);
    await storage.toLocal(job.original, input);
    const source = await probe(input);
    if (!source.width || !source.height) return { ok: false };

    const hd = join(dir, "1080.mp4");
    const sd = join(dir, "720.mp4");
    await run(FFMPEG, videoEncodeArgs(input, hd, "hd", source.hdr));
    await run(FFMPEG, videoEncodeArgs(input, sd, "sd", source.hdr));

    // Kapak: 1. saniye (kisa videoda ortasi), 1080p surumden.
    const at = String(Math.min(1, source.duration / 2).toFixed(2));
    let poster = join(dir, "kapak.webp");
    try {
      await run(FFMPEG, ["-y", "-ss", at, "-i", hd, "-frames:v", "1", "-c:v", "libwebp", "-quality", "85", poster]);
    } catch {
      poster = join(dir, "kapak.jpg");
      await run(FFMPEG, ["-y", "-ss", at, "-i", hd, "-frames:v", "1", "-q:v", "2", poster]);
    }
    const result = await probe(hd);

    const keys = {
      hd: videoFileKey(job.original, "1080.mp4"),
      sd: videoFileKey(job.original, "720.mp4"),
      poster: videoFileKey(job.original, poster.endsWith(".webp") ? "kapak.webp" : "kapak.jpg"),
    };
    await storage.fromLocal(keys.hd, hd);
    await storage.fromLocal(keys.sd, sd);
    await storage.fromLocal(keys.poster, poster);
    return {
      ok: true,
      hd: uploadAddress(keys.hd),
      sd: uploadAddress(keys.sd),
      poster: uploadAddress(keys.poster),
      durationSeconds: Math.round(result.duration),
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Video hazırlanamadı:", job.id, error);
    return { ok: false };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

let running: Promise<void> | null = null;

/**
 * Siradaki videolari tek tek hazirlar; zaten calisiyorsa bir sey yapmaz.
 * Beklenmez (panelin istegi hemen doner); hazirlanan her video sonrasi site
 * yenilenir.
 */
export function startVideoWorker(): void {
  if (running || !usesDatabase() || !fileStorage()) return;
  running = (async () => {
    if (!(await videoToolsAvailable())) return;
    const db = database();
    for (;;) {
      const job = await nextVideoJob(db);
      if (!job) break;
      const result = await prepare(job);
      const written = await finishVideoJob(db, job, result, new Date());
      // Hazirlanan orijinal silinir; satir bu arada degistiyse orijinale dokunulmaz.
      if (written && result.ok) await fileStorage()?.remove(job.original);
      // Site hemen yenilenir; olmazsa sayfalar en gec 30 saniyede kendiliginden yenilenir.
      try {
        refreshSite(["icerik"]);
      } catch (error) {
        console.error("Video hazırlandı, site yenilenemedi:", error);
      }
    }
  })()
    .catch((error) => console.error("Video işleyici durdu:", error))
    .finally(() => {
      running = null;
    });
}
