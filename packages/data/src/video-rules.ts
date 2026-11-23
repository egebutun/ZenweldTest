import { isUploadedFile } from "./catalog-rules";
import type { Parsed } from "./settings-rules";
import type { HomeVideoSettings, Product, SiteVideo } from "./types";

/**
 * VIDEO KUTUPHANESI KURALLARI — PANEL › Videolar (demo ve veritabani modu
 * ayni; KARARLAR K-125; docs/IS-KURALLARI.md › 27)
 *
 * Her video bir kez eklenir ve bir urune baglanabilir: urunun sayfasinda,
 * "Anasayfada goster" isaretliyse anasayfada gorunur. Tarayici (panel
 * ekrani) ve sunucu (packages/db › admin-content.ts) ayni kurallari
 * kullanir; sunucu tarayicidan geleni yeniden denetler.
 */

export const VIDEO_LIMITS = { sectionTitle: 60, title: 100, cover: 2000 };

export const VIDEO_NO_SECTION_TITLE = "Bölüm başlığı yazılmalı.";
export const VIDEO_BAD_LINK = "YouTube linki okunamadı. Videonun adresini (ör. https://www.youtube.com/shorts/…) yapıştırın.";
export const VIDEO_TWICE = "Bu YouTube videosu kütüphanede zaten var.";

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

/** YouTube'un kapak resmi (her videoda bulunan boyut: 480×360). */
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/**
 * YouTube'un kapak resimleri, en iyiden baslayarak: Shorts'un dik kapagi
 * (oar2, 1080×1920'ye kadar), yuksek cozunurluk (maxresdefault, 1280×720)
 * ve her videoda bulunan hqdefault. Olmayan boyut icin YouTube 120×90'lik
 * gri bir resim dondurur; sitede bu durumda siradakine gecilir
 * (videoCoverFits).
 */
export const youtubeCovers = (id: string) => [
  `https://i.ytimg.com/vi/${id}/oar2.jpg`,
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  youtubeThumbnail(id),
];

/**
 * Yuklenen kapak resmi kullanilabilir mi: YouTube'un "yok" resmi (120×90)
 * degil; dik kapak (oar2) gercekten dik olmali.
 */
export function videoCoverFits(url: string, width: number, height: number): boolean {
  if (width <= 120) return false;
  return !url.includes("/oar2.jpg") || height > width;
}

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

/** Panelden gelen video bilgisi (kimlik, eklenme ani ve dosya disinda). */
export type VideoDraft = Pick<SiteVideo, "source" | "youtubeId" | "title" | "productId" | "cover" | "showOnHome" | "active">;

/**
 * Videoyu denetler ve temizler: YouTube linki kimlige cevrilir, baslik
 * kirpilir, bos baslik, urun ve kapak kaydedilmez. error null: istek bozuk
 * (ekran boyle bir sey gondermez). Bugun yalnizca YouTube videosu eklenir;
 * kendi videomuz (source "file") adim 1b'de.
 */
export function parseVideo(value: unknown): Parsed<VideoDraft> {
  const bad = { ok: false as const, error: null };
  if (!isRecord(value) || value.source !== "youtube") return bad;
  const title = typeof value.title === "string" || value.title === undefined ? (value.title ?? "").trim() : null;
  const productId = value.productId === undefined || value.productId === "" ? "" : typeof value.productId === "string" ? value.productId : null;
  const img = cover(value.cover);
  if (title === null || title.length > VIDEO_LIMITS.title || productId === null || img === null) return bad;
  if (typeof value.showOnHome !== "boolean" || typeof value.active !== "boolean" || typeof value.youtubeId !== "string") return bad;
  const youtubeId = youtubeIdFrom(value.youtubeId);
  if (!youtubeId) return { ok: false, error: VIDEO_BAD_LINK };
  return {
    ok: true,
    value: {
      source: "youtube",
      youtubeId,
      ...(title && { title }),
      ...(productId && { productId }),
      ...(img && { cover: img }),
      showOnHome: value.showOnHome,
      active: value.active,
    },
  };
}

/** Ayni YouTube videosu kutuphanede baska bir kayitta var mi. */
export const videoTaken = (videos: SiteVideo[], youtubeId: string | undefined, exceptId?: string) =>
  Boolean(youtubeId) && videos.some((v) => v.id !== exceptId && v.youtubeId === youtubeId);

/** Anasayfa bolumunun basligi: zorunlu, en fazla 60 karakter, kirpilir. */
export function parseHomeVideoSettings(value: unknown): Parsed<HomeVideoSettings> {
  if (!isRecord(value) || typeof value.title !== "string") return { ok: false, error: null };
  const title = value.title.trim();
  if (!title) return { ok: false, error: VIDEO_NO_SECTION_TITLE };
  if (title.length > VIDEO_LIMITS.sectionTitle) return { ok: false, error: null };
  return { ok: true, value: { title } };
}

/** Kapak yuklenen dosya (data:) mi; veritabani modunda kaydedilmez (KARARLAR K-108). */
export const videoHasUploadedFile = (video: Pick<SiteVideo, "cover">) => isUploadedFile(video.cover);

/** Videonun sitede ve panelde gorunen adi: kendi basligi, yoksa urunun adi. */
export const videoTitle = (video: Pick<SiteVideo, "title">, product?: Pick<Product, "name">) =>
  video.title || product?.name || "Zenweld videosu";

/** Videoyu oynatilabilir mi: YouTube ya da hazirlanmasi bitmis kendi videomuz. */
export const videoPlayable = (video: SiteVideo) =>
  video.source === "youtube" ? Boolean(video.youtubeId) : video.file?.status === "ready";

/**
 * Anasayfada gorunen videolar, paneldeki sirayla: yayinda, "Anasayfada
 * goster" isaretli ve oynatilabilir olanlar. Urun yayinda degilse ya da
 * silinmisse video urunsuz gorunur.
 */
export function homeVideos(videos: SiteVideo[], products: Product[]): { video: SiteVideo; product?: Product }[] {
  return videos
    .filter((v) => v.active && v.showOnHome && videoPlayable(v))
    .map((video) => ({ video, product: products.find((p) => p.active && p.id === video.productId) }));
}
