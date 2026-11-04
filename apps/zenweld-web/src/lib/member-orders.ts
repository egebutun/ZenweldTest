"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order, ReturnRequest } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { cancelExpiredTransfers, createReturnRequest, ordersForUser, returnRequestsForOrder, useDatabase } from "@zenweld/store";
import { useT } from "./i18n-client";
import { accountRequest } from "./account-api";
import { notifyZenweld } from "./notify";
import { returnNotice } from "./order-text";

/**
 * UYENIN SIPARISLERI VE IADE TALEPLERI (Hesabim; KARARLAR K-97)
 *
 * Veritabani modunda sunucudan okunur (/api/siparis/liste; Asama 5.2):
 * sunucu once odeme suresi dolan havale siparislerini iptal eder. Demo
 * modunda tarayicidaki veriden; sure dolan havale burada iptal edilir.
 */

const ORDERS_API = "/api/siparis";

export interface ReturnInput {
  order: Order;
  items: { line: number; quantity: number }[];
  reason: ReturnRequest["reason"];
  note?: string;
}

export function useMemberOrders() {
  const t = useT();
  const { user, api } = useAuth();
  const db = useDatabase();
  const server = api !== null;
  const userId = user?.id ?? null;
  const [remote, setRemote] = useState<{ orders: Order[]; returnRequests: ReturnRequest[] } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!server) {
      cancelExpiredTransfers();
      return;
    }
    if (!userId) {
      setRemote(null);
      return;
    }
    let active = true;
    void accountRequest<{ orders: Order[]; returnRequests: ReturnRequest[] }>(ORDERS_API, "liste").then((answer) => {
      if (active) setRemote(answer.ok ? { orders: answer.orders, returnRequests: answer.returnRequests } : { orders: [], returnRequests: [] });
    });
    return () => {
      active = false;
    };
  }, [server, userId, version]);

  const orders = server ? (remote?.orders ?? []) : userId ? ordersForUser(userId, db) : [];
  const returnsFor = (orderId: string) =>
    server ? (remote?.returnRequests ?? []).filter((r) => r.orderId === orderId) : returnRequestsForOrder(orderId, db);

  /** Iade talebi; basariliysa talep numarasi doner. */
  const requestReturn = useCallback(
    async ({ order, items, reason, note }: ReturnInput): Promise<{ ok: true; code: string } | { ok: false; error: string }> => {
      if (server) {
        const answer = await accountRequest<{ code: string }>(ORDERS_API, "iade", { orderCode: order.code, items, reason, note });
        if (answer.ok) setVersion((v) => v + 1);
        return answer.ok ? { ok: true, code: answer.code } : answer;
      }
      const record = userId
        ? createReturnRequest({
            orderId: order.id,
            orderCode: order.code,
            userId,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            items: items.map(({ line, quantity }) => {
              const item = order.items[line];
              return { line, quantity, productId: item.productId, productName: item.productName, sku: item.sku, variantLabel: item.variantLabel };
            }),
            reason,
            note,
          })
        : false;
      if (!record) return { ok: false, error: t.returns.failed };
      // Talep panelde Iade Talepleri'nde; info@zenweld.com'a da haber verilir.
      void notifyZenweld("iade", returnNotice(record, t), "");
      return { ok: true, code: record.code };
    },
    [server, userId, t],
  );

  return { orders, returnsFor, requestReturn, ready: !server || !userId || remote !== null };
}
