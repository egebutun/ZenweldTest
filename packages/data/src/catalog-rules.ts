import { normalizeCode } from "./stock";
import { MAX_PRODUCT_OPTIONS } from "./variants";
import type { CategoryFilter, OptionDefinition, Product, ProductOptions, ProductVariant } from "./types";

/**
 * KATALOG KAYIT KURALLARI — PANEL (demo ve veritabani modu ayni)
 *
 * Seçenek Tanımları, kategori ve urun formunun dogrulamasi. Tarayici (panel
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

/* ------------------------------ Urun formu ------------------------------ */

/**
 * Baska urunlerin kodlari (urun ve varyant kodlari) -> nerede kullanildigi.
 * Kodlar tek havuzda benzersizdir; bayi ve satici stok dosyalari bu kodla
 * eslesir (buildCodeIndex).
 */
function codesInUse(products: Product[], selfId: string): Map<string, string> {
  const taken = new Map<string, string>();
  products
    .filter((p) => p.id !== selfId)
    .forEach((p) => {
      taken.set(normalizeCode(p.sku), `"${p.name}" ürününde kullanılıyor`);
      p.options?.variants.forEach((v) => taken.set(normalizeCode(v.sku), `"${p.name}" ürününün bir kombinasyonunda kullanılıyor`));
    });
  return taken;
}

/** Urunun kendi kodu baska bir urunun ya da varyantinin koduyla ayni olamaz. */
export function productCodeError(draft: Product, products: Product[]): string | null {
  const code = normalizeCode(draft.sku);
  const clash = code ? codesInUse(products, draft.id).get(code) : undefined;
  return clash ? `Ürün kodu (${draft.sku.trim()}) ${clash}.` : null;
}

/**
 * Secenekler: en fazla 3; her secenekte en az bir deger; ayni kombinasyon
 * iki kez olamaz. Kombinasyon kodlari zorunludur; urunun kendi koduyla,
 * ayni urunun baska kombinasyonuyla ya da baska bir urunun (veya
 * varyantinin) koduyla ayni olamaz. Fiyat eksiye dusemez.
 */
export function optionsError(draft: Product, definitions: OptionDefinition[], products: Product[]): string | null {
  const own = draft.options;
  if (!own) return null;
  if (own.optionIds.length > MAX_PRODUCT_OPTIONS) return `Bir üründe en fazla ${MAX_PRODUCT_OPTIONS} seçenek olur.`;
  const defs = own.optionIds.map((id) => definitions.find((d) => d.id === id));
  if (defs.some((d) => !d)) return "Ürünün seçenek tanımlarından biri bulunamadı.";
  const used = defs as OptionDefinition[];
  const empty = used.find((d) => !own.variants.some((v) => d.values.some((x) => x.id === v.values[d.id])));
  if (empty && own.variants.length) return `"${empty.name}" seçeneği için en az bir değer işaretleyin.`;
  const label = (v: ProductVariant) =>
    used.map((d) => d.values.find((x) => x.id === v.values[d.id])?.label ?? "?").join(" · ");

  const taken = codesInUse(products, draft.id);
  if (draft.sku.trim()) taken.set(normalizeCode(draft.sku), "ürünün kendi koduyla aynı olamaz");
  const combos = new Set<string>();

  for (const v of own.variants) {
    const name = label(v);
    if (used.some((d) => !d.values.some((x) => x.id === v.values[d.id])))
      return `"${name}" kombinasyonunda her seçenekten bir değer olmalı.`;
    const combo = own.optionIds.map((o) => v.values[o]).join("|");
    if (combos.has(combo)) return `"${name}" kombinasyonu iki kez girilmiş.`;
    combos.add(combo);
    const code = normalizeCode(v.sku);
    if (!code) return `"${name}" kombinasyonunun ürün kodu zorunludur.`;
    const clash = taken.get(code);
    if (clash) return `"${name}" kombinasyonunun kodu (${v.sku.trim()}) ${clash}.`;
    taken.set(code, `"${name}" kombinasyonunda da var`);
    if (draft.priceExVat + v.priceDeltaExVat < 0) return `"${name}" kombinasyonunun fiyatı eksiye düşüyor.`;
  }
  return null;
}

/**
 * Kayit icin toparlar: kombinasyonu olmayan secenekler kaldirilir, bos
 * satir ve maddeler atilir, urunden silinmis fotograf secimi temizlenir.
 * Eski ayri urunun linki (previousSlugs) korunur.
 */
export function tidyOptions(draft: Product): ProductOptions | undefined {
  const own = draft.options;
  if (!own?.variants.length) return undefined;
  const images = new Set(draft.images.map((i) => i.url));
  return {
    optionIds: own.optionIds,
    variants: own.variants.map(({ id, values, sku, priceDeltaExVat, specOverrides, inTheBox, image, previousSlugs }) => {
      const specs = (specOverrides ?? [])
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.label && r.value);
      const box = (inTheBox ?? []).map((x) => x.trim()).filter(Boolean);
      return {
        id,
        values: Object.fromEntries(own.optionIds.map((o) => [o, values[o]])),
        sku: sku.trim(),
        priceDeltaExVat,
        ...(specs.length ? { specOverrides: specs } : {}),
        ...(box.length ? { inTheBox: box } : {}),
        ...(image && images.has(image) ? { image } : {}),
        ...(previousSlugs?.length ? { previousSlugs } : {}),
      };
    }),
  };
}

/** Ayni link baska urunde kullaniliyorsa. */
export const productSlugTakenText = (slug: string, name: string) => `"${slug}" adresi "${name}" ürününde kullanılıyor.`;
