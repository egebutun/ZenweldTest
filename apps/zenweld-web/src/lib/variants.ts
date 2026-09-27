import type { Product, ProductVariantOption, SpecRow } from "@zenweld/data";

/**
 * URUN SECENEKLERI (VARYANTLAR)
 *
 * Secilen secenege gore fiyati, urun kodunu ve teknik ozellik tablosunu
 * hesaplar. Secenegi olmayan urunlerde urunun kendi degerleri doner.
 */

export interface VariantSelection {
  /** grup id -> secenek id */
  [groupId: string]: string;
}

/**
 * Secili seceneklerin nesne hali.
 * Bir grup icin secim yapilmamissa o grubun ilk secenegi varsayilir;
 * boylece sayfa acilir acilmaz gecerli bir fiyat gosterilir.
 */
export function selectedOptions(
  product: Product,
  selection: VariantSelection,
): ProductVariantOption[] {
  return (product.variantGroups ?? [])
    .map((g) => g.options.find((o) => o.id === selection[g.id]) ?? g.options[0])
    .filter((o): o is ProductVariantOption => Boolean(o));
}

/** Bir grupta hangi secenek secili (secim yoksa ilk secenek). */
export function activeOptionId(
  groupId: string,
  product: Product,
  selection: VariantSelection,
): string | undefined {
  const group = product.variantGroups?.find((g) => g.id === groupId);
  return selection[groupId] ?? group?.options[0]?.id;
}

/** Secimin urune uyguladigi sonuc: fiyat, kod, ozellikler, stok. */
export function resolveVariant(product: Product, selection: VariantSelection) {
  const options = selectedOptions(product, selection);

  const priceExVat = options.reduce((sum, o) => sum + o.priceDeltaExVat, product.priceExVat);

  // Liste (indirim oncesi) fiyat da ayni farkla kayar ki indirim orani
  // secenekten secenege degismesin.
  const listPriceExVat = product.listPriceExVat
    ? options.reduce((sum, o) => sum + o.priceDeltaExVat, product.listPriceExVat)
    : undefined;

  // Sonraki secenek oncekinin uzerine yazar; ayni etiketli satir varsa
  // degistirilir, yoksa sona eklenir.
  const specs: SpecRow[] = product.specs.map((row) => ({ ...row }));
  for (const option of options) {
    for (const override of option.specOverrides ?? []) {
      const i = specs.findIndex((row) => row.label.tr === override.label.tr);
      if (i >= 0) specs[i] = override;
      else specs.push(override);
    }
  }

  const sku = options.find((o) => o.sku)?.sku ?? product.sku;
  const inStock = options.every((o) => o.inStock ?? true) && product.inStock;
  // Bayi stogu tek boyutlu tutuluyor; ilk grubun secimi kullanilir.
  const variantId = options[0]?.id;

  return { priceExVat, listPriceExVat, specs, sku, inStock, variantId, options };
}
