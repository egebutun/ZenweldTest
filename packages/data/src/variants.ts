import type { OptionDefinition, Product, ProductVariant } from "./types";

/**
 * URUN SECENEKLERININ EKRANDAKI HALI
 *
 * Urunun varyantlarini (kod, fiyat farki ...) ortak tanimlardaki ad ve
 * sirayla birlestirir. Ad ve sira tek yerden (tanim) gelir; tanimda bir
 * degerin adi duzeltilince her urunde degisir.
 */

/** Bir urunde en fazla kac secenek (Soğutma, Torç Uzunluğu ...) kullanilir. */
export const MAX_PRODUCT_OPTIONS = 3;

export interface OptionGroupView {
  /** Tanimin kimligi */
  id: string;
  /** Tanimin adi: "Torç Uzunluğu" */
  label: string;
  /** Bu urunde en az bir varyantta gecen degerler, tanimdaki sirayla */
  values: { id: string; label: string }[];
}

export interface VariantView extends ProductVariant {
  /** Secenek secenek degerler, urundeki secenek sirasiyla */
  parts: { groupId: string; group: string; valueId: string; value: string }[];
  /** Kisa ad: "Su Soğutmalı · 8 m" (tek secenekte "8 m"); bkz. combinationLabel */
  label: string;
  /** Uzun ad: "Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m" */
  fullLabel: string;
}

export interface ProductOptionsView {
  groups: OptionGroupView[];
  /** Gecerli varyantlar; ilk secenegin deger sirasina, sonra ikincisininkine gore */
  variants: VariantView[];
}

/**
 * Kombinasyonun kisa adi: degerler " · " ile. Ayni birimle biten degerlerin
 * (iki uzunluk: "3 m" ve "5 m") hangi secenege ait oldugu anlasilsin diye
 * onlarin onune secenek adi yazilir: "Hava Soğutmalı · Torç Uzunluğu 3 m ·
 * Ara Paket Uzunluğu 5 m".
 */
export function combinationLabel(parts: { group: string; value: string }[]): string {
  const unit = (value: string) => value.trim().split(/\s+/).pop() ?? "";
  const units = parts.map((p) => unit(p.value));
  return parts
    .map((p, i) => (units.filter((u) => u === units[i]).length > 1 ? `${p.group} ${p.value}` : p.value))
    .join(" · ");
}

/** Yeni varyantin kimligi: deger kimlikleri secenek sirasiyla ("su-sogutmali_8-m"). */
export function variantIdFor(optionIds: string[], values: Record<string, string>): string {
  return optionIds.map((id) => values[id]).join("_");
}

/**
 * Seceneksiz urunde ya da tanimlardan biri silinmisse undefined. Tanimda
 * olmayan degeri iceren varyant atlanir.
 */
export function productOptionsView(
  product: Pick<Product, "options">,
  definitions: OptionDefinition[],
): ProductOptionsView | undefined {
  const own = product.options;
  if (!own?.variants.length || !own.optionIds.length) return undefined;
  const defs = own.optionIds.map((id) => definitions.find((d) => d.id === id));
  if (defs.some((d) => !d)) return undefined;
  const used = defs as OptionDefinition[];

  const valid = own.variants.filter((v) => used.every((d) => d.values.some((x) => x.id === v.values[d.id])));
  if (!valid.length) return undefined;

  const groups: OptionGroupView[] = used.map((d) => ({
    id: d.id,
    label: d.name,
    values: d.values
      .filter((x) => valid.some((v) => v.values[d.id] === x.id))
      .map((x) => ({ id: x.id, label: x.label })),
  }));
  const rank = (v: ProductVariant) => used.map((d) => d.values.findIndex((x) => x.id === v.values[d.id]));

  const variants = valid
    .map((v): VariantView => {
      const parts = used.map((d) => ({
        groupId: d.id,
        group: d.name,
        valueId: v.values[d.id],
        value: d.values.find((x) => x.id === v.values[d.id])!.label,
      }));
      return {
        ...v,
        parts,
        label: combinationLabel(parts),
        fullLabel: parts.map((p) => `${p.group}: ${p.value}`).join(" · "),
      };
    })
    .sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      const i = ra.findIndex((x, n) => x !== rb[n]);
      return i < 0 ? 0 : ra[i] - rb[i];
    });

  return { groups, variants };
}

/** Kimligi verilen varyant; yoksa undefined. */
export function findVariant(view: ProductOptionsView | undefined, variantId: string | undefined): VariantView | undefined {
  return variantId ? view?.variants.find((v) => v.id === variantId) : undefined;
}
