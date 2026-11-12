"use client";

import {
  featuredReviewLimitText,
  toggledWarrantyExpiry,
  type DealerApplication,
  type ProductReview,
  type Quote,
  type ServiceRequest,
  type ServiceRequestStatus,
  type SupportMessage,
  type WarrantyRecord,
} from "@zenweld/data";
import {
  deleteQuote,
  deleteReview,
  deleteWarranty,
  saveQuote,
  saveReview,
  saveServiceRequest,
  saveWarranty,
  setDealerApplicationStatus,
  setSupportMessageStatus,
  toggleFeaturedReview,
} from "@zenweld/store";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › TALEPLER ISLEMLERI (teklifler, servis talepleri, garantiler,
 * yorumlar; bayilik basvurulari, mesajlar)
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/talepler; Asama 5,
 * 2. alan, KARARLAR K-99, K-100). Demo modunda tarayicidaki veriye yazilir
 * (basvuru ve mesaj dahil; KARARLAR K-109).
 */
export function useRequestActions() {
  const { server, pending, call } = usePanelCall("talepler");
  const quote = (q: Quote) => recordRef("quotes", q);
  const service = (r: ServiceRequest) => recordRef("service_requests", r);
  const warranty = (w: WarrantyRecord) => recordRef("warranties", w);
  const review = (r: ProductReview) => recordRef("reviews", r);

  return {
    server,
    pending,

    /** Durum, temsilci ya da ic not; yalnizca verilen alan degisir. */
    saveQuote: (q: Quote, patch: Partial<Pick<Quote, "status" | "assignedTo" | "adminNote">>) =>
      server ? call("teklif", { ...quote(q), ...patch }, "quotes") : (saveQuote({ ...q, ...patch }), localAnswer()),
    deleteQuote: (q: Quote) => (server ? call("teklif-sil", quote(q)) : (deleteQuote(q.id), localAnswer())),

    saveServiceRequest: (r: ServiceRequest, status: ServiceRequestStatus, adminNote: string) =>
      server
        ? call("servis", { ...service(r), status, adminNote }, "service_requests")
        : localAnswer(saveServiceRequest({ ...r, status, adminNote: adminNote || undefined })),

    setWarrantyExpiry: (w: WarrantyRecord, expiresAt: string) =>
      server ? call("garanti", { ...warranty(w), expiresAt }, "warranties") : (saveWarranty({ ...w, expiresAt }), localAnswer()),
    /** Uzatilmis garanti: bitis tarihine 12 ay eklenir ya da cikarilir. */
    setWarrantyExtended: (w: WarrantyRecord, extended: boolean) =>
      server
        ? call("garanti", { ...warranty(w), extended }, "warranties")
        : (saveWarranty({ ...w, extended, expiresAt: toggledWarrantyExpiry(w.expiresAt, extended) }), localAnswer()),
    deleteWarranty: (w: WarrantyRecord) =>
      server ? call("garanti-sil", warranty(w)) : (deleteWarranty(w.id), localAnswer()),

    /** Onayla ya da yayindan kaldir (kaldirilan yorum anasayfadan da cikar). */
    setReviewApproved: (r: ProductReview, approved: boolean) =>
      server
        ? call("yorum-onay", { ...review(r), approved }, "reviews")
        : (saveReview({ ...r, approved, featured: approved ? r.featured : false }), localAnswer()),
    setReviewFeatured: (r: ProductReview, featured: boolean): Promise<PanelAnswer> => {
      if (server) return call("yorum-anasayfa", { ...review(r), featured }, "reviews");
      return Promise.resolve(toggleFeaturedReview(r.id) ? { ok: true } : { ok: false, error: featuredReviewLimitText() });
    },
    deleteReview: (r: ProductReview) => (server ? call("yorum-sil", review(r)) : (deleteReview(r.id), localAnswer())),

    // Form kayitlari: demo modunda tarayicida (KARARLAR K-109).
    saveApplication: (a: DealerApplication, status: DealerApplication["status"], adminNote: string) =>
      server
        ? call("basvuru", { ...recordRef("dealer_applications", a), status, adminNote }, "dealer_applications")
        : localAnswer(setDealerApplicationStatus(a.id, status, adminNote)),
    saveMessage: (m: SupportMessage, status: SupportMessage["status"], adminNote: string) =>
      server
        ? call("mesaj", { ...recordRef("support_messages", m), status, adminNote }, "support_messages")
        : localAnswer(setSupportMessageStatus(m.id, status, adminNote)),
  };
}
