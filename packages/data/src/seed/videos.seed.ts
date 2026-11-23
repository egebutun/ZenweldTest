import type { SiteVideo } from "../types";

/**
 * VIDEO KUTUPHANESI ORNEK VERISI (KARARLAR K-125)
 *
 * Sahibinin gonderdigi YouTube Shorts videolari; anasayfada gorunur.
 * Altlarindaki urunler sahibinden gelecek (panel › Videolar).
 */
export const videos: SiteVideo[] = ["QtZ7JdNzFVo", "9CAoUSHs0R4", "CXx3PC0C4pE", "uf_ZDJGcqdQ", "YQuCaRN85n8"].map((youtubeId, i) => ({
  id: `video-${i + 1}`,
  source: "youtube",
  youtubeId,
  showOnHome: true,
  active: true,
  createdAt: "2026-11-20T09:00:00.000Z",
}));
