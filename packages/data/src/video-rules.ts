import { isUploadedFile } from "./catalog-rules";
import { isVideoOriginalKey } from "./file-rules";
import type { Parsed } from "./settings-rules";
import type { Category, CategoryGroup, HomeVideoSettings, Product, SiteVideo, TopLevelSection } from "./types";

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
export const VIDEO_NO_FILE = "Video dosyası seçilmeli.";
export const VIDEO_NO_ORIGINAL = "Videonun orijinal dosyası bulunamadı; dosyayı yeniden yükleyin.";
export const VIDEO_TOOL_MISSING = "Sunucuda video hazırlama aracı (ffmpeg) kurulu değil; kendi videolarımız yüklenemez.";
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

/**
 * Panelden gelen video bilgisi (kimlik, eklenme ani ve hazirlanan dosyalar
 * disinda). upload: kendi videomuzda yeni yuklenen orijinalin depo anahtari
 * (yeni videoda zorunlu, duzenlemede dosya degisirse).
 */
export type VideoDraft = Pick<SiteVideo, "source" | "youtubeId" | "title" | "productId" | "cover" | "showOnHome" | "active"> & {
  upload?: string;
};

/**
 * Videoyu denetler ve temizler: YouTube linki kimlige cevrilir, baslik
 * kirpilir, bos baslik, urun ve kapak kaydedilmez. Kendi videomuzda
 * yuklenen orijinalin anahtari denetlenir; yeni videoda (isNew) zorunlu.
 * error null: istek bozuk (ekran boyle bir sey gondermez).
 */
export function parseVideo(value: unknown, isNew = true): Parsed<VideoDraft> {
  const bad = { ok: false as const, error: null };
  if (!isRecord(value) || (value.source !== "youtube" && value.source !== "file")) return bad;
  const title = typeof value.title === "string" || value.title === undefined ? (value.title ?? "").trim() : null;
  const productId = value.productId === undefined || value.productId === "" ? "" : typeof value.productId === "string" ? value.productId : null;
  const img = cover(value.cover);
  if (title === null || title.length > VIDEO_LIMITS.title || productId === null || img === null) return bad;
  if (typeof value.showOnHome !== "boolean" || typeof value.active !== "boolean") return bad;
  const common = {
    ...(title && { title }),
    ...(productId && { productId }),
    ...(img && { cover: img }),
    showOnHome: value.showOnHome,
    active: value.active,
  };
  if (value.source === "file") {
    const upload = value.upload === undefined || value.upload === "" ? "" : typeof value.upload === "string" ? value.upload : null;
    if (upload === null || (upload && !isVideoOriginalKey(upload))) return bad;
    if (isNew && !upload) return { ok: false, error: VIDEO_NO_FILE };
    return { ok: true, value: { source: "file", ...common, ...(upload && { upload }) } };
  }
  if (typeof value.youtubeId !== "string") return bad;
  const youtubeId = youtubeIdFrom(value.youtubeId);
  if (!youtubeId) return { ok: false, error: VIDEO_BAD_LINK };
  return {
    ok: true,
    value: { source: "youtube", youtubeId, ...common },
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

/** Videonun kapagi: panelde secilen kapak, yoksa kendi videomuzun kapak karesi (YouTube'da bos: YouTube'un kapagi). */
export const videoPoster = (video: Pick<SiteVideo, "cover" | "file">) => video.cover || video.file?.poster;

/**
 * Kendi videomuzun hazirlanmasi icin ffmpeg ayarlari (KARARLAR K-125).
 * Kalite korunur: H.264, 1080p'de CRF 20, 720p'de CRF 23 (gozle fark
 * edilmeyen sikistirma), en fazla 8 / 4 Mbit/sn; ses AAC 160 / 128 kbit/sn;
 * kucuk video buyutulmez; "faststart" ile video indirilirken baslar.
 * long: uzun kenar (piksel).
 */
export const VIDEO_PRESETS = {
  hd: { long: 1920, crf: 20, maxrate: "8M", bufsize: "16M", audio: "160k" },
  sd: { long: 1280, crf: 23, maxrate: "4M", bufsize: "8M", audio: "128k" },
} as const;

/**
 * Bir surum icin ffmpeg argumanlari. hdr: kaynak HDR ise (iPhone HLG / PQ)
 * renkler web'in SDR'sine donusturulur (yoksa soluk gorunur).
 */
export function videoEncodeArgs(input: string, output: string, preset: keyof typeof VIDEO_PRESETS, hdr: boolean): string[] {
  const p = VIDEO_PRESETS[preset];
  const scale = `scale=w='min(${p.long},iw)':h='min(${p.long},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
  const tonemap = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,";
  return [
    "-y",
    "-i", input,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    "-vf", `${hdr ? tonemap : ""}${scale},format=yuv420p`,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", String(p.crf),
    "-maxrate", p.maxrate,
    "-bufsize", p.bufsize,
    "-profile:v", "high",
    "-c:a", "aac",
    "-b:a", p.audio,
    "-ac", "2",
    "-movflags", "+faststart",
    output,
  ];
}

/* ------------------------------ Kategorilere gore gruplama ------------------------------ */

const SECTION_ORDER: TopLevelSection[] = ["ekipmanlar", "guvenlik", "aksesuarlar", "dolgu-metalleri"];

/** Urunu olmayan (ya da urunu yayinda olmayan) videolarin grubu: en sonda. */
export const VIDEO_GENERAL_GROUP = { key: "genel", label: "Genel", name: "Genel" } as const;

export type VideoGroup = {
  /** Kategorinin linki (slug) ya da "genel" */
  key: string;
  /** Sekmedeki kisa ad: kategorinin adi, sondaki "Kaynak Makineleri" / "Makineleri" olmadan */
  label: string;
  /** Kategorinin tam adi (Videolar sayfasindaki baslik) */
  name: string;
  /** Kategori sayfasinin adresi; Genel'de yok */
  category?: Category;
  items: { video: SiteVideo; product?: Product }[];
};

/** Sekmedeki kisa ad: "MIG (GMAW) Gazaltı Kaynak Makineleri" -> "MIG (GMAW) Gazaltı". */
export const videoTabLabel = (name: string) => name.replace(/\s+(Kaynak\s+)?Makineleri$/u, "") || name;

/**
 * Videolari urunlerinin kategorisine gore gruplar (KARARLAR K-125):
 * kategoriler menudeki sirayla (bolum, grup, kategori), videolar paneldeki
 * sirayla; urunu olmayan videolar en sonda "Genel". Yalnizca videosu olan
 * gruplar doner. items: homeVideos ya da sitedeki videolar.
 */
export function groupVideosByCategory(
  items: { video: SiteVideo; product?: Product }[],
  categories: Category[],
  groups: CategoryGroup[],
): VideoGroup[] {
  const rank = (c: Category) => {
    const g = groups.find((x) => x.slug === c.group && x.section === c.section);
    return [SECTION_ORDER.indexOf(c.section), g?.order ?? 999, c.order];
  };
  const result = new Map<string, VideoGroup>();
  for (const item of items) {
    const category = item.product && categories.find((c) => c.slug === item.product!.categorySlug && c.section === item.product!.section);
    const key = category ? `${category.section}/${category.slug}` : VIDEO_GENERAL_GROUP.key;
    if (!result.has(key)) {
      result.set(
        key,
        category
          ? { key, label: videoTabLabel(category.name), name: category.name, category, items: [] }
          : { ...VIDEO_GENERAL_GROUP, items: [] },
      );
    }
    result.get(key)!.items.push(item);
  }
  return [...result.values()].sort((a, b) => {
    if (!a.category) return 1;
    if (!b.category) return -1;
    const [x, y] = [rank(a.category), rank(b.category)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
}

/** Sitede gorunen butun videolar (Videolar sayfasi): yayinda ve oynatilabilir olanlar, paneldeki sirayla. */
export function siteVideos(videos: SiteVideo[], products: Product[]): { video: SiteVideo; product?: Product }[] {
  return videos
    .filter((v) => v.active && videoPlayable(v))
    .map((video) => ({ video, product: products.find((p) => p.active && p.id === video.productId) }));
}

/** Urun sayfasindaki videolar: o urune bagli, yayinda ve oynatilabilir olanlar. */
export const productVideos = (videos: SiteVideo[], productId: string) =>
  videos.filter((v) => v.active && v.productId === productId && videoPlayable(v));

/**
 * Google'a giden video aciklamasi (KARARLAR K-123, K-125). Ornekler:
 * "ForceMIG 200 ile 3 mm sacda gazaltı kaynağı. ForceMIG 200 Çok Fonksiyonlu
 * Kaynak Makinesi — Zenweld." / basliksiz: "ForceMIG 200 … videosu —
 * Zenweld." / urunsuz: "<baslik> — Zenweld." ya da "Zenweld kaynak videosu."
 */
export function videoDescription(video: Pick<SiteVideo, "title">, product?: Pick<Product, "name">): string {
  if (product) return video.title ? `${video.title}. ${product.name} — Zenweld.` : `${product.name} videosu — Zenweld.`;
  return video.title ? `${video.title} — Zenweld.` : "Zenweld kaynak videosu.";
}
