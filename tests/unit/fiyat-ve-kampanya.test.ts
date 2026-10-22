import { describe, expect, it } from "vitest";
import {
  FLASH_DISCOUNT_THRESHOLD,
  applyDiscount,
  discountPercent,
  discountStatusOf,
  productVariantGroup,
  salePriceExVat,
  validateDiscount,
} from "@zenweld/data";
import { priceWithVat } from "@zenweld/utils";
import { resolveVariant, variantLabel } from "@/lib/variants";
import { optionsError } from "@/components/admin/product/OptionsTab";
import { hoseLength, product } from "./ornek";

/* docs/IS-KURALLARI.md › 1. Fiyat ve KDV */
describe("Fiyat ve KDV", () => {
  it("KDV dahil fiyat = KDV hariç × (1 + oran/100): 1.000 ₺ + %20 = 1.200 ₺", () => {
    expect(priceWithVat(1000, 20)).toBe(1200);
    expect(priceWithVat(1000, 10)).toBe(1100);
  });

  it("KDV dahil fiyat tam liraya yuvarlanır", () => {
    expect(priceWithVat(999, 20)).toBe(1199); // 1198,8
    expect(priceWithVat(1, 20)).toBe(1); // 1,2
  });
});

/* docs/IS-KURALLARI.md › 2. Kampanya (indirim) */
describe("Kampanya", () => {
  const at = new Date(2026, 5, 15, 12, 0);
  const before = new Date(2026, 5, 1).toISOString();
  const after = new Date(2026, 5, 30).toISOString();

  it("oran 1 ile 90 arasında tam sayı olmalı", () => {
    expect(validateDiscount({ percent: 1 })).toBeNull();
    expect(validateDiscount({ percent: 90 })).toBeNull();
    expect(validateDiscount({ percent: 0 })).not.toBeNull();
    expect(validateDiscount({ percent: 91 })).not.toBeNull();
    expect(validateDiscount({ percent: 12.5 })).not.toBeNull();
  });

  it("bitiş başlangıçtan sonra olmalı", () => {
    expect(validateDiscount({ percent: 10, startsAt: after, endsAt: before })).not.toBeNull();
    expect(validateDiscount({ percent: 10, startsAt: before, endsAt: before })).not.toBeNull();
    expect(validateDiscount({ percent: 10, startsAt: before, endsAt: after })).toBeNull();
  });

  it("durum: yok, planlandı, geçerli, bitti", () => {
    expect(discountStatusOf(undefined, at)).toBe("none");
    expect(discountStatusOf({ percent: 0 }, at)).toBe("none");
    expect(discountStatusOf({ percent: 10, startsAt: after }, at)).toBe("scheduled");
    expect(discountStatusOf({ percent: 10, endsAt: before }, at)).toBe("ended");
    expect(discountStatusOf({ percent: 10, startsAt: before, endsAt: after }, at)).toBe("active");
  });

  it("başlangıç boşsa hemen başlar, bitiş boşsa süresizdir", () => {
    expect(discountStatusOf({ percent: 10 }, at)).toBe("active");
    expect(discountStatusOf({ percent: 10, endsAt: after }, at)).toBe("active");
    expect(discountStatusOf({ percent: 10, startsAt: before }, new Date(2030, 0, 1))).toBe("active");
  });

  it("örnek: 1.000 ₺ + KDV, %15 → 850 ₺ + KDV → KDV dahil 1.020 ₺", () => {
    expect(applyDiscount(1000, 15)).toBe(850);
    expect(priceWithVat(applyDiscount(1000, 15), 20)).toBe(1020);
  });

  it("kampanya fiyatı tam liraya yuvarlanır", () => {
    expect(applyDiscount(999, 15)).toBe(849); // 849,15
  });

  it("indirim yalnızca kampanya süresi içinde uygulanır; normal fiyat üründe kalır", () => {
    const p = product({ priceExVat: 1000, discount: { percent: 15, startsAt: before, endsAt: after } });
    expect(salePriceExVat(p, new Date(2026, 4, 31))).toBe(1000);
    expect(salePriceExVat(p, at)).toBe(850);
    expect(salePriceExVat(p, new Date(2026, 6, 1))).toBe(1000);
    expect(p.priceExVat).toBe(1000);
  });

  it("Flaş İndirim eşiği %25", () => {
    expect(FLASH_DISCOUNT_THRESHOLD).toBe(25);
  });
});

/* docs/IS-KURALLARI.md › 3. Seçenekli ürün */
describe("Seçenekli ürün", () => {
  const torch = product({
    sku: "ZW-TORC",
    priceExVat: 1000,
    specs: [
      { label: "Ürün Kodu", value: "ZW-TORC" },
      { label: "Ağırlık", value: "1 kg" },
    ],
    inTheBox: ["Torç"],
    options: {
      optionId: hoseLength.id,
      // Urundeki sira tanimdan farkli; ekranda tanimin sirasi gecerli.
      variants: [
        { valueId: "v5", sku: "ZW-TORC-5", priceDeltaExVat: 200, specOverrides: [{ label: "Ağırlık", value: "2 kg" }] },
        { valueId: "v3", sku: "ZW-TORC-3", priceDeltaExVat: 0, inTheBox: ["Torç", "Yedek uç"] },
      ],
    },
  });
  const group = productVariantGroup(torch, [hoseLength]);

  it("değerlerin adı ve sırası ortak tanımdan gelir", () => {
    expect(group?.label).toBe("Hortum Uzunluğu");
    expect(group?.options.map((o) => o.label)).toEqual(["3 m", "5 m"]);
  });

  it("örnek: 1.000 ₺ + 200 ₺ fark, %15 kampanya → 1.020 ₺ + KDV → KDV dahil 1.224 ₺", () => {
    const resolved = resolveVariant(torch, group, { [hoseLength.id]: "v5" });
    expect(resolved.priceExVat).toBe(1200);
    const campaign = product({ discount: { percent: 15 } });
    const sale = applyDiscount(resolved.priceExVat, discountPercent(campaign));
    expect(sale).toBe(1020);
    expect(priceWithVat(sale, 20)).toBe(1224);
  });

  it("ürün kodu ve teknik özellikler seçeneğe göre değişir", () => {
    const resolved = resolveVariant(torch, group, { [hoseLength.id]: "v5" });
    expect(resolved.sku).toBe("ZW-TORC-5");
    expect(resolved.specs).toEqual([
      { label: "Ürün Kodu", value: "ZW-TORC-5" },
      { label: "Ağırlık", value: "2 kg" },
      { label: "Hortum Uzunluğu", value: "5 m" },
    ]);
  });

  it("kutu içeriği: seçeneğin listesi varsa o, yoksa ürününki", () => {
    expect(resolveVariant(torch, group, { [hoseLength.id]: "v3" }).inTheBox).toEqual(["Torç", "Yedek uç"]);
    expect(resolveVariant(torch, group, { [hoseLength.id]: "v5" }).inTheBox).toEqual(["Torç"]);
  });

  it("seçim yoksa ya da seçilen değer artık yoksa ilk seçenek seçili gelir", () => {
    expect(resolveVariant(torch, group, {}).sku).toBe("ZW-TORC-3");
    expect(resolveVariant(torch, group, { [hoseLength.id]: "v4" }).sku).toBe("ZW-TORC-3");
    expect(variantLabel(group, {})).toBe("Hortum Uzunluğu: 3 m");
  });

  it("seçeneğin fiyatı eksiye düşemez", () => {
    const cheap = product({
      priceExVat: 100,
      options: { optionId: hoseLength.id, variants: [{ valueId: "v3", sku: "ZW-UCUZ-3", priceDeltaExVat: -150 }] },
    });
    expect(optionsError(cheap, [hoseLength], [])).toMatch(/eksiye düşüyor/);
  });
});
