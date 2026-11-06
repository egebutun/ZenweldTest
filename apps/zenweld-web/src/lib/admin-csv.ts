import { ROLE_LABELS } from "@zenweld/auth";
import type { Quote, User, UserStatus, WarrantyRecord } from "@zenweld/data";

/**
 * PANEL › CSV INDIR — SATIRLAR
 *
 * CSV listede o an secili suzgece uyan kayitlarin TAMAMINI icerir (yalnizca
 * gorunen sayfayi degil). Demo modunda satirlar tarayicidaki kayitlardan,
 * veritabani modunda sunucudan gelir (GET /api/yonetim/csv/<liste>); iki
 * modda da ayni sutunlar bu dosyadan uretilir.
 */

export type CsvRow = Record<string, string | number>;

export const QUOTE_STATUS_LABEL: Record<Quote["status"], string> = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  sent: "Teklif Gönderildi",
  won: "Kazanıldı",
  lost: "Kapandı",
};

export const PAYMENT_LABEL: Record<string, string> = {
  vadeli: "Vadeli",
  cek: "Çek",
  havale: "Havale/EFT",
  belirsiz: "Görüşülecek",
};

export function quoteCsvRows(quotes: Quote[]): CsvRow[] {
  return quotes.map((q) => ({
    kod: q.code,
    firma: q.companyName || q.contactName,
    yetkili: q.contactName,
    eposta: q.email,
    telefon: q.phone,
    sehir: q.city,
    odeme: PAYMENT_LABEL[q.paymentPreference],
    vade: q.termDays ?? "",
    urunler: q.items.map((i) => `${i.quantity}x ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}`).join(" | "),
    durum: QUOTE_STATUS_LABEL[q.status] ?? q.status,
    tarih: q.createdAt,
  }));
}

export function warrantyCsvRows(warranties: WarrantyRecord[], productName: (id: string) => string): CsvRow[] {
  return warranties.map((w) => ({
    seri_no: w.serialNumber,
    urun: productName(w.productId),
    sahibi: w.ownerName,
    eposta: w.email,
    telefon: w.phone,
    sehir: w.city,
    posta_kodu: w.postalCode,
    adres: w.address,
    satici_vkn: w.sellerTaxNumber,
    bitis: w.expiresAt,
    uzatilmis: w.extended ? "evet" : "hayır",
    kayit: w.registeredAt,
  }));
}

export const MEMBER_STATUS_LABEL: Record<UserStatus, string> = {
  active: "Aktif",
  suspended: "Askıda",
};

export function memberCsvRows(users: User[]): CsvRow[] {
  return users.map((u) => ({
    ad: u.firstName,
    soyad: u.lastName,
    eposta: u.email,
    rol: ROLE_LABELS[u.role],
    durum: MEMBER_STATUS_LABEL[u.status],
    firma: u.companyName ?? "",
    vergiNo: u.taxNumber ?? "",
    telefon: u.phone,
    sehir: u.city ?? "",
    kayitTarihi: u.createdAt,
  }));
}
