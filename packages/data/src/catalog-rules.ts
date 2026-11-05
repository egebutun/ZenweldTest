import type { CategoryFilter, OptionDefinition } from "./types";

/**
 * KATALOG KAYIT KURALLARI — PANEL (demo ve veritabani modu ayni)
 *
 * Seçenek Tanımları ve kategori formunun dogrulamasi. Tarayici (panel
 * ekranlari) ve sunucu (packages/db › admin-catalog.ts) ayni kurallari
 * kullanir; sunucu tarayicidan geleni yeniden denetler.
 */

/** Deger ve filtre kimligi: ilk addan uretilir (slugify), sonra degismez. */
export const CATALOG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const key = (text: string) => text.trim().toLocaleLowerCase("tr");

/** Secenek tanimi: ad zorunlu ve tekil, en az bir deger, degerler bos ve tekrarsiz. Sorun yoksa null. */
export function optionDefinitionError(draft: OptionDefinition, all: OptionDefinition[]): string | null {
  const name = draft.name.trim();
  if (!name) return "Seçenek adı zorunludur.";
  if (all.some((o) => o.id !== draft.id && key(o.name) === key(name))) {
    return `"${name}" adında bir seçenek zaten var.`;
  }
  if (draft.values.length === 0) return "En az bir değer ekleyin.";
  const labels = new Set<string>();
  for (const v of draft.values) {
    const label = v.label.trim();
    if (!label) return "Boş değer var.";
    if (labels.has(key(label))) return `"${label}" iki kez yazılmış.`;
    labels.add(key(label));
  }
  return null;
}

/** Kategori filtreleri: ad bos ve tekrarli olamaz; degerler bos ve tekrarli olamaz. Sorun yoksa null. */
export function categoryFiltersError(filters: CategoryFilter[]): string | null {
  const names = new Set<string>();
  for (const f of filters) {
    const name = f.name.trim();
    if (!name) return "Adı boş bir filtre var.";
    if (names.has(key(name))) return `"${name}" filtresi iki kez yazılmış.`;
    names.add(key(name));
    const labels = new Set<string>();
    for (const v of f.values) {
      const label = v.label.trim();
      if (!label) return `"${name}" filtresinde boş değer var.`;
      if (labels.has(key(label))) return `"${name}" filtresinde "${label}" iki kez yazılmış.`;
      labels.add(key(label));
    }
  }
  return null;
}

/** Kullanilan degerin silinmek istendigindeki uyari (Seçenek Tanımları). */
export const optionValueInUseText = (label: string, count: number) =>
  `"${label}" ${count} üründe kullanılıyor; önce ürünün Seçenekler sekmesinden kaldırın.`;

/** Urunde kullanilan tanimin silinmek istendigindeki uyari. */
export const optionInUseText = (name: string, count: number) =>
  `"${name}" ${count} üründe kullanılıyor; önce ürünlerin Seçenekler sekmesinden kaldırın.`;

/** Kategori linki tekil olmali (urunler kategoriye linkle de eslesir). */
export const categorySlugTakenText = (slug: string, name: string) => `"${slug}" linki "${name}" kategorisinde kullanılıyor.`;

/** Grup linki yalnizca kendi bolumunde tekil olmali. */
export const groupSlugTakenText = (slug: string, name: string) => `"${slug}" linki bu bölümde "${name}" grubunda kullanılıyor.`;

export const CATEGORY_HAS_PRODUCTS = "Ürünü olan kategori silinemez; önce ürünleri başka kategoriye taşıyın.";
export const GROUP_HAS_CATEGORIES = "İçinde kategori olan grup silinemez; önce kategorileri taşıyın.";

/** Panelde yuklenen dosya (tarayicida kucultulmus gorsel, data: adresi). */
export const isUploadedFile = (url: string | undefined) => Boolean(url?.startsWith("data:"));
