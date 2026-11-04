import type { ProductReview, Quote, ServiceRequest, WarrantyRecord } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";

/**
 * FORM BILDIRIMLERININ METINLERI (sayfalar ve sunucu)
 *
 * info@zenweld.com'a giden "Yeni teklif / servis / garanti / yorum"
 * bildirimlerinin alanlari (lib/server/notify.ts). Veritabani modunda
 * bildirimi kaydi yapan sunucu gonderir (Asama 5.3); demo modunda tarayici.
 */

export function quoteNotice(quote: Quote, t: Dictionary) {
  return {
    code: quote.code,
    companyName: quote.companyName,
    contactName: quote.contactName,
    email: quote.email,
    phone: quote.phone,
    taxNumber: quote.taxNumber,
    city: quote.city,
    items: quote.items.map(
      (i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} · ${i.sku}`,
    ),
    payment:
      quote.paymentPreference === "vadeli"
        ? `${t.quote.vadeli} (${quote.termDays} gün)`
        : t.quote[quote.paymentPreference],
    message: quote.message,
  };
}

export function serviceNotice(request: ServiceRequest, t: Dictionary) {
  return {
    code: request.code,
    productName: request.productName,
    reasons: request.reasons.map((r) => t.service.reasons[r]),
    companyName: request.companyName,
    contactName: request.contactName,
    email: request.email,
    phone: request.phone,
    contactGsm: request.contactGsm,
    address: request.address,
    district: request.district,
    city: request.city,
    complaint: request.complaint,
  };
}

export function warrantyNotice(warranty: WarrantyRecord, productName: string) {
  return {
    productName,
    serialNumber: warranty.serialNumber,
    ownerName: warranty.ownerName,
    email: warranty.email,
    phone: warranty.phone,
    city: warranty.city,
    postalCode: warranty.postalCode,
    address: warranty.address,
    sellerTaxNumber: warranty.sellerTaxNumber,
    extended: warranty.extended ? "Evet" : "Hayır",
  };
}

export function reviewNotice(review: ProductReview, productName: string) {
  return {
    productName,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    media: review.media.length ? `${review.media.length} dosya (panelde görülebilir)` : "Yok",
  };
}
