import type { Product, SpecRow, VariantGroupView, VariantView } from "@zenweld/data";

/**
 * URUN SECENEKLERI (VARYANTLAR)
 *
 * Secilen secenege gore fiyati, urun kodunu ve teknik ozellik tablosunu
 * hesaplar. Secenek grubu urunden ve ortak tanimdan productVariantGroup ile
 * olusur; seceneksiz urunde (grup yok) urunun kendi degerleri doner.
 */

export interface VariantSelection {
  /** secenek tanimi id -> deger id */
  [groupId: string]: string;
}

/**
 * Secili secenek. Secim yapilmamissa (ya da secilen deger artik yoksa)
 * ilk secenek varsayilir; boylece sayfa acilir acilmaz gecerli bir fiyat
 * gosterilir.
 */
export function activeOption(
  group: VariantGroupView | undefined,
  selection: VariantSelection,
): VariantView | undefined {
  return group && (group.options.find((o) => o.id === selection[group.id]) ?? group.options[0]);
}

/** Secimin urune uyguladigi sonuc: fiyat, kod, ozellikler, kutu icerigi, fotograf. */
export function resolveVariant(
  product: Product,
  group: VariantGroupView | undefined,
  selection: VariantSelection,
) {
  const option = activeOption(group, selection);

  // Secenegin NORMAL fiyati. Kampanya varsa ayni indirim ORANI bu fiyata
  // gosterimde uygulanir (salePriceExVat), boylece 3 m ve 5 m torcta
  // indirim yuzdesi ayni kalir.
  const priceExVat = product.priceExVat + (option?.priceDeltaExVat ?? 0);

  const sku = option?.sku || product.sku;

  // Urunun koduyla yazilmis satir ("Ürün Kodu") secenegin koduna doner
  // (urun kodu bossa hicbir satir). Sonra secenegin kendi satiri ("Hortum
  // Uzunluğu: 4 m") ve farkli degerleri: ayni etiketli satir varsa
  // degistirilir, yoksa sona eklenir.
  const ownCode = product.sku.trim();
  const specs: SpecRow[] = product.specs.map((row) =>
    ownCode && row.value.trim() === ownCode ? { ...row, value: sku } : { ...row },
  );
  if (group && option) {
    for (const override of [{ label: group.label, value: option.label }, ...(option.specOverrides ?? [])]) {
      const i = specs.findIndex((row) => row.label === override.label);
      if (i >= 0) specs[i] = override;
      else specs.push(override);
    }
  }

  return {
    priceExVat,
    specs,
    sku,
    inTheBox: option?.inTheBox ?? product.inTheBox,
    /** Secenegin fotografi; yoksa urunun ilk fotografi */
    image: option?.image,
    variantId: option?.id,
    option,
  };
}

/** Secili secenegin okunur hali: "Hortum Uzunluğu: 5 m". Seceneksiz urunde bos. */
export function variantLabel(group: VariantGroupView | undefined, selection: VariantSelection): string | undefined {
  const option = activeOption(group, selection);
  return group && option ? `${group.label}: ${option.label}` : undefined;
}

/** Secimi tamamlar (secilmediyse ilk secenek); seceneksiz urunde bos. */
export function completeSelection(group: VariantGroupView | undefined, selection: VariantSelection): VariantSelection {
  const option = activeOption(group, selection);
  return group && option ? { [group.id]: option.id } : {};
}
