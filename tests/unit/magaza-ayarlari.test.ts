import { describe, expect, it } from "vitest";
import {
  COMPANY_EMAIL_INVALID,
  COMPANY_MERSIS_INVALID,
  COMPANY_NAME_REQUIRED,
  COMPANY_OFFICE_REQUIRED,
  COMPANY_PHONE_REQUIRED,
  COMPANY_SOCIAL_INVALID,
  SHOP_BANK_REQUIRED,
  SHOP_NO_CARRIER,
  SHOP_ONE_DEFAULT,
  SHOP_POS_REQUIRED,
  companyKey,
  defaultSettings,
  parseCompanySettings,
  parseRecipients,
  parseShopSettings,
  recipientsVersion,
  shopKey,
  trackingLink,
  trackingUrlError,
  type CompanySettings,
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
  carriers: [{ name: "Aras Kargo" }],
  bankAccounts: [{ id: "ba-1", bankName: "Garanti", accountHolder: "Zenweld", iban: "tr00 0000" }],
  pos: [pos()],
  ...over,
});

/* docs/IS-KURALLARI.md › 22. Panelde kayıt düzenleme (Mağaza Ayarları) */
describe("Mağaza ayarları", () => {
  it("metinler kırpılır, IBAN büyük harfe çevrilir, aynı kargo firması bir kez alınır, boş satır atlanır", () => {
    const parsed = parseShopSettings(
      shop({
        carriers: [{ name: " Aras Kargo " }, { name: "aras kargo" }, { name: "" }, { name: "Yurtiçi Kargo", trackingUrl: " " }],
        pos: [pos({ name: " Garanti Bonus " })],
      }),
    );
    expect(parsed.ok && parsed.value.carriers).toEqual([{ name: "Aras Kargo" }, { name: "Yurtiçi Kargo" }]);
    expect(parsed.ok && parsed.value.bankAccounts[0].iban).toBe("TR00 0000");
    expect(parsed.ok && parsed.value.pos[0].name).toBe("Garanti Bonus");
  });

  it("kargo firması, banka adı ve IBAN, POS etiketi ve adı zorunlu; tek varsayılan POS", () => {
    expect(parseShopSettings(shop({ carriers: [{ name: " " }] }))).toEqual({ ok: false, error: SHOP_NO_CARRIER });
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
      // Kargo firmasi ad ve takip adresiyle gelir; duz metin bozuk istektir.
      { ...shop(), carriers: ["Aras Kargo"] } as unknown as ShopSettings,
    ];
    for (const value of broken) expect(parseShopSettings(value)).toEqual({ ok: false, error: null });
  });

  it("karşılaştırma son değişiklik anını ve alanların sırasını dikkate almaz", () => {
    const value = shop();
    const reordered = { ...value, updatedAt: "2026-11-05T10:00:00.000Z", pos: [{ ...pos(), installments: [{ enabled: true, ratePercent: 0, count: 3 }] }] };
    expect(shopKey(reordered)).toBe(shopKey(value));
    expect(shopKey(shop({ shippingFee: 150 }))).not.toBe(shopKey(value));
    expect(shopKey(shop({ carriers: [{ name: "Aras Kargo", trackingUrl: "https://a/{takip}" }] }))).not.toBe(shopKey(value));
  });
});

/* docs/IS-KURALLARI.md › 7. Sipariş durumları (kargo takip bağlantısı; KARARLAR K-105) */
describe("Kargo takip bağlantısı", () => {
  const url = "https://kargo.ornek/sorgula?no={takip}";

  it("takip adresi https:// ile başlar, {takip} içerir, boşluk içermez; boş bırakılabilir", () => {
    const ok = parseShopSettings(shop({ carriers: [{ name: "Aras Kargo", trackingUrl: ` ${url} ` }] }));
    expect(ok.ok && ok.value.carriers).toEqual([{ name: "Aras Kargo", trackingUrl: url }]);
    for (const bad of ["https://kargo.ornek/sorgula", "kargo.ornek/{takip}", "https://kargo ornek/{takip}"]) {
      expect(parseShopSettings(shop({ carriers: [{ name: "Aras Kargo", trackingUrl: bad }] }))).toEqual({
        ok: false,
        error: trackingUrlError("Aras Kargo"),
      });
    }
  });

  it("gönderinin firması adla bulunur (büyük/küçük harf fark etmez); {takip} yerine boşluksuz takip numarası yazılır", () => {
    const carriers = [{ name: "Aras Kargo", trackingUrl: url }, { name: "MNG Kargo" }];
    expect(trackingLink(carriers, { carrier: "aras kargo", trackingNumber: "AR 5520 1983 04" })).toBe(
      "https://kargo.ornek/sorgula?no=AR5520198304",
    );
    expect(trackingLink(carriers, { carrier: "Aras Kargo", trackingNumber: "A/B&1" })).toBe("https://kargo.ornek/sorgula?no=A%2FB%261");
    // Takip adresi yok, firma listeden çıkarılmış ya da numara boş: bağlantı yok.
    expect(trackingLink(carriers, { carrier: "MNG Kargo", trackingNumber: "123" })).toBeUndefined();
    expect(trackingLink(carriers, { carrier: "Sürat Kargo", trackingNumber: "123" })).toBeUndefined();
    expect(trackingLink(carriers, { carrier: "Aras Kargo", trackingNumber: "  " })).toBeUndefined();
  });
});

/* docs/IS-KURALLARI.md › 22. Panelde kayıt düzenleme (Şirket ve İletişim; KARARLAR K-105) */
describe("Şirket ve iletişim", () => {
  const company = (over: Partial<CompanySettings> = {}): CompanySettings => ({ ...defaultSettings.company, ...over });

  it("başlangıç değerleri geçerli; metinler kırpılır, MERSİS boşlukları atılır, e-posta küçük harf, boş satırlar atlanır", () => {
    expect(parseCompanySettings(defaultSettings.company)).toEqual({ ok: true, value: defaultSettings.company });
    const parsed = parseCompanySettings(
      company({
        legalName: " Zenweld A.Ş. ",
        mersisNo: "0123 4567 8901 2345",
        email: "Info@Zenweld.com",
        offices: [{ id: "o1", city: " İzmir ", addressLines: ["Satır 1", " ", "Satır 2 "], phones: ["", "+90 232 000 00 00"] }],
      }),
    );
    expect(parsed.ok && parsed.value).toMatchObject({
      legalName: "Zenweld A.Ş.",
      mersisNo: "0123456789012345",
      email: "info@zenweld.com",
      offices: [{ id: "o1", city: "İzmir", addressLines: ["Satır 1", "Satır 2"], phones: ["+90 232 000 00 00"] }],
    });
  });

  it("unvan, telefon, geçerli e-posta ve en az bir ofis (şehir ve adresiyle) zorunlu; MERSİS 16 rakam ya da boş; sosyal medya https://", () => {
    const office = defaultSettings.company.offices[0];
    expect(parseCompanySettings(company({ legalName: " " }))).toEqual({ ok: false, error: COMPANY_NAME_REQUIRED });
    expect(parseCompanySettings(company({ phone: "" }))).toEqual({ ok: false, error: COMPANY_PHONE_REQUIRED });
    expect(parseCompanySettings(company({ email: "info@" }))).toEqual({ ok: false, error: COMPANY_EMAIL_INVALID });
    expect(parseCompanySettings(company({ mersisNo: "123" }))).toEqual({ ok: false, error: COMPANY_MERSIS_INVALID });
    expect(parseCompanySettings(company({ mersisNo: "" })).ok).toBe(true);
    expect(parseCompanySettings(company({ offices: [] }))).toEqual({ ok: false, error: COMPANY_OFFICE_REQUIRED });
    expect(parseCompanySettings(company({ offices: [{ ...office, addressLines: [" "] }] }))).toEqual({
      ok: false,
      error: COMPANY_OFFICE_REQUIRED,
    });
    expect(parseCompanySettings(company({ social: { ...defaultSettings.company.social, youtube: "youtube.com/x" } }))).toEqual({
      ok: false,
      error: COMPANY_SOCIAL_INVALID,
    });
    expect(parseCompanySettings(company({ social: { ...defaultSettings.company.social, tiktok: "" } })).ok).toBe(true);
    // Bozuk istek: ayni ofis kimligi iki kez, sosyal medya yok.
    expect(parseCompanySettings(company({ offices: [office, office] }))).toEqual({ ok: false, error: null });
    expect(parseCompanySettings({ ...company(), social: undefined })).toEqual({ ok: false, error: null });
  });

  it("karşılaştırma son değişiklik anını ve sosyal medya alanlarının sırasını dikkate almaz", () => {
    const { instagram, youtube, linkedin, tiktok } = defaultSettings.company.social;
    const reordered = company({ updatedAt: "2026-11-05T10:00:00.000Z", social: { tiktok, linkedin, youtube, instagram } });
    expect(companyKey(reordered)).toBe(companyKey(company()));
    expect(companyKey(company({ mersisNo: "0123456789012345" }))).not.toBe(companyKey(company()));
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
