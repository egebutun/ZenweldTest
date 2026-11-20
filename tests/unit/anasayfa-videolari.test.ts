import { describe, expect, it } from "vitest";
import {
  createSeedDatabase,
  defaultSettings,
  homeVideosKey,
  parseHomeVideos,
  VIDEO_BAD_LINK,
  VIDEO_LIMITS,
  VIDEO_NO_TITLE,
  VIDEO_TOO_MANY,
  VIDEO_TWICE,
  videoCoverFits,
  youtubeCovers,
  videosHaveUploadedFile,
  visibleHomeVideos,
  youtubeEmbed,
  youtubeIdFrom,
  type HomeVideoSettings,
} from "@zenweld/data";

/*
 * ANASAYFA VIDEOLARI (KARARLAR K-125; docs/IS-KURALLARI.md › Anasayfa videolari)
 * Kurallar: packages/data/src/video-rules.ts.
 */

const settings = (): HomeVideoSettings => structuredClone(defaultSettings.homeVideos);

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
  it("örnek veride başlık ve sahibinin 5 videosu var, ürünsüz", () => {
    const s = settings();
    expect(s.title).toBe("Gerçek İşler, Gerçek Kaynak");
    expect(s.videos.map((v) => v.youtubeId)).toEqual(["QtZ7JdNzFVo", "9CAoUSHs0R4", "CXx3PC0C4pE", "uf_ZDJGcqdQ", "YQuCaRN85n8"]);
    expect(s.videos.every((v) => v.active && !v.productId)).toBe(true);
    expect(parseHomeVideos(s)).toEqual({ ok: true, value: s });
  });

  it("link kimliğe çevrilir; boş ürün ve kapak kaydedilmez; başlık kırpılır", () => {
    const s = settings();
    s.title = "  Sahada Zenweld ";
    s.videos[0] = { ...s.videos[0], youtubeId: "https://www.youtube.com/shorts/QtZ7JdNzFVo", productId: "", cover: "" };
    const parsed = parseHomeVideos(s);
    expect(parsed.ok && parsed.value.title).toBe("Sahada Zenweld");
    expect(parsed.ok && parsed.value.videos[0]).toEqual({ id: "video-1", youtubeId: "QtZ7JdNzFVo", active: true });
  });

  it("hata mesajları: başlık, link, aynı video, en fazla 12", () => {
    const s = settings();
    expect(parseHomeVideos({ ...s, title: " " })).toEqual({ ok: false, error: VIDEO_NO_TITLE });
    const badLink = settings();
    badLink.videos[2].youtubeId = "https://vimeo.com/1";
    expect(parseHomeVideos(badLink)).toEqual({ ok: false, error: `3. video: ${VIDEO_BAD_LINK}` });
    const twice = settings();
    twice.videos[1].youtubeId = "https://youtu.be/QtZ7JdNzFVo";
    expect(parseHomeVideos(twice)).toEqual({ ok: false, error: VIDEO_TWICE });
    const many = { ...s, videos: Array.from({ length: VIDEO_LIMITS.maxVideos + 1 }, (_, i) => ({ id: `v${i}`, youtubeId: `abcdefghij${i % 10}`, active: true })) };
    expect(parseHomeVideos(many)).toEqual({ ok: false, error: VIDEO_TOO_MANY });
  });

  it("video listesi boş olabilir (bölüm görünmez); bozuk istek reddedilir", () => {
    expect(parseHomeVideos({ title: "Videolar", videos: [] })).toEqual({ ok: true, value: { title: "Videolar", videos: [] } });
    expect(parseHomeVideos({ title: "x".repeat(VIDEO_LIMITS.title + 1), videos: [] })).toEqual({ ok: false, error: null });
    expect(parseHomeVideos({ title: "Videolar", videos: [{ id: "a", youtubeId: "QtZ7JdNzFVo" }] })).toEqual({ ok: false, error: null });
    expect(parseHomeVideos({ title: "Videolar", videos: [{ id: "a", youtubeId: "QtZ7JdNzFVo", active: true, cover: "javascript:1" }] })).toEqual({
      ok: false,
      error: null,
    });
  });

  it("yüklenen kapak (data:) fark edilir; karşılaştırma anahtarı son değişiklik anını saymaz", () => {
    const s = settings();
    expect(videosHaveUploadedFile(s)).toBe(false);
    s.videos[0].cover = "data:image/webp;base64,AAAA";
    expect(videosHaveUploadedFile(s)).toBe(true);
    expect(homeVideosKey({ ...s, updatedAt: "2026-11-20T00:00:00.000Z" })).toBe(homeVideosKey(s));
  });
});

describe("sitede görünen videolar", () => {
  it("yayındakiler paneldeki sırayla; ürün yayında değilse video ürünsüz görünür", () => {
    const db = createSeedDatabase(Date.now());
    const [on, off] = [db.products[0], { ...db.products[1], active: false }];
    const s = settings();
    s.videos[0].productId = on.id;
    s.videos[1].productId = off.id;
    s.videos[2].active = false;
    s.videos[3].productId = "silinmis-urun";
    const visible = visibleHomeVideos(s, [on, off]);
    expect(visible.map((v) => v.video.id)).toEqual(["video-1", "video-2", "video-4", "video-5"]);
    expect(visible.map((v) => v.product?.id)).toEqual([on.id, undefined, undefined, undefined]);
  });
});
