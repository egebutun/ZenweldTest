import { findVariant, type Product, type ProductOptionsView, type SpecRow, type VariantView } from "@zenweld/data";

/**
 * URUN SECENEKLERI (VARYANTLAR)
 *
 * Secilen varyanta gore fiyati, urun kodunu ve teknik ozellik tablosunu
 * hesaplar. Seceneklerin ekrandaki hali urunden ve ortak tanimlardan
 * productOptionsView ile olusur; seceneksiz urunde (view yok) urunun kendi
 * degerleri doner.
 */

/**
 * Secili varyant. Secim yapilmamissa (ya da secilen varyant artik yoksa)
 * ilk varyant varsayilir; boylece sayfa acilir acilmaz gecerli bir fiyat
 * gosterilir.
 */
export function activeVariant(view: ProductOptionsView | undefined, variantId?: string): VariantView | undefined {
  return findVariant(view, variantId) ?? view?.variants[0];
}

/** Secimin urune uyguladigi sonuc: fiyat, kod, ozellikler, kutu icerigi, fotograf. */
export function resolveVariant(product: Product, view: ProductOptionsView | undefined, variantId?: string) {
  const variant = activeVariant(view, variantId);

  // Varyantin NORMAL fiyati. Kampanya varsa ayni indirim ORANI bu fiyata
  // gosterimde uygulanir (salePriceExVat), boylece 3 m ve 5 m torcta
  // indirim yuzdesi ayni kalir.
  const priceExVat = product.priceExVat + (variant?.priceDeltaExVat ?? 0);

  const sku = variant?.sku || product.sku;

  // Urunun koduyla yazilmis satir ("Ürün Kodu") varyantin koduna doner
  // (urun kodu bossa hicbir satir). Sonra her secenegin kendi satiri
  // ("Torç Uzunluğu: 8 m") ve varyantin farkli degerleri: ayni etiketli
  // satir varsa degistirilir, yoksa sona eklenir.
  const ownCode = product.sku.trim();
  const specs: SpecRow[] = product.specs.map((row) =>
    ownCode && row.value.trim() === ownCode ? { ...row, value: sku } : { ...row },
  );
  if (variant) {
    const rows = [...variant.parts.map((p) => ({ label: p.group, value: p.value })), ...(variant.specOverrides ?? [])];
    for (const override of rows) {
      const i = specs.findIndex((row) => row.label === override.label);
      if (i >= 0) specs[i] = override;
      else specs.push(override);
    }
  }

  return {
    priceExVat,
    specs,
    sku,
    inTheBox: variant?.inTheBox ?? product.inTheBox,
    /** Varyantin fotografi; yoksa urunun ilk fotografi */
    image: variant?.image,
    variantId: variant?.id,
    variant,
  };
}

/** Secili varyantin okunur hali: "Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m". Seceneksiz urunde bos. */
export function variantLabel(view: ProductOptionsView | undefined, variantId?: string): string | undefined {
  return activeVariant(view, variantId)?.fullLabel;
}

/** Diger seceneklerdeki secim korunarak bu degerle satilan varyant. */
function exactMatch(
  view: ProductOptionsView,
  current: VariantView | undefined,
  groupId: string,
  valueId: string,
): VariantView | undefined {
  return view.variants.find((v) =>
    view.groups.every((g) => v.values[g.id] === (g.id === groupId ? valueId : current?.values[g.id])),
  );
}

/**
 * Bir secenekte deger secilince gidilecek varyant. Diger seceneklerdeki
 * secim korunur; o kombinasyon satilmiyorsa bu degeri iceren ilk varyanta
 * gecilir (diger secenekler ona gore degisir).
 */
export function pickValue(
  view: ProductOptionsView,
  current: VariantView | undefined,
  groupId: string,
  valueId: string,
): VariantView | undefined {
  return exactMatch(view, current, groupId, valueId) ?? view.variants.find((v) => v.values[groupId] === valueId);
}

/** Bu deger, diger seceneklerdeki mevcut secimle birlikte satiliyor mu. */
export function valueAvailable(
  view: ProductOptionsView,
  current: VariantView | undefined,
  groupId: string,
  valueId: string,
): boolean {
  return Boolean(exactMatch(view, current, groupId, valueId));
}
