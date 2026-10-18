"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import type { Order, OrderAddress } from "@zenweld/data";
import { cancelExpiredTransfers, getShopSettings, ordersForUser, useDatabase } from "@zenweld/store";
import { Alert, EmptyState, Modal } from "@zenweld/ui";
import { formatDate, formatDateTime, formatPrice } from "@zenweld/utils";
import Link from "next/link";
import { BankAccounts, CopyButton } from "@/components/shop/BankAccounts";
import {
  useDocumentTitle,
  LegalDocument,
  type LegalContext,
  type LegalDocumentKind,
} from "@/components/shop/LegalDocument";
import { OrderStatusBadge, OrderTimeline } from "@/components/shop/OrderParts";
import { useT } from "@/lib/i18n-client";

const addressLines = (a: OrderAddress) => [a.fullName, a.phone, a.line, `${a.district} / ${a.city}`];

function OrderDetail() {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const params = useParams<{ code: string }>();
  const isNew = useSearchParams().get("yeni") === "1";
  const [doc, setDoc] = useState<LegalDocumentKind | null>(null);
  const docTitle = useDocumentTitle();

  useEffect(() => cancelExpiredTransfers(), []);

  if (!user) return null;
  // Musteri yalnizca kendi siparisini gorebilir.
  const order = ordersForUser(user.id, db).find((o) => o.code === decodeURIComponent(params.code));
  if (!order) {
    return <EmptyState title={t.orders.notFound} />;
  }

  const shop = getShopSettings(db);
  const paymentText = paymentSummary(order, t);

  return (
    <div className="space-y-6">
      <Link href="/hesabim/siparislerim" className="text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600">
        ← {t.orders.backToOrders}
      </Link>

      {isNew && (
        <div className="flex items-start gap-3 rounded-[4px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
          <CheckCircle2 size={24} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-display text-xl font-bold uppercase">{t.orders.successTitle}</div>
            <p className="text-sm">
              {order.payment.method === "card" ? t.orders.successCard : t.orders.successTransfer}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold">{order.code}</h2>
        <OrderStatusBadge status={order.status} />
        <span className="ml-auto text-sm text-zw-grey-500">
          {t.orders.date}: {formatDateTime(order.createdAt)}
        </span>
      </div>

      <Box title={t.orders.timeline}>
        <OrderTimeline order={order} />
      </Box>

      {order.status === "awaiting_payment" && order.payment.dueAt && (
        <Box title={t.orders.transfer}>
          <Alert tone="warning">
            {t.orders.awaitingTransfer
              .replace("{date}", formatDate(order.payment.dueAt))
              .replace("{code}", order.code)}
          </Alert>
          <div className="mt-4">
            <BankAccounts accounts={shop.bankAccounts} />
          </div>
        </Box>
      )}

      {order.shipment && (
        <Box title={t.orders.status.shipped}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <span className="flex items-center gap-2">
              <Truck size={18} className="text-zw-red-600" />
              <span className="text-zw-grey-500">{t.orders.carrier}:</span>
              <strong>{order.shipment.carrier}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-zw-grey-500">{t.orders.trackingNo}:</span>
              <strong className="font-mono">{order.shipment.trackingNumber}</strong>
              <CopyButton value={order.shipment.trackingNumber.replace(/\s/g, "")} />
            </span>
          </div>
        </Box>
      )}

      <Box title={t.orders.items}>
        <ul className="divide-y divide-zw-grey-100 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-2.5">
              <span>
                <span className="font-semibold">
                  {item.quantity} × {item.productName}
                </span>
                {item.variantLabel && <span className="text-zw-grey-500"> — {item.variantLabel}</span>}
                <span className="block text-xs text-zw-grey-500">{item.sku}</span>
              </span>
              <span className="shrink-0 font-semibold">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-zw-grey-200 pt-3 text-sm">
          <Row label={t.cart.subtotal} value={formatPrice(order.subtotal)} />
          <Row
            label={t.cart.shipping}
            value={order.shipping === 0 ? t.cart.free : formatPrice(order.shipping)}
          />
          {order.installmentFee > 0 && (
            <Row label={t.checkout.installmentFee} value={formatPrice(order.installmentFee)} />
          )}
          <Row label={t.cart.total} value={<strong className="text-base">{formatPrice(order.total)}</strong>} />
        </dl>
      </Box>

      <div className="grid gap-6 md:grid-cols-3">
        <Box title={t.orders.payment}>
          <p className="text-sm text-zw-grey-700">{paymentText}</p>
        </Box>
        <Box title={t.orders.shippingAddress}>
          <p className="text-sm text-zw-grey-700">
            {addressLines(order.shippingAddress).map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </p>
        </Box>
        <Box title={t.orders.invoice}>
          <p className="text-sm text-zw-grey-700">
            {invoiceLines(order).map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </p>
        </Box>
      </div>

      <Box title={t.orders.documents}>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <button type="button" onClick={() => setDoc("preInfo")} className="text-zw-red-700 underline underline-offset-2">
            {t.checkout.preInfo}
          </button>
          <button type="button" onClick={() => setDoc("contract")} className="text-zw-red-700 underline underline-offset-2">
            {t.checkout.contract}
          </button>
        </div>
      </Box>

      <Modal open={doc !== null} onClose={() => setDoc(null)} title={doc ? docTitle(doc) : ""}>
        {doc && <LegalDocument kind={doc} context={orderLegalContext(order, paymentText)} />}
      </Modal>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}

type T = ReturnType<typeof useT>;

function paymentSummary(order: Order, t: T): string {
  const p = order.payment;
  if (p.method === "transfer") return t.orders.transfer;
  const card = t.orders.cardPayment
    .replace("{brand}", p.cardBrand ?? "")
    .replace("{last4}", p.cardLast4 ?? "")
    .trim();
  const plan =
    (p.installments ?? 1) > 1
      ? t.orders.installments.replace("{count}", String(p.installments))
      : t.orders.singlePayment;
  return `${card} · ${plan}`;
}

function invoiceLines(order: Order): string[] {
  const i = order.invoice;
  const who =
    i.type === "corporate"
      ? [i.companyName ?? "", `${i.taxOffice ?? ""} / ${i.taxNumber ?? ""}`]
      : [i.fullName ?? ""];
  return [...who, i.address.line, `${i.address.district} / ${i.address.city}`];
}

function orderLegalContext(order: Order, payment: string): LegalContext {
  const a = order.shippingAddress;
  return {
    buyer: { name: order.customerName, email: order.email, phone: order.phone },
    deliveryAddress: `${a.fullName}, ${a.line}, ${a.district} / ${a.city}`,
    invoice: invoiceLines(order).slice(0, -2).join(" — "),
    items: order.items.map((i) => ({
      name: i.productName,
      variant: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    installmentFee: order.installmentFee,
    total: order.total,
    payment,
    date: order.createdAt,
  };
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[4px] border border-zw-grey-200 p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-zw-grey-600">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zw-grey-600">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
