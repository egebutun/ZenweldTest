import type { OptionDefinition, Product, ProductVariant } from "./types";

/**
 * URUN SECENEKLERININ EKRANDAKI HALI
 *
 * Urun secenek satirlarini (kod, fiyat farki ...) ortak tanimdaki ad ve
 * sirayla birlestirir. Ad ve sira tek yerden (tanim) gelir; tanimda bir
 * degerin adi duzeltilince her urunde degisir.
 */

export interface VariantView extends ProductVariant {
  /** Degerin kimligi (= valueId); stokta ve sepette secenegin kimligi */
  id: string;
  /** Tanimdaki ad: "4 m" */
  label: string;
}

export interface VariantGroupView {
  /** Tanimin kimligi */
  id: string;
  /** Tanimin adi: "Hortum Uzunluğu" */
  label: string;
  options: VariantView[];
}

/** Seceneksiz urunde ya da tanim silinmisse undefined; tanimda olmayan deger atlanir. */
export function productVariantGroup(
  product: Pick<Product, "options">,
  definitions: OptionDefinition[],
): VariantGroupView | undefined {
  const own = product.options;
  if (!own?.variants.length) return undefined;
  const definition = definitions.find((d) => d.id === own.optionId);
  if (!definition) return undefined;
  const options = definition.values.flatMap((value) => {
    const variant = own.variants.find((v) => v.valueId === value.id);
    return variant ? [{ ...variant, id: value.id, label: value.label }] : [];
  });
  return options.length ? { id: definition.id, label: definition.name, options } : undefined;
}
