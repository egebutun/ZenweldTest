"use client";

import { useEffect } from "react";
import { useAuth } from "@zenweld/auth";
import type { Coupon, CouponDraft, Order, ReturnRequest, ReturnRequestStatus } from "@zenweld/data";
import {
  cancelExpiredTransfers,
  cancelOrder,
  deleteCoupon,
  markOrderDelivered,
  markOrderPaid,
  saveCoupon,
  saveOrderAdminNote,
  saveReturnRequest,
  shipOrder,
} from "@zenweld/store";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › SATIS ISLEMLERI (siparisler, iade talepleri, kuponlar)
 *
 * Ekranlar islemleri buradan yapar; demo ve veritabani modunda ayni sonucu
 * alir: { ok: true } ya da { ok: false, error }. Veritabani modunda islem
 * sunucuya gider (/api/yonetim/satis; Asama 5, 1. alan, KARARLAR K-99;
 * ortak akis: lib/admin-panel.ts). Demo modunda tarayicidaki veriye yazilir
 * (packages/store).
 */
export function useSalesActions() {
  const { server, pending, call } = usePanelCall("satis");
  const order = (o: Order) => recordRef("orders", o);
  const request = (r: ReturnRequest) => recordRef("return_requests", r);
  const coupon = (c: Coupon) => recordRef("coupons", c);

  return {
    server,
    pending,

    markPaid: (o: Order) =>
      server ? call("odeme-alindi", order(o), "orders") : (markOrderPaid(o.id), localAnswer()),
    ship: (o: Order, carrier: string, trackingNumber: string) =>
      server
        ? call("kargo", { ...order(o), carrier, trackingNumber }, "orders")
        : (shipOrder(o.id, carrier, trackingNumber), localAnswer()),
    markDelivered: (o: Order) =>
      server ? call("teslim", order(o), "orders") : (markOrderDelivered(o.id), localAnswer()),
    cancel: (o: Order, note?: string) =>
      server ? call("iptal", { ...order(o), note }, "orders") : (cancelOrder(o.id, note), localAnswer()),
    saveOrderNote: (o: Order, adminNote: string) =>
      server ? call("siparis-notu", { ...order(o), adminNote }, "orders") : localAnswer(saveOrderAdminNote(o.id, adminNote)),
    /** Basarisiz SAP aktarimini yeniden siraya alir (yalnizca veritabani modunda; demo modunda SAP yok). */
    requeueSap: (o: Order) => (server ? call("sap-yeniden", { id: o.id }) : localAnswer(false)),

    saveReturnRequest: (r: ReturnRequest, status: ReturnRequestStatus, adminNote: string) =>
      server
        ? call("iade-talebi", { ...request(r), status, adminNote }, "return_requests")
        : localAnswer(saveReturnRequest({ ...r, status, adminNote: adminNote || undefined })),

    /** Yeni kupon (c yok) ya da duzenleme; basarida id doner. */
    saveCoupon: (draft: CouponDraft, c?: Coupon): Promise<PanelAnswer> => {
      if (server) return call("kupon", c ? { ...draft, ...coupon(c) } : draft, "coupons");
      const result = saveCoupon({ ...draft, id: c?.id });
      return Promise.resolve(result.ok ? { ok: true, id: result.id } : result);
    },
    setCouponActive: (c: Coupon, active: boolean): Promise<PanelAnswer> => {
      if (server) return call("kupon-durum", { ...coupon(c), active }, "coupons");
      const result = saveCoupon({ ...c, active });
      return Promise.resolve(result.ok ? { ok: true } : result);
    },
    deleteCoupon: (c: Coupon) => (server ? call("kupon-sil", coupon(c)) : localAnswer(deleteCoupon(c.id))),
  };
}

/**
 * Demo modunda odeme suresi dolan havale siparisleri siparis ekranlari
 * acilinca iptal edilir (sunucu yok). Veritabani modunda bunu sunucu,
 * ekranin verisini okurken yapar.
 */
export function useDemoExpiredTransfers(): void {
  const { api } = useAuth();
  useEffect(() => {
    if (api === null) cancelExpiredTransfers();
  }, [api]);
}
