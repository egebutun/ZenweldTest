import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  checkReviewMedia,
  dealerApplicationFields,
  findVariant,
  FORM_CODE_DIGITS,
  isQuotable,
  isValidPostalCode,
  isValidSellerTaxNumber,
  normalizeSerial,
  parseDataUrl,
  PAYMENT_PREFERENCES,
  productOptionsView,
  QUOTE_TERM_DAYS,
  quoteCodePrefix,
  REVIEW_MEDIA,
  reviewMediaKey,
  reviewMediaSizeError,
  uploadAddress,
  SERVICE_COMPLAINT_MAX,
  SERVICE_REASONS,
  memberServiceRequest,
  provinceName,
  serviceCodePrefix,
  type MemberServiceRequest,
  warrantyExpiryDate,
  type ProductReview,
  type ReviewMedia,
  type Quote,
  type ServiceRequest,
  type WarrantyRecord,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { nextRecordCode } from "./codes";
import type { FileStorage } from "./file-storage";
import type { Member, OrderDb } from "./orders";
import { readQuotes, readServiceRequests, readWarranties, reviewRecord } from "./read";
import * as s from "./schema";

/**
 * FORMLAR SUNUCUDA (veritabani modu; Asama 5.3)
 *
 * Teklif Al, servis talebi, garanti kaydi ve urun yorumu sunucuda,
 * tarayicidaki formla ayni kurallarla (packages/data › forms.ts) yeniden
 * denetlenip yazilir; kayit numarasini sunucu verir. Urun ve kategori
 * bilgisi (ad, kod, secenek adi) tarayicidan degil katalogdan alinir.
 *
 * Yalnizca e-postaya giden formlar (iletisim, bayilik, urun destek sorusu)
 * da kendi tablolarina yazilir (KARARLAR K-81). Gonderilen
 * her e-posta email_log'a yazilir (emails.ts › logEmail).
 *
 * Yazan fonksiyonlar bir islem (transaction) icinde cagrilir.
 */

/** Formlarin denetiminde kullanilan katalog parcasi. */
export type FormCatalog = Pick<ZenweldDatabase, "products" | "categories" | "optionDefinitions">;

export interface FormFailure {
  ok: false;
  status: 400 | 404 | 409;
  error: string;
}

const fail = (status: FormFailure["status"], error: string): FormFailure => ({ ok: false, status, error });
const text = (value: unknown, maxLength = 200) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const newId = (prefix: string) => `${prefix}-${randomBytes(8).toString("hex")}`;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const MAX_QUOTE_LINES = 100;
const MAX_QUOTE_QUANTITY = 9999;

/* ------------------------------- Teklif ------------------------------- */

/**
 * Teklif Al. Firma adi bireysel uye disinda zorunludur; ad soyad, telefon ve
 * gecerli e-posta zorunludur; listede en az bir urun olmalidir.
 */
export async function createQuote(
  db: OrderDb,
  member: Member | null,
  input: Record<string, unknown>,
  at: Date,
  catalog: FormCatalog,
): Promise<{ ok: true; quote: Quote } | FormFailure> {
  const fields = {
    companyName: text(input.companyName),
    contactName: text(input.contactName),
    email: text(input.email),
    phone: text(input.phone, 40),
    taxNumber: text(input.taxNumber, 20),
    city: text(input.city, 80),
    message: text(input.message, 4000),
  };
  if ((member?.role !== "individual" && !fields.companyName) || !fields.contactName || !fields.phone) {
    return fail(400, tr.quote.required);
  }
  if (!isEmail(fields.email)) return fail(400, tr.quote.invalidEmail);
  const paymentPreference = PAYMENT_PREFERENCES.find((p) => p === input.paymentPreference);
  if (!paymentPreference) return fail(400, tr.quote.required);
  const termDays = paymentPreference === "vadeli" ? Number(input.termDays) : undefined;
  if (termDays !== undefined && !QUOTE_TERM_DAYS.includes(termDays)) return fail(400, tr.quote.required);

  const wanted = Array.isArray(input.items) ? input.items.map(record) : [];
  if (wanted.length === 0) return fail(400, tr.quote.emptyList);
  if (wanted.length > MAX_QUOTE_LINES) return fail(400, tr.quote.listChanged);
  const items: Quote["items"] = [];
  const variants: (string | null)[] = [];
  for (const w of wanted) {
    const product = catalog.products.find((p) => p.id === w.productId && isQuotable(p));
    const quantity = Number(w.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUOTE_QUANTITY) {
      return fail(409, tr.quote.listChanged);
    }
    const view = productOptionsView(product, catalog.optionDefinitions);
    const variant = view ? findVariant(view, typeof w.variantId === "string" ? w.variantId : undefined) : undefined;
    if (view && !variant) return fail(409, tr.quote.listChanged);
    items.push({
      productId: product.id,
      productName: product.name,
      sku: variant?.sku || product.sku,
      variantLabel: variant?.fullLabel,
      quantity,
    });
    variants.push(variant?.id ?? null);
  }

  const id = newId("q");
  const code = await nextRecordCode(db, s.quotes, quoteCodePrefix(at), FORM_CODE_DIGITS);
  await db.insert(s.quotes).values({
    id,
    code,
    userId: member?.id ?? null,
    status: "new",
    ...fields,
    taxNumber: fields.taxNumber || null,
    paymentPreference,
    termDays: termDays ?? null,
    message: fields.message || null,
    createdAt: at,
    updatedAt: at,
  });
  await db.insert(s.quoteItems).values(
    items.map((item, line) => ({
      quoteId: id,
      line,
      productId: item.productId,
      variantId: variants[line],
      productName: item.productName,
      sku: item.sku ?? null,
      variantLabel: item.variantLabel ?? null,
      quantity: item.quantity,
    })),
  );
  const [quote] = await readQuotes(db, eq(s.quotes.id, id));
  return { ok: true, quote };
}

/** Uyenin teklifleri (Hesabim › Tekliflerim). */
export const memberQuotes = (db: OrderDb, userId: string) => readQuotes(db, eq(s.quotes.userId, userId));

/* ---------------------------- Servis talebi ---------------------------- */

/** Servis talebi: butun alanlar, en az bir neden ve gizlilik onayi zorunlu; model secilen kategoride. */
export async function createServiceRequest(
  db: OrderDb,
  member: Member | null,
  input: Record<string, unknown>,
  at: Date,
  catalog: FormCatalog,
): Promise<{ ok: true; request: ServiceRequest } | FormFailure> {
  const fields = {
    complaint: text(input.complaint, SERVICE_COMPLAINT_MAX),
    companyName: text(input.companyName),
    address: text(input.address, 500),
    city: text(input.city, 80),
    district: text(input.district, 80),
    email: text(input.email),
    phone: text(input.phone, 40),
    contactName: text(input.contactName),
    contactGsm: text(input.contactGsm, 40),
  };
  const categorySlug = text(input.categorySlug);
  const category = catalog.categories.find((c) => c.slug === categorySlug);
  const product = catalog.products.find((p) => p.id === input.productId && p.active && p.categorySlug === categorySlug);
  if (!category || !product || Object.values(fields).some((v) => !v)) return fail(400, tr.service.required);
  // Il 81 illik listeden (KARARLAR K-117); listedeki yazimiyla saklanir.
  const city = provinceName(fields.city);
  if (!city) return fail(400, tr.service.cityInvalid);
  fields.city = city;
  if (!isEmail(fields.email)) return fail(400, tr.quote.invalidEmail);
  const reasons = SERVICE_REASONS.filter((r) => Array.isArray(input.reasons) && input.reasons.includes(r));
  if (reasons.length === 0) return fail(400, tr.service.reasonRequired);
  if (input.consent !== true) return fail(400, tr.service.consentRequired);

  const id = newId("srv");
  const code = await nextRecordCode(db, s.serviceRequests, serviceCodePrefix(at), FORM_CODE_DIGITS);
  await db.insert(s.serviceRequests).values({
    id,
    code,
    status: "new",
    categoryId: category.id,
    productId: product.id,
    productName: product.name,
    reasons,
    ...fields,
    userId: member?.id ?? null,
    createdAt: at,
    updatedAt: at,
  });
  const [request] = await readServiceRequests(db, eq(s.serviceRequests.id, id));
  return { ok: true, request };
}

/** Uyenin servis talepleri (Hesabim › Servis Taleplerim): ic not ve atanan servis yok (KARARLAR K-117). */
export async function memberServiceRequests(db: OrderDb, userId: string): Promise<MemberServiceRequest[]> {
  return (await readServiceRequests(db, eq(s.serviceRequests.userId, userId))).map(memberServiceRequest);
}

/* ------------------------------- Garanti ------------------------------- */

/**
 * Garanti kaydi. Seri numarasi buyuk harfle saklanir ve ikinci kez
 * kaydedilemez; e-posta kucuk harfle (Garantilerim uyenin e-postasiyla
 * eslesir). Bitis tarihi kayit gunu + urunun garanti suresi (+12 ay).
 */
export async function registerWarranty(
  db: OrderDb,
  input: Record<string, unknown>,
  at: Date,
  catalog: FormCatalog,
): Promise<{ ok: true; warranty: WarrantyRecord; productName: string } | FormFailure> {
  const fields = {
    ownerName: text(input.ownerName),
    email: text(input.email).toLowerCase(),
    phone: text(input.phone, 40),
    city: text(input.city, 80),
    postalCode: text(input.postalCode, 5),
    address: text(input.address, 500),
    sellerTaxNumber: text(input.sellerTaxNumber, 11),
  };
  const serialNumber = normalizeSerial(text(input.serialNumber, 60));
  const categorySlug = text(input.categorySlug);
  const category = catalog.categories.find((c) => c.slug === categorySlug);
  const product = catalog.products.find((p) => p.id === input.productId && p.active && p.categorySlug === categorySlug);
  if (!category || !product || !serialNumber || Object.values(fields).some((v) => !v)) return fail(400, tr.warranty.required);
  if (!isEmail(fields.email)) return fail(400, tr.quote.invalidEmail);
  if (!isValidPostalCode(fields.postalCode)) return fail(400, tr.warranty.invalidPostalCode);
  if (!isValidSellerTaxNumber(fields.sellerTaxNumber)) return fail(400, tr.warranty.invalidSellerTaxNumber);
  const extended = input.extended === true;

  const id = newId("w");
  // Ayni seri numarasi ayni anda iki kez gelirse veritabanindaki tekillik kurali ikincisini reddeder.
  const inserted = await db
    .insert(s.warranties)
    .values({
      id,
      serialNumber,
      categoryId: category.id,
      productId: product.id,
      productName: product.name,
      ...fields,
      registeredAt: at,
      expiresAt: warrantyExpiryDate(at, product.warrantyMonths ?? 12, extended),
      extended,
      updatedAt: at,
    })
    .onConflictDoNothing()
    .returning({ id: s.warranties.id });
  if (inserted.length === 0) return fail(409, tr.warranty.duplicateSerial);
  const [warranty] = await readWarranties(db, eq(s.warranties.id, id));
  return { ok: true, warranty, productName: product.name };
}

/** Garanti sorgulamada gosterilen bilgi (seri numarasini bilen herkes gorur). */
export type WarrantyLookup = Pick<
  WarrantyRecord,
  "serialNumber" | "productId" | "ownerName" | "registeredAt" | "expiresAt" | "extended"
>;

/** Seri numarasiyla garanti sorgulama (buyuk/kucuk harf ve bas/son bosluk fark etmez). */
export async function findWarranty(db: OrderDb, serial: unknown): Promise<WarrantyLookup | null> {
  const target = normalizeSerial(text(serial, 60));
  if (!target) return null;
  const [w] = await readWarranties(db, sql`upper(${s.warranties.serialNumber}) = ${target}`);
  if (!w) return null;
  const { serialNumber, productId, ownerName, registeredAt, expiresAt, extended } = w;
  return { serialNumber, productId, ownerName, registeredAt, expiresAt, extended };
}

/** Uyenin garantileri: kayittaki e-posta buyuk/kucuk harf gozetmeden eslesir. */
export const memberWarranties = (db: OrderDb, email: string) =>
  readWarranties(db, sql`lower(${s.warranties.email}) = ${email.trim().toLowerCase()}`);

/* ------------------------------ Urun yorumu ------------------------------ */

/**
 * Yorumun dosyalari (fotograf ve video; KARARLAR K-128): tarayici dosyayi
 * data: adresi olarak gonderir; tur dosyanin iceriginden, boyut ve sayi
 * REVIEW_MEDIA'dan denetlenir. Dosya deposu varsa dosyalar depoya yazilir,
 * kayitta adresleri (/dosya/yorum/…) kalir; depo yoksa (yalnizca
 * bilgisayardaki denemelerde) dosyalar alinmaz, yorumun yazisi kaydedilir.
 */
async function reviewMedia(
  input: unknown,
  storage: FileStorage | null,
  at: Date,
): Promise<{ ok: true; media: ReviewMedia[] } | { ok: false; error: string }> {
  const items = Array.isArray(input) ? input.map(record) : [];
  if (items.length > REVIEW_MEDIA.maxFiles) return { ok: false, error: tr.reviews.errorSave };
  const files: { kind: "image" | "video"; bytes: Buffer; ext: string }[] = [];
  for (const item of items) {
    const kind = item.kind;
    const data = typeof item.url === "string" ? parseDataUrl(item.url) : null;
    if ((kind !== "image" && kind !== "video") || !data || !data.mime.startsWith(`${kind}/`)) return { ok: false, error: tr.reviews.errorSave };
    // Base64 metin sinirin cok ustundeyse cozulmeden reddedilir.
    if (data.base64.length > Math.ceil((REVIEW_MEDIA[kind].maxBytes * 4) / 3) + 4) return { ok: false, error: reviewMediaSizeError(kind) };
    const bytes = Buffer.from(data.base64, "base64");
    const checked = checkReviewMedia(kind, bytes);
    if (!checked.ok) return checked;
    files.push({ kind, bytes, ext: checked.ext });
  }
  if (files.reduce((sum, f) => sum + f.bytes.length, 0) > REVIEW_MEDIA.totalBytes) {
    return { ok: false, error: `Dosyalar toplamda en fazla ${REVIEW_MEDIA.totalBytes / (1024 * 1024)} MB olabilir.` };
  }
  if (!storage) {
    if (files.length > 0) console.warn("Dosya deposu tanımlı değil (DOSYA_KLASORU): yorumun dosyaları alınmadı.");
    return { ok: true, media: [] };
  }
  const media: ReviewMedia[] = [];
  for (const file of files) {
    const key = reviewMediaKey(at, randomBytes(8).toString("hex"), file.ext);
    await storage.put(key, file.bytes);
    media.push({ url: uploadAddress(key), kind: file.kind });
  }
  return { ok: true, media };
}

/** Urun yorumu: yayinda olan urun, 1–5 puan, ad ve yorum zorunlu. Yorum panel onayi bekler. */
export async function createReview(
  db: OrderDb,
  member: Member | null,
  input: Record<string, unknown>,
  at: Date,
  catalog: FormCatalog,
  storage: FileStorage | null,
): Promise<{ ok: true; review: ProductReview; productName: string } | FormFailure> {
  const product = catalog.products.find((p) => p.id === input.productId && p.active);
  if (!product) return fail(404, tr.reviews.errorSave);
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(400, tr.reviews.errorRating);
  const authorName = text(input.authorName, 80);
  if (!authorName) return fail(400, tr.reviews.errorName);
  const body = text(input.body, 4000);
  if (!body) return fail(400, tr.reviews.errorBody);
  // Dosyalar en son, diger alanlar dogruysa depoya yazilir.
  const files = await reviewMedia(input.media, storage, at);
  if (!files.ok) return fail(400, files.error);

  const [row] = await db
    .insert(s.reviews)
    .values({
      id: newId("rv"),
      productId: product.id,
      userId: member?.id ?? null,
      authorName,
      rating,
      title: text(input.title, 120) || null,
      body,
      media: files.media,
      // Uye girisi olanlar "dogrulanmis alici" sayilir (bugunku kural).
      verifiedPurchase: Boolean(member),
      // Yeni yorumlar once yonetim panelinde onaylanir.
      approved: false,
      featured: false,
      createdAt: at,
      updatedAt: at,
    })
    .returning();
  return { ok: true, review: reviewRecord(row), productName: product.name };
}

/* ------------------- Yalnizca e-postaya giden formlar ------------------- */

/** Bayilik basvurusu (/api/bayilik alanlariyla; alan kurali packages/data › dealerApplicationFields). */
export async function saveDealerApplication(db: OrderDb, member: Member | null, v: Record<string, string>, at: Date) {
  const id = newId("bas");
  const f = dealerApplicationFields(v);
  await db.insert(s.dealerApplications).values({
    id,
    status: "new",
    companyName: f.companyName,
    taxInfo: f.taxInfo ?? null,
    city: f.city ?? null,
    sector: f.sector ?? null,
    yearsInSector: f.yearsInSector ?? null,
    brands: f.brands ?? null,
    hasShowroom: f.hasShowroom ?? null,
    hasService: f.hasService ?? null,
    contactName: f.contactName ?? null,
    email: f.email,
    phone: f.phone ?? null,
    message: f.message ?? null,
    userId: member?.id ?? null,
    createdAt: at,
    updatedAt: at,
  });
  return id;
}

/** Iletisim formu ya da urun sayfasindaki destek sorusu. */
export async function saveSupportMessage(
  db: OrderDb,
  member: Member | null,
  message: {
    type: "iletisim" | "urun-destek";
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message: string;
    productSku?: string;
    productName?: string;
    pageUrl?: string;
  },
  at: Date,
) {
  const id = newId("msg");
  const [product] = message.productSku
    ? await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.sku, message.productSku))
    : [];
  await db.insert(s.supportMessages).values({
    id,
    type: message.type,
    status: "new",
    name: message.name || null,
    email: message.email || null,
    phone: message.phone || null,
    subject: message.subject || null,
    message: message.message,
    productId: product?.id ?? null,
    productName: message.productName || null,
    productSku: message.productSku || null,
    pageUrl: message.pageUrl || null,
    userId: member?.id ?? null,
    createdAt: at,
    updatedAt: at,
  });
  return id;
}
