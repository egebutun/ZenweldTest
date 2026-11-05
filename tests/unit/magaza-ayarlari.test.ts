import { describe, expect, it } from "vitest";
import {
  SHOP_BANK_REQUIRED,
  SHOP_NO_CARRIER,
  SHOP_ONE_DEFAULT,
  SHOP_POS_REQUIRED,
  parseRecipients,
  parseShopSettings,
  recipientsVersion,
  shopKey,
  type PaymentPos,
  type ShopSettings,
} from "@zenweld/data";

const pos = (over: Partial<PaymentPos> = {}): PaymentPos => ({
  id: "pos-1",
  bankShortName: "Garanti",
  name: "Garanti Bonus",
  program: "Bonus",
  merchantNo: "1000",
  posName: "POS",
  active: true,
  isDefault: true,
  installments: [{ count: 3, ratePercent: 0, enabled: true }],
  commissions: [{ count: 1, ratePercent: 1.5 }],
  ...over,
});

const shop = (over: Partial<ShopSettings> = {}): ShopSettings => ({
  freeShippingThreshold: 5000,
  shippingFee: 149.9,
  minInstallmentAmount: 1000,
  transferDueDays: 3,
  carriers: ["Aras Kargo"],
  bankAccounts: [{ id: "ba-1", bankName: "Garanti", accountHolder: "Zenweld", iban: "tr00 0000" }],
  pos: [pos()],
  ...over,
});

/* docs/IS-KURALLARI.md › 22. Panelde kayıt düzenleme (Mağaza Ayarları) */
describe("Mağaza ayarları", () => {
  it("metinler kırpılır, IBAN büyük harfe çevrilir, aynı kargo firması bir kez alınır, boş satır atlanır", () => {
    const parsed = parseShopSettings(
      shop({ carriers: [" Aras Kargo ", "aras kargo", "", "Yurtiçi Kargo"], pos: [pos({ name: " Garanti Bonus " })] }),
    );
    expect(parsed.ok && parsed.value.carriers).toEqual(["Aras Kargo", "Yurtiçi Kargo"]);
    expect(parsed.ok && parsed.value.bankAccounts[0].iban).toBe("TR00 0000");
    expect(parsed.ok && parsed.value.pos[0].name).toBe("Garanti Bonus");
  });

  it("kargo firması, banka adı ve IBAN, POS etiketi ve adı zorunlu; tek varsayılan POS", () => {
    expect(parseShopSettings(shop({ carriers: [" "] }))).toEqual({ ok: false, error: SHOP_NO_CARRIER });
    expect(parseShopSettings(shop({ bankAccounts: [{ id: "b", bankName: "X", accountHolder: "", iban: " " }] }))).toEqual({
      ok: false,
      error: SHOP_BANK_REQUIRED,
    });
    expect(parseShopSettings(shop({ pos: [pos({ bankShortName: "" })] }))).toEqual({ ok: false, error: SHOP_POS_REQUIRED });
    expect(parseShopSettings(shop({ pos: [pos(), pos({ id: "pos-2" })] }))).toEqual({ ok: false, error: SHOP_ONE_DEFAULT });
  });

  it("bozuk istek reddedilir: eksi tutar, kesirli ödeme süresi, bilinmeyen kart programı, 2–12 dışı taksit, aynı kimlik iki kez", () => {
    const broken = [
      shop({ shippingFee: -1 }),
      shop({ transferDueDays: 1.5 }),
      shop({ transferDueDays: 0 }),
      shop({ pos: [pos({ program: "Paraf2" as PaymentPos["program"] })] }),
      shop({ pos: [pos({ installments: [{ count: 4, ratePercent: 0, enabled: true }] })] }),
      shop({ pos: [pos({ commissions: [{ count: 1, ratePercent: 1 }, { count: 1, ratePercent: 2 }] })] }),
      shop({ pos: [pos(), pos({ isDefault: false })] }),
    ];
    for (const value of broken) expect(parseShopSettings(value)).toEqual({ ok: false, error: null });
  });

  it("karşılaştırma son değişiklik anını ve alanların sırasını dikkate almaz", () => {
    const value = shop();
    const reordered = { ...value, updatedAt: "2026-11-05T10:00:00.000Z", pos: [{ ...pos(), installments: [{ enabled: true, ratePercent: 0, count: 3 }] }] };
    expect(shopKey(reordered)).toBe(shopKey(value));
    expect(shopKey(shop({ shippingFee: 150 }))).not.toBe(shopKey(value));
  });
});

/* docs/IS-KURALLARI.md › 18. Form e-postaları (alıcılar) */
describe("E-posta alıcıları", () => {
  it("virgül, noktalı virgül, boşluk ya da satır sonuyla ayrılır; küçük harfe çevrilir; aynı adres bir kez", () => {
    expect(parseRecipients(" Satis@Zenweld.com, satis@zenweld.com;\nmuhasebe@zenweld.com ")).toEqual({
      ok: true,
      value: ["satis@zenweld.com", "muhasebe@zenweld.com"],
    });
    expect(parseRecipients("  ")).toEqual({ ok: true, value: [] });
  });

  it("geçersiz adres ve 10'dan fazla adres reddedilir", () => {
    expect(parseRecipients("satis@zenweld")).toEqual({ ok: false, error: '"satis@zenweld" geçerli bir e-posta adresi değil.' });
    const eleven = Array.from({ length: 11 }, (_, i) => `a${i}@zenweld.com`).join(",");
    expect(parseRecipients(eleven)).toEqual({ ok: false, error: "En fazla 10 adres yazılabilir." });
  });

  it("listenin hali: satır sayısı ve en son değişen satır", () => {
    expect(recipientsVersion([])).toBe("0|");
    expect(recipientsVersion([{ updatedAt: "2026-11-05T09:00:00.000Z" }, { updatedAt: "2026-11-05T10:00:00.000Z" }])).toBe(
      "2|2026-11-05T10:00:00.000Z",
    );
  });
});
