import { isUploadedFile } from "./catalog-rules";
import type { Parsed } from "./settings-rules";
import type { HeroButton, HeroLook, HeroSlide, HomeHeroSettings } from "./types";

/**
 * ANASAYFA TANITIM ALANI KURALLARI — PANEL › Anasayfa Tanıtım (demo ve
 * veritabani modu ayni; KARARLAR K-45; docs/IS-KURALLARI.md › Anasayfa
 * tanitim alani)
 *
 * Tarayici (panel ekrani) ve sunucu (packages/db › admin-settings.ts) ayni
 * kurallari kullanir; sunucu tarayicidan geleni yeniden denetler.
 */

/** Hazir gorunumler, panelde gorunen sirayla. */
export const HERO_LOOKS = [
  { look: "photo", label: "Fotoğraf arka planlı", note: "Tam ekran fotoğraf, solda yazı" },
  { look: "product-dark", label: "Ürün · koyu atölye", note: "Koyu çelik zemin, sağda ürün" },
  { look: "product-blueprint", label: "Ürün · teknik çizim", note: "Çizim ızgarası ve lazer çizgisi, sağda ürün" },
] as const satisfies readonly { look: HeroLook; label: string; note: string }[];

/** Sinirlar: metinlerde en fazla karakter, listelerde en fazla kayit. */
export const HERO_LIMITS = {
  minSlides: 1,
  maxSlides: 5,
  intervalSeconds: [4, 12] as const,
  tab: 24,
  title: 70,
  text: 240,
  point: 40,
  points: 3,
  chip: 30,
  chips: 4,
  bigWord: 10,
  buttonLabel: 30,
  href: 300,
};

export const HERO_NO_SLIDE = "En az bir sayfa olmalı.";
export const HERO_TOO_MANY = `En fazla ${HERO_LIMITS.maxSlides} sayfa eklenebilir.`;
export const HERO_NONE_ACTIVE = "En az bir sayfa yayında olmalı.";

const LOOKS: readonly string[] = HERO_LOOKS.map((l) => l.look);
const bad = { ok: false as const, error: null };
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** Kirpilmis metin; tur yanlis ya da sinirdan uzunsa null. */
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim().length <= max ? v.trim() : null);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Site ici adres (/...) ya da https:// adres. */
export const isHeroLink = (href: string) => /^\/(?!\/)\S*$/.test(href) || /^https:\/\/\S+$/i.test(href);

/** Gecerli bir takvim gunu (YYYY-AA-GG). */
function isDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Metin listesi: kirpilir, bos satirlar atlanir; fazlasi ya da uzunu null. */
function list(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems * 2) return null;
  const items: string[] = [];
  for (const v of value) {
    const item = str(v, maxLength);
    if (item === null) return null;
    if (item) items.push(item);
  }
  return items.length > maxItems ? null : items;
}

function button(value: unknown): HeroButton | null {
  if (value === undefined || value === null) return { label: "", href: "" };
  if (!isRecord(value)) return null;
  const label = str(value.label, HERO_LIMITS.buttonLabel);
  const href = str(value.href, HERO_LIMITS.href);
  return label === null || href === null ? null : { label, href };
}

/** Gorsel: yuklenen dosya (data:image/...), site ici adres ya da https:// adres. */
function image(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("data:image/")) return value;
  const url = str(value, 2000);
  return url !== null && (!url || isHeroLink(url)) ? url : null;
}

function parseSlide(value: unknown, n: number): Parsed<HeroSlide> {
  if (!isRecord(value)) return bad;
  const id = typeof value.id === "string" && value.id.length > 0 && value.id.length <= 100 ? value.id : null;
  const tab = str(value.tab, HERO_LIMITS.tab);
  const title = str(value.title, HERO_LIMITS.title);
  const text = str(value.text ?? "", HERO_LIMITS.text);
  const points = list(value.points ?? [], HERO_LIMITS.points, HERO_LIMITS.point);
  const chips = list(value.chips ?? [], HERO_LIMITS.chips, HERO_LIMITS.chip);
  const look = typeof value.look === "string" && LOOKS.includes(value.look) ? (value.look as HeroLook) : null;
  const img = image(value.image);
  const bigWord = str(value.bigWord ?? "", HERO_LIMITS.bigWord);
  const primary = button(value.primary);
  const secondary = button(value.secondary);
  const startsOn = str(value.startsOn ?? "", 10);
  const endsOn = str(value.endsOn ?? "", 10);
  if (
    !id ||
    typeof value.active !== "boolean" ||
    tab === null ||
    title === null ||
    text === null ||
    !points ||
    !chips ||
    !look ||
    img === null ||
    bigWord === null ||
    !primary ||
    !secondary ||
    startsOn === null ||
    endsOn === null
  ) {
    return bad;
  }

  const problem = (message: string) => ({ ok: false as const, error: `${n}. sayfa (${tab || "adsız"}): ${message}` });
  if (!tab) return problem("sekme adı yazılmalı.");
  if (!title) return problem("başlık yazılmalı.");
  if (!img) return problem("görsel seçilmeli.");
  if (!primary.label || !primary.href) return problem("1. düğmenin yazısı ve bağlantısı yazılmalı.");
  if (!secondary.label !== !secondary.href) {
    return problem("2. düğmenin yazısı ve bağlantısı birlikte yazılmalı (ya da ikisi de boş kalmalı).");
  }
  for (const href of [primary.href, secondary.href].filter(Boolean)) {
    if (!isHeroLink(href)) return problem(`"${href}" bağlantısı / ile (site içi) ya da https:// ile başlamalı.`);
  }
  if ((startsOn && !isDay(startsOn)) || (endsOn && !isDay(endsOn))) return bad;
  if (startsOn && endsOn && endsOn < startsOn) return problem("bitiş tarihi başlangıçtan önce olamaz.");

  return {
    ok: true,
    value: {
      id,
      active: value.active,
      tab,
      title,
      text,
      points,
      chips,
      look,
      image: img,
      bigWord: look === "photo" ? "" : bigWord.toLocaleUpperCase("tr"),
      primary,
      ...(secondary.label && { secondary }),
      ...(startsOn && { startsOn }),
      ...(endsOn && { endsOn }),
    },
  };
}

/**
 * Tanitim alanini denetler ve temizler: metinler kirpilir, bos maddeler ve
 * etiketler atlanir, bos ikinci dugme ve bos tarihler kaydedilmez. Hata
 * varsa hangi sayfada oldugu yazilir. error null: istek bozuk (ekran boyle
 * bir sey gondermez).
 */
export function parseHomeHero(value: unknown): Parsed<HomeHeroSettings> {
  if (!isRecord(value) || !Array.isArray(value.slides)) return bad;
  const [minSeconds, maxSeconds] = HERO_LIMITS.intervalSeconds;
  const seconds = value.intervalSeconds;
  if (typeof seconds !== "number" || !Number.isInteger(seconds) || seconds < minSeconds || seconds > maxSeconds) return bad;
  if (value.slides.length < HERO_LIMITS.minSlides) return { ok: false, error: HERO_NO_SLIDE };
  if (value.slides.length > HERO_LIMITS.maxSlides) return { ok: false, error: HERO_TOO_MANY };

  const slides: HeroSlide[] = [];
  for (const [i, raw] of value.slides.entries()) {
    const parsed = parseSlide(raw, i + 1);
    if (!parsed.ok) return parsed;
    slides.push(parsed.value);
  }
  if (new Set(slides.map((s) => s.id)).size !== slides.length) return bad;
  if (!slides.some((s) => s.active)) return { ok: false, error: HERO_NONE_ACTIVE };
  return { ok: true, value: { intervalSeconds: seconds, slides } };
}

/** Sayfalarda yuklenen dosya (data:) var mi; veritabani modunda kaydedilmez (KARARLAR K-108). */
export const heroHasUploadedFile = (hero: HomeHeroSettings) => hero.slides.some((s) => isUploadedFile(s.image));

/** Karsilastirma anahtari; son degisiklik ani (updatedAt) haric. */
export const heroKey = (hero: HomeHeroSettings) => JSON.stringify([hero.intervalSeconds, hero.slides]);

/** Turkiye gununun basi ve sonu (UTC+3; yaz saati yok). */
const dayStart = (day: string) => new Date(`${day}T00:00:00.000+03:00`);
const dayEnd = (day: string) => new Date(`${day}T23:59:59.999+03:00`);

/**
 * Sitede gorunen sayfalar: yayinda olan ve yayin tarihi (varsa) icinde
 * olanlar, paneldeki sirayla. Tarihler Turkiye gunudur: baslangic gunu
 * 00:00'dan bitis gunu 23:59'a kadar.
 */
export function visibleHeroSlides(hero: HomeHeroSettings, now: Date): HeroSlide[] {
  return hero.slides.filter(
    (s) => s.active && (!s.startsOn || now >= dayStart(s.startsOn)) && (!s.endsOn || now <= dayEnd(s.endsOn)),
  );
}
