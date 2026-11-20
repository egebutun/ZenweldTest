import { isUploadedFile } from "./catalog-rules";
import type { Parsed } from "./settings-rules";
import type { HomeVideo, HomeVideoSettings, Product } from "./types";

/**
 * ANASAYFA VIDEOLARI KURALLARI — PANEL › Anasayfa Videoları (demo ve
 * veritabani modu ayni; KARARLAR K-125; docs/IS-KURALLARI.md › Anasayfa
 * videolari)
 *
 * Tarayici (panel ekrani) ve sunucu (packages/db › admin-settings.ts) ayni
 * kurallari kullanir; sunucu tarayicidan geleni yeniden denetler.
 */

export const VIDEO_LIMITS = { maxVideos: 12, title: 60, cover: 2000 };

export const VIDEO_NO_TITLE = "Bölüm başlığı yazılmalı.";
export const VIDEO_TOO_MANY = `En fazla ${VIDEO_LIMITS.maxVideos} video eklenebilir.`;
export const VIDEO_BAD_LINK = "YouTube linki okunamadı. Videonun adresini (ör. https://www.youtube.com/shorts/…) yapıştırın.";
export const VIDEO_TWICE = "Aynı video iki kez eklenemez.";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * YouTube linkinden video kimligi: Shorts (youtube.com/shorts/…), izleme
 * (youtube.com/watch?v=…), kisa link (youtu.be/…), gomme (/embed/…) ya da
 * yalnizca kimlik. Okunamazsa null.
 */
export function youtubeIdFrom(input: string): string | null {
  const text = input.trim();
  if (YOUTUBE_ID.test(text)) return text;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id = first === "watch" ? url.searchParams.get("v") : ["shorts", "embed", "live"].includes(first) ? second : null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Panelde ve belgede gorunen link (Shorts bicimi). */
export const youtubeLink = (id: string) => `https://www.youtube.com/shorts/${id}`;

/** YouTube'un kapak resmi (her videoda bulunan boyut). */
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/**
 * Oynatici adresi: cerezsiz YouTube (youtube-nocookie.com; video
 * oynatilmadan cerez yazilmaz), ziyaretci Oynat'a basinca yuklenir ve
 * hemen oynar; bitince baska kanallarin videolari onerilmez.
 */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

/** Kapak: yuklenen dosya (data:image/...), site ici adres ya da https:// adres; bos olabilir. */
function cover(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  if (value.startsWith("data:image/")) return value;
  const url = value.trim();
  if (url.length > VIDEO_LIMITS.cover) return null;
  return /^\/(?!\/)\S*$/.test(url) || /^https:\/\/\S+$/i.test(url) ? url : null;
}

function parseVideo(value: unknown, n: number): Parsed<HomeVideo> {
  if (!isRecord(value)) return { ok: false, error: null };
  const id = typeof value.id === "string" && value.id.length > 0 && value.id.length <= 100 ? value.id : null;
  const productId = value.productId === undefined || value.productId === "" ? "" : typeof value.productId === "string" ? value.productId : null;
  const img = cover(value.cover);
  if (!id || typeof value.active !== "boolean" || productId === null || img === null || typeof value.youtubeId !== "string") {
    return { ok: false, error: null };
  }
  const youtubeId = youtubeIdFrom(value.youtubeId);
  if (!youtubeId) return { ok: false, error: `${n}. video: ${VIDEO_BAD_LINK}` };
  return {
    ok: true,
    value: { id, youtubeId, ...(productId && { productId }), ...(img && { cover: img }), active: value.active },
  };
}

/**
 * Videolar bolumunu denetler ve temizler: baslik kirpilir, link video
 * kimligine cevrilir, bos urun ve kapak kaydedilmez. Hata varsa hangi
 * videoda oldugu yazilir. error null: istek bozuk (ekran boyle bir sey
 * gondermez). Liste bos olabilir; o zaman bolum sitede gorunmez.
 */
export function parseHomeVideos(value: unknown): Parsed<HomeVideoSettings> {
  if (!isRecord(value) || !Array.isArray(value.videos) || typeof value.title !== "string") return { ok: false, error: null };
  const title = value.title.trim();
  if (!title) return { ok: false, error: VIDEO_NO_TITLE };
  if (title.length > VIDEO_LIMITS.title) return { ok: false, error: null };
  if (value.videos.length > VIDEO_LIMITS.maxVideos) return { ok: false, error: VIDEO_TOO_MANY };

  const videos: HomeVideo[] = [];
  for (const [i, raw] of value.videos.entries()) {
    const parsed = parseVideo(raw, i + 1);
    if (!parsed.ok) return parsed;
    videos.push(parsed.value);
  }
  if (new Set(videos.map((v) => v.id)).size !== videos.length) return { ok: false, error: null };
  if (new Set(videos.map((v) => v.youtubeId)).size !== videos.length) return { ok: false, error: VIDEO_TWICE };
  return { ok: true, value: { title, videos } };
}

/** Kapaklarda yuklenen dosya (data:) var mi; veritabani modunda kaydedilmez (KARARLAR K-108). */
export const videosHaveUploadedFile = (settings: HomeVideoSettings) => settings.videos.some((v) => isUploadedFile(v.cover));

/** Karsilastirma anahtari; son degisiklik ani (updatedAt) haric. */
export const homeVideosKey = (settings: HomeVideoSettings) => JSON.stringify([settings.title, settings.videos]);

/**
 * Sitede gorunen videolar, paneldeki sirayla: yayinda olanlar. Urun
 * yayinda degilse ya da silinmisse video urunsuz gorunur.
 */
export function visibleHomeVideos(settings: HomeVideoSettings, products: Product[]): { video: HomeVideo; product?: Product }[] {
  return settings.videos
    .filter((v) => v.active)
    .map((video) => ({ video, product: products.find((p) => p.active && p.id === video.productId) }));
}
