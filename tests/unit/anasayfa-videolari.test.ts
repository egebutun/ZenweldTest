import { describe, expect, it } from "vitest";
import {
  byteRange,
  checkUpload,
  createSeedDatabase,
  detectFileType,
  isUploadKey,
  isVideoOriginalKey,
  uploadKey,
  uploadSizeError,
  uploadTypeError,
  videoEncodeArgs,
  videoFileKey,
  videoPoster,
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
  videoDescription,
  videoTabLabel,
  groupVideosByCategory,
  siteVideos,
  productVideos,
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

  it("bozuk link hata verir; bozuk istek reddedilir", () => {
    expect(parseVideo(form({ youtubeId: "https://vimeo.com/1" }))).toEqual({ ok: false, error: VIDEO_BAD_LINK });
    expect(parseVideo(form({ title: "x".repeat(VIDEO_LIMITS.title + 1) }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ cover: "javascript:1" }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ active: "evet" }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ source: "vimeo" }))).toEqual({ ok: false, error: null });
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

describe("kendi videolarımız (K-125)", () => {
  const upload = "video/2026/11/0123456789abcdef/orijinal.mov";

  it("yeni videoda yüklenen orijinal zorunlu; düzenlemede isteğe bağlı; anahtar denetlenir", () => {
    expect(parseVideo(form({ source: "file" }))).toEqual({ ok: false, error: "Video dosyası seçilmeli." });
    expect(parseVideo(form({ source: "file", upload }))).toEqual({ ok: true, value: { source: "file", upload, showOnHome: true, active: true } });
    expect(parseVideo(form({ source: "file" }), false)).toEqual({ ok: true, value: { source: "file", showOnHome: true, active: true } });
    expect(parseVideo(form({ source: "file", upload: "video/2026/11/0123456789abcdef/1080.mp4" }))).toEqual({ ok: false, error: null });
    expect(parseVideo(form({ source: "file", upload: "../../etc/passwd" }))).toEqual({ ok: false, error: null });
  });

  it("ffmpeg ayarları: 1080p ve 720p, küçük video büyütülmez, hızlı başlama; HDR renkleri dönüştürülür", () => {
    const hd = videoEncodeArgs("in.mov", "1080.mp4", "hd", false).join(" ");
    expect(hd).toContain("scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease");
    expect(hd).toContain("-c:v libx264");
    expect(hd).toContain("-crf 20");
    expect(hd).toContain("-movflags +faststart");
    expect(hd).not.toContain("tonemap");
    const sd = videoEncodeArgs("in.mov", "720.mp4", "sd", true).join(" ");
    expect(sd).toContain("min(1280,iw)");
    expect(sd).toContain("-crf 23");
    expect(sd).toContain("tonemap=hable");
  });

  it("kapak: panelde seçilen, yoksa videonun kapak karesi", () => {
    expect(videoPoster({ cover: "/kapak.webp", file: { status: "ready", poster: "/dosya/video/x/kapak.webp" } })).toBe("/kapak.webp");
    expect(videoPoster({ file: { status: "ready", poster: "/dosya/video/x/kapak.webp" } })).toBe("/dosya/video/x/kapak.webp");
    expect(videoPoster({})).toBeUndefined();
  });
});

describe("video dosyaları: tür, anahtar, parça parça sunma", () => {
  const bytes = (...parts: (number[] | string)[]) =>
    new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

  it("içeriğe bakarak: MP4, iPhone MOV, M4V, WebM, MKV", () => {
    expect(detectFileType(bytes([0, 0, 0, 0x20], "ftypisom"), "a.mp4")).toBe("mp4");
    expect(detectFileType(bytes([0, 0, 0, 0x14], "ftypqt  "), "IMG_1234.MOV")).toBe("mov");
    expect(detectFileType(bytes([0, 0, 0, 0x14], "ftypM4V "), "a.m4v")).toBe("m4v");
    expect(detectFileType(bytes([0x1a, 0x45, 0xdf, 0xa3]), "a.webm")).toBe("webm");
    expect(detectFileType(bytes([0x1a, 0x45, 0xdf, 0xa3]), "a.mkv")).toBe("mkv");
    expect(checkUpload("video", "a.mp4", bytes("%PDF-1.4"))).toEqual({ ok: false, error: uploadTypeError("video") });
  });

  it("anahtarlar: orijinal ve hazırlanan dosyalar aynı klasörde; orijinal tanınır", () => {
    const key = uploadKey("video", new Date("2026-11-23T10:00:00Z"), "0123456789abcdef", "IMG_1.MOV", "mov");
    expect(key).toBe("video/2026/11/0123456789abcdef/orijinal.mov");
    expect(isVideoOriginalKey(key)).toBe(true);
    expect(videoFileKey(key, "1080.mp4")).toBe("video/2026/11/0123456789abcdef/1080.mp4");
    expect(isUploadKey(videoFileKey(key, "kapak.webp"))).toBe(true);
    expect(isVideoOriginalKey(videoFileKey(key, "720.mp4"))).toBe(false);
    expect(uploadSizeError("video")).toBe("Dosya çok büyük; en fazla 1 GB.");
  });

  it("Range: baştan, ortadan, sondan; dosyanın dışı 416", () => {
    expect(byteRange(null, 1000)).toBeNull();
    expect(byteRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(byteRange("bytes=900-", 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange("bytes=0-5000", 1000)).toEqual({ start: 0, end: 999 });
    expect(byteRange("bytes=1000-", 1000)).toBe("invalid");
    expect(byteRange("bytes=abc", 1000)).toBe("invalid");
  });
});

describe("kategoriye göre gruplama, ürün sayfası, Google açıklaması (1c)", () => {
  const db = createSeedDatabase(Date.now());
  const bySlug = (slug: string) => db.products.find((p) => p.slug === slug)!;

  it("sekmeler menüdeki sırayla, 'Tümü' yok; ürünsüz videolar en sonda 'Genel'; kısa adlar", () => {
    const list: SiteVideo[] = structuredClone(db.videos);
    list[0].productId = bySlug("forcecut-45").id; // Plazma
    list[1].productId = bySlug("forcetig-200").id; // TIG
    list[2].productId = bySlug("forcearc-200-mma").id; // MMA
    const groups = groupVideosByCategory(siteVideos(list, db.products), db.categories, db.categoryGroups);
    expect(groups.map((g) => g.label)).toEqual(["MMA (Stick) Örtülü Elektrot", "TIG (GTAW) Argon", "Plazma Kesim", "Genel"]);
    expect(groups.at(-1)!.items.map((i) => i.video.id)).toEqual(["video-4", "video-5"]);
    expect(groups[0].category?.slug).toBe(bySlug("forcearc-200-mma").categorySlug);
    expect(videoTabLabel("Lazer Kaynak Makineleri")).toBe("Lazer");
    expect(videoTabLabel("Lazer Temizleme")).toBe("Lazer Temizleme");
  });

  it("ürün sayfası: yalnızca o ürüne bağlı, yayında ve oynatılabilir videolar", () => {
    const list: SiteVideo[] = structuredClone(db.videos);
    const id = bySlug("forcemig-200").id;
    list[0].productId = id;
    list[1].productId = id;
    list[1].active = false;
    list[2].productId = id;
    list[2].source = "file";
    list[2].file = { status: "processing" };
    expect(productVideos(list, id).map((v) => v.id)).toEqual(["video-1"]);
  });

  it("Google açıklaması: başlık ve ürün; başlıksız ve ürünsüzde tekrar yok", () => {
    expect(videoDescription({ title: "ForceMIG 200 ile 3 mm sacda gazaltı kaynağı" }, { name: "ForceMIG 200" })).toBe(
      "ForceMIG 200 ile 3 mm sacda gazaltı kaynağı. ForceMIG 200 — Zenweld.",
    );
    expect(videoDescription({}, { name: "ForceMIG 200" })).toBe("ForceMIG 200 videosu — Zenweld.");
    expect(videoDescription({ title: "Fabrikamız" })).toBe("Fabrikamız — Zenweld.");
    expect(videoDescription({})).toBe("Zenweld kaynak videosu.");
  });
});
