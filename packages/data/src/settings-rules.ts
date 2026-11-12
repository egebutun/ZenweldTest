import { CARD_PROGRAMS, INSTALLMENT_COUNTS, type CardProgram } from "./checkout";
import { isTrackingUrl, trackingUrlError } from "./shipping";
import type {
  BankAccount,
  Carrier,
  CompanyOffice,
  CompanySettings,
  CompanySocial,
  EmailRecipient,
  InstallmentOption,
  PaymentPos,
  ShopSettings,
} from "./types";

/**
 * MAGAZA AYARLARI, SIRKET VE ILETISIM, E-POSTA ALICILARI KURALLARI — PANEL
 * (demo ve veritabani modu ayni)
 *
 * Tarayici (Magaza Ayarlari ekrani) ve sunucu (packages/db ›
 * admin-settings.ts) ayni kurallari kullanir; sunucu tarayicidan geleni
 * yeniden denetler. POS'un API anahtari ve sifresi burada yoktur; yalnizca
 * sunucuda ortam degiskenidir (CLAUDE.md › Guvenlik).
 */

export const SHOP_NO_CARRIER = "En az bir kargo firması girin.";
export const SHOP_BANK_REQUIRED = "Her banka hesabında banka adı ve IBAN zorunludur.";
export const SHOP_POS_REQUIRED = "Banka etiketi ve banka adı zorunludur.";
export const SHOP_ONE_DEFAULT = "Yalnızca bir POS varsayılan olabilir.";

/** error null: istek bozuk (ekran boyle bir sey gondermez). */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string | null };

/** Bir listede en fazla kac kayit (POS, hesap, kargo firmasi). */
const MAX_ITEMS = 50;
/** Firma taksit oranlarinda tek cekim (1) de vardir. */
const FIRM_COUNTS = [1, ...INSTALLMENT_COUNTS];

const bad = { ok: false as const, error: null };
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : null);
const amount = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
const recordId = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 100 ? v : null);
const unique = (values: unknown[]) => new Set(values).size === values.length;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRates<T extends { count: number; ratePercent: number }>(
  value: unknown,
  counts: number[],
  read: (row: Record<string, unknown>, count: number, ratePercent: number) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length > counts.length) return null;
  const rows: T[] = [];
  for (const r of value) {
    if (!isRecord(r)) return null;
    const rate = amount(r.ratePercent);
    if (typeof r.count !== "number" || !counts.includes(r.count) || rate === null) return null;
    const row = read(r, r.count, rate);
    if (!row) return null;
    rows.push(row);
  }
  return unique(rows.map((r) => r.count)) ? rows : null;
}

function parsePos(value: unknown): Parsed<PaymentPos> {
  if (!isRecord(value)) return bad;
  const id = recordId(value.id);
  const bankShortName = str(value.bankShortName, 50);
  const name = str(value.name);
  const merchantNo = str(value.merchantNo, 50);
  const posName = str(value.posName);
  const program = value.program === undefined || value.program === null || value.program === "" ? undefined : value.program;
  if (!id || bankShortName === null || name === null || merchantNo === null || posName === null) return bad;
  if (program !== undefined && !CARD_PROGRAMS.includes(program as CardProgram)) return bad;
  if (typeof value.active !== "boolean" || typeof value.isDefault !== "boolean") return bad;
  const installments = parseRates<InstallmentOption>(value.installments, INSTALLMENT_COUNTS, (r, count, ratePercent) =>
    typeof r.enabled === "boolean" ? { count, ratePercent, enabled: r.enabled } : null,
  );
  const commissions = parseRates(value.commissions, FIRM_COUNTS, (_r, count, ratePercent) => ({ count, ratePercent }));
  if (!installments || !commissions) return bad;
  if (!bankShortName || !name) return { ok: false, error: SHOP_POS_REQUIRED };
  return {
    ok: true,
    value: {
      id,
      bankShortName,
      name,
      ...(program !== undefined && { program: program as CardProgram }),
      merchantNo,
      posName,
      active: value.active,
      isDefault: value.isDefault,
      installments,
      commissions,
    },
  };
}

/**
 * Magaza ayarlarini denetler ve temizler: metinler kirpilir, IBAN buyuk
 * harfe cevrilir, ayni kargo firmasi iki kez yazildiysa ilki alinir
 * (buyuk/kucuk harf fark etmez), adi bos firma satirlari atlanir. Kargo
 * firmasinin takip adresi bos olabilir; doluysa shipping.ts kuralina uyar.
 */
export function parseShopSettings(value: unknown): Parsed<ShopSettings> {
  if (!isRecord(value)) return bad;
  const freeShippingThreshold = amount(value.freeShippingThreshold);
  const shippingFee = amount(value.shippingFee);
  const minInstallmentAmount = amount(value.minInstallmentAmount);
  const transferDueDays = value.transferDueDays;
  if (freeShippingThreshold === null || shippingFee === null || minInstallmentAmount === null) return bad;
  if (typeof transferDueDays !== "number" || !Number.isInteger(transferDueDays) || transferDueDays < 1) return bad;
  const lists = [value.carriers, value.bankAccounts, value.pos];
  if (!lists.every((l) => Array.isArray(l) && l.length <= MAX_ITEMS)) return bad;

  const carriers: Carrier[] = [];
  const seen = new Set<string>();
  for (const c of value.carriers as unknown[]) {
    if (!isRecord(c)) return bad;
    const name = str(c.name, 100);
    const trackingUrl = c.trackingUrl === undefined ? "" : str(c.trackingUrl, 500);
    if (name === null || trackingUrl === null) return bad;
    const key = name.toLocaleLowerCase("tr");
    if (!name || seen.has(key)) continue;
    if (trackingUrl && !isTrackingUrl(trackingUrl)) return { ok: false, error: trackingUrlError(name) };
    seen.add(key);
    carriers.push({ name, ...(trackingUrl && { trackingUrl }) });
  }
  if (!carriers.length) return { ok: false, error: SHOP_NO_CARRIER };

  const bankAccounts: BankAccount[] = [];
  for (const b of value.bankAccounts as unknown[]) {
    if (!isRecord(b)) return bad;
    const id = recordId(b.id);
    const bankName = str(b.bankName);
    const accountHolder = str(b.accountHolder);
    const iban = str(b.iban, 50);
    if (!id || bankName === null || accountHolder === null || iban === null) return bad;
    if (!bankName || !iban) return { ok: false, error: SHOP_BANK_REQUIRED };
    bankAccounts.push({ id, bankName, accountHolder, iban: iban.toUpperCase() });
  }

  const pos: PaymentPos[] = [];
  for (const p of value.pos as unknown[]) {
    const parsed = parsePos(p);
    if (!parsed.ok) return parsed;
    pos.push(parsed.value);
  }
  if (!unique(bankAccounts.map((b) => b.id)) || !unique(pos.map((p) => p.id))) return bad;
  if (pos.filter((p) => p.isDefault).length > 1) return { ok: false, error: SHOP_ONE_DEFAULT };

  return {
    ok: true,
    value: { freeShippingThreshold, shippingFee, pos, minInstallmentAmount, bankAccounts, transferDueDays, carriers },
  };
}

/** Bir POS'un karsilastirma anahtari (alan sirasi kaydin nereden geldigine bagli degil). */
export const posKey = (p: PaymentPos) =>
  JSON.stringify([
    p.id,
    p.bankShortName,
    p.name,
    p.program ?? "",
    p.merchantNo,
    p.posName,
    p.active,
    p.isDefault,
    p.installments.map((i) => [i.count, i.ratePercent, i.enabled]),
    p.commissions.map((c) => [c.count, c.ratePercent]),
  ]);

export const bankAccountKey = (b: BankAccount) => JSON.stringify([b.id, b.bankName, b.accountHolder, b.iban]);

export const carrierKey = (c: Carrier) => JSON.stringify([c.name, c.trackingUrl ?? ""]);

/** Ayarlarin karsilastirma anahtari; son degisiklik ani (updatedAt) haric. */
export const shopKey = (shop: ShopSettings) =>
  JSON.stringify([
    shop.freeShippingThreshold,
    shop.shippingFee,
    shop.minInstallmentAmount,
    shop.transferDueDays,
    shop.carriers.map(carrierKey),
    shop.bankAccounts.map(bankAccountKey),
    shop.pos.map(posKey),
  ]);

/* ------------------------------------------------------------------ */
/* Sirket ve iletisim (KARARLAR K-105)                                 */
/* ------------------------------------------------------------------ */

export const COMPANY_NAME_REQUIRED = "Ticari unvan zorunludur.";
export const COMPANY_PHONE_REQUIRED = "Telefon zorunludur.";
export const COMPANY_EMAIL_INVALID = "Geçerli bir e-posta adresi girin.";
export const COMPANY_MERSIS_INVALID = "MERSİS numarası 16 rakamdan oluşur (boş bırakılabilir).";
export const COMPANY_OFFICE_REQUIRED = "En az bir ofis girin; her ofiste şehir ve adres zorunludur.";
export const COMPANY_SOCIAL_INVALID = "Sosyal medya adresleri https:// ile başlamalı (boş bırakılabilir).";

/** En fazla kac ofis; ofiste en fazla kac adres satiri ve telefon. */
const MAX_OFFICES = 10;
const MAX_LINES = 5;

export const COMPANY_SOCIAL_KEYS = ["instagram", "youtube", "linkedin", "tiktok"] as const satisfies readonly (keyof CompanySocial)[];

/** Satirlara ayrilmis metin listesi: kirpilir, bos satirlar atlanir. */
function lines(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value) || value.length > max * 2) return null;
  const list: string[] = [];
  for (const v of value) {
    const line = str(v, 200);
    if (line === null) return null;
    if (line) list.push(line);
  }
  return list.length > max ? null : list;
}

function parseOffice(value: unknown): Parsed<CompanyOffice> {
  if (!isRecord(value)) return bad;
  const id = recordId(value.id);
  const city = str(value.city, 100);
  const addressLines = lines(value.addressLines, MAX_LINES);
  const phones = lines(value.phones, MAX_LINES);
  if (!id || city === null || !addressLines || !phones) return bad;
  if (!city || !addressLines.length) return { ok: false, error: COMPANY_OFFICE_REQUIRED };
  return { ok: true, value: { id, city, addressLines, phones } };
}

/**
 * Sirket ve iletisim bilgilerini denetler ve temizler: metinler kirpilir,
 * MERSIS numarasindaki bosluklar atilir, e-posta kucuk harfe cevrilir,
 * bos adres ve telefon satirlari atlanir. Ilk ofis merkezdir.
 */
export function parseCompanySettings(value: unknown): Parsed<CompanySettings> {
  if (!isRecord(value) || !isRecord(value.social)) return bad;
  const legalName = str(value.legalName);
  const mersisNo = typeof value.mersisNo === "string" ? value.mersisNo.replace(/\s+/g, "") : null;
  const phone = str(value.phone, 50);
  const email = str(value.email);
  if (legalName === null || mersisNo === null || phone === null || email === null) return bad;
  if (!Array.isArray(value.offices) || value.offices.length > MAX_OFFICES) return bad;

  const social = {} as CompanySocial;
  for (const key of COMPANY_SOCIAL_KEYS) {
    const url = str(value.social[key], 500);
    if (url === null) return bad;
    social[key] = url;
  }

  const offices: CompanyOffice[] = [];
  for (const o of value.offices as unknown[]) {
    const parsed = parseOffice(o);
    if (!parsed.ok) return parsed;
    offices.push(parsed.value);
  }
  if (!unique(offices.map((o) => o.id))) return bad;

  if (!legalName) return { ok: false, error: COMPANY_NAME_REQUIRED };
  if (mersisNo && !/^\d{16}$/.test(mersisNo)) return { ok: false, error: COMPANY_MERSIS_INVALID };
  if (!phone) return { ok: false, error: COMPANY_PHONE_REQUIRED };
  if (!EMAIL.test(email)) return { ok: false, error: COMPANY_EMAIL_INVALID };
  if (!offices.length) return { ok: false, error: COMPANY_OFFICE_REQUIRED };
  if (!Object.values(social).every((url) => !url || /^https:\/\/\S+$/i.test(url))) return { ok: false, error: COMPANY_SOCIAL_INVALID };

  return { ok: true, value: { legalName, mersisNo, phone, email: email.toLowerCase(), offices, social } };
}

/** Sirket bilgilerinin karsilastirma anahtari; son degisiklik ani (updatedAt) haric. */
export const companyKey = (c: CompanySettings) =>
  JSON.stringify([
    c.legalName,
    c.mersisNo,
    c.phone,
    c.email,
    c.offices.map((o) => [o.id, o.city, o.addressLines, o.phones]),
    COMPANY_SOCIAL_KEYS.map((k) => c.social[k]),
  ]);

/* ------------------------------------------------------------------ */
/* E-posta alicilari (KARARLAR K-104)                                  */
/* ------------------------------------------------------------------ */

/**
 * Zenweld'e giden e-postalarin turleri, panelde gorunen sirayla
 * (IS-KURALLARI › Form e-postalari). Veritabanindaki liste
 * (packages/db › schema/system.ts › EMAIL_TYPES) ayni turlerdir.
 */
export const EMAIL_RECIPIENT_TYPES = [
  { type: "siparis", label: "Yeni sipariş" },
  { type: "iade", label: "İade talebi" },
  { type: "teklif", label: "Teklif talebi" },
  { type: "servis", label: "Servis talebi" },
  { type: "garanti", label: "Garanti kaydı" },
  { type: "yorum", label: "Ürün yorumu" },
  { type: "uye", label: "Yeni üye" },
  { type: "iletisim", label: "İletişim formu" },
  { type: "urun-destek", label: "Ürün destek sorusu" },
  { type: "bayilik", label: "Bayilik başvurusu" },
] as const;

export type EmailRecipientType = (typeof EMAIL_RECIPIENT_TYPES)[number]["type"];

/** Bir turde en fazla kac alici. */
export const MAX_RECIPIENTS = 10;


/**
 * Yazilan alicilar: virgul, noktali virgul, bosluk ya da satir sonuyla
 * ayrilir; kucuk harfe cevrilir, ayni adres bir kez alinir. Bos = varsayilan
 * adres.
 */
export function parseRecipients(text: string): Parsed<string[]> {
  const list = [...new Set(text.split(/[\s,;]+/).map((a) => a.trim().toLowerCase()).filter(Boolean))];
  const wrong = list.find((a) => !EMAIL.test(a) || a.length > 200);
  if (wrong) return { ok: false, error: `"${wrong}" geçerli bir e-posta adresi değil.` };
  if (list.length > MAX_RECIPIENTS) return { ok: false, error: `En fazla ${MAX_RECIPIENTS} adres yazılabilir.` };
  return { ok: true, value: list };
}

/**
 * Alici listesinin o anki hali (ekran acildiktan sonra degisti mi): satir
 * sayisi ve en son degisen satir. Panel ekrani ve sunucu ayni fonksiyonla
 * hesaplar.
 */
export function recipientsVersion(rows: Pick<EmailRecipient, "updatedAt">[]): string {
  const latest = rows.map((r) => r.updatedAt ?? "").sort().pop() ?? "";
  return `${rows.length}|${latest}`;
}
