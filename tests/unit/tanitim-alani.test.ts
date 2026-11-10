import { describe, expect, it } from "vitest";
import {
  HERO_NONE_ACTIVE,
  HERO_NO_SLIDE,
  defaultSettings,
  parseHomeHero,
  visibleHeroSlides,
  type HomeHeroSettings,
} from "@zenweld/data";

/* docs/IS-KURALLARI.md › Anasayfa tanıtım alanı, KARARLAR K-45 (packages/data/src/hero-rules.ts) */

const hero = (): HomeHeroSettings => structuredClone(defaultSettings.homeHero);

describe("Tanıtım alanının denetimi", () => {
  it("varsayılan üç sayfa geçerli; metinler kırpılır, boş madde ve etiketler atlanır, boş 2. düğme ve tarihler yazılmaz", () => {
    expect(parseHomeHero(hero())).toEqual({ ok: true, value: hero() });

    const h = hero();
    h.slides[1] = {
      ...h.slides[1],
      title: "  Yeni başlık  ",
      points: ["  Hızlı servis ", "", "  "],
      chips: ["", "MIG"],
      secondary: { label: "", href: "" },
      startsOn: undefined,
      bigWord: "force",
    };
    const parsed = parseHomeHero(h);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const slide = parsed.value.slides[1];
    expect(slide).toMatchObject({ title: "Yeni başlık", points: ["Hızlı servis"], chips: ["MIG"], bigWord: "FORCE" });
    expect(slide).not.toHaveProperty("secondary");
    expect(slide).not.toHaveProperty("startsOn");
  });

  it("zorunlu alanlar sayfa numarası ve adıyla söylenir", () => {
    const missing = (patch: Partial<HomeHeroSettings["slides"][number]>) => {
      const h = hero();
      h.slides[2] = { ...h.slides[2], ...patch };
      return parseHomeHero(h);
    };
    expect(missing({ title: " " })).toEqual({ ok: false, error: "3. sayfa (Jasic Lazer): başlık yazılmalı." });
    expect(missing({ tab: "" })).toEqual({ ok: false, error: "3. sayfa (adsız): sekme adı yazılmalı." });
    expect(missing({ image: "" })).toEqual({ ok: false, error: "3. sayfa (Jasic Lazer): görsel seçilmeli." });
    expect(missing({ primary: { label: "İncele", href: "" } })).toEqual({
      ok: false,
      error: "3. sayfa (Jasic Lazer): 1. düğmenin yazısı ve bağlantısı yazılmalı.",
    });
    expect(missing({ secondary: { label: "Teklif Al", href: "" } })).toMatchObject({ ok: false, error: expect.stringContaining("birlikte") });
    expect(missing({ primary: { label: "İncele", href: "javascript:alert(1)" } })).toMatchObject({
      ok: false,
      error: expect.stringContaining("/ ile (site içi) ya da https:// ile başlamalı"),
    });
    expect(missing({ startsOn: "2026-12-10", endsOn: "2026-12-01" })).toEqual({
      ok: false,
      error: "3. sayfa (Jasic Lazer): bitiş tarihi başlangıçtan önce olamaz.",
    });
  });

  it("en az bir sayfa ve en az bir yayında sayfa; sınır dışı değerler ve bozuk istek reddedilir", () => {
    expect(parseHomeHero({ ...hero(), slides: [] })).toEqual({ ok: false, error: HERO_NO_SLIDE });
    const off = hero();
    off.slides.forEach((s) => (s.active = false));
    expect(parseHomeHero(off)).toEqual({ ok: false, error: HERO_NONE_ACTIVE });
    const six = hero();
    six.slides = [...six.slides, ...hero().slides.map((s) => ({ ...s, id: `${s.id}-2` }))];
    expect(parseHomeHero(six)).toMatchObject({ ok: false, error: "En fazla 5 sayfa eklenebilir." });

    expect(parseHomeHero({ ...hero(), intervalSeconds: 3 })).toEqual({ ok: false, error: null });
    const long = hero();
    long.slides[0].title = "x".repeat(71);
    expect(parseHomeHero(long)).toEqual({ ok: false, error: null });
    const chips = hero();
    chips.slides[2].chips = ["a", "b", "c", "d", "e"];
    expect(parseHomeHero(chips)).toEqual({ ok: false, error: null });
    const dup = hero();
    dup.slides[1].id = dup.slides[0].id;
    expect(parseHomeHero(dup)).toEqual({ ok: false, error: null });
    expect(parseHomeHero("tanıtım")).toEqual({ ok: false, error: null });
  });
});

describe("Sitede görünen sayfalar", () => {
  it("kapalı sayfa görünmez; yayın tarihi Türkiye günüdür (başlangıç 00:00, bitiş 23:59)", () => {
    const h = hero();
    h.slides[1].active = false;
    h.slides[2] = { ...h.slides[2], startsOn: "2026-12-01", endsOn: "2026-12-07" };
    const ids = (at: string) => visibleHeroSlides(h, new Date(at)).map((s) => s.id);

    expect(ids("2026-11-30T23:59:00+03:00")).toEqual(["zenweld"]);
    expect(ids("2026-12-01T00:00:00+03:00")).toEqual(["zenweld", "jasic-lazer"]);
    expect(ids("2026-12-07T23:59:00+03:00")).toEqual(["zenweld", "jasic-lazer"]);
    // UTC'de hala 7 Aralik, Turkiye'de 8 Aralik: gorunmez.
    expect(ids("2026-12-07T21:00:01Z")).toEqual(["zenweld"]);
  });
});
