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
function selectedOptions(
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

/** Secimin urune uyguladigi sonuc: fiyat, kod, ozellikler. */
export function resolveVariant(product: Product, selection: VariantSelection) {
  const options = selectedOptions(product, selection);

  // Secenegin NORMAL fiyati. Kampanya varsa ayni indirim ORANI bu fiyata
  // gosterimde uygulanir (salePriceExVat), boylece 3 m ve 5 m torcta
  // indirim yuzdesi ayni kalir.
  const priceExVat = options.reduce((sum, o) => sum + o.priceDeltaExVat, product.priceExVat);

  // Sonraki secenek oncekinin uzerine yazar; ayni etiketli satir varsa
  // degistirilir, yoksa sona eklenir.
  const specs: SpecRow[] = product.specs.map((row) => ({ ...row }));
  for (const option of options) {
    for (const override of option.specOverrides ?? []) {
      const i = specs.findIndex((row) => row.label === override.label);
      if (i >= 0) specs[i] = override;
      else specs.push(override);
    }
  }

  const sku = options.find((o) => o.sku)?.sku ?? product.sku;
  // Bayi stogu tek boyutlu tutuluyor; ilk grubun secimi kullanilir.
  const variantId = options[0]?.id;

  return { priceExVat, specs, sku, variantId, options };
}

/** Secili seceneklerin okunur hali: "Torç Uzunluğu: 5 m". Seceneksiz urunde bos. */
export function variantLabel(product: Product, selection: VariantSelection): string | undefined {
  const groups = product.variantGroups ?? [];
  if (groups.length === 0) return undefined;
  const parts = groups.map((g) => {
    const option = g.options.find((o) => o.id === selection[g.id]) ?? g.options[0];
    return { group: g.label, option: option?.label };
  });
  return parts.map((p) => `${p.group}: ${p.option ?? ""}`).join(" · ");
}

/** Tum gruplar icin secimi tamamlar (secilmeyen grupta ilk secenek). */
export function completeSelection(product: Product, selection: VariantSelection): VariantSelection {
  return Object.fromEntries(
    (product.variantGroups ?? []).map((g) => [g.id, activeOptionId(g.id, product, selection) ?? ""]),
  );
}
