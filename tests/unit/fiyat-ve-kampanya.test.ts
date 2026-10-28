import { describe, expect, it } from "vitest";
import {
  FLASH_DISCOUNT_THRESHOLD,
  applyDiscount,
  discountPercent,
  discountStatusOf,
  productOptionsView,
  salePriceExVat,
  validateDiscount,
} from "@zenweld/data";
import { priceWithVat } from "@zenweld/utils";
import { pickValue, resolveVariant, valueAvailable, variantLabel } from "@/lib/variants";
import { optionsError } from "@/components/admin/product/OptionsTab";
import { cooling, hoseLength, options, product } from "./ornek";

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
    // Urundeki sira tanimdan farkli; ekranda tanimin sirasi gecerli.
    options: options(
      [hoseLength.id],
      [
        [["v5"], "ZW-TORC-5", { priceDeltaExVat: 200, specOverrides: [{ label: "Ağırlık", value: "2 kg" }] }],
        [["v3"], "ZW-TORC-3", { inTheBox: ["Torç", "Yedek uç"] }],
      ],
    ),
  });
  const view = productOptionsView(torch, [hoseLength]);

  it("değerlerin adı ve sırası ortak tanımdan gelir", () => {
    expect(view?.groups.map((g) => g.label)).toEqual(["Hortum Uzunluğu"]);
    expect(view?.variants.map((v) => v.label)).toEqual(["3 m", "5 m"]);
  });

  it("örnek: 1.000 ₺ + 200 ₺ fark, %15 kampanya → 1.020 ₺ + KDV → KDV dahil 1.224 ₺", () => {
    const resolved = resolveVariant(torch, view, "v5");
    expect(resolved.priceExVat).toBe(1200);
    const campaign = product({ discount: { percent: 15 } });
    const sale = applyDiscount(resolved.priceExVat, discountPercent(campaign));
    expect(sale).toBe(1020);
    expect(priceWithVat(sale, 20)).toBe(1224);
  });

  it("ürün kodu ve teknik özellikler seçeneğe göre değişir", () => {
    const resolved = resolveVariant(torch, view, "v5");
    expect(resolved.sku).toBe("ZW-TORC-5");
    expect(resolved.specs).toEqual([
      { label: "Ürün Kodu", value: "ZW-TORC-5" },
      { label: "Ağırlık", value: "2 kg" },
      { label: "Hortum Uzunluğu", value: "5 m" },
    ]);
  });

  it("kutu içeriği: seçeneğin listesi varsa o, yoksa ürününki", () => {
    expect(resolveVariant(torch, view, "v3").inTheBox).toEqual(["Torç", "Yedek uç"]);
    expect(resolveVariant(torch, view, "v5").inTheBox).toEqual(["Torç"]);
  });

  it("seçim yoksa ya da seçilen kombinasyon artık yoksa ilk kombinasyon seçili gelir", () => {
    expect(resolveVariant(torch, view).sku).toBe("ZW-TORC-3");
    expect(resolveVariant(torch, view, "v4").sku).toBe("ZW-TORC-3");
    expect(variantLabel(view)).toBe("Hortum Uzunluğu: 3 m");
  });

  it("seçeneğin fiyatı eksiye düşemez", () => {
    const cheap = product({
      priceExVat: 100,
      options: options([hoseLength.id], [[["v3"], "ZW-UCUZ-3", { priceDeltaExVat: -150 }]]),
    });
    expect(optionsError(cheap, [hoseLength], [])).toMatch(/eksiye düşüyor/);
  });
});

/* docs/IS-KURALLARI.md › 3. Seçenekli ürün (birden çok seçenek) */
describe("Birden çok seçenekli ürün", () => {
  // Soğutma × Hortum Uzunluğu; "Su · 3 m" satılmıyor (varyantı yok).
  const machine = product({
    sku: "ZW-405",
    priceExVat: 10000,
    specs: [{ label: "Ürün Kodu", value: "ZW-405" }],
    options: options(
      [cooling.id, hoseLength.id],
      [
        [["su", "v5"], "ZW-405-SU-5", { priceDeltaExVat: 1500 }],
        [["hava", "v5"], "ZW-405-HAVA-5"],
        [["hava", "v3"], "ZW-405-HAVA-3"],
      ],
    ),
  });
  const view = productOptionsView(machine, [cooling, hoseLength])!;

  it("her kombinasyon ayrı varyant; sıra önce birinci seçeneğin, sonra ikincinin tanımdaki sırası", () => {
    expect(view.groups.map((g) => g.label)).toEqual(["Soğutma", "Hortum Uzunluğu"]);
    expect(view.groups[1].values.map((v) => v.label)).toEqual(["3 m", "5 m"]);
    expect(view.variants.map((v) => v.label)).toEqual([
      "Hava Soğutmalı · 3 m",
      "Hava Soğutmalı · 5 m",
      "Su Soğutmalı · 5 m",
    ]);
  });

  it("kod, fiyat ve teknik özellikler kombinasyona göre; her seçeneğin satırı eklenir", () => {
    const resolved = resolveVariant(machine, view, "su_v5");
    expect(resolved.sku).toBe("ZW-405-SU-5");
    expect(resolved.priceExVat).toBe(11500);
    expect(resolved.specs).toEqual([
      { label: "Ürün Kodu", value: "ZW-405-SU-5" },
      { label: "Soğutma", value: "Su Soğutmalı" },
      { label: "Hortum Uzunluğu", value: "5 m" },
    ]);
    expect(variantLabel(view, "su_v5")).toBe("Soğutma: Su Soğutmalı · Hortum Uzunluğu: 5 m");
  });

  it("bir değer seçilince diğer seçim korunur; o kombinasyon satılmıyorsa o değeri içeren ilk kombinasyona geçilir", () => {
    const hava3 = view.variants.find((v) => v.id === "hava_v3");
    const hava5 = view.variants.find((v) => v.id === "hava_v5");
    expect(pickValue(view, hava3, hoseLength.id, "v5")?.id).toBe("hava_v5");
    expect(pickValue(view, hava5, cooling.id, "su")?.id).toBe("su_v5");
    // Su · 3 m yok: Su seçilince Su · 5 m'ye geçilir.
    expect(valueAvailable(view, hava3, cooling.id, "su")).toBe(false);
    expect(pickValue(view, hava3, cooling.id, "su")?.id).toBe("su_v5");
  });

  it("en fazla 3 seçenek; her seçenekte değer olmalı; aynı kombinasyon iki kez olamaz", () => {
    const four = product({ options: { optionIds: ["a", "b", "c", "d"], variants: [] } });
    expect(optionsError(four, [], [])).toMatch(/en fazla 3/);
    const missing = product({
      options: options([cooling.id, hoseLength.id], [[["hava", "v3"], "ZW-A"], [["su", ""], "ZW-B"]]),
    });
    expect(optionsError(missing, [cooling, hoseLength], [])).toMatch(/her seçenekten bir değer/);
    const twice = product({
      options: options([cooling.id, hoseLength.id], [[["hava", "v3"], "ZW-A"], [["hava", "v3"], "ZW-B"]]),
    });
    expect(optionsError(twice, [cooling, hoseLength], [])).toMatch(/iki kez/);
    expect(optionsError(machine, [cooling, hoseLength], [])).toBeNull();
  });
});
