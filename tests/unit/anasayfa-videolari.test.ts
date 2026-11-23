import { describe, expect, it } from "vitest";
import {
  createSeedDatabase,
  defaultSettings,
  homeVideos,
  parseHomeVideoSettings,
  parseVideo,
  VIDEO_BAD_LINK,
  VIDEO_LIMITS,
  VIDEO_NO_SECTION_TITLE,
  videoCoverFits,
  videoHasUploadedFile,
  videoPlayable,
  videoTaken,
  videoTitle,
  youtubeCovers,
  youtubeEmbed,
  youtubeIdFrom,
  type SiteVideo,
} from "@zenweld/data";

/*
 * VIDEO KUTUPHANESI (KARARLAR K-125; docs/IS-KURALLARI.md › 27)
 * Kurallar: packages/data/src/video-rules.ts.
 */

const seed = createSeedDatabase(Date.now());
const form = (patch: Record<string, unknown> = {}) => ({
  source: "youtube",
  youtubeId: "https://www.youtube.com/shorts/QtZ7JdNzFVo",
  title: "",
  productId: "",
  cover: "",
  showOnHome: true,
  active: true,
  ...patch,
});

describe("YouTube linki", () => {
  it("Shorts, izleme, kısa link, gömme adresi ve yalnızca kimlik okunur", () => {
    for (const link of [
      "https://www.youtube.com/shorts/QtZ7JdNzFVo",
      "youtube.com/shorts/QtZ7JdNzFVo?feature=share",
      "https://m.youtube.com/watch?v=QtZ7JdNzFVo&t=3",
      "https://youtu.be/QtZ7JdNzFVo",
      "https://www.youtube-nocookie.com/embed/QtZ7JdNzFVo",
      " QtZ7JdNzFVo ",
    ]) {
      expect(youtubeIdFrom(link)).toBe("QtZ7JdNzFVo");
    }
  });

  it("başka site ya da bozuk link okunmaz", () => {
    for (const link of ["https://vimeo.com/123", "https://www.youtube.com/@zenweld", "https://youtu.be/kisa", "", "lorem ipsum"]) {
      expect(youtubeIdFrom(link)).toBeNull();
    }
  });

  it("kapak: önce Shorts'un dik kapağı, sonra yüksek çözünürlük, en son her videoda bulunan; YouTube'un 'yok' resmi atlanır", () => {
    expect(youtubeCovers("QtZ7JdNzFVo").map((u) => u.split("/").pop())).toEqual(["oar2.jpg", "maxresdefault.jpg", "hqdefault.jpg"]);
    const [oar, maxres, hq] = youtubeCovers("QtZ7JdNzFVo");
    expect(videoCoverFits(oar, 1080, 1920)).toBe(true);
    expect(videoCoverFits(oar, 1280, 720)).toBe(false); // dik degil
    expect(videoCoverFits(maxres, 120, 90)).toBe(false); // YouTube'un "yok" resmi
    expect(videoCoverFits(maxres, 1280, 720)).toBe(true);
    expect(videoCoverFits(hq, 480, 360)).toBe(true);
  });

  it("oynatıcı çerezsiz YouTube adresinden, kendiliğinden oynar", () => {
    expect(youtubeEmbed("QtZ7JdNzFVo")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/QtZ7JdNzFVo\?autoplay=1/);
  });
});

describe("panelde kaydetme", () => {
  it("örnek veride bölüm başlığı ve sahibinin 5 videosu var: YouTube, ürünsüz, anasayfada", () => {
    expect(defaultSettings.homeVideos).toEqual({ title: "Gerçek İşler, Gerçek Kaynak" });
    expect(seed.videos.map((v) => v.youtubeId)).toEqual(["QtZ7JdNzFVo", "9CAoUSHs0R4", "CXx3PC0C4pE", "uf_ZDJGcqdQ", "YQuCaRN85n8"]);
    expect(seed.videos.every((v) => v.source === "youtube" && v.active && v.showOnHome && !v.productId)).toBe(true);
  });

  it("link kimliğe çevrilir; boş başlık, ürün ve kapak kaydedilmez; başlık kırpılır", () => {
    expect(parseVideo(form())).toEqual({ ok: true, value: { source: "youtube", youtubeId: "QtZ7JdNzFVo", showOnHome: true, active: true } });
    const parsed = parseVideo(form({ title: "  Sahada ForceMIG ", productId: "p1", cover: "/kapak.webp", showOnHome: false }));
    expect(parsed.ok && parsed.value).toMatchObject({ title: "Sahada ForceMIG", productId: "p1", cover: "/kapak.webp", showOnHome: false });
  });

  it("bozuk link hata verir; bozuk istek reddedilir; kendi videomuz bugün eklenmez (1b)", () => {
    expect(parseVideo(form({ youtubeId: "https://vimeo.com/1" }))).toEqual({ ok: false, error: VIDEO_BAD_LINK });
    expect(parseVideo(form({ title: "x".repeat(VIDEO_LIMITS.title + 1) }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ cover: "javascript:1" }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ active: "evet" }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ source: "file" }))).toEqual({ ok: false, error: null });
  });

  it("aynı YouTube videosu iki kez eklenmez (kaydın kendisi hariç)", () => {
    expect(videoTaken(seed.videos, "QtZ7JdNzFVo")).toBe(true);
    expect(videoTaken(seed.videos, "QtZ7JdNzFVo", "video-1")).toBe(false);
    expect(videoTaken(seed.videos, "abcdefghijk")).toBe(false);
  });

  it("bölüm başlığı zorunlu, en fazla 60 karakter, kırpılır", () => {
    expect(parseHomeVideoSettings({ title: "  Sahada Zenweld " })).toEqual({ ok: true, value: { title: "Sahada Zenweld" } });
    expect(parseHomeVideoSettings({ title: " " })).toEqual({ ok: false, error: VIDEO_NO_SECTION_TITLE });
    expect(parseHomeVideoSettings({ title: "x".repeat(VIDEO_LIMITS.sectionTitle + 1) })).toEqual({ ok: false, error: null });
  });

  it("yüklenen kapak (data:) fark edilir; başlık yoksa ürünün adı", () => {
    expect(videoHasUploadedFile({ cover: "data:image/webp;base64,AAAA" })).toBe(true);
    expect(videoHasUploadedFile({ cover: "/kapak.webp" })).toBe(false);
    expect(videoTitle({ title: "Sahada" }, { name: "ForceMIG 200" })).toBe("Sahada");
    expect(videoTitle({}, { name: "ForceMIG 200" })).toBe("ForceMIG 200");
    expect(videoTitle({})).toBe("Zenweld videosu");
  });
});

describe("sitede görünen videolar", () => {
  it("anasayfa: yayında ve 'Anasayfada göster' işaretli olanlar, sırayla; ürün yayında değilse video ürünsüz", () => {
    const db = createSeedDatabase(Date.now());
    const [on, off] = [db.products[0], { ...db.products[1], active: false }];
    const list: SiteVideo[] = structuredClone(db.videos);
    list[0].productId = on.id;
    list[1].productId = off.id;
    list[2].active = false;
    list[3].showOnHome = false;
    const visible = homeVideos(list, [on, off]);
    expect(visible.map((v) => v.video.id)).toEqual(["video-1", "video-2", "video-5"]);
    expect(visible.map((v) => v.product?.id)).toEqual([on.id, undefined, undefined]);
  });

  it("kendi videomuz yalnızca hazırlanması bitince oynatılır", () => {
    const base = { id: "v", showOnHome: true, active: true, createdAt: "2026-11-23T00:00:00.000Z" };
    expect(videoPlayable({ ...base, source: "youtube", youtubeId: "QtZ7JdNzFVo" })).toBe(true);
    expect(videoPlayable({ ...base, source: "file", file: { status: "processing" } })).toBe(false);
    expect(videoPlayable({ ...base, source: "file", file: { status: "ready", hd: "/dosya/video/a.mp4" } })).toBe(true);
  });
});
