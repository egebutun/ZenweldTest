"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import type { Coupon, CouponDraft, Order, ReturnRequest, ReturnRequestStatus } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
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

/**
 * PANEL › SATIS ISLEMLERI (siparisler, iade talepleri, kuponlar)
 *
 * Ekranlar islemleri buradan yapar; demo ve veritabani modunda ayni sonucu
 * alir: { ok: true } ya da { ok: false, error }.
 *
 * - Veritabani modunda islem sunucuya gider (/api/yonetim/satis; Asama 5,
 *   1. alan, KARARLAR K-99). Basarili olunca ekranin verisi sunucudan
 *   yeniden okunur (router.refresh). Kayit ekran acildiktan sonra
 *   degismisse sunucu kaydetmez ve "sayfayi yenileyin" der.
 * - Demo modunda tarayicidaki veriye yazilir (packages/store).
 *
 * pending: istek ya da ardindan gelen yenileme surerken true (dugmeler
 * kapatilir, ayni islem iki kez gonderilmez).
 */

export type PanelAnswer = { ok: true; id?: string } | { ok: false; error: string };

const done = (written = true, id?: string): Promise<PanelAnswer> =>
  Promise.resolve(written ? { ok: true, id } : { ok: false, error: tr.panel.failed });

/** Kaydin kimligi ve ekranin gordugu son degisiklik ani. */
const ref = (record: { id: string; updatedAt: string }) => ({ id: record.id, updatedAt: record.updatedAt });

export function useSalesActions() {
  const { api } = useAuth();
  const server = api !== null;
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const call = async (action: string, body: object): Promise<PanelAnswer> => {
    setSending(true);
    try {
      const response = await fetch(`/api/yonetim/satis/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const answer = (await response.json().catch(() => null)) as PanelAnswer | null;
      if (!answer || typeof answer.ok !== "boolean") return { ok: false, error: tr.panel.failed };
      if (answer.ok) startRefresh(() => router.refresh());
      return answer;
    } catch {
      return { ok: false, error: tr.panel.failed };
    } finally {
      setSending(false);
    }
  };

  return {
    server,
    pending: sending || refreshing,

    markPaid: (order: Order) => (server ? call("odeme-alindi", ref(order)) : done(markOrderPaid(order.id) || true)),
    ship: (order: Order, carrier: string, trackingNumber: string) =>
      server
        ? call("kargo", { ...ref(order), carrier, trackingNumber })
        : (shipOrder(order.id, carrier, trackingNumber), done()),
    markDelivered: (order: Order) =>
      server ? call("teslim", ref(order)) : (markOrderDelivered(order.id), done()),
    cancel: (order: Order, note?: string) =>
      server ? call("iptal", { ...ref(order), note }) : (cancelOrder(order.id, note), done()),
    saveOrderNote: (order: Order, adminNote: string) =>
      server ? call("siparis-notu", { ...ref(order), adminNote }) : done(saveOrderAdminNote(order.id, adminNote)),

    saveReturnRequest: (request: ReturnRequest, status: ReturnRequestStatus, adminNote: string) =>
      server
        ? call("iade-talebi", { ...ref(request), status, adminNote })
        : done(saveReturnRequest({ ...request, status, adminNote: adminNote || undefined })),

    /** Yeni kupon (coupon yok) ya da duzenleme; basarida id doner. */
    saveCoupon: (draft: CouponDraft, coupon?: Coupon): Promise<PanelAnswer> => {
      if (server) return call("kupon", coupon ? { ...draft, ...ref(coupon) } : draft);
      const result = saveCoupon({ ...draft, id: coupon?.id });
      return Promise.resolve(result.ok ? { ok: true, id: result.id } : result);
    },
    setCouponActive: (coupon: Coupon, active: boolean) =>
      server ? call("kupon-durum", { ...ref(coupon), active }) : saveCouponActive(coupon, active),
    deleteCoupon: (coupon: Coupon) =>
      server ? call("kupon-sil", ref(coupon)) : done(deleteCoupon(coupon.id)),
  };
}

function saveCouponActive(coupon: Coupon, active: boolean): Promise<PanelAnswer> {
  const result = saveCoupon({ ...coupon, active });
  return Promise.resolve(result.ok ? { ok: true } : result);
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
